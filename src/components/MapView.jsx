import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

const icon = (color, symbol='') => L.divIcon({
  className:'custom-pin',
  html:`<div style="background:${color};width:25px;height:25px;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 12px #0008;display:grid;place-items:center"><span style="transform:rotate(45deg);font-size:11px;color:#071411;font-weight:900">${symbol}</span></div>`,
  iconSize:[25,25],iconAnchor:[12,24]
})
const icons = {
  origin: icon('#20d69a','A'), destination:icon('#f7b84b','B'),
  ev:icon('#53b7ff','⚡'), gas:icon('#f7b84b','⛽'), hybrid:icon('#b69cff','✦'), warning:icon('#ff647c','!')
}
function FitRoute({route, origin, destination}) {
  const map=useMap()
  useEffect(()=>{
    if(route?.length>1) map.fitBounds(route.map(p=>[p[1],p[0]]),{padding:[55,55]})
    else if(origin&&destination) map.fitBounds([[origin.lat,origin.lng],[destination.lat,destination.lng]],{padding:[55,55]})
  },[route,origin,destination,map])
  return null
}
function ClickCapture({onMapClick}) {
  useMapEvents({click:e=>onMapClick?.({lat:e.latlng.lat,lng:e.latlng.lng})})
  return null
}
export default function MapView({origin,destination,route,stations,filter,onMapClick,rangePoint}) {
  const visible=stations.filter(s=>filter==='all'||(filter==='ev'&&s.type!=='gas_only')||(filter==='gas'&&s.type!=='ev_only')||(filter==='hybrid'&&s.type==='hybrid_hub'))
  return <MapContainer center={[12.15,104.90]} zoom={7} zoomControl={false} scrollWheelZoom className="h-full w-full">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <ClickCapture onMapClick={onMapClick}/><FitRoute route={route} origin={origin} destination={destination}/>
    {route?.length>1&&<><Polyline positions={route.map(p=>[p[1],p[0]])} pathOptions={{color:'#20d69a',weight:9,opacity:.18}}/><Polyline positions={route.map(p=>[p[1],p[0]])} pathOptions={{color:'#20d69a',weight:4,opacity:.95}}/></>}
    {origin&&<Marker position={[origin.lat,origin.lng]} icon={icons.origin}><Popup><b>Origin</b><br/>{origin.name}</Popup></Marker>}
    {destination&&<Marker position={[destination.lat,destination.lng]} icon={icons.destination}><Popup><b>Destination</b><br/>{destination.name}</Popup></Marker>}
    {visible.map(s=><Marker key={s.id} position={[s.lat,s.lng]} icon={s.type==='ev_only'?icons.ev:s.type==='gas_only'?icons.gas:icons.hybrid}>
      <Popup><div className="min-w-40"><b>{s.name}</b><br/>{s.brand} · {s.road}<br/>Hours: {s.hours}<br/>{s.connectors.length?`Connectors: ${s.connectors.join(', ')}`:'Fuel pumps'}<br/><small>Confirm current availability before travel.</small></div></Popup>
    </Marker>)}
    {rangePoint&&<Marker position={[rangePoint.lat,rangePoint.lng]} icon={icons.warning}><Popup><b>Estimated range limit</b><br/>Energy may run low around here.</Popup></Marker>}
  </MapContainer>
}
