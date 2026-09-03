import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useNavigate,
  useParams
} from "react-router-dom"

import api, {
  getInitials,
  getMessage,
  getUser,
  getUserName
} from "../api"

import Modal from "../components/Modal"

const TABS = [
  {
    id: "resumen",
    label: "Resumen"
  },
  {
    id: "actividades",
    label: "Actividades"
  },
  {
    id: "equipo",
    label: "Equipo"
  },
  {
    id: "documentos",
    label: "Documentos"
  },
  {
    id: "historial",
    label: "Historial"
  }
]

const ESTADOS_PROYECTO = {
  activo: {
    texto: "Activo",
    clase: "project-status-active"
  },

  pausado: {
    texto: "Pausado",
    clase: "project-status-paused"
  },

  completado: {
    texto: "Completado",
    clase: "project-status-completed"
  },

  archivado: {
    texto: "Archivado",
    clase: "project-status-archived"
  }
}

const ESTADOS_TAREA = {
  pendiente: {
    texto: "Pendiente",
    clase: "task-status-pending"
  },

  en_progreso: {
    texto: "En progreso",
    clase: "task-status-progress"
  },

  en_revision: {
    texto: "En revisión",
    clase: "task-status-review"
  },

  completada: {
    texto: "Completada",
    clase: "task-status-done"
  }
}

const PRIORIDADES = {
  baja: {
    texto: "Baja",
    clase: "task-priority-low"
  },

  media: {
    texto: "Media",
    clase: "task-priority-medium"
  },

  alta: {
    texto: "Alta",
    clase: "task-priority-high"
  },

  urgente: {
    texto: "Urgente",
    clase: "task-priority-urgent"
  }
}

const ROLES = {
  owner: "Propietario",
  manager: "Responsable",
  developer: "Desarrollador",
  member: "Miembro",
  viewer: "Solo lectura",
  admin: "Administrador"
}

const formularioInicial = {
  titulo: "",
  mensaje: "",
  prioridad: "media",
  asignada_a: "",
  fecha_limite: ""
}

