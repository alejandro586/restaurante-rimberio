import {
  useState
} from "react"

import {
  NavLink,
  useNavigate,
  useLocation
} from "react-router-dom"

import {
  clearSession,
  getUserName,
  getInitials,
  getRol,
  getEmpresa,
  esAdmin
} from "../api"

import Confirm from "./Confirm"


/* ==========================================================
   MENU SEGUN ROL
   ========================================================== */

const MENU = {
  trabajador: [
    {
      to: "/importar",
      label: "Importar archivos"
    },
    {
      to: "/datos-empresa",
      label: "Datos de la empresa"
    }
  ],

  admin: [
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
}


/* ==========================================================
   COMPONENTE
   ========================================================== */

const Layout = ({
  children
}) => {

  const navigate =
    useNavigate()

  const location =
    useLocation()


  const [
    asking,
    setAsking
  ] = useState(false)


  const rol =
    getRol()


  const enlaces =
    MENU[rol] || []


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
            NAVEGACION
            ================================================== */}

        <nav
          className="sidebar-nav"
          aria-label="Navegación principal"
        >
          {enlaces.map(
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


        {/* ==================================================
            USUARIO
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
                  : "Trabajador"}
              </span>

            </div>
          </div>


          {/* ================================================
              EMPRESA
              ================================================ */}

          <span className="sidebar-empresa">
            {getEmpresa()}
          </span>


          {/* ================================================
              CERRAR SESION
              ================================================ */}

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
       * La key hace que el contenido
       * vuelva a montarse cuando cambia
       * la ruta.
       *
       * Esto conserva las animaciones
       * de entrada existentes.
       */}
      <main
        className="main"
        key={location.pathname}
      >
        {children}
      </main>


      {/* ====================================================
          CONFIRMACION DE LOGOUT
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