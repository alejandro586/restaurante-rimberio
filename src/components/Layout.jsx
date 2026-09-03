import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  NavLink,
  useNavigate
} from "react-router-dom"

import {
  clearSession,
  esAdmin,
  getEmpresa,
  getInitials,
  getMessage,
  getUserName,
  obtenerMisPermisos
} from "../api"

import Confirm from "./Confirm"


/* ==========================================================
   RUTAS REALES DE LOS MODULOS
   ========================================================== */

/*
 * NO creamos nuevas paginas.
 *
 * Cada modulo apunta a un componente
 * que YA existe en RIMBERIO.
 */
const RUTAS_MODULOS = {
  "big_data.importar": "/big-data/importar",
  "big_data.datasets": "/big-data/datasets",
  "big_data.analisis": "/big-data/analisis",
  "big_data.comparar": "/big-data/comparar",
  "big_data.estructura": "/big-data/estructura",
  "big_data.graficos": "/big-data/graficos"
}


/* ==========================================================
   MENU DEL ADMINISTRADOR
   ========================================================== */

const MENU_ADMIN = [
  {
    to: "/archivos",
    label: "Archivos cargados"
  },
  {
    to: "/comparar",
    label: "Comparar restaurantes"
  },
  {
    to: "/administracion/usuarios",
    label: "Administración de usuarios"
  }
]


/* ==========================================================
   NORMALIZAR RESPUESTA
   ========================================================== */

const obtenerCursos = (respuesta) => {
  if (
    Array.isArray(
      respuesta?.cursos
    )
  ) {
    return respuesta.cursos
  }


  if (
    Array.isArray(
      respuesta?.permisos?.cursos
    )
  ) {
    return respuesta.permisos.cursos
  }


  return []
}


/* ==========================================================
   COMPONENTE
   ========================================================== */

