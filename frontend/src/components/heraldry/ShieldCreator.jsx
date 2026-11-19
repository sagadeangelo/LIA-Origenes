import React from 'react'

export default function ShieldCreator({record,palette,onChange}) {
  const preview='/api/surnames/'+encodeURIComponent(record.name)+'/shield-preview.svg?palette='+palette
  return <section className="workshop" aria-labelledby="workshop-title">
    <div><h3 id="workshop-title">Taller heráldico</h3>
      <p><strong>Diseño artístico original.</strong> Elige el color de tu escudo. El Legado incluye la versión final en SVG y el informe PDF.</p>
      <p><strong>Heráldica histórica documentada.</strong> Esta ficha carece de una fuente que atribuya armas históricas a tu familia.</p>
      <label htmlFor="palette">Color del escudo</label>
      <select id="palette" value={palette} onChange={e=>onChange(e.target.value)}>
        <option value="bosque">Verde bosque</option><option value="carmesi">Carmesí</option><option value="azul">Azul profundo</option>
      </select>
    </div><img width="140" height="168" src={preview} alt={'Boceto artístico de '+record.name+' en '+palette}/>
  </section>
}
