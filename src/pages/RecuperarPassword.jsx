import {
  useState
} from "react"

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom"

import {
  getMessage,
  solicitarRecuperacionPassword
} from "../api"


/* ==========================================================
   REDIRECCIONES SEGURAS
   ========================================================== */

const redireccionSegura =
  (
    valor
  ) => {

    if (
      !valor ||
      typeof valor !==
        "string"
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
   RECUPERAR PASSWORD
   ========================================================== */

const RecuperarPassword =
  () => {

    const navigate =
      useNavigate()


    const location =
      useLocation()


    /* ========================================================
       REDIRECCION ORIGINAL
       ======================================================== */

    const obtenerDestino =
      () => {

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


        if (
          desdeUrl
        ) {
          return desdeUrl
        }


        const desdeState =
          redireccionSegura(
            location.state?.redirect
          )


        if (
          desdeState
        ) {
          return desdeState
        }


        const guardado =
          redireccionSegura(
            sessionStorage.getItem(
              "rimberio_after_auth"
            )
          )


        if (
          guardado
        ) {
          return guardado
        }


        return ""
      }


    /* ========================================================
       EMAIL
       ======================================================== */

    const [
      email,
      setEmail
    ] =
      useState(
        () => {

          const correoInicial =
            location.state?.email


          return typeof correoInicial ===
            "string"
            ? correoInicial
                .trim()
                .toLowerCase()
            : ""
        }
      )


    /* ========================================================
       ESTADOS
       ======================================================== */

    const [
      error,
      setError
    ] =
      useState("")


    const [
      mensaje,
      setMensaje
    ] =
      useState("")


    const [
      loading,
      setLoading
    ] =
      useState(false)


    const [
      solicitudEnviada,
      setSolicitudEnviada
    ] =
      useState(false)


    /* ========================================================
       SOLICITAR RECUPERACION
       ======================================================== */

    const solicitar =
      async (
        event
      ) => {

        event.preventDefault()


        setError("")
        setMensaje("")
        setLoading(true)


        try {

          const correo =
            email
              .trim()
              .toLowerCase()


          const resultado =
            await solicitarRecuperacionPassword(
              correo
            )


          setEmail(
            correo
          )


          setSolicitudEnviada(
            true
          )


          setMensaje(
            resultado?.mensaje ||
            "La solicitud de recuperación fue enviada correctamente."
          )

        } catch (
          problem
        ) {

          setSolicitudEnviada(
            false
          )


          setError(
            getMessage(
              problem
            )
          )

        } finally {

          setLoading(
            false
          )
        }
      }


    /* ========================================================
       IR A RESTABLECER PASSWORD
       ======================================================== */

    const irARestablecer =
      () => {

        const destino =
          obtenerDestino()


        const ruta =
          destino
            ? `/restablecer-password?redirect=${encodeURIComponent(
                destino
              )}`
            : "/restablecer-password"


        navigate(
          ruta,
          {
            state: {
              email:
                email
                  .trim()
                  .toLowerCase(),

              redirect:
                destino ||
                null
            }
          }
        )
      }


    /* ========================================================
       VOLVER AL LOGIN
       ======================================================== */

    const obtenerUrlLogin =
      () => {

        const destino =
          obtenerDestino()


        if (
          !destino
        ) {
          return "/login"
        }


        return (
          `/login?redirect=${encodeURIComponent(
            destino
          )}`
        )
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
              Recupera el acceso a tu cuenta
            </h2>

            <p>
              Solicita autorización para cambiar
              tu contraseña. Un administrador
              revisará la solicitud antes de que
              puedas establecer una nueva clave.
            </p>

          </div>


          <div className="auth-stats">

            <div>

              <strong>
                1
              </strong>

              <span>
                Solicita
              </span>

            </div>


            <div>

              <strong>
                2
              </strong>

              <span>
                Admin autoriza
              </span>

            </div>


            <div>

              <strong>
                3
              </strong>

              <span>
                Nueva clave
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
              solicitar
            }
          >

            <h1>
              Recuperar contraseña
            </h1>


            <p>
              Ingresa el correo asociado
              a tu cuenta de RIMBERIO.
            </p>


            {/* ================================================
                INFORMACION
                ================================================ */}

            <div
              className="login-invitation-notice"
            >

              <div
                className="login-invitation-icon"
              >
                !
              </div>


              <div>

                <strong>
                  Necesitas autorización
                </strong>

                <p>
                  El administrador debe aprobar
                  primero tu solicitud. Después
                  recibirás un código temporal
                  para crear una nueva contraseña.
                </p>

              </div>

            </div>


            {/* ================================================
                ERROR
                ================================================ */}

            {error && (
              <div
                className="alert alert-error"
              >
                {error}
              </div>
            )}


            {/* ================================================
                MENSAJE CORRECTO
                ================================================ */}

            {mensaje && (
              <div
                className="alert alert-success"
              >
                {mensaje}
              </div>
            )}


            {/* ================================================
                EMAIL
                ================================================ */}

            <div className="field">

              <label
                htmlFor="recovery-email"
              >
                Correo electrónico
              </label>


              <input
                id="recovery-email"
                type="email"
                value={
                  email
                }
                onChange={(
                  event
                ) => {

                  setEmail(
                    event.target.value
                  )


                  /*
                   * Si modifica el correo
                   * después de enviar la
                   * solicitud, consideramos
                   * que debe solicitar otra.
                   */
                  if (
                    solicitudEnviada
                  ) {

                    setSolicitudEnviada(
                      false
                    )

                    setMensaje("")
                  }
                }}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
                disabled={
                  loading
                }
              />

            </div>


            {/* ================================================
                SOLICITAR
                ================================================ */}

            <button
              type="submit"
              className="btn btn-block"
              disabled={
                loading
              }
            >

              {loading
                ? "Enviando solicitud..."
                : solicitudEnviada
                  ? "Solicitud enviada"
                  : "Solicitar recuperación"}

            </button>


            {/* ================================================
                YA TENGO CODIGO
                ================================================ */}

            <button
              type="button"
              className="btn btn-block"
              onClick={
                irARestablecer
              }
              disabled={
                loading
              }
            >
              Ya tengo un código
            </button>


            {/* ================================================
                EXPLICACION POST SOLICITUD
                ================================================ */}

            {solicitudEnviada && (
              <div
                className="login-invitation-notice"
              >

                <div
                  className="login-invitation-icon"
                >
                  ✓
                </div>


                <div>

                  <strong>
                    Solicitud registrada
                  </strong>

                  <p>
                    Espera a que un administrador
                    autorice el cambio. Cuando
                    recibas el código temporal,
                    pulsa "Ya tengo un código".
                  </p>

                </div>

              </div>
            )}


            {/* ================================================
                VOLVER
                ================================================ */}

            <div className="auth-footer">

              ¿Recordaste tu contraseña?


              <Link
                to={
                  obtenerUrlLogin()
                }
              >

                <button
                  type="button"
                  disabled={
                    loading
                  }
                >
                  Volver al login
                </button>

              </Link>

            </div>

          </form>

        </section>

      </div>
    )
  }


export default RecuperarPassword