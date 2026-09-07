import axios from "axios"


/* ==========================================================
   CLIENTE API
   ========================================================== */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})


/* ==========================================================
   SESION LOCAL
   ========================================================== */

const limpiarSesionLocal = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem("perfil")
}


/* ==========================================================
   TOKEN
   ========================================================== */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token")


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
      user ||
      {}
    )
  )


  localStorage.setItem(
    "perfil",
    JSON.stringify(
      perfil ||
      {}
    )
  )
}


/* ==========================================================
   OBTENER PERFIL
   ========================================================== */

export const getPerfil =
  () => {
    try {
      return (
        JSON.parse(
          localStorage.getItem(
            "perfil"
          )
        ) ||
        {}
      )
    } catch {
      return {}
    }
  }


/* ==========================================================
   ROL
   ========================================================== */

export const getRol =
  () =>
    String(
      getPerfil().role ||
      ""
    )
      .trim()
      .toLowerCase()


export const esAdmin =
  () =>
    getRol() ===
    "admin"


/* ==========================================================
   USUARIO NORMAL
   ========================================================== */

export const esUsuario =
  () =>
    [
      "usuario",
      "trabajador"
    ].includes(
      getRol()
    )


/*
 * Alias temporal para componentes antiguos
 * que todavía importen esTrabajador().
 */
export const esTrabajador =
  () =>
    esUsuario()


/* ==========================================================
   ESTADO DEL USUARIO
   ========================================================== */

export const esUsuarioActivo =
  () => {
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

export const getUser =
  () => {
    try {
      return (
        JSON.parse(
          localStorage.getItem(
            "user"
          )
        ) ||
        {}
      )
    } catch {
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
        .split("@")[0]
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
        .charAt(0) +
      parts[1]
        .charAt(0)
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
   ADMINISTRACION - CURSOS Y MODULOS
   ========================================================== */

const validarIdAdministrativo = (
  valor,
  nombre =
    "Registro"
) => {

  const numero =
    Number(
      valor
    )


  if (
    !Number.isInteger(
      numero
    ) ||
    numero <=
      0
  ) {

    throw new Error(
      `${nombre} no válido`
    )
  }


  return encodeURIComponent(
    String(
      numero
    )
  )
}


export const listarCatalogoAdminCursos =
  async () => {

    const response =
      await api.get(
        "/admin/courses"
      )


    return response.data
  }


export const crearCursoAdmin =
  async ({
    nombre,
    slug =
      "",
    descripcion =
      "",
    orden =
      "",
    activo =
      true
  } = {}) => {

    const nombreFinal =
      String(
        nombre ||
        ""
      ).trim()


    if (
      !nombreFinal
    ) {

      throw new Error(
        "El nombre del curso es obligatorio"
      )
    }


    if (
      typeof activo !==
      "boolean"
    ) {

      throw new Error(
        "El estado del curso debe ser true o false"
      )
    }


    const response =
      await api.post(
        "/admin/courses",
        {
          nombre:
            nombreFinal,

          slug:
            String(
              slug ||
              ""
            ).trim(),

          descripcion:
            String(
              descripcion ||
              ""
            ).trim(),

          orden,

          activo
        }
      )


    return response.data
  }


export const actualizarCursoAdmin =
  async (
    courseId,
    cambios =
      {}
  ) => {

    const id =
      validarIdAdministrativo(
        courseId,
        "Curso"
      )


    if (
      !cambios ||
      typeof cambios !==
        "object" ||
      Array.isArray(
        cambios
      )
    ) {

      throw new Error(
        "Los cambios del curso no son válidos"
      )
    }


    const payload =
      {}


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "nombre"
        )
    ) {

      const nombre =
        String(
          cambios.nombre ||
          ""
        ).trim()


      if (
        !nombre
      ) {

        throw new Error(
          "El nombre del curso es obligatorio"
        )
      }


      payload.nombre =
        nombre
    }


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "slug"
        )
    ) {

      payload.slug =
        String(
          cambios.slug ||
          ""
        ).trim()
    }


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "descripcion"
        )
    ) {

      payload.descripcion =
        String(
          cambios.descripcion ??
          ""
        ).trim()
    }


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "orden"
        )
    ) {

      payload.orden =
        cambios.orden
    }


    if (
      Object.keys(
        payload
      ).length ===
        0
    ) {

      throw new Error(
        "No se enviaron cambios para el curso"
      )
    }


    const response =
      await api.patch(
        `/admin/courses/${id}`,
        payload
      )


    return response.data
  }


