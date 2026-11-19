import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, BatteryCharging, Bike, CarFront, Check, ChevronDown, CircleDollarSign, Clock3, Fuel, Gauge, Info, LocateFixed, Leaf, MapPin, Navigation, PlugZap, Route, Settings2, ShieldAlert, Sparkles, Truck, Zap } from 'lucide-react'
import MapView from './components/MapView'
import { vehicleGroups } from './data/vehicles'
import { provinces, stations } from './data/places'
import { defaultRates } from './data/rates'
import { fmt, haversine, money, nearestOnRoute } from './utils'

const cx=(...x)=>x.filter(Boolean).join(' ')
const fmtTime=m=>`${Math.floor(m/60)}h ${Math.round(m%60)}m`
const categoryIcons={ev:Zap,hybrid:Leaf,gasoline:CarFront,diesel:Truck,motorbike:Bike}
const kmLine=(a,b)=>haversine(a,b)
function Panel({children,className=''}){return <div className={cx('glass rounded-2xl border border-white/10 shadow-2xl',className)}>{children}</div>}
function Pill({children,active,onClick}){return <button onClick={onClick} className={cx('rounded-full px-3 py-2 text-xs font-semibold transition',active?'bg-emeraldx text-ink':'bg-white/5 text-slate-300 hover:bg-white/10')}>{children}</button>}
function Field({label,children}){return <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>}
function Select({value,onChange,children}){return <div className="relative"><select value={value} onChange={e=>onChange(e.target.value)} className="field w-full appearance-none pr-9">{children}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-slate-400"/></div>}
function Welcome({onStart}){return <main className="welcome min-h-screen overflow-hidden px-5 text-white">
  <div className="absolute inset-0 bg-grid opacity-30"/>
  <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col">
    <header className="flex items-center gap-3 py-7"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-11 w-11 object-contain [filter:drop-shadow(0_0_12px_rgba(32,214,154,0.35))]"/><div><div className="text-xl font-black tracking-tight">SmartRoute <span className="text-emeraldx">AI</span></div><div className="text-[10px] uppercase tracking-[.24em] text-slate-500">Cambodia mobility intelligence</div></div></header>
    <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_.95fr]">
      <div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emeraldx/25 bg-emeraldx/10 px-4 py-2 text-xs font-semibold text-emeraldx"><Sparkles size={14}/> Built for Cambodia's highways</div>
        <h1 className="text-5xl font-black leading-[1.06] tracking-tight sm:text-7xl">Every kilometre.<br/><span className="text-emeraldx">Smarter.</span></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">AI-Powered Multi-Fuel Highway & Range Planner for Cambodia. Prevent dead-zones, find EV chargers & gas pumps, and optimize trip costs in KHR & USD.</p>
        <div className="mt-9 flex flex-wrap gap-3"><button onClick={onStart} className="flex items-center gap-3 rounded-xl bg-emeraldx px-6 py-4 font-extrabold text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-emerald-300">Launch SmartRoute AI <ArrowRight size={18}/></button><div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400"><ShieldAlert size={16} className="text-amberx"/> Plan ahead. Arrive prepared.</div></div>
        <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6"><div><div className="text-2xl font-black">25+</div><div className="text-xs text-slate-500">Station pins</div></div><div><div className="text-2xl font-black">5</div><div className="text-xs text-slate-500">Powertrains</div></div><div><div className="text-2xl font-black">៛ / $</div><div className="text-xs text-slate-500">Dual currency</div></div></div>
      </div>
      <div className="relative hidden lg:block"><div className="absolute -inset-10 rounded-full bg-emeraldx/10 blur-3xl"/><div className="relative rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><span className="text-sm font-bold">Live route preview</span><span className="rounded-full bg-emeraldx/10 px-3 py-1 text-[10px] font-bold text-emeraldx">CAMBODIA</span></div>
        <div className="map-art relative h-[390px] overflow-hidden rounded-2xl border border-white/10"><svg viewBox="0 0 500 390" className="h-full w-full"><path d="M40 70 C130 120 110 170 180 195 S260 235 270 315 S370 340 440 280" fill="none" stroke="#20d69a" strokeWidth="5" strokeDasharray="2 10" strokeLinecap="round"/><path d="M15 290 C120 245 160 280 220 210 S350 120 480 145" fill="none" stroke="#334d46" strokeWidth="2"/><path d="M60 40 L440 350 M30 200 L470 60 M120 0 L390 390" stroke="#203a32" strokeWidth="1"/><circle cx="40" cy="70" r="10" fill="#20d69a"/><circle cx="440" cy="280" r="10" fill="#f7b84b"/><circle cx="260" cy="230" r="7" fill="#53b7ff"/><circle cx="270" cy="315" r="7" fill="#b69cff"/></svg><div className="absolute left-5 top-5 rounded-xl border border-white/10 bg-ink/80 px-3 py-2 text-xs"><div className="font-bold">Phnom Penh</div><div className="text-slate-400">Origin</div></div><div className="absolute bottom-5 right-5 rounded-xl border border-white/10 bg-ink/80 px-3 py-2 text-xs"><div className="font-bold">Siem Reap</div><div className="text-slate-400">Destination</div></div><div className="absolute bottom-5 left-5 rounded-xl bg-blue-400/15 px-3 py-2 text-xs text-blue-200">⚡ Charging stop</div></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/5 p-3"><Route size={16} className="mx-auto mb-2 text-emeraldx"/><b className="text-sm">Route</b><p className="text-[10px] text-slate-500">OSRM powered</p></div><div className="rounded-xl bg-white/5 p-3"><BatteryCharging size={16} className="mx-auto mb-2 text-blue-300"/><b className="text-sm">Range</b><p className="text-[10px] text-slate-500">Dead-zone alerts</p></div><div className="rounded-xl bg-white/5 p-3"><CircleDollarSign size={16} className="mx-auto mb-2 text-amberx"/><b className="text-sm">Cost</b><p className="text-[10px] text-slate-500">KHR + USD</p></div></div>
      </div></div>
    </section>
    <footer className="flex flex-wrap justify-between gap-3 border-t border-white/10 py-5 text-[11px] text-slate-500"><span>SmartRoute AI · Cambodia trip intelligence</span><span>OpenStreetMap · OSRM · Local reference data</span></footer>
  </div>
</main>}
function Setup({onBack,onGenerate,config,setConfig}) {
  const group=vehicleGroups.find(g=>g.id===config.category)
  const selected=group?.items.find(v=>v.id===config.model) || group?.items[0]
  const set=(key,value)=>setConfig(p=>({...p,[key]:value}))
  useEffect(()=>{if(!config.modified&&selected)setConfig(p=>({...p,energy:selected.energy,capacity:selected.capacity,consumption:selected.consumption,model:selected.id}))},[config.category,config.model,config.modified])
  const Icon=categoryIcons[config.category]||CarFront
  return <div className="min-h-screen bg-ink px-4 py-6 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <button onClick={onBack} className="mb-7 flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back</button>
    <div className="mb-8"><div className="text-xs font-bold uppercase tracking-[.2em] text-emeraldx">Step 02 / Vehicle profile</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">What are you driving?</h1><p className="mt-2 text-slate-400">We'll use your vehicle's real-world efficiency to estimate range and trip costs.</p></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Panel className="p-5 sm:p-7"><h2 className="mb-4 font-bold">2A. Select powertrain</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{vehicleGroups.map(g=>{const I=categoryIcons[g.id];return <button key={g.id} onClick={()=>setConfig(p=>({...p,category:g.id,model:g.items[0].id,energy:g.items[0].energy,capacity:g.items[0].capacity,consumption:g.items[0].consumption}))} className={cx('rounded-xl border p-4 text-left transition',config.category===g.id?'border-emeraldx bg-emeraldx/10 shadow-glow':'border-white/10 bg-white/[.025] hover:bg-white/5')}><I size={22} className={config.category===g.id?'text-emeraldx':'text-slate-400'}/><div className="mt-3 text-sm font-bold">{g.label}</div><div className="mt-1 text-[11px] text-slate-500">{g.items.length} presets</div></button>})}</div>
      <div className="my-7 border-t border-white/10"/>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">2B. Vehicle configuration</h2><div className="flex rounded-xl bg-black/20 p-1"><button onClick={()=>set('modified',false)} className={cx('rounded-lg px-4 py-2 text-xs font-bold',!config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Stock</button><button onClick={()=>set('modified',true)} className={cx('rounded-lg px-4 py-2 text-xs font-bold',config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Modified</button></div></div>
      {!config.modified?<div className="mt-5 space-y-4"><Field label="Choose your vehicle"><Select value={config.model} onChange={v=>{const item=group.items.find(x=>x.id===v);setConfig(p=>({...p,model:v,energy:item.energy,capacity:item.capacity,consumption:item.consumption}))}}>{group.items.map(v=><option value={v.id} key={v.id}>{v.name} — {v.note}</option>)}</Select></Field><div className="rounded-xl border border-emeraldx/15 bg-emeraldx/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-emeraldx"><Icon size={17}/>{selected?.name}</div><div className="mt-3 grid grid-cols-2 gap-3"><div><div className="text-[10px] uppercase text-slate-500">Capacity</div><b>{config.capacity} {config.energy==='electric'?'kWh':'L'}</b></div><div><div className="text-[10px] uppercase text-slate-500">Consumption</div><b>{config.consumption} {config.energy==='electric'?'kWh':'L'}/100km</b></div></div></div></div>
      :<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Fuel / energy type"><Select value={config.energy} onChange={v=>set('energy',v)}><option value="gasoline">Regular gasoline 92</option><option value="diesel">Diesel</option><option value="electric">Electric (kWh)</option></Select></Field><Field label={`Consumption (${config.energy==='electric'?'kWh':'L'}/100km)`}><input className="field w-full" type="number" min="0.1" step=".1" value={config.consumption} onChange={e=>set('consumption',Number(e.target.value))}/></Field><Field label={`Tank / battery capacity (${config.energy==='electric'?'kWh':'L'})`}><input className="field w-full" type="number" min="1" step=".1" value={config.capacity} onChange={e=>set('capacity',Number(e.target.value))}/></Field><Field label="Custom vehicle name"><input className="field w-full" value={config.customName} onChange={e=>set('customName',e.target.value)} placeholder="e.g. My modified pickup"/></Field></div>}
      <div className="mt-7 rounded-xl bg-black/20 p-4"><div className="flex items-center justify-between"><label className="text-sm font-bold">Current {config.energy==='electric'?'battery':'fuel'} level</label><span className="text-xl font-black text-emeraldx">{config.level}%</span></div><input type="range" min="5" max="100" step="1" value={config.level} onChange={e=>set('level',Number(e.target.value))} className="mt-4 w-full accent-emerald-400"/><div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Nearly empty</span><span>Full tank</span></div></div>
      <button onClick={onGenerate} disabled={!config.capacity||!config.consumption||config.capacity<=0||config.consumption<=0} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-4 font-extrabold text-ink transition hover:bg-emerald-300 disabled:opacity-40">Generate Map & Route <ArrowRight size={18}/></button>
      </Panel>
      <div className="space-y-4"><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-emeraldx"><Gauge size={18}/><b>Range snapshot</b></div><div className="text-4xl font-black">{Math.round(config.capacity*config.level/100/(config.consumption/100))}<span className="ml-1 text-base font-semibold text-slate-400">km</span></div><p className="mt-2 text-xs leading-5 text-slate-400">Estimated remaining range at {config.level}% based on the entered consumption rate. Actual range varies with speed, load, terrain and weather.</p></Panel><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-amberx"><Info size={18}/><b>Before you hit the road</b></div><ul className="space-y-3 text-xs leading-5 text-slate-400"><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Verify your actual fuel or battery capacity.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Keep a safety buffer for traffic and detours.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Check station status before relying on a charger.</li></ul></Panel><div className="rounded-xl border border-white/10 p-4 text-xs leading-5 text-slate-500">Demo defaults are estimates, not certified manufacturer test figures. You can customize your consumption and rates later.</div></div>
    </div></div></div>
}
function TripPlanner({config,onChangeVehicle}) {
  const [originName,setOriginName]=useState('Phnom Penh')
  const [destinationName,setDestinationName]=useState('Siem Reap')
  const [origin,setOrigin]=useState(provinces[0])
  const [destination,setDestination]=useState(provinces[1])
  const [route,setRoute]=useState([])
  const [distance,setDistance]=useState(0)
  const [duration,setDuration]=useState(0)
  const [routeStatus,setRouteStatus]=useState('Choose your endpoints')
  const [filter,setFilter]=useState('all')
  const [rates,setRates]=useState(defaultRates)
  const [showRates,setShowRates]=useState(false)
  const [prompt,setPrompt]=useState('')
  const [mapClickMode,setMapClickMode]=useState('origin')
  const [routeError,setRouteError]=useState(false)
  const [showStations,setShowStations]=useState(false)
  const [locating,setLocating]=useState(false)
  const [locNote,setLocNote]=useState('')
  const vehicleName=config.modified?(config.customName||'Custom vehicle'):(vehicleGroups.find(g=>g.id===config.category)?.items.find(v=>v.id===config.model)?.name||'Vehicle')
  const isEV=config.energy==='electric'
  const consumption=config.consumption||1
  const currentRange=config.capacity*(config.level/100)/(consumption/100)
  const rangePoint=useMemo(()=>{
    if(!route.length||distance<=currentRange)return null
    const fraction=Math.min(.98,currentRange/distance)
    const index=Math.max(0,Math.min(route.length-1,Math.floor(fraction*(route.length-1))))
    const p=route[index]
    return p?{lat:p[1],lng:p[0]}:null
  },[route,distance,currentRange])
  const alongStations=useMemo(()=>stations.map(s=>({...s,routeMeta:nearestOnRoute(s,route)})).filter(s=>s.routeMeta.along<distance+1).sort((a,b)=>a.routeMeta.along-b.routeMeta.along),[route,distance])
  const suitable=alongStations.filter(s=>isEV?s.type!=='gas_only':s.type!=='ev_only')
  const recommended=suitable.filter(s=>s.routeMeta.along>0&&s.routeMeta.along<Math.min(distance,currentRange*0.85+15)).slice(0,3)
  const need=distance*consumption/100
  const costRate=isEV?rates.ev:config.energy==='diesel'?rates.diesel:rates.gasoline
  const totalCost=need*costRate
  const gasCost=distance*6.8/100*rates.gasoline
  const evCost=distance*14.4/100*rates.ev
  const save=Math.abs(gasCost-evCost)
  const lowRange=distance>currentRange
  const routePoints=route.length?route:[]
  const calculate=async(a=origin,b=destination)=>{
    if(!a||!b)return
    setRouteStatus('Calculating route…');setRouteError(false)
    try{
      const url=`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`
      const res=await fetch(url)
      if(!res.ok)throw new Error('OSRM unavailable')
      const data=await res.json()
      if(data.code!=='Ok'||!data.routes?.length)throw new Error('No route')
      const r=data.routes[0]
      setRoute(r.geometry.coordinates);setDistance(r.distance/1000);setDuration(r.duration/60);setRouteStatus('OSRM driving route');setRouteError(false)
    }catch{
      const d=kmLine(a,b)*1.22
      setRoute([[a.lng,a.lat],[b.lng,b.lat]]);setDistance(d);setDuration(d/65*60);setRouteStatus('Straight-line estimate · OSRM unavailable');setRouteError(true)
    }
  }
  useEffect(()=>{calculate(origin,destination)},[])
  const updateOrigin=name=>{const p=provinces.find(x=>x.name===name);if(p){setOriginName(name);setOrigin(p);calculate(p,destination)}}
  const updateDestination=name=>{const p=provinces.find(x=>x.name===name);if(p){setDestinationName(name);setDestination(p);calculate(origin,p)}}
  const handleMapClick=p=>{
    const nearest=provinces.map(x=>({...x,d:kmLine(x,p)})).sort((a,b)=>a.d-b.d)[0]
    const pin={lat:p.lat,lng:p.lng,name:`Map pin near ${nearest.name}`}
    if(mapClickMode==='origin'){setOrigin(pin);setOriginName('Custom map pin');calculate(pin,destination);setMapClickMode('destination')}
    else {setDestination(pin);setDestinationName('Custom map pin');calculate(origin,pin)}
  }
  const useCurrentLocation=()=>{
    if(!('geolocation' in navigator)){setLocNote('Location is not supported by this browser.');return}
    setLocating(true);setLocNote('')
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const {latitude:lat,longitude:lng}=pos.coords
        const nearest=provinces.map(x=>({...x,d:kmLine(x,{lat,lng})})).sort((a,b)=>a.d-b.d)[0]
        const inCambodia=lat>=9.9&&lat<=14.8&&lng>=102.2&&lng<=107.8
        const pin={lat,lng,name:`Current location (near ${nearest.name})`}
        setOrigin(pin);setOriginName('Current location');setMapClickMode('destination')
        setLocNote(inCambodia?`Origin set to your location, near ${nearest.name}.`:'Your location appears to be outside Cambodia. Routes and stations may not be useful.')
        setLocating(false)
        calculate(pin,destination)
      },
      err=>{
        setLocating(false)
        setLocNote(err.code===1?'Location permission denied. Allow location access in your browser settings and try again.':err.code===2?'Your location could not be determined. Try again or pick an origin manually.':'Location request timed out. Try again or pick an origin manually.')
      },
      {enableHighAccuracy:true,timeout:10000,maximumAge:60000}
    )
  }
  const recommendation=()=>{
    if(lowRange){
      const stop=recommended[0]
      return stop?`${vehicleName} has approximately ${Math.round(currentRange)} km of range at ${config.level}% and the destination is ${Math.round(distance-currentRange)} km beyond that. Plan a stop at ${stop.name} (${stop.road}) before reaching the estimated range limit. Confirm the connector and live availability before departure.`:`Your estimated range (${Math.round(currentRange)} km) is shorter than this ${Math.round(distance)} km trip. No compatible station pin was found close to the displayed route corridor. Add a safety stop and verify local options before leaving.`
    }
    return `${vehicleName} has an estimated ${Math.round(currentRange-distance)} km of range remaining on arrival. The current ${Math.round(distance)} km route appears achievable without a planned refuel stop, assuming the entered efficiency and normal conditions. Keep a reserve for detours.`
  }
  const chips=['Compare EV vs Gas cost','Find 24/7 stops only','Eco-driving tip']
  const chipAction=t=>{setPrompt(t);if(t==='Find 24/7 stops only')setShowStations(true)}
  return <div className="relative h-screen min-h-[720px] w-full overflow-hidden bg-slate-950 text-white">
    <div className="absolute inset-0"><MapView origin={origin} destination={destination} route={routePoints} stations={stations} filter={filter} onMapClick={handleMapClick} rangePoint={rangePoint}/></div>
    <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-r from-ink/35 via-transparent to-transparent"/>
    <div className="pointer-events-none absolute left-4 top-4 z-[500] flex items-center gap-2"><button onClick={onChangeVehicle} aria-label="Back to vehicle profile" className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 text-xs font-bold shadow-xl backdrop-blur transition hover:border-emeraldx/50 hover:text-emeraldx"><ArrowLeft size={16}/> Back</button><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 py-2 shadow-xl backdrop-blur"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-8 w-8 object-contain"/><div><div className="text-sm font-black">SmartRoute <span className="text-emeraldx">AI</span></div><div className="text-[9px] uppercase tracking-widest text-slate-500">Cambodia trip planner</div></div></div></div>
    <div className="pointer-events-none absolute right-4 top-4 z-[500] flex gap-2"><button onClick={onChangeVehicle} className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 py-2 text-xs font-bold shadow-xl backdrop-blur hover:border-emeraldx/50"><Settings2 size={15}/> Change vehicle</button></div>
    <div className="absolute bottom-4 left-4 right-4 top-[76px] z-[500] flex items-start justify-between gap-4 pointer-events-none">
      <div className="pointer-events-auto flex max-h-full w-full max-w-[390px] flex-col gap-3 overflow-y-auto pr-1">
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="text-sm font-extrabold">Plan your journey</div><span className="rounded-full bg-emeraldx/10 px-2 py-1 text-[9px] font-bold uppercase text-emeraldx">Step 03 / Route</span></div>
          <Field label="Origin"><Select value={provinces.some(p=>p.name===originName)||originName==='Current location'?originName:''} onChange={updateOrigin}><option value="" disabled>Choose origin</option>{originName==='Current location'&&<option value="Current location" disabled>Current location</option>}{provinces.map(p=><option key={p.name}>{p.name}</option>)}</Select></Field>
          <button onClick={useCurrentLocation} disabled={locating} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emeraldx/30 bg-emeraldx/5 py-2.5 text-xs font-bold text-emeraldx transition hover:bg-emeraldx/10 disabled:opacity-60"><LocateFixed size={15} className={locating?'animate-pulse':''}/>{locating?'Locating…':'Use current location'}</button>
          {locNote&&<div className="mt-2 text-[10px] leading-4 text-slate-400">{locNote}</div>}
          <div className="my-2 flex items-center justify-between"><span className="text-[10px] text-slate-500">Tap map to set a pin</span><button onClick={()=>setMapClickMode(x=>x==='origin'?'destination':'origin')} className="text-[10px] font-bold text-emeraldx">Pin next: {mapClickMode}</button></div>
          <Field label="Destination"><Select value={provinces.some(p=>p.name===destinationName)?destinationName:''} onChange={updateDestination}><option value="" disabled>Choose destination</option>{provinces.map(p=><option key={p.name}>{p.name}</option>)}</Select></Field>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 p-3"><div><div className="text-[10px] uppercase text-slate-500">Vehicle</div><div className="mt-1 text-xs font-bold">{vehicleName}</div></div><div className="text-right"><div className="text-[10px] uppercase text-slate-500">Current level</div><div className="mt-1 text-sm font-black text-emeraldx">{config.level}%</div></div></div>
          <button onClick={()=>calculate()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-3 text-xs font-extrabold text-ink hover:bg-emerald-300"><Navigation size={15}/> Recalculate route</button>
          <div className="mt-2 text-center text-[10px] text-slate-500">{routeStatus}</div>
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-emeraldx"/><div className="text-sm font-extrabold">SmartRoute AI Co-Pilot</div><span className="ml-auto rounded-full bg-emeraldx/10 px-2 py-1 text-[9px] font-bold text-emeraldx">RULE-BASED</span></div>
          <p className="text-xs leading-5 text-slate-300">{recommendation()}</p>
          {lowRange&&<div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-[11px] leading-4 text-rose-200"><ShieldAlert size={16} className="shrink-0"/> Range warning: estimated range is shorter than the trip. Do not depart without a confirmed stop.</div>}
          <div className="mt-3 flex flex-wrap gap-2">{chips.map(c=><button key={c} onClick={()=>chipAction(c)} className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-300 hover:border-emeraldx/40 hover:text-emeraldx">{c}</button>)}</div>
          {prompt&&<div className="mt-3 rounded-lg bg-white/5 p-3 text-[11px] leading-5 text-slate-300">{prompt==='Compare EV vs Gas cost'?`For this distance, illustrative EV cost is ${money(evCost,rates.usdToKhr)} versus gasoline at ${money(gasCost,rates.usdToKhr)}. Estimated difference: ${money(save,rates.usdToKhr)}.`:prompt==='Find 24/7 stops only'?'Station list opened below. Filter for compatible fuel or connectors and confirm the location before travel.':'Eco tip: maintain a steady highway speed, avoid hard acceleration, check tyre pressure and reduce unnecessary cargo.'}</div>}
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><CircleDollarSign size={16} className="text-amberx"/> Trip cost estimate</div><button onClick={()=>setShowRates(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showRates?'Close':'Edit rates'}</button></div>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Distance</div><div className="mt-1 text-lg font-black">{fmt(distance)} <small className="text-xs text-slate-400">km</small></div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Drive time</div><div className="mt-1 text-lg font-black">{fmtTime(duration)}</div></div></div>
          <div className="mt-2 rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Estimated {isEV?'energy':'fuel'} required</span><span>{isEV?'kWh':'L'}</span></div><div className="mt-1 text-xl font-black">{need.toFixed(1)} <small className="text-xs font-medium text-slate-400">{isEV?'kWh':'L'}</small></div></div>
          <div className="mt-2 flex items-end justify-between rounded-xl border border-amberx/20 bg-amberx/5 p-3"><div><div className="text-[10px] text-amberx/80">Estimated trip cost</div><div className="mt-1 text-xl font-black">{money(totalCost,rates.usdToKhr).split(' · ')[0]}</div><div className="text-xs text-slate-400">{money(totalCost,rates.usdToKhr).split(' · ')[1]}</div></div><div className="text-right text-[10px] text-slate-500">{isEV?'DC fast-charge tariff':config.energy==='diesel'?'Diesel tariff':'Gasoline tariff'}<br/>{fmt(costRate)} ៛ / {isEV?'kWh':'L'}</div></div>
          <div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-slate-400">EV vs gasoline benchmark</span><span className="font-bold text-emeraldx">{evCost<=gasCost?'EV saves':'Gas saves'} {money(save,rates.usdToKhr)}</span></div>
          {showRates&&<div className="mt-4 space-y-3 border-t border-white/10 pt-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Editable reference tariffs (KHR)</div>{[['gasoline','Regular gasoline / L'],['diesel','Diesel / L'],['ev','EV DC fast charge / kWh'],['usdToKhr','USD → KHR']].map(([k,l])=><label key={k} className="flex items-center justify-between gap-3 text-[11px] text-slate-400">{l}<input className="field w-28 py-2 text-right" type="number" value={rates[k]} onChange={e=>setRates(p=>({...p,[k]:Number(e.target.value)}))}/></label>)}<div className="text-[9px] leading-4 text-slate-500">Fuel schedule reference: 11–21 Nov 2026. EV DC rate reference: effective 1 Oct 2025. Edit to match the current pump or charger price.</div></div>}
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><MapPin size={16} className="text-emeraldx"/> Station finder</div><button onClick={()=>setShowStations(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showStations?'Hide list':'View stations'}</button></div>
          <div className="flex flex-wrap gap-1.5">{[['all','All Stations'],['ev','EV Chargers'],['gas','Gas Pumps'],['hybrid','Hybrid Hubs']].map(([id,l])=><Pill key={id} active={filter===id} onClick={()=>setFilter(id)}>{l}</Pill>)}</div>
          {showStations&&<div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{alongStations.filter(s=>filter==='all'||(filter==='ev'&&s.type!=='gas_only')||(filter==='gas'&&s.type!=='ev_only')||(filter==='hybrid'&&s.type==='hybrid_hub')).map(s=><div key={s.id} className="rounded-lg bg-black/20 p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">{s.name}</b><span className="text-[9px] text-emeraldx">{s.road}</span></div><div className="mt-1 text-[10px] text-slate-500">{s.brand} · {s.hours} · {s.connectors.join(', ')||'Fuel'}</div></div>)}</div>}
          <div className="mt-3 text-[9px] leading-4 text-slate-500">Map pins are a mix of public EV-map references and illustrative fuel-hub points. Corridor distance is approximate; verify location, hours, connector and live availability before relying on a stop.</div>
        </Panel>
      </div>
      <div className="pointer-events-auto hidden w-[290px] flex-col gap-3 lg:flex">
        <Panel className="p-4"><div className="text-xs font-extrabold">Route overview</div><div className="mt-3 flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emeraldx"/><div className="text-xs font-semibold">{origin.name}</div></div><div className="ml-1 my-1 h-5 border-l border-dashed border-slate-600"/><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amberx"/><div className="text-xs font-semibold">{destination.name}</div></div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><div><div className="text-[10px] text-slate-500">Distance</div><b>{fmt(distance)} km</b></div><div><div className="text-[10px] text-slate-500">ETA</div><b>{fmtTime(duration)}</b></div></div></Panel>
        <Panel className="p-4"><div className="mb-3 flex items-center gap-2 text-xs font-extrabold"><Activity size={15} className="text-emeraldx"/> Range & dead-zone monitor</div><div className="flex items-end justify-between"><span className="text-[10px] text-slate-500">Estimated remaining range</span><b className={lowRange?'text-rose-300':'text-emeraldx'}>{fmt(currentRange)} km</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className={cx('h-full rounded-full',lowRange?'bg-rose-400':'bg-emeraldx')} style={{width:`${Math.min(100,distance/currentRange*100)}%`}}/></div><div className="mt-2 text-[10px] leading-4 text-slate-400">{lowRange?'Range limit falls before destination.':'Estimated range covers the route.'}</div></Panel>
        <Panel className="p-4"><div className="mb-3 text-xs font-extrabold">Pit-stop itinerary</div><div className="space-y-3"><div className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-emeraldx"/><div><b className="text-xs">{origin.name}</b><div className="text-[10px] text-slate-500">Start journey</div></div></div>{recommended.map(s=><div key={s.id} className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-300"/><div><b className="text-xs">{s.name}</b><div className="text-[10px] text-slate-500">Approx. route progress · {s.road}</div></div></div>)}{lowRange&&!recommended.length&&<div className="rounded-lg bg-rose-400/10 p-2 text-[10px] text-rose-200">No compatible stop confidently identified. Plan an alternate stop.</div>}<div className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-amberx"/><div><b className="text-xs">{destination.name}</b><div className="text-[10px] text-slate-500">Destination</div></div></div></div></Panel>
        <div className="rounded-xl border border-white/10 bg-ink/85 p-3 text-[10px] leading-4 text-slate-400 backdrop-blur"><Info size={13} className="mb-1 text-amberx"/> Route and travel time from OSRM are estimates. Map click mode: <b className="text-emeraldx">{mapClickMode}</b>. Tap the map to place a custom pin.</div>
      </div>
    </div>
    {routeError&&<div className="absolute bottom-4 right-4 z-[600] max-w-xs rounded-xl border border-amberx/30 bg-ink/95 p-3 text-[10px] text-amberx shadow-xl">OSRM could not be reached. Showing a straight-line distance estimate with a road-distance factor.</div>}
  </div>
}
const paths=['/','/vehicle','/route']
const stepFromPath=()=>{
  const clean=window.location.pathname.replace(/\/+$/,'')||'/'
  const i=paths.indexOf(clean)
  return i===-1?0:i
}
export default function App(){
  const [step,setStepState]=useState(stepFromPath)
  const [config,setConfig]=useState({category:'ev',model:'atto3',modified:false,energy:'electric',capacity:60.5,consumption:14.4,level:45,customName:''})
  const setStep=next=>{
    const target=paths[next]
    if(window.location.pathname!==target)window.history.pushState({step:next},'',target)
    setStepState(next)
    window.scrollTo(0,0)
  }
  useEffect(()=>{
    // Normalise unknown paths (e.g. /foo) back to the root URL
    const known=paths.includes(window.location.pathname.replace(/\/+$/,'')||'/')
    if(!known)window.history.replaceState({step:0},'','/')
    const onPop=()=>setStepState(stepFromPath())
    window.addEventListener('popstate',onPop)
    return ()=>window.removeEventListener('popstate',onPop)
  },[])
  useEffect(()=>{
    const titles=['SmartRoute AI — Cambodia Trip Planner','Vehicle profile · SmartRoute AI','Map & Route · SmartRoute AI']
    document.title=titles[step]
  },[step])
  return step===0?<Welcome onStart={()=>setStep(1)}/>:step===1?<Setup onBack={()=>setStep(0)} onGenerate={()=>setStep(2)} config={config} setConfig={setConfig}/>:<TripPlanner config={config} onChangeVehicle={()=>setStep(1)}/>
}
