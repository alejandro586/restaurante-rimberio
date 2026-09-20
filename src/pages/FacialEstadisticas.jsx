import {
  useEffect,
  useState
} from "react"

import {
  getMessage,
  obtenerEstadisticasFaciales
} from "../api"


const FacialEstadisticas = () => {
  const [
    datos,
    setDatos
  ] = useState(null)

  const [
    cargando,
    setCargando
  ] = useState(true)

  const [
    error,
    setError
  ] = useState("")


  useEffect(() => {
    let activo = true

    const cargar = async () => {
      setCargando(true)
      setError("")

      try {
        const respuesta =
          await obtenerEstadisticasFaciales()

        if (activo) {
          setDatos(respuesta)
        }

      } catch (problema) {
        if (activo) {
          setError(
            getMessage(problema)
          )
        }

      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    cargar()

    return () => {
      activo = false
    }
  }, [])


  const total =
    Number(datos?.total || 0)

  const promedio =
    Number(datos?.confianza_promedio || 0)

  const distribucion =
    Array.isArray(datos?.distribucion)
      ? datos.distribucion
      : []


  return (
    <>
      <div className="topbar">
        <div>
          <h1>
            Estadísticas faciales
          </h1>

          <p>
            Resumen de las expresiones visibles analizadas por el Workflow.
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error">
          {error}
        </div>
      ) : null}

      {cargando ? (
        <div className="loading">
          Cargando estadísticas...
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
              marginBottom: "16px"
            }}
          >
            <div className="card" style={{ margin: 0 }}>
              <div className="muted" style={{ fontSize: "12px" }}>
                Análisis registrados
              </div>
              <strong style={{ fontSize: "30px" }}>
                {total}
              </strong>
            </div>

            <div className="card" style={{ margin: 0 }}>
              <div className="muted" style={{ fontSize: "12px" }}>
                Confianza promedio
              </div>
              <strong style={{ fontSize: "30px" }}>
                {(promedio * 100).toFixed(1)} %
              </strong>
            </div>

            <div className="card" style={{ margin: 0 }}>
              <div className="muted" style={{ fontSize: "12px" }}>
                Usuarios con análisis
              </div>
              <strong style={{ fontSize: "30px" }}>
                {Number(datos?.usuarios || 0)}
              </strong>
            </div>
          </div>

          <div className="card">
            <h2
              style={{
                marginTop: 0,
                fontSize: "18px"
              }}
            >
              Distribución de resultados
            </h2>

            {distribucion.length === 0 ? (
              <div className="empty">
                No hay suficientes datos todavía.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "12px"
                }}
              >
                {distribucion.map((item) => {
                  const cantidad =
                    Number(item.cantidad || 0)

                  const porcentaje =
                    total > 0
                      ? (cantidad / total) * 100
                      : 0

                  return (
                    <div key={item.expresion_key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          marginBottom: "5px",
                          fontSize: "13px"
                        }}
                      >
                        <strong>
                          {item.expresion_label}
                        </strong>
                        <span className="muted">
                          {cantidad} · {porcentaje.toFixed(1)} %
                        </span>
                      </div>

                      <div
                        style={{
                          height: "8px",
                          borderRadius: "999px",
                          background: "#f0e6df",
                          overflow: "hidden"
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, porcentaje)}%`,
                            background: "#a9461c"
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default FacialEstadisticas