export const cambiarEstadoCursoAdmin =
  async (
    courseId,
    activo
  ) => {

    const id =
      validarIdAdministrativo(
        courseId,
        "Curso"
      )


    if (
      typeof activo !==
      "boolean"
    ) {

      throw new Error(
        "El estado del curso debe ser true o false"
      )
    }


    const response =
      await api.patch(
        `/admin/courses/${id}/status`,
        {
          activo
        }
      )


    return response.data
  }


export const crearModuloAdmin =
  async (
    courseId,
    {
      nombre,
      slug =
        "",
      clave =
        "",
      descripcion =
        "",
      orden =
        "",
      activo =
        true
    } = {}
  ) => {

    const curso =
      validarIdAdministrativo(
        courseId,
        "Curso"
      )


    const nombreFinal =
      String(
        nombre ||
        ""
      ).trim()


    if (
      !nombreFinal
    ) {

      throw new Error(
        "El nombre del módulo es obligatorio"
      )
    }


    if (
      typeof activo !==
      "boolean"
    ) {

      throw new Error(
        "El estado del módulo debe ser true o false"
      )
    }


    const response =
      await api.post(
        `/admin/courses/${curso}/modules`,
        {
          nombre:
            nombreFinal,

          slug:
            String(
              slug ||
              ""
            ).trim(),

          clave:
            String(
              clave ||
              ""
            ).trim(),

          descripcion:
            String(
              descripcion ||
              ""
            ).trim(),

          orden,

          activo
        }
      )


    return response.data
  }


export const actualizarModuloAdmin =
  async (
    moduleId,
    cambios =
      {}
  ) => {

    const id =
      validarIdAdministrativo(
        moduleId,
        "Módulo"
      )


    if (
      !cambios ||
      typeof cambios !==
        "object" ||
      Array.isArray(
        cambios
      )
    ) {

      throw new Error(
        "Los cambios del módulo no son válidos"
      )
    }


    const payload =
      {}


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "nombre"
        )
    ) {

      const nombre =
        String(
          cambios.nombre ||
          ""
        ).trim()


      if (
        !nombre
      ) {

        throw new Error(
          "El nombre del módulo es obligatorio"
        )
      }


      payload.nombre =
        nombre
    }


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "slug"
        )
    ) {

      payload.slug =
        String(
          cambios.slug ||
          ""
        ).trim()
    }


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "clave"
        )
    ) {

      payload.clave =
        String(
          cambios.clave ||
          ""
        ).trim()
    }


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "descripcion"
        )
    ) {

      payload.descripcion =
        String(
          cambios.descripcion ??
          ""
        ).trim()
    }


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cambios,
          "orden"
        )
    ) {

      payload.orden =
        cambios.orden
    }


    if (
      Object.keys(
        payload
      ).length ===
        0
    ) {

      throw new Error(
        "No se enviaron cambios para el módulo"
      )
    }


    const response =
      await api.patch(
        `/admin/courses/modules/${id}`,
        payload
      )


    return response.data
  }


export const cambiarEstadoModuloAdmin =
  async (
    moduleId,
    activo
  ) => {

    const id =
      validarIdAdministrativo(
        moduleId,
        "Módulo"
      )


    if (
      typeof activo !==
      "boolean"
    ) {

      throw new Error(
        "El estado del módulo debe ser true o false"
      )
    }


    const response =
      await api.patch(
        `/admin/courses/modules/${id}/status`,
        {
          activo
        }
      )


    return response.data
  }


/* ==========================================================
   RECUPERACION DE CONTRASEÑA - SOLICITAR
   ========================================================== */

export const solicitarRecuperacionPassword =
  async (
    email
  ) => {
    const correo =
      String(
        email ||
        ""
      )
        .trim()
        .toLowerCase()


    if (
      !correo
    ) {
      throw new Error(
        "El correo es obligatorio"
      )
    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
          correo
        )
    ) {
      throw new Error(
        "Ingresa un correo electrónico válido"
      )
    }


    const response =
      await api.post(
        "/password-reset/request",
        {
          email:
            correo
        }
      )


    return response.data
  }


/* ==========================================================
   RECUPERACION DE CONTRASEÑA - COMPLETAR
   ========================================================== */

