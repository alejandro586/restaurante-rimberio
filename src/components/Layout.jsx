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
   RUTAS DE MODULOS YA DISPONIBLES
   ========================================================== */

/*
 * Solamente colocamos rutas que YA existen
 * realmente dentro del frontend.
 *
 * Los otros modulos se iran conectando
 * en los siguientes pasos.
 */
const RUTAS_MODULOS = {
  "big_data.importar": "/importar",

  /*
   * DatosEmpresa.jsx actualmente contiene:
   * - tablas
   * - agregar columnas
   * - crear tablas
   * - modificar estructura
   */
  "big_data.estructura": "/datos-empresa"
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
   NORMALIZAR RESPUESTA DE /courses/me
   ========================================================== */

const obtenerCursosRespuesta = (
  respuesta
) => {
  /*
   * Dejamos soporte para ambas formas:
   *
   * { cursos: [...] }
   *
   * o:
   *
   * {
   *   permisos: {
   *     cursos: [...]
   *   }
   * }
   *
   * Así evitamos problemas si el controlador
   * devuelve uno u otro formato.
   */

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
    cargandoCursos,
    setCargandoCursos
  ] = useState(
    !esAdmin()
  )


  const [
    errorCursos,
    setErrorCursos
  ] = useState("")


  /* ========================================================
     CARGAR PERMISOS DEL USUARIO
     ======================================================== */

  useEffect(() => {
    /*
     * El administrador no necesita
     * permisos individuales.
     */
    if (esAdmin()) {
      setCargandoCursos(false)
      return
    }


    let activo = true


    const cargar = async () => {
      setCargandoCursos(true)
      setErrorCursos("")


      try {
        const respuesta =
          await obtenerMisPermisos()


        if (!activo) {
          return
        }


        setCursos(
          obtenerCursosRespuesta(
            respuesta
          )
        )

      } catch (error) {
        if (!activo) {
          return
        }


        setCursos([])

        setErrorCursos(
          getMessage(error)
        )

      } finally {
        if (activo) {
          setCargandoCursos(false)
        }
      }
    }


    cargar()


    return () => {
      activo = false
    }
  }, [])


  /* ========================================================
     ORDENAR CURSOS
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
     CERRAR SESION
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


  /* ========================================================
     INTERFAZ
     ======================================================== */

  return (
    <div className="layout">

      {/* ====================================================
          SIDEBAR
          ==================================================== */}

      <aside className="sidebar">

        {/* ==================================================
            MARCA
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
            MENU ADMINISTRADOR
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
                      : undefined
                  }
                >
                  {enlace.label}
                </NavLink>
              )
            )}
          </nav>
        ) : (

          /* ==================================================
             MENU DINAMICO DEL USUARIO
             ================================================== */

          <nav
            className="sidebar-nav sidebar-courses"
            aria-label="Mis cursos"
          >

            {/* ================================================
                CARGANDO
                ================================================ */}

            {cargandoCursos && (
              <div
                className="sidebar-status"
              >
                Cargando cursos...
              </div>
            )}


            {/* ================================================
                ERROR
                ================================================ */}

            {!cargandoCursos &&
              errorCursos && (
                <div
                  className="sidebar-status sidebar-status-error"
                >
                  No se pudieron cargar
                  tus permisos.
                </div>
              )}


            {/* ================================================
                SIN CURSOS
                ================================================ */}

            {!cargandoCursos &&
              !errorCursos &&
              cursosOrdenados.length ===
                0 && (
                <div
                  className="sidebar-empty"
                >
                  <strong>
                    Sin cursos asignados
                  </strong>

                  <span>
                    Un administrador debe
                    asignarte acceso.
                  </span>
                </div>
              )}


            {/* ================================================
                CURSOS
                ================================================ */}

            {!cargandoCursos &&
              cursosOrdenados.map(
                (curso) => (
                  <div
                    className="sidebar-course"
                    key={curso.id}
                  >

                    {/* ==============================
                        NOMBRE DEL CURSO
                        ============================== */}

                    <div className="sidebar-course-title">
                      <span className="sidebar-course-dot" />

                      <span>
                        {curso.nombre}
                      </span>
                    </div>


                    {/* ==============================
                        SIN MODULOS
                        ============================== */}

                    {(curso.modulos ||
                      []).length ===
                      0 && (
                      <div className="sidebar-course-empty">
                        Sin módulos habilitados
                      </div>
                    )}


                    {/* ==============================
                        MODULOS
                        ============================== */}

                    <div className="sidebar-modules">
                      {(curso.modulos ||
                        []).map(
                        (modulo) => {

                          const ruta =
                            RUTAS_MODULOS[
                              modulo.clave
                            ]


                          /*
                           * Si el modulo ya tiene
                           * una pantalla integrada,
                           * mostramos un NavLink.
                           */
                          if (ruta) {
                            return (
                              <NavLink
                                key={
                                  modulo.id
                                }
                                to={ruta}
                                className={({
                                  isActive
                                }) =>
                                  `sidebar-module-link ${
                                    isActive
                                      ? "active"
                                      : ""
                                  }`
                                }
                              >
                                {
                                  modulo.nombre
                                }
                              </NavLink>
                            )
                          }


                          /*
                           * El permiso existe y
                           * debe mostrarse.
                           *
                           * Todavia no le damos
                           * una URL incorrecta.
                           */
                          return (
                            <div
                              key={
                                modulo.id
                              }
                              className="sidebar-module-link sidebar-module-pending"
                              title="Este módulo se conectará en la siguiente etapa"
                            >
                              <span>
                                {
                                  modulo.nombre
                                }
                              </span>

                              <small>
                                Por integrar
                              </small>
                            </div>
                          )
                        }
                      )}
                    </div>

                  </div>
                )
              )}

          </nav>
        )}


        {/* ==================================================
            INFORMACION DEL USUARIO
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

      {/*
       * Quitamos la key={location.pathname}.
       *
       * No necesitamos forzar que todo el contenido
       * se desmonte y vuelva a montarse artificialmente.
       */}
      <main className="main">
        {children}
      </main>


      {/* ====================================================
          CONFIRMAR LOGOUT
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