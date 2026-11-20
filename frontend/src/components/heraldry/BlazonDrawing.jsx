import React,{useId} from 'react'

// Original vector geometry drawn from the published blazons, independent of the Commons SVGs.
export default function BlazonDrawing({variant}){
  const id=useId().replace(/:/g,'')
  const ref=name=>'url(#'+id+name+')'
  const aragon=variant==='aragon'
  const outline='M20 16 Q85 25 130 12 Q177 25 240 16 V143 Q236 226 130 279 Q24 226 20 143 Z'
  return <svg aria-hidden="true" viewBox="0 0 260 290" className="blazon-drawing">
    <defs><clipPath id={id+'cut'}><path d={outline}/></clipPath>
      <linearGradient id={id+'blue'} x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#174f83"/><stop offset="1" stopColor="#112d59"/></linearGradient>
      <linearGradient id={id+'gold'}><stop stopColor="#c49a43"/><stop offset=".5" stopColor="#ffe399"/><stop offset="1" stopColor="#c89940"/></linearGradient>
      <g id={id+'head'} stroke="#242d24" strokeWidth="2" strokeLinejoin="round">
        <path fill={aragon?ref('gold'):'#398057'} d="M-46 -27 L-37 -43 -28 -36 -23 -47 -17 -35 -9 -40 -7 -28 Q7 -31 16 -17 L30 -15 29 -8 22 -4 5 -6 -3 0 12 9 26 8 25 16 Q11 23 -4 16 Q-13 30 -30 28 L-45 39 -39 20 -48 20 -39 8 -48 5 -39 -6Z"/>
        <path fill="#f6dfab" d="M-9 -21L2 -18 -6 -14Z"/><circle cx="-5" cy="-18" r="1.7"/>
        <path fill="#f3e9c8" d="M14 -7l4 6 2 -6M12 10l3 -6 3 6"/>
        <path fill="none" d="M-31 -23q16 -5 22 6M-29 -7q5 11 15 12M-27 15q9 -1 13 -5"/>
      </g>
    </defs>
    <path d={outline} fill={ref('blue')}/>
    <g clipPath={ref('cut')}><path d="M-10 26L17 -8 277 213 247 250Z" stroke="#765422" strokeWidth="2" fill={ref('gold')}/>
      <use href={'#'+id+'head'} transform="translate(46 48) rotate(40)"/>
      <use href={'#'+id+'head'} transform="translate(218 197) rotate(220)"/>
      {aragon&&<g strokeWidth="2" strokeLinejoin="round"><path d="M50 224l-5 -30 20 -2 23 9 18 -24 14 12 -22 35 -18 5Z" fill="#a32f36" stroke="#481b22"/>
        <path d="M105 182l2 -12 7 -6 6 2 4 8 -2 10 -8 6Z" fill="#dfb380" stroke="#704c2f"/>
        <path d="M111 174l28 -41" stroke="#5d4940" strokeWidth="5"/><path d="M130 147l9 -14" stroke="#f08037" strokeWidth="4"/></g>}
    </g><path d={outline} fill="none" stroke="#191f20" strokeWidth="3"/>
  </svg>
}
