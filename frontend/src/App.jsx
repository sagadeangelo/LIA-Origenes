import React, {useEffect, useState} from 'react'
import ShieldCreator from './components/heraldry/ShieldCreator'
import ParchmentViewer from './components/parchment/ParchmentViewer'
import HistoricalMap from './components/map/HistoricalMap'
import {api, file} from './services/api'

export default function App(){
  const [catalog,setCatalog]=useState(null), [query,setQuery]=useState('')
  const [result,setResult]=useState(null), [submitted,setSubmitted]=useState('')
  const [matches,setMatches]=useState([])
  const [order,setOrder]=useState(null), [busy,setBusy]=useState(true), [error,setError]=useState('')
  const [palette,setPalette]=useState('bosque')
  const [notice,setNotice]=useState('')
  const [section,setSection]=useState(null)
  const sections = [
    ['⚜', 'Escudo de armas', 'El Legado heráldico incluye un escudo artístico inspirado en tu apellido y un informe en PDF.'],
    ['❧', 'Historia del apellido', 'Consulta el origen del nombre, las variantes de escritura y la fuente de cada ficha.'],
    ['✥', 'Raíces geográficas', 'Selecciona Viseu o Tobar en el mapa para explorar el lugar asociado al apellido.'],
    ['⚭', 'Explora tu ADN', 'El atlas explora apellidos mediante fuentes históricas. Los datos genéticos personales quedan fuera del catálogo actual.']
  ]
  async function run(action, message='Procesando…'){
    setBusy(true); setNotice(message); setError('')
    try {await action()} catch(e){setError(e.message)} finally {setBusy(false);setNotice('')}
  }
  useEffect(()=>{run(async()=>{
    setCatalog(await (await api('/catalog')).json())
    const id=sessionStorage.getItem('origenes.order')
    if(id) await refresh(id)
  })},[])
  async function search(name){
    const term=name.trim()
    if (!term) {
      setError('Escribe un apellido para comenzar.')
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
    })
  }
  return <><header><div className="identity"><span aria-hidden="true" className="crest">⚜</span><div><strong>LIA Orígenes</strong><small>Genealogía · Historia · Heráldica</small></div></div>
      <span className="atlas-label">Atlas de apellidos</span></header>
    <main id="atlas"><section className="hero"><HistoricalMap places={catalog?.surnames||[]} selected={result?.name} choose={search} busy={busy}/>
      <div className="discovery"><h1>Tu linaje te está <i>esperando.</i></h1>
      <p className="intro">Descubre el origen, la historia y el legado de tu apellido.</p>
      <form onSubmit={e=>{e.preventDefault();search(query)}}><label htmlFor="surname">Busca en el archivo</label>
        <div className="search"><input id="surname" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)} placeholder="Ej. Tovar Amaral" required/><button disabled={busy}>Descubrir</button></div></form>
      {matches.length > 0 && <p role="status">Fichas disponibles para «{submitted}». Elige un apellido.</p>}
      <div className="links">{(matches.length ? matches.map(name=>({name})) : catalog?.surnames)?.map(p=><button disabled={busy} key={p.name} onClick={()=>search(p.name)}>{p.name} ↗</button>)}</div></div>
      </section>
      <nav className="explorers" aria-label="Explorar el atlas">{sections.map(([icon,title],i)=>
        <button key={title} aria-expanded={section===i} onClick={()=>setSection(section===i?null:i)}>
          <span aria-hidden="true">{icon}</span>{title}</button>)}</nav>
      {section!==null&&<section className="guide"><h2>{sections[section][1]}</h2><p>{sections[section][2]}</p>
        {section!==3&&<div className="links">{catalog?.surnames.map(p=><button key={p.name} disabled={busy} onClick={()=>{search(p.name);setSection(null)}}>Explorar {p.name}</button>)}</div>}
      </section>}
      {error&&<div role="alert"><p>{error}</p>{!catalog&&<button onClick={()=>location.reload()}>Reintentar carga del atlas</button>}</div>}{submitted && !result && !matches.length &&<p role="status">El archivo aún no contiene una ficha de «{submitted}».</p>}
      <p role="status" className="activity">{notice}</p>
      {result&&catalog&&<section className="parchment">
        <ParchmentViewer record={result} key={result.name}/>
        <ShieldCreator record={result} palette={palette} onChange={setPalette}/>
        <div className="products">{Object.entries(catalog.products).map(([key,p])=><article key={key}><h3>{p.name}</h3>
          <p>{key==='legado'?'Informe PDF y escudo artístico en SVG.':'Informe PDF con contexto histórico y fuente.'}</p>
          <button disabled={busy} onClick={()=>buy(key)}>{catalog.mode==='demo'?'Probar':'Solicitar'} por ${Number(p.amount)} MXN</button></article>)}</div></section>}
      {order&&catalog&&<section className="receipt" aria-live="polite"><p className="overline">{order.mode==='demo'?'SIMULACIÓN LOCAL':'SANDBOX MERCADO PAGO'}</p>
        <h2 id="order-title" tabIndex="-1">{catalog.products[order.product].name}</h2><p className="capitalize">{order.surname} · ${Number(order.amount)} MXN · {{pending:'Pendiente de pago',paid:'Pago acreditado',closed:'Orden cerrada'}[order.status]}</p>
        {order.status==='pending'&&order.mode==='demo'&&<button disabled={busy} onClick={()=>run(async()=>setOrder(await (await api('/orders/'+order.id+'/simulate',{method:'POST'},true)).json()))}>Simular pago aprobado</button>}
        {order.status==='pending'&&order.checkout&&<a className="button" href={order.checkout} target="_blank" rel="noreferrer">Abrir Checkout Pro ↗</a>}
        {order.mode==='sandbox'&&<button disabled={busy} onClick={()=>run(()=>refresh(order.id))}>Verificar estado</button>}
        {order.status==='paid'&&<><button disabled={busy} onClick={()=>run(()=>file(order,'pdf'))}>Descargar pergamino PDF</button>
          {order.product==='legado'&&<button disabled={busy} onClick={()=>run(()=>file(order,'svg'))}>Descargar escudo SVG</button>}</>}
      </section>}
    </main><footer>LIA Orígenes <span>Historia de apellidos y heráldica artística</span></footer></>
}
