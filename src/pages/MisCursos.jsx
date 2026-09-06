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


/* ==========================================================
   RUTAS REALES DE LOS MODULOS
   ========================================================== */

/*
 * IMPORTANTE:
 *
 * Esto NO crea módulos nuevos.
 *
 * Solamente relaciona los módulos que
 * ya existen en Supabase con las páginas
 * que ya existen en el frontend.
 *
 * Gráficos no tiene página propia:
 * está integrado dentro de Datasets.
 */

const RUTAS_MODULO = {

  "big_data.importar":
    "/big-data/importar",

  "big_data.datasets":
    "/big-data/datasets",

  "big_data.analisis":
    "/big-data/analisis",

  "big_data.comparar":
    "/big-data/comparar",

  "big_data.estructura":
    "/big-data/estructura"

}


/* ==========================================================
   NOMBRES VISUALES
   ========================================================== */

const NOMBRES_MODULO = {

  "big_data.importar":
    "Cargar archivos",

  "big_data.datasets":
    "Datasets",

  "big_data.analisis":
    "Análisis",

  "big_data.comparar":
    "Comparación",

  "big_data.estructura":
    "Estructura de datos",

  "big_data.graficos":
    "Gráficos"
}


/* ==========================================================
   ORDEN DE ENTRADA
   ========================================================== */

/*
 * Cuando el usuario pulse "Entrar",
 * intentamos abrir primero una función
 * principal que tenga habilitada.
 *
 * Gráficos queda fuera porque necesita
 * entrar mediante Datasets.
 */

const ORDEN_ENTRADA = [

  "big_data.datasets",

  "big_data.importar",

  "big_data.analisis",

  "big_data.comparar",

  "big_data.estructura"

]


/* ==========================================================
   NORMALIZAR RESPUESTA
   ========================================================== */

const obtenerListaCursos = (
  respuesta
) => {

  if (
    Array.isArray(
      respuesta
    )
  ) {
    return respuesta
  }


  /*
   * /courses/me
   *
   * {
   *   cursos: [...]
   * }
   */
  if (
    Array.isArray(
      respuesta?.cursos
    )
  ) {
    return respuesta.cursos
  }


  /*
   * Compatibilidad:
   *
   * {
   *   permisos: {
   *     cursos: [...]
   *   }
   * }
   */
  if (
    Array.isArray(
      respuesta
        ?.permisos
        ?.cursos
    )
  ) {
    return respuesta
      .permisos
      .cursos
  }


  /*
   * Compatibilidad:
   *
   * {
   *   data: {
   *     cursos: [...]
   *   }
   * }
   */
  if (
    Array.isArray(
      respuesta
        ?.data
        ?.cursos
    )
  ) {
    return respuesta
      .data
      .cursos
  }


  if (
    Array.isArray(
      respuesta?.data
    )
  ) {
    return respuesta.data
  }


  return []
}


/* ==========================================================
   MODULOS DE UN CURSO
   ========================================================== */

const obtenerModulos = (
  curso
) => {

  const modulos =
    Array.isArray(
      curso?.modulos
    )
      ? curso.modulos
      : Array.isArray(
          curso?.modules
        )
        ? curso.modules
        : []


  return modulos
    .filter(
      (
        modulo
      ) =>
        modulo?.activo !==
        false
    )
    .sort(
      (
        a,
        b
      ) =>
        Number(
          a?.orden ||
          0
        ) -
        Number(
          b?.orden ||
          0
        )
    )
}


/* ==========================================================
   RUTA DE ENTRADA DEL CURSO
   ========================================================== */

const obtenerRutaCurso = (
  curso
) => {

  const modulos =
    obtenerModulos(
      curso
    )


  const claves =
    new Set(
      modulos
        .map(
          (
            modulo
          ) =>
            modulo?.clave
        )
        .filter(
          Boolean
        )
    )


  for (
    const clave
    of ORDEN_ENTRADA
  ) {

    if (
      claves.has(
        clave
      ) &&
      RUTAS_MODULO[
        clave
      ]
    ) {

      return RUTAS_MODULO[
        clave
      ]
    }
  }


  return ""
}


/* ==========================================================
   NOMBRE VISUAL DEL MODULO
   ========================================================== */

const nombreModulo = (
  modulo
) => {

  if (
    modulo?.clave &&
    NOMBRES_MODULO[
      modulo.clave
    ]
  ) {

    return NOMBRES_MODULO[
      modulo.clave
    ]
  }


  return (
    modulo?.nombre ||
    "Módulo"
  )
}


