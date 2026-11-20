import React,{useState} from 'react'
import BlazonDrawing from './BlazonDrawing'
import '../../styles/armorial.css'

const settings={reference:'Referencia',museum:'Exhibición de museo',parchment:'Pergamino medieval',illuminated:'Manuscrito iluminado',metal:'Marco metálico'}

function Artwork({piece}){
  const [attempt,setAttempt]=useState(0)
  const original=piece.file && attempt<2
  return <figure className="arm-piece">
    <div className="arm-image" role="group" aria-label={piece.family}>
      {original ? <img src={attempt===0?'/art/armorial/'+piece.file:piece.remote}
        onError={()=>setAttempt(n=>Math.min(2,n+1))} alt={piece.blazon}/> :
        piece.fallback ? <BlazonDrawing variant={piece.fallback}/> :
        <p>La lámina necesita conexión. <a href={piece.original} target="_blank" rel="noreferrer">Abrir reproducción original ↗</a></p>}
    </div>
    <figcaption><strong>{piece.label}</strong>
      <span>{original?piece.kind:piece.fallback?'Interpretación vectorial del blasón':'Lámina sin cargar'}</span>
      {(!original&&piece.fallback)?<small>Dibujo de LIA Orígenes · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0 1.0</a></small>:
      <small>{piece.credit} · <a href={piece.rightsUrl} target="_blank" rel="noreferrer">{piece.rights}</a></small>}
      {piece.original&&<a href={piece.original} target="_blank" rel="noreferrer">Ficha de la ilustración ↗</a>}
    </figcaption>
  </figure>
}

export default function ArmorialGallery({pieces,surname}){
  const [selected,setSelected]=useState(0)
  const [comparison,setComparison]=useState(false)
  const [mount,setMount]=useState('reference')
  const piece=pieces[selected]
  return <section className="arm-room" aria-labelledby="workshop-title">
    <header><p className="overline">Taller heráldico · Colección documental</p>
      <h3 id="workshop-title" tabIndex="-1">Armas de {surname}</h3>
      <p>Explora las armas atribuidas a distintas casas. Compartir apellido no acredita descendencia ni el derecho a usar un blasón.</p></header>
    <div className="arm-select" role="group" aria-label="Piezas documentadas">
      {pieces.map((p,i)=><button key={p.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{p.fallback?<BlazonDrawing variant={p.fallback}/>:<span aria-hidden="true" className="arm-folio">❦</span>}{p.label}</button>)}
      <button aria-expanded={comparison} aria-controls="arm-comparison" onClick={()=>setComparison(!comparison)}>Comparar piezas</button>
    </div>
    <div className="arm-spread">
      <div className="arm-mount" data-mount={mount}><Artwork key={piece.id} piece={piece}/></div>
      <article className="arm-label" aria-live="polite"><h4>{piece.family}</h4><p className="arm-region">{piece.region}</p>
        <h5>Lectura del blasón</h5><p>{piece.blazon}</p><p>{piece.note}</p>
        <h5>Alcance de la verificación</h5><p>{piece.evidence}</p>
        <a href={piece.url} target="_blank" rel="noreferrer">{piece.source} ↗</a>
        <label>Presentación artística<select value={mount} onChange={e=>setMount(e.target.value)}>{Object.entries(settings).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <small>{mount==='reference'?'Lámina sobre fondo neutro.':'Montaje artístico de LIA Orígenes. La intervención se limita al soporte y al marco.'}</small>
      </article>
    </div>
    {comparison&&<div className="arm-comparison" id="arm-comparison">{pieces.map(p=><article key={p.id}><Artwork piece={p}/><p>{p.blazon}</p></article>)}</div>}
    {surname==='Tovar'&&<details className="arm-notes"><summary>Notas de atribución y otras referencias</summary>
      <p>Para León, José Luis Díez Pascual identifica un cuartel de Tovar con banda y dragantes en su estudio de los palacios leoneses. La descripción citada no precisa todos los esmaltes. <a href="https://www.academia.edu/71231936/La_her%C3%A1ldica_de_los_palacios_de_Le%C3%B3n_Espa%C3%B1a_" target="_blank" rel="noreferrer">Consultar el estudio, p. 16 ↗</a></p>
      <p>La ilustración de Manuelfb55 de 2015 describe una «barra» y no identifica una casa leonesa. Se conserva como referencia de comparación. <a href="https://commons.wikimedia.org/wiki/File:Escudo_de_Tovar.svg" target="_blank" rel="noreferrer">Ver ilustración y licencias ↗</a></p>
      <p>La variante aragonesa se dibujó a partir de la descripción de Armoria. La reproducción de 2021 se atribuye a Manuelfb55 bajo CC BY-SA 4.0. Para la lámina portuguesa, Commons indica dominio público. Los originales se muestran sin modificar.</p>
    </details>}
  </section>
}
