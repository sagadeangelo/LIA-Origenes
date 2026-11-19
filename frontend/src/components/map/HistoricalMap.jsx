import React from 'react'

// Positions are percentages of the uncropped atlas illustration.
const points = {Amaral: [62.2, 69], Tovar: [68.8, 60]}

export default function HistoricalMap({places, selected, choose, busy}) {
  return <div className="scene" role="group" aria-label="Mapa ilustrado de Europa occidental">
    <img src="/art/atlas-iberico.webp" alt="Viajero medieval frente a un castillo y un mapa dorado de Europa" fetchPriority="high"/>
    <svg className="routes" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
      <path d="M622 276 Q630 247 688 240" />
    </svg>
    {places.filter(p=>points[p.name]).map(p=><button type="button" className="atlas-pin"
      key={p.name} style={{left:points[p.name][0]+'%',top:points[p.name][1]+'%'}}
      aria-label={'Explorar '+p.name+' en '+p.place} aria-pressed={selected===p.name}
      onClick={()=>choose(p.name)} disabled={busy}><span>{p.place.split(',')[0]}</span></button>)}
  </div>
}
