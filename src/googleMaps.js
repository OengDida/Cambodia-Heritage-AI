export const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
let googleMapsPromise

export function loadGoogleMaps() {
  if (!googleMapsKey) return Promise.reject(new Error('Google Maps API key is not configured'))
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const callbackName = `__smartRouteGoogleMapsCallback_${Date.now()}`
      let settled = false
      let pollTimer
      let timeoutTimer
      const cleanup = () => {
        delete window[callbackName]
        clearInterval(pollTimer)
        clearTimeout(timeoutTimer)
      }
      const complete = () => {
        if (settled) return
        if (window.google?.maps?.importLibrary) {
          settled = true
          cleanup()
          resolve(window.google.maps)
        }
      }
      const fail = message => {
        if (settled) return
        settled = true
        cleanup()
        googleMapsPromise = undefined
        reject(new Error(message))
      }
      window[callbackName] = complete
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsKey)}&loading=async&callback=${callbackName}&v=weekly`
      script.async = true
      script.onerror = () => fail('Google Maps could not be loaded')
      // The callback can run just before Maps publishes importLibrary. Keep
      // checking until it is ready instead of treating that brief race as a
      // permanent load failure.
      script.onload = complete
      pollTimer = setInterval(complete, 25)
      timeoutTimer = setTimeout(() => fail('Google Maps did not initialize'), 15000)
      document.head.appendChild(script)
    }).catch(error => {
      // Let a later call retry after transient network or initialization errors.
      googleMapsPromise = undefined
      throw error
    })
  }
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

function distanceToRouteKm(point, coordinates) {
  if (!coordinates?.length) return Infinity
  if (coordinates.length === 1) return distanceKm([point.lng, point.lat], coordinates[0])
  const kmPerDegree = 111.32
  let closest = Infinity
  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i - 1], b = coordinates[i]
    const meanLat = (a[1] + b[1] + point.lat) / 3
    const xScale = kmPerDegree * Math.cos(meanLat * Math.PI / 180)
    const ax = (a[0] - point.lng) * xScale, ay = (a[1] - point.lat) * kmPerDegree
    const dx = (b[0] - a[0]) * xScale, dy = (b[1] - a[1]) * kmPerDegree
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)))
    closest = Math.min(closest, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return closest
}

function sampleRoute(coordinates, spacingKm = 10, maxPoints = 40) {
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

const GAS_TYPE = 'gas_station'
const EV_TYPE = 'electric_vehicle_charging_station'
// Which Google place types to request for each Station finder category.
// Hybrid hubs need both: a hub is a fuel stop that also has EV charging.
const CATEGORY_TYPES = {
  all: [GAS_TYPE, EV_TYPE],
  gas: [GAS_TYPE],
  ev: [EV_TYPE],
  hybrid: [GAS_TYPE, EV_TYPE],
}
const HUB_RADIUS_KM = 0.3
const ROUTE_CORRIDOR_KM = 0.5

const kmBetween = (a, b) => distanceKm([a.lng, a.lat], [b.lng, b.lat])

function classify(place) {
  const types = new Set([place.primaryType, ...(place.types || [])].filter(Boolean))
  const gas = types.has(GAS_TYPE), ev = types.has(EV_TYPE)
  return gas && ev ? 'hybrid_hub' : ev ? 'ev_only' : 'gas_only'
}

// A fuel station and a charger within ~300 m of each other are treated as one hybrid hub.
function markHybridHubs(list) {
  const gas = list.filter(p => p.type === 'gas_only')
  const ev = list.filter(p => p.type === 'ev_only')
  for (const g of gas) for (const e of ev) {
    if (kmBetween(g, e) <= HUB_RADIUS_KM) { g.type = 'hybrid_hub'; e.type = 'hybrid_hub' }
  }
}

export async function searchStationsAlongRoute(routeCoordinates, category = 'all', onProgress = () => {}) {
  const includedTypes = CATEGORY_TYPES[category] || CATEGORY_TYPES.all
  const maps = await loadGoogleMaps()
  const { Place } = await maps.importLibrary('places')
  const samplePoints = sampleRoute(routeCoordinates)
  if (!samplePoints.length) throw new Error('Choose an origin and destination and calculate a route first.')
  const found = new Map()
  let failedAreas = 0
  let firstAreaError = ''
  const batchSize = 3
  for (let start = 0; start < samplePoints.length; start += batchSize) {
    const batch = samplePoints.slice(start, start + batchSize)
    const results = await Promise.allSettled(batch.map(async ([lng, lat]) => {
      const { places = [] } = await Place.searchNearby({
        includedTypes,
        locationRestriction: { center: { lat, lng }, radius: 10000 },
        rankPreference: 'DISTANCE', maxResultCount: 20,
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'businessStatus', 'googleMapsURI', 'types', 'primaryType'],
        language: 'en', region: 'kh',
      })
      return places
    }))
    for (const result of results) {
      if (result.status === 'rejected') {
        failedAreas++
        firstAreaError ||= result.reason?.message || String(result.reason || 'Unknown Google Places error')
        continue
      }
      for (const place of result.value) {
        if (!place.id || !place.location) continue
        const lat = place.location.lat(), lng = place.location.lng()
        const type = classify(place)
        found.set(place.id, {
          id: place.id, name: place.displayName || (type === 'ev_only' ? 'EV charger' : 'Station'),
          detail: place.formattedAddress || '', status: place.businessStatus || '',
          mapsUrl: place.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          lat, lng, type, brand: '', road: '', hours: 'Check Google Maps', connectors: [],
        })
      }
    }
    onProgress(Math.min(start + batchSize, samplePoints.length), samplePoints.length, found.size)
  }
  if (failedAreas === samplePoints.length) throw new Error(`All Google Places route searches failed: ${firstAreaError}`)
  const places = [...found.values()].filter(place => distanceToRouteKm(place, routeCoordinates) <= ROUTE_CORRIDOR_KM)
  markHybridHubs(places)
  return { places, failedAreas, sampleCount: samplePoints.length, error: firstAreaError }
}

// Backwards-compatible alias.
export const searchGasStationsAlongRoute = (route, onProgress) => searchStationsAlongRoute(route, 'gas', onProgress)
