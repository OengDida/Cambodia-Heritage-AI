import { useEffect, useRef, useState } from 'react'
import { googleMapsKey, loadGoogleMaps } from '../googleMaps'

export default function MapView({ origin, destination, route, onMapClick, rangePoint }) {
  const host = useRef(null)
  const map = useRef(null)
  const clickRef = useRef(onMapClick)
  const [status, setStatus] = useState(googleMapsKey ? 'loading' : 'missing-key')
  const [loadError, setLoadError] = useState('')
  useEffect(() => { clickRef.current = onMapClick }, [onMapClick])

  useEffect(() => {
    if (!googleMapsKey || !host.current) return
    let alive = true
    let instance
    const authFailure = () => {
      if (alive) {
        setLoadError('Google rejected the API key. Check that it is valid, billing is enabled, and Maps JavaScript API is allowed for this key and localhost referrer.')
        setStatus('error')
      }
    }
    window.gm_authFailure = authFailure
    loadGoogleMaps().then(async maps => {
      if (!alive) return
      const { Map } = await maps.importLibrary('maps')
      if (!alive) return
      instance = new Map(host.current, {
        center: { lat: 12.15, lng: 104.90 }, zoom: 7,
        mapTypeControl: true, streetViewControl: false, fullscreenControl: true,
        clickableIcons: true,
        styles: [
          { featureType: 'transit.station.bus', stylers: [{ visibility: 'off' }] },
        ],
      })
      instance.addListener('click', event => {
        if (event.latLng) clickRef.current?.({ lat: event.latLng.lat(), lng: event.latLng.lng() })
      })
      map.current = instance
      setStatus('ready')
    }).catch(error => {
      if (alive) {
        setLoadError(error?.message || 'Google Maps JavaScript API could not be loaded. Check the browser console for Google Maps authorization errors.')
        setStatus('error')
      }
    })
    return () => { alive = false; map.current = null; if (window.gm_authFailure === authFailure) delete window.gm_authFailure }
  }, [])

  useEffect(() => {
    const instance = map.current
    const maps = window.google?.maps
    if (status !== 'ready' || !instance || !maps) return
    const markers = []
    let line
    const addPin = (point, title, color, label) => {
      if (!point) return
      markers.push(new maps.Marker({
        map: instance, position: { lat: point.lat, lng: point.lng }, title,
        label: { text: label, color: '#071411', fontWeight: '700', fontSize: '11px' },
        icon: { path: maps.SymbolPath.CIRCLE, scale: 10, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      }))
    }
    addPin(origin, `Origin: ${origin?.name || ''}`, '#20d69a', 'A')
    addPin(destination, `Destination: ${destination?.name || ''}`, '#f7b84b', 'B')
    addPin(rangePoint, 'Estimated range limit', '#ff647c', '!')
    if (route?.length > 1) line = new maps.Polyline({
      map: instance,
      path: route.map(([lng, lat]) => ({ lat, lng })),
      geodesic: true,
      strokeColor: '#20d69a', strokeOpacity: 0.9, strokeWeight: 5,
    })
    const points = [origin, destination].filter(Boolean)
    if (points.length === 2) {
      const bounds = new maps.LatLngBounds()
      points.forEach(point => bounds.extend({ lat: point.lat, lng: point.lng }))
      instance.fitBounds(bounds, { left: 430, right: 320, top: 90, bottom: 80 })
    } else if (points.length === 1) instance.panTo({ lat: points[0].lat, lng: points[0].lng })
    return () => { markers.forEach(marker => marker.setMap(null)); line?.setMap(null) }
  }, [origin, destination, route, rangePoint, status])

  return <div className="google-map relative h-full w-full">
    <div ref={host} className="h-full w-full" />
    {status !== 'ready' && <div className="absolute inset-0 grid place-items-center bg-slate-900/95 p-6 text-center text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-ink/95 p-6 shadow-xl">
        <div className="text-lg font-bold">{status === 'missing-key' ? 'Google Maps API key required' : status === 'error' ? 'Google Maps failed to load' : 'Loading Google Maps…'}</div>
        {status === 'missing-key' && <p className="mt-3 text-sm leading-6 text-slate-300">Enable Maps JavaScript API and Places API (New) in Google Cloud, then add <code className="text-emeraldx">VITE_GOOGLE_MAPS_API_KEY=your_key</code> to <code className="text-emeraldx">.env.local</code> and restart Vite. Billing is required. On Vercel, add the same variable under Project Settings, Environment Variables and redeploy; restrict the key to your domain and these APIs.</p>}
        {status === 'error' && <p className="mt-3 text-sm leading-6 text-slate-300">{loadError || 'Check the API key, HTTP referrer restrictions, enabled APIs, billing, and network connection.'}</p>}
      </div>
    </div>}
  </div>
}
