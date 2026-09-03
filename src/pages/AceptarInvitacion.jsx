import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useNavigate,
  useSearchParams
} from "react-router-dom"

import api, {
  clearSession,
  getMessage,
  getUser,
  isLogged
} from "../api"


/* ==========================================================
   CONFIGURACION
   ========================================================== */

const ROLES = {
  manager: {
    nombre: "Responsable",
    descripcion:
      "Puede administrar actividades e invitaciones del proyecto."
  },

  developer: {
    nombre: "Desarrollador",
    descripcion:
      "Puede colaborar y trabajar sobre las actividades asignadas."
  },

  member: {
    nombre: "Miembro",
    descripcion:
      "Puede colaborar y recibir actividades dentro del proyecto."
  },

  viewer: {
    nombre: "Solo lectura",
    descripcion:
      "Puede consultar el proyecto, pero no modificarlo."
  }
}


const ESTADOS = {
  pendiente: {
    texto: "Invitación pendiente",
    clase:
      "invitation-public-status-pending"
  },

  aceptada: {
    texto: "Invitación aceptada",
    clase:
      "invitation-public-status-accepted"
  },

  rechazada: {
    texto: "Invitación rechazada",
    clase:
      "invitation-public-status-rejected"
  },

  revocada: {
    texto: "Invitación revocada",
    clase:
      "invitation-public-status-revoked"
  },

  expirada: {
    texto: "Invitación expirada",
    clase:
      "invitation-public-status-expired"
  }
}


/* ==========================================================
   COMPONENTE
   ========================================================== */

