import React,{useState} from 'react'
import {api} from '../services/api'

export default function ArchiveClues({surname}){
  const [items,setItems]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
  async function search(){
    setBusy(true);setError('')
    try{setItems(await (await api('/research/search?q='+encodeURIComponent(surname))).json())}
    catch{setError('El fondo documental local no respondió. Puedes volver a intentarlo.')}
    finally{setBusy(false)}
  }
  return <section className="archive-clues"><h2>Ampliar la investigación</h2>
    <button disabled={busy} onClick={search}>{busy?'Buscando pasajes…':'Buscar '+surname+' en mis documentos'}</button>
    {error&&<p role="alert">{error}</p>}
    {items&&<p role="status">{items.length?items.length+' pasajes sugeridos por afinidad. Comprueba el nombre y el contexto antes de relacionar dos lugares.':'El fondo local no devolvió pasajes para esta consulta.'}</p>}
    {items?.map(p=><details key={p.source_id+':'+p.seq}><summary>{p.title} · {p.locator}</summary><p>{p.body}</p><a href={'/api/research/sources/'+p.source_id+'/original'}>Consultar documento original ↗</a></details>)}
  </section>
}
