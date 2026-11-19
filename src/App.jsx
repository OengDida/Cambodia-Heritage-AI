import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, BatteryCharging, Bike, CarFront, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Fuel, Gauge, Github, Info, LocateFixed, Leaf, Map as MapIcon, MapPin, Navigation, PlugZap, Route, Search, ShieldAlert, Sparkles, Truck, Zap } from 'lucide-react'
import MapView from './components/MapView'
import { computeGoogleRoute, geocodeGoogleAddress, googleMapsErrorMessage, loadGoogleMaps, searchStationsAlongRoute } from './googleMaps'
import { vehicleGroups } from './data/vehicles'
import { provinces, stations } from './data/places'
import { defaultRates } from './data/rates'
import { fmt, haversine, money, nearestOnRoute } from './utils'

const cx=(...x)=>x.filter(Boolean).join(' ')
const fmtTime=m=>`${Math.floor(m/60)}h ${Math.round(m%60)}m`
const categoryIcons={ev:Zap,hybrid:Leaf,gasoline:CarFront,diesel:Truck,motorbike:Bike}
const kmLine=(a,b)=>haversine(a,b)
const stationFilters=[['all','All Stations'],['ev','EV Chargers'],['gas','Gas Pumps'],['hybrid','Hybrid Hubs']]
const filterLabel=id=>stationFilters.find(f=>f[0]===id)?.[1]||'Stations'
const searchLabel={all:'Find stations along this route',ev:'Find EV chargers along this route',gas:'Find gas stations along this route',hybrid:'Find hybrid hubs along this route'}
const matchesFilter=(s,f)=>f==='all'||(f==='ev'&&s.type!=='gas_only')||(f==='gas'&&s.type!=='ev_only')||(f==='hybrid'&&s.type==='hybrid_hub')
const typeBadge={ev_only:['EV','text-blue-300'],gas_only:['Gas','text-amberx'],hybrid_hub:['Hybrid hub','text-violet-300']}
function Panel({children,className=''}){return <div className={cx('glass rounded-2xl border border-white/10 shadow-2xl',className)}>{children}</div>}
function Pill({children,active,onClick}){return <button onClick={onClick} className={cx('rounded-full px-3 py-2 text-xs font-semibold transition',active?'bg-emeraldx text-ink':'bg-white/5 text-slate-300 hover:bg-white/10')}>{children}</button>}
function Field({label,children}){return <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>}
function Select({value,onChange,children}){return <div className="relative"><select value={value} onChange={e=>onChange(e.target.value)} className="field w-full appearance-none pr-9">{children}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-slate-400"/></div>}
function PlaceSearch({label,value,placeholder,onPick,action,bias}){
  const host=useRef(null)
  const widgetRef=useRef(null)
  const onPickRef=useRef(onPick)
  const valueRef=useRef(value)
  const biasRef=useRef(bias)
  const [mode,setMode]=useState('loading')
  const [error,setError]=useState('')
  const [fallbackQuery,setFallbackQuery]=useState(value||'')
  const [fallbackLoading,setFallbackLoading]=useState(false)

  onPickRef.current=onPick
  valueRef.current=value
  biasRef.current=bias

  useEffect(()=>{
    let alive=true
    let widget
    const onSelect=async event=>{
      try{
        const place=event.placePrediction?.toPlace()
        if(!place)throw new Error('Google did not return a place for that selection.')
        await place.fetchFields({fields:['displayName','formattedAddress','location']})
        const location=place.location
        if(!location)throw new Error('This place did not include a usable map location.')
        const lat=typeof location.lat==='function'?location.lat():location.lat
        const lng=typeof location.lng==='function'?location.lng():location.lng
        if(!Number.isFinite(lat)||!Number.isFinite(lng))throw new Error('This place did not include usable coordinates.')
        const name=place.displayName||place.formattedAddress||'Google Maps place'
        const formattedAddress=place.formattedAddress||name
        setError('')
        setFallbackQuery(formattedAddress)
        onPickRef.current?.({lat,lng,name,formattedAddress,placeId:place.id,isCurrentLocation:false})
      }catch(selectionError){
        setError(googleMapsErrorMessage(selectionError,'Google Places'))
      }
    }
    const onWidgetError=()=>{
      if(!alive)return
      setError('Google place suggestions are unavailable. Check Places API access, billing, quota, and key restrictions, or enter a full address below.')
      setMode('fallback')
      widget?.removeEventListener('gmp-select',onSelect)
      widget?.removeEventListener('gmp-error',onWidgetError)
      widget?.remove()
      if(widgetRef.current===widget)widgetRef.current=null
    }

    loadGoogleMaps().then(async maps=>{
      const {PlaceAutocompleteElement}=await maps.importLibrary('places')
      if(!alive)return
      if(!PlaceAutocompleteElement)throw new Error('PlaceAutocompleteElement is unavailable in this Maps JavaScript API version.')
      widget=new PlaceAutocompleteElement({
        placeholder,
        value:valueRef.current||'',
        requestedRegion:'kh',
        description:`Search for a Google Maps place for ${label.toLowerCase()}.`,
      })
      widget.className='google-place-autocomplete'
      widget.value=valueRef.current||''
      widget.style.width='100%'
      widget.style.colorScheme='dark'
      widget.locationBias=biasRef.current?{center:{lat:biasRef.current.lat,lng:biasRef.current.lng},radius:25000}:undefined
      widget.addEventListener('gmp-select',onSelect)
      widget.addEventListener('gmp-error',onWidgetError)
      widgetRef.current=widget
      host.current?.replaceChildren(widget)
      setMode('widget')
      setError('')
    }).catch(loadError=>{
      if(!alive)return
      setMode('fallback')
      setError(`${googleMapsErrorMessage(loadError,'Google Places')} Enter a full address to use Google Geocoding as a fallback.`)
    })

    return()=>{
      alive=false
      widget?.removeEventListener('gmp-select',onSelect)
      widget?.removeEventListener('gmp-error',onWidgetError)
      widget?.remove()
      if(widgetRef.current===widget)widgetRef.current=null
    }
  },[label,placeholder])

  useEffect(()=>{
    if(widgetRef.current&&widgetRef.current.value!==(value||''))widgetRef.current.value=value||''
    setFallbackQuery(value||'')
  },[value])

  useEffect(()=>{
    if(widgetRef.current){
      widgetRef.current.locationBias=bias?{center:{lat:bias.lat,lng:bias.lng},radius:25000}:undefined
    }
  },[bias?.lat,bias?.lng])

  const searchFallback=async event=>{
    event.preventDefault()
    const query=fallbackQuery.trim()
    if(!query||fallbackLoading)return
    setFallbackLoading(true);setError('')
    try{
      const place=await geocodeGoogleAddress(query)
      setFallbackQuery(place.formattedAddress)
      onPickRef.current?.(place)
    }catch(geocodeError){
      setError(googleMapsErrorMessage(geocodeError,'Google Geocoding'))
    }finally{
      setFallbackLoading(false)
    }
  }

  return <div className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div ref={host} className={cx('w-full',mode!=='widget'&&'hidden')}/>
        {mode==='loading'&&<div className="field min-h-[42px] w-full truncate text-slate-500">{value||placeholder}</div>}
        {mode==='fallback'&&<form onSubmit={searchFallback} className="flex gap-2">
          <input className="field min-w-0 flex-1" aria-label={`${label} address`} value={fallbackQuery} onChange={event=>setFallbackQuery(event.target.value)} placeholder={placeholder} autoComplete="off"/>
          <button type="submit" disabled={fallbackLoading||!fallbackQuery.trim()} aria-label={`Find ${label.toLowerCase()} address`} title="Find address" className="flex h-[42px] w-11 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-slate-300 transition hover:border-emeraldx/50 hover:text-emeraldx disabled:opacity-50">
            <Search size={16} className={fallbackLoading?'animate-pulse':''}/>
          </button>
        </form>}
      </div>
      {action}
    </div>
    {error&&<div role="status" className="text-[10px] leading-4 text-amberx">{error}</div>}
  </div>
}
const repo='https://github.com/OengDida/SmartRoute-AI'
function FooterCol({title,children}){return <div><div className="mb-2 text-sm font-bold text-white">{title}</div><ul className="space-y-0.5">{children}</ul></div>}
function FLink({href,onClick,external,children}){return <li><a href={href} onClick={onClick?e=>{e.preventDefault();onClick()}:undefined} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} className="text-sm leading-6 text-slate-400 transition hover:text-emeraldx">{children}</a></li>}
function FText({children}){return <li className="text-sm leading-6 text-slate-500">{children}</li>}
function Welcome({onStart,onRoute}){return <main className="welcome min-h-screen overflow-hidden px-5 text-white">
  <div className="absolute inset-0 bg-grid opacity-30"/>
  <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col">
    <header className="flex items-center gap-3 py-7"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-11 w-11 object-contain [filter:drop-shadow(0_0_12px_rgba(32,214,154,0.35))]"/><div><div className="text-xl font-black tracking-tight">SmartRoute <span className="text-emeraldx">AI</span></div><div className="text-[10px] uppercase tracking-[.24em] text-slate-500">Cambodia mobility intelligence</div></div></header>
    <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_.95fr]">
      <div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emeraldx/25 bg-emeraldx/10 px-4 py-2 text-xs font-semibold text-emeraldx"><Sparkles size={14}/> Built for Cambodia's highways</div>
        <h1 className="text-5xl font-black leading-[1.06] tracking-tight sm:text-7xl">Every kilometer.<br/><span className="text-emeraldx">Smarter.</span></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">AI-Powered Multi-Fuel Highway & Range Planner for Cambodia. Prevent dead-zones, find EV chargers & gas pumps, and optimize trip costs in KHR & USD.</p>
        <div className="mt-9 flex flex-wrap gap-3"><button onClick={onStart} className="flex items-center gap-3 rounded-xl bg-emeraldx px-6 py-4 font-extrabold text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-emerald-300">Launch SmartRoute AI <ArrowRight size={18}/></button><div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400"><ShieldAlert size={16} className="text-amberx"/> Plan ahead. Arrive prepared.</div></div>
        <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6"><div><div className="text-2xl font-black">25+</div><div className="text-xs text-slate-500">Station pins</div></div><div><div className="text-2xl font-black">5</div><div className="text-xs text-slate-500">Powertrains</div></div><div><div className="text-2xl font-black">៛ / $</div><div className="text-xs text-slate-500">Dual currency</div></div></div>
      </div>
      <div className="relative hidden lg:block"><div className="absolute -inset-10 rounded-full bg-emeraldx/10 blur-3xl"/><div className="relative rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><span className="text-sm font-bold">Live route preview</span><span className="rounded-full bg-emeraldx/10 px-3 py-1 text-[10px] font-bold text-emeraldx">CAMBODIA</span></div>
        <div className="map-art relative h-[390px] overflow-hidden rounded-2xl border border-white/10"><svg viewBox="0 0 500 390" className="h-full w-full"><path d="M40 70 C130 120 110 170 180 195 S260 235 270 315 S370 340 440 280" fill="none" stroke="#20d69a" strokeWidth="5" strokeDasharray="2 10" strokeLinecap="round"/><path d="M15 290 C120 245 160 280 220 210 S350 120 480 145" fill="none" stroke="#334d46" strokeWidth="2"/><path d="M60 40 L440 350 M30 200 L470 60 M120 0 L390 390" stroke="#203a32" strokeWidth="1"/><circle cx="40" cy="70" r="10" fill="#20d69a"/><circle cx="440" cy="280" r="10" fill="#f7b84b"/><circle cx="260" cy="230" r="7" fill="#53b7ff"/><circle cx="270" cy="315" r="7" fill="#b69cff"/></svg><div className="absolute left-5 top-5 rounded-xl border border-white/10 bg-ink/80 px-3 py-2 text-xs"><div className="font-bold">Phnom Penh</div><div className="text-slate-400">Origin</div></div><div className="absolute bottom-5 right-5 rounded-xl border border-white/10 bg-ink/80 px-3 py-2 text-xs"><div className="font-bold">Siem Reap</div><div className="text-slate-400">Destination</div></div><div className="absolute bottom-5 left-5 rounded-xl bg-blue-400/15 px-3 py-2 text-xs text-blue-200">⚡ Charging stop</div></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/5 p-3"><Route size={16} className="mx-auto mb-2 text-emeraldx"/><b className="text-sm">Route</b><p className="text-[10px] text-slate-500">Google Routes</p></div><div className="rounded-xl bg-white/5 p-3"><BatteryCharging size={16} className="mx-auto mb-2 text-blue-300"/><b className="text-sm">Range</b><p className="text-[10px] text-slate-500">Dead-zone alerts</p></div><div className="rounded-xl bg-white/5 p-3"><CircleDollarSign size={16} className="mx-auto mb-2 text-amberx"/><b className="text-sm">Cost</b><p className="text-[10px] text-slate-500">KHR + USD</p></div></div>
      </div></div>
    </section>
    <footer className="border-t border-white/10 pt-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div><div className="flex items-center gap-3"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-9 w-9 object-contain"/><div className="text-lg font-black tracking-tight">SmartRoute <span className="text-emeraldx">AI</span></div></div><p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">Highway range and trip-cost planning for Cambodia. Plan ahead. Arrive prepared.</p><div className="mt-6 flex gap-3"><a href={repo} target="_blank" rel="noopener noreferrer" aria-label="SmartRoute AI on GitHub" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-emeraldx/50 hover:text-emeraldx"><Github size={18}/></a></div></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          <FooterCol title="Planner"><FLink href="/vehicle" onClick={onStart}>Launch SmartRoute AI</FLink><FLink href="/vehicle" onClick={onStart}>Vehicle profile</FLink><FLink href="/route" onClick={onRoute}>Map &amp; route</FLink></FooterCol>
          <FooterCol title="Powertrains"><FText>Electric</FText><FText>Hybrid</FText><FText>Gasoline</FText><FText>Diesel</FText><FText>Motorbike</FText></FooterCol>
          <FooterCol title="Data &amp; maps"><FLink href="https://developers.google.com/maps/documentation/javascript" external>Google Maps &amp; Places</FLink><FLink href="https://developers.google.com/maps/documentation/javascript/routes/get-a-route" external>Google Routes</FLink><FLink href={repo+'/blob/main/src/data/places.js'} external>Station data</FLink></FooterCol>
          <FooterCol title="Project"><FLink href={repo} external>GitHub</FLink><FLink href={repo+'/issues'} external>Report an issue</FLink><FLink href="/sitemap.xml" external>Sitemap</FLink></FooterCol>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-white/10 py-6 text-[11px] leading-5 text-slate-500"><span>© 2026 SmartRoute AI · Cambodia trip intelligence</span><span className="max-w-xl sm:text-right">Estimates only. Station data is a curated dataset, not a live directory. Verify fuel and charger availability before you travel.</span></div>
    </footer>
  </div>
