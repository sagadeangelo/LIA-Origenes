import React from 'react'
import ArchiveIcon from '../layout/ArchiveIcon'

export default function EditionCards({catalog,busy,buy}) {
  return <section id="ediciones" aria-labelledby="editions-title">
    <h3 id="editions-title" className="products-title">Conserva lo que has descubierto</h3>
    <div className="products">{Object.entries(catalog.products).map(([key,p])=>{
      const shield=key==='legado'
      return <article key={key} className="edition" data-edition={key}>
        <header><ArchiveIcon name={shield?'shield':'book'}/><span>{shield?'PDF + SVG':'PDF'}</span></header>
        <h4>{p.name}</h4>
        <div className="edition-price">${Number(p.amount)} <small>MXN</small></div>
        <p>{shield?'Informe histórico y escudo artístico en la paleta elegida.':'Contexto del apellido y referencia documental en un informe descargable.'}</p>
        <a href={shield?'#artistic-shield':'#record-title'}>{shield?'Ver el diseño seleccionado':'Revisar la ficha histórica'} ↑</a>
        <button disabled={busy} onClick={()=>buy(key)}>{catalog.mode==='demo'?'Probar':'Solicitar'} por ${Number(p.amount)} MXN</button>
      </article>
    })}</div>
  </section>
}
