export const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
let googleMapsPromise

export function loadGoogleMaps() {
  if (!googleMapsKey) return Promise.reject(new Error('Google Maps API key is not configured'))
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (!googleMapsPromise) googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsKey)}&loading=async&v=weekly`
    script.async = true
    script.onerror = () => reject(new Error('Google Maps could not be loaded'))
    script.onload = () => window.google?.maps?.importLibrary
      ? resolve(window.google.maps)
      : reject(new Error('Google Maps did not initialize'))
    document.head.appendChild(script)
  })
  return googleMapsPromise
}

export async function searchGooglePlaces(query) {
  const maps = await loadGoogleMaps()
  const { Place } = await maps.importLibrary('places')
  const { places = [] } = await Place.searchByText({
    textQuery: `${query} in Cambodia`,
    fields: ['displayName', 'location', 'formattedAddress', 'businessStatus', 'googleMapsURI'],
    language: 'en',
    region: 'kh',
    maxResultCount: 6,
  })
  return places.filter(place => place.location).map(place => ({
    name: place.displayName || 'Google Maps place',
    detail: [place.formattedAddress, place.businessStatus === 'CLOSED_PERMANENTLY' ? 'Permanently closed' : ''].filter(Boolean).join(' · '),
    lat: place.location.lat(),
    lng: place.location.lng(),
    placeId: place.id,
    mapsUrl: place.googleMapsURI,
  }))
}

const distanceKm = (a, b) => {
  const rad = degrees => degrees * Math.PI / 180
  const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0])
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function sampleRoute(coordinates, spacingKm = 40, maxPoints = 40) {
  if (!coordinates?.length) return []
  if (coordinates.length === 1) return [coordinates[0]]
  const lengths = [0]
  for (let i = 1; i < coordinates.length; i++) lengths.push(lengths[i - 1] + distanceKm(coordinates[i - 1], coordinates[i]))
  const total = lengths.at(-1)
  const count = Math.min(maxPoints, Math.max(1, Math.ceil(total / spacingKm)))
  const samples = []
  for (let n = 0; n <= count; n++) {
    const target = total * n / count
    let i = 1
    while (i < lengths.length - 1 && lengths[i] < target) i++
    const segmentLength = lengths[i] - lengths[i - 1]
    const fraction = segmentLength ? (target - lengths[i - 1]) / segmentLength : 0
    const a = coordinates[i - 1], b = coordinates[i]
    samples.push([a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction])
  }
  return samples
}

export async function searchGasStationsAlongRoute(routeCoordinates, onProgress = () => {}) {
  const maps = await loadGoogleMaps()
  const { Place } = await maps.importLibrary('places')
  const samplePoints = sampleRoute(routeCoordinates)
  if (!samplePoints.length) throw new Error('Choose an origin and destination and calculate a route first.')
  const found = new Map()
  let failedAreas = 0
  const batchSize = 3
  for (let start = 0; start < samplePoints.length; start += batchSize) {
    const batch = samplePoints.slice(start, start + batchSize)
    const results = await Promise.allSettled(batch.map(async ([lng, lat]) => {
      const { places = [] } = await Place.searchNearby({
        includedTypes: ['gas_station'],
        locationRestriction: { center: { lat, lng }, radius: 25000 },
        rankPreference: 'DISTANCE', maxResultCount: 20,
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'businessStatus', 'googleMapsURI'],
        language: 'en', region: 'kh',
      })
      return places
    }))
    for (const result of results) {
      if (result.status === 'rejected') { failedAreas++; continue }
      for (const place of result.value) {
        if (!place.id || !place.location) continue
        const lat = place.location.lat(), lng = place.location.lng()
        found.set(place.id, {
          id: place.id, name: place.displayName || 'Gas station',
          detail: place.formattedAddress || '', status: place.businessStatus || '',
          mapsUrl: place.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          lat, lng, type: 'gas_only', brand: '', road: '', hours: 'Check Google Maps', connectors: [],
        })
      }
    }
    onProgress(Math.min(start + batchSize, samplePoints.length), samplePoints.length, found.size)
  }
  return { places: [...found.values()], failedAreas, sampleCount: samplePoints.length }
}