</main>}
function LocationGate({onSuccess,onBack}) {
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const requestRef=useRef(null)
  const requestIdRef=useRef(0)

  const requestLocation=()=>{
    if(!navigator.geolocation){setLoading(false);setError('unsupported');return}
    const requestId=++requestIdRef.current
    setLoading(true);setError('')
    try{
      navigator.geolocation.getCurrentPosition(position=>{
        if(requestId!==requestIdRef.current)return
        const {latitude:lat,longitude:lng,accuracy}=position.coords||{}
        if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180){
          setLoading(false);setError('unavailable');return
        }
        onSuccess({lat,lng,accuracy:Number.isFinite(accuracy)?Math.max(0,accuracy):0})
      },err=>{
        if(requestId!==requestIdRef.current)return
        setLoading(false)
        setError(err?.code===1?'denied':err?.code===2?'unavailable':err?.code===3?'timeout':'unavailable')
      },{enableHighAccuracy:true,timeout:20000,maximumAge:0})
    }catch{
      if(requestId!==requestIdRef.current)return
      setLoading(false);setError('unavailable')
    }
  }
  requestRef.current=requestLocation

  useEffect(()=>{
    let active=true
    if(!navigator.geolocation){setError('unsupported');return()=>{active=false}}
    if(navigator.permissions?.query){
      navigator.permissions.query({name:'geolocation'}).then(permission=>{
        if(!active)return
        if(permission.state==='granted')requestRef.current?.()
        else if(permission.state==='denied')setError('denied')
      }).catch(()=>{})
    }
    return()=>{active=false;requestIdRef.current++}
  },[])

  const errorCopy={
    denied:{
      title:'Location permission is blocked',
      body:'Allow location for this site from the lock or site-controls icon beside the address bar. Choose Location → Allow, then try again.',
    },
    unavailable:{
      title:'Your position is unavailable',
      body:'Check that device location services are on and that you have a clear GPS or network signal, then try again.',
    },
    timeout:{
      title:'Location request timed out',
      body:'We couldn’t get a GPS fix in time. Check your signal or device location settings, then try again.',
    },
    unsupported:{
      title:'Location isn’t supported here',
      body:'Use a browser and secure connection that support location services, then reload SmartRoute.',
    },
  }[error]

  return <main className="welcome relative grid min-h-[100dvh] place-items-center overflow-hidden px-5 py-8 text-white">
    <div className="pointer-events-none absolute inset-0 bg-grid opacity-30"/>
    <header className="absolute left-5 right-5 top-5 z-10 mx-auto flex max-w-6xl items-center gap-3 sm:left-8 sm:right-8">
      <img src="/favicon.svg" alt="" className="h-10 w-10 object-contain [filter:drop-shadow(0_0_12px_rgba(32,214,154,0.35))]"/>
      <div><div className="text-lg font-black tracking-tight">SmartRoute <span className="text-emeraldx">AI</span></div><div className="text-[9px] uppercase tracking-[.22em] text-slate-500">Cambodia trip planner</div></div>
    </header>
    <section className="relative w-full max-w-lg pt-14">
      <Panel className="p-6 text-center shadow-2xl sm:p-9">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emeraldx/20 bg-emeraldx/10 text-emeraldx shadow-glow"><MapPin size={25}/></div>
        <div className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-emeraldx">Location access · required to continue</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Enable your location to start</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300">SmartRoute uses your live location to find your starting point and center your trip map for route and cost planning.</p>

        {errorCopy&&<div role="alert" className="mt-6 rounded-xl border border-amberx/20 bg-amberx/5 p-4 text-left">
          <div className="flex items-start gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-amberx"/><div><div className="text-xs font-bold text-amberx">{errorCopy.title}</div><p className="mt-1 text-xs leading-5 text-slate-300">{errorCopy.body}</p></div></div>
          <button onClick={requestLocation} disabled={loading} className="mt-3 ml-7 text-xs font-bold text-emeraldx underline decoration-emeraldx/40 underline-offset-4 hover:text-emerald-300 disabled:opacity-50">Try Again</button>
        </div>}

        {loading&&<div role="status" className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"><LocateFixed size={15} className="animate-pulse text-emeraldx"/>Finding your location…</div>}
        <button onClick={requestLocation} disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx px-5 py-4 text-sm font-extrabold text-ink shadow-glow transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-65">
          <LocateFixed size={17} className={loading?'animate-pulse':''}/>{loading?'Locating…':'Allow Location & Continue'}
        </button>
        <button onClick={onBack} className="mt-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-white"><ArrowLeft size={14}/>Back to SmartRoute</button>
        <p className="mt-4 text-[10px] leading-4 text-slate-500">Location is used to show your position on the trip map. You can change browser permissions any time.</p>
      </Panel>
      <div className="mt-5 text-center text-[10px] text-slate-500">Plan ahead. Arrive prepared.</div>
    </section>
  </main>
}
function Setup({onBack,onGenerate,config,setConfig}) {
  const [vehicleSearch,setVehicleSearch]=useState('')
  const group=vehicleGroups.find(g=>g.id===config.category)
  const vehicleOptions=group?.items.filter(v=>`${v.name} ${v.note}`.toLowerCase().includes(vehicleSearch.trim().toLowerCase()))||[]
  const selected=group?.items.find(v=>v.id===config.model)
  const set=(key,value)=>setConfig(p=>({...p,[key]:value}))
  useEffect(()=>{if(!config.modified&&selected)setConfig(p=>({...p,energy:selected.energy,capacity:selected.capacity,consumption:selected.consumption,model:selected.id}))},[config.category,config.model,config.modified])
  const Icon=categoryIcons[config.category]||CarFront
  return <div className="min-h-screen bg-ink px-4 py-6 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <button onClick={onBack} className="mb-7 flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back</button>
    <div className="mb-8"><div className="text-xs font-bold uppercase tracking-[.2em] text-emeraldx">Step 02 / Vehicle profile</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">What are you driving?</h1><p className="mt-2 text-slate-400">We'll use your vehicle's real-world efficiency to estimate range and trip costs.</p></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Panel className="p-5 sm:p-7"><h2 className="mb-4 font-bold">2A. Select powertrain</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{vehicleGroups.map(g=>{const I=categoryIcons[g.id];return <button key={g.id} onClick={()=>setConfig(p=>({...p,category:g.id,model:'',energy:g.items[0].energy,...(p.modified?{}:{capacity:'',consumption:''})}))} className={cx('rounded-xl border p-4 text-left transition',config.category===g.id?'border-emeraldx bg-emeraldx/10 shadow-glow':'border-white/10 bg-white/[.025] hover:bg-white/5')}><I size={22} className={config.category===g.id?'text-emeraldx':'text-slate-400'}/><div className="mt-3 text-sm font-bold">{g.label}</div><div className="mt-1 text-[11px] text-slate-500">{g.items.length} presets</div></button>})}</div>
      <div className="my-7 border-t border-white/10"/>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">2B. Vehicle configuration</h2><div className="flex rounded-xl bg-black/20 p-1"><button onClick={()=>setConfig(p=>({...p,modified:false,...(p.model?{}:{capacity:'',consumption:''})}))} className={cx('rounded-lg px-4 py-2 text-xs font-bold',!config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Stock</button><button onClick={()=>set('modified',true)} className={cx('rounded-lg px-4 py-2 text-xs font-bold',config.modified?'bg-emeraldx text-ink':'text-slate-400')}>Modified</button></div></div>
      {!config.modified?<div className="mt-5 space-y-4">{!group?<p className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-400">Select a powertrain above, then choose your vehicle.</p>:<><Field label="Search vehicles"><div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-3.5 text-slate-400"/><input className="field w-full !pl-9" type="search" value={vehicleSearch} onChange={e=>setVehicleSearch(e.target.value)} placeholder="Search by make or model" autoComplete="off"/></div></Field><div className="-mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{vehicleOptions.length?vehicleOptions.map(v=><button type="button" key={v.id} onClick={()=>setConfig(p=>({...p,model:v.id,energy:v.energy,capacity:v.capacity,consumption:v.consumption}))} className={cx('block w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/5',config.model===v.id&&'bg-emeraldx/10')}><span className="block text-xs font-semibold">{v.name}</span><span className="mt-0.5 block text-[10px] text-slate-500">{v.note}</span></button>):<div className="px-3 py-3 text-xs text-slate-500">No vehicles match “{vehicleSearch}”. Try another search.</div>}</div></>}{selected&&<div className="rounded-xl border border-emeraldx/15 bg-emeraldx/5 p-4"><div className="flex items-center gap-2 text-sm font-bold text-emeraldx"><Icon size={17}/>{selected?.name}</div><div className="mt-3 grid grid-cols-2 gap-3"><div><div className="text-[10px] uppercase text-slate-500">Capacity</div><b>{config.capacity} {config.energy==='electric'?'kWh':'L'}</b></div><div><div className="text-[10px] uppercase text-slate-500">Consumption</div><b>{config.consumption} {config.energy==='electric'?'kWh':'L'}/100km</b></div></div></div>}</div>
      :<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Fuel / energy type"><Select value={config.energy} onChange={v=>set('energy',v)}><option value="" disabled>Choose type</option><option value="gasoline">Regular gasoline 92</option><option value="diesel">Diesel</option><option value="electric">Electric (kWh)</option></Select></Field><Field label={`Consumption (${config.energy==='electric'?'kWh':'L'}/100km)`}><input className="field w-full" type="number" min="0.1" step=".1" value={config.consumption} onChange={e=>set('consumption',e.target.value===''?'':Number(e.target.value))}/></Field><Field label={`Tank / battery capacity (${config.energy==='electric'?'kWh':'L'})`}><input className="field w-full" type="number" min="1" step=".1" value={config.capacity} onChange={e=>set('capacity',e.target.value===''?'':Number(e.target.value))}/></Field><Field label="Custom vehicle name"><input className="field w-full" value={config.customName} onChange={e=>set('customName',e.target.value)} placeholder="e.g. My modified pickup"/></Field></div>}
      <div className="mt-7 rounded-xl bg-black/20 p-4"><div className="flex items-center justify-between"><label className="text-sm font-bold">Current {config.energy==='electric'?'battery':config.energy?'fuel':'battery / fuel'} level</label><span className="text-xl font-black text-emeraldx">{config.level}%</span></div><input type="range" min="5" max="100" step="1" value={config.level} onChange={e=>set('level',Number(e.target.value))} className="mt-4 w-full accent-emerald-400"/><div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Nearly empty</span><span>Full tank</span></div></div>
      <button onClick={onGenerate} disabled={!config.capacity||!config.consumption||config.capacity<=0||config.consumption<=0||(!config.modified&&!config.model)||(config.modified&&!config.energy)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-4 font-extrabold text-ink transition hover:bg-emerald-300 disabled:opacity-40">Generate Map & Route <ArrowRight size={18}/></button>
      </Panel>
      <div className="space-y-4"><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-emeraldx"><Gauge size={18}/><b>Range snapshot</b></div><div className="text-4xl font-black">{config.capacity>0&&config.consumption>0?Math.round(config.capacity*config.level/100/(config.consumption/100)):'—'}<span className="ml-1 text-base font-semibold text-slate-400">km</span></div><p className="mt-2 text-xs leading-5 text-slate-400">Estimated remaining range at {config.level}% based on the entered consumption rate. Actual range varies with speed, load, terrain and weather.</p></Panel><Panel className="p-5"><div className="mb-3 flex items-center gap-2 text-amberx"><Info size={18}/><b>Before you hit the road</b></div><ul className="space-y-3 text-xs leading-5 text-slate-400"><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Verify your actual fuel or battery capacity.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Keep a safety buffer for traffic and detours.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emeraldx"/> Check station status before relying on a charger.</li></ul></Panel><div className="rounded-xl border border-white/10 p-4 text-xs leading-5 text-slate-500">Demo defaults are estimates, not certified manufacturer test figures. You can customize your consumption and rates later.</div></div>
    </div></div></div>
}
function TripPlanner({config,onChangeVehicle,initialLocation}) {
  const [originName,setOriginName]=useState(initialLocation?'Current location':'')
  const [destinationName,setDestinationName]=useState('')
  const [origin,setOrigin]=useState(()=>initialLocation?{lat:initialLocation.lat,lng:initialLocation.lng,name:'Current location',isCurrentLocation:true}:null)
  const [destination,setDestination]=useState(null)
  const [route,setRoute]=useState([])
  const [distance,setDistance]=useState(0)
  const [duration,setDuration]=useState(0)
  const [routeStatus,setRouteStatus]=useState('Choose an origin and destination')
  const [filter,setFilter]=useState('all')
  const [rates,setRates]=useState(defaultRates)
  const [showRates,setShowRates]=useState(false)
  const [prompt,setPrompt]=useState('')
  const [mapClickMode,setMapClickMode]=useState(null)
  const [routeError,setRouteError]=useState('')
  const [showStations,setShowStations]=useState(false)
  const [googleStations,setGoogleStations]=useState(null)
  const [searchedFilter,setSearchedFilter]=useState('all')
  const [stationSearch,setStationSearch]=useState({status:'idle',progress:0,total:0,count:0,error:'',failedAreas:0})
  const [locating,setLocating]=useState(false)
  const [showLeft,setShowLeft]=useState(true)
  const [showRight,setShowRight]=useState(true)
  const [locNote,setLocNote]=useState('')
  const routeRequestRef=useRef(0)
  const vehicleName=config.modified?(config.customName||'Custom vehicle'):(vehicleGroups.find(g=>g.id===config.category)?.items.find(v=>v.id===config.model)?.name||'Vehicle')
  const vehicle=vehicleGroups.find(g=>g.id===config.category)?.items.find(v=>v.id===config.model)
  const isEV=config.energy==='electric'
  const isHybrid=config.category==='hybrid'&&!isEV
  const isPHEV=isHybrid&&Number.isFinite(vehicle?.electricConsumption)&&Number.isFinite(vehicle?.fuelOnlyConsumption)
  const comparisonFuelConsumption=6.8
  const comparisonElectricConsumption=14.4
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
  const findRouteStations=async()=>{
    setSearchedFilter(filter);setShowStations(true);setGoogleStations([])
    setStationSearch({status:'loading',progress:0,total:0,count:0,error:'',failedAreas:0})
    try{
      const result=await searchStationsAlongRoute(routePoints,filter,(progress,total,count)=>setStationSearch(s=>({...s,progress,total,count})))
      setGoogleStations(result.places)
      setStationSearch({status:'done',progress:result.sampleCount,total:result.sampleCount,count:result.places.length,error:result.error||'',failedAreas:result.failedAreas})
    }catch(error){
      setStationSearch(s=>({...s,status:'error',error:googleMapsErrorMessage(error,'Google Places')}))
    }
  }
  const suitable=alongStations.filter(s=>isEV?s.type!=='gas_only':s.type!=='ev_only')
  const recommended=suitable.filter(s=>s.routeMeta.along>0&&s.routeMeta.along<Math.min(distance,currentRange*0.85+15)).slice(0,3)
  const need=distance*consumption/100
  const costRate=isEV?rates.ev:config.energy==='diesel'?rates.diesel:rates.gasoline
  const totalCost=need*costRate
  const fuelOnlyConsumption=isPHEV?vehicle.fuelOnlyConsumption:comparisonFuelConsumption
  const electricOnlyConsumption=isPHEV?vehicle.electricConsumption:comparisonElectricConsumption
  const hybridFuelNeed=isHybrid?distance*fuelOnlyConsumption/100:need
  const hybridElectricNeed=isHybrid?distance*electricOnlyConsumption/100:0
  const hybridFuelCost=hybridFuelNeed*(config.energy==='diesel'?rates.diesel:rates.gasoline)
  const hybridElectricRate=isPHEV?rates.phevAc:rates.ev
  const hybridElectricCost=hybridElectricNeed*hybridElectricRate
  const gasCost=distance*(isPHEV?vehicle.fuelOnlyConsumption:comparisonFuelConsumption)/100*rates.gasoline
  const evCost=distance*(isPHEV?vehicle.electricConsumption:comparisonElectricConsumption)/100*hybridElectricRate
  const save=Math.abs(gasCost-evCost)
  const lowRange=distance>currentRange
  const routePoints=route.length?route:[]
  const calculate=async(a=origin,b=destination)=>{
    const requestId=++routeRequestRef.current
    if(!a||!b){
      setRoute([])
      setDistance(0);setDuration(0)
      setRouteStatus('Choose an origin and destination')
      setRouteError('')
      return
    }
    setGoogleStations(null)
    setStationSearch({status:'idle',progress:0,total:0,count:0,error:'',failedAreas:0})
    setRouteStatus('Calculating Google route…');setRouteError('')
    try{
      const result=await computeGoogleRoute(a,b)
      if(requestId!==routeRequestRef.current)return
      setRoute(result.path)
      setDistance(result.distanceMeters/1000)
      setDuration(result.durationMillis/60000)
      setRouteStatus('Google Maps driving route')
      setRouteError('')
    }catch(error){
      if(requestId!==routeRequestRef.current)return
      const d=kmLine(a,b)*1.22
      setRoute([[a.lng,a.lat],[b.lng,b.lat]])
      setDistance(d);setDuration(d/65*60)
      setRouteStatus('Straight-line estimate · Google Routes unavailable')
      setRouteError(`${googleMapsErrorMessage(error,'Google Routes')} Showing an approximate straight-line estimate.`)
    }
  }
  useEffect(()=>{calculate(origin,destination)},[])
  const pickOrigin=pl=>{
    const selected={...pl,isCurrentLocation:false}
    setOriginName(pl.formattedAddress||pl.name)
    setOrigin(selected)
    calculate(selected,destination)
  }
  const pickDestination=pl=>{
    setDestinationName(pl.formattedAddress||pl.name)
    setDestination(pl)
    calculate(origin,pl)
  }
  const isMobile=()=>window.matchMedia('(max-width:1023px)').matches
  const togglePin=which=>{
    if(mapClickMode===which){setMapClickMode(null);if(isMobile())setShowLeft(true);return}
    setMapClickMode(which)
    if(isMobile())setShowLeft(false)
  }
  const handleMapClick=p=>{
    if(!mapClickMode)return
    const nearest=provinces.map(x=>({...x,d:kmLine(x,p)})).sort((a,b)=>a.d-b.d)[0]
    const pin={lat:p.lat,lng:p.lng,name:`Map pin near ${nearest.name}`}
    if(mapClickMode==='origin'){setOrigin(pin);setOriginName('Custom map pin');calculate(pin,destination)}
    else{setDestination(pin);setDestinationName('Custom map pin');calculate(origin,pin)}
    setMapClickMode(null)
    if(isMobile())setShowLeft(true)
  }
  const pinButton=which=><button onClick={()=>togglePin(which)} aria-label={mapClickMode===which?'Cancel pin on map':'Pin (choose on map)'} title="Pin (choose on map)" className={cx('flex w-11 shrink-0 items-center justify-center rounded-[10px] border transition',mapClickMode===which?'border-emeraldx bg-emeraldx text-ink':'border-white/10 bg-white/5 text-slate-300 hover:border-emeraldx/50 hover:text-emeraldx')}><MapPin size={18}/></button>
  const useCurrentLocation=()=>{
    if(!('geolocation' in navigator)){setLocNote('Location is not supported by this browser.');return}
    setLocating(true);setLocNote('')
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const {latitude:lat,longitude:lng}=pos.coords
        const nearest=provinces.map(x=>({...x,d:kmLine(x,{lat,lng})})).sort((a,b)=>a.d-b.d)[0]
        const inCambodia=lat>=9.9&&lat<=14.8&&lng>=102.2&&lng<=107.8
        const pin={lat,lng,name:`Current location (near ${nearest.name})`,isCurrentLocation:true}
        setOrigin(pin);setOriginName('Current location');setMapClickMode(null)
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
    if(!origin||!destination)return `${vehicleName} has approximately ${Math.round(currentRange)} km of range at ${config.level}%. Choose an origin and destination to check the route, range and suggested stops.`
    if(lowRange){
      const stop=recommended[0]
      return stop?`${vehicleName} has approximately ${Math.round(currentRange)} km of range at ${config.level}% and the destination is ${Math.round(distance-currentRange)} km beyond that. Plan a stop at ${stop.name} (${stop.road}) before reaching the estimated range limit. Confirm the connector and live availability before departure.`:`Your estimated range (${Math.round(currentRange)} km) is shorter than this ${Math.round(distance)} km trip. No compatible station pin was found close to the displayed route corridor. Add a safety stop and verify local options before leaving.`
    }
    return `${vehicleName} has an estimated ${Math.round(currentRange-distance)} km of range remaining on arrival. The current ${Math.round(distance)} km route appears achievable without a planned refuel stop, assuming the entered efficiency and normal conditions. Keep a reserve for detours.`
  }
  const chips=['Compare EV vs Gas cost','Find 24/7 stops only','Eco-driving tip']
  const chipAction=t=>{setPrompt(t);if(t==='Find 24/7 stops only')setShowStations(true)}
  const stationFinderPanel=<Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><MapPin size={16} className="text-emeraldx"/> Station finder</div><button onClick={()=>setShowStations(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showStations?'Hide list':'View stations'}</button></div>
          <div className="flex flex-wrap gap-1.5">{stationFilters.map(([id,l])=><Pill key={id} active={filter===id} onClick={()=>setFilter(id)}>{l}</Pill>)}</div>
          <button onClick={findRouteStations} disabled={stationSearch.status==='loading'||routePoints.length<2} className="mt-3 flex w-full items-center justify-center rounded-xl bg-emeraldx py-2.5 text-xs font-extrabold text-ink hover:bg-emerald-300 disabled:opacity-60">{stationSearch.status==='loading'?`Searching ${stationSearch.progress}/${stationSearch.total} route areas…`:searchLabel[filter]}</button>
          {stationSearch.status==='error'&&<div className="mt-2 rounded-lg bg-rose-400/10 p-2 text-[10px] leading-4 text-rose-200">Google Places search failed: {stationSearch.error} Check Places API (New), billing, quota, and key referrer restrictions.</div>}
    {stationSearch.status==='done'&&<div className="mt-2 text-[10px] leading-4 text-slate-400">Found {stationSearch.count} unique Google Places results for “{filterLabel(searchedFilter)}”{stationSearch.failedAreas?`; ${stationSearch.failedAreas} route-area searches failed${stationSearch.error?`: ${stationSearch.error}`:''}`:''}. Each route area returns up to 20 matches, so this may miss stations, especially in dense areas.</div>}
          {stationSearch.status==='done'&&googleStations&&filter!==searchedFilter&&searchedFilter!=='all'&&searchedFilter!=='hybrid'&&<div className="mt-2 rounded-lg bg-amberx/10 p-2 text-[10px] leading-4 text-amberx">Route results were fetched for “{filterLabel(searchedFilter)}”. Press the search button to load “{filterLabel(filter)}”.</div>}
          {showStations&&<div className="mt-3 max-h-64 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{googleStations===null?alongStations.filter(s=>matchesFilter(s,filter)).map(s=><div key={s.id} className="rounded-lg bg-black/20 p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">{s.name}</b><span className="text-[9px] text-emeraldx">{s.road}</span></div><div className="mt-1 text-[10px] text-slate-500">{s.brand} · {s.hours} · {s.connectors.join(', ')||'Fuel'}</div></div>)
:googleStations.filter(s=>matchesFilter(s,filter)).map(s=><div key={s.id} className="rounded-lg bg-black/20 p-3"><div className="flex justify-between gap-2"><b className="text-[11px]">{s.name}</b><span className={cx('text-[9px] font-bold',typeBadge[s.type]?.[1])}>{typeBadge[s.type]?.[0]}</span>{s.status==='CLOSED_PERMANENTLY'&&<span className="text-[9px] text-rose-300">Permanently closed</span>}</div><div className="mt-1 text-[10px] text-slate-400">{s.detail||'Address not provided'}</div><a className="mt-1 inline-block text-[10px] font-bold text-emeraldx hover:underline" href={s.mapsUrl} target="_blank" rel="noopener noreferrer">View on Google Maps ↗</a></div>)}</div>}
        </Panel>
  const sidePanels=<>
        <Panel className="p-4"><div className="text-xs font-extrabold">Route overview</div><div className="mt-3 flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emeraldx"/><div className="text-xs font-semibold">{origin?origin.name:'Choose origin'}</div></div><div className="ml-1 my-1 h-5 border-l border-dashed border-slate-600"/><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amberx"/><div className="text-xs font-semibold">{destination?destination.name:'Choose destination'}</div></div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><div><div className="text-[10px] text-slate-500">Distance</div><b>{fmt(distance)} km</b></div><div><div className="text-[10px] text-slate-500">ETA</div><b>{fmtTime(duration)}</b></div></div></Panel>
        <Panel className="p-4"><div className="mb-3 flex items-center gap-2 text-xs font-extrabold"><Activity size={15} className="text-emeraldx"/> Range & dead-zone monitor</div><div className="flex items-end justify-between"><span className="text-[10px] text-slate-500">Estimated remaining range</span><b className={lowRange?'text-rose-300':'text-emeraldx'}>{fmt(currentRange)} km</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className={cx('h-full rounded-full',lowRange?'bg-rose-400':'bg-emeraldx')} style={{width:`${Math.min(100,distance/currentRange*100)}%`}}/></div><div className="mt-2 text-[10px] leading-4 text-slate-400">{!origin||!destination?'Choose an origin and destination to check range.':lowRange?'Range limit falls before destination.':'Estimated range covers the route.'}</div></Panel>
        {stationFinderPanel}
        <div className="rounded-xl border border-white/10 bg-ink/85 p-3 text-[10px] leading-4 text-slate-400 backdrop-blur"><Info size={13} className="mb-1 text-amberx"/> Google Maps route and travel-time results are estimates. Use “Pin (choose on map)” under origin or destination to place a custom pin.</div></>
  return <div className="relative h-[100dvh] min-h-[480px] w-full overflow-hidden bg-slate-950 text-white lg:min-h-[720px]">
    <div className={cx('absolute inset-0',mapClickMode&&'pick-mode')}><MapView origin={origin} destination={destination} route={routePoints} stations={googleStations??[]} filter={filter} onMapClick={handleMapClick} rangePoint={rangePoint} initialLocation={initialLocation}/></div>
    <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-r from-ink/35 via-transparent to-transparent"/>
    <div className="pointer-events-none absolute left-1 top-4 z-[500] flex items-center gap-2"><button onClick={onChangeVehicle} aria-label="Back to vehicle profile" className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 text-xs font-bold shadow-xl backdrop-blur transition hover:border-emeraldx/50 hover:text-emeraldx"><ArrowLeft size={16}/> Back</button><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 py-2 shadow-xl backdrop-blur"><img src="/favicon.svg" alt="SmartRoute AI logo" className="h-8 w-8 object-contain"/><div className="hidden sm:block"><div className="text-sm font-black">SmartRoute <span className="text-emeraldx">AI</span></div><div className="text-[9px] uppercase tracking-widest text-slate-500">Cambodia trip planner</div></div></div></div>
    <div className="pointer-events-none absolute right-1 top-4 z-[500] flex gap-2 lg:hidden"><button onClick={()=>setShowLeft(x=>!x)} aria-label={showLeft?'Hide menu and show map':'Show menu'} className="pointer-events-auto flex h-[52px] items-center gap-2 rounded-xl border border-white/10 bg-ink/90 px-3 text-xs font-bold shadow-xl backdrop-blur hover:border-emeraldx/50">{showLeft?<><MapIcon size={16}/> Map</>:<><Route size={16}/> Plan</>}</button></div>
    <div className="absolute bottom-1 left-1 right-1 top-[76px] z-[500] flex items-end justify-between gap-4 pointer-events-none lg:items-start">
      <div className={cx('pointer-events-auto max-h-full w-full overflow-y-auto lg:max-w-[390px] [direction:rtl] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',!showLeft&&'hidden')}><div className="flex flex-col gap-3 [direction:ltr]">
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="text-sm font-extrabold">Plan your journey</div><span className="rounded-full bg-emeraldx/10 px-2 py-1 text-[9px] font-bold uppercase text-emeraldx">Step 03 / Route</span></div>
          <PlaceSearch label="Origin" value={originName} placeholder="Search a place or address" onPick={pickOrigin} bias={origin||initialLocation} action={pinButton('origin')}/>
          <button onClick={useCurrentLocation} disabled={locating} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emeraldx/30 bg-emeraldx/5 py-2.5 text-xs font-bold text-emeraldx transition hover:bg-emeraldx/10 disabled:opacity-60"><LocateFixed size={15} className={locating?'animate-pulse':''}/>{locating?'Locating…':'Use current location'}</button>
          {locNote&&<div className="mt-2 text-[10px] leading-4 text-slate-400">{locNote}</div>}

          <div className="mt-4"><PlaceSearch label="Destination" value={destinationName} placeholder="Search a place or address" onPick={pickDestination} bias={origin||initialLocation} action={pinButton('destination')}/></div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 p-3"><div><div className="text-[10px] uppercase text-slate-500">Vehicle</div><div className="mt-1 text-xs font-bold">{vehicleName}</div></div><div className="text-right"><div className="text-[10px] uppercase text-slate-500">Current level</div><div className="mt-1 text-sm font-black text-emeraldx">{config.level}%</div></div></div>
          <button onClick={()=>calculate()} disabled={!origin||!destination} className="disabled:opacity-40 mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emeraldx py-3 text-xs font-extrabold text-ink hover:bg-emerald-300"><Navigation size={15}/> Recalculate route</button>
          <div className="mt-2 text-center text-[10px] text-slate-500">{routeStatus}</div>
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-emeraldx"/><div className="text-sm font-extrabold">SmartRoute AI Co-Pilot</div><span className="ml-auto rounded-full bg-emeraldx/10 px-2 py-1 text-[9px] font-bold text-emeraldx">RULE-BASED</span></div>
          <p className="text-xs leading-5 text-slate-300">{recommendation()}</p>
          {lowRange&&<div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-[11px] leading-4 text-rose-200"><ShieldAlert size={16} className="shrink-0"/> Range warning: estimated range is shorter than the trip. Do not depart without a confirmed stop.</div>}
          <div className="mt-3 flex flex-wrap gap-2">{chips.map(c=><button key={c} onClick={()=>chipAction(c)} className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-300 hover:border-emeraldx/40 hover:text-emeraldx">{c}</button>)}</div>
          {prompt&&<div className="mt-3 rounded-lg bg-white/5 p-3 text-[11px] leading-5 text-slate-300">{prompt==='Compare EV vs Gas cost'?`For this distance, illustrative EV cost is ${money(evCost,rates.usdToKhr)} versus gasoline at ${money(gasCost,rates.usdToKhr)}. Estimated difference: ${money(save,rates.usdToKhr)}.`:prompt==='Find 24/7 stops only'?'Station list opened below. Filter for compatible fuel or connectors and confirm the location before travel.':'Eco tip: maintain a steady highway speed, avoid hard acceleration, check tire pressure and reduce unnecessary cargo.'}</div>}
        </Panel>
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-extrabold"><CircleDollarSign size={16} className="text-amberx"/> Trip cost estimate</div><button onClick={()=>setShowRates(x=>!x)} className="text-[10px] font-bold text-emeraldx">{showRates?'Close':'Edit rates'}</button></div>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Distance</div><div className="mt-1 text-lg font-black">{fmt(distance)} <small className="text-xs text-slate-400">km</small></div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-slate-500">Drive time</div><div className="mt-1 text-lg font-black">{fmtTime(duration)}</div></div></div>
          {isHybrid?<><div className="mt-2 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Fuel-only estimate</span><span>L</span></div><div className="mt-1 text-xl font-black">{hybridFuelNeed.toFixed(1)} <small className="text-xs font-medium text-slate-400">L</small></div><div className="mt-1 text-[10px] text-slate-500">{isPHEV?'Vehicle rate':'Comparison'}: {fuelOnlyConsumption} L/100 km</div></div><div className="rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Electric-only estimate</span><span>kWh</span></div><div className="mt-1 text-xl font-black">{hybridElectricNeed.toFixed(1)} <small className="text-xs font-medium text-slate-400">kWh</small></div><div className="mt-1 text-[10px] text-slate-500">{isPHEV?'Vehicle rate':'Comparison'}: {electricOnlyConsumption} kWh/100 km</div></div></div>{isPHEV&&distance>vehicle.range&&<div className="mt-2 rounded-lg border border-amberx/20 bg-amberx/10 p-2 text-[10px] leading-4 text-amberx">Trip exceeds this PHEV’s listed {fmt(vehicle.range)} km EV range by {fmt(distance-vehicle.range)} km. The electric-only estimate assumes the vehicle can be charged during the trip.</div>}</>:<div className="mt-2 rounded-xl bg-black/20 p-3"><div className="flex justify-between text-[10px] text-slate-500"><span>Estimated {isEV?'energy':'fuel'} required</span><span>{isEV?'kWh':'L'}</span></div><div className="mt-1 text-xl font-black">{need.toFixed(1)} <small className="text-xs font-medium text-slate-400">{isEV?'kWh':'L'}</small></div></div>}
          {isHybrid?<div className="mt-2 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-amberx/20 bg-amberx/5 p-3"><div className="text-[10px] text-amberx/80">Estimated fuel-only trip cost</div><div className="mt-1 text-xl font-black">{money(hybridFuelCost,rates.usdToKhr).split(' · ')[0]}</div><div className="text-xs text-slate-400">{money(hybridFuelCost,rates.usdToKhr).split(' · ')[1]}</div><div className="mt-1 text-[10px] text-slate-500">Gasoline · {fmt(rates.gasoline)} ៛/L</div></div><div className="rounded-xl border border-blue-300/20 bg-blue-300/5 p-3"><div className="text-[10px] text-blue-200/80">Estimated electric-only trip cost</div><div className="mt-1 text-xl font-black">{money(hybridElectricCost,rates.usdToKhr).split(' · ')[0]}</div><div className="text-xs text-slate-400">{money(hybridElectricCost,rates.usdToKhr).split(' · ')[1]}</div><div className="mt-1 text-[10px] text-slate-500">{isPHEV?'AC / grid charging':'DC fast-charge'} · {fmt(hybridElectricRate)} ៛/kWh</div></div></div>:<div className="mt-2 flex items-end justify-between rounded-xl border border-amberx/20 bg-amberx/5 p-3"><div><div className="text-[10px] text-amberx/80">Estimated trip cost</div><div className="mt-1 text-xl font-black">{money(totalCost,rates.usdToKhr).split(' · ')[0]}</div><div className="text-xs text-slate-400">{money(totalCost,rates.usdToKhr).split(' · ')[1]}</div></div><div className="text-right text-[10px] text-slate-500">{isEV?'DC fast-charge tariff':config.energy==='diesel'?'Diesel tariff':'Gasoline tariff'}<br/>{fmt(costRate)} ៛ / {isEV?'kWh':'L'}</div></div>}
          <div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-slate-400">EV vs gasoline benchmark</span><span className="font-bold text-emeraldx">{evCost<=gasCost?'EV saves':'Gas saves'} {money(save,rates.usdToKhr)}</span></div>
          {showRates&&<div className="mt-4 space-y-3 border-t border-white/10 pt-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Editable reference tariffs (KHR)</div>{[['gasoline','Regular gasoline / L'],['diesel','Diesel / L'],['ev','Pure EV DC fast charge / kWh'],['phevAc','PHEV AC / grid charging / kWh'],['usdToKhr','USD → KHR']].map(([k,l])=><label key={k} className="flex items-center justify-between gap-3 text-[11px] text-slate-400">{l}<input className="field w-28 py-2 text-right" type="number" value={rates[k]} onChange={e=>setRates(p=>({...p,[k]:Number(e.target.value)}))}/></label>)}<div className="text-[9px] leading-4 text-slate-500">Fuel schedule reference: 11–21 Nov 2026. Electricity tariffs are editable; PHEVs use AC / grid charging and pure EV estimates use DC fast charging.</div></div>}
        </Panel>

      <div className="flex flex-col gap-3 lg:hidden">{sidePanels}</div></div></div>
      <div className={cx('pointer-events-auto ml-auto hidden max-h-full w-[290px] flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',showRight&&'lg:flex')}>{sidePanels}
      </div>
    </div>
    <button onClick={()=>setShowLeft(x=>!x)} aria-label={showLeft?'Hide left menu':'Show left menu'} title={showLeft?'Hide menu':'Show menu'} style={{left:showLeft?'min(404px, calc(100vw - 44px))':'4px'}} className="absolute top-[84px] z-[600] hidden h-10 w-8 items-center justify-center rounded-xl border border-white/10 bg-ink/90 text-slate-300 shadow-xl backdrop-blur transition-all hover:border-emeraldx/50 hover:text-emeraldx lg:flex">{showLeft?<ChevronLeft size={18}/>:<ChevronRight size={18}/>}</button>
    <button onClick={()=>setShowRight(x=>!x)} aria-label={showRight?'Hide right menu':'Show right menu'} title={showRight?'Hide menu':'Show menu'} style={{right:showRight?'304px':'4px'}} className="absolute top-[84px] z-[600] hidden h-10 w-8 items-center justify-center rounded-xl border border-white/10 bg-ink/90 text-slate-300 shadow-xl backdrop-blur transition-all hover:border-emeraldx/50 hover:text-emeraldx lg:flex">{showRight?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button>
    {mapClickMode&&<div className="absolute left-1/2 top-[76px] z-[600] flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-xl border border-emeraldx/40 bg-ink/95 px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur"><MapPin size={15} className="text-emeraldx"/>Tap the map to set {mapClickMode}<button onClick={()=>togglePin(mapClickMode)} className="text-slate-400 hover:text-white">Cancel</button></div>}
    {routeError&&<div role="status" className="absolute left-2 right-2 top-[76px] z-[600] max-w-xs lg:left-auto lg:bottom-4 lg:right-4 lg:top-auto rounded-xl border border-amberx/30 bg-ink/95 p-3 text-[10px] leading-4 text-amberx shadow-xl">{routeError}</div>}
  </div>
}
const paths=['/','/vehicle','/location','/route']
const defaultVehicleConfig={category:'',model:'',modified:false,energy:'',capacity:'',consumption:'',level:100,customName:''}
const loadVehicleConfig=()=>{
  try{return {...defaultVehicleConfig,...JSON.parse(localStorage.getItem('smartroute-vehicle-config')||'{}')}}
  catch{return defaultVehicleConfig}
}
const stepFromPath=()=>{
  const clean=window.location.pathname.replace(/\/+$/,'')||'/'
  const i=paths.indexOf(clean)
  return i===-1?0:i
}
export default function App(){
  const [step,setStepState]=useState(stepFromPath)
  const [config,setConfig]=useState(loadVehicleConfig)
  const [initialLocation,setInitialLocation]=useState(null)
  const hasVehicleConfig=config.capacity>0&&config.consumption>0
  const initialPathStep=stepFromPath()
  const initialHasVehicle=(()=>{const saved=loadVehicleConfig();return saved.capacity>0&&saved.consumption>0})()
  const [gateBackStep,setGateBackStep]=useState(()=>initialPathStep===3&&initialHasVehicle?1:0)
  const setStep=next=>{
    const target=paths[next]
    if(window.location.pathname!==target)window.history.pushState({step:next},'',target)
    setStepState(next)
    window.scrollTo(0,0)
  }
  useEffect(()=>{
    // Normalize unknown paths (e.g. /foo) back to the root URL
    const known=paths.includes(window.location.pathname.replace(/\/+$/,'')||'/')
    if(!known)window.history.replaceState({step:0},'','/')
    const onPop=()=>setStepState(stepFromPath())
    window.addEventListener('popstate',onPop)
    return ()=>window.removeEventListener('popstate',onPop)
  },[])
  useEffect(()=>{
    try{localStorage.setItem('smartroute-vehicle-config',JSON.stringify(config))}catch{}
  },[config])
  useEffect(()=>{
    // A direct /route visit must pass through location before the map can render.
    if(step!==3)return
    if(!initialLocation){
      setGateBackStep(hasVehicleConfig?1:0)
      if(window.location.pathname!=='/location')window.history.replaceState({step:2},'','/location')
      setStepState(2)
    }else if(!hasVehicleConfig){
      if(window.location.pathname!=='/vehicle')window.history.replaceState({step:1},'','/vehicle')
      setStepState(1)
    }
  },[step,initialLocation,hasVehicleConfig])
  useEffect(()=>{
    const titles=['SmartRoute AI — Cambodia Trip Planner','Vehicle profile · SmartRoute AI','Location access · SmartRoute AI','Map & Route · SmartRoute AI']
    const visibleStep=step===3&&!initialLocation?2:step
    document.title=titles[visibleStep]||titles[0]
  },[step,initialLocation])

  const goToMap=(backStep=1)=>{
    if(!hasVehicleConfig){
      if(initialLocation){setStep(1);return}
      setGateBackStep(backStep);setStep(2);return
    }
    if(initialLocation){setStep(3);return}
    setGateBackStep(backStep);setStep(2)
  }
  const startSmartRoute=()=>{
    setGateBackStep(0)
    if(initialLocation){setStep(1);return}
    setStep(2)
  }
  const finishLocation=location=>{
    setInitialLocation(location)
    setStep(1)
  }
  const visibleStep=step===3&&!initialLocation?2:step
  return visibleStep===0
    ?<Welcome onStart={startSmartRoute} onRoute={()=>goToMap(0)}/>
    :visibleStep===1
      ?<Setup onBack={()=>setStep(0)} onGenerate={()=>goToMap(1)} config={config} setConfig={setConfig}/>
      :visibleStep===2
        ?<LocationGate onSuccess={finishLocation} onBack={()=>setStep(gateBackStep)}/>
        :<TripPlanner config={config} initialLocation={initialLocation} onChangeVehicle={()=>setStep(1)}/>
}
