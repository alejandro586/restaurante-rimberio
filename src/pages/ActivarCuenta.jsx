import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { completarActivacionCuenta, clearSession, getMessage } from "../api"

const ActivarCuenta = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = String(searchParams.get("token") || "").trim()

  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const [error, setError] = useState(
    token ? "" : "El enlace de activación no es válido"
  )
  const [loading, setLoading] = useState(false)

  const validarFormulario = () => {
    if (!password) {
      return "Ingresa tu nueva contraseña"
    }

    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres"
    }

    if (password.length > 128) {
      return "La contraseña es demasiado larga"
    }

    if (!passwordConfirm) {
      return "Confirma tu contraseña"
    }

    if (password !== passwordConfirm) {
      return "Las contraseñas no coinciden"
    }

    return ""
  }

  const activarCuenta = async (event) => {
    event.preventDefault()

    setError("")

    if (!token) {
      setError("El enlace de activación no es válido")
      return
    }

    const problema = validarFormulario()

    if (problema) {
      setError(problema)
      return
    }

    setLoading(true)

    try {
      await completarActivacionCuenta({ token, password, passwordConfirm })

      clearSession()

      navigate("/login", {
        replace: true,
        state: { activationSuccess: true }
      })
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="auth-brand">
          <img src="/icono.png" alt="RIMBERIO" className="brand-logo" />
          <span>RIMBERIO</span>
        </div>

        <div>
          <h2>Activa tu cuenta</h2>
          <p>
            Un administrador creó tu cuenta en RIMBERIO. Elige tu
            contraseña para empezar a usarla.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={activarCuenta}>
          <h1>Crea tu contraseña</h1>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label htmlFor="activation-password">Nueva contraseña</label>

            <div style={{ position: "relative" }}>
              <input
                id="activation-password"
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setMostrarPassword((valor) => !valor)}
                disabled={loading}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer"
                }}
              >
                {mostrarPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="activation-password-confirm">Confirmar contraseña</label>

            <div style={{ position: "relative" }}>
              <input
                id="activation-password-confirm"
                type={mostrarConfirmacion ? "text" : "password"}
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmacion((valor) => !valor)}
                disabled={loading}
                aria-label={mostrarConfirmacion ? "Ocultar confirmación" : "Mostrar confirmación"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer"
                }}
              >
                {mostrarConfirmacion ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-block" disabled={loading}>
            {loading ? "Activando cuenta..." : "Activar cuenta"}
          </button>

          <div className="auth-footer">
            ¿Ya activaste tu cuenta?
            <Link to="/login">
              <button type="button" disabled={loading}>
                Ir al login
              </button>
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ActivarCuenta