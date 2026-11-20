import React, {useEffect, useState} from 'react'
import Notice from './components/layout/Notice'
import EditionCards from './components/payment/EditionCards'
import './styles/experience.css'
import ArchiveIcon from './components/layout/ArchiveIcon'
import ShieldCreator from './components/heraldry/ShieldCreator'
import ParchmentViewer from './components/parchment/ParchmentViewer'
import ResearchLibrary from './components/ResearchLibrary'
import HistoricalMap from './components/map/HistoricalMap'
import {api, file} from './services/api'

export default function App(){
  const [catalog,setCatalog]=useState(null), [query,setQuery]=useState('')
  const [result,setResult]=useState(null), [submitted,setSubmitted]=useState('')
  const [matches,setMatches]=useState([])
  const [order,setOrder]=useState(null), [busy,setBusy]=useState(true), [error,setError]=useState('')
  const [palette,setPalette]=useState('bosque')
  const [feedbackArea,setFeedbackArea]=useState('inicio')
  const [notice,setNotice]=useState('')
  const [section,setSection]=useState(null)
  const sections = [
    ['shield', 'Escudo de armas', 'El Legado heráldico incluye un escudo artístico inspirado en tu apellido y un informe en PDF.'],
    ['book', 'Historia del apellido', 'Consulta el origen del nombre, las variantes de escritura y la fuente de cada ficha.'],
    ['atlas', 'Raíces geográficas', 'Selecciona Viseu o Tobar en el mapa para explorar el lugar asociado al apellido.'],
    ['dna', 'Explora tu ADN', 'El atlas explora apellidos mediante fuentes históricas. Los datos genéticos personales quedan fuera del catálogo actual.']
  ]
  async function run(action, message='Procesando…', area='inicio'){
    setFeedbackArea(area); setBusy(true); setNotice(message); setError('')
    try {await action()} catch(e){setError(e.message)} finally {setBusy(false);setNotice('')}
  }
  useEffect(()=>{run(async()=>{
    setCatalog(await (await api('/catalog')).json())
    const id=sessionStorage.getItem('origenes.order')
    if(id) await refresh(id)
    const ficha=new URLSearchParams(location.search).get('ficha')
    if(ficha) await search(ficha.slice(0,80))
  })},[])
  async function search(name){
    const term=name.trim()
    if (!term) {
      setFeedbackArea('inicio'); setError('Escribe un apellido para comenzar.')
      return
    }
    setResult(null); setMatches([]); setSubmitted('')
    await run(async()=>{
      const data=await (await api('/surnames?q='+encodeURIComponent(term))).json()
      if(data.result) setPalette(data.result.name==='Amaral'?'bosque':'carmesi')
      setResult(data.result); setMatches(data.matches || []); setSubmitted(term); setQuery(term)
      if(data.result) requestAnimationFrame(()=>document.getElementById('record-title')?.focus())
    }, 'Buscando en el archivo…')
  }
  function explore(index) {
    const targets=['workshop-title','record-title','expedition-title']
    if(result && index < targets.length){
      setSection(null)
      document.getElementById(targets[index])?.focus()
      return
    }
    setSection(section===index?null:index)
  }
  async function refresh(id){
    setOrder(await (await api('/orders/'+id,{},true)).json())
  }
  async function buy(product){
    await run(async()=>{
      const storage='origenes.attempt.'+result.name+'.'+product+(product==='legado'?'.'+palette:'')
      const attempt=sessionStorage.getItem(storage)||crypto.randomUUID()
      sessionStorage.setItem(storage,attempt)
      const response=await api('/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt},
        body:JSON.stringify({surname:result.name,product,...(product==='legado'?{palette}:{})})},true)
      const receipt=await response.json()
      sessionStorage.setItem('origenes.order',receipt.id);setOrder(receipt)
      requestAnimationFrame(()=>document.getElementById('order-title')?.focus())
      if(receipt.status==='closed') sessionStorage.removeItem(storage)
    }, 'Preparando la orden…','ediciones')
  }
  const feedback = area => feedbackArea===area && <><Notice kind="busy">{notice}</Notice><Notice kind="error">{error && <p>{error}</p>}</Notice></>
  return <><a className="skip-link" href="#surname">Saltar al buscador</a>
    <header className="masthead"><div className="frame mast-inner">
      <a className="identity" href="#inicio" aria-label="LIA Orígenes, inicio"><ArchiveIcon name="compass"/><span>LIA <b>Orígenes</b></span></a>
      <nav aria-label="Navegación principal"><a href="#inicio">Inicio</a><a href="#mapa">Atlas histórico</a><a href="#biblioteca">Biblioteca</a></nav>
    </div></header>
    <main id="atlas"><section className="hero" id="inicio" aria-labelledby="hero-title">
      <picture className="hero-art"><source media="(max-width: 620px)" srcSet="/art/sala-movil.webp"/><img src="/art/sala-de-lectura.webp" fetchPriority="high" alt=""/></picture>
      <div className="frame hero-frame"><div className="discovery">
        <p className="eyebrow"><span aria-hidden="true"/> Archivo de apellidos</p>
        <h1 id="hero-title">Tu historia comenzó<br/><i>mucho antes de ti.</i></h1>
        <p className="intro">Cada apellido guarda huellas del pasado. Explora documentos históricos, descubre sus posibles orígenes y comienza el viaje hacia tus raíces.</p>
        <form className="search-form" onSubmit={e=>{e.preventDefault();search(query)}}>
          <label className="sr-only" htmlFor="surname">Busca en el archivo</label>
          <div className="search"><ArchiveIcon name="search"/><input id="surname" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)} placeholder="Escribe el apellido que deseas investigar…" required/>
          <button disabled={busy}>Descubrir mis orígenes <ArchiveIcon name="arrow"/></button></div></form>
        {matches.length>0&&<p role="status">Fichas disponibles para «{submitted}». Elige un apellido.</p>}
        <div className="links suggested">{!matches.length&&<span>Explora</span>}{(matches.length ? matches.map(name=>({name})) : catalog?.surnames)?.map(p=><button disabled={busy} key={p.name} onClick={()=>search(p.name)}>{p.name} ↗</button>)}</div>
        <a className="journey-entry" href="/travesia/">La travesía de tu apellido →</a>
        {feedback('inicio')}
        {error&&!catalog&&<button onClick={()=>location.reload()}>Reintentar carga del atlas</button>}
        {submitted&&!result&&!matches.length&&<Notice><p role="status">El archivo aún no contiene una ficha de «{submitted}».</p></Notice>}
      </div></div></section>
      <div className="frame archive-content"><nav className="explorers" aria-label="Explorar el atlas">{sections.map(([icon,title],i)=>
        <button key={title} aria-expanded={section===i} onClick={()=>explore(i)}>
          <ArchiveIcon name={icon}/><span>{title}</span><span aria-hidden="true" className="chapter-arrow">↗</span></button>)}</nav>
      {section!==null&&<section className="guide"><h2>{sections[section][1]}</h2>{section===3&&<small>Vista conceptual</small>}<p>{sections[section][2]}</p>
        {section!==3&&<div className="links">{catalog?.surnames.map(p=><button key={p.name} disabled={busy} onClick={()=>{search(p.name);setSection(null)}}>Explorar {p.name}</button>)}</div>}
      </section>}
      {result&&catalog&&<section className="parchment">
        <ParchmentViewer record={result} key={result.name}/>
      </section>}
      <HistoricalMap places={catalog?.surnames||[]} selected={result?.name} choose={search} busy={busy}/>
      {result&&catalog&&<section className="exhibit-legacy">
        <ShieldCreator record={result} palette={palette} onChange={setPalette}/>
        <EditionCards catalog={catalog} busy={busy} buy={buy}/>{feedback('ediciones')}</section>}
      {order&&catalog&&<section className="receipt" aria-live="polite"><p className="overline">{order.mode==='demo'?'SIMULACIÓN LOCAL':'SANDBOX MERCADO PAGO'}</p>
        <h2 id="order-title" tabIndex="-1">{catalog.products[order.product].name}</h2><dl className="receipt-facts"><div><dt>Apellido</dt><dd className="capitalize">{order.surname}</dd></div><div><dt>Importe</dt><dd>${Number(order.amount)} MXN</dd></div><div><dt>Estado de la orden</dt><dd>{{pending:'Pendiente de pago',paid:'Pago acreditado',closed:'Orden cerrada'}[order.status]||order.status}</dd></div></dl>{feedback('orden')}
        {order.status==='pending'&&order.mode==='demo'&&<button disabled={busy} onClick={()=>run(async()=>setOrder(await (await api('/orders/'+order.id+'/simulate',{method:'POST'},true)).json()),'Validando simulación…','orden')}>Simular pago aprobado</button>}
        {order.status==='pending'&&order.checkout&&<a className="button" href={order.checkout} target="_blank" rel="noreferrer">Abrir Checkout Pro ↗</a>}
        {order.mode==='sandbox'&&<button disabled={busy} onClick={()=>run(()=>refresh(order.id),'Consultando la orden…','orden')}>Verificar estado</button>}
        {order.status==='paid'&&<><Notice kind="success">Tus archivos están disponibles para descargar.</Notice><button disabled={busy} onClick={()=>run(()=>file(order,'pdf'),'Preparando el PDF…','orden')}>Descargar pergamino PDF</button>
          {order.product==='legado'&&<button disabled={busy} onClick={()=>run(()=>file(order,'svg'),'Preparando el SVG…','orden')}>Descargar escudo SVG</button>}</>}
      </section>}
      <ResearchLibrary surname={result?.name}/>
      </div>
    </main><footer className="site-foot"><div className="frame"><a className="identity" href="#inicio"><ArchiveIcon name="compass"/><span>LIA Orígenes</span></a><a href="#inicio">Volver al inicio ↑</a></div></footer></>
}
