import {
  useState
} from "react"

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom"

import {
  completarRecuperacionPassword,
  getMessage
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
   RESTABLECER PASSWORD
   ========================================================== */

const RestablecerPassword =
  () => {

    const navigate =
      useNavigate()


    const location =
      useLocation()


    /* ========================================================
       DESTINO ORIGINAL
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

          const inicial =
            location.state?.email


          return typeof inicial ===
            "string"
            ? inicial
                .trim()
                .toLowerCase()
            : ""
        }
      )


    /* ========================================================
       CODIGO
       ======================================================== */

    const [
      codigo,
      setCodigo
    ] =
      useState("")


    /* ========================================================
       PASSWORD
       ======================================================== */

    const [
      password,
      setPassword
    ] =
      useState("")


    const [
      passwordConfirm,
      setPasswordConfirm
    ] =
      useState("")


    /* ========================================================
       MOSTRAR PASSWORD
       ======================================================== */

    const [
      mostrarPassword,
      setMostrarPassword
    ] =
      useState(false)


    const [
      mostrarConfirmacion,
      setMostrarConfirmacion
    ] =
      useState(false)


    /* ========================================================
       ESTADOS
       ======================================================== */

    const [
      error,
      setError
    ] =
      useState("")


    const [
      loading,
      setLoading
    ] =
      useState(false)


    /* ========================================================
       VALIDAR FORMULARIO
       ======================================================== */

    const validarFormulario =
      () => {

        const correo =
          email
            .trim()
            .toLowerCase()


        const codigoFinal =
          codigo.trim()


        if (
          !correo
        ) {
          return (
            "El correo es obligatorio"
          )
        }


        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
              correo
            )
        ) {
          return (
            "Ingresa un correo electrónico válido"
          )
        }


        if (
          !codigoFinal
        ) {
          return (
            "Ingresa el código de recuperación"
          )
        }


        if (
          !/^\d{6}$/
            .test(
              codigoFinal
            )
        ) {
          return (
            "El código debe contener exactamente 6 números"
          )
        }


        if (
          !password
        ) {
          return (
            "Ingresa la nueva contraseña"
          )
        }


        if (
          password.length <
          8
        ) {
          return (
            "La nueva contraseña debe tener al menos 8 caracteres"
          )
        }


        if (
          password.length >
          128
        ) {
          return (
            "La nueva contraseña es demasiado larga"
          )
        }


        if (
          !passwordConfirm
        ) {
          return (
            "Confirma la nueva contraseña"
          )
        }


        if (
          password !==
          passwordConfirm
        ) {
          return (
            "Las contraseñas no coinciden"
          )
        }


        return ""
      }


    /* ========================================================
       CAMBIAR PASSWORD
       ======================================================== */

    const cambiarPassword =
      async (
        event
      ) => {

        event.preventDefault()


        setError("")


        const problema =
          validarFormulario()


        if (
          problema
        ) {
          setError(
            problema
          )

          return
        }


        setLoading(true)


        try {

          const correo =
            email
              .trim()
              .toLowerCase()


          const codigoFinal =
            codigo.trim()


          await completarRecuperacionPassword({
            email:
              correo,

            codigo:
              codigoFinal,

            password,

            passwordConfirm
          })


          /* ================================================
             REDIRECCION AL LOGIN
             ================================================ */

          const destino =
            obtenerDestino()


          const rutaLogin =
            destino
              ? `/login?redirect=${encodeURIComponent(
                  destino
                )}`
              : "/login"


          /*
           * Volvemos al Login.
           *
           * Aquí recién el usuario podrá
           * iniciar sesión con su nueva
           * contraseña.
           */
          navigate(
            rutaLogin,
            {
              replace: true,

              state: {
                email:
                  correo,

                passwordResetSuccess:
                  true
              }
            }
          )

        } catch (
          problem
        ) {

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
       SOLO NUMEROS EN CODIGO
       ======================================================== */

    const cambiarCodigo =
      (
        event
      ) => {

        const valor =
          String(
            event.target.value ||
            ""
          )


        /*
         * Eliminamos cualquier carácter
         * que no sea número.
         */
        const soloNumeros =
          valor.replace(
            /\D/g,
            ""
          )


        /*
         * Máximo 6 dígitos.
         */
        setCodigo(
          soloNumeros.slice(
            0,
            6
          )
        )
      }


    /* ========================================================
       URL RECUPERAR
       ======================================================== */

    const obtenerUrlRecuperacion =
      () => {

        const destino =
          obtenerDestino()


        if (
          !destino
        ) {
          return (
            "/recuperar-password"
          )
        }


        return (
          `/recuperar-password?redirect=${encodeURIComponent(
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
              Crea una nueva contraseña
            </h2>

            <p>
              Ingresa el código temporal autorizado
              por el administrador y establece una
              nueva contraseña para recuperar el
              acceso a tu cuenta.
            </p>

          </div>


          <div className="auth-stats">

            <div>

              <strong>
                6
              </strong>

              <span>
                Dígitos
              </span>

            </div>


            <div>

              <strong>
                15
              </strong>

              <span>
                Minutos
              </span>

            </div>


            <div>

              <strong>
                1
              </strong>

              <span>
                Uso
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
              cambiarPassword
            }
          >

            <h1>
              Nueva contraseña
            </h1>


            <p>
              Usa el código que te entregó
              el administrador.
            </p>


            {/* ================================================
                AVISO
                ================================================ */}

            <div
              className="login-invitation-notice"
            >

              <div
                className="login-invitation-icon"
              >
                #
              </div>


              <div>

                <strong>
                  Código temporal
                </strong>

                <p>
                  El código tiene 6 dígitos,
                  vence después de 15 minutos
                  y solo puede utilizarse una vez.
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
                EMAIL
                ================================================ */}

            <div className="field">

              <label
                htmlFor="reset-email"
              >
                Correo electrónico
              </label>


              <input
                id="reset-email"
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
                disabled={
                  loading
                }
              />

            </div>


            {/* ================================================
                CODIGO
                ================================================ */}

            <div className="field">

              <label
                htmlFor="reset-code"
              >
                Código de recuperación
              </label>


              <input
                id="reset-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={
                  codigo
                }
                onChange={
                  cambiarCodigo
                }
                placeholder="000000"
                autoComplete="one-time-code"
                maxLength={
                  6
                }
                required
                disabled={
                  loading
                }
              />

            </div>


            {/* ================================================
                NUEVA PASSWORD
                ================================================ */}

            <div className="field">

              <label
                htmlFor="new-password"
              >
                Nueva contraseña
              </label>


              <div
                style={{
                  position:
                    "relative"
                }}
              >

                <input
                  id="new-password"
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
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
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  minLength={
                    8
                  }
                  maxLength={
                    128
                  }
                  required
                  disabled={
                    loading
                  }
                />


                <button
                  type="button"
                  onClick={
                    () =>
                      setMostrarPassword(
                        (
                          valor
                        ) =>
                          !valor
                      )
                  }
                  disabled={
                    loading
                  }
                  aria-label={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  style={{
                    position:
                      "absolute",

                    right:
                      "10px",

                    top:
                      "50%",

                    transform:
                      "translateY(-50%)",

                    border:
                      "none",

                    background:
                      "transparent",

                    cursor:
                      "pointer"
                  }}
                >
                  {mostrarPassword
                    ? "Ocultar"
                    : "Ver"}
                </button>

              </div>

            </div>


            {/* ================================================
                CONFIRMAR PASSWORD
                ================================================ */}

            <div className="field">

              <label
                htmlFor="confirm-password"
              >
                Confirmar contraseña
              </label>


              <div
                style={{
                  position:
                    "relative"
                }}
              >

                <input
                  id="confirm-password"
                  type={
                    mostrarConfirmacion
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordConfirm
                  }
                  onChange={(
                    event
                  ) =>
                    setPasswordConfirm(
                      event.target.value
                    )
                  }
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  minLength={
                    8
                  }
                  maxLength={
                    128
                  }
                  required
                  disabled={
                    loading
                  }
                />


                <button
                  type="button"
                  onClick={
                    () =>
                      setMostrarConfirmacion(
                        (
                          valor
                        ) =>
                          !valor
                      )
                  }
                  disabled={
                    loading
                  }
                  aria-label={
                    mostrarConfirmacion
                      ? "Ocultar confirmación"
                      : "Mostrar confirmación"
                  }
                  style={{
                    position:
                      "absolute",

                    right:
                      "10px",

                    top:
                      "50%",

                    transform:
                      "translateY(-50%)",

                    border:
                      "none",

                    background:
                      "transparent",

                    cursor:
                      "pointer"
                  }}
                >
                  {mostrarConfirmacion
                    ? "Ocultar"
                    : "Ver"}
                </button>

              </div>

            </div>


            {/* ================================================
                AYUDA
                ================================================ */}

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
                  Tu contraseña es privada
                </strong>

                <p>
                  El administrador no conoce
                  ni selecciona tu nueva contraseña.
                  Solo autoriza el proceso y te
                  entrega el código temporal.
                </p>

              </div>

            </div>


            {/* ================================================
                CAMBIAR
                ================================================ */}

            <button
              type="submit"
              className="btn btn-block"
              disabled={
                loading
              }
            >

              {loading
                ? "Actualizando contraseña..."
                : "Cambiar contraseña"}

            </button>


            {/* ================================================
                VOLVER A SOLICITAR
                ================================================ */}

            <div className="auth-footer">

              ¿No tienes un código válido?


              <Link
                to={
                  obtenerUrlRecuperacion()
                }
                state={{
                  email:
                    email
                      .trim()
                      .toLowerCase(),

                  redirect:
                    obtenerDestino() ||
                    null
                }}
              >

                <button
                  type="button"
                  disabled={
                    loading
                  }
                >
                  Solicitar recuperación
                </button>

              </Link>

            </div>


            {/* ================================================
                LOGIN
                ================================================ */}

            <div className="auth-footer">

              ¿Recordaste tu contraseña?


              <Link
                to="/login"
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


export default RestablecerPassword