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
  getUserName
} from "../api"

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

const ESTADOS = {
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

const ROLES = {
  owner: "Propietario",
  manager: "Responsable",
  developer: "Desarrollador",
  member: "Miembro",
  viewer: "Solo lectura",
  admin: "Administrador"
}

const ProyectoDetalle = () => {
  const { id } = useParams()

  const navigate = useNavigate()

  const [proyecto, setProyecto] =
    useState(null)

  const [miembros, setMiembros] =
    useState([])

  const [tab, setTab] =
    useState("resumen")

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState("")

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

  useEffect(() => {
    cargarProyecto()
  }, [id])

  const estadoActual =
    useMemo(() => {
      if (!proyecto) {
        return null
      }

      return (
        ESTADOS[
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

    const partes = nombre
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

  if (cargando) {
    return (
      <>
        <div className="topbar">
          <div>
            <h1>Proyecto</h1>

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
            <h1>Proyecto</h1>

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

          <span>/</span>

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

      {tab === "resumen" && (
        <div className="project-detail-content">
          <div className="project-detail-grid">
            <section className="project-main-column">
              <div className="card project-about">
                <div className="card-head">
                  <div>
                    <h2>
                      Acerca del proyecto
                    </h2>

                    <p>
                      Información general
                      y estado actual.
                    </p>
                  </div>
                </div>

                <p className="project-about-description">
                  {proyecto.descripcion ||
                    "Todavía no se agregó una descripción para este proyecto."}
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
                      Actividad reciente
                    </h2>

                    <p>
                      Los cambios y acciones
                      del proyecto aparecerán
                      aquí.
                    </p>
                  </div>
                </div>

                <div className="project-empty-small">
                  <div className="project-empty-small-icon">
                    ↻
                  </div>

                  <div>
                    <strong>
                      Historial en preparación
                    </strong>

                    <p>
                      En la siguiente etapa
                      conectaremos el historial
                      automático de cambios.
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
                    No hay miembros
                    registrados.
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
                                  {
                                    nombre
                                  }
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

                    {miembros.length >
                      5 && (
                      <button
                        type="button"
                        className="project-see-all"
                        onClick={() =>
                          setTab(
                            "equipo"
                          )
                        }
                      >
                        Ver todos
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {tab ===
        "actividades" && (
        <div className="project-detail-content">
          <div className="card">
            <div className="card-head project-section-head">
              <div>
                <h2>
                  Actividades
                </h2>

                <p>
                  Tareas, incidencias y
                  actividades asignadas
                  dentro del proyecto.
                </p>
              </div>

              <button
                type="button"
                className="btn"
                disabled
                title="Se habilitará en el siguiente módulo"
              >
                + Nueva actividad
              </button>
            </div>

            <div className="project-feature-placeholder">
              <div className="project-feature-icon">
                ✓
              </div>

              <h3>
                Módulo de actividades
              </h3>

              <p>
                Aquí conectaremos las tareas
                existentes del sistema con
                este proyecto y añadiremos
                prioridad, responsable,
                fecha límite y comentarios.
              </p>

              <div className="project-placeholder-stats">
                <div>
                  <strong>
                    {Number(
                      proyecto.total_tareas ||
                        0
                    )}
                  </strong>

                  <span>
                    Total
                  </span>
                </div>

                <div>
                  <strong>
                    {Number(
                      proyecto.tareas_pendientes ||
                        0
                    )}
                  </strong>

                  <span>
                    Pendientes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                title="Se habilitará con las invitaciones por correo"
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

                <p>
                  Todavía no se han agregado
                  usuarios a este proyecto.
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
        </div>
      )}

      {tab ===
        "documentos" && (
        <div className="project-detail-content">
          <div className="card">
            <div className="card-head project-section-head">
              <div>
                <h2>
                  Documentos
                </h2>

                <p>
                  Archivos y documentación
                  relacionados con este
                  proyecto.
                </p>
              </div>

              <button
                type="button"
                className="btn"
                disabled
                title="Se habilitará en el módulo de documentos"
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
                En este apartado habilitaremos
                la subida y almacenamiento de
                PDF, Word, Excel, PowerPoint,
                imágenes, CSV y archivos ZIP.
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

      {tab ===
        "historial" && (
        <div className="project-detail-content">
          <div className="card">
            <div className="card-head">
              <div>
                <h2>
                  Historial
                </h2>

                <p>
                  Registro de acciones
                  realizadas dentro del
                  proyecto.
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
                Aquí aparecerán acciones como
                creación de tareas, cambios
                de estado, documentos
                subidos, nuevos miembros y
                modificaciones realizadas.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProyectoDetalle