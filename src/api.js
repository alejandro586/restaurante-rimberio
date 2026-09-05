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
 * Función interna.
 *
 * Elimina únicamente los datos locales de sesión.
 *
 * Se utiliza cuando:
 *
 * - el token expiró
 * - el backend devuelve 401
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
   RESPUESTAS
   ========================================================== */

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
       TOKEN INVALIDO / SESION EXPIRADA
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


      return Promise.reject(
        error
      )
    }


    /* ======================================================
       CUENTA DESACTIVADA
       ====================================================== */

    /*
     * IMPORTANTE:
     *
     * No cerramos sesión ante cualquier error 403.
     *
     * Un 403 también puede significar:
     *
     * - no tiene permiso para un módulo
     * - no es administrador
     *
     * Solamente cerramos la sesión cuando
     * el backend indica específicamente que
     * la cuenta está desactivada.
     */
    const cuentaDesactivada =
      status ===
        403 &&
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

    const mensajeBackend =
      error?.response?.data?.error


    if (
      mensajeBackend
    ) {

      return String(
        mensajeBackend
      )
    }


    if (
      error?.message
    ) {

      return String(
        error.message
      )
    }


    return (
      "No se pudo conectar con el servidor"
    )
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


/* ==========================================================
   OBTENER PERFIL
   ========================================================== */

/**
 * El perfil guardado en el navegador
 * solamente se utiliza para la interfaz.
 *
 * El backend vuelve a validar:
 *
 * - usuario
 * - rol
 * - activo
 * - permisos
 */
export const getPerfil = () => {

  try {

    return (
      JSON.parse(
        localStorage.getItem(
          "perfil"
        )
      ) ||
      {}
    )

  } catch (
    error
  ) {

    return {}
  }
}


/* ==========================================================
   ROL
   ========================================================== */

export const getRol =
  () =>
    getPerfil().role ||
    ""


export const esAdmin =
  () =>
    getRol() ===
    "admin"


/*
 * Se mantiene trabajador
 * temporalmente por compatibilidad
 * con el backend antiguo.
 */
export const esTrabajador =
  () =>
    getRol() ===
    "trabajador"


/* ==========================================================
   ESTADO DEL USUARIO
   ========================================================== */

export const esUsuarioActivo =
  () => {

    const perfil =
      getPerfil()


    /*
     * Si activo todavía no existiera
     * en una sesión antigua lo tratamos
     * como activo.
     */
    return (
      perfil.activo !==
      false
    )
  }


/* ==========================================================
   EMPRESA
   ========================================================== */

export const getEmpresa =
  () =>
    getPerfil().empresa ||
    "Mi empresa"


/* ==========================================================
   INICIO SEGUN ROL
   ========================================================== */

export const inicioSegunRol =
  () =>
    esAdmin()
      ? "/archivos"
      : "/importar"


/* ==========================================================
   USUARIO DE SUPABASE
   ========================================================== */

export const getUser = () => {

  try {

    return (
      JSON.parse(
        localStorage.getItem(
          "user"
        )
      ) ||
      {}
    )

  } catch (
    error
  ) {

    return {}
  }
}


/* ==========================================================
   NOMBRE DEL USUARIO
   ========================================================== */

export const getUserName =
  () => {

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
      user.user_metadata ||
      {}


    if (
      meta.full_name
    ) {

      return meta.full_name
    }


    if (
      user.email
    ) {

      return user.email
        .split(
          "@"
        )[0]
    }


    return "Usuario"
  }


/* ==========================================================
   INICIALES
   ========================================================== */

export const getInitials =
  () => {

    const parts =
      getUserName()
        .trim()
        .split(
          " "
        )
        .filter(
          Boolean
        )


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
        .charAt(
          0
        )
        .toUpperCase()
    }


    return (
      parts[0]
        .charAt(
          0
        ) +
      parts[1]
        .charAt(
          0
        )
    )
      .toUpperCase()
  }


/* ==========================================================
   SESION ACTIVA
   ========================================================== */

export const isLogged =
  () =>
    Boolean(
      localStorage.getItem(
        "token"
      )
    )


/* ==========================================================
   CERRAR SESION
   ========================================================== */

