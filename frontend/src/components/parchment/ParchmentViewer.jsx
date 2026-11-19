import React, {useState} from 'react'

const stages = ['Lugar', 'Fuente', 'Investigación']

export default function ParchmentViewer({record}) {
  const [stage,setStage] = useState(0)
  return <section aria-label="Expedición histórica">
    <p className="overline">{record.region} · {record.place}</p>
    <h2 id="record-title" tabIndex="-1">{record.name}</h2>
    <p>{record.summary}</p>
    <fieldset className="stages"><legend>Expedición histórica</legend>
      {stages.map((name,i)=><button type="button" key={name} aria-pressed={stage===i}
        onClick={()=>setStage(i)}>{i+1}. {name}</button>)}
    </fieldset>
    <div className="evidence" aria-live="polite">
      {stage===0 && <p><strong>{record.place}.</strong> El marcador señala el lugar citado en la ficha. La línea del atlas conecta los puntos disponibles para explorar.</p>}
      {stage===1 && <p>{record.detail}</p>}
      {stage===2 && <p>Para investigar tu propia familia, comienza con un acta conocida y contrasta los nombres, las fechas y la localidad con la generación anterior. El apellido por sí solo no acredita parentesco.</p>}
      <a href={record.url} target="_blank" rel="noreferrer">{record.source} ↗</a>
    </div>
    <a className="paper-download" href={'/api/surnames/'+encodeURIComponent(record.name)+'/parchment.pdf'} download>Descargar pergamino gratuito (PDF)</a>
  </section>
}
