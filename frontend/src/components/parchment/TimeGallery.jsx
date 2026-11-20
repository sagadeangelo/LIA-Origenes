import React, {useState} from 'react'

// The periods are viewing lenses; the surname API supplies no dated events.
const periods = [
  {name:'Edad Media', medium:'El manuscrito', question:'¿Con qué grafía buscarías el apellido en un manuscrito?', guide:'Copia la grafía que aparece en el documento. Conserva esa transcripción junto a la forma que usaste para buscar.', image:'portal-0', focus:'65% 50%'},
  {name:'Edad Moderna', medium:'El mapa', question:'¿Qué lugar convendría localizar primero?', guide:'Usa el lugar citado como punto de partida. Contrasta su nombre y sus límites con un mapa de la época que investigas.', image:'portal-1', focus:'65% 50%'},
  {name:'Edad Contemporánea', medium:'El archivo digital', question:'¿Cómo volverías a encontrar el mismo documento?', guide:'Guarda el título de la obra y el localizador del pasaje. Conserva la referencia junto a tus notas.', image:'portal-2', focus:'58% 50%'}
]

export default function TimeGallery({record}) {
  const [index,setIndex]=useState(0)
  const period=periods[index]
  return <section id="portal" className="time-gallery" aria-labelledby="time-title">
    <h3 id="time-title">El portal del tiempo</h3>
    <p className="time-intro">Elige una época para explorar formas de investigar. La ficha de {record.name} carece de acontecimientos familiares fechados.</p>
    <div className="time-rail" role="group" aria-label="Épocas históricas">
      {periods.map((item,i)=><button type="button" key={item.name} aria-pressed={index===i}
        aria-controls="time-reading" onClick={()=>setIndex(i)}>{item.name}</button>)}
    </div>
    <div id="time-reading" className="time-reading" data-period={index} aria-live="polite">
      <div className="time-scene" key={period.name} aria-hidden="true" data-era={index}>
        <img src={'/art/'+period.image+'.webp'} alt="" loading="lazy" style={{objectPosition:period.focus}}/>
        <span>{period.medium}</span>
      </div>
      <div className="time-copy"><small>Contexto visual · {period.name}</small><h4>{period.question}</h4><p>{period.guide}</p>
        {index===0&&<p className="time-reference">Grafía de consulta · {[record.name,...(record.aliases || [])].join(' / ')}</p>}
        {index===1&&<a href="#mapa">Localizar {record.place} en el atlas ↓</a>}
        {index===2&&<a href="#biblioteca">Explorar la biblioteca documental ↓</a>}
      </div>
    </div>
  </section>
}
