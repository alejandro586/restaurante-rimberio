import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useNavigate
} from "react-router-dom"

import {
  listarCatalogoAdminCursos,
  crearCursoAdmin,
  actualizarCursoAdmin,
  cambiarEstadoCursoAdmin,
  crearModuloAdmin,
  actualizarModuloAdmin,
  cambiarEstadoModuloAdmin,
  getInitials,
  getMessage,
  getUserName
} from "../api"

import Modal
  from "../components/Modal"


/* ==========================================================
   MODULOS YA CONECTADOS AL FRONTEND
   ========================================================== */

const RUTAS_IMPLEMENTADAS = {

  "big_data.importar": {
    nombre:
      "Cargar archivos",

    ruta:
      "/big-data/importar",

    tipo:
      "Pantalla"
  },


  "big_data.datasets": {
    nombre:
      "Datasets",

    ruta:
      "/big-data/datasets",

    tipo:
      "Pantalla"
  },


  "big_data.analisis": {
    nombre:
      "Análisis",

    ruta:
      "/big-data/analisis",

    tipo:
      "Pantalla"
  },


  "big_data.comparar": {
    nombre:
      "Comparación",

    ruta:
      "/big-data/comparar",

    tipo:
      "Pantalla"
  },


  "big_data.estructura": {
    nombre:
      "Estructura de datos",

    ruta:
      "/big-data/estructura",

    tipo:
      "Pantalla"
  },


  "big_data.graficos": {
    nombre:
      "Gráficos",

    ruta:
      "/big-data/datasets",

    tipo:
      "Integrado en Datasets"
  }

}


/* ==========================================================
   UTILIDADES
   ========================================================== */

const texto = (
  valor,
  respaldo = "—"
) => {

  const contenido =
    String(
      valor ??
      ""
    ).trim()


  return contenido ||
    respaldo
}


/* ==========================================================
   OBTENER CURSOS
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


  if (
    Array.isArray(
      respuesta?.cursos
    )
  ) {

    return respuesta.cursos
  }


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
   OBTENER MODULOS
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


  return [
    ...modulos
  ].sort(
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
   FORMULARIO CURSO VACIO
   ========================================================== */

const cursoVacio = () => ({
  nombre:
    "",

  slug:
    "",

  descripcion:
    "",

  orden:
    "",

  activo:
    true
})


/* ==========================================================
   FORMULARIO MODULO VACIO
   ========================================================== */

const moduloVacio = () => ({
  nombre:
    "",

  slug:
    "",

  clave:
    "",

  descripcion:
    "",

  orden:
    "",

  activo:
    true
})