const AceptarInvitacion = () => {
  const navigate =
    useNavigate()

  const [
    searchParams
  ] = useSearchParams()

  const token =
    searchParams.get(
      "token"
    ) || ""

  const usuario =
    getUser()

  const autenticado =
    isLogged()


  /* ========================================================
     ESTADOS
     ======================================================== */

  const [
    datos,
    setDatos
  ] = useState(null)

  const [
    cargando,
    setCargando
  ] = useState(true)

  const [
    error,
    setError
  ] = useState("")

  const [
    procesando,
    setProcesando
  ] = useState(false)

  const [
    aceptada,
    setAceptada
  ] = useState(false)

  const [
    rechazada,
    setRechazada
  ] = useState(false)


  /* ========================================================
     CARGAR INVITACION
     ======================================================== */

  const cargarInvitacion =
    async () => {
      if (
        !token ||
        token.length < 20
      ) {
        setError(
          "El enlace de invitación no es válido."
        )

        setCargando(false)

        return
      }

      setCargando(true)
      setError("")

      try {
        const respuesta =
          await api.get(
            `/invitations/${encodeURIComponent(
              token
            )}`
          )

        setDatos(
          respuesta.data
        )

      } catch (problema) {
        setError(
          getMessage(
            problema
          )
        )
      } finally {
        setCargando(false)
      }
    }


  useEffect(() => {
    cargarInvitacion()
  }, [token])


  /* ========================================================
     INFORMACION CALCULADA
     ======================================================== */

  const invitacion =
    datos?.invitacion ||
    null

  const proyecto =
    datos?.proyecto ||
    null

  const invitador =
    datos?.invitador ||
    null


  const rol =
    useMemo(() => {
      if (
        !invitacion
      ) {
        return null
      }

      return (
        ROLES[
          invitacion.role
        ] || {
          nombre:
            invitacion.role,
          descripcion:
            "Rol asignado al proyecto."
        }
      )
    }, [invitacion])


  const estado =
    useMemo(() => {
      if (
        aceptada
      ) {
        return ESTADOS.aceptada
      }

      if (
        rechazada
      ) {
        return ESTADOS.rechazada
      }

      if (
        !invitacion
      ) {
        return null
      }

      return (
        ESTADOS[
          invitacion.estado
        ] ||
        ESTADOS.pendiente
      )
    }, [
      invitacion,
      aceptada,
      rechazada
    ])


  const correoUsuario =
    String(
      usuario?.email ||
      ""
    )
      .trim()
      .toLowerCase()


  const correoInvitacion =
    String(
      invitacion?.email ||
      ""
    )
      .trim()
      .toLowerCase()


  const correoCorrecto =
    autenticado &&
    correoUsuario &&
    correoInvitacion &&
    correoUsuario ===
      correoInvitacion


  const puedeResponder =
    invitacion?.estado ===
      "pendiente" &&
    !aceptada &&
    !rechazada


  /* ========================================================
     FECHAS
     ======================================================== */

  const fechaCompleta = (
    valor
  ) => {
    if (!valor) {
      return "Sin fecha"
    }

    const fecha =
      new Date(valor)

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return "Sin fecha"
    }

    return fecha
      .toLocaleDateString(
        "es-PE",
        {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }
      )
  }


  /* ========================================================
     GUARDAR DESTINO DESPUES DEL LOGIN
     ======================================================== */

  const guardarDestino =
    () => {
      const destino =
        `/invitaciones/aceptar?token=${encodeURIComponent(
          token
        )}`

      sessionStorage.setItem(
        "rimberio_after_auth",
        destino
      )

      sessionStorage.setItem(
        "rimberio_invitation_token",
        token
      )

      return destino
    }


  /* ========================================================
     LOGIN
     ======================================================== */

  const irLogin =
    () => {
      const destino =
        guardarDestino()

      navigate(
        `/login?redirect=${encodeURIComponent(
          destino
        )}`
      )
    }


  /* ========================================================
     REGISTRO
     ======================================================== */

  const irRegistro =
    () => {
      const destino =
        guardarDestino()

      navigate(
        `/registro?redirect=${encodeURIComponent(
          destino
        )}`
      )
    }


  /* ========================================================
     CAMBIAR DE CUENTA
     ======================================================== */

  const cambiarCuenta =
    () => {
      guardarDestino()

      clearSession()

      navigate(
        `/login?redirect=${encodeURIComponent(
          `/invitaciones/aceptar?token=${token}`
        )}`
      )
    }


  /* ========================================================
     ACEPTAR
     ======================================================== */

  const aceptarInvitacion =
    async () => {
      if (
        !autenticado
      ) {
        irLogin()
        return
      }

      if (
        !correoCorrecto
      ) {
        return
      }

      setProcesando(true)
      setError("")

      try {
        const respuesta =
          await api.post(
            `/invitations/${encodeURIComponent(
              token
            )}/accept`
          )

        setAceptada(true)

        sessionStorage.removeItem(
          "rimberio_after_auth"
        )

        sessionStorage.removeItem(
          "rimberio_invitation_token"
        )

        const projectId =
          respuesta.data
            ?.project_id

        /**
         * Esperamos un momento para que
         * el usuario vea la confirmación.
         */
        window.setTimeout(
          () => {
            if (
              projectId
            ) {
              navigate(
                `/proyectos/${projectId}`
              )
            } else {
              navigate(
                "/proyectos"
              )
            }
          },
          1200
        )

      } catch (problema) {
        setError(
          getMessage(
            problema
          )
        )
      } finally {
        setProcesando(false)
      }
    }


  /* ========================================================
     RECHAZAR
     ======================================================== */

  const rechazarInvitacion =
    async () => {
      if (
        !autenticado
      ) {
        irLogin()
        return
      }

      if (
        !correoCorrecto
      ) {
        return
      }

      const confirmar =
        window.confirm(
          "¿Seguro que deseas rechazar esta invitación?"
        )

      if (
        !confirmar
      ) {
        return
      }

      setProcesando(true)
      setError("")

      try {
        await api.post(
          `/invitations/${encodeURIComponent(
            token
          )}/reject`
        )

        setRechazada(true)

        sessionStorage.removeItem(
          "rimberio_after_auth"
        )

        sessionStorage.removeItem(
          "rimberio_invitation_token"
        )

      } catch (problema) {
        setError(
          getMessage(
            problema
          )
        )
      } finally {
        setProcesando(false)
      }
    }


  /* ========================================================
     CARGANDO
     ======================================================== */

  if (cargando) {
    return (
      <div className="invitation-public-page">

        <div className="invitation-public-card">

          <div className="invitation-public-brand">
            RIMBERIO
          </div>

          <div className="loading">
            Verificando invitación...
          </div>

        </div>

      </div>
    )
  }


  /* ========================================================
     ERROR DE CARGA
     ======================================================== */

  if (
    error &&
    !datos
  ) {
    return (
      <div className="invitation-public-page">

        <div className="invitation-public-card">

          <div className="invitation-public-brand">
            RIMBERIO
          </div>

          <div className="invitation-public-error-icon">
            !
          </div>

          <h1>
            No pudimos abrir la invitación
          </h1>

          <p className="invitation-public-description">
            {error}
          </p>

          <button
            type="button"
            className="btn"
            onClick={() =>
              navigate(
                "/login"
              )
            }
          >
            Ir a RIMBERIO
          </button>

        </div>

      </div>
    )
  }


  if (
    !invitacion ||
    !proyecto
  ) {
    return null
  }


  /* ========================================================
     PANTALLA PRINCIPAL
     ======================================================== */

  return (
    <div className="invitation-public-page">

      <div className="invitation-public-card">


        {/* ==================================================
            CABECERA
            ================================================== */}

        <div className="invitation-public-brand">
          RIMBERIO
        </div>

        <div className="invitation-public-subtitle">
          Gestión colaborativa para restaurantes
        </div>


        {/* ==================================================
            ESTADO
            ================================================== */}

        {estado && (
          <span
            className={`invitation-public-status ${estado.clase}`}
          >
            {estado.texto}
          </span>
        )}


        {/* ==================================================
            TITULO
            ================================================== */}

        <div className="invitation-public-heading">

          <div className="invitation-public-project-icon">
            {String(
              proyecto.nombre ||
              "P"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <span>
              Has sido invitado a
            </span>

            <h1>
              {proyecto.nombre}
            </h1>
          </div>

        </div>


        {/* ==================================================
            DESCRIPCION
            ================================================== */}

        {proyecto.descripcion && (
          <p className="invitation-public-description">
            {proyecto.descripcion}
          </p>
        )}


        {/* ==================================================
            DATOS
            ================================================== */}

        <div className="invitation-public-info">

          <div>
            <span>
              Invitación para
            </span>

            <strong>
              {invitacion.email}
            </strong>
          </div>


          <div>
            <span>
              Rol
            </span>

            <strong>
              {rol?.nombre}
            </strong>
          </div>


          <div>
            <span>
              Invitado por
            </span>

            <strong>
              {invitador?.full_name ||
                invitador?.email ||
                "Administrador"}
            </strong>
          </div>


          <div>
            <span>
              Vence
            </span>

            <strong>
              {fechaCompleta(
                invitacion.expires_at
              )}
            </strong>
          </div>

        </div>


        {/* ==================================================
            EXPLICACION DEL ROL
            ================================================== */}

        {rol && (
          <div className="invitation-public-role">

            <strong>
              {rol.nombre}
            </strong>

            <p>
              {rol.descripcion}
            </p>

          </div>
        )}


        {/* ==================================================
            ERRORES DE OPERACION
            ================================================== */}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}


        {/* ==================================================
            INVITACION YA ACEPTADA
            ================================================== */}

        {(
          aceptada ||
          invitacion.estado ===
            "aceptada"
        ) && (
          <div className="invitation-public-result">

            <div className="invitation-public-result-icon">
              ✓
            </div>

            <h2>
              Invitación aceptada
            </h2>

            <p>
              Ya formas parte de este
              proyecto.
            </p>

            <button
              type="button"
              className="btn"
              onClick={() =>
                navigate(
                  `/proyectos/${proyecto.id}`
                )
              }
            >
              Abrir proyecto
            </button>

          </div>
        )}


        {/* ==================================================
            INVITACION RECHAZADA
            ================================================== */}

        {(
          rechazada ||
          invitacion.estado ===
            "rechazada"
        ) && (
          <div className="invitation-public-result">

            <h2>
              Invitación rechazada
            </h2>

            <p>
              Has rechazado la invitación
              a este proyecto.
            </p>

            <button
              type="button"
              className="btn btn-light"
              onClick={() =>
                navigate(
                  "/proyectos"
                )
              }
            >
              Ir a proyectos
            </button>

          </div>
        )}


        {/* ==================================================
            REVOCADA
            ================================================== */}

        {invitacion.estado ===
          "revocada" && (
          <div className="invitation-public-result">

            <h2>
              Invitación revocada
            </h2>

            <p>
              El administrador canceló esta
              invitación y ya no puede
              utilizarse.
            </p>

          </div>
        )}


        {/* ==================================================
            EXPIRADA
            ================================================== */}

        {invitacion.estado ===
          "expirada" && (
          <div className="invitation-public-result">

            <h2>
              Invitación expirada
            </h2>

            <p>
              Esta invitación ya venció.
              Solicita al administrador una
              nueva invitación.
            </p>

          </div>
        )}


        {/* ==================================================
            SIN SESION
            ================================================== */}

        {puedeResponder &&
          !autenticado && (
          <div className="invitation-auth-box">

            <h2>
              Inicia sesión para continuar
            </h2>

            <p>
              Debes utilizar la cuenta
              asociada a:
            </p>

            <strong className="invitation-required-email">
              {invitacion.email}
            </strong>

            <div className="invitation-auth-actions">

              <button
                type="button"
                className="btn"
                onClick={
                  irLogin
                }
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                className="btn btn-light"
                onClick={
                  irRegistro
                }
              >
                Crear cuenta
              </button>

            </div>

          </div>
        )}


        {/* ==================================================
            CUENTA INCORRECTA
            ================================================== */}

        {puedeResponder &&
          autenticado &&
          !correoCorrecto && (
          <div className="invitation-account-warning">

            <div className="invitation-account-warning-icon">
              !
            </div>

            <div>
              <h2>
                Estás usando otra cuenta
              </h2>

              <p>
                Actualmente estás conectado como:
              </p>

              <strong>
                {usuario?.email}
              </strong>

              <p>
                Esta invitación pertenece a:
              </p>

              <strong>
                {invitacion.email}
              </strong>

              <button
                type="button"
                className="btn"
                onClick={
                  cambiarCuenta
                }
              >
                Cambiar de cuenta
              </button>

            </div>

          </div>
        )}


        {/* ==================================================
            ACEPTAR / RECHAZAR
            ================================================== */}

        {puedeResponder &&
          autenticado &&
          correoCorrecto && (
          <div className="invitation-public-actions">

            <button
              type="button"
              className="btn btn-light"
              disabled={
                procesando
              }
              onClick={
                rechazarInvitacion
              }
            >
              Rechazar
            </button>

            <button
              type="button"
              className="btn"
              disabled={
                procesando
              }
              onClick={
                aceptarInvitacion
              }
            >
              {procesando
                ? "Procesando..."
                : "Aceptar invitación"}
            </button>

          </div>
        )}


        {/* ==================================================
            SEGURIDAD
            ================================================== */}

        <div className="invitation-public-security">

          <strong>
            Invitación protegida
          </strong>

          <p>
            Solo la cuenta de correo a la que
            se envió esta invitación puede
            aceptarla.
          </p>

        </div>

      </div>

    </div>
  )
}


export default AceptarInvitacion