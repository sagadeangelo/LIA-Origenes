import React, {useState} from 'react'

const countries={MX:'México',ES:'España',PT:'Portugal',AR:'Argentina',BR:'Brasil',CO:'Colombia',PE:'Perú',CL:'Chile'}

async function research(path, options) {
  const response=await fetch('/api/research/'+path,options)
  if (!response.ok) {
    const error=await response.json().catch(()=>({}))
    throw new Error(typeof error.detail==='string'?error.detail:'Revisa los datos e inténtalo de nuevo.')
  }
  return response.json()
}

function Passages({items}) {
  return <ol className="citations">{items.map(p=><li key={p.source_id+'-'+p.seq}>
    <strong>{p.title}</strong> · {p.locator}, fragmento {p.seq}
    <blockquote>{p.body}</blockquote>
    {p.entities?.length>0&&<details><summary>Entidades detectadas</summary>
      <ul>{p.entities.map((e,i)=><li key={i}>{e.tipo} · {e.texto}</li>)}</ul></details>}
    <a href={'/api/research/sources/'+p.source_id+'/original'}>Consultar original</a>
  </li>)}</ol>
}

export default function ResearchLibrary({surname}) {
  const [open,setOpen]=useState(false),[sources,setSources]=useState([])
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('')
  const [results,setResults]=useState(null),[route,setRoute]=useState(null)
  const [country,setCountry]=useState(()=>{
    const region=navigator.language?.match(/-([A-Z]{2})(?:-|$)/)?.[1]
    return countries[region]?region:''
  })
  async function run(work){
    setBusy(true);setError('');setMessage('')
    try{await work()}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  async function list(){setSources(await research('sources'))}
  function toggle(){
    setOpen(!open)
    if(!open)run(list)
  }
  function upload(event){
    event.preventDefault()
    const form=event.currentTarget, data=new FormData(form)
    run(async()=>{
      const info=await research('sources',{method:'POST',body:data,headers:{'X-Origenes-Import':'local'}})
      await list();form.reset()
      setMessage(info.duplicate?'Esta obra ya está en la biblioteca.':info.passages+' fragmentos indexados.')
    })
  }
  return <section className="research">
    <button type="button" aria-expanded={open} onClick={toggle} disabled={busy}>Biblioteca documental y rutas</button>
    {open&&<div className="parchment"><h2>Biblioteca documental</h2>
      <form onSubmit={upload}><fieldset disabled={busy}><legend>Importar obra</legend>
        <label>Archivo PDF, TXT, Markdown o DOCX (hasta 24 MiB)<input type="file" name="file" accept=".pdf,.txt,.md,.docx" required/></label>
        <label>Tipo de fuente<select name="category">{['Libro histórico','Diccionario','Armorial','Registro genealógico'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Título opcional<input name="title" maxLength={300}/></label>
        <label>Autor opcional<input name="author" maxLength={300}/></label>
        <button>Importar e indexar</button></fieldset></form>
      {sources.length>0&&<details><summary>Obras importadas ({sources.length})</summary><ul>{sources.map(s=><li key={s.id}>
        <a href={'/api/research/sources/'+s.id+'/original'}>{s.title}</a> · {s.author||'Autor sin identificar'} · {s.category}
      </li>)}</ul></details>}
      <form onSubmit={e=>{e.preventDefault();const q=new FormData(e.currentTarget).get('q');setResults(null)
        run(async()=>setResults(await research('search?q='+encodeURIComponent(q))))}}>
        <label>Buscar pasajes por significado<input name="q" required minLength={2} maxLength={500} placeholder="Viajes y asentamientos en México"/></label>
        <button disabled={busy}>Buscar en las obras</button></form>
      {results&&<><h3>Pasajes por similitud</h3>{results.length?<Passages items={results}/>:<p>La biblioteca aún no contiene pasajes.</p>}</>}
      <h3>Ruta de investigación</h3>
      {surname?<><p>Desde la ficha de {surname}, elige el país donde quieres continuar la búsqueda. El idioma del navegador puede sugerir un país.</p>
        <label>País de destino<select value={country} onChange={e=>{setCountry(e.target.value);setRoute(null)}}>
          <option value="">Elige un país</option>{Object.entries(countries).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
        <button disabled={!country||busy} onClick={()=>run(async()=>setRoute({...await research('route?surname='+encodeURIComponent(surname)+'&country='+country),surname,country}))}>Trazar ruta documental</button>
        {route?.surname===surname&&route.country===country&&<div><p><a href={route.reference} target="_blank" rel="noreferrer">{route.origin}</a> → {route.destination}</p>
          <p>El destino orienta tu investigación. Una mención conjunta del apellido y el país requiere contrastarse con el original para demostrar una migración.</p>
          {route.passages.length?<Passages items={route.passages}/>:<p>Sin pasajes que mencionen juntos el apellido y el destino.</p>}</div>}</>:<p>Selecciona una ficha de apellido en el atlas para trazar la ruta.</p>}
      <p role="status">{busy?'Procesando la consulta documental…':message}</p>{error&&<p role="alert">{error}</p>}
    </div>}</section>
}
