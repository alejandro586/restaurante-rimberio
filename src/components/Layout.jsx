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

import Confirm
  from "./Confirm"


/* ==========================================================
   MODULOS PRINCIPALES DE BIG DATA
   ========================================================== */

/*
 * IMPORTANTE:
 *
 * Graficos NO aparece en este menu.
 *
 * big_data.graficos sigue existiendo
 * como permiso, pero ahora controla
 * la pestaña "Graficos" dentro de
 * Datasets.
 *
 * Documentacion tampoco es un modulo
 * independiente. Esta integrada dentro
 * de "Cargar archivos".
 */
const MODULOS_BIG_DATA = [

  {
    clave:
      "big_data.importar",

    to:
      "/big-data/importar",

    label:
      "Cargar archivos"
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
  }

]


/* ==========================================================
   NORMALIZAR PERMISOS
   ========================================================== */

const obtenerClavesPermisos =
  (
    respuesta
  ) => {

    const claves =
      new Set()


    const cursos =
      Array.isArray(
        respuesta?.cursos
      )
        ? respuesta.cursos
        : Array.isArray(
            respuesta?.permisos?.cursos
          )
          ? respuesta.permisos.cursos
          : []


    for (
      const curso
      of cursos
    ) {

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


      for (
        const modulo
        of modulos
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

          claves.add(
            String(
              modulo.clave
            )
          )
        }
      }
    }


    /*
     * Compatibilidad si el backend
     * devuelve los modulos separados.
     */
    const separados =
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
      of separados
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

        claves.add(
          String(
            modulo.clave
          )
        )
      }
    }


    return claves
  }


/* ==========================================================
   ENLACE DEL SIDEBAR
   ========================================================== */

const Enlace =
  ({
    to,
    children
  }) => (

    <NavLink
      to={
        to
      }
      className={
        ({
          isActive
        }) =>
          isActive
            ? "active"
            : ""
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
       USUARIO
       ======================================================== */

    const administrador =
      esAdmin()


    const rol =
      getRol()


    /* ========================================================
       LOGOUT
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
      useState(
        new Set()
      )


    const [
      cargandoPermisos,
      setCargandoPermisos
    ] =
      useState(
        !administrador
      )


    const [
      errorPermisos,
      setErrorPermisos
    ] =
      useState(
        false
      )


    /* ========================================================
       CARGAR PERMISOS
       ======================================================== */

    useEffect(
      () => {

        /*
         * ADMIN:
         *
         * tiene acceso visual a todos
         * los modulos principales.
         */
        if (
          administrador
        ) {

          setPermisos(
            new Set(
              MODULOS_BIG_DATA.map(
                (
                  modulo
                ) =>
                  modulo.clave
              )
            )
          )


          setCargandoPermisos(
            false
          )


          setErrorPermisos(
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
                obtenerClavesPermisos(
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


              setPermisos(
                new Set()
              )


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
       MODULOS VISIBLES
       ======================================================== */

    const modulosVisibles =
      useMemo(
        () => {

          if (
            administrador
          ) {

            return MODULOS_BIG_DATA
          }


          return MODULOS_BIG_DATA.filter(
            (
              modulo
            ) =>
              permisos.has(
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
       LOGOUT
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
              MENU
              ================================================== */}

          <nav className="sidebar-nav">

            {/* =================================================
                BIG DATA
                ================================================= */}

            <div
              style={{
                padding:
                  "8px 12px 5px",

                marginTop:
                  "4px",

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


            {/* =================================================
                CARGANDO
                ================================================= */}

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
                Cargando módulos...
              </div>

            )}


            {/* =================================================
                MODULOS
                ================================================= */}

            {!cargandoPermisos &&
              modulosVisibles.map(
                (
                  modulo
                ) => (

                  <Enlace
                    key={
                      modulo.clave
                    }
                    to={
                      modulo.to
                    }
                  >
                    {modulo.label}
                  </Enlace>

                )
              )}


            {/* =================================================
                SIN MODULOS
                ================================================= */}

            {!administrador &&
              !cargandoPermisos &&
              !errorPermisos &&
              modulosVisibles.length ===
                0 && (

              <div
                style={{
                  padding:
                    "10px 12px",

                  fontSize:
                    "12px",

                  lineHeight:
                    1.5,

                  opacity:
                    0.7
                }}
              >
                No tienes módulos habilitados.
              </div>

            )}


            {/* =================================================
                ERROR PERMISOS
                ================================================= */}

            {!administrador &&
              !cargandoPermisos &&
              errorPermisos && (

              <div
                style={{
                  padding:
                    "10px 12px",

                  fontSize:
                    "12px",

                  lineHeight:
                    1.5,

                  opacity:
                    0.7
                }}
              >
                No se pudieron cargar tus permisos.
              </div>

            )}


            {/* =================================================
                ADMINISTRACION
                ================================================= */}

            {administrador && (

              <>

                <div
                  style={{
                    padding:
                      "8px 12px 5px",

                    marginTop:
                      "18px",

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


                <Enlace
                  to="/administracion/usuarios"
                >
                  Usuarios y permisos
                </Enlace>

              </>

            )}

          </nav>


          {/* ==================================================
              USUARIO
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