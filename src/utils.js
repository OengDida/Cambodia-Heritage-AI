export const haversine = (a,b) => {
  const R=6371, rad=x=>x*Math.PI/180
  const dLat=rad(b.lat-a.lat), dLng=rad(b.lng-a.lng)
  const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.sqrt(x))
}
export const fmt = n => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Math.round(n||0))
export const money = (khr, fx) => `៛${fmt(khr)} · $${(khr/fx).toFixed(2)}`
export const nearestOnRoute = (station, route, maxKm=28) => {
  if(!route?.length) return {distance:999, along:0}
  let best={distance:999,along:0}
  let cumulative=0
  for(let i=1;i<route.length;i++){
    const a={lat:route[i-1][1],lng:route[i-1][0]}, b={lat:route[i][1],lng:route[i][0]}
    const seg=haversine(a,b), d=haversine(station,a)
    if(d<best.distance) best={distance:d,along:cumulative}
    cumulative+=seg
  }
  return best.distance<=maxKm?best:{...best,along:99999}
}
