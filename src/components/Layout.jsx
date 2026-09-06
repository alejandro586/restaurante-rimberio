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
  getRol,
  getUserName,
  obtenerMisPermisos
} from "../api"


/* ==========================================================
   MODULOS VISIBLES DE BIG DATA
   ========================================================== */

const MODULOS_BIG_DATA = [
  {
    clave:
      "big_data.importar",

    nombre:
      "Cargar archivos",

    ruta:
      "/big-data/importar",

    icono:
      "↑"
  },

  {
    clave:
      "big_data.datasets",

    nombre:
      "Datasets",

    ruta:
      "/big-data/datasets",

    icono:
      "▦"
  },

  {
    clave:
      "big_data.analisis",

    nombre:
      "Análisis",

    ruta:
      "/big-data/analisis",

    icono:
      "⌁"
  },

  {
    clave:
      "big_data.comparar",

    nombre:
      "Comparación",

    ruta:
      "/big-data/comparar",

    icono:
      "⇄"
  },

  {
    clave:
      "big_data.estructura",

    nombre:
      "Estructura de datos",

    ruta:
      "/big-data/estructura",

    icono:
      "≡"
  }
]


/* ==========================================================
   EXTRAER PERMISOS
   ========================================================== */

const obtenerClavesPermisos = (
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
          respuesta
            ?.permisos
            ?.cursos
        )
        ? respuesta
            .permisos
            .cursos

        : Array.isArray(
            respuesta
              ?.data
              ?.cursos
          )
          ? respuesta
              .data
              .cursos

          : []


  for (
    const curso
    of cursos
  ) {

    if (
      curso?.activo ===
      false
    ) {
      continue
    }


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


  /* ========================================================
     COMPATIBILIDAD CON RESPUESTAS ANTIGUAS
     ======================================================== */

  const separados =
    Array.isArray(
      respuesta?.modulos
    )
      ? respuesta.modulos

      : Array.isArray(
          respuesta
            ?.permisos
            ?.modulos
        )
        ? respuesta
            .permisos
            .modulos

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
   ENLACE
   ========================================================== */

const EnlaceMenu = ({
  to,
  icono,
  children,
  end = false
}) => {

  return (
    <NavLink
      to={
        to
      }
      end={
        end
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
      <span
        aria-hidden="true"
        style={{
          width:
            "22px",

          minWidth:
            "22px",

          display:
            "inline-flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          marginRight:
            "8px",

          fontSize:
            "15px",

          lineHeight:
            1
        }}
      >
        {icono}
      </span>


      <span
        style={{
          minWidth:
            0
        }}
      >
        {children}
      </span>
    </NavLink>
  )
}


/* ==========================================================
   LAYOUT
   ========================================================== */

const Layout = ({
  children
}) => {

  const navigate =
    useNavigate()


  const administrador =
    esAdmin()


  const rol =
    getRol()


  const [
    permisos,
    setPermisos
  ] =
    useState(
      administrador
        ? new Set(
            MODULOS_BIG_DATA.map(
              (
                modulo
              ) =>
                modulo.clave
            )
          )
        : null
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
    useState(false)


  /* ========================================================
     CARGAR PERMISOS
     ======================================================== */

  useEffect(
    () => {

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


        if (
          !permisos
        ) {
          return []
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
     ROL VISUAL
     ======================================================== */

  const nombreRol =
    administrador
      ? "Administrador"
      : "Usuario"


  const claseRol =
    administrador
      ? "rol-chip rol-admin"
      : "rol-chip rol-trabajador"


  /* ========================================================
     CERRAR SESION
     ======================================================== */

  const cerrarSesion =
    () => {

      const confirmado =
        window.confirm(
          "¿Deseas cerrar tu sesión en RIMBERIO?"
        )


      if (
        !confirmado
      ) {
        return
      }


      clearSession()


      navigate(
        "/login",
        {
          replace:
            true
        }
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
            LOGO / MARCA
            ================================================== */}

        <div
          className="sidebar-brand"
          role="button"
          tabIndex={0}
          onClick={
            () =>
              navigate(
                "/mis-cursos"
              )
          }
          onKeyDown={
            (
              event
            ) => {

              if (
                event.key ===
                  "Enter" ||
                event.key ===
                  " "
              ) {

                navigate(
                  "/mis-cursos"
                )
              }
            }
          }
          style={{
            cursor:
              "pointer"
          }}
        >

          <div
            className="brand-logo"
            style={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "#ffffff",

              color:
                "#c1541f",

              fontWeight:
                800,

              fontSize:
                "17px"
            }}
          >
            R
          </div>


          <span>
            RIMBERIO
          </span>

        </div>


        {/* ==================================================
            NAVEGACION
            ================================================== */}

        <nav className="sidebar-nav">

          {/* =================================================
              MIS CURSOS
              ================================================= */}

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


          {/* =================================================
              BIG DATA
              ================================================= */}

          {(administrador ||
            cargandoPermisos ||
            errorPermisos ||
            modulosVisibles.length >
              0) && (

            <div>

              <div>
                Big Data
              </div>


              {/* =============================================
                  CARGANDO
                  ============================================= */}

              {cargandoPermisos && (

                <div
                  style={{
                    padding:
                      "9px 12px",

                    color:
                      "rgba(247,241,230,.58)",

                    fontSize:
                      "11px"
                  }}
                >
                  Cargando...
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
                      "9px 12px",

                    color:
                      "rgba(247,241,230,.58)",

                    fontSize:
                      "11px",

                    lineHeight:
                      1.4
                  }}
                >
                  No se pudieron cargar los módulos.
                </div>

              )}


              {/* =============================================
                  MODULOS
                  ============================================= */}

              {!cargandoPermisos &&
                !errorPermisos &&
                modulosVisibles.map(
                  (
                    modulo
                  ) => (

                    <EnlaceMenu
                      key={
                        modulo.clave
                      }
                      to={
                        modulo.ruta
                      }
                      icono={
                        modulo.icono
                      }
                    >
                      {modulo.nombre}
                    </EnlaceMenu>

                  )
                )}

            </div>

          )}


          {/* =================================================
              ADMINISTRACION
              ================================================= */}

          {administrador && (

            <div>

              <div>
                Administración
              </div>


              {/* =============================================
                  USUARIOS Y PERMISOS
                  ============================================= */}

              <EnlaceMenu
                to="/administracion/usuarios"
                icono="⚙"
              >
                Usuarios y permisos
              </EnlaceMenu>


              {/* =============================================
                  CURSOS Y MODULOS
                  ============================================= */}

              <EnlaceMenu
                to="/administracion/cursos"
                icono="▤"
              >
                Cursos y módulos
              </EnlaceMenu>

            </div>

          )}

        </nav>


        {/* ==================================================
            PIE DEL SIDEBAR
            ================================================== */}

        <div className="sidebar-foot">

          {/* =================================================
              USUARIO
              ================================================= */}

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
                  claseRol
                }
              >
                {nombreRol}
              </span>

            </div>

          </div>


          {/* =================================================
              EMPRESA
              ================================================= */}

          <span
            className="sidebar-empresa"
            title={
              getEmpresa()
            }
          >
            {getEmpresa()}
          </span>


          {/* =================================================
              CERRAR SESION
              ================================================= */}

          <button
            type="button"
            className="btn btn-logout"
            onClick={
              cerrarSesion
            }
          >
            Cerrar sesión
          </button>

        </div>

      </aside>


      {/* ====================================================
          CONTENIDO PRINCIPAL
          ==================================================== */}

      <main className="main">
        {children}
      </main>

    </div>
  )
}


export default Layout