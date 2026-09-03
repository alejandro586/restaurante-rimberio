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


/* ==========================================================
   CONFIGURACION
   ========================================================== */

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


const ESTADOS_INVITACION = {
  pendiente: {
    texto: "Pendiente",
    clase: "invitation-status-pending"
  },

  aceptada: {
    texto: "Aceptada",
    clase: "invitation-status-accepted"
  },

  rechazada: {
    texto: "Rechazada",
    clase: "invitation-status-rejected"
  },

  revocada: {
    texto: "Revocada",
    clase: "invitation-status-revoked"
  },

  expirada: {
    texto: "Expirada",
    clase: "invitation-status-expired"
  }
}


const formularioActividadInicial = {
  titulo: "",
  mensaje: "",
  prioridad: "media",
  asignada_a: "",
  fecha_limite: ""
}


const formularioInvitacionInicial = {
  email: "",
  role: "member"
}


/* ==========================================================
   COMPONENTE
   ========================================================== */

const ProyectoDetalle = () => {
  const { id } = useParams()

  const navigate =
    useNavigate()

  const usuarioActual =
    getUser()


  /* ========================================================
     ESTADOS GENERALES
     ======================================================== */

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
    invitaciones,
    setInvitaciones
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
    cargandoInvitaciones,
    setCargandoInvitaciones
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
    errorInvitaciones,
    setErrorInvitaciones
  ] = useState("")


  /* ========================================================
     MODAL ACTIVIDADES
     ======================================================== */

  const [
    modalActividad,
    setModalActividad
  ] = useState(false)

  const [
    formularioActividad,
    setFormularioActividad
  ] = useState(
    formularioActividadInicial
  )

  const [
    guardandoActividad,
    setGuardandoActividad
  ] = useState(false)

  const [
    errorFormularioActividad,
    setErrorFormularioActividad
  ] = useState("")

  const [
    actualizandoTarea,
    setActualizandoTarea
  ] = useState(null)

  const [
    eliminandoTarea,
    setEliminandoTarea
  ] = useState(null)


  /* ========================================================
     MODAL INVITACIONES
     ======================================================== */

  const [
    modalInvitacion,
    setModalInvitacion
  ] = useState(false)

  const [
    formularioInvitacion,
    setFormularioInvitacion
  ] = useState(
    formularioInvitacionInicial
  )

  const [
    enviandoInvitacion,
    setEnviandoInvitacion
  ] = useState(false)

  const [
    errorFormularioInvitacion,
    setErrorFormularioInvitacion
  ] = useState("")

  const [
    mensajeInvitacion,
    setMensajeInvitacion
  ] = useState("")

  const [
    revocandoInvitacion,
    setRevocandoInvitacion
  ] = useState(null)


  /* ========================================================
     CARGAR PROYECTO
     ======================================================== */

  const cargarProyecto =
    async () => {
      setCargando(true)
      setError("")

      try {
        const [
          respuestaProyecto,
          respuestaMiembros
        ] =
          await Promise.all([
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
          getMessage(
            problema
          )
        )
      } finally {
        setCargando(false)
      }
    }


  /* ========================================================
     ACTIVIDADES
     ======================================================== */

  const cargarActividades =
    async () => {
      setCargandoActividades(
        true
      )

      setErrorActividades("")

      try {
        const [
          respuestaActividades,
          respuestaMiembros
        ] =
          await Promise.all([
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
          getMessage(
            problema
          )
        )
      } finally {
        setCargandoActividades(
          false
        )
      }
    }


  /* ========================================================
     INVITACIONES
     ======================================================== */

  const cargarInvitaciones =
    async () => {
      if (
        !puedeGestionar
      ) {
        return
      }

      setCargandoInvitaciones(
        true
      )

      setErrorInvitaciones("")

      try {
        const respuesta =
          await api.get(
            `/projects/${id}/invitations`
          )

        setInvitaciones(
          Array.isArray(
            respuesta.data
          )
            ? respuesta.data
            : []
        )

      } catch (problema) {
        setErrorInvitaciones(
          getMessage(
            problema
          )
        )
      } finally {
        setCargandoInvitaciones(
          false
        )
      }
    }


  /* ========================================================
     EFECTOS
     ======================================================== */

  useEffect(() => {
    cargarProyecto()
  }, [id])


  useEffect(() => {
    if (
      tab ===
      "actividades"
    ) {
      cargarActividades()
    }
  }, [
    tab,
    id
  ])


  /* ========================================================
     PERMISOS
     ======================================================== */

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


  useEffect(() => {
    if (
      tab === "equipo" &&
      puedeGestionar
    ) {
      cargarInvitaciones()
    }
  }, [
    tab,
    id,
    puedeGestionar
  ])


  /* ========================================================
     MEMOS
     ======================================================== */

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


  const invitacionesPendientes =
    useMemo(() => {
      return invitaciones.filter(
        (invitacion) =>
          invitacion.estado ===
          "pendiente"
      ).length
    }, [invitaciones])


  /* ========================================================
     FECHAS
     ======================================================== */

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


  /* ========================================================
     INICIALES
     ======================================================== */

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


  /* ========================================================
     CREAR ACTIVIDAD
     ======================================================== */

  const abrirNuevaActividad =
    () => {
      setFormularioActividad({
        ...formularioActividadInicial,

        asignada_a:
          miembrosAsignables[0]
            ?.id ||
          ""
      })

      setErrorFormularioActividad(
        ""
      )

      setModalActividad(true)
    }


  const cerrarNuevaActividad =
    () => {
      if (
        guardandoActividad
      ) {
        return
      }

      setModalActividad(false)

      setErrorFormularioActividad(
        ""
      )
    }


  const cambiarFormularioActividad =
    (
      event
    ) => {
      const {
        name,
        value
      } = event.target

      setFormularioActividad(
        (anterior) => ({
          ...anterior,
          [name]: value
        })
      )
    }


  const crearActividad =
    async (
      event
    ) => {
      event.preventDefault()

      const titulo =
        formularioActividad
          .titulo
          .trim()

      const mensaje =
        formularioActividad
          .mensaje
          .trim()

      if (
        titulo.length < 3
      ) {
        setErrorFormularioActividad(
          "El título debe tener al menos 3 caracteres."
        )

        return
      }

      if (
        mensaje.length < 3
      ) {
        setErrorFormularioActividad(
          "Escribe una descripción para la actividad."
        )

        return
      }

      if (
        !formularioActividad
          .asignada_a
      ) {
        setErrorFormularioActividad(
          "Selecciona un miembro del proyecto."
        )

        return
      }

      setGuardandoActividad(
        true
      )

      setErrorFormularioActividad(
        ""
      )

      try {
        const fechaLimite =
          formularioActividad
            .fecha_limite
            ? `${formularioActividad.fecha_limite}T23:59:59`
            : null

        const respuesta =
          await api.post(
            `/projects/${id}/tasks`,
            {
              titulo,

              mensaje,

              prioridad:
                formularioActividad
                  .prioridad,

              estado:
                "pendiente",

              asignada_a:
                formularioActividad
                  .asignada_a,

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

        setFormularioActividad(
          formularioActividadInicial
        )

        setModalActividad(false)

      } catch (problema) {
        setErrorFormularioActividad(
          getMessage(
            problema
          )
        )
      } finally {
        setGuardandoActividad(
          false
        )
      }
    }


  /* ========================================================
     CAMBIAR ESTADO ACTIVIDAD
     ======================================================== */

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

        setProyecto(
          (actual) => {
            let pendientes =
              Number(
                actual
                  .tareas_pendientes ||
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
          getMessage(
            problema
          )
        )
      } finally {
        setActualizandoTarea(
          null
        )
      }
    }


  /* ========================================================
     ELIMINAR ACTIVIDAD
     ======================================================== */

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
                      actual
                        .tareas_pendientes ||
                        0
                    ) - 1
                  )
                : Number(
                    actual
                      .tareas_pendientes ||
                      0
                  )
          })
        )

      } catch (problema) {
        setErrorActividades(
          getMessage(
            problema
          )
        )
      } finally {
        setEliminandoTarea(
          null
        )
      }
    }


  const puedeCambiarEstado =
    (
      tarea
    ) => {
      if (
        puedeGestionar
      ) {
        return true
      }

      return (
        tarea.asignada_a ===
        usuarioActual?.id
      )
    }


  /* ========================================================
     INVITACIONES
     ======================================================== */

  const abrirInvitacion =
    () => {
      setFormularioInvitacion(
        formularioInvitacionInicial
      )

      setErrorFormularioInvitacion(
        ""
      )

      setMensajeInvitacion(
        ""
      )

      setModalInvitacion(
        true
      )
    }


  const cerrarInvitacion =
    () => {
      if (
        enviandoInvitacion
      ) {
        return
      }

      setModalInvitacion(
        false
      )

      setErrorFormularioInvitacion(
        ""
      )
    }


  const cambiarFormularioInvitacion =
    (
      event
    ) => {
      const {
        name,
        value
      } = event.target

      setFormularioInvitacion(
        (anterior) => ({
          ...anterior,
          [name]: value
        })
      )
    }


  const enviarInvitacion =
    async (
      event
    ) => {
      event.preventDefault()

      const email =
        formularioInvitacion
          .email
          .trim()
          .toLowerCase()

      if (!email) {
        setErrorFormularioInvitacion(
          "Ingresa el correo de la persona que deseas invitar."
        )

        return
      }

      setEnviandoInvitacion(
        true
      )

      setErrorFormularioInvitacion(
        ""
      )

      setMensajeInvitacion(
        ""
      )

      try {
        const respuesta =
          await api.post(
            `/projects/${id}/invitations`,
            {
              email,

              role:
                formularioInvitacion
                  .role
            }
          )

        if (
          respuesta.data
            ?.invitacion
        ) {
          setInvitaciones(
            (actuales) => [
              respuesta.data
                .invitacion,
              ...actuales
            ]
          )
        }

        setModalInvitacion(
          false
        )

        setFormularioInvitacion(
          formularioInvitacionInicial
        )

        setMensajeInvitacion(
          `La invitación fue enviada correctamente a ${email}.`
        )

      } catch (problema) {
        setErrorFormularioInvitacion(
          getMessage(
            problema
          )
        )
      } finally {
        setEnviandoInvitacion(
          false
        )
      }
    }


  const revocarInvitacion =
    async (
      invitacion
    ) => {
      const confirmar =
        window.confirm(
          `¿Revocar la invitación enviada a ${invitacion.email}?`
        )

      if (!confirmar) {
        return
      }

      setRevocandoInvitacion(
        invitacion.id
      )

      setErrorInvitaciones("")

      try {
        await api.delete(
          `/projects/${id}/invitations/${invitacion.id}`
        )

        setInvitaciones(
          (actuales) =>
            actuales.map(
              (item) =>
                item.id ===
                invitacion.id
                  ? {
                      ...item,
                      estado:
                        "revocada"
                    }
                  : item
            )
        )

      } catch (problema) {
        setErrorInvitaciones(
          getMessage(
            problema
          )
        )
      } finally {
        setRevocandoInvitacion(
          null
        )
      }
    }


  /* ========================================================
     CARGANDO / ERROR
     ======================================================== */

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
              No pudimos cargar este proyecto.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="project-error-state">
            <h2>
              No se pudo abrir el proyecto
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


  /* ========================================================
     RENDER
     ======================================================== */

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
                  {estadoActual.texto}
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
                      Información general del proyecto.
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
                      {estadoActual.texto}
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
                      Módulo colaborativo activo
                    </strong>

                    <p>
                      Ya puedes crear actividades,
                      asignarlas y administrar
                      miembros mediante invitaciones.
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
                  prioridades y realiza seguimiento.
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
              </div>
            )}


            <div className="task-summary">

              <div>
                <span>Total</span>
                <strong>
                  {resumenActividades.total}
                </strong>
              </div>

              <div>
                <span>Pendientes</span>
                <strong>
                  {resumenActividades.pendientes}
                </strong>
              </div>

              <div>
                <span>En progreso</span>
                <strong>
                  {resumenActividades.progreso}
                </strong>
              </div>

              <div>
                <span>Revisión</span>
                <strong>
                  {resumenActividades.revision}
                </strong>
              </div>

              <div>
                <span>Completadas</span>
                <strong>
                  {resumenActividades.completadas}
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
                        ESTADOS_TAREA
                          .pendiente

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
                              #{tarea.id}
                            </div>

                            <div className="task-title-area">

                              <h3>
                                {tarea.titulo}
                              </h3>

                              <div className="task-badges">

                                <span
                                  className={`task-status ${estado.clase}`}
                                >
                                  {estado.texto}
                                </span>

                                <span
                                  className={`task-priority ${prioridad.clase}`}
                                >
                                  {prioridad.texto}
                                </span>

                              </div>

                            </div>

                          </div>


                          <p className="task-description">
                            {tarea.mensaje}
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
                                  {nombreAsignado}
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
                  Administra las personas que
                  colaboran en este proyecto.
                </p>
              </div>


              {puedeGestionar && (
                <button
                  type="button"
                  className="btn"
                  onClick={
                    abrirInvitacion
                  }
                >
                  + Invitar miembro
                </button>
              )}

            </div>


            {mensajeInvitacion && (
              <div className="alert alert-success">
                {mensajeInvitacion}
              </div>
            )}


            <div className="project-team-stats">

              <div>
                <span>
                  Miembros
                </span>

                <strong>
                  {miembros.length}
                </strong>
              </div>

              {puedeGestionar && (
                <div>
                  <span>
                    Invitaciones pendientes
                  </span>

                  <strong>
                    {invitacionesPendientes}
                  </strong>
                </div>
              )}

            </div>


            {miembros.length ===
            0 ? (
              <div className="project-feature-placeholder">

                <h3>
                  No hay miembros
                </h3>

                <p>
                  Invita personas para comenzar
                  a colaborar.
                </p>

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
                              {nombre}
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


          {/* ================================================
              INVITACIONES
              ================================================ */}

          {puedeGestionar && (
            <div className="card">

              <div className="card-head">

                <div>
                  <h2>
                    Invitaciones
                  </h2>

                  <p>
                    Historial de invitaciones
                    enviadas al proyecto.
                  </p>
                </div>

              </div>


              {errorInvitaciones && (
                <div className="alert alert-error">
                  {errorInvitaciones}
                </div>
              )}


              {cargandoInvitaciones ? (
                <div className="loading">
                  Cargando invitaciones
                </div>
              ) : invitaciones.length ===
                0 ? (
                <div className="project-feature-placeholder">

                  <h3>
                    No hay invitaciones
                  </h3>

                  <p>
                    Todavía no se ha invitado
                    a ningún colaborador.
                  </p>

                </div>
              ) : (
                <div className="invitation-list">

                  {invitaciones.map(
                    (
                      invitacion
                    ) => {
                      const estado =
                        ESTADOS_INVITACION[
                          invitacion.estado
                        ] || {
                          texto:
                            invitacion.estado,

                          clase:
                            "invitation-status-expired"
                        }

                      return (
                        <div
                          key={
                            invitacion.id
                          }
                          className="invitation-card"
                        >

                          <div className="invitation-main">

                            <div className="invitation-icon">
                              @
                            </div>

                            <div className="invitation-info">

                              <strong>
                                {invitacion.email}
                              </strong>

                              <div className="invitation-meta">

                                <span>
                                  {ROLES[
                                    invitacion.role
                                  ] ||
                                    invitacion.role}
                                </span>

                                <span>
                                  Enviada{" "}
                                  {fecha(
                                    invitacion.created_at
                                  )}
                                </span>

                                <span>
                                  Vence{" "}
                                  {fecha(
                                    invitacion.expires_at
                                  )}
                                </span>

                              </div>

                            </div>

                          </div>


                          <div className="invitation-actions">

                            <span
                              className={`invitation-status ${estado.clase}`}
                            >
                              {estado.texto}
                            </span>


                            {invitacion.estado ===
                              "pendiente" && (
                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                disabled={
                                  revocandoInvitacion ===
                                  invitacion.id
                                }
                                onClick={() =>
                                  revocarInvitacion(
                                    invitacion
                                  )
                                }
                              >
                                {revocandoInvitacion ===
                                invitacion.id
                                  ? "Revocando..."
                                  : "Revocar"}
                              </button>
                            )}

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
                <span>PDF</span>
                <span>DOCX</span>
                <span>XLSX</span>
                <span>PPTX</span>
                <span>CSV</span>
                <span>ZIP</span>
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
                  Registro de cambios realizados
                  dentro del proyecto.
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
                Después registraremos
                automáticamente actividades,
                documentos y cambios del equipo.
              </p>

            </div>

          </div>

        </div>
      )}


      {/* ====================================================
          MODAL ACTIVIDAD
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
                  guardandoActividad
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
                  guardandoActividad
                }
              >
                {guardandoActividad
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

            {errorFormularioActividad && (
              <div className="alert alert-error">
                {errorFormularioActividad}
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
                  formularioActividad
                    .titulo
                }
                onChange={
                  cambiarFormularioActividad
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
                  formularioActividad
                    .mensaje
                }
                onChange={
                  cambiarFormularioActividad
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
                    formularioActividad
                      .prioridad
                  }
                  onChange={
                    cambiarFormularioActividad
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
                    formularioActividad
                      .fecha_limite
                  }
                  onChange={
                    cambiarFormularioActividad
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
                  formularioActividad
                    .asignada_a
                }
                onChange={
                  cambiarFormularioActividad
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

            </div>

          </form>

        </Modal>
      )}


      {/* ====================================================
          MODAL INVITACION
          ==================================================== */}

      {modalInvitacion && (
        <Modal
          title="Invitar miembro"
          onClose={
            cerrarInvitacion
          }
          footer={(close) => (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={
                  enviandoInvitacion
                }
                onClick={
                  close
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="form-invitar-miembro"
                className="btn"
                disabled={
                  enviandoInvitacion
                }
              >
                {enviandoInvitacion
                  ? "Enviando..."
                  : "Enviar invitación"}
              </button>
            </>
          )}
        >

          <form
            id="form-invitar-miembro"
            onSubmit={
              enviarInvitacion
            }
          >

            {errorFormularioInvitacion && (
              <div className="alert alert-error">
                {errorFormularioInvitacion}
              </div>
            )}


            <div className="invitation-form-intro">

              <div className="invitation-form-icon">
                @
              </div>

              <div>
                <strong>
                  Invitar por correo
                </strong>

                <p>
                  La persona recibirá un correo
                  con un enlace seguro para
                  unirse al proyecto.
                </p>
              </div>

            </div>


            <div className="field">

              <label htmlFor="invitation-email">
                Correo electrónico
              </label>

              <input
                id="invitation-email"
                name="email"
                type="email"
                placeholder="persona@empresa.com"
                autoComplete="email"
                value={
                  formularioInvitacion
                    .email
                }
                onChange={
                  cambiarFormularioInvitacion
                }
                autoFocus
              />

            </div>


            <div className="field">

              <label htmlFor="invitation-role">
                Rol dentro del proyecto
              </label>

              <select
                id="invitation-role"
                name="role"
                value={
                  formularioInvitacion
                    .role
                }
                onChange={
                  cambiarFormularioInvitacion
                }
              >

                <option value="manager">
                  Responsable
                </option>

                <option value="developer">
                  Desarrollador
                </option>

                <option value="member">
                  Miembro
                </option>

                <option value="viewer">
                  Solo lectura
                </option>

              </select>

            </div>


            <div className="invitation-role-help">

              {formularioInvitacion.role ===
                "manager" && (
                <p>
                  <strong>
                    Responsable:
                  </strong>{" "}
                  puede administrar actividades
                  e invitaciones del proyecto.
                </p>
              )}

              {formularioInvitacion.role ===
                "developer" && (
                <p>
                  <strong>
                    Desarrollador:
                  </strong>{" "}
                  puede colaborar y trabajar
                  sobre las actividades asignadas.
                </p>
              )}

              {formularioInvitacion.role ===
                "member" && (
                <p>
                  <strong>
                    Miembro:
                  </strong>{" "}
                  puede colaborar en el proyecto
                  y recibir actividades.
                </p>
              )}

              {formularioInvitacion.role ===
                "viewer" && (
                <p>
                  <strong>
                    Solo lectura:
                  </strong>{" "}
                  puede consultar el proyecto,
                  pero no recibir actividades.
                </p>
              )}

            </div>


            <div className="invitation-security-note">

              <strong>
                Invitación segura
              </strong>

              <p>
                El enlace tendrá una duración
                de 7 días y solo podrá aceptarse
                con el mismo correo electrónico.
              </p>

            </div>

          </form>

        </Modal>
      )}

    </>
  )
}


export default ProyectoDetalle