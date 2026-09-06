import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useNavigate
} from "react-router-dom"

import {
  getInitials,
  getMessage,
  getUserName,
  obtenerCatalogoCursos
} from "../api"


/* ==========================================================
   RUTAS IMPLEMENTADAS ACTUALMENTE
   ========================================================== */

/*
 * IMPORTANTE:
 *
 * Esta tabla NO inventa módulos.
 *
 * Solamente relaciona las funciones
 * que ya existen actualmente en Big Data
 * con sus pantallas reales.
 */

const RUTAS_IMPLEMENTADAS = {

  "big_data.importar": {
    ruta:
      "/big-data/importar",

    nombre:
      "Cargar archivos",

    tipo:
      "Pantalla"
  },


  "big_data.datasets": {
    ruta:
      "/big-data/datasets",

    nombre:
      "Datasets",

    tipo:
      "Pantalla"
  },


  "big_data.analisis": {
    ruta:
      "/big-data/analisis",

    nombre:
      "Análisis",

    tipo:
      "Pantalla"
  },


  "big_data.comparar": {
    ruta:
      "/big-data/comparar",

    nombre:
      "Comparación",

    tipo:
      "Pantalla"
  },


  "big_data.estructura": {
    ruta:
      "/big-data/estructura",

    nombre:
      "Estructura de datos",

    tipo:
      "Pantalla"
  },


  /*
   * Gráficos ya no tiene una pantalla
   * independiente.
   *
   * Está dentro de:
   *
   * Datasets
   *   └── Gráficos
   */
  "big_data.graficos": {
    ruta:
      "/big-data/datasets",

    nombre:
      "Gráficos",

    tipo:
      "Integrado en Datasets"
  }

}


/* ==========================================================
   NORMALIZAR LISTA DE CURSOS
   ========================================================== */

const obtenerListaCursos = (
  respuesta
) => {

  /*
   * El backend puede devolver
   * directamente un array.
   */
  if (
    Array.isArray(
      respuesta
    )
  ) {

    return respuesta
  }


  /*
   * Forma utilizada actualmente:
   *
   * {
   *   total_cursos: 1,
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
   * Compatibilidad.
   */
  if (
    Array.isArray(
      respuesta?.data
    )
  ) {

    return respuesta.data
  }


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


  return []
}


/* ==========================================================
   NORMALIZAR MODULOS
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


  /*
   * Ordenamos utilizando el campo
   * orden que ya existe en la base.
   */
  return [
    ...modulos
  ].sort(
    (
      a,
      b
    ) =>
      Number(
        a?.orden || 0
      ) -
      Number(
        b?.orden || 0
      )
  )
}


/* ==========================================================
   TEXTO SEGURO
   ========================================================== */

const texto = (
  valor,
  respaldo = "—"
) => {

  const resultado =
    String(
      valor ?? ""
    ).trim()


  return resultado ||
    respaldo
}


/* ==========================================================
   ADMINISTRACION DE CURSOS
   ========================================================== */

