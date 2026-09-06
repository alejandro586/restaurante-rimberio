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


/* ==========================================================
   MODULOS VISIBLES DE BIG DATA
   ========================================================== */

/*
 * IMPORTANTE:
 *
 * No incluimos:
 *
 * big_data.graficos
 * porque Gráficos está dentro de Datasets.
 *
 * Tampoco existe una página independiente
 * de Documentación porque ahora está
 * dentro de Cargar archivos.
 */

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


  /* ========================================================
     CURSOS
     ======================================================== */

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
     COMPATIBILIDAD:
     MODULOS SEPARADOS
     ======================================================== */

  const modulosSeparados =
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
   ENLACE DEL MENU
   ========================================================== */

const EnlaceMenu = ({
  to,
  icono,
  children,
  end = false,
  onClick
}) => {

  return (
    <NavLink
      to={
        to
      }
      end={
        end
      }
      onClick={
        onClick
      }
      className={
        ({
          isActive
        }) =>
          `nav-link${
            isActive
              ? " active"
              : ""
          }`
      }
    >
      <span
        style={{
          width:
            "24px",

          height:
            "24px",

          display:
            "inline-flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          flexShrink:
            0,

          fontSize:
            "16px",

          lineHeight:
            1
        }}
      >
        {icono}
      </span>


      <span>
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


  const location =
    useLocation()


  const administrador =
    esAdmin()


  const rol =
    getRol()


  /* ========================================================
     SIDEBAR MOVIL
     ======================================================== */

  const [
    menuAbierto,
    setMenuAbierto
  ] =
    useState(false)


  /* ========================================================
     PERMISOS
     ======================================================== */

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
     CERRAR MENU AL CAMBIAR RUTA
     ======================================================== */

  useEffect(
    () => {

      setMenuAbierto(
        false
      )

    },
    [
      location.pathname
    ]
  )


  /* ========================================================
     CARGAR PERMISOS
     ======================================================== */

  useEffect(
    () => {

      /*
       * ADMIN:
       *
       * siempre ve todos los módulos
       * disponibles del curso.
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


            /*
             * Seguridad:
             *
             * si no podemos comprobar permisos,
             * no mostramos módulos privados.
             */
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
     MODULOS QUE PUEDE VER
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
     NOMBRE DEL ROL
     ======================================================== */

  const nombreRol =
    administrador
      ? "Administrador"
      : rol === "trabajador"
        ? "Usuario"
        : "Usuario"


  /* ========================================================
     CERRAR SESION
     ======================================================== */

  const cerrarSesion =
    () => {

      const confirmar =
        window.confirm(
          "¿Deseas cerrar tu sesión en RIMBERIO?"
        )


      if (
        !confirmar
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
          BOTON MOVIL
          ==================================================== */}

      <button
        type="button"
        aria-label="Abrir menú"
        onClick={
          () =>
            setMenuAbierto(
              (
                actual
              ) =>
                !actual
            )
        }
        style={{
          position:
            "fixed",

          top:
            "14px",

          left:
            "14px",

          zIndex:
            1200,

          width:
            "42px",

          height:
            "42px",

          borderRadius:
            "10px",

          border:
            "1px solid #eadfd7",

          background:
            "#ffffff",

          alignItems:
            "center",

          justifyContent:
            "center",

          cursor:
            "pointer"
        }}
        className="sidebar-mobile-button"
      >
        ☰
      </button>


      {/* ====================================================
          FONDO MOVIL
          ==================================================== */}

      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={
            () =>
              setMenuAbierto(
                false
              )
          }
          className="sidebar-overlay"
          style={{
            position:
              "fixed",

            inset:
              0,

            zIndex:
              998,

            border:
              0,

            padding:
              0,

            background:
              "rgba(0,0,0,.28)"
          }}
        />
      )}


      {/* ====================================================
          SIDEBAR
          ==================================================== */}

      <aside
        className={
          `sidebar${
            menuAbierto
              ? " open"
              : ""
          }`
        }
      >

        {/* ==================================================
            MARCA
            ================================================== */}

        <div
          className="brand"
          onClick={
            () =>
              navigate(
                "/mis-cursos"
              )
          }
          role="button"
          tabIndex={0}
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
            className="brand-mark"
          >
            R
          </div>


          <div>

            <strong>
              RIMBERIO
            </strong>


            <span>
              ERP por cursos
            </span>

          </div>

        </div>


        {/* ==================================================
            NAVEGACION
            ================================================== */}

        <nav className="nav">

          {/* =================================================
              MIS CURSOS
              ================================================= */}

          <div
            style={{
              marginBottom:
                "8px"
            }}
          >
            <EnlaceMenu
              to="/mis-cursos"
              end
              icono="⌂"
            >
              Mis cursos
            </EnlaceMenu>
          </div>


          {/* =================================================
              BIG DATA
              ================================================= */}

          {(administrador ||
            cargandoPermisos ||
            modulosVisibles.length >
              0 ||
            errorPermisos) && (

            <div
              style={{
                marginTop:
                  "16px"
              }}
            >

              <div
                style={{
                  padding:
                    "0 12px 8px",

                  fontSize:
                    "10px",

                  lineHeight:
                    1,

                  letterSpacing:
                    ".12em",

                  fontWeight:
                    800,

                  color:
                    "#9a887b",

                  textTransform:
                    "uppercase"
                }}
              >
                Big Data
              </div>


              {/* =============================================
                  CARGANDO
                  ============================================= */}

              {cargandoPermisos && (
                <div
                  className="muted"
                  style={{
                    padding:
                      "9px 12px",

                    fontSize:
                      "12px"
                  }}
                >
                  Cargando módulos...
                </div>
              )}


              {/* =============================================
                  ERROR
                  ============================================= */}

              {!cargandoPermisos &&
                errorPermisos && (

                <div
                  className="muted"
                  style={{
                    padding:
                      "9px 12px",

                    fontSize:
                      "12px"
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
              SIN MODULOS
              ================================================= */}

          {!administrador &&
            !cargandoPermisos &&
            !errorPermisos &&
            modulosVisibles.length ===
              0 && (

            <div
              style={{
                marginTop:
                  "16px",

                padding:
                  "12px",

                borderRadius:
                  "9px",

                background:
                  "#faf7f5",

                border:
                  "1px solid #eee5df"
              }}
            >
              <strong
                style={{
                  display:
                    "block",

                  fontSize:
                    "11px",

                  marginBottom:
                    "4px"
                }}
              >
                Sin módulos
              </strong>


              <span
                className="muted"
                style={{
                  display:
                    "block",

                  fontSize:
                    "11px",

                  lineHeight:
                    1.4
                }}
              >
                El administrador todavía no te ha asignado funciones.
              </span>
            </div>

          )}


          {/* =================================================
              ADMINISTRACION
              ================================================= */}

          {administrador && (

            <div
              style={{
                marginTop:
                  "22px"
              }}
            >

              <div
                style={{
                  padding:
                    "0 12px 8px",

                  fontSize:
                    "10px",

                  lineHeight:
                    1,

                  letterSpacing:
                    ".12em",

                  fontWeight:
                    800,

                  color:
                    "#9a887b",

                  textTransform:
                    "uppercase"
                }}
              >
                Administración
              </div>


              <EnlaceMenu
                to="/administracion/usuarios"
                icono="⚙"
              >
                Usuarios y permisos
              </EnlaceMenu>

            </div>

          )}

        </nav>


        {/* ==================================================
            ESPACIADOR
            ================================================== */}

        <div
          style={{
            flex:
              1
          }}
        />


        {/* ==================================================
            USUARIO
            ================================================== */}

        <div className="sidebar-user">

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "10px",

              minWidth:
                0
            }}
          >

            <div className="avatar">
              {getInitials()}
            </div>


            <div
              style={{
                minWidth:
                  0,

                flex:
                  1
              }}
            >

              <strong
                style={{
                  display:
                    "block",

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap",

                  fontSize:
                    "13px"
                }}
              >
                {getUserName()}
              </strong>


              <span
                className="muted"
                style={{
                  display:
                    "block",

                  marginTop:
                    "2px",

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap",

                  fontSize:
                    "11px"
                }}
              >
                {nombreRol}
              </span>

            </div>

          </div>


          {/* =================================================
              EMPRESA
              ================================================= */}

          <div
            className="muted"
            style={{
              marginTop:
                "10px",

              paddingTop:
                "10px",

              borderTop:
                "1px solid #eadfd7",

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",

              whiteSpace:
                "nowrap",

              fontSize:
                "11px"
            }}
            title={
              getEmpresa()
            }
          >
            {getEmpresa()}
          </div>


          {/* =================================================
              CERRAR SESION
              ================================================= */}

          <button
            type="button"
            className="btn btn-light btn-block"
            onClick={
              cerrarSesion
            }
            style={{
              marginTop:
                "10px"
            }}
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

    </div>
  )
}


export default Layout