import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useNavigate
} from "react-router-dom"

import {
  esAdmin,
  getInitials,
  getMessage,
  getUserName,
  obtenerCatalogoCursos,
  obtenerMisPermisos
} from "../api"

import {
  obtenerNombreModulo,
  obtenerRutaInicioCurso
} from "../courseConfig"


const obtenerListaCursos = (
  respuesta
) => {
  if (Array.isArray(respuesta)) {
    return respuesta
  }

  if (Array.isArray(respuesta?.cursos)) {
    return respuesta.cursos
  }

  if (
    Array.isArray(
      respuesta?.permisos?.cursos
    )
  ) {
    return respuesta.permisos.cursos
  }

  if (
    Array.isArray(
      respuesta?.data?.cursos
    )
  ) {
    return respuesta.data.cursos
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data
  }

  return []
}


const obtenerModulos = (
  curso
) =>
  (Array.isArray(curso?.modulos)
    ? curso.modulos
    : Array.isArray(curso?.modules)
      ? curso.modules
      : []
  )
    .filter(
      (modulo) =>
        modulo?.activo !== false
    )
    .sort(
      (a, b) =>
        Number(a?.orden || 0) -
        Number(b?.orden || 0)
    )


const MisCursos = () => {
  const navigate =
    useNavigate()

  const administrador =
    esAdmin()

  const [
    cursos,
    setCursos
  ] = useState([])

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
            administrador
              ? await obtenerCatalogoCursos()
              : await obtenerMisPermisos()

          if (!activo) {
            return
          }

          const lista =
            obtenerListaCursos(respuesta)
              .filter(
                (curso) =>
                  curso?.activo !== false
              )
              .sort(
                (a, b) =>
                  Number(a?.orden || 0) -
                  Number(b?.orden || 0)
              )

          setCursos(lista)

        } catch (problema) {
          if (!activo) {
            return
          }

          setCursos([])
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
    [administrador]
  )


  const resumen =
    useMemo(
      () => ({
        cursos:
          cursos.length,

        modulos:
          cursos.reduce(
            (total, curso) =>
              total +
              obtenerModulos(curso).length,
            0
          )
      }),
      [cursos]
    )


  const entrarCurso = (
    curso
  ) => {
    const ruta =
      obtenerRutaInicioCurso(curso)

    if (ruta) {
      navigate(ruta)
    }
  }


  return (
    <>
      <div className="topbar">
        <div>
          <h1>
            Mis cursos
          </h1>

          <p>
            Accede a los cursos que tienes habilitados. Las actividades aparecen recién al entrar en cada curso.
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
        className="metrics"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          marginBottom: "22px"
        }}
      >
        <div className="metric">
          <span>
            Cursos disponibles
          </span>
          <strong>
            {resumen.cursos}
          </strong>
        </div>

        <div className="metric">
          <span>
            Funciones habilitadas
          </span>
          <strong>
            {resumen.modulos}
          </strong>
        </div>

        <div className="metric">
          <span>
            Tipo de acceso
          </span>
          <strong style={{ fontSize: "16px" }}>
            {administrador
              ? "Administrador"
              : "Usuario"}
          </strong>
        </div>
      </div>


      {cargando && (
        <div className="loading">
          Cargando tus cursos...
        </div>
      )}


      {!cargando && error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}


      {!cargando &&
        !error &&
        cursos.length === 0 && (
        <div className="card">
          <div
            className="empty"
            style={{ padding: "40px 20px" }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "16px"
              }}
            >
              No tienes cursos asignados
            </strong>

            <span>
              Un administrador debe habilitarte un curso para comenzar.
            </span>
          </div>
        </div>
      )}


      {!cargando &&
        !error &&
        cursos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "18px",
            alignItems: "stretch"
          }}
        >
          {cursos.map(
            (curso) => {
              const modulos =
                obtenerModulos(curso)

              const disponible =
                Boolean(
                  obtenerRutaInicioCurso(curso)
                ) &&
                modulos.length > 0

              return (
                <div
                  key={curso.id || curso.slug}
                  className="card"
                  style={{
                    margin: 0,
                    padding: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "300px"
                  }}
                >
                  <div
                    style={{
                      padding: "20px 20px 17px",
                      borderBottom:
                        "1px solid #eee5df",
                      background: "#fffaf7"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "12px",
                        marginBottom: "14px"
                      }}
                    >
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f4e4da",
                          color: "#a9461c",
                          fontSize: "18px",
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {String(
                          curso.nombre || "C"
                        )
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span
                        style={{
                          border:
                            "1px solid #bbf7d0",
                          background: "#f0fdf4",
                          color: "#166534",
                          borderRadius: "999px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: 700
                        }}
                      >
                        Activo
                      </span>
                    </div>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        lineHeight: 1.25
                      }}
                    >
                      {curso.nombre}
                    </h2>

                    <p
                      className="muted"
                      style={{
                        margin: "7px 0 0",
                        fontSize: "13px",
                        lineHeight: 1.55
                      }}
                    >
                      {curso.descripcion ||
                        "Curso disponible dentro de RIMBERIO."}
                    </p>
                  </div>


                  <div
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "14px"
                      }}
                    >
                      <span
                        className="muted"
                        style={{ fontSize: "12px" }}
                      >
                        Funciones disponibles
                      </span>

                      <strong style={{ fontSize: "13px" }}>
                        {modulos.length}
                      </strong>
                    </div>


                    {modulos.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "7px",
                          marginBottom: "20px"
                        }}
                      >
                        {modulos.map(
                          (modulo) => (
                            <span
                              key={
                                modulo.id ||
                                modulo.clave
                              }
                              style={{
                                border:
                                  "1px solid #e7ddd6",
                                background: "#faf7f5",
                                borderRadius: "999px",
                                padding: "5px 9px",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#66564c"
                              }}
                            >
                              {obtenerNombreModulo(modulo)}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <div
                        className="muted"
                        style={{
                          fontSize: "12px",
                          marginBottom: "20px"
                        }}
                      >
                        No tienes funciones habilitadas en este curso.
                      </div>
                    )}

                    <div style={{ flex: 1 }} />

                    <button
                      type="button"
                      className="btn btn-block"
                      disabled={!disponible}
                      onClick={() =>
                        entrarCurso(curso)
                      }
                      style={!disponible
                        ? {
                            opacity: 0.55,
                            cursor: "not-allowed"
                          }
                        : undefined}
                    >
                      {disponible
                        ? "Entrar al curso"
                        : "Sin funciones habilitadas"}
                    </button>
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}
    </>
  )
}


export default MisCursos
