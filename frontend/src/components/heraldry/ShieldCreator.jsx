import React from 'react'
import ArmorialGallery from './ArmorialGallery'
import {collections} from './armorial'
import '../../styles/dossier.css'

const palettes = {bosque:'Verde bosque', carmesi:'Carmesí', azul:'Azul profundo'}

export default function ShieldCreator({record,palette,onChange}) {
  const preview='/api/surnames/'+encodeURIComponent(record.name)+'/shield-preview.png?palette='+palette
  const pieces=Object.hasOwn(collections,record.name)?collections[record.name]:null
  const heading=pieces?'artistic-shield-title':'workshop-title'
  return <>{pieces&&<ArmorialGallery key={record.name} pieces={pieces} surname={record.name}/>}<section id="artistic-shield" className="lo-heraldry" aria-labelledby={heading}>
    <div className="lo-heraldry__copy">
      <p className="lo-heraldry__label">Diseño artístico original</p>
      <h3 id={heading} tabIndex="-1">{pieces?'Escudo artístico con inicial':'Taller heráldico'}</h3>
      <p>El Legado incluye este diseño con inicial en SVG y el informe PDF. Elige la paleta de tu descarga.</p>
      <label htmlFor="palette">Color del escudo</label>
      <div className="lo-heraldry__palette" data-palette={palette}>
        <select id="palette" value={palette} onChange={e=>onChange(e.target.value)}>
          {Object.entries(palettes).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <p className="lo-heraldry__note"><strong>Heráldica histórica documentada.</strong> Esta ficha carece de una fuente que atribuya armas históricas a tu familia.</p>
    </div>
    <figure className="lo-heraldry__plate">
      <div className="lo-heraldry__frame" data-palette={palette}>
        <img key={palette} width="140" height="168" src={preview} alt={'Boceto artístico de '+record.name+' en '+palette}/>
      </div>
      <figcaption>{record.name} <span aria-hidden="true">/</span> {palettes[palette]}</figcaption>
      <div className="shield-gallery" role="group" aria-label="Galería de paletas">{Object.entries(palettes).map(([value,label])=>
        <button key={value} type="button" aria-label={'Elegir '+label} aria-pressed={value===palette} onClick={()=>onChange(value)}>
          <img width="36" height="44" loading="lazy" src={'/api/surnames/'+encodeURIComponent(record.name)+'/shield-preview.png?palette='+value} alt=""/>
          <span>{label}</span>
        </button>)}</div>
    </figure>
  </section></>
}
