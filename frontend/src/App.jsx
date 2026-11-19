import React, {useEffect, useState} from 'react'
import HistoricalMap from './components/map/HistoricalMap'
import {api, file} from './services/api'

export default function App(){
  const [catalog,setCatalog]=useState(null), [query,setQuery]=useState('')
  const [result,setResult]=useState(null), [submitted,setSubmitted]=useState('')
  const [matches,setMatches]=useState([])
  const [order,setOrder]=useState(null), [busy,setBusy]=useState(true), [error,setError]=useState('')
  async function run(action){
    setBusy(true); setError('')
    try {await action()} catch(e){setError(e.message)} finally {setBusy(false)}
  }
  useEffect(()=>{run(async()=>{
    setCatalog(await (await api('/catalog')).json())
    const id=sessionStorage.getItem('origenes.order')
    if(id) await refresh(id)
  })},[])
  async function search(name){
    const term=name.trim()
    if (!term) return
    await run(async()=>{
      const data=await (await api('/surnames?q='+encodeURIComponent(term))).json()
      setResult(data.result); setMatches(data.matches || []); setSubmitted(term); setQuery(term)
    })
  }
  async function refresh(id){
    setOrder(await (await api('/orders/'+id,{},true)).json())
  }
  async function buy(product){
    await run(async()=>{
      const storage='origenes.attempt.'+result.name+'.'+product
      const attempt=sessionStorage.getItem(storage)||crypto.randomUUID()
      sessionStorage.setItem(storage,attempt)
      const response=await api('/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt},
        body:JSON.stringify({surname:result.name,product})},true)
      const receipt=await response.json()
      sessionStorage.setItem('origenes.order',receipt.id);setOrder(receipt)
      if(receipt.status==='closed') sessionStorage.removeItem(storage)
    })
  }
  return <><header><span className="brand">✥ &nbsp; LIA Orígenes</span><span>Atlas de apellidos</span></header>
    <main><section className="hero"><div><p className="overline">ARCHIVO ONOMÁSTICO</p><h1>El atlas de<br/><i>los apellidos</i></h1>
      <p className="intro">Explora los lugares y las fuentes que guardan la historia de un apellido.</p>
      <form onSubmit={e=>{e.preventDefault();search(query)}}><label htmlFor="surname">Busca en el archivo</label>
        <div className="search"><input id="surname" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)} placeholder="Ej. Tovar Amaral" required/><button disabled={busy}>Buscar</button></div></form>
      {matches.length > 0 && <p role="status">Fichas disponibles para «{submitted}». Elige un apellido.</p>}
      <div className="links">{(matches.length ? matches.map(name=>({name})) : catalog?.surnames)?.map(p=><button disabled={busy} key={p.name} onClick={()=>search(p.name)}>{p.name} ↗</button>)}</div></div>
      <HistoricalMap places={catalog?.surnames||[]} selected={result?.name} choose={search} busy={busy}/></section>
      {error&&<p role="alert">{error}</p>}{submitted && !result && !matches.length &&<p role="status">El archivo aún no contiene una ficha de «{submitted}».</p>}
      {result&&<section className="parchment"><p className="overline">{result.region} · {result.place}</p><h2>{result.name}</h2>
        <p>{result.summary}</p><a href={result.url} target="_blank" rel="noreferrer">{result.source} ↗</a>
        <div className="products">{Object.entries(catalog.products).map(([key,p])=><article key={key}><h3>{p.name}</h3>
          <p>{key==='legado'?'Informe PDF y escudo artístico en SVG.':'Informe PDF con contexto histórico y fuente.'}</p>
          <button disabled={busy} onClick={()=>buy(key)}>{catalog.mode==='demo'?'Probar':'Solicitar'} por ${Number(p.amount)} MXN</button></article>)}</div></section>}
      {order&&<section className="receipt" aria-live="polite"><p className="overline">{order.mode==='demo'?'SIMULACIÓN LOCAL':'SANDBOX MERCADO PAGO'}</p>
        <h2>{catalog.products[order.product].name}</h2><p className="capitalize">{order.surname} · ${Number(order.amount)} MXN · {{pending:'Pendiente de pago',paid:'Pago acreditado',closed:'Orden cerrada'}[order.status]}</p>
        {order.status==='pending'&&order.mode==='demo'&&<button disabled={busy} onClick={()=>run(async()=>setOrder(await (await api('/orders/'+order.id+'/simulate',{method:'POST'},true)).json()))}>Simular pago aprobado</button>}
        {order.status==='pending'&&order.checkout&&<a className="button" href={order.checkout} target="_blank" rel="noreferrer">Abrir Checkout Pro ↗</a>}
        {order.mode==='sandbox'&&<button disabled={busy} onClick={()=>run(()=>refresh(order.id))}>Verificar estado</button>}
        {order.status==='paid'&&<><button disabled={busy} onClick={()=>run(()=>file(order,'pdf'))}>Descargar pergamino PDF</button>
          {order.product==='legado'&&<button disabled={busy} onClick={()=>run(()=>file(order,'svg'))}>Descargar escudo SVG</button>}</>}
      </section>}
    </main><footer>LIA Orígenes <span>Historia de apellidos y heráldica artística</span></footer></>
}
