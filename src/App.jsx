import {
  Navigate,
  Route,
  Routes
} from "react-router-dom"

import {
  esAdmin,
  isLogged
} from "./api"

import Layout
  from "./components/Layout"

import Login
  from "./pages/Login"

import Register
  from "./pages/Register"

import RecuperarPassword
  from "./pages/RecuperarPassword"

import RestablecerPassword
  from "./pages/RestablecerPassword"

import MisCursos
  from "./pages/MisCursos"

import Importar
  from "./pages/Importar"

import Archivos
  from "./pages/Archivos"

import Comparar
  from "./pages/Comparar"

import DatosEmpresa
  from "./pages/DatosEmpresa"

import AdminUsuarios
  from "./pages/AdminUsuarios"


/* ==========================================================
   RUTA PRIVADA
   ========================================================== */

/*
 * Esta protección SOLO verifica
 * que exista una sesión.
 *
 * NO vuelve a consultar permisos aquí.
 *
 * Los permisos se utilizan:
 *
 * 1. En Layout.jsx para decidir qué mostrar.
 * 2. En las páginas que tienen funciones especiales.
 * 3. Principalmente en el BACKEND para seguridad real.
 *
 * Esto evita que React Router mande al usuario
 * nuevamente a /mis-cursos al intentar navegar.
 */

const Privada = ({
  children
}) => {

  if (
    !isLogged()
  ) {

    return (
      <Navigate
        to="/login"
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
   SOLO ADMIN
   ========================================================== */

const SoloAdmin = ({
  children
}) => {

  if (
    !isLogged()
  ) {

    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  if (
    !esAdmin()
  ) {

    return (
      <Navigate
        to="/mis-cursos"
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

const Publica = ({
  children
}) => {

  if (
    isLogged()
  ) {

    return (
      <Navigate
        to="/mis-cursos"
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

  if (
    !isLogged()
  ) {

    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  return (
    <Navigate
      to="/mis-cursos"
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
          LOGIN
          ==================================================== */}

      <Route
        path="/login"
        element={
          <Publica>

            <Login />

          </Publica>
        }
      />


      {/* ====================================================
          REGISTRO
          ==================================================== */}

      <Route
        path="/registro"
        element={
          <Publica>

            <Register />

          </Publica>
        }
      />


      {/* ====================================================
          RECUPERAR PASSWORD
          ==================================================== */}

      <Route
        path="/recuperar-password"
        element={
          <Publica>

            <RecuperarPassword />

          </Publica>
        }
      />


      {/* ====================================================
          RESTABLECER PASSWORD
          ==================================================== */}

      <Route
        path="/restablecer-password"
        element={
          <Publica>

            <RestablecerPassword />

          </Publica>
        }
      />


      {/* ====================================================
          RAIZ
          ==================================================== */}

      <Route
        path="/"
        element={
          <Inicio />
        }
      />


      {/* ====================================================
          MIS CURSOS
          ==================================================== */}

      <Route
        path="/mis-cursos"
        element={
          <Privada>

            <MisCursos />

          </Privada>
        }
      />


      {/* ====================================================
          BIG DATA
          ==================================================== */}


      {/* ====================================================
          CARGAR ARCHIVOS
          ==================================================== */}

      <Route
        path="/big-data/importar"
        element={
          <Privada>

            <Importar />

          </Privada>
        }
      />


      {/* ====================================================
          DATASETS
          ==================================================== */}

      <Route
        path="/big-data/datasets"
        element={
          <Privada>

            <Archivos />

          </Privada>
        }
      />


      {/* ====================================================
          ANALISIS
          ==================================================== */}

      <Route
        path="/big-data/analisis"
        element={
          <Privada>

            <Comparar
              modo="analisis"
            />

          </Privada>
        }
      />


      {/* ====================================================
          COMPARACION
          ==================================================== */}

      <Route
        path="/big-data/comparar"
        element={
          <Privada>

            <Comparar
              modo="comparacion"
            />

          </Privada>
        }
      />


      {/* ====================================================
          ESTRUCTURA DE DATOS
          ==================================================== */}

      <Route
        path="/big-data/estructura"
        element={
          <Privada>

            <DatosEmpresa />

          </Privada>
        }
      />


      {/* ====================================================
          ADMINISTRACION
          ==================================================== */}

      <Route
        path="/administracion/usuarios"
        element={
          <SoloAdmin>

            <AdminUsuarios />

          </SoloAdmin>
        }
      />


      {/* ====================================================
          RUTAS ANTIGUAS
          ==================================================== */}

      <Route
        path="/importar"
        element={
          <Navigate
            to="/big-data/importar"
            replace
          />
        }
      />


      <Route
        path="/archivos"
        element={
          <Navigate
            to="/big-data/datasets"
            replace
          />
        }
      />


      <Route
        path="/comparar"
        element={
          <Navigate
            to="/big-data/comparar"
            replace
          />
        }
      />


      <Route
        path="/datos-empresa"
        element={
          <Navigate
            to="/big-data/estructura"
            replace
          />
        }
      />


      {/* ====================================================
          GRAFICOS

          Ahora están dentro de Datasets.
          ==================================================== */}

      <Route
        path="/big-data/graficos"
        element={
          <Navigate
            to="/big-data/datasets"
            replace
          />
        }
      />


      {/* ====================================================
          DOCUMENTACION

          Ahora está dentro de Cargar archivos.
          ==================================================== */}

      <Route
        path="/big-data/documentos"
        element={
          <Navigate
            to="/big-data/importar"
            replace
          />
        }
      />


      {/* ====================================================
          RUTA DESCONOCIDA
          ==================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              isLogged()
                ? "/mis-cursos"
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