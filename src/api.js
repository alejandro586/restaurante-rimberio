import axios from "axios"


/* ==========================================================
   CLIENTE API
   ========================================================== */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})


/* ==========================================================
   TOKEN
   ========================================================== */

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token")

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`
  }

  return config
})


/* ==========================================================
   RESPUESTAS / SESION EXPIRADA
   ========================================================== */

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

      window.location.href =
        "/login"
    }

    return Promise.reject(error)
  }
)


/* ==========================================================
   ERRORES
   ========================================================== */

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


/* ==========================================================
   SESION
   ========================================================== */

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
    JSON.stringify(
      user || {}
    )
  )

  localStorage.setItem(
    "perfil",
    JSON.stringify(
      perfil || {}
    )
  )
}


/*
 * El perfil guardado solo decide
 * que se dibuja en el frontend.
 *
 * El backend vuelve a verificar
 * el rol contra la base de datos.
 */
export const getPerfil = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem(
          "perfil"
        )
      ) || {}
    )
  } catch (error) {
    return {}
  }
}


export const getRol = () =>
  getPerfil().role || ""


export const esAdmin = () =>
  getRol() === "admin"


export const esTrabajador = () =>
  getRol() === "trabajador"


export const getEmpresa = () =>
  getPerfil().empresa ||
  "Mi empresa"


export const inicioSegunRol = () =>
  esAdmin()
    ? "/archivos"
    : "/importar"


export const getUser = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem(
          "user"
        )
      ) || {}
    )
  } catch (error) {
    return {}
  }
}


export const getUserName = () => {
  const perfil =
    getPerfil()

  if (perfil.full_name) {
    return perfil.full_name
  }


  const user =
    getUser()

  const meta =
    user.user_metadata || {}


  if (meta.full_name) {
    return meta.full_name
  }


  if (user.email) {
    return user.email
      .split("@")[0]
  }


  return "Usuario"
}


export const getInitials = () => {
  const parts =
    getUserName()
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


export const isLogged = () =>
  Boolean(
    localStorage.getItem(
      "token"
    )
  )


export const clearSession = () => {
  localStorage.removeItem(
    "token"
  )

  localStorage.removeItem(
    "user"
  )

  localStorage.removeItem(
    "perfil"
  )
}


/* ==========================================================
   CURSOS DEL USUARIO
   ========================================================== */

export const listarCursos =
  async () => {

    const response =
      await api.get(
        "/courses"
      )

    return response.data
  }


export const obtenerMisPermisos =
  async () => {

    const response =
      await api.get(
        "/courses/me"
      )

    return response.data
  }


export const obtenerCurso =
  async (curso) => {

    const valor =
      encodeURIComponent(
        String(curso)
      )

    const response =
      await api.get(
        `/courses/${valor}`
      )

    return response.data
  }


export const obtenerModulosCurso =
  async (curso) => {

    const valor =
      encodeURIComponent(
        String(curso)
      )

    const response =
      await api.get(
        `/courses/${valor}/modules`
      )

    return response.data
  }


/* ==========================================================
   ADMINISTRACION - USUARIOS
   ========================================================== */

/*
 * GET /api/admin/users
 */
export const listarUsuarios =
  async () => {

    const response =
      await api.get(
        "/admin/users"
      )

    return response.data
  }


/*
 * GET /api/admin/users/:userId
 */
export const obtenerUsuario =
  async (userId) => {

    const id =
      encodeURIComponent(
        String(userId)
      )

    const response =
      await api.get(
        `/admin/users/${id}`
      )

    return response.data
  }


/* ==========================================================
   ADMINISTRACION - CATALOGO
   ========================================================== */

/*
 * GET /api/admin/users/catalog
 */
export const obtenerCatalogoCursos =
  async () => {

    const response =
      await api.get(
        "/admin/users/catalog"
      )

    return response.data
  }


/* ==========================================================
   ADMINISTRACION - PERMISOS
   ========================================================== */

/*
 * GET
 * /api/admin/users/:userId/permissions
 */
export const obtenerPermisosUsuario =
  async (userId) => {

    const id =
      encodeURIComponent(
        String(userId)
      )

    const response =
      await api.get(
        `/admin/users/${id}/permissions`
      )

    return response.data
  }


/* ==========================================================
   ADMINISTRACION - ASIGNAR CURSO
   ========================================================== */

export const asignarCurso =
  async (
    userId,
    courseId
  ) => {

    const usuario =
      encodeURIComponent(
        String(userId)
      )

    const curso =
      encodeURIComponent(
        String(courseId)
      )


    const response =
      await api.post(
        `/admin/users/${usuario}/courses/${curso}`
      )


    return response.data
  }


/* ==========================================================
   ADMINISTRACION - QUITAR CURSO
   ========================================================== */

export const quitarCurso =
  async (
    userId,
    courseId
  ) => {

    const usuario =
      encodeURIComponent(
        String(userId)
      )

    const curso =
      encodeURIComponent(
        String(courseId)
      )


    const response =
      await api.delete(
        `/admin/users/${usuario}/courses/${curso}`
      )


    return response.data
  }


/* ==========================================================
   ADMINISTRACION - ASIGNAR MODULO
   ========================================================== */

export const asignarModulo =
  async (
    userId,
    moduleId
  ) => {

    const usuario =
      encodeURIComponent(
        String(userId)
      )

    const modulo =
      encodeURIComponent(
        String(moduleId)
      )


    const response =
      await api.post(
        `/admin/users/${usuario}/modules/${modulo}`
      )


    return response.data
  }


/* ==========================================================
   ADMINISTRACION - QUITAR MODULO
   ========================================================== */

export const quitarModulo =
  async (
    userId,
    moduleId
  ) => {

    const usuario =
      encodeURIComponent(
        String(userId)
      )

    const modulo =
      encodeURIComponent(
        String(moduleId)
      )


    const response =
      await api.delete(
        `/admin/users/${usuario}/modules/${modulo}`
      )


    return response.data
  }


/* ==========================================================
   FORMATO DE NUMEROS
   ========================================================== */

export const soles = (valor) =>
  `S/ ${Number(
    valor || 0
  ).toLocaleString(
    "es-PE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`


export const miles = (valor) =>
  Number(
    valor || 0
  ).toLocaleString(
    "es-PE"
  )


export default api