/* ==========================================================
   ADMIN CURSOS
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
    aviso,
    setAviso
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
     PROCESOS
     ======================================================== */

  const [
    procesando,
    setProcesando
  ] =
    useState("")


  /* ========================================================
     MODAL CURSO
     ======================================================== */

  const [
    modalCurso,
    setModalCurso
  ] =
    useState(null)


  const [
    formularioCurso,
    setFormularioCurso
  ] =
    useState(
      cursoVacio()
    )


  const [
    guardandoCurso,
    setGuardandoCurso
  ] =
    useState(false)


  const [
    errorCurso,
    setErrorCurso
  ] =
    useState("")


  /* ========================================================
     MODAL MODULO
     ======================================================== */

  const [
    modalModulo,
    setModalModulo
  ] =
    useState(null)


  const [
    formularioModulo,
    setFormularioModulo
  ] =
    useState(
      moduloVacio()
    )


  const [
    guardandoModulo,
    setGuardandoModulo
  ] =
    useState(false)


  const [
    errorModulo,
    setErrorModulo
  ] =
    useState("")


  /* ========================================================
     AVISO
     ======================================================== */

  const mostrarAviso =
    (
      mensaje
    ) => {

      setAviso(
        mensaje
      )


      window.setTimeout(
        () => {

          setAviso(
            ""
          )

        },
        3500
      )
    }


  /* ========================================================
     CARGAR CATALOGO
     ======================================================== */

  const cargarCatalogo =
    async (
      mostrarCarga =
        true
    ) => {

      if (
        mostrarCarga
      ) {

        setCargando(
          true
        )
      }


      setError(
        ""
      )


      try {

        const respuesta =
          await listarCatalogoAdminCursos()


        const lista =
          obtenerListaCursos(
            respuesta
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


        setCursoAbierto(
          (
            actual
          ) => {

            if (
              actual &&
              lista.some(
                (
                  curso
                ) =>
                  String(
                    curso.id
                  ) ===
                  String(
                    actual
                  )
              )
            ) {

              return actual
            }


            return lista[0]?.id ??
              null
          }
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        if (
          mostrarCarga
        ) {

          setCargando(
            false
          )
        }
      }
    }


  /* ========================================================
     CARGA INICIAL
     ======================================================== */

  useEffect(
    () => {

      cargarCatalogo()

    },
    []
  )


  /* ========================================================
     METRICAS
     ======================================================== */

  const metricas =
    useMemo(
      () => {

        const todosModulos =
          cursos.flatMap(
            (
              curso
            ) =>
              obtenerModulos(
                curso
              )
          )


        const cursosActivos =
          cursos.filter(
            (
              curso
            ) =>
              curso?.activo !==
              false
          ).length


        const cursosInactivos =
          cursos.length -
          cursosActivos


        const modulosActivos =
          todosModulos.filter(
            (
              modulo
            ) =>
              modulo?.activo !==
              false
          ).length


        const implementados =
          todosModulos.filter(
            (
              modulo
            ) =>
              Boolean(
                RUTAS_IMPLEMENTADAS[
                  modulo?.clave
                ]
              )
          ).length


        return {

          cursos:
            cursos.length,

          cursosActivos,

          cursosInactivos,

          modulos:
            todosModulos.length,

          modulosActivos,

          implementados,

          pendientes:
            todosModulos.length -
            implementados

        }

      },
      [
        cursos
      ]
    )


  /* ========================================================
     BUSQUEDA
     ======================================================== */

  const cursosFiltrados =
    useMemo(
      () => {

        const termino =
          String(
            busqueda ||
            ""
          )
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

            const contenidoCurso =
              [
                curso?.nombre,
                curso?.slug,
                curso?.descripcion,
                curso?.id
              ]
                .join(
                  " "
                )
                .toLowerCase()


            if (
              contenidoCurso.includes(
                termino
              )
            ) {

              return true
            }


            return obtenerModulos(
              curso
            ).some(
              (
                modulo
              ) => {

                const contenidoModulo =
                  [
                    modulo?.nombre,
                    modulo?.slug,
                    modulo?.clave,
                    modulo?.descripcion,
                    modulo?.id
                  ]
                    .join(
                      " "
                    )
                    .toLowerCase()


                return contenidoModulo.includes(
                  termino
                )
              }
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
     ABRIR CREAR CURSO
     ======================================================== */

  const abrirCrearCurso =
    () => {

      setFormularioCurso(
        cursoVacio()
      )


      setErrorCurso(
        ""
      )


      setModalCurso({
        modo:
          "crear"
      })
    }


  /* ========================================================
     ABRIR EDITAR CURSO
     ======================================================== */

  const abrirEditarCurso =
    (
      curso
    ) => {

      setFormularioCurso({

        nombre:
          curso?.nombre ||
          "",

        slug:
          curso?.slug ||
          "",

        descripcion:
          curso?.descripcion ||
          "",

        orden:
          curso?.orden ??
          "",

        activo:
          curso?.activo !==
          false

      })


      setErrorCurso(
        ""
      )


      setModalCurso({
        modo:
          "editar",

        curso
      })
    }


  /* ========================================================
     GUARDAR CURSO
     ======================================================== */

  const guardarCurso =
    async () => {

      setErrorCurso(
        ""
      )


      const nombre =
        String(
          formularioCurso.nombre ||
          ""
        ).trim()


      if (
        !nombre
      ) {

        return setErrorCurso(
          "Ingresa el nombre del curso."
        )
      }


      setGuardandoCurso(
        true
      )


      try {

        if (
          modalCurso?.modo ===
          "crear"
        ) {

          const resultado =
            await crearCursoAdmin({

              nombre,

              slug:
                formularioCurso.slug,

              descripcion:
                formularioCurso.descripcion,

              orden:
                formularioCurso.orden,

              activo:
                formularioCurso.activo

            })


          setModalCurso(
            null
          )


          await cargarCatalogo(
            false
          )


          mostrarAviso(
            resultado?.mensaje ||
            `Curso "${nombre}" creado correctamente.`
          )

        } else {

          const curso =
            modalCurso?.curso


          if (
            !curso?.id
          ) {

            throw new Error(
              "Curso no válido"
            )
          }


          const resultado =
            await actualizarCursoAdmin(
              curso.id,
              {

                nombre,

                slug:
                  formularioCurso.slug,

                descripcion:
                  formularioCurso.descripcion,

                orden:
                  formularioCurso.orden

              }
            )


          setModalCurso(
            null
          )


          await cargarCatalogo(
            false
          )


          mostrarAviso(
            resultado?.mensaje ||
            `Curso "${nombre}" actualizado correctamente.`
          )
        }

      } catch (
        problema
      ) {

        setErrorCurso(
          getMessage(
            problema
          )
        )

      } finally {

        setGuardandoCurso(
          false
        )
      }
    }


  /* ========================================================
     ACTIVAR / DESACTIVAR CURSO
     ======================================================== */

  const cambiarEstadoCurso =
    async (
      curso
    ) => {

      if (
        !curso?.id
      ) {
        return
      }


      const nuevoEstado =
        curso?.activo ===
        false


      const accion =
        nuevoEstado
          ? "activar"
          : "desactivar"


      const confirmado =
        window.confirm(
          `¿Deseas ${accion} el curso "${curso.nombre}"?`
        )


      if (
        !confirmado
      ) {
        return
      }


      const clave =
        `curso-estado-${curso.id}`


      setProcesando(
        clave
      )


      setError(
        ""
      )


      try {

        const resultado =
          await cambiarEstadoCursoAdmin(
            curso.id,
            nuevoEstado
          )


        await cargarCatalogo(
          false
        )


        mostrarAviso(
          resultado?.mensaje ||
          (
            nuevoEstado
              ? "Curso activado correctamente."
              : "Curso desactivado correctamente."
          )
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setProcesando(
          ""
        )
      }
    }


  /* ========================================================
     ABRIR CREAR MODULO
     ======================================================== */

  const abrirCrearModulo =
    (
      curso
    ) => {

      setFormularioModulo(
        moduloVacio()
      )


      setErrorModulo(
        ""
      )


      setModalModulo({

        modo:
          "crear",

        curso

      })
    }


  /* ========================================================
     ABRIR EDITAR MODULO
     ======================================================== */

  const abrirEditarModulo =
    (
      curso,
      modulo
    ) => {

      setFormularioModulo({

        nombre:
          modulo?.nombre ||
          "",

        slug:
          modulo?.slug ||
          "",

        clave:
          modulo?.clave ||
          "",

        descripcion:
          modulo?.descripcion ||
          "",

        orden:
          modulo?.orden ??
          "",

        activo:
          modulo?.activo !==
          false

      })


      setErrorModulo(
        ""
      )


      setModalModulo({

        modo:
          "editar",

        curso,

        modulo

      })
    }


  /* ========================================================
     GUARDAR MODULO
     ======================================================== */

  const guardarModulo =
    async () => {

      setErrorModulo(
        ""
      )


      const nombre =
        String(
          formularioModulo.nombre ||
          ""
        ).trim()


      if (
        !nombre
      ) {

        return setErrorModulo(
          "Ingresa el nombre del módulo."
        )
      }


      setGuardandoModulo(
        true
      )


      try {

        if (
          modalModulo?.modo ===
          "crear"
        ) {

          const curso =
            modalModulo?.curso


          if (
            !curso?.id
          ) {

            throw new Error(
              "Curso no válido"
            )
          }


          const resultado =
            await crearModuloAdmin(
              curso.id,
              {

                nombre,

                slug:
                  formularioModulo.slug,

                clave:
                  formularioModulo.clave,

                descripcion:
                  formularioModulo.descripcion,

                orden:
                  formularioModulo.orden,

                activo:
                  formularioModulo.activo

              }
            )


          setModalModulo(
            null
          )


          setCursoAbierto(
            curso.id
          )


          await cargarCatalogo(
            false
          )


          mostrarAviso(
            resultado?.mensaje ||
            `Módulo "${nombre}" creado correctamente.`
          )

        } else {

          const modulo =
            modalModulo?.modulo


          if (
            !modulo?.id
          ) {

            throw new Error(
              "Módulo no válido"
            )
          }


          const resultado =
            await actualizarModuloAdmin(
              modulo.id,
              {

                nombre,

                slug:
                  formularioModulo.slug,

                clave:
                  formularioModulo.clave,

                descripcion:
                  formularioModulo.descripcion,

                orden:
                  formularioModulo.orden

              }
            )


          setModalModulo(
            null
          )


          await cargarCatalogo(
            false
          )


          mostrarAviso(
            resultado?.mensaje ||
            `Módulo "${nombre}" actualizado correctamente.`
          )
        }

      } catch (
        problema
      ) {

        setErrorModulo(
          getMessage(
            problema
          )
        )

      } finally {

        setGuardandoModulo(
          false
        )
      }
    }


  /* ========================================================
     ACTIVAR / DESACTIVAR MODULO
     ======================================================== */

  const cambiarEstadoModulo =
    async (
      modulo
    ) => {

      if (
        !modulo?.id
      ) {
        return
      }


      const nuevoEstado =
        modulo?.activo ===
        false


      const accion =
        nuevoEstado
          ? "activar"
          : "desactivar"


      const confirmado =
        window.confirm(
          `¿Deseas ${accion} el módulo "${modulo.nombre}"?`
        )


      if (
        !confirmado
      ) {
        return
      }


      const clave =
        `modulo-estado-${modulo.id}`


      setProcesando(
        clave
      )


      setError(
        ""
      )


      try {

        const resultado =
          await cambiarEstadoModuloAdmin(
            modulo.id,
            nuevoEstado
          )


        await cargarCatalogo(
          false
        )


        mostrarAviso(
          resultado?.mensaje ||
          (
            nuevoEstado
              ? "Módulo activado correctamente."
              : "Módulo desactivado correctamente."
          )
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setProcesando(
          ""
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
            Cursos y módulos
          </h1>


          <p>
            Administra la estructura de cursos y módulos disponibles en RIMBERIO.
          </p>

        </div>


        <div className="topbar-actions">

          <button
            type="button"
            className="btn"
            onClick={
              abrirCrearCurso
            }
          >
            + Crear curso
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
          MENSAJES
          ==================================================== */}

      {aviso && (

        <div className="alert alert-success">
          {aviso}
        </div>

      )}


      {error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}


      {/* ====================================================
          METRICAS
          ==================================================== */}

      <div
        className="metrics"
        style={{
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          marginBottom:
            "20px"
        }}
      >

        <div className="metric">

          <span>
            Cursos
          </span>

          <strong>
            {metricas.cursos}
          </strong>

          <small className="muted">
            {metricas.cursosActivos} activos
          </small>

        </div>


        <div className="metric">

          <span>
            Módulos
          </span>

          <strong>
            {metricas.modulos}
          </strong>

          <small className="muted">
            {metricas.modulosActivos} activos
          </small>

        </div>


        <div className="metric">

          <span>
            Funciones conectadas
          </span>

          <strong>
            {metricas.implementados}
          </strong>

          <small className="muted">
            con interfaz disponible
          </small>

        </div>


        <div className="metric">

          <span>
            Pendientes de integrar
          </span>

          <strong>
            {metricas.pendientes}
          </strong>

          <small className="muted">
            módulos sin pantalla
          </small>

        </div>

      </div>


      {/* ====================================================
          BUSCADOR
          ==================================================== */}

      <div
        className="card"
        style={{
          marginBottom:
            "20px"
        }}
      >

        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "12px"
          }}
        >

          <input
            type="text"
            value={
              busqueda
            }
            placeholder="Buscar curso, módulo, slug o clave..."
            onChange={
              (
                event
              ) =>
                setBusqueda(
                  event.target.value
                )
            }
            style={{
              flex:
                1,
              minWidth:
                0
            }}
          />


          <button
            type="button"
            className="btn btn-light"
            onClick={
              () =>
                cargarCatalogo()
            }
            disabled={
              cargando
            }
          >
            {cargando
              ? "Actualizando..."
              : "Actualizar"}
          </button>

        </div>

      </div>


      {/* ====================================================
          CONTENIDO
          ==================================================== */}

      {cargando ? (

        <div className="loading">
          Cargando cursos y módulos...
        </div>

      ) : cursosFiltrados.length ===
        0 ? (

        <div className="empty">
          No se encontraron cursos.
        </div>

      ) : (

        <div
          style={{
            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "18px"
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
                Boolean(
                  String(
                    busqueda ||
                    ""
                  ).trim()
                ) ||
                String(
                  cursoAbierto
                ) ===
                String(
                  curso.id
                )


              const cursoActivo =
                curso?.activo !==
                false


              const cambiandoEstado =
                procesando ===
                `curso-estado-${curso.id}`


              return (
                <div
                  key={
                    curso.id
                  }
                  className="card"
                  style={{
                    padding:
                      0,
                    overflow:
                      "hidden"
                  }}
                >

                  {/* =========================================
                      CABECERA CURSO
                      ========================================= */}

                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",

                      gap:
                        "18px",

                      padding:
                        "18px 20px",

                      background:
                        cursoActivo
                          ? "#ffffff"
                          : "#f8fafc"
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "14px",

                        minWidth:
                          0,

                        flex:
                          1
                      }}
                    >

                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={
                          () =>
                            setCursoAbierto(
                              abierto
                                ? null
                                : curso.id
                            )
                        }
                        style={{
                          width:
                            "36px",
                          minWidth:
                            "36px",
                          padding:
                            "7px"
                        }}
                      >
                        {abierto
                          ? "−"
                          : "+"}
                      </button>


                      <div
                        style={{
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
                              "9px",

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
                              curso.nombre,
                              "Curso"
                            )}
                          </strong>


                          <span
                            style={{
                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              padding:
                                "4px 8px",

                              borderRadius:
                                "999px",

                              fontSize:
                                "11px",

                              fontWeight:
                                700,

                              background:
                                cursoActivo
                                  ? "#dcfce7"
                                  : "#f1f5f9",

                              color:
                                cursoActivo
                                  ? "#166534"
                                  : "#64748b"
                            }}
                          >
                            {cursoActivo
                              ? "ACTIVO"
                              : "INACTIVO"}
                          </span>

                        </div>


                        <div
                          className="muted"
                          style={{
                            marginTop:
                              "4px"
                          }}
                        >
                          ID {curso.id}
                          {" · "}
                          {texto(
                            curso.slug
                          )}
                          {" · "}
                          Orden {curso.orden ?? 0}
                          {" · "}
                          {modulos.length} módulo
                          {modulos.length ===
                          1
                            ? ""
                            : "s"}
                        </div>


                        {curso.descripcion && (

                          <div
                            className="muted"
                            style={{
                              marginTop:
                                "5px"
                            }}
                          >
                            {curso.descripcion}
                          </div>

                        )}

                      </div>

                    </div>


                    {/* =======================================
                        ACCIONES CURSO
                        ======================================= */}

                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "8px",

                        flexWrap:
                          "wrap",

                        justifyContent:
                          "flex-end"
                      }}
                    >

                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={
                          () =>
                            abrirCrearModulo(
                              curso
                            )
                        }
                      >
                        + Módulo
                      </button>


                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={
                          () =>
                            abrirEditarCurso(
                              curso
                            )
                        }
                      >
                        Editar
                      </button>


                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={
                          cambiandoEstado
                        }
                        onClick={
                          () =>
                            cambiarEstadoCurso(
                              curso
                            )
                        }
                        style={{
                          background:
                            cursoActivo
                              ? "#ffffff"
                              : "#f0fdf4",

                          color:
                            cursoActivo
                              ? "#b91c1c"
                              : "#166534",

                          border:
                            cursoActivo
                              ? "1px solid #fecaca"
                              : "1px solid #bbf7d0"
                        }}
                      >
                        {cambiandoEstado
                          ? "Guardando..."
                          : cursoActivo
                            ? "Desactivar"
                            : "Activar"}
                      </button>

                    </div>

                  </div>


                  {/* =========================================
                      MODULOS
                      ========================================= */}

                  {abierto && (

                    <div
                      style={{
                        borderTop:
                          "1px solid #e5e7eb",

                        padding:
                          "18px 20px",

                        background:
                          "#fafafa"
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          marginBottom:
                            "14px"
                        }}
                      >

                        <strong>
                          Módulos del curso
                        </strong>


                        <span className="muted">
                          {modulos.length} registrados
                        </span>

                      </div>


                      {modulos.length ===
                      0 ? (

                        <div className="empty">
                          Este curso todavía no tiene módulos.
                        </div>

                      ) : (

                        <div
                          style={{
                            display:
                              "flex",

                            flexDirection:
                              "column",

                            gap:
                              "10px"
                          }}
                        >

                          {modulos.map(
                            (
                              modulo
                            ) => {

                              const moduloActivo =
                                modulo?.activo !==
                                false


                              const implementacion =
                                RUTAS_IMPLEMENTADAS[
                                  modulo?.clave
                                ]


                              const cambiandoModulo =
                                procesando ===
                                `modulo-estado-${modulo.id}`


                              return (
                                <div
                                  key={
                                    modulo.id
                                  }
                                  style={{
                                    display:
                                      "flex",

                                    justifyContent:
                                      "space-between",

                                    alignItems:
                                      "center",

                                    gap:
                                      "18px",

                                    padding:
                                      "14px 16px",

                                    border:
                                      "1px solid #e5e7eb",

                                    borderRadius:
                                      "10px",

                                    background:
                                      moduloActivo
                                        ? "#ffffff"
                                        : "#f8fafc",

                                    opacity:
                                      moduloActivo
                                        ? 1
                                        : 0.72
                                  }}
                                >

                                  {/* =========================
                                      DATOS MODULO
                                      ========================= */}

                                  <div
                                    style={{
                                      minWidth:
                                        0,

                                      flex:
                                        1
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

                                      <strong>
                                        {texto(
                                          modulo.nombre,
                                          "Módulo"
                                        )}
                                      </strong>


                                      <span
                                        style={{
                                          padding:
                                            "3px 7px",

                                          borderRadius:
                                            "999px",

                                          fontSize:
                                            "10px",

                                          fontWeight:
                                            700,

                                          background:
                                            moduloActivo
                                              ? "#dcfce7"
                                              : "#f1f5f9",

                                          color:
                                            moduloActivo
                                              ? "#166534"
                                              : "#64748b"
                                        }}
                                      >
                                        {moduloActivo
                                          ? "ACTIVO"
                                          : "INACTIVO"}
                                      </span>


                                      <span
                                        style={{
                                          padding:
                                            "3px 7px",

                                          borderRadius:
                                            "999px",

                                          fontSize:
                                            "10px",

                                          fontWeight:
                                            700,

                                          background:
                                            implementacion
                                              ? "#ffedd5"
                                              : "#f1f5f9",

                                          color:
                                            implementacion
                                              ? "#9a3412"
                                              : "#64748b"
                                        }}
                                      >
                                        {implementacion
                                          ? "CONECTADO"
                                          : "PENDIENTE"}
                                      </span>

                                    </div>


                                    <div
                                      className="muted"
                                      style={{
                                        marginTop:
                                          "5px",

                                        fontSize:
                                          "12px"
                                      }}
                                    >
                                      ID {modulo.id}
                                      {" · "}
                                      Orden {modulo.orden ?? 0}
                                      {" · "}
                                      slug: {texto(modulo.slug)}
                                    </div>


                                    <div
                                      className="muted"
                                      style={{
                                        marginTop:
                                          "3px",

                                        fontSize:
                                          "11px",

                                        fontFamily:
                                          "monospace"
                                      }}
                                    >
                                      {texto(
                                        modulo.clave,
                                        "Sin clave"
                                      )}
                                    </div>


                                    {modulo.descripcion && (

                                      <div
                                        className="muted"
                                        style={{
                                          marginTop:
                                            "5px",

                                          fontSize:
                                            "12px"
                                        }}
                                      >
                                        {modulo.descripcion}
                                      </div>

                                    )}


                                    {implementacion && (

                                      <div
                                        className="muted"
                                        style={{
                                          marginTop:
                                            "5px",

                                          fontSize:
                                            "11px"
                                        }}
                                      >
                                        {implementacion.tipo}
                                      </div>

                                    )}

                                  </div>


                                  {/* =========================
                                      ACCIONES MODULO
                                      ========================= */}

                                  <div
                                    style={{
                                      display:
                                        "flex",

                                      alignItems:
                                        "center",

                                      gap:
                                        "7px",

                                      flexWrap:
                                        "wrap",

                                      justifyContent:
                                        "flex-end"
                                    }}
                                  >

                                    {implementacion && (
                                      <button
                                        type="button"
                                        className="btn btn-light btn-sm"
                                        onClick={
                                          () =>
                                            navigate(
                                              implementacion.ruta
                                            )
                                        }
                                      >
                                        Ver
                                      </button>
                                    )}


                                    <button
                                      type="button"
                                      className="btn btn-light btn-sm"
                                      onClick={
                                        () =>
                                          abrirEditarModulo(
                                            curso,
                                            modulo
                                          )
                                      }
                                    >
                                      Editar
                                    </button>


                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      disabled={
                                        cambiandoModulo
                                      }
                                      onClick={
                                        () =>
                                          cambiarEstadoModulo(
                                            modulo
                                          )
                                      }
                                      style={{
                                        background:
                                          moduloActivo
                                            ? "#ffffff"
                                            : "#f0fdf4",

                                        color:
                                          moduloActivo
                                            ? "#b91c1c"
                                            : "#166534",

                                        border:
                                          moduloActivo
                                            ? "1px solid #fecaca"
                                            : "1px solid #bbf7d0"
                                      }}
                                    >
                                      {cambiandoModulo
                                        ? "Guardando..."
                                        : moduloActivo
                                          ? "Desactivar"
                                          : "Activar"}
                                    </button>

                                  </div>

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


      {/* ====================================================
          MODAL CURSO
          ==================================================== */}

      {modalCurso && (

        <Modal
          title={
            modalCurso.modo ===
            "crear"
              ? "Crear curso"
              : "Editar curso"
          }
          onClose={
            () => {

              if (
                guardandoCurso
              ) {
                return
              }


              setModalCurso(
                null
              )


              setErrorCurso(
                ""
              )
            }
          }
          footer={
            (
              cerrar
            ) => (
              <>

                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={
                    guardandoCurso
                  }
                  onClick={
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    guardandoCurso
                  }
                  onClick={
                    guardarCurso
                  }
                >
                  {guardandoCurso
                    ? "Guardando..."
                    : modalCurso.modo ===
                      "crear"
                      ? "Crear curso"
                      : "Guardar cambios"}
                </button>

              </>
            )
          }
        >

          <div className="field">

            <label>
              Nombre *
            </label>

            <input
              type="text"
              autoFocus
              value={
                formularioCurso.nombre
              }
              disabled={
                guardandoCurso
              }
              placeholder="Ej. Big Data"
              onChange={
                (
                  event
                ) =>
                  setFormularioCurso({
                    ...formularioCurso,

                    nombre:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Slug
            </label>

            <input
              type="text"
              value={
                formularioCurso.slug
              }
              disabled={
                guardandoCurso
              }
              placeholder="Ej. big-data"
              onChange={
                (
                  event
                ) =>
                  setFormularioCurso({
                    ...formularioCurso,

                    slug:
                      event.target.value
                  })
              }
            />

            {modalCurso.modo ===
              "crear" && (

              <span className="muted">
                Puedes dejarlo vacío y el backend lo generará automáticamente.
              </span>

            )}

          </div>


          <div className="field">

            <label>
              Descripción
            </label>

            <textarea
              value={
                formularioCurso.descripcion
              }
              disabled={
                guardandoCurso
              }
              rows={4}
              placeholder="Descripción del curso"
              onChange={
                (
                  event
                ) =>
                  setFormularioCurso({
                    ...formularioCurso,

                    descripcion:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Orden
            </label>

            <input
              type="number"
              min="0"
              value={
                formularioCurso.orden
              }
              disabled={
                guardandoCurso
              }
              placeholder="Automático"
              onChange={
                (
                  event
                ) =>
                  setFormularioCurso({
                    ...formularioCurso,

                    orden:
                      event.target.value
                  })
              }
            />

          </div>


          {modalCurso.modo ===
            "crear" && (

            <label
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "9px",

                marginTop:
                  "14px"
              }}
            >

              <input
                type="checkbox"
                checked={
                  formularioCurso.activo
                }
                disabled={
                  guardandoCurso
                }
                onChange={
                  (
                    event
                  ) =>
                    setFormularioCurso({
                      ...formularioCurso,

                      activo:
                        event.target.checked
                    })
                }
              />

              Crear curso activo

            </label>

          )}


          {errorCurso && (

            <div
              className="alert alert-error"
              style={{
                marginTop:
                  "16px"
              }}
            >
              {errorCurso}
            </div>

          )}

        </Modal>

      )}


      {/* ====================================================
          MODAL MODULO
          ==================================================== */}

      {modalModulo && (

        <Modal
          title={
            modalModulo.modo ===
            "crear"
              ? `Agregar módulo a ${modalModulo.curso?.nombre || "curso"}`
              : "Editar módulo"
          }
          onClose={
            () => {

              if (
                guardandoModulo
              ) {
                return
              }


              setModalModulo(
                null
              )


              setErrorModulo(
                ""
              )
            }
          }
          footer={
            (
              cerrar
            ) => (
              <>

                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={
                    guardandoModulo
                  }
                  onClick={
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    guardandoModulo
                  }
                  onClick={
                    guardarModulo
                  }
                >
                  {guardandoModulo
                    ? "Guardando..."
                    : modalModulo.modo ===
                      "crear"
                      ? "Crear módulo"
                      : "Guardar cambios"}
                </button>

              </>
            )
          }
        >

          <div className="field">

            <label>
              Nombre *
            </label>

            <input
              type="text"
              autoFocus
              value={
                formularioModulo.nombre
              }
              disabled={
                guardandoModulo
              }
              placeholder="Ej. Análisis"
              onChange={
                (
                  event
                ) =>
                  setFormularioModulo({
                    ...formularioModulo,

                    nombre:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Slug
            </label>

            <input
              type="text"
              value={
                formularioModulo.slug
              }
              disabled={
                guardandoModulo
              }
              placeholder="Ej. analisis"
              onChange={
                (
                  event
                ) =>
                  setFormularioModulo({
                    ...formularioModulo,

                    slug:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Clave de permiso
            </label>

            <input
              type="text"
              value={
                formularioModulo.clave
              }
              disabled={
                guardandoModulo
              }
              placeholder="Ej. big_data.analisis"
              onChange={
                (
                  event
                ) =>
                  setFormularioModulo({
                    ...formularioModulo,

                    clave:
                      event.target.value
                  })
              }
            />

            {modalModulo.modo ===
              "crear" && (

              <span className="muted">
                Puedes dejarla vacía y el backend generará una clave automáticamente.
              </span>

            )}

          </div>


          <div className="field">

            <label>
              Descripción
            </label>

            <textarea
              rows={4}
              value={
                formularioModulo.descripcion
              }
              disabled={
                guardandoModulo
              }
              placeholder="Descripción del módulo"
              onChange={
                (
                  event
                ) =>
                  setFormularioModulo({
                    ...formularioModulo,

                    descripcion:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Orden
            </label>

            <input
              type="number"
              min="0"
              value={
                formularioModulo.orden
              }
              disabled={
                guardandoModulo
              }
              placeholder="Automático"
              onChange={
                (
                  event
                ) =>
                  setFormularioModulo({
                    ...formularioModulo,

                    orden:
                      event.target.value
                  })
              }
            />

          </div>


          {modalModulo.modo ===
            "crear" && (

            <label
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "9px",

                marginTop:
                  "14px"
              }}
            >

              <input
                type="checkbox"
                checked={
                  formularioModulo.activo
                }
                disabled={
                  guardandoModulo
                }
                onChange={
                  (
                    event
                  ) =>
                    setFormularioModulo({
                      ...formularioModulo,

                      activo:
                        event.target.checked
                    })
                }
              />

              Crear módulo activo

            </label>

          )}


          {errorModulo && (

            <div
              className="alert alert-error"
              style={{
                marginTop:
                  "16px"
              }}
            >
              {errorModulo}
            </div>

          )}

        </Modal>

      )}

    </>
  )
}


export default AdminCursos