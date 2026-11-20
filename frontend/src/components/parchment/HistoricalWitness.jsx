import React from 'react'

import {witnesses as entries} from '../../data/witnesses'
export default function HistoricalWitness({name}){
  const entry=Object.hasOwn(entries,name)?entries[name]:null
  return <section className="witness" aria-labelledby="witness-heading">
    <header><span className="wax-mark" aria-hidden="true">LO</span><h4 id="witness-heading">Una huella documentada</h4></header>
    {entry ? <><div className="witness-columns"><div>
      <p className="witness-year">{entry.year}</p><h5>{entry.name}</h5><p className="witness-life">{entry.life}</p>
    </div><div><h6>{entry.title}</h6><p>{entry.story}</p><p>{entry.item}</p>
      <a href={entry.url} target="_blank" rel="noreferrer">{entry.reference} ↗</a><small>{entry.locator}</small>
    </div></div><p className="research-note">{entry.question}</p></> :
      <p>Queda por identificar un testimonio fechado que nombre a una persona y permita localizar el documento original.</p>}
    <p className="witness-limit">La primera mención del apellido sigue abierta a investigación. Para establecer parentesco hacen falta documentos que vinculen a cada generación.</p>
  </section>
}
