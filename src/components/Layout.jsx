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
  getUserName,
  getInitials,
  getRol,
  getEmpresa,
  esAdmin,
  obtenerMisPermisos
} from "../api"

import Confirm
  from "./Confirm"


/* ==========================================================
   CONFIGURACION
   ========================================================== */

const BIG_DATA_CURSO_ID =
  1


const MODULOS_BIG_DATA = [

  {
    clave:
      "big_data.importar",

    to:
      "/big-data/importar",

    label:
      "Importar datos"
  },

  {
    clave:
      "big_data.datasets",

    to:
      "/big-data/datasets",

    label:
      "Datasets"
  },

  {
    clave:
      "big_data.analisis",

    to:
      "/big-data/analisis",

    label:
      "Análisis"
  },

  {
    clave:
      "big_data.comparar",

    to:
      "/big-data/comparar",

    label:
      "Comparación"
  },

  {
    clave:
      "big_data.estructura",

    to:
      "/big-data/estructura",

    label:
      "Estructura de datos"
  },

  {
    clave:
      "big_data.graficos",

    to:
      "/big-data/graficos",

    label:
      "Gráficos"
  }

]


/* ==========================================================
   NORMALIZAR CURSOS
   ========================================================== */

const obtenerCursosRespuesta =
  (
    respuesta
  ) => {

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
   EXTRAER CURSOS Y MODULOS PERMITIDOS
   ========================================================== */

const normalizarPermisos =
  (
    respuesta
  ) => {

    const cursosRespuesta =
      obtenerCursosRespuesta(
        respuesta
      )


    const cursos =
      new Set()


    const modulos =
      new Set()


    for (
      const curso
      of cursosRespuesta
    ) {

      const cursoId =
        curso?.curso_id ??
        curso?.id


      if (
        cursoId !==
          null &&
        cursoId !==
          undefined
      ) {

        cursos.add(
          String(
            cursoId
          )
        )
      }


      const listaModulos =
        Array.isArray(
          curso?.modulos
        )
          ? curso.modulos
          : Array.isArray(
              curso?.modules
            )
            ? curso.modules
            : []


      for (
        const modulo
        of listaModulos
      ) {

        if (
          modulo?.activo ===
          false
        ) {

          continue
        }


        if (
          modulo?.clave
        ) {

          modulos.add(
            String(
              modulo.clave
            )
          )
        }
      }
    }


    /*
     * Compatibilidad por si el backend
     * devuelve módulos separados.
     */
    const modulosSeparados =
      Array.isArray(
        respuesta?.modulos
      )
        ? respuesta.modulos
        : Array.isArray(
            respuesta?.permisos?.modulos
          )
          ? respuesta.permisos.modulos
          : []


    for (
      const modulo
      of modulosSeparados
    ) {

      if (
        modulo?.activo ===
        false
      ) {

        continue
      }


      if (
        modulo?.clave
      ) {

        modulos.add(
          String(
            modulo.clave
          )
        )
      }


      if (
        modulo?.curso_id
      ) {

        cursos.add(
          String(
            modulo.curso_id
          )
        )
      }
    }


    return {
      cursos,
      modulos
    }
  }


/* ==========================================================
   COMPONENTE DEL MENU
   ========================================================== */

const EnlaceMenu =
  ({
    to,
    children
  }) => (

    <NavLink
      to={
        to
      }
      end={
        false
      }
    >
      {children}
    </NavLink>

  )


/* ==========================================================
   LAYOUT
   ========================================================== */

const Layout =
  ({
    children
  }) => {

    const navigate =
      useNavigate()


    const location =
      useLocation()


    /* ========================================================
       CONFIRMACION LOGOUT
       ======================================================== */

    const [
      asking,
      setAsking
    ] =
      useState(
        false
      )


    /* ========================================================
       PERMISOS
       ======================================================== */

    const [
      permisos,
      setPermisos
    ] =
      useState({
        cursos:
          new Set(),

        modulos:
          new Set()
      })


    const [
      cargandoPermisos,
      setCargandoPermisos
    ] =
      useState(
        true
      )


    const [
      errorPermisos,
      setErrorPermisos
    ] =
      useState(
        false
      )


    const rol =
      getRol()


    const administrador =
      esAdmin()


    /* ========================================================
       CARGAR PERMISOS DEL USUARIO
       ======================================================== */

    useEffect(
      () => {

        /*
         * El administrador no necesita
         * permisos individuales.
         */
        if (
          administrador
        ) {

          setPermisos({
            cursos:
              new Set([
                String(
                  BIG_DATA_CURSO_ID
                )
              ]),

            modulos:
              new Set(
                MODULOS_BIG_DATA.map(
                  (
                    modulo
                  ) =>
                    modulo.clave
                )
              )
          })


          setCargandoPermisos(
            false
          )


          return
        }


        let activo =
          true


        const cargar =
          async () => {

            setCargandoPermisos(
              true
            )


            setErrorPermisos(
              false
            )


            try {

              const respuesta =
                await obtenerMisPermisos()


              if (
                !activo
              ) {

                return
              }


              setPermisos(
                normalizarPermisos(
                  respuesta
                )
              )

            } catch (
              error
            ) {

              if (
                !activo
              ) {

                return
              }


              setPermisos({
                cursos:
                  new Set(),

                modulos:
                  new Set()
              })


              setErrorPermisos(
                true
              )

            } finally {

              if (
                activo
              ) {

                setCargandoPermisos(
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
       ACCESO A BIG DATA
       ======================================================== */

    const tieneBigData =
      administrador ||
      permisos.cursos.has(
        String(
          BIG_DATA_CURSO_ID
        )
      )


    /* ========================================================
       MODULOS VISIBLES
       ======================================================== */

    const modulosVisibles =
      useMemo(
        () => {

          if (
            administrador
          ) {

            /*
             * Actualmente conservamos las
             * rutas administrativas existentes.
             *
             * Los módulos normales siguen
             * mostrándose al trabajador según
             * sus permisos.
             */
            return []
          }


          return MODULOS_BIG_DATA.filter(
            (
              modulo
            ) =>
              permisos.modulos.has(
                modulo.clave
              )
          )

        },
        [
          administrador,
          permisos
        ]
      )


    /* ========================================================
       CERRAR SESION
       ======================================================== */

    const logout =
      () => {

        clearSession()


        navigate(
          "/login"
        )
      }


    /* ========================================================
       RENDER
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
              NAVEGACION
              ================================================== */}

          <nav className="sidebar-nav">

            {/* ================================================
                USUARIO NORMAL
                ================================================ */}

            {!administrador && (

              <>

                {/* =============================================
                    CURSO BIG DATA
                    ============================================= */}

                {tieneBigData && (

                  <div
                    style={{
                      margin:
                        "8px 0 6px",

                      padding:
                        "0 12px",

                      fontSize:
                        "11px",

                      fontWeight:
                        800,

                      letterSpacing:
                        "0.08em",

                      textTransform:
                        "uppercase",

                      opacity:
                        0.65
                    }}
                  >
                    Big Data
                  </div>

                )}


                {/* =============================================
                    MODULOS DEL CURSO
                    ============================================= */}

                {modulosVisibles.map(
                  (
                    modulo
                  ) => (

                    <EnlaceMenu
                      key={
                        modulo.clave
                      }
                      to={
                        modulo.to
                      }
                    >
                      {modulo.label}
                    </EnlaceMenu>

                  )
                )}


                {/* =============================================
                    DOCUMENTACION

                    NO es un séptimo módulo.
                    Solo requiere acceso al curso.
                    ============================================= */}

                {tieneBigData && (

                  <EnlaceMenu
                    to="/big-data/documentos"
                  >
                    Documentación
                  </EnlaceMenu>

                )}


                {/* =============================================
                    CARGANDO
                    ============================================= */}

                {cargandoPermisos && (

                  <div
                    style={{
                      padding:
                        "10px 12px",

                      fontSize:
                        "12px",

                      opacity:
                        0.65
                    }}
                  >
                    Cargando accesos...
                  </div>

                )}


                {/* =============================================
                    ERROR
                    ============================================= */}

                {!cargandoPermisos &&
                  errorPermisos && (

                  <div
                    style={{
                      padding:
                        "10px 12px",

                      fontSize:
                        "12px",

                      lineHeight:
                        1.4,

                      opacity:
                        0.75
                    }}
                  >
                    No se pudieron cargar tus permisos.
                  </div>

                )}


                {/* =============================================
                    SIN ACCESO
                    ============================================= */}

                {!cargandoPermisos &&
                  !errorPermisos &&
                  !tieneBigData && (

                  <div
                    style={{
                      padding:
                        "10px 12px",

                      fontSize:
                        "12px",

                      lineHeight:
                        1.4,

                      opacity:
                        0.7
                    }}
                  >
                    No tienes cursos habilitados.
                  </div>

                )}

              </>

            )}


            {/* ================================================
                ADMINISTRADOR
                ================================================ */}

            {administrador && (

              <>

                {/* =============================================
                    BIG DATA
                    ============================================= */}

                <div
                  style={{
                    margin:
                      "8px 0 6px",

                    padding:
                      "0 12px",

                    fontSize:
                      "11px",

                    fontWeight:
                      800,

                    letterSpacing:
                      "0.08em",

                    textTransform:
                      "uppercase",

                    opacity:
                      0.65
                  }}
                >
                  Big Data
                </div>


                <EnlaceMenu
                  to="/archivos"
                >
                  Datasets
                </EnlaceMenu>


                <EnlaceMenu
                  to="/comparar"
                >
                  Comparación
                </EnlaceMenu>


                <EnlaceMenu
                  to="/big-data/documentos"
                >
                  Documentación
                </EnlaceMenu>


                {/* =============================================
                    ADMINISTRACION
                    ============================================= */}

                <div
                  style={{
                    margin:
                      "18px 0 6px",

                    padding:
                      "0 12px",

                    fontSize:
                      "11px",

                    fontWeight:
                      800,

                    letterSpacing:
                      "0.08em",

                    textTransform:
                      "uppercase",

                    opacity:
                      0.65
                  }}
                >
                  Administración
                </div>


                <EnlaceMenu
                  to="/administracion/usuarios"
                >
                  Usuarios y permisos
                </EnlaceMenu>

              </>

            )}

          </nav>


          {/* ==================================================
              PIE DEL SIDEBAR
              ================================================== */}

          <div className="sidebar-foot">

            <div className="sidebar-user">

              <span className="avatar avatar-light">
                {getInitials()}
              </span>


              <div className="sidebar-ident">

                <span className="sidebar-name">
                  {getUserName()}
                </span>


                <span
                  className={
                    `rol-chip ${
                      administrador
                        ? "rol-admin"
                        : "rol-trabajador"
                    }`
                  }
                >

                  {administrador
                    ? "Administrador"
                    : rol ===
                        "trabajador"
                      ? "Usuario"
                      : rol ||
                        "Usuario"}

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
                  setAsking(
                    true
                  )
              }
            >
              Cerrar sesión
            </button>

          </div>

        </aside>


        {/* ====================================================
            CONTENIDO
            ==================================================== */}

        <main
          className="main"
          key={
            location.pathname
          }
        >
          {children}
        </main>


        {/* ====================================================
            CONFIRMACION LOGOUT
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
                setAsking(
                  false
                )
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