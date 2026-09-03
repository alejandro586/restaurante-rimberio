import {
  useEffect,
  useRef,
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


const LENGTH = 8


/* ==========================================================
   REDIRECCION SEGURA
   ========================================================== */

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
   REGISTER
   ========================================================== */

const Register = () => {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const boxes =
    useRef([])


  /* ========================================================
     ESTADOS
     ======================================================== */

  const [
    step,
    setStep
  ] = useState("form")

  const [
    fullName,
    setFullName
  ] = useState("")

  const [
    email,
    setEmail
  ] = useState("")

  const [
    password,
    setPassword
  ] = useState("")

  const [
    repeat,
    setRepeat
  ] = useState("")

  const [
    code,
    setCode
  ] = useState(
    Array(LENGTH).fill("")
  )

  const [
    error,
    setError
  ] = useState("")

  const [
    notice,
    setNotice
  ] = useState("")

  const [
    loading,
    setLoading
  ] = useState(false)

  const [
    wait,
    setWait
  ] = useState(0)

  /**
   * Si venimos de una invitacion,
   * aqui guardamos el correo al
   * que fue enviada.
   */
  const [
    invitationEmail,
    setInvitationEmail
  ] = useState("")


  /* ========================================================
     DESTINO DESPUES DEL REGISTRO
     ======================================================== */

  const obtenerDestino =
    () => {
      /**
       * Primera opcion:
       *
       * /registro?redirect=...
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
       * Segunda opcion:
       *
       * Login.jsx puede enviar el
       * destino mediante state.
       */
      const desdeState =
        redireccionSegura(
          location.state
            ?.redirect
        )

      if (desdeState) {
        return desdeState
      }


      /**
       * Tercera opcion:
       *
       * AceptarInvitacion.jsx lo
       * guarda en sessionStorage.
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


      return ""
    }


  /* ========================================================
     GUARDAR DESTINO
     ======================================================== */

  const conservarDestino =
    () => {
      const destino =
        obtenerDestino()

      if (destino) {
        sessionStorage.setItem(
          "rimberio_after_auth",
          destino
        )
      }

      return destino
    }


  /* ========================================================
     DESPUES DE AUTENTICAR
     ======================================================== */

  const continuarDespuesDeAuth =
    () => {
      const destino =
        obtenerDestino()

      if (destino) {
        /**
         * NO eliminamos todavía
         * rimberio_after_auth.
         *
         * AceptarInvitacion.jsx lo
         * eliminará solamente cuando
         * la invitacion se acepte.
         */
        navigate(
          destino,
          {
            replace: true
          }
        )

        return
      }

      navigate(
        inicioSegunRol(),
        {
          replace: true
        }
      )
    }


  /* ========================================================
     SI LOGIN ENVIA CUENTA NO VERIFICADA
     ======================================================== */

  useEffect(() => {
    if (
      location.state &&
      location.state.step ===
        "verify"
    ) {
      setEmail(
        location.state.email ||
          ""
      )

      setStep("verify")

      setNotice(
        "Tu cuenta no está verificada. Ingresa el código o solicita uno nuevo."
      )

      if (
        location.state.redirect
      ) {
        const destino =
          redireccionSegura(
            location.state
              .redirect
          )

        if (destino) {
          sessionStorage.setItem(
            "rimberio_after_auth",
            destino
          )
        }
      }
    }
  }, [
    location.state
  ])


  /* ========================================================
     DETECTAR INVITACION Y PRECARGAR CORREO
     ======================================================== */

  useEffect(() => {
    const destino =
      obtenerDestino()

    if (!destino) {
      return
    }

    sessionStorage.setItem(
      "rimberio_after_auth",
      destino
    )

    let url

    try {
      url =
        new URL(
          destino,
          window.location.origin
        )
    } catch {
      return
    }

    /**
     * Solo hacemos esto cuando
     * realmente se trata de una
     * invitacion.
     */
    if (
      url.pathname !==
      "/invitaciones/aceptar"
    ) {
      return
    }

    const token =
      url.searchParams.get(
        "token"
      )

    if (
      !token ||
      token.length < 20
    ) {
      return
    }

    let cancelado =
      false

    const cargarCorreo =
      async () => {
        try {
          const respuesta =
            await api.get(
              `/invitations/${encodeURIComponent(
                token
              )}`
            )

          if (cancelado) {
            return
          }

          const correo =
            respuesta.data
              ?.invitacion
              ?.email

          if (correo) {
            const normalizado =
              String(
                correo
              )
                .trim()
                .toLowerCase()

            setInvitationEmail(
              normalizado
            )

            setEmail(
              normalizado
            )
          }

        } catch {
          /**
           * No bloqueamos el formulario.
           *
           * La propia pantalla de
           * invitaciones mostrará el
           * error correspondiente.
           */
        }
      }

    cargarCorreo()

    return () => {
      cancelado = true
    }

  }, [
    location.search,
    location.state
  ])


  /* ========================================================
     CONTADOR REENVIO
     ======================================================== */

  useEffect(() => {
    if (
      wait <= 0
    ) {
      return undefined
    }

    const timer =
      setTimeout(
        () =>
          setWait(
            wait - 1
          ),
        1000
      )

    return () =>
      clearTimeout(
        timer
      )

  }, [wait])


  /* ========================================================
     REGISTRAR
     ======================================================== */

  const register =
    async (
      event
    ) => {
      event.preventDefault()

      setError("")
      setNotice("")

      const nombreLimpio =
        fullName.trim()

      const correoLimpio =
        email
          .trim()
          .toLowerCase()


      if (
        nombreLimpio.length < 2
      ) {
        setError(
          "Ingresa tu nombre completo."
        )

        return
      }


      if (
        password !==
        repeat
      ) {
        setError(
          "Las contraseñas no coinciden."
        )

        return
      }


      if (
        password.length < 8
      ) {
        setError(
          "La contraseña debe tener al menos 8 caracteres."
        )

        return
      }


      /**
       * Si el usuario llegó desde
       * una invitación, el registro
       * debe utilizar ese mismo correo.
       */
      if (
        invitationEmail &&
        correoLimpio !==
          invitationEmail
      ) {
        setError(
          `Esta invitación pertenece a ${invitationEmail}.`
        )

        return
      }


      conservarDestino()

      setLoading(true)

      try {
        const {
          data
        } =
          await api.post(
            "/auth/register",
            {
              email:
                correoLimpio,

              password,

              fullName:
                nombreLimpio
            }
          )


        /* ================================================
           VERIFICACION NO NECESARIA
           ================================================ */

        if (
          data.verified
        ) {
          saveSession(
            data.token,
            data.user,
            data.perfil
          )

          continuarDespuesDeAuth()

          return
        }


        /* ================================================
           NECESITA OTP
           ================================================ */

        setEmail(
          correoLimpio
        )

        setStep(
          "verify"
        )

        setNotice(
          "Revisa tu correo e ingresa el código de 8 dígitos."
        )

        setWait(60)

      } catch (problem) {
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
     VERIFICAR OTP
     ======================================================== */

  const verify =
    async (
      event
    ) => {
      event.preventDefault()

      setError("")

      const token =
        code.join("")


      if (
        token.length !==
        LENGTH
      ) {
        setError(
          `Ingresa los ${LENGTH} dígitos del código.`
        )

        return
      }


      conservarDestino()

      setLoading(true)

      try {
        const {
          data
        } =
          await api.post(
            "/auth/verify",
            {
              email:
                email
                  .trim()
                  .toLowerCase(),

              token
            }
          )


        saveSession(
          data.token,
          data.user,
          data.perfil
        )


        /* ================================================
           SI VENIA DE INVITACION:
           → vuelve a la invitacion

           SI ERA REGISTRO NORMAL:
           → inicio segun rol
           ================================================ */

        continuarDespuesDeAuth()

      } catch (problem) {
        setCode(
          Array(
            LENGTH
          ).fill("")
        )

        if (
          boxes.current[0]
        ) {
          boxes.current[0]
            .focus()
        }

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
     REENVIAR CODIGO
     ======================================================== */

  const resend =
    async () => {
      setError("")
      setNotice("")
      setLoading(true)

      try {
        await api.post(
          "/auth/resend",
          {
            email:
              email
                .trim()
                .toLowerCase()
          }
        )

        setNotice(
          "Código reenviado. Revisa tu bandeja de entrada y la carpeta de spam."
        )

        setWait(60)

      } catch (problem) {
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
     OTP INPUT
     ======================================================== */

  const change = (
    index,
    value
  ) => {
    const digit =
      value
        .replace(
          /[^0-9]/g,
          ""
        )
        .slice(-1)

    const next = [
      ...code
    ]

    next[index] =
      digit

    setCode(next)

    if (
      digit &&
      index <
        LENGTH - 1
    ) {
      boxes
        .current[
          index + 1
        ]
        ?.focus()
    }
  }


  const back = (
    index,
    key
  ) => {
    if (
      key ===
        "Backspace" &&
      !code[index] &&
      index > 0
    ) {
      boxes
        .current[
          index - 1
        ]
        ?.focus()
    }
  }


  const paste = (
    event
  ) => {
    event.preventDefault()

    const text =
      event.clipboardData
        .getData("text")
        .replace(
          /[^0-9]/g,
          ""
        )
        .slice(
          0,
          LENGTH
        )

    const next =
      Array(
        LENGTH
      ).fill("")

    text
      .split("")
      .forEach(
        (
          digit,
          index
        ) => {
          next[index] =
            digit
        }
      )

    setCode(next)

    const ultimo =
      Math.min(
        Math.max(
          text.length - 1,
          0
        ),
        LENGTH - 1
      )

    boxes
      .current[
        ultimo
      ]
      ?.focus()
  }


  /* ========================================================
     LOGIN CON REDIRECT
     ======================================================== */

  const urlLogin =
    () => {
      const destino =
        obtenerDestino()

      if (!destino) {
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
          PANEL IZQUIERDO
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
            Crea tu cuenta y empieza
            a trabajar con tu equipo
          </h2>

          <p>
            Organiza proyectos,
            administra actividades,
            procesa información del
            restaurante y colabora
            con otros usuarios desde
            RIMBERIO.
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
          PANEL DERECHO
          ==================================================== */}

      <section className="auth-panel">


        {/* ==================================================
            FORMULARIO REGISTRO
            ================================================== */}

        {step ===
        "form" ? (

          <form
            className="auth-form"
            onSubmit={
              register
            }
          >

            <h1>
              Crear cuenta
            </h1>

            <p>
              Completa tus datos
              para registrarte
            </p>


            {/* ==============================================
                AVISO INVITACION
                ============================================== */}

            {obtenerDestino() && (
              <div className="alert alert-info">

                <strong>
                  Tienes una invitación pendiente.
                </strong>

                <div
                  style={{
                    marginTop:
                      "4px"
                  }}
                >
                  Después de crear y
                  verificar tu cuenta
                  volverás automáticamente
                  a la invitación.
                </div>

              </div>
            )}


            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}


            {/* ==============================================
                NOMBRE
                ============================================== */}

            <div className="field">

              <label htmlFor="fullName">
                Nombre completo
              </label>

              <input
                id="fullName"
                type="text"
                value={
                  fullName
                }
                onChange={(
                  event
                ) =>
                  setFullName(
                    event.target
                      .value
                  )
                }
                placeholder="Juan Pérez"
                autoComplete="name"
                required
              />

            </div>


            {/* ==============================================
                CORREO
                ============================================== */}

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
                    event.target
                      .value
                  )
                }
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                readOnly={
                  Boolean(
                    invitationEmail
                  )
                }
                required
              />


              {invitationEmail && (
                <small
                  style={{
                    display:
                      "block",

                    marginTop:
                      "6px",

                    color:
                      "var(--muted)"
                  }}
                >
                  La invitación fue
                  enviada a este correo,
                  por lo que debe utilizarse
                  para crear la cuenta.
                </small>
              )}

            </div>


            {/* ==============================================
                CONTRASEÑA
                ============================================== */}

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
                    event.target
                      .value
                  )
                }
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                autoComplete="new-password"
                required
              />

            </div>


            <div className="field">

              <label htmlFor="repeat">
                Repetir contraseña
              </label>

              <input
                id="repeat"
                type="password"
                value={
                  repeat
                }
                onChange={(
                  event
                ) =>
                  setRepeat(
                    event.target
                      .value
                  )
                }
                minLength={8}
                autoComplete="new-password"
                required
              />

            </div>


            {/* ==============================================
                CREAR
                ============================================== */}

            <button
              type="submit"
              className="btn btn-block"
              disabled={
                loading
              }
            >
              {loading
                ? "Creando cuenta..."
                : "Crear cuenta"}
            </button>


            {/* ==============================================
                LOGIN
                ============================================== */}

            <div className="auth-footer">

              ¿Ya tienes cuenta?

              <Link
                to={
                  urlLogin()
                }
              >
                <button
                  type="button"
                >
                  Ingresa
                </button>
              </Link>

            </div>

          </form>

        ) : (


          /* ==================================================
             VERIFICACION
             ================================================== */

          <form
            className="auth-form"
            onSubmit={
              verify
            }
          >

            <h1>
              Verificar cuenta
            </h1>

            <p>
              Enviamos un código de{" "}
              {LENGTH} dígitos a{" "}

              <strong>
                {email}
              </strong>
            </p>


            {obtenerDestino() && (
              <div className="alert alert-info">
                Al verificar tu cuenta
                regresarás automáticamente
                a la invitación del proyecto.
              </div>
            )}


            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}


            {!error &&
              notice && (
              <div className="alert alert-info">
                {notice}
              </div>
            )}


            {/* ==============================================
                OTP
                ============================================== */}

            <div className="otp">

              {code.map(
                (
                  digit,
                  index
                ) => (

                  <input
                    key={
                      index
                    }
                    ref={(
                      element
                    ) => {
                      boxes.current[
                        index
                      ] =
                        element
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={
                      index === 0
                        ? "one-time-code"
                        : "off"
                    }
                    maxLength={1}
                    value={
                      digit
                    }
                    onChange={(
                      event
                    ) =>
                      change(
                        index,
                        event.target
                          .value
                      )
                    }
                    onKeyDown={(
                      event
                    ) =>
                      back(
                        index,
                        event.key
                      )
                    }
                    onPaste={
                      paste
                    }
                  />

                )
              )}

            </div>


            {/* ==============================================
                VERIFICAR
                ============================================== */}

            <button
              type="submit"
              className="btn btn-block"
              disabled={
                loading
              }
            >
              {loading
                ? "Verificando..."
                : "Verificar"}
            </button>


            {/* ==============================================
                REENVIAR
                ============================================== */}

            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{
                marginTop:
                  "10px"
              }}
              onClick={
                resend
              }
              disabled={
                loading ||
                wait > 0
              }
            >
              {wait > 0
                ? `Reenviar código (${wait}s)`
                : "Reenviar código"}
            </button>


            <div className="auth-footer">

              <button
                type="button"
                onClick={() => {
                  setError("")
                  setNotice("")
                  setCode(
                    Array(
                      LENGTH
                    ).fill("")
                  )
                  setStep(
                    "form"
                  )
                }}
              >
                Volver al registro
              </button>

            </div>

          </form>
        )}

      </section>

    </div>
  )
}


export default Register