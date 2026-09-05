import axios from "axios"


/* ==========================================================
   CLIENTE API
   ========================================================== */

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL
})


/* ==========================================================
   LIMPIAR SESION LOCAL
   ========================================================== */

/**
 * Elimina toda la información local
 * relacionada con la sesión actual.
 *
 * Se utiliza cuando:
 *
 * - el usuario cierra sesión
 * - el token expiró
 * - la cuenta fue desactivada
 */
const limpiarSesionLocal = () => {

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
   TOKEN
   ========================================================== */

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem(
        "token"
      )


    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`
    }


    return config
  }
)


/* ==========================================================
   RESPUESTAS / SESION
   ========================================================== */

/**
 * Manejo centralizado de:
 *
 * 401 -> sesión inválida o expirada
 *
 * 403 + cuenta desactivada
 * -> el administrador bloqueó la cuenta
 *
 * En ambos casos se elimina la sesión
 * almacenada localmente.
 */
api.interceptors.response.use(

  (response) =>
    response,


  (error) => {

    const status =
      error?.response?.status


    const mensaje =
      String(
        error?.response?.data?.error ||
        ""
      )
        .trim()
        .toLowerCase()


    /* ======================================================
       SESION EXPIRADA
       ====================================================== */

    if (
      status ===
      401
    ) {

      limpiarSesionLocal()


      if (
        window.location.pathname !==
        "/login"
      ) {

        window.location.href =
          "/login"
      }
    }


    /* ======================================================
       CUENTA DESACTIVADA
       ====================================================== */

    const cuentaDesactivada =
      status === 403 &&
      (
        mensaje.includes(
          "cuenta está desactivada"
        ) ||
        mensaje.includes(
          "cuenta esta desactivada"
        )
      )


    if (
      cuentaDesactivada
    ) {

      limpiarSesionLocal()


      if (
        window.location.pathname !==
        "/login"
      ) {

        window.location.href =
          "/login"
      }
    }


    return Promise.reject(
      error
    )
  }
)


/* ==========================================================
   ERRORES
   ========================================================== */

export const getMessage =
  (error) => {

    if (
      error?.response?.data?.error
    ) {

      return error
        .response
        .data
        .error
    }


    if (
      error?.message
    ) {

      return error.message
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


/**
 * El perfil guardado solo decide
 * qué se dibuja en el frontend.
 *
 * El backend vuelve a verificar:
 *
 * - usuario
 * - rol
 * - empresa
 * - estado activo
 * - permisos
 *
 * contra la base de datos.
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


/* ==========================================================
   ROL
   ========================================================== */

export const getRol = () =>
  getPerfil().role || ""


export const esAdmin = () =>
  getRol() ===
  "admin"


export const esTrabajador = () =>
  getRol() ===
  "trabajador"


/* ==========================================================
   ESTADO LOCAL DEL PERFIL
   ========================================================== */

/**
 * Este valor es solamente informativo
 * para la interfaz.
 *
 * La seguridad real continúa dependiendo
 * del backend.
 */
export const esUsuarioActivo = () => {

  const perfil =
    getPerfil()


  return (
    perfil.activo !==
    false
  )
}


/* ==========================================================
   EMPRESA
   ========================================================== */

export const getEmpresa = () =>
  getPerfil().empresa ||
  "Mi empresa"


/* ==========================================================
   PAGINA INICIAL SEGUN ROL
   ========================================================== */

export const inicioSegunRol = () =>
  esAdmin()
    ? "/archivos"
    : "/importar"


/* ==========================================================
   USUARIO AUTH
   ========================================================== */

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


/* ==========================================================
   NOMBRE DEL USUARIO
   ========================================================== */

export const getUserName = () => {

  const perfil =
    getPerfil()


  if (
    perfil.full_name
  ) {

    return perfil.full_name
  }


  const user =
    getUser()


  const meta =
    user.user_metadata || {}


  if (
    meta.full_name
  ) {

    return meta.full_name
  }


  if (
    user.email
  ) {

    return user.email
      .split("@")[0]
  }


  return "Usuario"
}


/* ==========================================================
   INICIALES
   ========================================================== */

export const getInitials = () => {

  const parts =
    getUserName()
      .trim()
      .split(" ")
      .filter(Boolean)


  if (
    parts.length ===
    0
  ) {

    return "U"
  }


  if (
    parts.length ===
    1
  ) {

    return parts[0]
      .charAt(0)
      .toUpperCase()
  }


  return (
    parts[0]
      .charAt(0)
      .toUpperCase() +

    parts[1]
      .charAt(0)
      .toUpperCase()
  )
}


/* ==========================================================
   COMPROBAR SESION
   ========================================================== */

export const isLogged = () =>
  Boolean(
    localStorage.getItem(
      "token"
    )
  )


/* ==========================================================
   CERRAR SESION
   ========================================================== */

export const clearSession = () => {

  limpiarSesionLocal()
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
  async (
    curso
  ) => {

    const valor =
      encodeURIComponent(
        String(
          curso
        )
      )


    const response =
      await api.get(
        `/courses/${valor}`
      )


    return response.data
  }


export const obtenerModulosCurso =
  async (
    curso
  ) => {

    const valor =
      encodeURIComponent(
        String(
          curso
        )
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

/**
 * GET
 * /api/admin/users
 *
 * Lista todos los usuarios.
 *
 * Cada perfil puede incluir ahora:
 *
 * activo: true / false
 */
export const listarUsuarios =
  async () => {

    const response =
      await api.get(
        "/admin/users"
      )


    return response.data
  }


/**
 * GET
 * /api/admin/users/:userId
 */
export const obtenerUsuario =
  async (
    userId
  ) => {

    const id =
      encodeURIComponent(
        String(
          userId
        )
      )


    const response =
      await api.get(
        `/admin/users/${id}`
      )


    return response.data
  }


/* ==========================================================
   ADMINISTRACION - CAMBIAR ESTADO
   ========================================================== */

/**
 * PATCH
 * /api/admin/users/:userId/status
 *
 * activo = false
 * -> desactiva la cuenta
 *
 * activo = true
 * -> reactiva la cuenta
 *
 * No elimina:
 *
 * - usuario
 * - permisos
 * - cursos
 * - módulos
 * - CSV
 * - proyectos
 * - historial
 */
export const cambiarEstadoUsuario =
  async (
    userId,
    activo
  ) => {

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


    if (
      typeof activo !==
      "boolean"
    ) {

      throw new Error(
        "El estado del usuario debe ser true o false"
      )
    }


    const id =
      encodeURIComponent(
        String(
          userId
        )
      )


    const response =
      await api.patch(
        `/admin/users/${id}/status`,
        {
          activo
        }
      )


    return response.data
  }


/* ==========================================================
   ADMINISTRACION - CATALOGO
   ========================================================== */

/**
 * GET
 * /api/admin/users/catalog
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

/**
 * GET
 * /api/admin/users/:userId/permissions
 */
export const obtenerPermisosUsuario =
  async (
    userId
  ) => {

    const id =
      encodeURIComponent(
        String(
          userId
        )
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
        String(
          userId
        )
      )


    const curso =
      encodeURIComponent(
        String(
          courseId
        )
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
        String(
          userId
        )
      )


    const curso =
      encodeURIComponent(
        String(
          courseId
        )
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
        String(
          userId
        )
      )


    const modulo =
      encodeURIComponent(
        String(
          moduleId
        )
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
        String(
          userId
        )
      )


    const modulo =
      encodeURIComponent(
        String(
          moduleId
        )
      )


    const response =
      await api.delete(
        `/admin/users/${usuario}/modules/${modulo}`
      )


    return response.data
  }


/* ==========================================================
   ADMINISTRACION - REGISTRAR USUARIO
   ========================================================== */

/**
 * Registra un nuevo usuario desde
 * el panel administrativo.
 *
 * Backend:
 *
 * POST /api/admin/users
 *
 * Solo funciona si la sesión actual
 * pertenece a un administrador.
 *
 * El backend crea el usuario con:
 *
 * activo = true
 */
export const crearUsuario =
  async ({
    full_name,
    email,
    password,
    empresa
  }) => {

    const {
      data
    } =
      await api.post(
        "/admin/users",
        {
          full_name,
          email,
          password,
          empresa
        }
      )


    return data
  }


/* ==========================================================
   FORMATO DE NUMEROS
   ========================================================== */

export const soles =
  (valor) =>

    `S/ ${Number(
      valor || 0
    ).toLocaleString(
      "es-PE",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2
      }
    )}`


export const miles =
  (valor) =>

    Number(
      valor || 0
    ).toLocaleString(
      "es-PE"
    )


export default api