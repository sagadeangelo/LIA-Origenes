import React,{useEffect,useRef,useState} from 'react'
import ArchiveIcon from '../components/layout/ArchiveIcon'
import ArchiveClues from './ArchiveClues'
import WorldMap,{ink} from './WorldMap'
import {demo,destinations,research} from './data'
import useChime from './useChime'
import './journey.css'

const short=location.pathname.includes('/breve')
const initial=new URLSearchParams(location.hash.slice(1))
const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Journey() {
  const [first,setFirst]=useState(initial.get('primero')||''),[second,setSecond]=useState(initial.get('segundo')||'')
  const [country,setCountry]=useState(Object.hasOwn(destinations,initial.get('pais'))?initial.get('pais'):'')
  const [rows,setRows]=useState([]),[tab,setTab]=useState(0),[step,setStep]=useState(0)
  const [playing,setPlaying]=useState(false),[bare,setBare]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const [share,setShare]=useState(false)
  const record=rows[tab],end=record?record.points.length+1:0,finished=!!record&&step===end
  const point=record?.points[step-1],heading=useRef(null),sound=useChime()
  const full='/travesia/#'+new URLSearchParams({primero:first,segundo:second,pais:country,seleccion:record?.name||'',continuar:record?.demo?'demo':'1'})
  const [reading,setReading]=useState(true)
  const locating=Boolean(point)&&!reading
  const words=[point?.text,point?.person,point?.source].join(' ').trim().split(/\s+/).length
  const duration=locating?1800:point?Math.max(short?8000:10000,words*(short?370:440)+1500):6000
  const elapsed=useRef(0)
  useEffect(()=>{elapsed.current=0},[record,step,reading])
  useEffect(()=>{
    if(!playing||!record||finished)return
    const started=performance.now()
    const timer=setTimeout(()=>{
      if(locating){setReading(true);return}
      setReading(false);setStep(step+1)
      if(step+1===end)setPlaying(false)
    },Math.max(0,duration-elapsed.current))
    return ()=>{clearTimeout(timer);elapsed.current+=performance.now()-started}
  },[playing,record,finished,step,end,locating,duration,reading])
  useEffect(()=>{if(sound.on&&playing)sound.play()},[step,tab])
  useEffect(()=>{
    const pause=()=>{if(document.hidden)setPlaying(false)}
    document.addEventListener('visibilitychange',pause)
    return ()=>document.removeEventListener('visibilitychange',pause)
  },[])
  function move(i){setPlaying(false);setReading(true);setStep(i)}
  function start(records,preferred){
    setReading(true);setRows(records);setTab(Math.max(0,records.findIndex(r=>r.name===preferred)));setStep(0);setPlaying(!reduce());setError('');setShare(false)
    requestAnimationFrame(()=>heading.current?.focus())
  }
  useEffect(()=>{
    if(initial.get('continuar')==='demo'){start([demo]);return}
    if(initial.get('continuar')==='1'&&first.trim()) submit()
  },[])
  async function submit(e){
    e?.preventDefault()
    if(busy)return
    const names=[first,second].map(n=>n.trim()).filter(Boolean)
    if(!names.length){setError('Escribe al menos un apellido.');return}
    setBusy(true);setError('')
    try {start(await research(names),e?null:initial.get('seleccion'))} catch(e){setError(e.message)} finally{setBusy(false)}
  }
  return <main className={'voyage '+(record?'reading':'welcome')+(short?' voyage-short':'')}>
    <header className="voy-head"><a href="/" className="voy-brand"><ArchiveIcon name="compass"/> LIA Orígenes</a>
      <button onClick={sound.toggle} aria-pressed={sound.on}>Sonido {sound.on?'activo':'apagado'}</button></header>
    {sound.error&&<p role="status">{sound.error}</p>}
    {!record?<div className={'landing '+(bare?'skip-intro':'')}>
      {!bare&&<section className="voy-prologue"><div className="dust" aria-hidden="true"/><div className="voy-globe" aria-hidden="true"/>
        <div className="voy-kicker">{short?'Travesía breve':'Atlas de apellidos'}</div><h1>La travesía<br/><em>de tu apellido.</em></h1>
        <p>Abre el mapa. Sigue las huellas que conservan los documentos.</p>
        <button className="voy-link" onClick={()=>{setBare(true);requestAnimationFrame(()=>document.querySelector('#first-name')?.focus())}}>Saltar introducción ↓</button></section>}
      <form className="departure" onSubmit={submit} aria-busy={busy}>
        <h2>{bare?'La travesía de tu apellido':'¿Qué apellido te trae aquí?'}</h2>
        <div className="voy-fields"><label>Primer apellido<input id="first-name" required maxLength="80" placeholder="Ej. Tovar" value={first} onChange={e=>setFirst(e.target.value)}/></label>
        <label><span>Segundo apellido <small>(opcional)</small></span><input maxLength="80" placeholder="Ej. Amaral" value={second} onChange={e=>setSecond(e.target.value)}/></label></div>
        <label>País de interés<select value={country} onChange={e=>setCountry(e.target.value)}><option value="">Sin elegir</option>{Object.keys(destinations).map(n=><option key={n}>{n}</option>)}</select></label>
        <button className="voy-primary" disabled={busy}>{busy?'Consultando el archivo…':'Comenzar mi travesía'} <span aria-hidden="true">→</span></button>
        {error&&<p role="alert">{error}</p>}
        <button className="voy-link" type="button" disabled={busy} onClick={()=>start([demo])}>Probar el mapa con datos de demostración</button>
      </form></div>:
      <section className="journey-stage">
        <div className="stage-heading"><div><span className="voy-kicker">{record.demo?'Demostración · datos ficticios':'Cuaderno de viaje'}</span><h1 ref={heading} tabIndex="-1">{record.name}</h1></div>
        <button onClick={()=>{setRows([]);setPlaying(false);setShare(false);requestAnimationFrame(()=>document.querySelector('#first-name')?.focus())}}>Nueva búsqueda</button></div>
        {rows.length>1&&<div className="point-index" aria-label="Apellidos investigados">{rows.map((r,i)=><button key={r.name} style={{borderBottom:'3px solid '+ink(r.name,rows)}} aria-pressed={i===tab} onClick={()=>{setTab(i);move(0)}}>{r.name}</button>)}</div>}
        <div className="stage-layout"><WorldMap key={record.name} paused={!playing} onPause={()=>setPlaying(false)} records={rows} record={record} country={country} active={step-1} showDestination={finished} onSelect={(i,r=record)=>{setTab(rows.indexOf(r));move(i+1)}}/>
        <section className="journal" aria-label="Narración"><span className="voy-kicker">{finished?'Fin de la travesía':point?point.period:'Apertura del atlas'}</span>
          <h2>{finished?'¿Dónde seguir buscando?':point?point.place:record.demo?'Ensayo cartográfico':record.points.length?'Las huellas de '+record.name:'Ficha pendiente'}</h2>
          {finished?<><p>{country?'Has elegido '+country+' como país de interés. Puedes comenzar por un archivo local y anotar localidad, fecha y folio.':'Empieza con un acta familiar que indique una fecha y una localidad.'}</p>
            {country&&<small>◇ País elegido por ti · orientación de búsqueda.</small>}</>:
          point?<><p className="stop-count">Pista {step} de {record.points.length}</p>{locating?<p className="locating" role="status">Localizando en el mapa…</p>:<div className="stop-text" key={point.id}><p>{point.text}</p><small>{[point.person,point.certainty].filter(Boolean).join(' · ')}</small>{point.url&&<a href={point.url} target="_blank" rel="noreferrer">{point.source} ↗</a>}</div>}</>:
          <p>{record.demo?'Dos puntos ficticios muestran cómo funciona la animación.':record.points.length?record.connections.length+' tramos documentados. Elige un recorrido para acercarte a sus lugares y leer quién viajó, cuándo y según qué fuente.':record.matches.length?'El catálogo sugiere '+record.matches.join(' y ')+'. Prueba cada apellido en su propio campo.':'El catálogo actual carece de lugares y documentos para este apellido.'}</p>}
          <div className="progress-strip" aria-hidden="true">{Array.from({length:end+1},(_,i)=><i key={i} className={i<=step?'lit':''}/>)}</div>
          <div className="playback">{finished?<><button onClick={()=>move(step-1)}>Anterior</button><button onClick={()=>{setReading(true);setStep(0);setPlaying(true)}}>Repetir</button></>:<>
            <button onClick={()=>setPlaying(!playing)}>{playing?'Pausar':'Reproducir'}</button>{step>0&&<button onClick={()=>move(step-1)}>Anterior</button>}<button onClick={()=>move(step+1)}>Siguiente</button><button onClick={()=>move(end)}>Saltar al final</button></>}</div>
        </section></div>
        {!record.demo&&<ArchiveClues key={record.name} surname={record.name}/>}
        {short?<a className="voy-primary" href={full}>Explorar mi historia completa →</a>:
          <a className="voy-primary" href={record.points.length&&!record.demo?'/?ficha='+encodeURIComponent(record.name):'/#surname'}>Abrir el archivo de apellidos →</a>}
        <button className="voy-link" aria-expanded={share} onClick={()=>setShare(!share)}>Vista previa para compartir</button>
        {share&&<div className="share-preview"><img alt="La travesía de tu apellido · LIA Orígenes" src="/travesia/portada.jpg"/><a href="/travesia/breve/">Abrir versión breve para Facebook ↗</a><label>Enlace para compartir<input readOnly onFocus={e=>e.target.select()} value={location.origin+'/travesia/breve/'}/></label></div>}
      </section>}
  </main>
}