/* ==========================================================
   MIS CURSOS
   ========================================================== */

const MisCursos = () => {

  const navigate =
    useNavigate()


  const administrador =
    esAdmin()


  /* ========================================================
     DATOS
     ======================================================== */

  const [
    cursos,
    setCursos
  ] =
    useState([])


  const [
    cargando,
    setCargando
  ] =
    useState(true)


  const [
    error,
    setError
  ] =
    useState("")


  /* ========================================================
     CARGAR CURSOS
     ======================================================== */

  useEffect(
    () => {

      let activo =
        true


      const cargar =
        async () => {

          setCargando(
            true
          )

          setError("")


          try {

            /*
             * ADMIN:
             *
             * ve el catálogo completo.
             *
             * USUARIO:
             *
             * únicamente sus cursos
             * y módulos asignados.
             */
            const respuesta =
              administrador
                ? await obtenerCatalogoCursos()
                : await obtenerMisPermisos()


            if (
              !activo
            ) {
              return
            }


            const lista =
              obtenerListaCursos(
                respuesta
              )
                .filter(
                  (
                    curso
                  ) =>
                    curso?.activo !==
                    false
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    Number(
                      a?.orden ||
                      0
                    ) -
                    Number(
                      b?.orden ||
                      0
                    )
                )


            setCursos(
              lista
            )

          } catch (
            problema
          ) {

            if (
              activo
            ) {

              setCursos([])

              setError(
                getMessage(
                  problema
                )
              )
            }

          } finally {

            if (
              activo
            ) {

              setCargando(
                false
              )
            }
          }
        }


      cargar()


      return () => {

        activo =
          false
      }

    },
    [
      administrador
    ]
  )


  /* ========================================================
     ESTADISTICAS
     ======================================================== */

  const resumen =
    useMemo(
      () => {

        const totalModulos =
          cursos.reduce(
            (
              total,
              curso
            ) =>
              total +
              obtenerModulos(
                curso
              ).length,
            0
          )


        return {
          cursos:
            cursos.length,

          modulos:
            totalModulos
        }
      },
      [
        cursos
      ]
    )


  /* ========================================================
     ENTRAR AL CURSO
     ======================================================== */

  const entrarCurso = (
    curso
  ) => {

    const ruta =
      obtenerRutaCurso(
        curso
      )


    if (
      ruta
    ) {

      navigate(
        ruta
      )
    }
  }


  /* ========================================================
     RENDER
     ======================================================== */

  return (
    <>
      {/* ====================================================
          CABECERA
          ==================================================== */}

      <div className="topbar">

        <div>

          <h1>
            Mis cursos
          </h1>


          <p>
            Accede a los cursos y funciones que tienes habilitados en RIMBERIO.
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


      {/* ====================================================
          RESUMEN
          ==================================================== */}

      <div
        className="metrics"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",

          marginBottom:
            "22px"
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


          <strong
            style={{
              fontSize:
                "16px"
            }}
          >
            {administrador
              ? "Administrador"
              : "Usuario"}
          </strong>

        </div>

      </div>


      {/* ====================================================
          CARGANDO
          ==================================================== */}

      {cargando && (

        <div className="loading">
          Cargando tus cursos...
        </div>

      )}


      {/* ====================================================
          ERROR
          ==================================================== */}

      {!cargando &&
        error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}


      {/* ====================================================
          SIN CURSOS
          ==================================================== */}

      {!cargando &&
        !error &&
        cursos.length ===
          0 && (

        <div className="card">

          <div
            className="empty"
            style={{
              padding:
                "40px 20px"
            }}
          >

            <strong
              style={{
                display:
                  "block",

                marginBottom:
                  "7px",

                fontSize:
                  "16px"
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


      {/* ====================================================
          CURSOS
          ==================================================== */}

      {!cargando &&
        !error &&
        cursos.length >
          0 && (

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",

            gap:
              "18px",

            alignItems:
              "stretch"
          }}
        >

          {cursos.map(
            (
              curso
            ) => {

              const modulos =
                obtenerModulos(
                  curso
                )


              const ruta =
                obtenerRutaCurso(
                  curso
                )


              const disponible =
                Boolean(
                  ruta
                )


              return (
                <div
                  key={
                    curso.id
                  }
                  className="card"
                  style={{
                    margin:
                      0,

                    padding:
                      "0",

                    overflow:
                      "hidden",

                    display:
                      "flex",

                    flexDirection:
                      "column",

                    minHeight:
                      "300px"
                  }}
                >
                  {/* =========================================
                      CABECERA DEL CURSO
                      ========================================= */}

                  <div
                    style={{
                      padding:
                        "20px 20px 17px",

                      borderBottom:
                        "1px solid #eee5df",

                      background:
                        "#fffaf7"
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "space-between",

                        gap:
                          "12px",

                        marginBottom:
                          "14px"
                      }}
                    >
                      {/* ICONO */}

                      <div
                        style={{
                          width:
                            "46px",

                          height:
                            "46px",

                          borderRadius:
                            "12px",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          background:
                            "#f4e4da",

                          color:
                            "#a9461c",

                          fontSize:
                            "18px",

                          fontWeight:
                            800,

                          flexShrink:
                            0
                        }}
                      >
                        {String(
                          curso.nombre ||
                          "C"
                        )
                          .trim()
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </div>


                      {/* ESTADO */}

                      <span
                        style={{
                          border:
                            "1px solid #bbf7d0",

                          background:
                            "#f0fdf4",

                          color:
                            "#166534",

                          borderRadius:
                            "999px",

                          padding:
                            "4px 8px",

                          fontSize:
                            "11px",

                          fontWeight:
                            700
                        }}
                      >
                        Activo
                      </span>

                    </div>


                    {/* NOMBRE */}

                    <h2
                      style={{
                        margin:
                          0,

                        fontSize:
                          "20px",

                        lineHeight:
                          1.25
                      }}
                    >
                      {curso.nombre}
                    </h2>


                    {/* DESCRIPCION */}

                    <p
                      className="muted"
                      style={{
                        margin:
                          "7px 0 0",

                        fontSize:
                          "13px",

                        lineHeight:
                          1.55
                      }}
                    >
                      {curso.descripcion ||
                        "Curso disponible dentro de RIMBERIO."}
                    </p>

                  </div>


                  {/* =========================================
                      CONTENIDO
                      ========================================= */}

                  <div
                    style={{
                      padding:
                        "18px 20px",

                      display:
                        "flex",

                      flexDirection:
                        "column",

                      flex:
                        1
                    }}
                  >
                    {/* INFORMACION */}

                    <div
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "center",

                        gap:
                          "10px",

                        marginBottom:
                          "14px"
                      }}
                    >
                      <span
                        className="muted"
                        style={{
                          fontSize:
                            "12px"
                        }}
                      >
                        Funciones disponibles
                      </span>


                      <strong
                        style={{
                          fontSize:
                            "13px"
                        }}
                      >
                        {modulos.length}
                      </strong>
                    </div>


                    {/* MODULOS */}

                    {modulos.length >
                    0 ? (

                      <div
                        style={{
                          display:
                            "flex",

                          flexWrap:
                            "wrap",

                          gap:
                            "7px",

                          marginBottom:
                            "20px"
                        }}
                      >

                        {modulos.map(
                          (
                            modulo
                          ) => (

                            <span
                              key={
                                modulo.id
                              }
                              style={{
                                border:
                                  "1px solid #e7ddd6",

                                background:
                                  "#faf7f5",

                                borderRadius:
                                  "999px",

                                padding:
                                  "5px 9px",

                                fontSize:
                                  "11px",

                                fontWeight:
                                  600,

                                color:
                                  "#66564c"
                              }}
                            >
                              {nombreModulo(
                                modulo
                              )}
                            </span>

                          )
                        )}

                      </div>

                    ) : (

                      <div
                        className="muted"
                        style={{
                          fontSize:
                            "12px",

                          marginBottom:
                            "20px"
                        }}
                      >
                        No tienes funciones habilitadas en este curso.
                      </div>

                    )}


                    {/* ESPACIADOR */}

                    <div
                      style={{
                        flex:
                          1
                      }}
                    />


                    {/* BOTON */}

                    {disponible ? (

                      <button
                        type="button"
                        className="btn btn-block"
                        onClick={
                          () =>
                            entrarCurso(
                              curso
                            )
                        }
                      >
                        Entrar al curso
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="btn btn-block"
                        disabled
                        style={{
                          opacity:
                            0.55,

                          cursor:
                            "not-allowed"
                        }}
                      >
                        Sin función principal habilitada
                      </button>

                    )}

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