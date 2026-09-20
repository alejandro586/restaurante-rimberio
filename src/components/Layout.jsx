import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  NavLink,
  useLocation,
  useNavigate
} from "react-router-dom"

import {
  clearSession,
  esAdmin,
  getEmpresa,
  getInitials,
  getRol,
  getUserName,
  obtenerMisPermisos
} from "../api"

import {
  obtenerIconoModulo,
  obtenerNombreModulo,
  obtenerRutaModulo,
  resolverCursoSlugPorRuta
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


const EnlaceMenu = ({
  to,
  icono,
  children,
  end = false
}) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      isActive ? "active" : ""
    }
  >
    <span
      aria-hidden="true"
      style={{
        width: "22px",
        minWidth: "22px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "8px",
        fontSize: "15px",
        lineHeight: 1
      }}
    >
      {icono}
    </span>

    <span style={{ minWidth: 0 }}>
      {children}
    </span>
  </NavLink>
)


const Layout = ({
  children
}) => {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const administrador =
    esAdmin()

  const rol =
    getRol()

  const [
    cursos,
    setCursos
  ] = useState([])

  const [
    cargandoPermisos,
    setCargandoPermisos
  ] = useState(true)

  const [
    errorPermisos,
    setErrorPermisos
  ] = useState(false)


  useEffect(
    () => {
      let activo = true

      const cargar = async () => {
        setCargandoPermisos(true)
        setErrorPermisos(false)

        try {
          const respuesta =
            await obtenerMisPermisos()

          if (!activo) {
            return
          }

          setCursos(
            obtenerListaCursos(respuesta)
              .filter(
                (curso) =>
                  curso?.activo !== false
              )
          )

        } catch (error) {
          if (!activo) {
            return
          }

          console.error(
            "Error cargando permisos del menú:",
            error
          )

          setCursos([])
          setErrorPermisos(true)

        } finally {
          if (activo) {
            setCargandoPermisos(false)
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


  const cursoSlugActual =
    useMemo(
      () =>
        resolverCursoSlugPorRuta(
          location.pathname
        ),
      [location.pathname]
    )


  const cursoActual =
    useMemo(
      () => {
        if (!cursoSlugActual) {
          return null
        }

        return (
          cursos.find(
            (curso) =>
              String(curso?.slug || "") ===
              String(cursoSlugActual)
          ) || null
        )
      },
      [cursos, cursoSlugActual]
    )


  const modulosVisibles =
    useMemo(
      () =>
        obtenerModulos(cursoActual)
          .map(
            (modulo) => ({
              ...modulo,
              ruta:
                obtenerRutaModulo(
                  modulo?.clave
                ),
              nombreVisual:
                obtenerNombreModulo(
                  modulo
                ),
              iconoVisual:
                obtenerIconoModulo(
                  modulo
                )
            })
          )
          .filter(
            (modulo) =>
              Boolean(modulo.ruta)
          ),
      [cursoActual]
    )


  const nombreRol =
    administrador
      ? "Administrador"
      : "Usuario"

  const claseRol =
    administrador
      ? "rol-chip rol-admin"
      : "rol-chip rol-trabajador"


  const cerrarSesion = () => {
    const confirmado =
      window.confirm(
        "¿Deseas cerrar tu sesión en RIMBERIO?"
      )

    if (!confirmado) {
      return
    }

    clearSession()

    navigate(
      "/login",
      {
        replace: true
      }
    )
  }


  return (
    <div className="layout">
      <aside className="sidebar">
        <div
          className="sidebar-brand"
          role="button"
          tabIndex={0}
          onClick={() =>
            navigate("/mis-cursos")
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              navigate("/mis-cursos")
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <div
            className="brand-logo"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#c1541f",
              fontWeight: 800,
              fontSize: "17px"
            }}
          >
            R
          </div>

          <span>
            RIMBERIO
          </span>
        </div>


        <nav className="sidebar-nav">
          <div>
            <div>
              Inicio
            </div>

            <EnlaceMenu
              to="/mis-cursos"
              icono="⌂"
              end
            >
              Mis cursos
            </EnlaceMenu>
          </div>


          {cursoSlugActual && (
            <div>
              <div>
                {cursoActual?.nombre ||
                  "Curso"}
              </div>

              <EnlaceMenu
                to="/mis-cursos"
                icono="←"
              >
                Salir del curso
              </EnlaceMenu>


              {cargandoPermisos && (
                <div
                  style={{
                    padding: "9px 12px",
                    color:
                      "rgba(247,241,230,.58)",
                    fontSize: "11px"
                  }}
                >
                  Cargando actividades...
                </div>
              )}


              {!cargandoPermisos &&
                errorPermisos && (
                <div
                  style={{
                    padding: "9px 12px",
                    color:
                      "rgba(247,241,230,.58)",
                    fontSize: "11px",
                    lineHeight: 1.4
                  }}
                >
                  No se pudieron cargar las actividades.
                </div>
              )}


              {!cargandoPermisos &&
                !errorPermisos &&
                cursoActual &&
                modulosVisibles.length === 0 && (
                <div
                  style={{
                    padding: "9px 12px",
                    color:
                      "rgba(247,241,230,.58)",
                    fontSize: "11px",
                    lineHeight: 1.4
                  }}
                >
                  No hay actividades disponibles en este curso.
                </div>
              )}


              {!cargandoPermisos &&
                !errorPermisos &&
                modulosVisibles.map(
                  (modulo) => (
                    <EnlaceMenu
                      key={
                        modulo.id ||
                        modulo.clave
                      }
                      to={modulo.ruta}
                      icono={
                        modulo.iconoVisual
                      }
                    >
                      {modulo.nombreVisual}
                    </EnlaceMenu>
                  )
                )}
            </div>
          )}


          {administrador && (
            <div>
              <div>
                Administración
              </div>

              <EnlaceMenu
                to="/administracion/usuarios"
                icono="⚙"
              >
                Usuarios y permisos
              </EnlaceMenu>

              <EnlaceMenu
                to="/administracion/cursos"
                icono="▤"
              >
                Cursos y módulos
              </EnlaceMenu>
            </div>
          )}
        </nav>


        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar avatar-light">
              {getInitials()}
            </span>

            <div className="sidebar-ident">
              <span className="sidebar-name">
                {getUserName()}
              </span>

              <span className={claseRol}>
                {nombreRol}
              </span>
            </div>
          </div>

          <span className="sidebar-empresa">
            {getEmpresa()}
          </span>

          <button
            type="button"
            className="btn btn-logout"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>


      <main className="main">
        {children}
      </main>
    </div>
  )
}


export default Layout