export const completarRecuperacionPassword =
  async ({
    email,
    codigo,
    password,
    password_confirm,
    passwordConfirm
  }) => {
    const correo =
      String(
        email ||
        ""
      )
        .trim()
        .toLowerCase()


    const codigoFinal =
      String(
        codigo ||
        ""
      ).trim()


    const nuevaPassword =
      String(
        password ??
        ""
      )


    const confirmacion =
      String(
        password_confirm ??
        passwordConfirm ??
        ""
      )


    if (
      !correo
    ) {
      throw new Error(
        "El correo es obligatorio"
      )
    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
          correo
        )
    ) {
      throw new Error(
        "Ingresa un correo electrónico válido"
      )
    }


    if (
      !codigoFinal
    ) {
      throw new Error(
        "El código de recuperación es obligatorio"
      )
    }


    if (
      !/^\d{6}$/
        .test(
          codigoFinal
        )
    ) {
      throw new Error(
        "El código debe contener exactamente 6 números"
      )
    }


    if (
      !nuevaPassword
    ) {
      throw new Error(
        "La nueva contraseña es obligatoria"
      )
    }


    if (
      nuevaPassword.length <
      8
    ) {
      throw new Error(
        "La nueva contraseña debe tener al menos 8 caracteres"
      )
    }


    if (
      nuevaPassword.length >
      128
    ) {
      throw new Error(
        "La nueva contraseña es demasiado larga"
      )
    }


    if (
      !confirmacion
    ) {
      throw new Error(
        "Debes confirmar la nueva contraseña"
      )
    }


    if (
      nuevaPassword !==
      confirmacion
    ) {
      throw new Error(
        "Las contraseñas no coinciden"
      )
    }


    const response =
      await api.post(
        "/password-reset/complete",
        {
          email:
            correo,

          codigo:
            codigoFinal,

          password:
            nuevaPassword,

          password_confirm:
            confirmacion
        }
      )


    return response.data
  }


const ESTADOS_RECUPERACION_VALIDOS =
  new Set([
    "pendiente",
    "aprobado",
    "rechazado",
    "completado",
    "vencido"
  ])


export const listarRecuperacionesPassword =
  async (
    estado =
      ""
  ) => {
    const estadoFinal =
      String(
        estado ||
        ""
      )
        .trim()
        .toLowerCase()


    if (
      estadoFinal &&
      !ESTADOS_RECUPERACION_VALIDOS
        .has(
          estadoFinal
        )
    ) {
      throw new Error(
        "Estado de recuperación no válido"
      )
    }


    const response =
      await api.get(
        "/password-reset/admin",
        {
          params:
            estadoFinal
              ? {
                  estado:
                    estadoFinal
                }
              : undefined
        }
      )


    return response.data
  }


export const aprobarRecuperacionPassword =
  async (
    solicitudId
  ) => {
    const idNumero =
      Number(
        solicitudId
      )


    if (
      !Number.isInteger(
        idNumero
      ) ||
      idNumero <=
        0
    ) {
      throw new Error(
        "Solicitud de recuperación no válida"
      )
    }


    const id =
      encodeURIComponent(
        String(
          idNumero
        )
      )


    const response =
      await api.post(
        `/password-reset/admin/${id}/approve`
      )


    if (
      response?.data &&
      typeof response.data ===
        "object"
    ) {
      const resultado = {
        ...response.data
      }

      delete resultado.codigo
      delete resultado.codigo_hash
      delete resultado.code


      if (
        resultado.solicitud &&
        typeof resultado.solicitud ===
          "object"
      ) {
        resultado.solicitud = {
          ...resultado.solicitud
        }

        delete resultado.solicitud.codigo
        delete resultado.solicitud.codigo_hash
        delete resultado.solicitud.code
      }


      return resultado
    }


    return response.data
  }


export const rechazarRecuperacionPassword =
  async (
    solicitudId
  ) => {
    const idNumero =
      Number(
        solicitudId
      )


    if (
      !Number.isInteger(
        idNumero
      ) ||
      idNumero <=
        0
    ) {
      throw new Error(
        "Solicitud de recuperación no válida"
      )
    }


    const id =
      encodeURIComponent(
        String(
          idNumero
        )
      )


    const response =
      await api.post(
        `/password-reset/admin/${id}/reject`
      )


    return response.data
  }


