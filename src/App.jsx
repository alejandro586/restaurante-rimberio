import {
  Routes,
  Route,
  Navigate
} from "react-router-dom"

import {
  isLogged,
  esAdmin,
  esSupervisor,
  esTrabajador,
  esInvitado,
  inicioSegunRol
} from "./api"

import Layout from "./components/Layout"

import Login from "./pages/Login"
import Register from "./pages/Register"

import Importar from "./pages/Importar"
import DatosEmpresa from "./pages/DatosEmpresa"

import Archivos from "./pages/Archivos"
import Comparar from "./pages/Comparar"

import Proyectos from "./pages/Proyectos"
import ProyectoDetalle from "./pages/ProyectoDetalle"

/**
 * Comprueba si el usuario tiene
 * alguno de los roles permitidos.
 */
const tieneRol = (roles = []) => {
  if (!roles || roles.length === 0) {
    return true
  }

  if (
    roles.includes("admin") &&
    esAdmin()
  ) {
    return true
  }

  if (
    roles.includes("supervisor") &&
    esSupervisor()
  ) {
    return true
  }

  if (
    roles.includes("trabajador") &&
    esTrabajador()
  ) {
    return true
  }

  if (
    roles.includes("invitado") &&
    esInvitado()
  ) {
    return true
  }

  return false
}

/**
 * Ruta privada.
 *
 * Primero comprueba si existe
 * una sesion.
 *
 * Si la ruta tiene roles
 * especificos, tambien valida
 * que el usuario tenga uno
 * de ellos.
 *
 * El backend vuelve a validar
 * todos los permisos.
 */
const Privada = ({
  roles = [],
  children
}) => {
  if (!isLogged()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (
    roles.length > 0 &&
    !tieneRol(roles)
  ) {
    return (
      <Navigate
        to={inicioSegunRol()}
        replace
      />
    )
  }

  return (
    <Layout>
      {children}
    </Layout>
  )
}

/**
 * Ruta publica.
 *
 * Login y registro solamente
 * aparecen cuando no existe
 * una sesion activa.
 */
const Publica = ({
  children
}) => {
  if (isLogged()) {
    return (
      <Navigate
        to={inicioSegunRol()}
        replace
      />
    )
  }

  return children
}

const App = () => {
  return (
    <Routes>
      {/* ====================== */}
      {/* RUTAS PUBLICAS */}
      {/* ====================== */}

      <Route
        path="/login"
        element={
          <Publica>
            <Login />
          </Publica>
        }
      />

      <Route
        path="/registro"
        element={
          <Publica>
            <Register />
          </Publica>
        }
      />

      {/* ====================== */}
      {/* PROYECTOS */}
      {/* ====================== */}

      {/*
        Todos los usuarios
        autenticados pueden entrar
        al modulo Proyectos.

        El backend decide cuales
        proyectos puede ver cada
        usuario.
      */}

      <Route
        path="/proyectos"
        element={
          <Privada>
            <Proyectos />
          </Privada>
        }
      />

      <Route
        path="/proyectos/:id"
        element={
          <Privada>
            <ProyectoDetalle />
          </Privada>
        }
      />

      {/* ====================== */}
      {/* TRABAJADOR */}
      {/* ====================== */}

      <Route
        path="/importar"
        element={
          <Privada
            roles={[
              "trabajador"
            ]}
          >
            <Importar />
          </Privada>
        }
      />

      <Route
        path="/datos-empresa"
        element={
          <Privada
            roles={[
              "trabajador"
            ]}
          >
            <DatosEmpresa />
          </Privada>
        }
      />

      {/* ====================== */}
      {/* ADMINISTRADOR */}
      {/* ====================== */}

      <Route
        path="/archivos"
        element={
          <Privada
            roles={[
              "admin"
            ]}
          >
            <Archivos />
          </Privada>
        }
      />

      <Route
        path="/comparar"
        element={
          <Privada
            roles={[
              "admin"
            ]}
          >
            <Comparar />
          </Privada>
        }
      />

      {/* ====================== */}
      {/* RUTA DESCONOCIDA */}
      {/* ====================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              isLogged()
                ? inicioSegunRol()
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  )
}

export default App