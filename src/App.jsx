import {
  BrowserRouter,
  Navigate,
  Outlet,
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

/**
 * Comprueba si existe una sesión.
 *
 * Si no existe:
 * → /login
 *
 * Si existe:
 * → permite continuar.
 */
const RutaPrivada = () => {
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

  return <Outlet />
}


/* ==========================================================
   CONTROL DE ROLES
   ========================================================== */

/**
 * Protege páginas según el rol general
 * del usuario dentro de RIMBERIO.
 */
const RutaRol = ({
  roles
}) => {
  const rol =
    getRol()

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
    !roles.includes(
      rol
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

  return <Outlet />
}


/* ==========================================================
   REDIRECCION INICIAL
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

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            INICIO
            ================================================== */}

        <Route
          path="/"
          element={
            <Inicio />
          }
        />


        {/* ==================================================
            RUTAS PUBLICAS
            ================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/registro"
          element={
            <Register />
          }
        />


        {/* ==================================================
            INVITACIONES
            ==================================================

            IMPORTANTE:

            Esta ruta debe ser PUBLICA.

            Una persona puede abrir el correo
            sin tener todavía una cuenta en
            RIMBERIO.

            La pantalla AceptarInvitacion se
            encargará de pedir login/registro
            cuando sea necesario.
        */}

        <Route
          path="/invitaciones/aceptar"
          element={
            <AceptarInvitacion />
          }
        />


        {/* ==================================================
            SISTEMA PRIVADO
            ================================================== */}

        <Route
          element={
            <RutaPrivada />
          }
        >

          <Route
            element={
              <Layout />
            }
          >

            {/* ==============================================
                PROYECTOS
                ==============================================

                Todos los usuarios del sistema pueden entrar
                a Proyectos.

                El backend determina cuáles proyectos puede
                visualizar realmente cada usuario.
            */}

            <Route
              path="/proyectos"
              element={
                <Proyectos />
              }
            />

            <Route
              path="/proyectos/:id"
              element={
                <ProyectoDetalle />
              }
            />


            {/* ==============================================
                TRABAJADOR
                ============================================== */}

            <Route
              element={
                <RutaRol
                  roles={[
                    "admin",
                    "trabajador"
                  ]}
                />
              }
            >

              <Route
                path="/importar"
                element={
                  <Importar />
                }
              />

              <Route
                path="/datos-empresa"
                element={
                  <DatosEmpresa />
                }
              />

            </Route>


            {/* ==============================================
                ADMINISTRADOR
                ============================================== */}

            <Route
              element={
                <RutaRol
                  roles={[
                    "admin"
                  ]}
                />
              }
            >

              <Route
                path="/archivos"
                element={
                  <Archivos />
                }
              />

              <Route
                path="/comparar"
                element={
                  <Comparar />
                }
              />

            </Route>

          </Route>

        </Route>


        {/* ==================================================
            404
            ================================================== */}

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

    </BrowserRouter>
  )
}

export default App