import React from 'react'

export default function HistoricalMap({places, selected, choose, busy}) {
  return <div className="map"><svg viewBox="0 0 450 310" role="group" aria-label="Mapa esquemático de la península ibérica">
    <defs>
      <pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#658176" strokeWidth=".65"/></pattern>
      <pattern id="relief" width="16" height="13" patternUnits="userSpaceOnUse"><path d="m2 11 4-5 4 5m-3-3 2-3 4 6" fill="none" stroke="#aa966a" strokeWidth=".5"/></pattern>
    </defs>
    <rect width="450" height="310" fill="#324f47"/><rect width="450" height="310" fill="url(#grid)"/>
    <path id="land" d="M104 48 111 33 139 36 151 44 177 45 192 51 220 49 246 55 269 55 285 49 309 60 334 67 354 67 372 75 404 78 395 98 375 109 351 119 339 133 322 146 311 167 314 180 324 186 307 196 303 212 284 220 271 235 251 241 231 239 206 248 190 263 174 264 159 278 149 272 137 252 124 245 107 244 87 246 85 235 94 214 91 197 82 187 88 180 81 178 91 164 96 145 98 123 102 104 99 85 104 74 96 64Z" fill="#ddcba6" stroke="#f4e5bd" strokeWidth="2"/>
    <use href="#land" fill="url(#relief)" style={{fill:'url(#relief)'}} opacity=".4"/>
    <path d="m142 94 20 4-2 16-9 10 7 14-12 21 2 12-9 15 3 11-8 11 4 16-9 18" fill="none" stroke="#8e7850" strokeDasharray="3 3"/>
    <text x="16" y="143" className="sea">Atlántico</text><text x="289" y="262" className="sea">Mediterráneo</text>
    <g transform="translate(399 37)" fill="#e6cd90"><path d="M0-22 5-2 0-5-5-2ZM0 18 3 1 0 4-3 1Z"/><text x="0" y="-24" textAnchor="middle" fontSize="9">N</text></g>
    {places.map(p=><g key={p.name} role="button" tabIndex={busy?-1:0} aria-label={'Explorar '+p.name} aria-pressed={selected===p.name}
      onClick={()=>!busy&&choose(p.name)} onKeyDown={e=>{if(!busy&&['Enter',' '].includes(e.key)){e.preventDefault();choose(p.name)}}}
      transform={'translate('+p.mark.join(' ')+')'} className="pin">
      <circle r="13" fill="transparent"/><circle r={selected===p.name?8:5} fill="#813d30" stroke="#fff0cc" strokeWidth="2"/>
      <text x="10" y="5">{p.place.split(',')[0]}</text></g>)}
  </svg><small>Península ibérica · Cartografía orientativa</small></div>
}
