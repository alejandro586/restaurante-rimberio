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
  getEmpresa
} from "../api"

import Confirm from "./Confirm"

/**
 * Menu principal del sistema.
 *
 * Cada rol tiene acceso solamente
 * a los modulos que le corresponden.
 *
 * El modulo Proyectos forma parte
 * del nuevo sistema colaborativo.
 */
const MENU = {
  admin: [
    {
      to: "/proyectos",
      label: "Proyectos"
    },
    {
      to: "/archivos",
      label: "Archivos cargados"
    },
    {
      to: "/comparar",
      label: "Comparar restaurantes"
    }
  ],

  supervisor: [
    {
      to: "/proyectos",
      label: "Proyectos"
    }
  ],

  trabajador: [
    {
      to: "/proyectos",
      label: "Proyectos"
    },
    {
      to: "/importar",
      label: "Importar archivos"
    },
    {
      to: "/datos-empresa",
      label: "Datos de la empresa"
    }
  ],

  invitado: [
    {
      to: "/proyectos",
      label: "Proyectos"
    }
  ]
}

/**
 * Nombre visible de cada rol.
 */
const NOMBRES_ROL = {
  admin: "Administrador",
  supervisor: "Supervisor",
  trabajador: "Trabajador",
  invitado: "Invitado"
}

/**
 * Clase CSS asociada al rol.
 *
 * En el siguiente archivo de estilos
 * añadiremos supervisor e invitado.
 */
const CLASES_ROL = {
  admin: "rol-admin",
  supervisor: "rol-supervisor",
  trabajador: "rol-trabajador",
  invitado: "rol-invitado"
}

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
    MENU[rol] || [
      {
        to: "/proyectos",
        label: "Proyectos"
      }
    ]

  const nombreRol =
    NOMBRES_ROL[rol] ||
    "Usuario"

  const claseRol =
    CLASES_ROL[rol] ||
    "rol-trabajador"

  /**
   * Cierra la sesion local
   * y vuelve al login.
   */
  const logout = () => {
    clearSession()

    navigate(
      "/login"
    )
  }

  return (
    <div className="layout">
      <aside className="sidebar">
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

        <nav className="sidebar-nav">
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
                className={`rol-chip ${claseRol}`}
              >
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
            onClick={() =>
              setAsking(true)
            }
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/*
        La key hace que el contenido
        se vuelva a montar cuando cambia
        la ruta.

        Esto conserva el comportamiento
        que ya tenia tu proyecto.
      */}
      <main
        className="main"
        key={location.pathname}
      >
        {children}
      </main>

      {asking && (
        <Confirm
          title="Cerrar sesion"
          message="Estas seguro de que deseas cerrar la sesion?"
          detail="Tendras que ingresar tus credenciales nuevamente."
          confirmLabel="Cerrar sesion"
          danger
          onCancel={() =>
            setAsking(false)
          }
          onConfirm={logout}
        />
      )}
    </div>
  )
}

export default Layout