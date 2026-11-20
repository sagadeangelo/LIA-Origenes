import Notice from './layout/Notice'
import React, {useEffect, useRef, useState} from 'react'

const categories = {
  documento_historico: 'Documento histórico',
  genealogia_y_linaje: 'Genealogía y linaje',
  contexto_historico: 'Contexto histórico',
  coincidencia_nominal: 'Coincidencia nominal'
}

const dateYear = (date) => String(date || '').match(/^\s*(\d{4})(?=$|[-–/.,\s])/)?.[1]
const displayDate = (date) => String(date || '').replace(/T00:00:00(?:\.000)?Z$/, '')
const archiveUrl = (record) => /^https:\/\/archive\.org\/details\/[A-Za-z0-9_.-]+$/.test(record.url || '') ? record.url : null

function DocumentCard({record}) {
  const original = archiveUrl(record)
  return <article className="lia-document archive-piece" id={'obra-'+record.id} tabIndex="-1">
    <div className="lia-document-meta"><span>{categories[record.categoria_documental] || 'Registro bibliográfico'}</span>
      <span>{displayDate(record.fecha) || 'Sin fecha consignada'}</span></div>
    <h4>{record.titulo}</h4>
    {record.autor && <p className="lia-author">{record.autor}</p>}
    <dl className="lia-facts">
      <div><dt>Fuente</dt><dd>{record.fuente || 'Internet Archive'}</dd></div>
      <div><dt>Relevancia</dt><dd>{record.relevancia || 'Sin clasificar'}</dd></div>
      <div><dt>Verificación</dt><dd className="archive-review">Pendiente</dd></div>
    </dl>
    {original ? <a className="lia-original" href={original} target="_blank" rel="noreferrer">Abrir registro original <span aria-hidden="true">↗</span></a> : <Notice>Documento original sin enlace disponible.</Notice>}
  </article>
}

function BibliographyTimeline({records}) {
  const dated = records.map(record => ({record,year:dateYear(record.fecha)}))
    .filter(item => item.year)
    .sort((left,right) => Number(left.year)-Number(right.year))
  if (!dated.length) return null
  return <details className="lia-timeline"><summary>Cronología de las obras ({dated.length})</summary>
    <p>Fechas del catálogo. La verificación documental de estas coincidencias sigue pendiente.</p>
    <ol aria-label="Obras por fecha de catálogo">{dated.map(({record,year})=><li key={record.id}>
      <time dateTime={year}>{year}</time><a href={'#obra-'+record.id}>{record.titulo}</a>
    </li>)}</ol>
  </details>
}

export default function InternetArchiveShelf({surname}) {
  const [query,setQuery]=useState(surname || '')
  const [data,setData]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [category,setCategory]=useState('')
  const [relevance,setRelevance]=useState('')
  const request=useRef(null)
  useEffect(()=>()=>request.current?.abort(),[])

  async function submit(event) {
    event.preventDefault()
    const term=query.trim()
    if (term.length<2 || term.length>80) {setError('Escribe un apellido de 2 a 80 caracteres.');return}
    request.current?.abort()
    const controller=new AbortController()
    request.current=controller
    setBusy(true);setError('');setData(null);setCategory('');setRelevance('')
    try {
      const params=new URLSearchParams({apellido:term,limite:'20'})
      const response=await fetch('/api/research/internet-archive?'+params,{signal:controller.signal})
      if (!response.ok) {
        if (response.status===422) throw new Error('Revisa el apellido. Se admiten letras, espacios, guiones y apóstrofos.')
        throw new Error('El catálogo no respondió. Vuelve a consultar en unos minutos.')
      }
      const result=await response.json()
      if (!Array.isArray(result.records)) throw new Error('El catálogo devolvió una respuesta incompleta.')
      if (!controller.signal.aborted) setData(result)
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof TypeError?'Comprueba la conexión con la aplicación y vuelve a intentarlo.':err.message)
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  const records=(data?.records || []).filter(record=>
    (!category || record.categoria_documental===category) && (!relevance || record.relevancia===relevance))
  return <section className="lia-library-pane">
    <h3>Catálogo de Internet Archive</h3>
    <p>Consulta libros y documentos por apellido. Contrasta las coincidencias automáticas con el registro original antes de atribuir parentescos.</p>
    <form className="lia-library-search" onSubmit={submit}>
      <label>Apellido en el catálogo<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ej. Tovar" minLength={2} maxLength={80} required/></label>
      <button disabled={busy}>{busy?'Consultando…':'Consultar catálogo'}</button>
    </form>
    <div role="status" aria-live="polite">{busy?'Buscando documentos en Internet Archive…':data ? records.length+' de '+data.records.length+' registros para «'+data.apellido+'».' : ''}</div>
    <Notice kind="error">{error}</Notice>
    {data?.records.length>0&&<>
      <div className="lia-filters"><label>Categoría<select value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="">Todas las categorías</option>{Object.entries(categories).map(([key,name])=><option value={key} key={key}>{name}</option>)}</select></label>
        <label>Relevancia<select value={relevance} onChange={e=>setRelevance(e.target.value)}>
          <option value="">Todas</option>{['alta','media','baja'].map(v=><option value={v} key={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label>
        {(category||relevance)&&<button className="lia-reset" onClick={()=>{setCategory('');setRelevance('')}}>Quitar filtros</button>}
      </div>
      <BibliographyTimeline records={records}/>
      {records.length>0?<div className="lia-document-grid">{records.map(record=><DocumentCard key={record.id} record={record}/>)}</div>:
        <p>Ningún registro coincide con estos filtros.</p>}
    </>}
    {data?.records.length===0&&<p>Prueba con otra grafía del apellido para ampliar la consulta.</p>}
  </section>
}
