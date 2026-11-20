import React from 'react'

export default function Notice({kind='info', children}) {
  if (!children) return null
  return <div className="archive-notice" data-kind={kind}
    role={kind==='error'?'alert':kind==='busy'||kind==='success'?'status':undefined}>
    {children}
  </div>
}
