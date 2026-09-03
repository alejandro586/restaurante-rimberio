import {
  useEffect,
  useMemo,
  useState
} from "react"

import { useNavigate } from "react-router-dom"

import api, {
  getInitials,
  getMessage,
  getUserName,
  puedeCrearProyecto
} from "../api"

import Modal from "../components/Modal"

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

const ROLES_PROYECTO = {
  owner: "Propietario",
  manager: "Responsable",
  developer: "Desarrollador",
  member: "Miembro",
  viewer: "Lectura",
  admin: "Administrador"
}

const formularioInicial = {
  nombre: "",
  descripcion: "",
  visibilidad: "privado"
}

const Proyectos = () => {
  const navigate = useNavigate()

  const [proyectos, setProyectos] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState("")

  const [busqueda, setBusqueda] =
    useState("")

  const [estado, setEstado] =
    useState("todos")

  const [modalNuevo, setModalNuevo] =
    useState(false)

  const [formulario, setFormulario] =
    useState(formularioInicial)

  const [guardando, setGuardando] =
    useState(false)

  const [errorFormulario, setErrorFormulario] =
    useState("")

  const cargarProyectos = async () => {
    setCargando(true)
    setError("")

    try {
      const respuesta =
        await api.get("/projects")

      setProyectos(
        Array.isArray(respuesta.data)
          ? respuesta.data
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
    cargarProyectos()
  }, [])

  const proyectosVisibles =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase()

      return proyectos.filter(
        (proyecto) => {
          const coincideEstado =
            estado === "todos" ||
            proyecto.estado === estado

          if (!coincideEstado) {
            return false
          }

          if (!texto) {
            return true
          }

          const nombre =
            String(
              proyecto.nombre || ""
            ).toLowerCase()

          const descripcion =
            String(
              proyecto.descripcion || ""
            ).toLowerCase()

          return (
            nombre.includes(texto) ||
            descripcion.includes(texto)
          )
        }
      )
    }, [
      proyectos,
      busqueda,
      estado
    ])

  const resumen =
    useMemo(() => {
      return {
        total: proyectos.length,

        activos:
          proyectos.filter(
            (proyecto) =>
              proyecto.estado === "activo"
          ).length,

        tareas:
          proyectos.reduce(
            (total, proyecto) =>
              total +
              Number(
                proyecto.total_tareas || 0
              ),
            0
          ),

        pendientes:
          proyectos.reduce(
            (total, proyecto) =>
              total +
              Number(
                proyecto.tareas_pendientes || 0
              ),
            0
          )
      }
    }, [proyectos])

  const abrirNuevoProyecto = () => {
    setFormulario(
      formularioInicial
    )

    setErrorFormulario("")
    setModalNuevo(true)
  }

  const cerrarNuevoProyecto = () => {
    if (guardando) {
      return
    }

    setModalNuevo(false)
    setErrorFormulario("")
  }

  const actualizarFormulario = (
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

  const crearProyecto = async (
    event
  ) => {
    event.preventDefault()

    const nombre =
      formulario.nombre.trim()

    const descripcion =
      formulario.descripcion.trim()

    if (nombre.length < 3) {
      setErrorFormulario(
        "Escribe un nombre de al menos 3 caracteres."
      )

      return
    }

    setGuardando(true)
    setErrorFormulario("")

    try {
      const respuesta =
        await api.post(
          "/projects",
          {
            nombre,
            descripcion:
              descripcion || null,

            estado: "activo",

            visibilidad:
              formulario.visibilidad
          }
        )

      setProyectos(
        (actuales) => [
          respuesta.data,
          ...actuales
        ]
      )

      setModalNuevo(false)

      setFormulario(
        formularioInicial
      )
    } catch (problema) {
      setErrorFormulario(
        getMessage(problema)
      )
    } finally {
      setGuardando(false)
    }
  }

  const abrirProyecto = (
    proyecto
  ) => {
    navigate(
      `/proyectos/${proyecto.id}`
    )
  }

  const fechaProyecto = (
    fecha
  ) => {
    if (!fecha) {
      return "Sin fecha"
    }

    return new Date(
      fecha
    ).toLocaleDateString(
      "es-PE",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    )
  }

  const estadoProyecto = (
    valor
  ) => {
    return (
      ESTADOS[valor] ||
      {
        texto: valor || "Sin estado",
        clase:
          "project-status-archived"
      }
    )
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Proyectos</h1>

          <p>
            Organiza actividades,
            equipo y documentación
            del restaurante.
          </p>
        </div>

        <div className="topbar-actions">
          {puedeCrearProyecto() && (
            <button
              type="button"
              className="btn"
              onClick={
                abrirNuevoProyecto
              }
            >
              + Nuevo proyecto
            </button>
          )}

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

      <div className="metrics metrics-4">
        <div className="metric">
          <span>
            Proyectos
          </span>

          <strong>
            {resumen.total}
          </strong>
        </div>

        <div className="metric">
          <span>
            Activos
          </span>

          <strong>
            {resumen.activos}
          </strong>
        </div>

        <div className="metric">
          <span>
            Actividades
          </span>

          <strong>
            {resumen.tareas}
          </strong>
        </div>

        <div className="metric">
          <span>
            Pendientes
          </span>

          <strong>
            {resumen.pendientes}
          </strong>
        </div>
      </div>

      <div className="project-toolbar card">
        <div className="toolbar-left">
          <input
            type="search"
            placeholder="Buscar proyecto..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
          />

          <select
            value={estado}
            onChange={(event) =>
              setEstado(
                event.target.value
              )
            }
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="activo">
              Activos
            </option>

            <option value="pausado">
              Pausados
            </option>

            <option value="completado">
              Completados
            </option>

            <option value="archivado">
              Archivados
            </option>
          </select>
        </div>

        <span className="muted">
          {proyectosVisibles.length}
          {" "}
          {proyectosVisibles.length === 1
            ? "proyecto"
            : "proyectos"}
        </span>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}

          <button
            type="button"
            className="project-retry"
            onClick={
              cargarProyectos
            }
          >
            Reintentar
          </button>
        </div>
      )}

      {cargando && (
        <div className="card">
          <div className="loading">
            Cargando proyectos
          </div>
        </div>
      )}

      {!cargando &&
        !error &&
        proyectosVisibles.length === 0 && (
          <div className="card">
            <div className="project-empty">
              <div className="project-empty-icon">
                R
              </div>

              <h2>
                {proyectos.length === 0
                  ? "Todavía no hay proyectos"
                  : "No encontramos proyectos"}
              </h2>

              <p>
                {proyectos.length === 0
                  ? "Crea el primer espacio colaborativo para organizar las actividades y documentación del restaurante."
                  : "Prueba cambiando el nombre buscado o el filtro de estado."}
              </p>

              {proyectos.length === 0 &&
                puedeCrearProyecto() && (
                  <button
                    type="button"
                    className="btn"
                    onClick={
                      abrirNuevoProyecto
                    }
                  >
                    Crear primer proyecto
                  </button>
                )}
            </div>
          </div>
        )}

      {!cargando &&
        proyectosVisibles.length > 0 && (
          <div className="project-grid">
            {proyectosVisibles.map(
              (proyecto) => {
                const estadoActual =
                  estadoProyecto(
                    proyecto.estado
                  )

                const rol =
                  ROLES_PROYECTO[
                    proyecto.mi_rol
                  ] ||
                  proyecto.mi_rol ||
                  "Miembro"

                return (
                  <article
                    key={proyecto.id}
                    className="project-card"
                  >
                    <div className="project-card-top">
                      <div className="project-title-wrap">
                        <div className="project-symbol">
                          {String(
                            proyecto.nombre ||
                              "P"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <h2>
                            {proyecto.nombre}
                          </h2>

                          <div className="project-badges">
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
                        </div>
                      </div>

                      <span className="project-role">
                        {rol}
                      </span>
                    </div>

                    <p className="project-description">
                      {proyecto.descripcion ||
                        "Este proyecto todavía no tiene una descripción."}
                    </p>

                    <div className="project-stats">
                      <div>
                        <strong>
                          {Number(
                            proyecto.total_tareas ||
                              0
                          )}
                        </strong>

                        <span>
                          Actividades
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

                      <div>
                        <strong>
                          {Number(
                            proyecto.total_miembros ||
                              0
                          )}
                        </strong>

                        <span>
                          Miembros
                        </span>
                      </div>
                    </div>

                    <div className="project-card-footer">
                      <span>
                        Actualizado{" "}
                        {fechaProyecto(
                          proyecto.updated_at
                        )}
                      </span>

                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={() =>
                          abrirProyecto(
                            proyecto
                          )
                        }
                      >
                        Abrir proyecto
                      </button>
                    </div>
                  </article>
                )
              }
            )}
          </div>
        )}

      {modalNuevo && (
        <Modal
          title="Nuevo proyecto"
          onClose={
            cerrarNuevoProyecto
          }
          footer={(close) => (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={guardando}
                onClick={close}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="form-nuevo-proyecto"
                className="btn"
                disabled={guardando}
              >
                {guardando
                  ? "Creando..."
                  : "Crear proyecto"}
              </button>
            </>
          )}
        >
          <form
            id="form-nuevo-proyecto"
            onSubmit={
              crearProyecto
            }
          >
            {errorFormulario && (
              <div className="alert alert-error">
                {errorFormulario}
              </div>
            )}

            <div className="field">
              <label htmlFor="nombre">
                Nombre del proyecto
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                maxLength={120}
                placeholder="Ej. RIMBERIO ERP"
                value={
                  formulario.nombre
                }
                onChange={
                  actualizarFormulario
                }
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="descripcion">
                Descripción
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                maxLength={2000}
                placeholder="Describe brevemente el objetivo del proyecto..."
                value={
                  formulario.descripcion
                }
                onChange={
                  actualizarFormulario
                }
              />
            </div>

            <div className="field">
              <label htmlFor="visibilidad">
                Visibilidad
              </label>

              <select
                id="visibilidad"
                name="visibilidad"
                value={
                  formulario.visibilidad
                }
                onChange={
                  actualizarFormulario
                }
              >
                <option value="privado">
                  Privado
                </option>

                <option value="interno">
                  Interno
                </option>
              </select>

              <p className="field-help">
                Privado limita el acceso a
                los miembros agregados al
                proyecto. Interno podrá
                utilizarse para proyectos de
                toda la empresa.
              </p>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export default Proyectos