/* ==========================================================
   DOCUMENTOS DE CURSOS
   ========================================================== */

const DOCUMENTO_MAX_BYTES =
  25 * 1024 * 1024


const DOCUMENTO_EXTENSIONES =
  new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx"
  ])


const normalizarIdDocumento =
  (
    valor,
    mensaje
  ) => {

    const numero =
      Number(
        valor
      )


    if (
      !Number.isInteger(
        numero
      ) ||
      numero <=
        0
    ) {

      throw new Error(
        mensaje
      )
    }


    return numero
  }


const obtenerExtensionDocumento =
  (
    nombre
  ) => {

    const texto =
      String(
        nombre ||
        ""
      )


    const partes =
      texto.split(".")


    if (
      partes.length <
      2
    ) {

      return ""
    }


    return String(
      partes.pop() ||
      ""
    )
      .trim()
      .toLowerCase()
  }


export const listarDocumentosCurso =
  async (
    cursoId,
    moduloId =
      null
  ) => {

    const curso =
      normalizarIdDocumento(
        cursoId,
        "Curso no válido"
      )


    const params =
      {}


    if (
      moduloId !==
        null &&
      moduloId !==
        undefined &&
      moduloId !==
        ""
    ) {

      params.modulo_id =
        normalizarIdDocumento(
          moduloId,
          "Módulo no válido"
        )
    }


    const response =
      await api.get(
        `/course-documents/courses/${encodeURIComponent(
          String(
            curso
          )
        )}`,
        {
          params
        }
      )


    return response.data
  }


export const subirDocumentoCurso =
  async ({
    cursoId,
    moduloId =
      null,
    archivo,
    descripcion =
      ""
  }) => {

    const curso =
      normalizarIdDocumento(
        cursoId,
        "Curso no válido"
      )


    if (
      !archivo ||
      typeof archivo !==
        "object"
    ) {

      throw new Error(
        "Selecciona un archivo"
      )
    }


    if (
      typeof archivo.size !==
        "number" ||
      archivo.size <=
        0
    ) {

      throw new Error(
        "El archivo está vacío"
      )
    }


    if (
      archivo.size >
      DOCUMENTO_MAX_BYTES
    ) {

      throw new Error(
        "El archivo supera el límite máximo de 25 MB"
      )
    }


    const extension =
      obtenerExtensionDocumento(
        archivo.name
      )


    if (
      !DOCUMENTO_EXTENSIONES
        .has(
          extension
        )
    ) {

      throw new Error(
        "Formato no permitido. Usa PDF, Word, Excel o PowerPoint"
      )
    }


    const formData =
      new FormData()


    formData.append(
      "archivo",
      archivo
    )


    if (
      moduloId !==
        null &&
      moduloId !==
        undefined &&
      moduloId !==
        ""
    ) {

      const modulo =
        normalizarIdDocumento(
          moduloId,
          "Módulo no válido"
        )


      formData.append(
        "modulo_id",
        String(
          modulo
        )
      )
    }


    const descripcionFinal =
      String(
        descripcion ||
        ""
      )
        .trim()


    if (
      descripcionFinal
    ) {

      formData.append(
        "descripcion",
        descripcionFinal
      )
    }


    const response =
      await api.post(
        `/course-documents/courses/${encodeURIComponent(
          String(
            curso
          )
        )}`,
        formData
      )


    return response.data
  }


export const obtenerUrlDocumento =
  async (
    documentoId
  ) => {

    const documento =
      normalizarIdDocumento(
        documentoId,
        "Documento no válido"
      )


    const response =
      await api.get(
        `/course-documents/${encodeURIComponent(
          String(
            documento
          )
        )}/url`
      )


    return response.data
  }


export const abrirDocumentoCurso =
  async (
    documentoId
  ) => {

    const resultado =
      await obtenerUrlDocumento(
        documentoId
      )


    const url =
      String(
        resultado?.url ||
        ""
      )


    if (
      !url
    ) {

      throw new Error(
        "No se pudo obtener la URL del documento"
      )
    }


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    )


    return resultado
  }


export const eliminarDocumentoCurso =
  async (
    documentoId
  ) => {

    const documento =
      normalizarIdDocumento(
        documentoId,
        "Documento no válido"
      )


    const response =
      await api.delete(
        `/course-documents/${encodeURIComponent(
          String(
            documento
          )
        )}`
      )


    return response.data
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