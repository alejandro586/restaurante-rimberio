import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response &&
      error.response.status === 401
    ) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("perfil")

      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

/**
 * Obtiene un mensaje de error legible
 * proveniente del backend.
 */
export const getMessage = (error) => {
  if (
    error.response &&
    error.response.data &&
    error.response.data.error
  ) {
    return error.response.data.error
  }

  return "No se pudo conectar con el servidor"
}

/**
 * Guarda la sesion en el navegador.
 */
export const saveSession = (
  token,
  user,
  perfil
) => {
  localStorage.setItem(
    "token",
    token
  )

  localStorage.setItem(
    "user",
    JSON.stringify(user || {})
  )

  localStorage.setItem(
    "perfil",
    JSON.stringify(perfil || {})
  )
}

/**
 * Devuelve el perfil guardado.
 *
 * Este perfil solamente controla
 * lo que se muestra visualmente.
 *
 * El backend vuelve a comprobar
 * los permisos en cada endpoint.
 */
export const getPerfil = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem("perfil")
      ) || {}
    )
  } catch (error) {
    return {}
  }
}

/**
 * Rol general del usuario.
 */
export const getRol = () => {
  return getPerfil().role || ""
}

/**
 * Roles generales del ERP.
 */
export const esAdmin = () =>
  getRol() === "admin"

export const esSupervisor = () =>
  getRol() === "supervisor"

export const esTrabajador = () =>
  getRol() === "trabajador"

export const esInvitado = () =>
  getRol() === "invitado"

/**
 * Indica si el usuario puede
 * crear nuevos proyectos.
 */
export const puedeCrearProyecto = () => {
  return [
    "admin",
    "supervisor"
  ].includes(getRol())
}

/**
 * Indica si el usuario puede
 * colaborar activamente.
 *
 * Invitado sera principalmente
 * de solo lectura.
 */
export const puedeColaborar = () => {
  return [
    "admin",
    "supervisor",
    "trabajador"
  ].includes(getRol())
}

/**
 * Nombre de la empresa.
 */
export const getEmpresa = () => {
  return (
    getPerfil().empresa ||
    "Mi empresa"
  )
}

/**
 * Ruta inicial dependiendo
 * del rol del usuario.
 */
export const inicioSegunRol = () => {
  const rol = getRol()

  if (rol === "admin") {
    return "/archivos"
  }

  if (rol === "supervisor") {
    return "/proyectos"
  }

  if (rol === "trabajador") {
    return "/importar"
  }

  if (rol === "invitado") {
    return "/proyectos"
  }

  return "/proyectos"
}

/**
 * Datos de Supabase Auth.
 */
export const getUser = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem("user")
      ) || {}
    )
  } catch (error) {
    return {}
  }
}

/**
 * Nombre visible del usuario.
 */
export const getUserName = () => {
  const perfil = getPerfil()

  if (perfil.full_name) {
    return perfil.full_name
  }

  const user = getUser()

  const meta =
    user.user_metadata || {}

  if (meta.full_name) {
    return meta.full_name
  }

  if (user.email) {
    return user.email.split("@")[0]
  }

  return "Usuario"
}

/**
 * Iniciales para el avatar.
 */
export const getInitials = () => {
  const parts = getUserName()
    .trim()
    .split(" ")
    .filter(Boolean)

  if (parts.length === 0) {
    return "U"
  }

  if (parts.length === 1) {
    return parts[0].charAt(0)
  }

  return (
    parts[0].charAt(0) +
    parts[1].charAt(0)
  )
}

/**
 * Comprueba si existe una sesion.
 */
export const isLogged = () => {
  return Boolean(
    localStorage.getItem("token")
  )
}

/**
 * Cierra la sesion local.
 */
export const clearSession = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem("perfil")
}

/**
 * Formatea importes en soles.
 */
export const soles = (valor) =>
  `S/ ${Number(valor || 0).toLocaleString(
    "es-PE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`

/**
 * Formatea numeros grandes.
 */
export const miles = (valor) =>
  Number(valor || 0).toLocaleString(
    "es-PE"
  )

export default api