const ProyectoDetalle = () => {
  const { id } = useParams()

  const navigate = useNavigate()

  const usuarioActual =
    getUser()

  const [
    proyecto,
    setProyecto
  ] = useState(null)

  const [
    miembros,
    setMiembros
  ] = useState([])

  const [
    actividades,
    setActividades
  ] = useState([])

  const [
    miembrosAsignables,
    setMiembrosAsignables
  ] = useState([])

  const [
    tab,
    setTab
  ] = useState("resumen")

  const [
    cargando,
    setCargando
  ] = useState(true)

  const [
    cargandoActividades,
    setCargandoActividades
  ] = useState(false)

  const [
    error,
    setError
  ] = useState("")

  const [
    errorActividades,
    setErrorActividades
  ] = useState("")

  const [
    modalActividad,
    setModalActividad
  ] = useState(false)

  const [
    formulario,
    setFormulario
  ] = useState(
    formularioInicial
  )

  const [
    guardando,
    setGuardando
  ] = useState(false)

  const [
    errorFormulario,
    setErrorFormulario
  ] = useState("")

  const [
    actualizandoTarea,
    setActualizandoTarea
  ] = useState(null)

  const [
    eliminandoTarea,
    setEliminandoTarea
  ] = useState(null)

  /**
   * Carga la información general
   * del proyecto.
   */
  const cargarProyecto = async () => {
    setCargando(true)
    setError("")

    try {
      const [
        respuestaProyecto,
        respuestaMiembros
      ] = await Promise.all([
        api.get(
          `/projects/${id}`
        ),

        api.get(
          `/projects/${id}/members`
        )
      ])

      setProyecto(
        respuestaProyecto.data
      )

      setMiembros(
        Array.isArray(
          respuestaMiembros.data
        )
          ? respuestaMiembros.data
          : []
      )
    } catch (problema) {
      setError(
        getMessage(problema)
      )
    } finally {
      setCargando(false)
    }
  }

  /**
   * Carga actividades y miembros
   * disponibles para asignación.
   */
  const cargarActividades = async () => {
    setCargandoActividades(true)
    setErrorActividades("")

    try {
      const [
        respuestaActividades,
        respuestaMiembros
      ] = await Promise.all([
        api.get(
          `/projects/${id}/tasks`
        ),

        api.get(
          `/projects/${id}/tasks/members`
        )
      ])

      setActividades(
        Array.isArray(
          respuestaActividades.data
        )
          ? respuestaActividades.data
          : []
      )

      setMiembrosAsignables(
        Array.isArray(
          respuestaMiembros.data
        )
          ? respuestaMiembros.data
          : []
      )
    } catch (problema) {
      setErrorActividades(
        getMessage(problema)
      )
    } finally {
      setCargandoActividades(false)
    }
  }

  useEffect(() => {
    cargarProyecto()
  }, [id])

  useEffect(() => {
    if (
      tab === "actividades"
    ) {
      cargarActividades()
    }
  }, [
    tab,
    id
  ])

  /**
   * Permisos visuales.
   *
   * El backend vuelve a validar
   * estos permisos.
   */
  const puedeGestionar =
    useMemo(() => {
      if (!proyecto) {
        return false
      }

      return [
        "admin",
        "owner",
        "manager"
      ].includes(
        proyecto.mi_rol
      )
    }, [proyecto])

  const estadoActual =
    useMemo(() => {
      if (!proyecto) {
        return null
      }

      return (
        ESTADOS_PROYECTO[
          proyecto.estado
        ] || {
          texto:
            proyecto.estado ||
            "Sin estado",

          clase:
            "project-status-archived"
        }
      )
    }, [proyecto])

  const resumenActividades =
    useMemo(() => {
      return {
        total:
          actividades.length,

        pendientes:
          actividades.filter(
            (tarea) =>
              tarea.estado ===
              "pendiente"
          ).length,

        progreso:
          actividades.filter(
            (tarea) =>
              tarea.estado ===
              "en_progreso"
          ).length,

        revision:
          actividades.filter(
            (tarea) =>
              tarea.estado ===
              "en_revision"
          ).length,

        completadas:
          actividades.filter(
            (tarea) =>
              tarea.estado ===
              "completada"
          ).length
      }
    }, [actividades])

  const fecha = (
    valor
  ) => {
    if (!valor) {
      return "Sin fecha"
    }

    return new Date(
      valor
    ).toLocaleDateString(
      "es-PE",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    )
  }

  const fechaCompleta = (
    valor
  ) => {
    if (!valor) {
      return "Sin fecha límite"
    }

    return new Date(
      valor
    ).toLocaleDateString(
      "es-PE",
      {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    )
  }

  const iniciales = (
    nombre
  ) => {
    if (!nombre) {
      return "U"
    }

    const partes =
      nombre
        .trim()
        .split(" ")
        .filter(Boolean)

    if (
      partes.length === 0
    ) {
      return "U"
    }

    if (
      partes.length === 1
    ) {
      return partes[0]
        .charAt(0)
        .toUpperCase()
    }

    return (
      partes[0]
        .charAt(0)
        .toUpperCase() +
      partes[1]
        .charAt(0)
        .toUpperCase()
    )
  }

  /**
   * Abrir modal.
   */
  const abrirNuevaActividad = () => {
    setFormulario({
      ...formularioInicial,

      asignada_a:
        miembrosAsignables[0]
          ?.id ||
        ""
    })

    setErrorFormulario("")
    setModalActividad(true)
  }

  const cerrarNuevaActividad = () => {
    if (guardando) {
      return
    }

    setModalActividad(false)
    setErrorFormulario("")
  }

  const cambiarFormulario = (
    event
  ) => {
    const {
      name,
      value
    } = event.target

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value
      })
    )
  }

  /**
   * Crear actividad.
   */
  const crearActividad = async (
    event
  ) => {
    event.preventDefault()

    const titulo =
      formulario.titulo.trim()

    const mensaje =
      formulario.mensaje.trim()

    if (
      titulo.length < 3
    ) {
      setErrorFormulario(
        "El título debe tener al menos 3 caracteres."
      )

      return
    }

    if (
      mensaje.length < 3
    ) {
      setErrorFormulario(
        "Escribe una descripción para la actividad."
      )

      return
    }

    if (
      !formulario.asignada_a
    ) {
      setErrorFormulario(
        "Selecciona un miembro del proyecto."
      )

      return
    }

    setGuardando(true)
    setErrorFormulario("")

    try {
      /**
       * Se utiliza 23:59 para evitar
       * desplazamientos de fecha
       * por zona horaria.
       */
      const fechaLimite =
        formulario.fecha_limite
          ? `${formulario.fecha_limite}T23:59:59`
          : null

      const respuesta =
        await api.post(
          `/projects/${id}/tasks`,
          {
            titulo,

            mensaje,

            prioridad:
              formulario.prioridad,

            estado:
              "pendiente",

            asignada_a:
              formulario.asignada_a,

            fecha_limite:
              fechaLimite
          }
        )

      setActividades(
        (actuales) => [
          respuesta.data,
          ...actuales
        ]
      )

      /**
       * Actualizamos contadores
       * del encabezado.
       */
      setProyecto(
        (actual) => ({
          ...actual,

          total_tareas:
            Number(
              actual.total_tareas ||
                0
            ) + 1,

          tareas_pendientes:
            Number(
              actual.tareas_pendientes ||
                0
            ) + 1
        })
      )

      setFormulario(
        formularioInicial
      )

      setModalActividad(false)
    } catch (problema) {
      setErrorFormulario(
        getMessage(problema)
      )
    } finally {
      setGuardando(false)
    }
  }

  /**
   * Cambiar estado.
   */
  const cambiarEstadoActividad =
    async (
      tarea,
      nuevoEstado
    ) => {
      if (
        tarea.estado ===
        nuevoEstado
      ) {
        return
      }

      setActualizandoTarea(
        tarea.id
      )

      setErrorActividades("")

      try {
        const respuesta =
          await api.patch(
            `/projects/${id}/tasks/${tarea.id}`,
            {
              estado:
                nuevoEstado
            }
          )

        setActividades(
          (actuales) =>
            actuales.map(
              (item) =>
                item.id ===
                tarea.id
                  ? respuesta.data
                  : item
            )
        )

        /**
         * Recalculamos pendientes
         * a partir del nuevo estado.
         */
        setProyecto(
          (actual) => {
            let pendientes =
              Number(
                actual.tareas_pendientes ||
                  0
              )

            if (
              tarea.estado !==
                "completada" &&
              nuevoEstado ===
                "completada"
            ) {
              pendientes =
                Math.max(
                  0,
                  pendientes - 1
                )
            }

            if (
              tarea.estado ===
                "completada" &&
              nuevoEstado !==
                "completada"
            ) {
              pendientes += 1
            }

            return {
              ...actual,
              tareas_pendientes:
                pendientes
            }
          }
        )
      } catch (problema) {
        setErrorActividades(
          getMessage(problema)
        )
      } finally {
        setActualizandoTarea(
          null
        )
      }
    }

  /**
   * Eliminar actividad.
   */
  const eliminarActividad =
    async (
      tarea
    ) => {
      const confirmar =
        window.confirm(
          `¿Eliminar la actividad "${tarea.titulo}"?`
        )

      if (!confirmar) {
        return
      }

      setEliminandoTarea(
        tarea.id
      )

      setErrorActividades("")

      try {
        await api.delete(
          `/projects/${id}/tasks/${tarea.id}`
        )

        setActividades(
          (actuales) =>
            actuales.filter(
              (item) =>
                item.id !==
                tarea.id
            )
        )

        setProyecto(
          (actual) => ({
            ...actual,

            total_tareas:
              Math.max(
                0,
                Number(
                  actual.total_tareas ||
                    0
                ) - 1
              ),

            tareas_pendientes:
              tarea.estado !==
              "completada"
                ? Math.max(
                    0,
                    Number(
                      actual.tareas_pendientes ||
                        0
                    ) - 1
                  )
                : Number(
                    actual.tareas_pendientes ||
                      0
                  )
          })
        )
      } catch (problema) {
        setErrorActividades(
          getMessage(problema)
        )
      } finally {
        setEliminandoTarea(
          null
        )
      }
    }

  /**
   * Comprueba si el usuario
   * puede cambiar el estado.
   */
  const puedeCambiarEstado = (
    tarea
  ) => {
    if (puedeGestionar) {
      return true
    }

    return (
      tarea.asignada_a ===
      usuarioActual.id
    )
  }

  if (cargando) {
    return (
      <>
        <div className="topbar">
          <div>
            <h1>
              Proyecto
            </h1>

            <p>
              Cargando información...
            </p>
          </div>
        </div>

        <div className="card">
          <div className="loading">
            Cargando proyecto
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="topbar">
          <div>
            <h1>
              Proyecto
            </h1>

            <p>
              No pudimos cargar
              este proyecto.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="project-error-state">
            <h2>
              No se pudo abrir
              el proyecto
            </h2>

            <p>
              {error}
            </p>

            <div className="project-error-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={() =>
                  navigate(
                    "/proyectos"
                  )
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="btn"
                onClick={
                  cargarProyecto
                }
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!proyecto) {
    return null
  }

  return (
    <>
      <div className="project-detail-header">
        <div className="project-detail-breadcrumb">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/proyectos"
              )
            }
          >
            Proyectos
          </button>

          <span>
            /
          </span>

          <strong>
            {proyecto.nombre}
          </strong>
        </div>

        <div className="project-detail-main">
          <div className="project-detail-title">
            <div className="project-symbol project-symbol-large">
              {String(
                proyecto.nombre ||
                  "P"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <div className="project-detail-title-line">
                <h1>
                  {proyecto.nombre}
                </h1>

                <span
                  className={`project-status ${estadoActual.clase}`}
                >
                  {
                    estadoActual.texto
                  }
                </span>

                <span className="project-visibility">
                  {proyecto.visibilidad ===
                  "interno"
                    ? "Interno"
                    : "Privado"}
                </span>
              </div>

              <p>
                {proyecto.descripcion ||
                  "Este proyecto todavía no tiene una descripción."}
              </p>
            </div>
          </div>

          <div className="project-detail-user">
            <span className="avatar">
              {getInitials()}
            </span>

            <span>
              {getUserName()}
            </span>
          </div>
        </div>

        <div className="project-tabs">
          {TABS.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={
                  tab === item.id
                    ? "project-tab active"
                    : "project-tab"
                }
                onClick={() =>
                  setTab(
                    item.id
                  )
                }
              >
                {item.label}

                {item.id ===
                  "actividades" && (
                  <span className="project-tab-count">
                    {Number(
                      proyecto.total_tareas ||
                        0
                    )}
                  </span>
                )}

                {item.id ===
                  "equipo" && (
                  <span className="project-tab-count">
                    {miembros.length}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* ====================================================
          RESUMEN
          ==================================================== */}

      {tab === "resumen" && (
        <div className="project-detail-content">
          <div className="project-detail-grid">
            <section className="project-main-column">
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>
                      Acerca del proyecto
                    </h2>

                    <p>
                      Información general
                      del proyecto.
                    </p>
                  </div>
                </div>

                <p className="project-about-description">
                  {proyecto.descripcion ||
                    "Todavía no se agregó una descripción."}
                </p>

                <div className="project-about-info">
                  <div>
                    <span>
                      Estado
                    </span>

                    <strong>
                      {
                        estadoActual.texto
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Visibilidad
                    </span>

                    <strong>
                      {proyecto.visibilidad ===
                      "interno"
                        ? "Interno"
                        : "Privado"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tu rol
                    </span>

                    <strong>
                      {ROLES[
                        proyecto.mi_rol
                      ] ||
                        proyecto.mi_rol ||
                        "Miembro"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Creado
                    </span>

                    <strong>
                      {fecha(
                        proyecto.created_at
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>
                      Gestión colaborativa
                    </h2>

                    <p>
                      Estado actual del trabajo.
                    </p>
                  </div>
                </div>

                <div className="project-empty-small">
                  <div className="project-empty-small-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Módulo de actividades activo
                    </strong>

                    <p>
                      Ya puedes crear actividades,
                      asignarlas a miembros y
                      controlar su estado desde
                      la pestaña Actividades.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="project-side-column">
              <div className="card">
                <div className="card-head">
                  <h2>
                    Resumen
                  </h2>
                </div>

                <div className="project-summary-list">
                  <div>
                    <span>
                      Actividades
                    </span>

                    <strong>
                      {Number(
                        proyecto.total_tareas ||
                          0
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pendientes
                    </span>

                    <strong>
                      {Number(
                        proyecto.tareas_pendientes ||
                          0
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Miembros
                    </span>

                    <strong>
                      {miembros.length}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h2>
                    Equipo
                  </h2>
                </div>

                {miembros.length ===
                0 ? (
                  <p className="muted">
                    No hay miembros.
                  </p>
                ) : (
                  <div className="project-team-preview">
                    {miembros
                      .slice(0, 5)
                      .map(
                        (
                          miembro
                        ) => {
                          const nombre =
                            miembro
                              .perfil
                              ?.full_name ||
                            miembro
                              .perfil
                              ?.email ||
                            "Usuario"

                          return (
                            <div
                              key={
                                miembro.id
                              }
                              className="project-team-person"
                            >
                              <span className="avatar avatar-small">
                                {iniciales(
                                  nombre
                                )}
                              </span>

                              <div>
                                <strong>
                                  {nombre}
                                </strong>

                                <span>
                                  {ROLES[
                                    miembro.role
                                  ] ||
                                    miembro.role}
                                </span>
                              </div>
                            </div>
                          )
                        }
                      )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ====================================================
          ACTIVIDADES
          ==================================================== */}

      {tab === "actividades" && (
        <div className="project-detail-content">
          <div className="card">
            <div className="card-head project-section-head">
              <div>
                <h2>
                  Actividades
                </h2>

                <p>
                  Asigna trabajo, controla
                  prioridades y realiza
                  seguimiento del proyecto.
                </p>
              </div>

              {puedeGestionar && (
                <button
                  type="button"
                  className="btn"
                  onClick={
                    abrirNuevaActividad
                  }
                  disabled={
                    cargandoActividades
                  }
                >
                  + Nueva actividad
                </button>
              )}
            </div>

            {errorActividades && (
              <div className="alert alert-error">
                {errorActividades}

                <button
                  type="button"
                  className="project-retry"
                  onClick={
                    cargarActividades
                  }
                >
                  Reintentar
                </button>
              </div>
            )}

            <div className="task-summary">
              <div>
                <span>
                  Total
                </span>

                <strong>
                  {
                    resumenActividades.total
                  }
                </strong>
              </div>

              <div>
                <span>
                  Pendientes
                </span>

                <strong>
                  {
                    resumenActividades.pendientes
                  }
                </strong>
              </div>

              <div>
                <span>
                  En progreso
                </span>

                <strong>
                  {
                    resumenActividades.progreso
                  }
                </strong>
              </div>

              <div>
                <span>
                  Revisión
                </span>

                <strong>
                  {
                    resumenActividades.revision
                  }
                </strong>
              </div>

              <div>
                <span>
                  Completadas
                </span>

                <strong>
                  {
                    resumenActividades.completadas
                  }
                </strong>
              </div>
            </div>

            {cargandoActividades && (
              <div className="loading">
                Cargando actividades
              </div>
            )}

            {!cargandoActividades &&
              actividades.length ===
                0 && (
                <div className="task-empty">
                  <div className="project-feature-icon">
                    ✓
                  </div>

                  <h3>
                    No hay actividades
                  </h3>

                  <p>
                    Este proyecto todavía no
                    tiene actividades asignadas.
                  </p>

                  {puedeGestionar && (
                    <button
                      type="button"
                      className="btn"
                      onClick={
                        abrirNuevaActividad
                      }
                    >
                      Crear primera actividad
                    </button>
                  )}
                </div>
              )}

            {!cargandoActividades &&
              actividades.length >
                0 && (
                <div className="task-list">
                  {actividades.map(
                    (tarea) => {
                      const estado =
                        ESTADOS_TAREA[
                          tarea.estado
                        ] ||
                        ESTADOS_TAREA.pendiente

                      const prioridad =
                        PRIORIDADES[
                          tarea.prioridad
                        ] ||
                        PRIORIDADES.media

                      const nombreAsignado =
                        tarea.asignado
                          ?.full_name ||
                        tarea.asignado
                          ?.email ||
                        "Usuario"

                      return (
                        <article
                          key={
                            tarea.id
                          }
                          className="task-card"
                        >
                          <div className="task-card-head">
                            <div className="task-number">
                              #
                              {
                                tarea.id
                              }
                            </div>

                            <div className="task-title-area">
                              <h3>
                                {
                                  tarea.titulo
                                }
                              </h3>

                              <div className="task-badges">
                                <span
                                  className={`task-status ${estado.clase}`}
                                >
                                  {
                                    estado.texto
                                  }
                                </span>

                                <span
                                  className={`task-priority ${prioridad.clase}`}
                                >
                                  {
                                    prioridad.texto
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="task-description">
                            {
                              tarea.mensaje
                            }
                          </p>

                          <div className="task-meta">
                            <div className="task-assignee">
                              <span className="avatar avatar-small">
                                {iniciales(
                                  nombreAsignado
                                )}
                              </span>

                              <div>
                                <span>
                                  Asignado a
                                </span>

                                <strong>
                                  {
                                    nombreAsignado
                                  }
                                </strong>
                              </div>
                            </div>

                            <div className="task-date">
                              <span>
                                Fecha límite
                              </span>

                              <strong>
                                {fechaCompleta(
                                  tarea.fecha_limite
                                )}
                              </strong>
                            </div>
                          </div>

                          <div className="task-actions">
                            {puedeCambiarEstado(
                              tarea
                            ) ? (
                              <select
                                value={
                                  tarea.estado
                                }
                                disabled={
                                  actualizandoTarea ===
                                  tarea.id
                                }
                                onChange={(
                                  event
                                ) =>
                                  cambiarEstadoActividad(
                                    tarea,
                                    event
                                      .target
                                      .value
                                  )
                                }
                              >
                                <option value="pendiente">
                                  Pendiente
                                </option>

                                <option value="en_progreso">
                                  En progreso
                                </option>

                                <option value="en_revision">
                                  En revisión
                                </option>

                                <option value="completada">
                                  Completada
                                </option>
                              </select>
                            ) : (
                              <span className="muted">
                                Solo lectura
                              </span>
                            )}

                            {puedeGestionar && (
                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                disabled={
                                  eliminandoTarea ===
                                  tarea.id
                                }
                                onClick={() =>
                                  eliminarActividad(
                                    tarea
                                  )
                                }
                              >
                                {eliminandoTarea ===
                                tarea.id
                                  ? "Eliminando..."
                                  : "Eliminar"}
                              </button>
                            )}
                          </div>
                        </article>
                      )
                    }
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* ====================================================
          EQUIPO
          ==================================================== */}

      {tab === "equipo" && (
        <div className="project-detail-content">
          <div className="card">
            <div className="card-head project-section-head">
              <div>
                <h2>
                  Equipo del proyecto
                </h2>

                <p>
                  Personas que actualmente
                  tienen acceso.
                </p>
              </div>

              <button
                type="button"
                className="btn"
                disabled
              >
                + Invitar miembro
              </button>
            </div>

            {miembros.length ===
            0 ? (
              <div className="project-feature-placeholder">
                <h3>
                  No hay miembros
                </h3>
              </div>
            ) : (
              <div className="project-members-table">
                <div className="project-members-header">
                  <span>
                    Usuario
                  </span>

                  <span>
                    Rol
                  </span>

                  <span>
                    Ingreso
                  </span>
                </div>

                {miembros.map(
                  (
                    miembro
                  ) => {
                    const perfil =
                      miembro.perfil ||
                      {}

                    const nombre =
                      perfil.full_name ||
                      perfil.email ||
                      "Usuario"

                    return (
                      <div
                        key={
                          miembro.id
                        }
                        className="project-member-row"
                      >
                        <div className="project-member-user">
                          <span className="avatar avatar-small">
                            {iniciales(
                              nombre
                            )}
                          </span>

                          <div>
                            <strong>
                              {
                                nombre
                              }
                            </strong>

                            <span>
                              {perfil.email ||
                                "Sin correo"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="project-member-role">
                            {ROLES[
                              miembro.role
                            ] ||
                              miembro.role}
                          </span>
                        </div>

                        <div className="muted">
                          {fecha(
                            miembro.joined_at
                          )}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          DOCUMENTOS
          ==================================================== */}

      {tab === "documentos" && (
        <div className="project-detail-content">
          <div className="card">
            <div className="card-head project-section-head">
              <div>
                <h2>
                  Documentos
                </h2>

                <p>
                  Documentación relacionada
                  con el proyecto.
                </p>
              </div>

              <button
                type="button"
                className="btn"
                disabled
              >
                + Subir documento
              </button>
            </div>

            <div className="project-feature-placeholder">
              <div className="project-feature-icon">
                ▤
              </div>

              <h3>
                Gestor documental
              </h3>

              <p>
                Aquí habilitaremos PDF,
                Word, Excel, PowerPoint,
                imágenes, CSV y ZIP.
              </p>

              <div className="project-file-types">
                <span>
                  PDF
                </span>

                <span>
                  DOCX
                </span>

                <span>
                  XLSX
                </span>

                <span>
                  PPTX
                </span>

                <span>
                  CSV
                </span>

                <span>
                  ZIP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          HISTORIAL
          ==================================================== */}

      {tab === "historial" && (
        <div className="project-detail-content">
          <div className="card">
            <div className="card-head">
              <div>
                <h2>
                  Historial
                </h2>

                <p>
                  Registro de cambios
                  realizados dentro
                  del proyecto.
                </p>
              </div>
            </div>

            <div className="project-feature-placeholder">
              <div className="project-feature-icon">
                ↻
              </div>

              <h3>
                Historial de actividad
              </h3>

              <p>
                En una próxima etapa
                registraremos automáticamente
                creación de tareas,
                documentos, miembros y
                modificaciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL NUEVA ACTIVIDAD
          ==================================================== */}

      {modalActividad && (
        <Modal
          title="Nueva actividad"
          onClose={
            cerrarNuevaActividad
          }
          footer={(close) => (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={
                  guardando
                }
                onClick={
                  close
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="form-nueva-actividad"
                className="btn"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Creando..."
                  : "Crear actividad"}
              </button>
            </>
          )}
        >
          <form
            id="form-nueva-actividad"
            onSubmit={
              crearActividad
            }
          >
            {errorFormulario && (
              <div className="alert alert-error">
                {
                  errorFormulario
                }
              </div>
            )}

            <div className="field">
              <label htmlFor="titulo">
                Título
              </label>

              <input
                id="titulo"
                name="titulo"
                type="text"
                maxLength={300}
                placeholder="Ej. Actualizar carta del restaurante"
                value={
                  formulario.titulo
                }
                onChange={
                  cambiarFormulario
                }
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="mensaje">
                Descripción
              </label>

              <textarea
                id="mensaje"
                name="mensaje"
                maxLength={2000}
                placeholder="Explica qué trabajo debe realizarse..."
                value={
                  formulario.mensaje
                }
                onChange={
                  cambiarFormulario
                }
              />
            </div>

            <div className="task-form-grid">
              <div className="field">
                <label htmlFor="prioridad">
                  Prioridad
                </label>

                <select
                  id="prioridad"
                  name="prioridad"
                  value={
                    formulario.prioridad
                  }
                  onChange={
                    cambiarFormulario
                  }
                >
                  <option value="baja">
                    Baja
                  </option>

                  <option value="media">
                    Media
                  </option>

                  <option value="alta">
                    Alta
                  </option>

                  <option value="urgente">
                    Urgente
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="fecha_limite">
                  Fecha límite
                </label>

                <input
                  id="fecha_limite"
                  name="fecha_limite"
                  type="date"
                  value={
                    formulario.fecha_limite
                  }
                  onChange={
                    cambiarFormulario
                  }
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="asignada_a">
                Asignar a
              </label>

              <select
                id="asignada_a"
                name="asignada_a"
                value={
                  formulario.asignada_a
                }
                onChange={
                  cambiarFormulario
                }
              >
                <option value="">
                  Selecciona un miembro
                </option>

                {miembrosAsignables.map(
                  (
                    miembro
                  ) => (
                    <option
                      key={
                        miembro.id
                      }
                      value={
                        miembro.id
                      }
                    >
                      {miembro.nombre}
                      {" — "}
                      {ROLES[
                        miembro.role
                      ] ||
                        miembro.role}
                    </option>
                  )
                )}
              </select>

              {miembrosAsignables.length ===
                0 && (
                <p className="field-help">
                  No existen miembros
                  disponibles para recibir
                  actividades.
                </p>
              )}
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export default ProyectoDetalle