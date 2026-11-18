function sessionKey() {
  let key = sessionStorage.getItem('origenes.owner')
  if (!key) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,'0')).join('')
    sessionStorage.setItem('origenes.owner',key)
  }
  return key
}

export async function api(path, options = {}, privateOrder = false) {
  const headers = {...options.headers}
  if (privateOrder) headers.Authorization = 'Bearer ' + sessionKey()
  const response = await fetch('/api' + path, {...options, headers, cache:'no-store'})
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(typeof err.detail === 'string' ? err.detail : 'No se pudo completar la solicitud.')
  }
  return response
}

export async function file(order, kind) {
  const response = await api('/orders/' + order.id + '/files/' + kind, {}, true)
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = 'LIA-' + order.surname + '.' + kind
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
