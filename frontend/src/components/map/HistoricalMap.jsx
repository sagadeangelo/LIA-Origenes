import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import './historical-map.css'

// Percentages refer to the original, uncropped atlas illustration.
const points = {Amaral: [62.2, 69], Tovar: [68.8, 60]}
const zoomLevels = [1, 1.4, 2]
const startCenter = {x: 0.5, y: 0.5}

export default function HistoricalMap({places, selected, choose, busy}) {
  const records = places.filter(place => points[place.name])
  const [inspected, setInspected] = useState(null)
  const [zoomIndex, setZoomIndex] = useState(0)
  const viewport = useRef(null)
  const center = useRef(startCenter)
  const drag = useRef(null)
  const zoom = zoomLevels[zoomIndex]
  const current = records.find(p => p.name === inspected) || records.find(p => p.name === selected) || records[0]

  useEffect(() => {
    if (selected) setInspected(selected)
  }, [selected])

  function centerView() {
    const node = viewport.current
    if (node && zoomIndex === 0) {
      node.scrollTo(0, 0)
    } else if (node) {
      node.scrollLeft = node.scrollWidth * center.current.x - node.clientWidth / 2
      node.scrollTop = node.scrollHeight * center.current.y - node.clientHeight / 2
    }
  }
  useLayoutEffect(() => {
    centerView()
    const observer = new ResizeObserver(centerView)
    observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [zoom])

  function changeZoom(index) {
    const node = viewport.current
    center.current = {
      x: (node.scrollLeft + node.clientWidth / 2) / node.scrollWidth,
      y: (node.scrollTop + node.clientHeight / 2) / node.scrollHeight
    }
    setZoomIndex(index)
  }
  function resetView() {
    center.current = startCenter
    setZoomIndex(0)
    viewport.current.scrollTo(0, 0)
  }
  function moveWithKeys(event) {
    if (!zoomIndex || event.target !== viewport.current) return
    const directions = {ArrowLeft: [-64, 0], ArrowRight: [64, 0], ArrowUp: [0, -64], ArrowDown: [0, 64]}
    const movement = directions[event.key]
    if (movement) {
      event.preventDefault()
      viewport.current.scrollBy(...movement)
    }
  }
  function beginDrag(event) {
    if (!zoomIndex || event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button')) return
    const node = viewport.current
    node.setPointerCapture(event.pointerId)
    drag.current = {x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop}
  }
  function moveDrag(event) {
    if (!drag.current) return
    viewport.current.scrollLeft = drag.current.left + drag.current.x - event.clientX
    viewport.current.scrollTop = drag.current.top + drag.current.y - event.clientY
  }

  return <section id="mapa" className="folio-atlas" tabIndex={-1} aria-labelledby="atlas-titulo">
    <div className="folio-atlas__heading">
      <div><h2 id="atlas-titulo">Atlas histórico</h2>
        <p>Explora los lugares que aparecen en las fuentes de cada apellido.</p></div>
      <div className="folio-atlas__tools" role="group" aria-label="Escala del mapa">
        <button type="button" aria-label="Alejar mapa" disabled={!zoomIndex} onClick={() => changeZoom(zoomIndex-1)}>−</button>
        <output aria-label="Escala del mapa">{Math.round(zoom * 100)} %</output>
        <button type="button" aria-label="Acercar mapa" disabled={zoomIndex === zoomLevels.length-1} onClick={() => changeZoom(zoomIndex+1)}>+</button>
        <button type="button" className="folio-atlas__reset" onClick={resetView}>Restablecer</button>
      </div>
    </div>
    <div className="folio-atlas__spread">
      <div className="folio-atlas__viewport" ref={viewport} data-zoomed={zoomIndex > 0} role="region" tabIndex={0} aria-label="Mapa de Europa occidental"
        aria-description="Amplía el mapa y usa las flechas para desplazar el mapa o arrastra la ilustración."
        onKeyDown={moveWithKeys} onPointerDown={beginDrag} onPointerMove={moveDrag}
        onLostPointerCapture={() => {drag.current = null}}>
        <div className="folio-atlas__sheet scene" data-scale={zoom} style={{'--atlas-scale':zoom}}>
          <img src="/art/atlas-iberico.webp" alt="Ilustración de un viajero ante un mapa de Europa occidental" loading="lazy" decoding="async" draggable="false"/>
          {current&&<svg className="map-leader" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path key={current.name} pathLength="1" d={`M ${points[current.name][0]} ${points[current.name][1]} l 7 -12 H 100`}/>
          </svg>}
          {records.map(p => <button type="button" className="folio-atlas__point" key={p.name}
            style={{left:points[p.name][0]+'%',top:points[p.name][1]+'%'}} data-name={p.name}
            title={p.place+' · '+p.name} aria-label={'Seleccionar '+p.place} aria-pressed={current?.name===p.name}
            onClick={() => setInspected(p.name)}>
            <span>{p.place.split(',')[0]}</span>
          </button>)}
        </div>
      </div>
      <aside className="folio-atlas__legend" aria-label="Lugares del atlas">
        <h3>Índice de lugares</h3>
        {records.length ? <ul>{records.map(p => <li key={p.name}>
          <button type="button" aria-current={current?.name===p.name?'location':undefined} aria-label={'Explorar '+p.name+' en '+p.place} disabled={busy}
            onClick={() => {setInspected(p.name); choose(p.name)}}>
            <span><strong>{p.name}</strong><small>{p.place}</small></span><span aria-hidden="true">↗</span>
          </button>
        </li>)}</ul> : <p role="status">{busy ? 'Cargando lugares…' : 'Sin lugares disponibles.'}</p>}
        {current && <div className="folio-atlas__detail" aria-live="polite">
          <h4 key={current.name}>{current.place}</h4>
          <p>Referencia geográfica de la ficha de {current.name}.</p>
          <button type="button" onClick={()=>choose(current.name)} disabled={busy}>Consultar la fuente <span aria-hidden="true">→</span></button>
        </div>}
      </aside>
    </div>
  </section>
}
