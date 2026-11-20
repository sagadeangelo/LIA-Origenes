import React, {useEffect, useState} from 'react'

export default function WikidataSurname({surname}) {
  const [state,setState] = useState({
    loading:false,
    records:[],
    missing:false,
    error:''
  })

  useEffect(() => {
    if (!surname?.trim()) {
      setState({
        loading:false,
        records:[],
        missing:false,
        error:''
      })
      return
    }

    const controller = new AbortController()

    setState({
      loading:true,
      records:[],
      missing:false,
      error:''
    })

    async function load() {
      try {
        const response = await fetch(
          '/api/wikidata/surnames/' +
          encodeURIComponent(surname.trim()),
          {
            signal:controller.signal,
            cache:'no-store'
          }
        )

        if (response.status === 404) {
          if (!controller.signal.aborted) {
            setState({
              loading:false,
              records:[],
              missing:true,
              error:''
            })
          }
          return
        }

        if (!response.ok) {
          throw new Error(
            'No fue posible consultar la ficha Wikidata.'
          )
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setState({
            loading:false,
            records:Array.isArray(data.records)
              ? data.records
              : [],
            missing:false,
            error:''
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            loading:false,
            records:[],
            missing:false,
            error:error.message
          })
        }
      }
    }

    load()

    return () => controller.abort()
  },[surname])

  if (!surname) {
    return (
      <section className="wikidata-record">
        <h3>Registro Wikidata</h3>
        <p>Selecciona un apellido para consultar sus metadatos.</p>
      </section>
    )
  }

  return (
    <section className="wikidata-record" aria-label="Registro Wikidata">
      <h3>Registro Wikidata · {surname}</h3>

      {state.loading && (
        <p role="status">Consultando registro documental…</p>
      )}

      {state.error && (
        <p role="alert">{state.error}</p>
      )}

      {(state.missing || (!state.loading && !state.error && state.records.length === 0)) && (
        <p role="status">
          No hay un registro Wikidata almacenado para este apellido.
          Esto no significa que el apellido carezca de historia.
        </p>
      )}

      {state.records.map(record => (
        <article className="wikidata-entry" key={record.wikidata_id}>
          <dl className="wikidata-facts">
            <div>
              <dt>Identificador</dt>
              <dd>{record.wikidata_id}</dd>
            </div>
            <div>
              <dt>Clasificación</dt>
              <dd>
                {record.entity_type === 'surname'
                  ? 'Apellido'
                  : record.entity_type}
              </dd>
            </div>
            <div>
              <dt>Propiedades</dt>
              <dd>{record.property_count}</dd>
            </div>
            <div>
              <dt>Referencias adjuntas</dt>
              <dd>{record.reference_count}</dd>
            </div>
          </dl>

          <p className="wikidata-caution">
            Este registro contiene metadatos estructurados.
            No demuestra por sí solo un origen geográfico,
            parentesco o migración familiar.
            {record.reference_count === 0 &&
              ' No tiene referencias documentales adjuntas.'}
          </p>

          {record.source_url?.startsWith(
            'https://www.wikidata.org/'
          ) && (
            <p>
              <a
                href={record.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar registro original en Wikidata
              </a>
            </p>
          )}

          <p className="wikidata-credit">
            Fuente: Wikidata · Licencia: {record.license}
          </p>
        </article>
      ))}
    </section>
  )
}