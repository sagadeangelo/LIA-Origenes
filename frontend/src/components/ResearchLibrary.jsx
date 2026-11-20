import React, {useEffect, useState} from 'react'
import Notice from './layout/Notice'
import ArchiveIcon from './layout/ArchiveIcon'
import WikidataSurname from './WikidataSurname'
import InternetArchiveShelf from './InternetArchiveShelf'
import '../styles/library.css'

const countries={MX:'México',ES:'España',PT:'Portugal',AR:'Argentina',BR:'Brasil',CO:'Colombia',PE:'Perú',CL:'Chile'}
const panels=[['catalog','Catálogo abierto'],['local','Fondo local'],['research','Investigación con IA'],['wikidata','Wikidata'],['route','Rutas']]

async function research(path, options) {
  const response=await fetch('/api/research/'+path,options)
  if (!response.ok) {
    const error=await response.json().catch(()=>({}))
    throw new Error(typeof error.detail==='string'?error.detail:'Revisa los datos e inténtalo de nuevo.')
  }
  return response.json()
}

function Passages({items}) {
  return <ol className="lia-citations">{items.map(p=><li className="lia-document" key={p.source_id+'-'+p.seq}>
    <div className="lia-document-meta">{p.locator} · fragmento {p.seq}</div><h4>{p.title}</h4>
    <details className="passage-reader" open><summary>Leer fragmento citado</summary><blockquote>{p.body}</blockquote></details>
    {p.entities?.length>0&&<details><summary>Entidades detectadas</summary>
      <ul>{p.entities.map((e,i)=><li key={i}>{e.tipo} · {e.texto}</li>)}</ul></details>}
    <a className="lia-original" href={'/api/research/sources/'+p.source_id+'/original'}>Consultar original</a>
  </li>)}</ol>
}

