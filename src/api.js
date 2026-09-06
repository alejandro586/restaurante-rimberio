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
     * No cerramos sesión ante cualquier 403.
     *
     * Un 403 puede significar también:
     *
     * - sin permiso para un módulo
     * - no es administrador
     *
     * Solo cerramos la sesión cuando
     * el backend indica específicamente
     * que la cuenta está desactivada.
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
    getPerfil().role ||
    ""


export const esAdmin =
  () =>
    getRol() ===
    "admin"


/*
 * Se mantiene trabajador temporalmente
 * por compatibilidad con el backend actual.
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
     * Si activo todavía no existe
     * en una sesión antigua,
     * se considera activo.
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
   RECUPERACION DE CONTRASEÑA - SOLICITAR
   ========================================================== */

/**
 * PUBLICO.
 *
 * El usuario NO necesita iniciar sesión.
 *
 * El backend devuelve una respuesta neutra
 * aunque el correo no exista.
 */
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

/**
 * PUBLICO.
 *
 * El usuario todavía NO ha iniciado sesión.
 *
 * Después de que un administrador aprueba
 * la solicitud, RIMBERIO envía automáticamente
 * el código al correo del usuario.
 *
 * Para completar la recuperación necesita:
 *
 * - correo
 * - código recibido por correo
 * - contraseña nueva
 * - confirmación
 */
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


    /*
     * El código se mantiene como STRING.
     *
     * Así un código como:
     *
     * 012345
     *
     * no pierde el cero inicial.
     */
    const codigoFinal =
      String(
        codigo ||
        ""
      ).trim()


    /*
     * IMPORTANTE:
     *
     * NO hacemos trim() a las contraseñas.
     */
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


/* ==========================================================
   RECUPERACION DE CONTRASEÑA - ESTADOS
   ========================================================== */

const ESTADOS_RECUPERACION_VALIDOS =
  new Set([
    "pendiente",
    "aprobado",
    "rechazado",
    "completado",
    "vencido"
  ])


/* ==========================================================
   RECUPERACION DE CONTRASEÑA - ADMIN LISTAR
   ========================================================== */

/**
 * ADMIN.
 *
 * estado es opcional.
 *
 * Ejemplos:
 *
 * listarRecuperacionesPassword()
 *
 * listarRecuperacionesPassword(
 *   "pendiente"
 * )
 */
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


/* ==========================================================
   RECUPERACION DE CONTRASEÑA - ADMIN APROBAR
   ========================================================== */

/**
 * ADMIN.
 *
 * El administrador solamente autoriza
 * la recuperación.
 *
 * El administrador NO:
 *
 * - genera el código
 * - escribe el código
 * - ve el código
 * - envía el código manualmente
 *
 * El backend:
 *
 * 1. genera un código temporal;
 * 2. guarda únicamente su hash;
 * 3. envía automáticamente el código
 *    al correo del usuario.
 */
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


    /*
     * Protección adicional del frontend.
     *
     * El backend actual ya NO devuelve
     * el código de recuperación.
     *
     * Aun así, eliminamos cualquier campo
     * sensible que pudiera devolver una
     * versión antigua del backend.
     */
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


/* ==========================================================
   RECUPERACION DE CONTRASEÑA - ADMIN RECHAZAR
   ========================================================== */

/**
 * ADMIN.
 *
 * Si estaba aprobada, rechazarla
 * invalida también el código.
 */
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

/*
 * Backend:
 *
 * GET
 * /api/course-documents/courses/:courseId
 *
 * POST
 * /api/course-documents/courses/:courseId
 *
 * GET
 * /api/course-documents/:documentId/url
 *
 * DELETE
 * /api/course-documents/:documentId
 */


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


/* ==========================================================
   UTILIDAD - ID
   ========================================================== */

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


/* ==========================================================
   UTILIDAD - EXTENSION
   ========================================================== */

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


/* ==========================================================
   LISTAR DOCUMENTOS DEL CURSO
   ========================================================== */

/**
 * Ejemplos:
 *
 * listarDocumentosCurso(1)
 *
 * listarDocumentosCurso(
 *   1,
 *   3
 * )
 *
 *
 * Si moduloId es null:
 * devuelve todos los documentos
 * que el usuario tiene permitido ver.
 *
 *
 * Si moduloId tiene valor:
 * filtra por ese módulo.
 */
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


/* ==========================================================
   SUBIR DOCUMENTO
   ========================================================== */

/**
 * Uso:
 *
 * subirDocumentoCurso({
 *   cursoId: 1,
 *   moduloId: null,
 *   archivo,
 *   descripcion: "Material semana 1"
 * })
 */
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


    /* ------------------------------------------------------
       ARCHIVO
       ------------------------------------------------------ */

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


    /* ------------------------------------------------------
       EXTENSION
       ------------------------------------------------------ */

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


    /* ------------------------------------------------------
       FORM DATA
       ------------------------------------------------------ */

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


    /*
     * IMPORTANTE:
     *
     * No configuramos manualmente:
     *
     * Content-Type: multipart/form-data
     *
     * El navegador/Axios agrega automáticamente
     * el boundary correcto.
     */
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


/* ==========================================================
   OBTENER URL PRIVADA DEL DOCUMENTO
   ========================================================== */

/**
 * Solicita al backend una URL firmada
 * temporal de Supabase Storage.
 *
 * El backend vuelve a comprobar
 * los permisos antes de generarla.
 */
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


/* ==========================================================
   ABRIR DOCUMENTO
   ========================================================== */

/**
 * Esta función es auxiliar.
 *
 * Primero pide la URL temporal al backend
 * y luego la abre en una nueva pestaña.
 *
 * Para PDF normalmente se mostrará
 * directamente en el navegador.
 *
 * Word / Excel / PowerPoint dependerán
 * del soporte del navegador.
 */
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


/* ==========================================================
   ELIMINAR DOCUMENTO
   ========================================================== */

/**
 * ADMIN:
 * puede eliminar cualquier documento.
 *
 * USUARIO:
 * solamente sus propios documentos,
 * según las reglas del backend.
 */
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