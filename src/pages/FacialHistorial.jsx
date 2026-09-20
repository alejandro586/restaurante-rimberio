import {
  useEffect,
  useState
} from "react"

import {
  getMessage,
  obtenerHistorialFacial
} from "../api"


const porcentaje = (valor) => {
  const numero = Number(valor)

  if (!Number.isFinite(numero)) {
    return "—"
  }

  return `${(
    numero <= 1
      ? numero * 100
      : numero
  ).toFixed(1)} %`
}


const FacialHistorial = () => {
  const [
    registros,
    setRegistros
  ] = useState([])

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
          await obtenerHistorialFacial({
            limite: 100
          })

        if (activo) {
          setRegistros(
            Array.isArray(respuesta?.registros)
              ? respuesta.registros
              : []
          )
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


  return (
    <>
      <div className="topbar">
        <div>
          <h1>
            Historial facial
          </h1>

          <p>
            Registro de resultados. Las fotografías no se almacenan en RIMBERIO.
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error">
          {error}
        </div>
      ) : null}

      <div className="card">
        {cargando ? (
          <div className="loading">
            Cargando historial...
          </div>
        ) : registros.length === 0 ? (
          <div
            className="empty"
            style={{
              padding: "36px 18px"
            }}
          >
            Todavía no hay análisis registrados.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto"
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "760px"
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px" }}>Fecha</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Usuario</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Expresión visible</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Confianza</th>
                  <th style={{ textAlign: "left", padding: "10px" }}>Fuente</th>
                </tr>
              </thead>

              <tbody>
                {registros.map((registro) => (
                  <tr
                    key={registro.id}
                    style={{
                      borderTop: "1px solid #eee3dc"
                    }}
                  >
                    <td style={{ padding: "10px" }}>
                      {new Date(registro.created_at).toLocaleString("es-PE")}
                    </td>

                    <td style={{ padding: "10px" }}>
                      <strong>
                        {registro.usuario_nombre || registro.usuario_email || "Usuario"}
                      </strong>
                      {registro.usuario_email && registro.usuario_nombre ? (
                        <div className="muted" style={{ fontSize: "11px" }}>
                          {registro.usuario_email}
                        </div>
                      ) : null}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {registro.expresion_label}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {porcentaje(registro.confidence)}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {registro.source === "camara"
                        ? "Cámara"
                        : "Imagen"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default FacialHistorial