function LocalCollection({sources,loadError,busy,upload,openResearch}) {
  return <section className="lia-library-pane"><h3>Fondo documental local</h3>
    <button type="button" onClick={openResearch}>Buscar pasajes por significado</button>
    <details className="lia-tools"><summary>Importar obra</summary>
      <form onSubmit={upload}><fieldset disabled={busy}><legend>Datos de la obra</legend>
        <label>Archivo PDF, TXT, Markdown o DOCX (hasta 24 MiB)<input type="file" name="file" accept=".pdf,.txt,.md,.docx" required/></label>
        <div className="lia-form-grid"><label>Tipo de fuente<select name="category">
          {['Libro histórico','Diccionario','Armorial','Registro genealógico'].map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Título opcional<input name="title" maxLength={300}/></label>
          <label>Autor opcional<input name="author" maxLength={300}/></label></div>
        <button>Importar e indexar</button></fieldset></form>
    </details>
    {sources===null && !loadError && <p role="status">Cargando inventario de obras…</p>}
    {sources!==null&&<><h4>Obras importadas ({sources.length})</h4>
      {sources.length===0?<p>Tu fondo local aún está vacío. Puedes incorporar tu primer documento en «Importar obra».</p>:
      <div className="lia-document-grid">{sources.map(s=><article key={s.id} className="lia-document">
        <span className="lia-document-meta">{s.category}</span><h4>{s.title}</h4>{s.author&&<p>{s.author}</p>}
        {s.created_at&&<p>Incorporación · <time dateTime={s.created_at}>{String(s.created_at).slice(0,10)}</time></p>}
        <a className="lia-original" href={'/api/research/sources/'+s.id+'/original'}>Consultar original</a>
      </article>)}</div>}</>}
  </section>
}

function ResearchDesk({results,busy,onSearch}){
  return <section className="lia-library-pane"><h3>Investigación asistida por IA</h3>
    <p>Formula una pregunta para recuperar pasajes por similitud en tus obras importadas.</p>
    <form className="lia-library-search" onSubmit={onSearch}>
      <label>Buscar pasajes por significado<input type="search" name="q" required minLength={2} maxLength={500} placeholder="Viajes y asentamientos en México"/></label>
      <button disabled={busy}>Buscar en las obras</button>
    </form>
    {results&&<><h4>Pasajes por similitud</h4>{results.length?<Passages items={results}/>:<p>No se recuperaron pasajes. Comprueba las obras del fondo local.</p>}</>}
    <Notice>La similitud orienta la lectura. Verifica el fragmento y su localizador en la obra original antes de establecer vínculos familiares.</Notice>
  </section>
}

export default function ResearchLibrary({surname}) {
  const [open,setOpen]=useState(false),[panel,setPanel]=useState('catalog')
  const [sources,setSources]=useState(null),[results,setResults]=useState(null),[route,setRoute]=useState(null)
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('')
  const [country,setCountry]=useState(()=>{
    const region=navigator.language?.match(/-([A-Z]{2})(?:-|$)/)?.[1]
    return countries[region]?region:''
  })

  useEffect(()=>{
    if (!open || panel!=='local') return
    const controller=new AbortController()
    research('sources',{signal:controller.signal}).then(value=>{if(!controller.signal.aborted)setSources(value)})
      .catch(err=>{if(!controller.signal.aborted)setError(err.message)})
    return ()=>controller.abort()
  },[open,panel])

  async function run(work){
    setBusy(true);setError('');setMessage('')
    try{await work()}catch(e){setError(e instanceof TypeError?'La aplicación no pudo conectarse. Reintenta la consulta.':e.message)}finally{setBusy(false)}
  }
  function upload(event){
    event.preventDefault()
    const form=event.currentTarget, data=new FormData(form)
    run(async()=>{
      const info=await research('sources',{method:'POST',body:data,headers:{'X-Origenes-Import':'local'}})
      setSources(await research('sources'));form.reset()
      setMessage(info.duplicate?'Esta obra ya está en la biblioteca.':'Fragmentos indexados: '+info.passages+'.')
    })
  }
  function changePanel(value){setPanel(value);setError('');setMessage('')}
  return <section className="lia-library" id="biblioteca" aria-label="Biblioteca documental">
    <button className="lia-library-gate" type="button" aria-expanded={open} aria-controls="lia-library-content"
      onClick={()=>setOpen(!open)} disabled={busy}><span className="lia-gate-mark"><ArchiveIcon name="book"/></span>
      <span className="library-inscription">Biblioteca documental y rutas<small>Catálogo abierto · Fondo local · Mesa de investigación</small></span><span className="lia-disclosure" aria-hidden="true">{open?'−':'+'}</span></button>
    {open&&<div className="lia-library-body" id="lia-library-content">
      <nav className="lia-library-nav" aria-label="Secciones de la biblioteca">{panels.map(([key,title])=>
        <button type="button" key={key} aria-pressed={key===panel} disabled={busy} onClick={()=>changePanel(key)}>{title}</button>)}</nav>
      {panel==='catalog'&&<InternetArchiveShelf key={surname||''} surname={surname}/>}
      {panel==='wikidata'&&<div className="lia-library-pane"><WikidataSurname surname={surname}/></div>}
      {panel==='local'&&<LocalCollection sources={sources} loadError={error} busy={busy} upload={upload} openResearch={()=>changePanel('research')}/>}
      {panel==='research'&&<ResearchDesk results={results} busy={busy} onSearch={e=>{
        e.preventDefault();const q=new FormData(e.currentTarget).get('q');setResults(null)
        run(async()=>setResults(await research('search?q='+encodeURIComponent(q))))
      }}/>}
      {panel==='route'&&<section className="lia-library-pane"><h3>Ruta de investigación</h3>
        {surname?<><p>Desde la ficha de {surname}, elige el país donde quieres continuar la búsqueda. El idioma del navegador puede sugerir un país.</p>
          <div className="lia-library-search"><label>País de destino<select value={country} onChange={e=>{setCountry(e.target.value);setRoute(null)}}>
            <option value="">Elige un país</option>{Object.entries(countries).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
          <button disabled={!country||busy} onClick={()=>run(async()=>setRoute({...await research('route?surname='+encodeURIComponent(surname)+'&country='+country),surname,country}))}>Trazar ruta documental</button></div>
          {route?.surname===surname&&route.country===country&&<div className="route-record"><h4>Mapa de investigación</h4>
            <ol className="route-diagram" aria-label="Lugares relacionados"><li><small>Lugar de la ficha</small><a href={route.reference} target="_blank" rel="noreferrer">{route.origin}</a></li>
              <li><small>Destino de búsqueda</small><strong>{route.destination}</strong></li></ol>
            <Notice>Itinerario hipotético. La coincidencia de un apellido y un país en una obra requiere contraste documental.</Notice>
            <h4>Cronología</h4><p>La consulta no aporta fechas verificadas de desplazamiento.</p>
            <h4>Documentos asociados</h4>
            {route.passages.length?<Passages items={route.passages}/>:<p>Sin pasajes que mencionen juntos el apellido y el destino.</p>}</div>}</>:<p>Selecciona una ficha de apellido en el atlas para trazar la ruta.</p>}
      </section>}
      <Notice kind={busy?'busy':'success'}>{busy?'Procesando la consulta documental…':message}</Notice>
      <Notice kind="error">{error}</Notice>
    </div>}
  </section>
}
