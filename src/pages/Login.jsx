import {
  useState
} from "react"

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom"

import api, {
  getMessage,
  inicioSegunRol,
  saveSession
} from "../api"


/* ==========================================================
   REDIRECCIONES SEGURAS
   ========================================================== */

/**
 * Solo permitimos rutas internas de RIMBERIO.
 *
 * Correcto:
 * /proyectos
 * /invitaciones/aceptar?token=ABC
 *
 * Rechazado:
 * https://otra-web.com
 * //otra-web.com
 */
const redireccionSegura = (
  valor
) => {
  if (
    !valor ||
    typeof valor !== "string"
  ) {
    return ""
  }

  const destino =
    valor.trim()

  if (
    !destino.startsWith("/")
  ) {
    return ""
  }

  if (
    destino.startsWith("//")
  ) {
    return ""
  }

  return destino
}


/* ==========================================================
   LOGIN
   ========================================================== */

const Login = () => {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const [
    email,
    setEmail
  ] = useState("")

  const [
    password,
    setPassword
  ] = useState("")

  const [
    error,
    setError
  ] = useState("")

  const [
    loading,
    setLoading
  ] = useState(false)


  /* ========================================================
     DESTINO DESPUES DEL LOGIN
     ======================================================== */

  const obtenerDestino =
    () => {
      /**
       * Primera posibilidad:
       *
       * /login?redirect=/invitaciones/...
       */
      const params =
        new URLSearchParams(
          location.search
        )

      const desdeUrl =
        redireccionSegura(
          params.get(
            "redirect"
          )
        )

      if (desdeUrl) {
        return desdeUrl
      }

      /**
       * Segunda posibilidad:
       *
       * AceptarInvitacion.jsx guardó
       * el destino en sessionStorage.
       */
      const guardado =
        redireccionSegura(
          sessionStorage.getItem(
            "rimberio_after_auth"
          )
        )

      if (guardado) {
        return guardado
      }

      /**
       * Login normal.
       */
      return ""
    }


  /* ========================================================
     LINK AL REGISTRO
     ======================================================== */

  const obtenerUrlRegistro =
    () => {
      const destino =
        obtenerDestino()

      if (!destino) {
        return "/registro"
      }

      return (
        `/registro?redirect=${encodeURIComponent(
          destino
        )}`
      )
    }


  /* ========================================================
     SUBMIT
     ======================================================== */

  const submit =
    async (
      event
    ) => {
      event.preventDefault()

      setError("")
      setLoading(true)

      try {
        const {
          data
        } =
          await api.post(
            "/auth/login",
            {
              email:
                email
                  .trim()
                  .toLowerCase(),

              password
            }
          )


        /* ================================================
           GUARDAR SESION
           ================================================ */

        saveSession(
          data.token,
          data.user,
          data.perfil
        )


        /* ================================================
           REDIRECCION
           ================================================ */

        const destino =
          obtenerDestino()

        /**
         * Si el usuario llegó desde
         * una invitación:
         *
         * Login
         *   ↓
         * Invitación
         */
        if (destino) {
          /**
           * Conservamos rimberio_after_auth
           * hasta que la invitación se acepte
           * correctamente.
           *
           * AceptarInvitacion.jsx será quien
           * lo elimine.
           */
          navigate(
            destino,
            {
              replace: true
            }
          )

          return
        }


        /**
         * Login normal de RIMBERIO.
         */
        navigate(
          inicioSegunRol(),
          {
            replace: true
          }
        )

      } catch (problem) {

        /* ================================================
           CUENTA PENDIENTE DE VERIFICACION
           ================================================ */

        const pending =
          problem.response &&
          problem.response.data &&
          problem.response.data.pending

        if (pending) {
          const destino =
            obtenerDestino()

          /**
           * Si venía desde una invitación,
           * conservamos el destino.
           */
          if (destino) {
            sessionStorage.setItem(
              "rimberio_after_auth",
              destino
            )
          }

          navigate(
            "/registro",
            {
              state: {
                email:
                  email
                    .trim()
                    .toLowerCase(),

                step:
                  "verify",

                redirect:
                  destino ||
                  null
              }
            }
          )

          return
        }


        /* ================================================
           ERROR NORMAL
           ================================================ */

        setError(
          getMessage(
            problem
          )
        )

      } finally {
        setLoading(false)
      }
    }


  /* ========================================================
     RENDER
     ======================================================== */

  return (
    <div className="auth">

      {/* ====================================================
          PANEL VISUAL
          ==================================================== */}

      <section className="auth-art">

        <div className="auth-brand">

          <img
            src="/icono.png"
            alt="RIMBERIO"
            className="brand-logo"
          />

          <span>
            RIMBERIO
          </span>

        </div>


        <div>

          <h2>
            Gestiona las cartas de tu restaurante
          </h2>

          <p>
            Administra el catálogo de platos,
            organiza tus proyectos, coordina
            actividades con tu equipo y revisa
            la información de tu restaurante
            desde un solo lugar.
          </p>

        </div>


        <div className="auth-stats">

          <div>
            <strong>
              ERP
            </strong>

            <span>
              Gestión
            </span>
          </div>

          <div>
            <strong>
              +
            </strong>

            <span>
              Proyectos
            </span>
          </div>

          <div>
            <strong>
              ✓
            </strong>

            <span>
              Equipo
            </span>
          </div>

        </div>

      </section>


      {/* ====================================================
          FORMULARIO
          ==================================================== */}

      <section className="auth-panel">

        <form
          className="auth-form"
          onSubmit={
            submit
          }
        >

          <h1>
            Bienvenido
          </h1>

          <p>
            Ingresa tus credenciales para continuar
          </p>


          {/* ================================================
              AVISO SI VIENE DE INVITACION
              ================================================ */}

          {obtenerDestino() && (
            <div className="login-invitation-notice">

              <div className="login-invitation-icon">
                @
              </div>

              <div>
                <strong>
                  Tienes una invitación pendiente
                </strong>

                <p>
                  Inicia sesión para regresar
                  automáticamente a la invitación
                  y poder aceptarla.
                </p>
              </div>

            </div>
          )}


          {/* ================================================
              ERROR
              ================================================ */}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}


          {/* ================================================
              EMAIL
              ================================================ */}

          <div className="field">

            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              value={
                email
              }
              onChange={(
                event
              ) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />

          </div>


          {/* ================================================
              PASSWORD
              ================================================ */}

          <div className="field">

            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
            />

          </div>


          {/* ================================================
              INGRESAR
              ================================================ */}

          <button
            type="submit"
            className="btn btn-block"
            disabled={
              loading
            }
          >
            {loading
              ? "Ingresando..."
              : "Ingresar"}
          </button>


          {/* ================================================
              REGISTRO
              ================================================ */}

          <div className="auth-footer">

            ¿No tienes cuenta?

            <Link
              to={
                obtenerUrlRegistro()
              }
            >
              <button
                type="button"
              >
                Regístrate
              </button>
            </Link>

          </div>

        </form>

      </section>

    </div>
  )
}


export default Login