const Layout = ({
  children
}) => {

  const navigate =
    useNavigate()


  const [
    asking,
    setAsking
  ] = useState(false)


  const [
    cursos,
    setCursos
  ] = useState([])


  const [
    cargando,
    setCargando
  ] = useState(
    !esAdmin()
  )


  const [
    error,
    setError
  ] = useState("")


  /* ========================================================
     CARGAR PERMISOS
     ======================================================== */

  useEffect(() => {
    if (esAdmin()) {
      setCargando(false)
      return
    }


    let activo = true


    const cargar = async () => {
      setCargando(true)
      setError("")


      try {
        const respuesta =
          await obtenerMisPermisos()


        if (!activo) {
          return
        }


        setCursos(
          obtenerCursos(
            respuesta
          )
        )

      } catch (error) {
        if (!activo) {
          return
        }


        setCursos([])

        setError(
          getMessage(error)
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
  }, [])


  /* ========================================================
     ORDENAR CURSOS Y MODULOS
     ======================================================== */

  const cursosOrdenados =
    useMemo(() => {

      return [...cursos]
        .sort(
          (a, b) =>
            Number(a.orden || 0) -
            Number(b.orden || 0)
        )
        .map(
          (curso) => ({
            ...curso,

            modulos: [
              ...(curso.modulos || [])
            ].sort(
              (a, b) =>
                Number(a.orden || 0) -
                Number(b.orden || 0)
            )
          })
        )

    }, [
      cursos
    ])


  /* ========================================================
     LOGOUT
     ======================================================== */

  const logout = () => {
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

      {/* ====================================================
          SIDEBAR
          ==================================================== */}

      <aside className="sidebar">

        {/* ==================================================
            LOGO
            ================================================== */}

        <div className="sidebar-brand">
          <img
            src="/icono.png"
            alt="RIMBERIO"
            className="brand-logo"
          />

          <span>
            RIMBERIO
          </span>
        </div>


        {/* ==================================================
            ADMINISTRADOR
            ================================================== */}

        {esAdmin() ? (

          <nav
            className="sidebar-nav"
            aria-label="Navegación principal"
          >
            {MENU_ADMIN.map(
              (enlace) => (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  className={({
                    isActive
                  }) =>
                    isActive
                      ? "active"
                      : ""
                  }
                >
                  {enlace.label}
                </NavLink>
              )
            )}
          </nav>

        ) : (

          /* ==================================================
             USUARIO
             ================================================== */

          <nav
            className="sidebar-nav"
            aria-label="Cursos y módulos"
          >

            {cargando && (
              <div
                style={{
                  padding: "12px",
                  fontSize: 13,
                  opacity: 0.7
                }}
              >
                Cargando permisos...
              </div>
            )}


            {!cargando &&
              error && (
                <div
                  style={{
                    padding: "12px",
                    fontSize: 13
                  }}
                >
                  No se pudieron cargar
                  tus permisos.
                </div>
              )}


            {!cargando &&
              !error &&
              cursosOrdenados.length ===
                0 && (
                <div
                  style={{
                    padding: "12px",
                    fontSize: 13,
                    lineHeight: 1.5
                  }}
                >
                  No tienes cursos
                  asignados.
                </div>
              )}


            {!cargando &&
              !error &&
              cursosOrdenados.map(
                (curso) => (
                  <div
                    key={curso.id}
                    style={{
                      marginBottom: 18
                    }}
                  >

                    {/* ==============================
                        CURSO
                        ============================== */}

                    <div
                      style={{
                        padding:
                          "8px 13px 7px",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing:
                          "0.08em",
                        textTransform:
                          "uppercase",
                        opacity: 0.65
                      }}
                    >
                      {curso.nombre}
                    </div>


                    {/* ==============================
                        SIN MODULOS
                        ============================== */}

                    {(curso.modulos ||
                      []).length ===
                      0 && (
                      <div
                        style={{
                          padding:
                            "5px 14px",
                          fontSize: 12,
                          opacity: 0.55
                        }}
                      >
                        Sin módulos
                        habilitados
                      </div>
                    )}


                    {/* ==============================
                        MODULOS
                        ============================== */}

                    {(curso.modulos ||
                      []).map(
                      (modulo) => {

                        const ruta =
                          RUTAS_MODULOS[
                            modulo.clave
                          ]


                        /*
                         * Si existe un permiso pero
                         * todavía no existe una ruta
                         * conocida, simplemente no
                         * mostramos un enlace roto.
                         */
                        if (!ruta) {
                          return null
                        }


                        return (
                          <NavLink
                            key={
                              modulo.id
                            }
                            to={ruta}
                            className={({
                              isActive
                            }) =>
                              isActive
                                ? "active"
                                : ""
                            }
                          >
                            {modulo.nombre}
                          </NavLink>
                        )
                      }
                    )}

                  </div>
                )
              )}

          </nav>
        )}


        {/* ==================================================
            PIE DEL SIDEBAR
            ================================================== */}

        <div className="sidebar-foot">

          <div className="sidebar-user">

            <span
              className="avatar avatar-light"
            >
              {getInitials()}
            </span>


            <div className="sidebar-ident">

              <span className="sidebar-name">
                {getUserName()}
              </span>


              <span
                className={
                  `rol-chip ${
                    esAdmin()
                      ? "rol-admin"
                      : "rol-trabajador"
                  }`
                }
              >
                {esAdmin()
                  ? "Administrador"
                  : "Usuario"}
              </span>

            </div>
          </div>


          <span className="sidebar-empresa">
            {getEmpresa()}
          </span>


          <button
            type="button"
            className="btn btn-logout"
            onClick={
              () =>
                setAsking(true)
            }
          >
            Cerrar sesión
          </button>

        </div>
      </aside>


      {/* ====================================================
          CONTENIDO
          ==================================================== */}

      <main className="main">
        {children}
      </main>


      {/* ====================================================
          CONFIRMACION
          ==================================================== */}

      {asking && (
        <Confirm
          title="Cerrar sesión"
          message="¿Estás seguro de que deseas cerrar la sesión?"
          detail="Tendrás que ingresar tus credenciales nuevamente."
          confirmLabel="Cerrar sesión"
          danger
          onCancel={
            () =>
              setAsking(false)
          }
          onConfirm={
            logout
          }
        />
      )}

    </div>
  )
}


export default Layout