const AdminCursos = () => {

  const navigate =
    useNavigate()


  /* ========================================================
     DATOS
     ======================================================== */

  const [
    cursos,
    setCursos
  ] =
    useState([])


  /* ========================================================
     ESTADO
     ======================================================== */

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


  const [
    busqueda,
    setBusqueda
  ] =
    useState("")


  const [
    cursoAbierto,
    setCursoAbierto
  ] =
    useState(null)


  /* ========================================================
     CARGAR CATALOGO
     ======================================================== */

  const cargarCatalogo =
    async () => {

      setCargando(
        true
      )


      setError(
        ""
      )


      try {

        const respuesta =
          await obtenerCatalogoCursos()


        const lista =
          obtenerListaCursos(
            respuesta
          )


        const ordenados =
          [
            ...lista
          ].sort(
            (
              a,
              b
            ) =>
              Number(
                a?.orden || 0
              ) -
              Number(
                b?.orden || 0
              )
          )


        setCursos(
          ordenados
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )


        setCursos(
          []
        )

      } finally {

        setCargando(
          false
        )
      }
    }


  /* ========================================================
     PRIMERA CARGA
     ======================================================== */

  useEffect(
    () => {

      cargarCatalogo()

    },
    []
  )


  /* ========================================================
     TOTAL DE MODULOS
     ======================================================== */

  const totalModulos =
    useMemo(
      () => {

        return cursos.reduce(
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

      },
      [
        cursos
      ]
    )


  /* ========================================================
     MODULOS CON PANTALLA
     ======================================================== */

  const totalImplementados =
    useMemo(
      () => {

        return cursos.reduce(
          (
            total,
            curso
          ) => {

            const implementados =
              obtenerModulos(
                curso
              ).filter(
                (
                  modulo
                ) =>
                  Boolean(
                    RUTAS_IMPLEMENTADAS[
                      modulo?.clave
                    ]
                  )
              ).length


            return total +
              implementados
          },
          0
        )

      },
      [
        cursos
      ]
    )


  /* ========================================================
     MODULOS SIN PANTALLA
     ======================================================== */

  const totalPendientes =
    Math.max(
      totalModulos -
        totalImplementados,
      0
    )


  /* ========================================================
     FILTRO
     ======================================================== */

  const cursosFiltrados =
    useMemo(
      () => {

        const termino =
          busqueda
            .trim()
            .toLowerCase()


        if (
          !termino
        ) {

          return cursos
        }


        return cursos.filter(
          (
            curso
          ) => {

            const modulos =
              obtenerModulos(
                curso
              )


            const coincideCurso =
              [
                curso?.nombre,
                curso?.slug,
                curso?.descripcion
              ]
                .filter(
                  Boolean
                )
                .some(
                  (
                    valor
                  ) =>
                    String(
                      valor
                    )
                      .toLowerCase()
                      .includes(
                        termino
                      )
                )


            const coincideModulo =
              modulos.some(
                (
                  modulo
                ) =>
                  [
                    modulo?.nombre,
                    modulo?.slug,
                    modulo?.clave,
                    modulo?.descripcion
                  ]
                    .filter(
                      Boolean
                    )
                    .some(
                      (
                        valor
                      ) =>
                        String(
                          valor
                        )
                          .toLowerCase()
                          .includes(
                            termino
                          )
                    )
              )


            return (
              coincideCurso ||
              coincideModulo
            )
          }
        )

      },
      [
        cursos,
        busqueda
      ]
    )


  /* ========================================================
     ABRIR / CERRAR CURSO
     ======================================================== */

  const alternarCurso =
    (
      cursoId
    ) => {

      setCursoAbierto(
        (
          actual
        ) =>
          String(
            actual
          ) ===
          String(
            cursoId
          )
            ? null
            : cursoId
      )
    }


  /* ========================================================
     ABRIR MODULO
     ======================================================== */

  const abrirModulo =
    (
      modulo
    ) => {

      const configuracion =
        RUTAS_IMPLEMENTADAS[
          modulo?.clave
        ]


      if (
        !configuracion?.ruta
      ) {

        return
      }


      navigate(
        configuracion.ruta
      )
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
            Cursos y módulos
          </h1>


          <p>
            Revisa la estructura académica disponible en RIMBERIO y las funciones asociadas a cada curso.
          </p>

        </div>


        <div className="topbar-actions">

          <button
            type="button"
            className="btn btn-ghost"
            onClick={
              cargarCatalogo
            }
            disabled={
              cargando
            }
          >
            {cargando
              ? "Actualizando..."
              : "Actualizar"}
          </button>


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
          ERROR
          ==================================================== */}

      {error && (

        <div className="alert alert-error">

          {error}

        </div>

      )}


      {/* ====================================================
          INDICADORES
          ==================================================== */}

      <div className="metrics metrics-4">

        <div className="metric">

          <span>
            Cursos activos
          </span>


          <strong>
            {cursos.length}
          </strong>

        </div>


        <div className="metric">

          <span>
            Módulos activos
          </span>


          <strong>
            {totalModulos}
          </strong>

        </div>


        <div className="metric">

          <span>
            Funciones conectadas
          </span>


          <strong>
            {totalImplementados}
          </strong>

        </div>


        <div className="metric">

          <span>
            Pendientes de integrar
          </span>


          <strong>
            {totalPendientes}
          </strong>

        </div>

      </div>


      {/* ====================================================
          INFORMACION
          ==================================================== */}

      <div
        className="card"
        style={{
          marginBottom:
            "20px",

          borderLeft:
            "4px solid var(--primary)"
        }}
      >

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-start",

            gap:
              "14px"
          }}
        >

          <div
            style={{
              width:
                "34px",

              height:
                "34px",

              minWidth:
                "34px",

              borderRadius:
                "9px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "var(--primary-soft)",

              color:
                "var(--primary)",

              fontWeight:
                800
            }}
          >
            i
          </div>


          <div>

            <strong
              style={{
                display:
                  "block",

                marginBottom:
                  "5px"
              }}
            >
              Catálogo estructural del ERP
            </strong>


            <p
              className="muted"
              style={{
                lineHeight:
                  1.6
              }}
            >
              Aquí aparecen los cursos y módulos que actualmente están activos en la base de datos. Los módulos con una pantalla ya desarrollada pueden abrirse directamente desde esta vista.
            </p>

          </div>

        </div>

      </div>


      {/* ====================================================
          BUSCADOR
          ==================================================== */}

      <div className="toolbar">

        <div className="toolbar-left">

          <input
            type="search"
            value={
              busqueda
            }
            onChange={
              (
                event
              ) =>
                setBusqueda(
                  event.target.value
                )
            }
            placeholder="Buscar curso, módulo o permiso"
            style={{
              minWidth:
                "280px"
            }}
          />

        </div>


        <div
          className="muted"
          style={{
            fontSize:
              "13px"
          }}
        >
          {cursosFiltrados.length} de {cursos.length} cursos
        </div>

      </div>


      {/* ====================================================
          CARGANDO
          ==================================================== */}

      {cargando && (

        <div className="card">

          <div className="loading">
            Cargando cursos y módulos...
          </div>

        </div>

      )}


      {/* ====================================================
          SIN CURSOS
          ==================================================== */}

      {!cargando &&
        cursosFiltrados.length ===
          0 && (

        <div className="card">

          <div className="empty">

            {cursos.length ===
              0
              ? "No existen cursos activos configurados."
              : "No se encontraron cursos o módulos con esa búsqueda."}

          </div>

        </div>

      )}


      {/* ====================================================
          CURSOS
          ==================================================== */}

      {!cargando &&
        cursosFiltrados.length >
          0 && (

        <div
          style={{
            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "16px"
          }}
        >

          {cursosFiltrados.map(
            (
              curso
            ) => {

              const modulos =
                obtenerModulos(
                  curso
                )


              const abierto =
                String(
                  cursoAbierto
                ) ===
                String(
                  curso.id
                )


              const implementados =
                modulos.filter(
                  (
                    modulo
                  ) =>
                    Boolean(
                      RUTAS_IMPLEMENTADAS[
                        modulo?.clave
                      ]
                    )
                ).length


              return (

                <div
                  className="card"
                  key={
                    curso.id
                  }
                  style={{
                    padding:
                      0,

                    overflow:
                      "hidden"
                  }}
                >

                  {/* =========================================
                      CABECERA DEL CURSO
                      ========================================= */}

                  <button
                    type="button"
                    onClick={
                      () =>
                        alternarCurso(
                          curso.id
                        )
                    }
                    style={{
                      width:
                        "100%",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap:
                        "14px",

                      padding:
                        "20px 22px",

                      border:
                        "none",

                      background:
                        "#ffffff",

                      cursor:
                        "pointer",

                      textAlign:
                        "left"
                    }}
                  >

                    {/* =======================================
                        ICONO
                        ======================================= */}

                    <div
                      style={{
                        width:
                          "46px",

                        height:
                          "46px",

                        minWidth:
                          "46px",

                        borderRadius:
                          "12px",

                        background:
                          "var(--primary-soft)",

                        color:
                          "var(--primary)",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        fontWeight:
                          800,

                        fontSize:
                          "18px"
                      }}
                    >
                      {texto(
                        curso?.nombre,
                        "C"
                      )
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </div>


                    {/* =======================================
                        INFORMACION
                        ======================================= */}

                    <div
                      style={{
                        flex:
                          1,

                        minWidth:
                          0
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            "8px",

                          flexWrap:
                            "wrap"
                        }}
                      >

                        <strong
                          style={{
                            fontSize:
                              "17px"
                          }}
                        >
                          {texto(
                            curso?.nombre,
                            "Curso"
                          )}
                        </strong>


                        <span
                          className="chip chip-capacidad"
                        >
                          Activo
                        </span>

                      </div>


                      <div
                        className="muted"
                        style={{
                          marginTop:
                            "5px",

                          lineHeight:
                            1.5
                        }}
                      >
                        {texto(
                          curso?.descripcion,
                          "Sin descripción"
                        )}
                      </div>

                    </div>


                    {/* =======================================
                        RESUMEN
                        ======================================= */}

                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "22px",

                        flexWrap:
                          "wrap"
                      }}
                    >

                      <div
                        style={{
                          textAlign:
                            "right"
                        }}
                      >

                        <strong
                          style={{
                            display:
                              "block",

                            fontSize:
                              "17px"
                          }}
                        >
                          {modulos.length}
                        </strong>


                        <span
                          className="muted"
                          style={{
                            fontSize:
                              "11px"
                          }}
                        >
                          módulos
                        </span>

                      </div>


                      <div
                        style={{
                          textAlign:
                            "right"
                        }}
                      >

                        <strong
                          style={{
                            display:
                              "block",

                            fontSize:
                              "17px"
                          }}
                        >
                          {implementados}
                        </strong>


                        <span
                          className="muted"
                          style={{
                            fontSize:
                              "11px"
                          }}
                        >
                          conectados
                        </span>

                      </div>


                      <span
                        style={{
                          width:
                            "28px",

                          height:
                            "28px",

                          borderRadius:
                            "8px",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          background:
                            "var(--bg)",

                          fontSize:
                            "16px",

                          transform:
                            abierto
                              ? "rotate(180deg)"
                              : "rotate(0deg)",

                          transition:
                            "transform .18s ease"
                        }}
                      >
                        ▾
                      </span>

                    </div>

                  </button>


                  {/* =========================================
                      DETALLE
                      ========================================= */}

                  {abierto && (

                    <div
                      style={{
                        borderTop:
                          "1px solid var(--border)",

                        padding:
                          "20px 22px",

                        background:
                          "#fffdfb"
                      }}
                    >

                      {/* =====================================
                          DATOS DEL CURSO
                          ===================================== */}

                      <div
                        style={{
                          display:
                            "grid",

                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(170px, 1fr))",

                          gap:
                            "12px",

                          marginBottom:
                            "20px"
                        }}
                      >

                        <div>

                          <span
                            className="muted"
                            style={{
                              display:
                                "block",

                              fontSize:
                                "11px",

                              marginBottom:
                                "4px"
                            }}
                          >
                            ID
                          </span>


                          <strong>
                            {texto(
                              curso?.id
                            )}
                          </strong>

                        </div>


                        <div>

                          <span
                            className="muted"
                            style={{
                              display:
                                "block",

                              fontSize:
                                "11px",

                              marginBottom:
                                "4px"
                            }}
                          >
                            Slug
                          </span>


                          <code>
                            {texto(
                              curso?.slug
                            )}
                          </code>

                        </div>


                        <div>

                          <span
                            className="muted"
                            style={{
                              display:
                                "block",

                              fontSize:
                                "11px",

                              marginBottom:
                                "4px"
                            }}
                          >
                            Orden
                          </span>


                          <strong>
                            {texto(
                              curso?.orden,
                              "0"
                            )}
                          </strong>

                        </div>


                        <div>

                          <span
                            className="muted"
                            style={{
                              display:
                                "block",

                              fontSize:
                                "11px",

                              marginBottom:
                                "4px"
                            }}
                          >
                            Estado
                          </span>


                          <span className="status">

                            <span className="dot dot-green" />

                            Activo

                          </span>

                        </div>

                      </div>


                      {/* =====================================
                          MODULOS
                          ===================================== */}

                      <div
                        className="chart-title"
                        style={{
                          marginBottom:
                            "12px"
                        }}
                      >
                        Módulos del curso
                      </div>


                      {modulos.length ===
                        0 ? (

                        <div className="empty">
                          Este curso todavía no tiene módulos activos.
                        </div>

                      ) : (

                        <div
                          style={{
                            display:
                              "flex",

                            flexDirection:
                              "column",

                            gap:
                              "9px"
                          }}
                        >

                          {modulos.map(
                            (
                              modulo
                            ) => {

                              const configuracion =
                                RUTAS_IMPLEMENTADAS[
                                  modulo?.clave
                                ]


                              const conectado =
                                Boolean(
                                  configuracion
                                )


                              return (

                                <div
                                  key={
                                    modulo.id
                                  }
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap:
                                      "14px",

                                    padding:
                                      "14px",

                                    border:
                                      "1px solid var(--border)",

                                    borderRadius:
                                      "10px",

                                    background:
                                      "#ffffff"
                                  }}
                                >

                                  {/* =========================
                                      NUMERO
                                      ========================= */}

                                  <div
                                    style={{
                                      width:
                                        "34px",

                                      height:
                                        "34px",

                                      minWidth:
                                        "34px",

                                      borderRadius:
                                        "9px",

                                      display:
                                        "flex",

                                      alignItems:
                                        "center",

                                      justifyContent:
                                        "center",

                                      background:
                                        "var(--bg)",

                                      color:
                                        "var(--primary)",

                                      fontWeight:
                                        700
                                    }}
                                  >
                                    {modulo?.orden ??
                                      "•"}
                                  </div>


                                  {/* =========================
                                      DATOS
                                      ========================= */}

                                  <div
                                    style={{
                                      flex:
                                        1,

                                      minWidth:
                                        0
                                    }}
                                  >

                                    <div
                                      style={{
                                        display:
                                          "flex",

                                        alignItems:
                                          "center",

                                        gap:
                                          "7px",

                                        flexWrap:
                                          "wrap"
                                      }}
                                    >

                                      <strong>
                                        {texto(
                                          modulo?.nombre,
                                          "Módulo"
                                        )}
                                      </strong>


                                      <span
                                        className="chip chip-capacidad"
                                      >
                                        Activo
                                      </span>


                                      {conectado ? (

                                        <span
                                          className="chip chip-add_column"
                                        >
                                          Conectado
                                        </span>

                                      ) : (

                                        <span
                                          className="chip chip-tipo"
                                        >
                                          Sin pantalla
                                        </span>

                                      )}

                                    </div>


                                    {modulo?.descripcion && (

                                      <div
                                        className="muted"
                                        style={{
                                          marginTop:
                                            "4px",

                                          fontSize:
                                            "12px",

                                          lineHeight:
                                            1.45
                                        }}
                                      >
                                        {modulo.descripcion}
                                      </div>

                                    )}


                                    <div
                                      style={{
                                        display:
                                          "flex",

                                        gap:
                                          "8px",

                                        flexWrap:
                                          "wrap",

                                        marginTop:
                                          "7px"
                                      }}
                                    >

                                      <code
                                        style={{
                                          fontSize:
                                            "11px",

                                          padding:
                                            "3px 7px",

                                          borderRadius:
                                            "5px",

                                          background:
                                            "var(--bg)"
                                        }}
                                      >
                                        {texto(
                                          modulo?.clave,
                                          "sin-clave"
                                        )}
                                      </code>


                                      {modulo?.slug && (

                                        <span
                                          className="muted"
                                          style={{
                                            fontSize:
                                              "11px"
                                          }}
                                        >
                                          {modulo.slug}
                                        </span>

                                      )}


                                      {configuracion?.tipo && (

                                        <span
                                          className="muted"
                                          style={{
                                            fontSize:
                                              "11px"
                                          }}
                                        >
                                          {configuracion.tipo}
                                        </span>

                                      )}

                                    </div>

                                  </div>


                                  {/* =========================
                                      ACCION
                                      ========================= */}

                                  {conectado ? (

                                    <button
                                      type="button"
                                      className="btn btn-light btn-sm"
                                      onClick={
                                        () =>
                                          abrirModulo(
                                            modulo
                                          )
                                      }
                                    >
                                      Abrir
                                    </button>

                                  ) : (

                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      disabled
                                    >
                                      Pendiente
                                    </button>

                                  )}

                                </div>

                              )
                            }
                          )}

                        </div>

                      )}

                    </div>

                  )}

                </div>

              )
            }
          )}

        </div>

      )}

    </>
  )
}


export default AdminCursos