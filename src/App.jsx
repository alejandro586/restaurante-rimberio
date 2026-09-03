import {
  Navigate,
  Route,
  Routes
} from "react-router-dom"

import {
  getRol,
  inicioSegunRol,
  isLogged
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

import AceptarInvitacion from "./pages/AceptarInvitacion"


/* ==========================================================
   RUTA PRIVADA
   ========================================================== */

const Privada = ({
  roles = null,
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
    Array.isArray(roles) &&
    roles.length > 0
  ) {
    const rolActual =
      getRol()

    if (
      !roles.includes(
        rolActual
      )
    ) {
      return (
        <Navigate
          to={
            inicioSegunRol()
          }
          replace
        />
      )
    }
  }

  return (
    <Layout>
      {children}
    </Layout>
  )
}


/* ==========================================================
   RUTA PUBLICA DE AUTENTICACION
   ========================================================== */

const Publica = ({
  children
}) => {
  if (isLogged()) {
    return (
      <Navigate
        to={
          inicioSegunRol()
        }
        replace
      />
    )
  }

  return children
}


/* ==========================================================
   INICIO
   ========================================================== */

const Inicio = () => {
  if (!isLogged()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return (
    <Navigate
      to={
        inicioSegunRol()
      }
      replace
    />
  )
}


/* ==========================================================
   APP
   ========================================================== */

const App = () => {
  return (
    <Routes>

      {/* ====================================================
          INICIO
          ==================================================== */}

      <Route
        path="/"
        element={
          <Inicio />
        }
      />


      {/* ====================================================
          AUTENTICACION
          ==================================================== */}

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


      {/* ====================================================
          INVITACION PUBLICA
          ====================================================

          NO usamos Publica aquí.

          Esto permite abrir una invitación
          tanto con sesión iniciada como
          sin sesión.
      */}

      <Route
        path="/invitaciones/aceptar"
        element={
          <AceptarInvitacion />
        }
      />


      {/* ====================================================
          PROYECTOS
          ==================================================== */}

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


      {/* ====================================================
          TRABAJADOR
          ==================================================== */}

      <Route
        path="/importar"
        element={
          <Privada
            roles={[
              "admin",
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
              "admin",
              "trabajador"
            ]}
          >
            <DatosEmpresa />
          </Privada>
        }
      />


      {/* ====================================================
          ADMINISTRADOR
          ==================================================== */}

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


      {/* ====================================================
          404
          ==================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  )
}


export default App