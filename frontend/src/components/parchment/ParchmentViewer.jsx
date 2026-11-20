import React, {useState} from 'react'
import LivingOak from './LivingOak'
import HistoricalWitness from './HistoricalWitness'
import '../../styles/manuscript.css'
import TimeGallery from './TimeGallery'
import '../../styles/dossier.css'

const stages = ['Lugar', 'Fuente', 'Investigación']

export default function ParchmentViewer({record}) {
  const [stage, setStage] = useState(0)
  return <section className="lo-folio" aria-label="Expedición histórica">
    <div className="lo-folio__masthead" id="raices">
      <div>
        <p className="lo-folio__label">El despertar de las raíces</p>
        <h2 id="record-title" tabIndex="-1">{record.name}</h2>
        <p className="lo-folio__epigraph">{record.place} · {record.region}</p>
      </div>
      <LivingOak/>
    </div>
    <nav className="exhibit-index" aria-label="Escenas del recorrido">
      {[['raices','Raíces'],['huellas','Huellas'],['portal','Tiempo'],['mapa','Cartografía'],['workshop-title','Legado']].map(([id,label])=><a key={id} href={'#'+id}>{label}</a>)}
    </nav>
    <section className="exhibit-paper" id="huellas" aria-labelledby="huellas-title">
    <h3 id="huellas-title">Las huellas del pasado</h3>
    <div className="lo-folio__body">
      <div className="lo-folio__context">
        <h3>Contexto histórico</h3>
        <p className="lo-folio__summary">{record.summary}</p>
        <dl className="lo-folio__facts">
          <div><dt>Región asociada</dt><dd>{record.region}</dd></div>
          <div><dt>Lugar citado</dt><dd>{record.place}</dd></div>
          {record.aliases?.length>0&&<div><dt>Variantes registradas</dt><dd>{record.aliases.join(', ')}</dd></div>}
        </dl>
      </div>
      <div className="lo-folio__reading">
        <fieldset className="lo-stages"><legend id="expedition-title" tabIndex="-1">Expedición histórica</legend>
          <div className="lo-stages__choices">{stages.map((name,i)=><button type="button" key={name}
            aria-pressed={stage===i} aria-controls="folio-evidence" onClick={()=>setStage(i)}>
            <span>{i+1}.</span> {name}
          </button>)}</div>
        </fieldset>
        <div id="folio-evidence" className="lo-folio__evidence" aria-live="polite" aria-atomic="true">
          {stage===0&&<p><strong>{record.place}.</strong> El marcador del atlas señala el lugar citado en la ficha.</p>}
          {stage===1&&<p>{record.detail}</p>}
          {stage===2&&<p>Para investigar tu propia familia, comienza con un acta conocida y contrasta los nombres, las fechas y la localidad con la generación anterior. El apellido por sí solo no acredita parentesco.</p>}
        </div>
        <a className="lo-folio__source" href={record.url} target="_blank" rel="noreferrer">{record.source} <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <HistoricalWitness name={record.name}/>
    <details className="folio-resources"><summary>Documentos y cronología</summary>
      <article className="folio-original">
        <div className="folio-initial" aria-hidden="true">{record.name.slice(0,1)}</div>
        <div><small>Referencia de la ficha</small><h4>{record.source}</h4>
          <p>Fecha sin consignar en esta ficha.</p>
          <a href={record.url} target="_blank" rel="noreferrer">Consultar la fuente original ↗</a>
        </div>
      </article>
      <p>Consulta obras relacionadas en la <a href="#biblioteca">biblioteca documental</a>. Las fechas del catálogo corresponden a las publicaciones.</p>
    </details>
    <a className="lo-folio__download" href={'/api/surnames/'+encodeURIComponent(record.name)+'/parchment.pdf'} download>
      <span aria-hidden="true">↓</span> Descargar pergamino gratuito (PDF)
    </a>
    </section>
    <TimeGallery record={record}/>
  </section>
}
