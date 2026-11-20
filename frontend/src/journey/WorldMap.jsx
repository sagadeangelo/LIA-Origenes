import React,{useEffect,useState} from 'react'
import {destinations} from './data'

const xy=([lon,lat])=>[(lon+180)*2,(90-lat)*2]
export function ink(name,records=[]){
  if(name==='Tovar')return '#fff428'
  if(name==='Amaral')return '#00f7ff'
  const other=records.map(r=>r.name).filter(n=>n!=='Tovar'&&n!=='Amaral').sort()
  return other.indexOf(name)>0?'#9aff78':'#ffa3ed'
}
function bounds(coords) {
  if(!coords.length)return '0 0 720 360'
  const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1])
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys)
  const span=Math.max(right-left,(bottom-top)*1.72)
  const width=Math.min(720,Math.max(14,span*1.35+4)),height=width/1.72
  return [Math.max(0,Math.min(720-width,(left+right-width)/2)),Math.max(0,Math.min(360-height,(top+bottom-height)/2-height*.035)),width,height].join(' ')
}
function arc(from,to){
  const [x,y]=xy(from.coordinates),[u,v]=xy(to.coordinates)
  const bend=Math.min(24,Math.hypot(u-x,v-y)*.2)
  return 'M'+x+' '+y+' Q'+((x+u)/2)+' '+((y+v)/2-bend)+' '+u+' '+v
}
export default function WorldMap({record,records=[record],active,onSelect,country,showDestination,paused,onPause}) {
  const [world,setWorld]=useState(false)
  useEffect(()=>{if(!paused)setWorld(false)},[paused])
  const selected=record.points[active]
  const destination=country&&xy(destinations[country])
  const edges=records.flatMap(row=>row.connections.filter(e=>e.type!=='documented'||e.url).map(e=>({
    ...e,row,fromPoint:row.points.find(p=>p.id===e.from),toPoint:row.points.find(p=>p.id===e.to)
  }))).filter(e=>e.fromPoint&&e.toPoint)
  const current=edges.find(e=>e.row===record&&e.to===selected?.id)
  const overview=world||showDestination
  const visibleEdges=overview?edges:edges.filter(e=>e.row===record&&record.points.indexOf(e.toPoint)<=active)
  const coords=records.flatMap(r=>r.points.map(p=>xy(p.coordinates)))
  if(showDestination&&destination)coords.push(destination)
  const camera=current?[xy(current.fromPoint.coordinates),xy(current.toPoint.coordinates)]:coords
  const view=world?'0 0 720 360':bounds(camera)
  const radius=Number(view.split(' ')[2])/165
  return <figure className="chart neon-chart" data-paused={paused}>
    <div className="chart-bar"><div className="ink-key">{records.map(r=><span key={r.name} style={{'--ink-line':ink(r.name,records)}}>{r.name}</span>)}</div>
      <button aria-pressed={world} onClick={()=>{onPause?.();setWorld(!world)}}>{world?'Encuadrar rutas':'Ver mundo'}</button></div>
    <svg viewBox={view} role="img" aria-label="Mapa de los recorridos. El índice permite elegir cada lugar con teclado.">
      <defs><pattern id="graticule" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M0 30V0H30" fill="none" stroke="#92acaa" opacity=".29"/></pattern></defs>
      <rect width="720" height="360" fill="url(#graticule)"/><image href="/travesia/mundo.svg" width="720" height="360" opacity=".63"/>
      {visibleEdges.map(e=><g key={e.row.name+e.to} style={{'--ink-line':ink(e.row.name,records)}} className={'neon-edge '+(e===current?'focused':'')}>
        <title>{e.row.name} · {e.person} · {e.text}</title>
        <path className="halo" d={arc(e.fromPoint,e.toPoint)}/>
        <path className={'track '+e.type} pathLength="1" d={arc(e.fromPoint,e.toPoint)}/>
        <path className="spark" pathLength="1" d={arc(e.fromPoint,e.toPoint)}/>
      </g>)}
      {records.map(row=>row.points.map((p,i)=>{if(!overview&&(row!==record||i>active))return null;const [x,y]=xy(p.coordinates);return <g key={row.name+p.id} className={'marker '+(row===record&&i===active?'selected':'')} style={{'--ink-line':ink(row.name,records)}} transform={`translate(${x} ${y})`} onClick={()=>onSelect(i,row)}><title>{row.name} · {p.place} · {p.period}</title><circle r={radius*2.5} fill="transparent"/><circle className="rim" r={radius*1.35}/><circle className="core" r={radius*.65}/></g>}))}
      {showDestination&&destination&&<path d="M0 -7L7 0 0 7 -7 0Z" transform={'translate('+destination.join(' ')+')'} fill="none" stroke="white" strokeWidth="1.5"/>}
    </svg>
    <figcaption>Planisferio · Natural Earth <span>Arcos esquemáticos entre lugares citados</span></figcaption>
    {!!record.connections.length&&<details className="place-register" onToggle={e=>{if(e.currentTarget.open)onPause?.()}}><summary>Explorar recorridos de {record.name}</summary><div className="route-list">{edges.filter(e=>e.row===record).map(e=><button key={e.to} aria-pressed={e===current} style={{'--ink-line':ink(record.name,records)}} onClick={()=>{setWorld(false);onSelect(record.points.indexOf(e.toPoint),record)}}>
      <strong>{e.fromPoint.place} → {e.toPoint.place}</strong><small>{e.person||'Recreación visual'} · {e.period||'Demostración'}</small></button>)}</div></details>}
    {current?.url&&<p className="map-note"><a href={current.url} target="_blank" rel="noreferrer">Consultar la fuente del tramo ↗</a></p>}
    <details className="place-register" onToggle={e=>{if(e.currentTarget.open)onPause?.()}}><summary>Índice de lugares · {record.points.length} menciones</summary><div className="point-index">{record.points.map((p,i)=><button key={p.id} aria-pressed={i===active} onClick={()=>onSelect(i,record)}>{p.place}{record.points.some(q=>q.id!==p.id&&q.place===p.place)?' · '+p.period:''}</button>)}</div></details>
  </figure>
}
