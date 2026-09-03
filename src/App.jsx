import {
  Routes,
  Route,
  Navigate
} from "react-router-dom"

import {
  isLogged,
  esAdmin,
  esTrabajador,
  inicioSegunRol
} from "./api"

import Layout from "./components/Layout"

import Login from "./pages/Login"
import Register from "./pages/Register"

import Importar from "./pages/Importar"
import DatosEmpresa from "./pages/DatosEmpresa"

import Archivos from "./pages/Archivos"
import Comparar from "./pages/Comparar"

/*
 * NUEVO:
 * Panel de administracion de usuarios,
 * cursos y permisos.
 */
import AdminUsuarios from "./pages/AdminUsuarios"


/* ==========================================================
   RUTA PRIVADA
   ========================================================== */

/**
 * Cada ruta puede indicar que rol
 * puede entrar.
 *
 * El frontend evita mostrar paginas
 * que no correspondan al usuario.
 *
 * IMPORTANTE:
 * La seguridad real tambien se
 * comprueba en el backend.
 */
const Privada = ({
  rol,
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


  const permitido =
    rol === "admin"
      ? esAdmin()
      : rol === "trabajador"
        ? esTrabajador()
        : true


  if (!permitido) {
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


/* ==========================================================
   RUTA PUBLICA
   ========================================================== */

/**
 * Si el usuario ya inicio sesion
 * no necesita regresar a Login
 * o Registro.
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


/* ==========================================================
   APLICACION
   ========================================================== */

const App = () => (
  <Routes>

    {/* ======================================================
        PUBLICAS
        ====================================================== */}

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


    {/* ======================================================
        TRABAJADOR
        ====================================================== */}

    <Route
      path="/importar"
      element={
        <Privada rol="trabajador">
          <Importar />
        </Privada>
      }
    />


    <Route
      path="/datos-empresa"
      element={
        <Privada rol="trabajador">
          <DatosEmpresa />
        </Privada>
      }
    />


    {/* ======================================================
        ADMINISTRADOR
        ====================================================== */}

    <Route
      path="/archivos"
      element={
        <Privada rol="admin">
          <Archivos />
        </Privada>
      }
    />


    <Route
      path="/comparar"
      element={
        <Privada rol="admin">
          <Comparar />
        </Privada>
      }
    />


    {/* ======================================================
        NUEVO - ADMINISTRACION DE USUARIOS
        ====================================================== */}

    <Route
      path="/administracion/usuarios"
      element={
        <Privada rol="admin">
          <AdminUsuarios />
        </Privada>
      }
    />


    {/* ======================================================
        RUTA DESCONOCIDA
        ====================================================== */}

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


export default App