export const clearSession =
  () => {

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


/* ==========================================================
   MIS PERMISOS
   ========================================================== */

export const obtenerMisPermisos =
  async () => {

    const response =
      await api.get(
        "/courses/me"
      )


    return response.data
  }


/* ==========================================================
   OBTENER CURSO
   ========================================================== */

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


/* ==========================================================
   MODULOS DEL CURSO
   ========================================================== */

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
   ADMINISTRACION - LISTAR USUARIOS
   ========================================================== */

/**
 * GET
 * /api/admin/users
 */
export const listarUsuarios =
  async () => {

    const response =
      await api.get(
        "/admin/users"
      )


    return response.data
  }


/* ==========================================================
   ADMINISTRACION - OBTENER USUARIO
   ========================================================== */

/**
 * GET
 * /api/admin/users/:userId
 */
export const obtenerUsuario =
  async (
    userId
  ) => {

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


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
   ADMINISTRACION - ACTUALIZAR USUARIO
   ========================================================== */

/**
 * PATCH
 * /api/admin/users/:userId
 *
 * Permite modificar:
 *
 * - full_name
 * - empresa
 *
 * No modifica:
 *
 * - correo
 * - contraseña
 * - rol
 * - activo
 * - permisos
 */
export const actualizarUsuario =
  async (
    userId,
    {
      full_name,
      fullName,
      empresa
    }
  ) => {

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


    const nombre =
      String(
        full_name ||
        fullName ||
        ""
      ).trim()


    const empresaFinal =
      String(
        empresa ||
        ""
      ).trim()


    if (
      !nombre
    ) {

      throw new Error(
        "El nombre completo es obligatorio"
      )
    }


    if (
      nombre.length >
      150
    ) {

      throw new Error(
        "El nombre no puede superar los 150 caracteres"
      )
    }


    if (
      !empresaFinal
    ) {

      throw new Error(
        "La empresa es obligatoria"
      )
    }


    if (
      empresaFinal.length >
      150
    ) {

      throw new Error(
        "La empresa no puede superar los 150 caracteres"
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
        `/admin/users/${id}`,
        {
          full_name:
            nombre,

          empresa:
            empresaFinal
        }
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
 *   → desactivar
 *
 * activo = true
 *   → reactivar
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

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


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

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


    if (
      courseId ===
        null ||
      courseId ===
        undefined ||
      courseId ===
        ""
    ) {

      throw new Error(
        "Curso no válido"
      )
    }


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

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


    if (
      courseId ===
        null ||
      courseId ===
        undefined ||
      courseId ===
        ""
    ) {

      throw new Error(
        "Curso no válido"
      )
    }


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

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


    if (
      moduleId ===
        null ||
      moduleId ===
        undefined ||
      moduleId ===
        ""
    ) {

      throw new Error(
        "Módulo no válido"
      )
    }


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

    if (
      !userId
    ) {

      throw new Error(
        "Usuario no válido"
      )
    }


    if (
      moduleId ===
        null ||
      moduleId ===
        undefined ||
      moduleId ===
        ""
    ) {

      throw new Error(
        "Módulo no válido"
      )
    }


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
 * POST
 * /api/admin/users
 */
export const crearUsuario =
  async ({
    full_name,
    email,
    password,
    empresa
  }) => {

    const nombre =
      String(
        full_name ||
        ""
      ).trim()


    const correo =
      String(
        email ||
        ""
      )
        .trim()
        .toLowerCase()


    const empresaFinal =
      String(
        empresa ||
        ""
      ).trim()


    if (
      !nombre
    ) {

      throw new Error(
        "El nombre completo es obligatorio"
      )
    }


    if (
      !correo
    ) {

      throw new Error(
        "El correo es obligatorio"
      )
    }


    if (
      !password
    ) {

      throw new Error(
        "La contraseña es obligatoria"
      )
    }


    if (
      String(
        password
      ).length <
      8
    ) {

      throw new Error(
        "La contraseña debe tener al menos 8 caracteres"
      )
    }


    if (
      !empresaFinal
    ) {

      throw new Error(
        "La empresa es obligatoria"
      )
    }


    const {
      data
    } =
      await api.post(
        "/admin/users",
        {
          full_name:
            nombre,

          email:
            correo,

          password:
            String(
              password
            ),

          empresa:
            empresaFinal
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
      valor ||
      0
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
      valor ||
      0
    ).toLocaleString(
      "es-PE"
    )


export default api