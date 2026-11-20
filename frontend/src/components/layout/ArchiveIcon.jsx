import React from 'react'

const shapes = {
  atlas: <><circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="3.6" ry="8"/><path d="M4 12h16m-15-4h14M5 16h14"/></>,
  book: <><path d="M12 6q-4-3-9-1v14q5-2 9 1 4-3 9-1V5q-5-2-9 1Zm0 0v14"/></>,
  shield: <><path d="m12 2 8 3v6q0 7-8 11-8-4-8-11V5Z"/><path d="m12 7 1.2 3 3.2 1-3.2 1.1-1.2 3-1.2-3-3.2-1.1 3.2-1Z"/></>,
  dna: <><path d="M7 2c0 9 10 11 10 20M17 2C17 11 7 13 7 22M8 5h8M9.5 8h5M8 19h8m-6.5-3h5"/></>,
  search: <><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></>,
  compass: <><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="12" r="6.7" strokeDasharray=".5 2"/><path d="m16.8 6.6-3.3 7-6.4 4 3.2-7Z"/><path d="m10.3 10.6 3.2 3M12 0v3m0 18v3M0 12h3m18 0h3"/></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>
}

export default function ArchiveIcon({name}) {
  return <svg className="archive-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>
}
