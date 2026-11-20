import React, {useEffect, useRef, useState} from 'react'

// Traces follow the existing engraving in its native 3:2 coordinate space.
const veins = [
  ['M70 192 Q100 186 121 180 T145 162',0],
  ['M210 193 Q172 187 159 177 L146 162',.16],
  ['M122 194 Q135 186 145 162',.32],
  ['M145 168 Q139 154 148 139 T148 111 Q151 99 144 86',.86],
  ['M148 126 Q125 121 115 109 T78 91 L59 87',1.48],
  ['M148 115 Q164 111 176 95 T210 78 L229 65',1.73],
  ['M145 105 Q127 91 128 80 T110 51 L94 39',1.96],
  ['M146 107 Q155 85 164 76 T173 54 L185 37',2.12]
]
const grains = Array.from({length:34},(_,i)=>({
  x:12+(i*83)%277, y:18+(i*47)%171, r:.5+(i%4)*.16,
  style:{'--sway':((i%2?1:-1)*(4+i%8))+'px','--rise':(-8-i%16)+'px','--drift':(4.7+i%6*.53)+'s','--offset':(-i*.91)+'s'}
}))

export default function LivingOak(){
  const tree=useRef(null)
  const [visible,setVisible]=useState(false)
  const [paused,setPaused]=useState(false)
  useEffect(()=>{
    let inView=false
    const sync=()=>setVisible(inView && !document.hidden)
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync()})
    observer.observe(tree.current)
    document.addEventListener('visibilitychange',sync)
    return ()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync)}
  },[])
  return <figure ref={tree} className="lo-folio__tree living-oak" data-running={visible&&!paused}>
    <div className="legacy-tree oak-stage">
      <img src="/art/roble-grabado.webp" width="760" height="507" decoding="async" alt=""/>
      <svg className="oak-light" viewBox="0 0 300 200" aria-hidden="true" focusable="false">
        <g className="oak-veins">{veins.map(([d,delay])=>
          <path key={d} d={d} pathLength="1" style={{'--delay':delay+'s'}}/>)}</g>
        <g className="oak-grains">{grains.map(({x,y,r,style},i)=>
          <circle key={i} cx={x} cy={y} r={r} style={style}/>)}</g>
      </svg>
    </div>
    <figcaption>Roble simbólico · Memoria familiar</figcaption>
    <button type="button" className="oak-motion" onClick={()=>setPaused(!paused)}>{paused?'Reanudar animación':'Pausar animación'}</button>
  </figure>
}
