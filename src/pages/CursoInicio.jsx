import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useNavigate,
  useParams
} from "react-router-dom"

import {
  getInitials,
  getMessage,
  getUserName,
  obtenerCurso
} from "../api"

import {
  obtenerIconoModulo,
  obtenerNombreModulo,
  obtenerRutaModulo
} from "../courseConfig"


const ordenarModulos = (
  modulos
) =>
  (Array.isArray(modulos) ? modulos : [])
    .filter(
      (modulo) =>
        modulo?.activo !== false
    )
    .sort(
      (a, b) =>
        Number(a?.orden || 0) -
        Number(b?.orden || 0)
    )


const CursoInicio = () => {
  const navigate =
    useNavigate()

  const {
    curso: cursoParametro
  } = useParams()

  const [
    curso,
    setCurso
  ] = useState(null)

  const [
    cargando,
    setCargando
  ] = useState(true)

  const [
    error,
    setError
  ] = useState("")


  useEffect(
    () => {
      let activo = true

      const cargar = async () => {
        setCargando(true)
        setError("")

        try {
          const respuesta =
            await obtenerCurso(
              cursoParametro
            )

          if (!activo) {
            return
          }

          setCurso(respuesta || null)

        } catch (problema) {
          if (!activo) {
            return
          }

          setCurso(null)
          setError(
            getMessage(problema)
          )

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
    },
    [cursoParametro]
  )


  const modulos =
    useMemo(
      () =>
        ordenarModulos(
          curso?.modulos
        ),
      [curso]
    )


  if (cargando) {
    return (
      <div className="loading">
        Cargando curso...
      </div>
    )
  }


  if (error || !curso) {
    return (
      <div className="card">
        <div className="alert alert-error">
          {error || "No se pudo abrir este curso."}
        </div>

        <button
          type="button"
          className="btn"
          onClick={() =>
            navigate("/mis-cursos")
          }
        >
          Volver a Mis cursos
        </button>
      </div>
    )
  }


  return (
    <>
      <div className="topbar">
        <div>
          <h1>
            {curso.nombre}
          </h1>

          <p>
            {curso.descripcion ||
              "Selecciona una de las funciones que tienes habilitadas."}
          </p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">
              {getInitials()}
            </span>

            <span>
              {getUserName()}
            </span>
          </div>
        </div>
      </div>


      <div
        className="card"
        style={{
          marginBottom: "18px",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <strong
            style={{
              display: "block",
              fontSize: "15px",
              marginBottom: "5px"
            }}
          >
            Funciones habilitadas: {modulos.length}
          </strong>

          <span className="muted">
            Solo puedes acceder a las actividades autorizadas para tu usuario.
          </span>
        </div>

        <button
          type="button"
          className="btn btn-light"
          onClick={() =>
            navigate("/mis-cursos")
          }
        >
          ← Salir del curso
        </button>
      </div>


      {modulos.length === 0 ? (
        <div className="card">
          <div
            className="empty"
            style={{
              padding: "38px 20px"
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "7px"
              }}
            >
              No tienes actividades habilitadas
            </strong>

            <span>
              Un administrador debe asignarte al menos una función de este curso.
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px"
          }}
        >
          {modulos.map(
            (modulo) => {
              const ruta =
                obtenerRutaModulo(
                  modulo?.clave
                )

              const disponible =
                Boolean(ruta)

              return (
                <div
                  key={modulo.id || modulo.clave}
                  className="card"
                  style={{
                    margin: 0,
                    minHeight: "205px",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f4e4da",
                      color: "#a9461c",
                      fontSize: "19px",
                      fontWeight: 800,
                      marginBottom: "14px"
                    }}
                  >
                    {obtenerIconoModulo(modulo)}
                  </div>

                  <h2
                    style={{
                      fontSize: "17px",
                      marginBottom: "7px"
                    }}
                  >
                    {obtenerNombreModulo(modulo)}
                  </h2>

                  <p
                    className="muted"
                    style={{
                      lineHeight: 1.55,
                      marginBottom: "18px"
                    }}
                  >
                    {modulo.descripcion ||
                      "Función disponible dentro de este curso."}
                  </p>

                  <div style={{ flex: 1 }} />

                  <button
                    type="button"
                    className="btn btn-block"
                    disabled={!disponible}
                    onClick={() => {
                      if (ruta) {
                        navigate(ruta)
                      }
                    }}
                    style={!disponible
                      ? {
                          opacity: 0.55,
                          cursor: "not-allowed"
                        }
                      : undefined}
                  >
                    {disponible
                      ? "Abrir actividad"
                      : "Actividad en preparación"}
                  </button>
                </div>
              )
            }
          )}
        </div>
      )}
    </>
  )
}


export default CursoInicio
