import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  crearUsuario,
  listarUsuarios,
  actualizarUsuario,
  cambiarEstadoUsuario,
  obtenerCatalogoCursos,
  obtenerPermisosUsuario,
  asignarCurso,
  quitarCurso,
  asignarModulo,
  quitarModulo,
  listarRecuperacionesPassword,
  aprobarRecuperacionPassword,
  rechazarRecuperacionPassword,
  getEmpresa,
  getMessage,
  getInitials,
  getUserName
} from "../api"

import Modal from "../components/Modal"


/* ==========================================================
   UTILIDADES
   ========================================================== */

const obtenerListaUsuarios = (respuesta) => {
  if (Array.isArray(respuesta)) {
    return respuesta
  }

  if (Array.isArray(respuesta?.usuarios)) {
    return respuesta.usuarios
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data
  }

  return []
}


const obtenerListaCursos = (respuesta) => {
  if (Array.isArray(respuesta)) {
    return respuesta
  }

  if (Array.isArray(respuesta?.cursos)) {
    return respuesta.cursos
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data
  }

  return []
}


const obtenerListaRecuperaciones = (respuesta) => {
  if (Array.isArray(respuesta)) {
    return respuesta
  }

  if (Array.isArray(respuesta?.solicitudes)) {
    return respuesta.solicitudes
  }

  if (Array.isArray(respuesta?.data)) {
    return respuesta.data
  }

  return []
}


const normalizarPermisos = (respuesta) => {
  const origen =
    respuesta?.permisos ??
    respuesta ??
    {}

  const cursos =
    new Set()

  const modulos =
    new Set()


  const agregarCurso = (valor) => {
    if (
      valor === null ||
      valor === undefined
    ) {
      return
    }

    cursos.add(
      String(valor)
    )
  }


  const agregarModulo = (valor) => {
    if (
      valor === null ||
      valor === undefined
    ) {
      return
    }

    modulos.add(
      String(valor)
    )
  }


  const listaCursos =
    Array.isArray(
      origen?.cursos
    )
      ? origen.cursos
      : []


  listaCursos.forEach(
    (curso) => {
      const cursoId =
        curso?.curso_id ??
        curso?.id

      if (
        curso?.activo !==
        false
      ) {
        agregarCurso(
          cursoId
        )
      }

      const listaModulos =
        Array.isArray(
          curso?.modulos
        )
          ? curso.modulos
          : Array.isArray(
              curso?.modules
            )
            ? curso.modules
            : []

      listaModulos.forEach(
        (modulo) => {
          if (
            modulo?.activo ===
            false
          ) {
            return
          }

          agregarModulo(
            modulo?.modulo_id ??
            modulo?.id
          )
        }
      )
    }
  )


  const listaModulos =
    Array.isArray(
      origen?.modulos
    )
      ? origen.modulos
      : []


  listaModulos.forEach(
    (modulo) => {
      if (
        modulo?.activo ===
        false
      ) {
        return
      }

      agregarModulo(
        modulo?.modulo_id ??
        modulo?.id
      )

      if (
        modulo?.curso_id
      ) {
        agregarCurso(
          modulo.curso_id
        )
      }
    }
  )


  if (
    Array.isArray(
      origen?.curso_ids
    )
  ) {
    origen.curso_ids.forEach(
      agregarCurso
    )
  }


  if (
    Array.isArray(
      origen?.modulo_ids
    )
  ) {
    origen.modulo_ids.forEach(
      agregarModulo
    )
  }


  return {
    cursos,
    modulos
  }
}


const formatoFecha = (valor) => {
  if (!valor) {
    return "—"
  }

  const fecha =
    new Date(valor)

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "—"
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle:
        "short",

      timeStyle:
        "short"
    }
  ).format(fecha)
}


const etiquetaEstadoRecuperacion = (estado) => {
  switch (
    String(
      estado || ""
    ).toLowerCase()
  ) {

    case "pendiente":
      return "Pendiente"

    case "aprobado":
      return "Aprobada"

    case "rechazado":
      return "Rechazada"

    case "completado":
      return "Completada"

    case "vencido":
      return "Vencida"

    default:
      return estado || "—"
  }
}


const estiloEstadoRecuperacion = (estado) => {
  switch (
    String(
      estado || ""
    ).toLowerCase()
  ) {

    case "pendiente":
      return {
        border:
          "1px solid #fde68a",

        background:
          "#fffbeb",

        color:
          "#92400e"
      }


    case "aprobado":
      return {
        border:
          "1px solid #bfdbfe",

        background:
          "#eff6ff",

        color:
          "#1d4ed8"
      }


    case "completado":
      return {
        border:
          "1px solid #bbf7d0",

        background:
          "#f0fdf4",

        color:
          "#166534"
      }


    case "rechazado":
      return {
        border:
          "1px solid #fecaca",

        background:
          "#fef2f2",

        color:
          "#991b1b"
      }


    case "vencido":
      return {
        border:
          "1px solid #e2e8f0",

        background:
          "#f8fafc",

        color:
          "#475569"
      }


    default:
      return {
        border:
          "1px solid #e2e8f0",

        background:
          "#f8fafc",

        color:
          "#475569"
      }
  }
}


const obtenerNombreSolicitud = (solicitud) =>
  solicitud?.full_name ||
  solicitud?.nombre ||
  solicitud?.perfil?.full_name ||
  solicitud?.usuario?.full_name ||
  solicitud?.profile?.full_name ||
  solicitud?.email ||
  "Usuario"


/* ==========================================================
   ADMINISTRACION DE USUARIOS
   ========================================================== */

const AdminUsuarios = () => {

  /* ========================================================
     USUARIOS
     ======================================================== */

  const [
    usuarios,
    setUsuarios
  ] =
    useState([])


  const [
    usuarioSeleccionadoId,
    setUsuarioSeleccionadoId
  ] =
    useState("")


  const [
    buscar,
    setBuscar
  ] =
    useState("")


  /* ========================================================
     CURSOS
     ======================================================== */

  const [
    cursos,
    setCursos
  ] =
    useState([])


  /* ========================================================
     PERMISOS
     ======================================================== */

  const [
    permisos,
    setPermisos
  ] =
    useState({
      cursos:
        new Set(),

      modulos:
        new Set()
    })


  const [
    cargandoPermisos,
    setCargandoPermisos
  ] =
    useState(false)


  const [
    guardandoPermiso,
    setGuardandoPermiso
  ] =
    useState("")


  /* ========================================================
     ESTADO GENERAL
     ======================================================== */

  const [
    cargando,
    setCargando
  ] =
    useState(true)


  const [
    error,
    setError
  ] =
    useState("")


  const [
    aviso,
    setAviso
  ] =
    useState("")


  /* ========================================================
     ESTADO DE CUENTA
     ======================================================== */

  const [
    cambiandoEstado,
    setCambiandoEstado
  ] =
    useState(false)


  const [
    usuarioEstadoPendiente,
    setUsuarioEstadoPendiente
  ] =
    useState(null)


  /* ========================================================
     EDICION
     ======================================================== */

  const [
    mostrarEdicion,
    setMostrarEdicion
  ] =
    useState(false)


  const [
    guardandoEdicion,
    setGuardandoEdicion
  ] =
    useState(false)


  const [
    errorEdicion,
    setErrorEdicion
  ] =
    useState("")


  const [
    usuarioEdicion,
    setUsuarioEdicion
  ] =
    useState({
      full_name:
        "",

      empresa:
        ""
    })


  /* ========================================================
     REGISTRO
     ======================================================== */

  const [
    mostrarRegistro,
    setMostrarRegistro
  ] =
    useState(false)


  const [
    registrando,
    setRegistrando
  ] =
    useState(false)


  const [
    errorRegistro,
    setErrorRegistro
  ] =
    useState("")


  const [
    nuevoUsuario,
    setNuevoUsuario
  ] =
    useState({
      full_name:
        "",

      email:
        "",

      password:
        "",

      empresa:
        getEmpresa()
    })


  /* ========================================================
     RECUPERACIONES
     ======================================================== */

  const [
    recuperaciones,
    setRecuperaciones
  ] =
    useState([])


  const [
    filtroRecuperacion,
    setFiltroRecuperacion
  ] =
    useState(
      "pendiente"
    )


  const [
    cargandoRecuperaciones,
    setCargandoRecuperaciones
  ] =
    useState(false)


  const [
    errorRecuperaciones,
    setErrorRecuperaciones
  ] =
    useState("")


  const [
    accionRecuperacion,
    setAccionRecuperacion
  ] =
    useState("")


  const [
    codigoGenerado,
    setCodigoGenerado
  ] =
    useState(null)


  const [
    solicitudRechazo,
    setSolicitudRechazo
  ] =
    useState(null)


  /* ========================================================
     USUARIO SELECCIONADO
     ======================================================== */

  const usuarioSeleccionado =
    useMemo(
      () =>
        usuarios.find(
          (usuario) =>
            String(
              usuario.id
            ) ===
            String(
              usuarioSeleccionadoId
            )
        ) ||
        null,

      [
        usuarios,
        usuarioSeleccionadoId
      ]
    )


  const usuarioEsAdmin =
    usuarioSeleccionado?.role ===
    "admin"


  const usuarioEstaActivo =
    usuarioSeleccionado?.activo !==
    false


  /* ========================================================
     FILTRO
     ======================================================== */

  const usuariosFiltrados =
    useMemo(
      () => {

        const texto =
          buscar
            .trim()
            .toLowerCase()


        if (!texto) {
          return usuarios
        }


        return usuarios.filter(
          (usuario) => {

            const contenido =
              [
                usuario.full_name,
                usuario.email,
                usuario.empresa,
                usuario.role,

                usuario.activo ===
                  false
                  ? "desactivado inactivo bloqueado"
                  : "activo habilitado"
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase()


            return contenido.includes(
              texto
            )
          }
        )
      },

      [
        usuarios,
        buscar
      ]
    )


  /* ========================================================
     MENSAJES
     ======================================================== */

  const mostrarAviso =
    (
      texto
    ) => {

      setAviso(
        texto
      )


      window.setTimeout(
        () => {

          setAviso(
            ""
          )

        },

        5000
      )
    }


  /* ========================================================
     CARGAR USUARIOS
     ======================================================== */

  const cargarUsuarios =
    async (
      seleccionarId =
        null
    ) => {

      const respuesta =
        await listarUsuarios()


      const lista =
        obtenerListaUsuarios(
          respuesta
        )


      setUsuarios(
        lista
      )


      if (
        seleccionarId
      ) {

        const existe =
          lista.some(
            (usuario) =>
              String(
                usuario.id
              ) ===
              String(
                seleccionarId
              )
          )


        if (
          existe
        ) {

          setUsuarioSeleccionadoId(
            String(
              seleccionarId
            )
          )


          return lista
        }
      }


      if (
        usuarioSeleccionadoId
      ) {

        const sigueExistiendo =
          lista.some(
            (usuario) =>
              String(
                usuario.id
              ) ===
              String(
                usuarioSeleccionadoId
              )
          )


        if (
          sigueExistiendo
        ) {
          return lista
        }
      }


      const primerUsuarioNormal =
        lista.find(
          (usuario) =>
            usuario.role !==
            "admin"
        )


      const inicial =
        primerUsuarioNormal ||
        lista[0]


      if (
        inicial
      ) {

        setUsuarioSeleccionadoId(
          String(
            inicial.id
          )
        )

      } else {

        setUsuarioSeleccionadoId(
          ""
        )

      }


      return lista
    }


  /* ========================================================
     CARGAR CATALOGO
     ======================================================== */

  const cargarCatalogo =
    async () => {

      const respuesta =
        await obtenerCatalogoCursos()


      const lista =
        obtenerListaCursos(
          respuesta
        )


      setCursos(
        lista
      )


      return lista
    }


  /* ========================================================
     CARGAR PERMISOS
     ======================================================== */

  const cargarPermisos =
    async (
      userId,
      mostrarCarga =
        true
    ) => {

      if (
        !userId
      ) {

        setPermisos({
          cursos:
            new Set(),

          modulos:
            new Set()
        })


        return
      }


      if (
        mostrarCarga
      ) {

        setCargandoPermisos(
          true
        )
      }


      setError(
        ""
      )


      try {

        const respuesta =
          await obtenerPermisosUsuario(
            userId
          )


        setPermisos(
          normalizarPermisos(
            respuesta
          )
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        if (
          mostrarCarga
        ) {

          setCargandoPermisos(
            false
          )
        }
      }
    }


  /* ========================================================
     CARGAR RECUPERACIONES
     ======================================================== */

  const cargarRecuperaciones =
    async (
      estado =
        filtroRecuperacion
    ) => {

      setCargandoRecuperaciones(
        true
      )


      setErrorRecuperaciones(
        ""
      )


      try {

        const respuesta =
          await listarRecuperacionesPassword(
            estado
          )


        setRecuperaciones(
          obtenerListaRecuperaciones(
            respuesta
          )
        )

      } catch (
        problema
      ) {

        setRecuperaciones(
          []
        )


        setErrorRecuperaciones(
          getMessage(
            problema
          )
        )

      } finally {

        setCargandoRecuperaciones(
          false
        )
      }
    }


  /* ========================================================
     CARGA INICIAL
     ======================================================== */

  useEffect(
    () => {

      const cargar =
        async () => {

          setCargando(
            true
          )


          setError(
            ""
          )


          try {

            await Promise.all([
              cargarUsuarios(),
              cargarCatalogo()
            ])

          } catch (
            problema
          ) {

            setError(
              getMessage(
                problema
              )
            )

          } finally {

            setCargando(
              false
            )
          }
        }


      cargar()

    },

    []
  )


  /* ========================================================
     RECUPERACIONES SEGUN FILTRO
     ======================================================== */

  useEffect(
    () => {

      cargarRecuperaciones(
        filtroRecuperacion
      )

    },

    [
      filtroRecuperacion
    ]
  )


  /* ========================================================
     CAMBIO DE USUARIO
     ======================================================== */

  useEffect(
    () => {

      if (
        !usuarioSeleccionadoId
      ) {

        setPermisos({
          cursos:
            new Set(),

          modulos:
            new Set()
        })


        return
      }


      cargarPermisos(
        usuarioSeleccionadoId,
        true
      )

    },

    [
      usuarioSeleccionadoId
    ]
  )


  /* ========================================================
     REGISTRO
     ======================================================== */

  const abrirRegistro =
    () => {

      setErrorRegistro(
        ""
      )


      const empresaActual =
        getEmpresa()


      setNuevoUsuario({
        full_name:
          "",

        email:
          "",

        password:
          "",

        empresa:
          empresaActual ===
          "Mi empresa"
            ? ""
            : empresaActual
      })


      setMostrarRegistro(
        true
      )
    }


  const registrarNuevoUsuario =
    async () => {

      setErrorRegistro(
        ""
      )


      const nombre =
        String(
          nuevoUsuario.full_name ||
          ""
        ).trim()


      const correo =
        String(
          nuevoUsuario.email ||
          ""
        )
          .trim()
          .toLowerCase()


      const password =
        String(
          nuevoUsuario.password ||
          ""
        )


      const empresa =
        String(
          nuevoUsuario.empresa ||
          ""
        ).trim()


      if (
        !nombre
      ) {

        return setErrorRegistro(
          "Ingresa el nombre completo."
        )
      }


      if (
        !correo
      ) {

        return setErrorRegistro(
          "Ingresa el correo electrónico."
        )
      }


      const correoValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(
            correo
          )


      if (
        !correoValido
      ) {

        return setErrorRegistro(
          "Ingresa un correo electrónico válido."
        )
      }


      if (
        password.length <
        8
      ) {

        return setErrorRegistro(
          "La contraseña debe tener al menos 8 caracteres."
        )
      }


      if (
        !empresa
      ) {

        return setErrorRegistro(
          "Ingresa la empresa."
        )
      }


      setRegistrando(
        true
      )


      try {

        const resultado =
          await crearUsuario({
            full_name:
              nombre,

            email:
              correo,

            password,

            empresa
          })


        const usuarioCreado =
          resultado?.usuario


        await cargarUsuarios(
          usuarioCreado?.id ||
          null
        )


        setMostrarRegistro(
          false
        )


        setNuevoUsuario({
          full_name:
            "",

          email:
            "",

          password:
            "",

          empresa:
            getEmpresa()
        })


        mostrarAviso(
          resultado?.mensaje ||
          "Usuario registrado correctamente."
        )

      } catch (
        problema
      ) {

        setErrorRegistro(
          getMessage(
            problema
          )
        )

      } finally {

        setRegistrando(
          false
        )
      }
    }


  /* ========================================================
     EDITAR USUARIO
     ======================================================== */

  const abrirEdicion =
    () => {

      if (
        !usuarioSeleccionado
      ) {
        return
      }


      setErrorEdicion(
        ""
      )


      setUsuarioEdicion({
        full_name:
          usuarioSeleccionado.full_name ||
          "",

        empresa:
          usuarioSeleccionado.empresa ||
          ""
      })


      setMostrarEdicion(
        true
      )
    }


  const cerrarEdicion =
    () => {

      if (
        guardandoEdicion
      ) {
        return
      }


      setMostrarEdicion(
        false
      )


      setErrorEdicion(
        ""
      )
    }


  const guardarEdicion =
    async () => {

      if (
        !usuarioSeleccionado
      ) {
        return
      }


      setErrorEdicion(
        ""
      )


      const nombre =
        String(
          usuarioEdicion.full_name ||
          ""
        ).trim()


      const empresa =
        String(
          usuarioEdicion.empresa ||
          ""
        ).trim()


      if (
        !nombre
      ) {

        return setErrorEdicion(
          "Ingresa el nombre completo."
        )
      }


      if (
        nombre.length >
        150
      ) {

        return setErrorEdicion(
          "El nombre no puede superar los 150 caracteres."
        )
      }


      if (
        !empresa
      ) {

        return setErrorEdicion(
          "Ingresa la empresa."
        )
      }


      if (
        empresa.length >
        150
      ) {

        return setErrorEdicion(
          "La empresa no puede superar los 150 caracteres."
        )
      }


      setGuardandoEdicion(
        true
      )


      try {

        const resultado =
          await actualizarUsuario(
            usuarioSeleccionado.id,
            {
              full_name:
                nombre,

              empresa
            }
          )


        await cargarUsuarios(
          usuarioSeleccionado.id
        )


        setMostrarEdicion(
          false
        )


        setErrorEdicion(
          ""
        )


        mostrarAviso(
          resultado?.mensaje ||
          "Usuario actualizado correctamente."
        )

      } catch (
        problema
      ) {

        setErrorEdicion(
          getMessage(
            problema
          )
        )

      } finally {

        setGuardandoEdicion(
          false
        )
      }
    }


  /* ========================================================
     ESTADO
     ======================================================== */

  const solicitarCambioEstado =
    (
      usuario
    ) => {

      if (
        !usuario ||
        usuario.role ===
        "admin"
      ) {
        return
      }


      setError(
        ""
      )


      setUsuarioEstadoPendiente(
        usuario
      )
    }


  const cerrarCambioEstado =
    () => {

      if (
        cambiandoEstado
      ) {
        return
      }


      setUsuarioEstadoPendiente(
        null
      )
    }


  const confirmarCambioEstado =
    async () => {

      if (
        !usuarioEstadoPendiente ||
        usuarioEstadoPendiente.role ===
        "admin"
      ) {
        return
      }


      const nuevoEstado =
        usuarioEstadoPendiente.activo ===
        false


      setCambiandoEstado(
        true
      )


      setError(
        ""
      )


      try {

        const resultado =
          await cambiarEstadoUsuario(
            usuarioEstadoPendiente.id,
            nuevoEstado
          )


        await cargarUsuarios(
          usuarioEstadoPendiente.id
        )


        setUsuarioEstadoPendiente(
          null
        )


        mostrarAviso(
          resultado?.mensaje ||
          (
            nuevoEstado
              ? "Usuario reactivado correctamente."
              : "Usuario desactivado correctamente."
          )
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setCambiandoEstado(
          false
        )
      }
    }


  /* ========================================================
     CURSOS
     ======================================================== */

  const cambiarCurso =
    async (
      curso,
      activo
    ) => {

      if (
        !usuarioSeleccionado ||
        usuarioEsAdmin
      ) {
        return
      }


      const clave =
        `curso-${curso.id}`


      setGuardandoPermiso(
        clave
      )


      setError(
        ""
      )


      try {

        if (
          activo
        ) {

          await asignarCurso(
            usuarioSeleccionado.id,
            curso.id
          )

        } else {

          await quitarCurso(
            usuarioSeleccionado.id,
            curso.id
          )
        }


        await cargarPermisos(
          usuarioSeleccionado.id,
          false
        )


        mostrarAviso(
          activo
            ? `Curso "${curso.nombre}" asignado.`
            : `Curso "${curso.nombre}" retirado.`
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setGuardandoPermiso(
          ""
        )
      }
    }


  /* ========================================================
     MODULOS
     ======================================================== */

  const cambiarModulo =
    async (
      curso,
      modulo,
      activo
    ) => {

      if (
        !usuarioSeleccionado ||
        usuarioEsAdmin
      ) {
        return
      }


      const clave =
        `modulo-${modulo.id}`


      setGuardandoPermiso(
        clave
      )


      setError(
        ""
      )


      try {

        if (
          activo
        ) {

          await asignarModulo(
            usuarioSeleccionado.id,
            modulo.id
          )

        } else {

          await quitarModulo(
            usuarioSeleccionado.id,
            modulo.id
          )
        }


        await cargarPermisos(
          usuarioSeleccionado.id,
          false
        )


        mostrarAviso(
          activo
            ? `Módulo "${modulo.nombre}" habilitado.`
            : `Módulo "${modulo.nombre}" deshabilitado.`
        )

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setGuardandoPermiso(
          ""
        )
      }
    }


  /* ========================================================
     APROBAR RECUPERACION
     ======================================================== */

  const aprobarSolicitudRecuperacion =
    async (
      solicitud
    ) => {

      if (
        !solicitud?.id
      ) {
        return
      }


      const clave =
        `aprobar-${solicitud.id}`


      setAccionRecuperacion(
        clave
      )


      setErrorRecuperaciones(
        ""
      )


      try {

        const resultado =
          await aprobarRecuperacionPassword(
            solicitud.id
          )


        const codigo =
          String(
            resultado?.codigo ||
            resultado?.data?.codigo ||
            ""
          ).trim()


        if (
          !codigo
        ) {

          throw new Error(
            "La solicitud fue aprobada, pero el servidor no devolvió el código temporal."
          )
        }


        setCodigoGenerado({
          solicitudId:
            solicitud.id,

          email:
            solicitud.email ||
            resultado?.solicitud?.email ||
            "",

          nombre:
            obtenerNombreSolicitud(
              solicitud
            ),

          codigo,

          venceEnMinutos:
            Number(
              resultado?.vence_en_minutos ||
              15
            ),

          expiresAt:
            resultado?.expires_at ||
            resultado?.solicitud?.expires_at ||
            null,

          advertencia:
            resultado?.advertencia ||
            resultado?.warning ||
            "Guarda o entrega este código ahora. Por seguridad, RIMBERIO no almacena el código en texto visible."
        })


        await cargarRecuperaciones(
          filtroRecuperacion
        )


        mostrarAviso(
          resultado?.mensaje ||
          "Solicitud de recuperación aprobada."
        )

      } catch (
        problema
      ) {

        setErrorRecuperaciones(
          getMessage(
            problema
          )
        )

      } finally {

        setAccionRecuperacion(
          ""
        )
      }
    }


  /* ========================================================
     RECHAZAR RECUPERACION
     ======================================================== */

  const abrirRechazoRecuperacion =
    (
      solicitud
    ) => {

      if (
        !solicitud?.id
      ) {
        return
      }


      setSolicitudRechazo(
        solicitud
      )
    }


  const cerrarRechazoRecuperacion =
    () => {

      if (
        accionRecuperacion.startsWith(
          "rechazar-"
        )
      ) {
        return
      }


      setSolicitudRechazo(
        null
      )
    }


  const confirmarRechazoRecuperacion =
    async () => {

      if (
        !solicitudRechazo?.id
      ) {
        return
      }


      const clave =
        `rechazar-${solicitudRechazo.id}`


      setAccionRecuperacion(
        clave
      )


      setErrorRecuperaciones(
        ""
      )


      try {

        const resultado =
          await rechazarRecuperacionPassword(
            solicitudRechazo.id
          )


        setSolicitudRechazo(
          null
        )


        await cargarRecuperaciones(
          filtroRecuperacion
        )


        mostrarAviso(
          resultado?.mensaje ||
          "Solicitud de recuperación rechazada."
        )

      } catch (
        problema
      ) {

        setErrorRecuperaciones(
          getMessage(
            problema
          )
        )

      } finally {

        setAccionRecuperacion(
          ""
        )
      }
    }


  /* ========================================================
     COPIAR CODIGO
     ======================================================== */

  const copiarCodigo =
    async () => {

      if (
        !codigoGenerado?.codigo
      ) {
        return
      }


      try {

        await navigator.clipboard.writeText(
          codigoGenerado.codigo
        )


        mostrarAviso(
          "Código copiado al portapapeles."
        )

      } catch {

        mostrarAviso(
          `Código: ${codigoGenerado.codigo}`
        )
      }
    }


  /* ========================================================
     RENDER
     ======================================================== */

  return (
    <>

      {/* ====================================================
          CABECERA
          ==================================================== */}

      <div className="topbar">

        <div>

          <h1>
            Administración de usuarios
          </h1>


          <p>
            Registra usuarios, edita su información,
            activa o desactiva cuentas, administra
            recuperaciones de contraseña y controla
            el acceso a cursos y módulos de RIMBERIO.
          </p>

        </div>


        <div className="topbar-actions">

          <button
            type="button"
            className="btn"
            onClick={
              abrirRegistro
            }
          >
            Registrar usuario
          </button>


          <div className="topbar-user">

            <span className="avatar">
              {getInitials()}
            </span>


            <span>
              {getUserName()}
            </span>

          </div>

        </div>

      </div>


      {/* ====================================================
          MENSAJES
          ==================================================== */}

      {aviso && (

        <div className="alert alert-success">
          {aviso}
        </div>

      )}


      {error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}


      {/* ====================================================
          RECUPERACION DE CONTRASEÑAS
          ==================================================== */}

      <div
        className="card"
        style={{
          marginBottom:
            "20px"
        }}
      >

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-start",

            gap:
              "16px",

            flexWrap:
              "wrap",

            marginBottom:
              "16px"
          }}
        >

          <div>

            <div className="chart-title">
              Recuperación de contraseñas
            </div>


            <div
              className="muted"
              style={{
                marginTop:
                  "4px"
              }}
            >
              Revisa las solicitudes enviadas
              por usuarios que olvidaron su contraseña.
            </div>

          </div>


          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "8px",

              flexWrap:
                "wrap"
            }}
          >

            <select
              value={
                filtroRecuperacion
              }
              onChange={
                (event) =>
                  setFiltroRecuperacion(
                    event.target.value
                  )
              }
              disabled={
                cargandoRecuperaciones ||
                Boolean(
                  accionRecuperacion
                )
              }
              style={{
                minHeight:
                  "38px",

                padding:
                  "0 10px",

                border:
                  "1px solid #cbd5e1",

                borderRadius:
                  "8px",

                background:
                  "#ffffff"
              }}
            >

              <option value="pendiente">
                Pendientes
              </option>

              <option value="aprobado">
                Aprobadas
              </option>

              <option value="completado">
                Completadas
              </option>

              <option value="rechazado">
                Rechazadas
              </option>

              <option value="vencido">
                Vencidas
              </option>

              <option value="">
                Todas
              </option>

            </select>


            <button
              type="button"
              className="btn btn-light btn-sm"
              onClick={
                () =>
                  cargarRecuperaciones(
                    filtroRecuperacion
                  )
              }
              disabled={
                cargandoRecuperaciones ||
                Boolean(
                  accionRecuperacion
                )
              }
            >

              {cargandoRecuperaciones
                ? "Actualizando..."
                : "Actualizar"}

            </button>

          </div>

        </div>


        {errorRecuperaciones && (

          <div
            className="alert alert-error"
            style={{
              marginBottom:
                "16px"
            }}
          >
            {errorRecuperaciones}
          </div>

        )}


        {cargandoRecuperaciones ? (

          <div className="loading">
            Cargando solicitudes de recuperación...
          </div>

        ) : recuperaciones.length ===
          0 ? (

          <div className="empty">
            No hay solicitudes en este estado.
          </div>

        ) : (

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",

              gap:
                "12px"
            }}
          >

            {recuperaciones.map(
              (solicitud) => {

                const estado =
                  String(
                    solicitud?.estado ||
                    ""
                  ).toLowerCase()


                const pendiente =
                  estado ===
                  "pendiente"


                const aprobada =
                  estado ===
                  "aprobado"


                const procesandoAprobacion =
                  accionRecuperacion ===
                  `aprobar-${solicitud.id}`


                const procesandoRechazo =
                  accionRecuperacion ===
                  `rechazar-${solicitud.id}`


                return (
                  <div
                    key={
                      solicitud.id
                    }
                    style={{
                      border:
                        "1px solid #e2e8f0",

                      borderRadius:
                        "12px",

                      padding:
                        "14px",

                      background:
                        "#ffffff"
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "flex-start",

                        gap:
                          "12px"
                      }}
                    >

                      <div
                        style={{
                          minWidth:
                            0
                        }}
                      >

                        <div
                          style={{
                            fontWeight:
                              700,

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            whiteSpace:
                              "nowrap"
                          }}
                        >

                          {obtenerNombreSolicitud(
                            solicitud
                          )}

                        </div>


                        <div
                          className="muted"
                          style={{
                            marginTop:
                              "4px",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            whiteSpace:
                              "nowrap"
                          }}
                        >

                          {solicitud.email}

                        </div>

                      </div>


                      <span
                        className="chip"
                        style={{
                          ...estiloEstadoRecuperacion(
                            estado
                          ),

                          fontWeight:
                            700,

                          flexShrink:
                            0
                        }}
                      >

                        {etiquetaEstadoRecuperacion(
                          estado
                        )}

                      </span>

                    </div>


                    <div
                      className="muted"
                      style={{
                        marginTop:
                          "12px",

                        fontSize:
                          "12px",

                        display:
                          "grid",

                        gap:
                          "4px"
                      }}
                    >

                      <div>
                        Solicitud:{" "}
                        {formatoFecha(
                          solicitud.created_at
                        )}
                      </div>


                      {solicitud.approved_at && (

                        <div>
                          Aprobada:{" "}
                          {formatoFecha(
                            solicitud.approved_at
                          )}
                        </div>

                      )}


                      {solicitud.expires_at && (

                        <div>
                          Vence:{" "}
                          {formatoFecha(
                            solicitud.expires_at
                          )}
                        </div>

                      )}


                      {Number.isFinite(
                        Number(
                          solicitud.intentos
                        )
                      ) && (

                        <div>
                          Intentos:{" "}
                          {Number(
                            solicitud.intentos
                          )}
                        </div>

                      )}

                    </div>


                    {(pendiente ||
                      aprobada) && (

                      <div
                        style={{
                          display:
                            "flex",

                          gap:
                            "8px",

                          flexWrap:
                            "wrap",

                          marginTop:
                            "14px"
                        }}
                      >

                        {pendiente && (

                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={
                              () =>
                                aprobarSolicitudRecuperacion(
                                  solicitud
                                )
                            }
                            disabled={
                              Boolean(
                                accionRecuperacion
                              )
                            }
                          >

                            {procesandoAprobacion
                              ? "Aprobando..."
                              : "Aprobar"}

                          </button>

                        )}


                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={
                            () =>
                              abrirRechazoRecuperacion(
                                solicitud
                              )
                          }
                          disabled={
                            Boolean(
                              accionRecuperacion
                            )
                          }
                          style={{
                            border:
                              "1px solid #fecaca",

                            color:
                              "#b91c1c",

                            background:
                              "#ffffff"
                          }}
                        >

                          {procesandoRechazo
                            ? "Rechazando..."
                            : aprobada
                              ? "Rechazar e invalidar"
                              : "Rechazar"}

                        </button>

                      </div>

                    )}


                    {aprobada && (

                      <div
                        className="muted"
                        style={{
                          marginTop:
                            "10px",

                          fontSize:
                            "12px"
                        }}
                      >

                        El código ya fue emitido.
                        Si lo rechazas ahora,
                        el código quedará invalidado.

                      </div>

                    )}

                  </div>
                )
              }
            )}

          </div>

        )}

      </div>


      {/* ====================================================
          CONTENIDO
          ==================================================== */}

      {cargando ? (

        <div className="card">

          <div className="loading">
            Cargando administración...
          </div>

        </div>

      ) : (

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",

            gap:
              "20px",

            alignItems:
              "start"
          }}
        >

          {/* =================================================
              LISTA DE USUARIOS
              ================================================= */}

          <div className="card">

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap:
                  "12px",

                marginBottom:
                  "16px"
              }}
            >

              <div>

                <div className="chart-title">
                  Usuarios
                </div>


                <div className="muted">

                  {usuarios.length} registrados ·{" "}

                  {
                    usuarios.filter(
                      (usuario) =>
                        usuario.activo !==
                        false
                    ).length
                  } activos ·{" "}

                  {
                    usuarios.filter(
                      (usuario) =>
                        usuario.activo ===
                        false
                    ).length
                  } desactivados

                </div>

              </div>

            </div>


            <div className="field">

              <input
                type="search"
                value={
                  buscar
                }
                placeholder="Buscar por nombre, correo o empresa..."
                onChange={
                  (event) =>
                    setBuscar(
                      event.target.value
                    )
                }
              />

            </div>


            <div
              style={{
                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "8px",

                marginTop:
                  "12px",

                maxHeight:
                  "620px",

                overflowY:
                  "auto"
              }}
            >

              {usuariosFiltrados.length ===
                0 && (

                <div className="empty">
                  No se encontraron usuarios.
                </div>

              )}


              {usuariosFiltrados.map(
                (usuario) => {

                  const seleccionado =
                    String(
                      usuario.id
                    ) ===
                    String(
                      usuarioSeleccionadoId
                    )


                  const esAdministrador =
                    usuario.role ===
                    "admin"


                  const esActivo =
                    usuario.activo !==
                    false


                  return (
                    <button
                      type="button"
                      key={
                        usuario.id
                      }
                      onClick={
                        () =>
                          setUsuarioSeleccionadoId(
                            String(
                              usuario.id
                            )
                          )
                      }
                      style={{
                        width:
                          "100%",

                        textAlign:
                          "left",

                        padding:
                          "14px",

                        borderRadius:
                          "10px",

                        border:
                          seleccionado
                            ? "2px solid var(--primary, #2563eb)"
                            : "1px solid #e5e7eb",

                        background:
                          seleccionado
                            ? "rgba(37, 99, 235, 0.06)"
                            : esActivo
                              ? "transparent"
                              : "#f8fafc",

                        opacity:
                          esActivo
                            ? 1
                            : 0.72,

                        cursor:
                          "pointer"
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "space-between",

                          gap:
                            "10px"
                        }}
                      >

                        <div
                          style={{
                            minWidth:
                              0
                          }}
                        >

                          <div
                            style={{
                              fontWeight:
                                700,

                              overflow:
                                "hidden",

                              textOverflow:
                                "ellipsis",

                              whiteSpace:
                                "nowrap"
                            }}
                          >

                            {usuario.full_name ||
                              usuario.email ||
                              "Usuario"}

                          </div>


                          <div
                            className="muted"
                            style={{
                              marginTop:
                                "3px",

                              overflow:
                                "hidden",

                              textOverflow:
                                "ellipsis",

                              whiteSpace:
                                "nowrap"
                            }}
                          >

                            {usuario.email}

                          </div>


                          {usuario.empresa && (

                            <div
                              className="muted"
                              style={{
                                marginTop:
                                  "3px"
                              }}
                            >

                              {usuario.empresa}

                            </div>

                          )}

                        </div>


                        <div
                          style={{
                            display:
                              "flex",

                            flexDirection:
                              "column",

                            alignItems:
                              "flex-end",

                            gap:
                              "6px",

                            flexShrink:
                              0
                          }}
                        >

                          <span
                            className={
                              esAdministrador
                                ? "chip rol-admin"
                                : "chip"
                            }
                          >

                            {esAdministrador
                              ? "Admin"
                              : "Usuario"}

                          </span>


                          <span
                            className="chip"
                            style={{
                              border:
                                esActivo
                                  ? "1px solid #bbf7d0"
                                  : "1px solid #fecaca",

                              background:
                                esActivo
                                  ? "#f0fdf4"
                                  : "#fef2f2",

                              color:
                                esActivo
                                  ? "#166534"
                                  : "#991b1b",

                              fontWeight:
                                700
                            }}
                          >

                            {esActivo
                              ? "● Activo"
                              : "○ Desactivado"}

                          </span>

                        </div>

                      </div>

                    </button>
                  )
                }
              )}

            </div>

          </div>


          {/* =================================================
              PERMISOS
              ================================================= */}

          <div className="card">

            {!usuarioSeleccionado ? (

              <div className="empty">
                Selecciona un usuario para administrar sus permisos.
              </div>

            ) : (

              <>

                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "flex-start",

                    gap:
                      "16px",

                    marginBottom:
                      "20px"
                  }}
                >

                  <div>

                    <div className="chart-title">
                      Permisos
                    </div>


                    <h3
                      style={{
                        margin:
                          "8px 0 2px"
                      }}
                    >

                      {usuarioSeleccionado.full_name ||
                        usuarioSeleccionado.email}

                    </h3>


                    <div className="muted">
                      {usuarioSeleccionado.email}
                    </div>


                    {usuarioSeleccionado.empresa && (

                      <div className="muted">

                        Empresa:{" "}
                        {usuarioSeleccionado.empresa}

                      </div>

                    )}

                  </div>


                  <div
                    style={{
                      display:
                        "flex",

                      flexDirection:
                        "column",

                      alignItems:
                        "flex-end",

                      gap:
                        "8px",

                      flexShrink:
                        0
                    }}
                  >

                    <span
                      className={
                        usuarioEsAdmin
                          ? "chip rol-admin"
                          : "chip"
                      }
                    >

                      {usuarioEsAdmin
                        ? "Administrador"
                        : "Usuario"}

                    </span>


                    <span
                      className="chip"
                      style={{
                        border:
                          usuarioEstaActivo
                            ? "1px solid #bbf7d0"
                            : "1px solid #fecaca",

                        background:
                          usuarioEstaActivo
                            ? "#f0fdf4"
                            : "#fef2f2",

                        color:
                          usuarioEstaActivo
                            ? "#166534"
                            : "#991b1b",

                        fontWeight:
                          700
                      }}
                    >

                      {usuarioEstaActivo
                        ? "● Activo"
                        : "○ Desactivado"}

                    </span>


                    <button
                      type="button"
                      onClick={
                        abrirEdicion
                      }
                      disabled={
                        guardandoEdicion ||
                        cambiandoEstado
                      }
                      style={{
                        minWidth:
                          "122px",

                        padding:
                          "9px 12px",

                        borderRadius:
                          "8px",

                        border:
                          "1px solid #cbd5e1",

                        background:
                          "#ffffff",

                        color:
                          "#334155",

                        fontWeight:
                          700,

                        cursor:
                          guardandoEdicion ||
                          cambiandoEstado
                            ? "not-allowed"
                            : "pointer",

                        opacity:
                          guardandoEdicion ||
                          cambiandoEstado
                            ? 0.65
                            : 1
                      }}
                    >

                      Editar usuario

                    </button>


                    {!usuarioEsAdmin && (

                      <button
                        type="button"
                        onClick={
                          () =>
                            solicitarCambioEstado(
                              usuarioSeleccionado
                            )
                        }
                        disabled={
                          cambiandoEstado
                        }
                        style={{
                          minWidth:
                            "122px",

                          padding:
                            "9px 12px",

                          borderRadius:
                            "8px",

                          border:
                            usuarioEstaActivo
                              ? "1px solid #fecaca"
                              : "1px solid #bbf7d0",

                          background:
                            usuarioEstaActivo
                              ? "#fff"
                              : "#f0fdf4",

                          color:
                            usuarioEstaActivo
                              ? "#b91c1c"
                              : "#166534",

                          fontWeight:
                            700,

                          cursor:
                            cambiandoEstado
                              ? "not-allowed"
                              : "pointer",

                          opacity:
                            cambiandoEstado
                              ? 0.65
                              : 1
                        }}
                      >

                        {usuarioEstaActivo
                          ? "Desactivar"
                          : "Reactivar"}

                      </button>

                    )}

                  </div>

                </div>


                {usuarioEsAdmin && (

                  <div className="alert alert-success">

                    El administrador tiene acceso completo
                    al sistema. No necesita asignaciones
                    individuales de cursos o módulos.

                  </div>

                )}


                {!usuarioEsAdmin &&
                  !usuarioEstaActivo && (

                  <div
                    className="alert alert-error"
                    style={{
                      marginBottom:
                        "16px"
                    }}
                  >

                    Esta cuenta está desactivada.
                    El usuario no puede utilizar RIMBERIO,
                    pero sus cursos, módulos, datos e historial
                    se conservan.

                  </div>

                )}


                {cargandoPermisos ? (

                  <div className="loading">
                    Cargando permisos...
                  </div>

                ) : cursos.length ===
                  0 ? (

                  <div className="empty">
                    No existen cursos configurados.
                  </div>

                ) : (

                  <div
                    style={{
                      display:
                        "flex",

                      flexDirection:
                        "column",

                      gap:
                        "16px"
                    }}
                  >

                    {cursos.map(
                      (curso) => {

                        const cursoId =
                          String(
                            curso.id
                          )


                        const cursoAsignado =
                          usuarioEsAdmin ||
                          permisos.cursos.has(
                            cursoId
                          )


                        const modulosCurso =
                          Array.isArray(
                            curso.modulos
                          )
                            ? curso.modulos
                            : Array.isArray(
                                curso.modules
                              )
                              ? curso.modules
                              : []


                        const guardandoCurso =
                          guardandoPermiso ===
                          `curso-${curso.id}`


                        return (
                          <div
                            key={
                              curso.id
                            }
                            style={{
                              border:
                                "1px solid #e5e7eb",

                              borderRadius:
                                "12px",

                              overflow:
                                "hidden"
                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",

                                justifyContent:
                                  "space-between",

                                alignItems:
                                  "center",

                                gap:
                                  "14px",

                                padding:
                                  "14px 16px",

                                background:
                                  "#f8fafc"
                              }}
                            >

                              <div
                                style={{
                                  minWidth:
                                    0
                                }}
                              >

                                <div
                                  style={{
                                    fontWeight:
                                      700
                                  }}
                                >

                                  {curso.nombre}

                                </div>


                                {curso.descripcion && (

                                  <div
                                    className="muted"
                                    style={{
                                      marginTop:
                                        "3px"
                                    }}
                                  >

                                    {curso.descripcion}

                                  </div>

                                )}

                              </div>


                              <button
                                type="button"
                                className={
                                  cursoAsignado
                                    ? "btn btn-sm"
                                    : "btn btn-light btn-sm"
                                }
                                aria-pressed={
                                  cursoAsignado
                                }
                                disabled={
                                  usuarioEsAdmin ||
                                  guardandoPermiso !==
                                  ""
                                }
                                onClick={
                                  () =>
                                    cambiarCurso(
                                      curso,
                                      !cursoAsignado
                                    )
                                }
                                style={{
                                  minWidth:
                                    "128px",

                                  flexShrink:
                                    0,

                                  display:
                                    "inline-flex",

                                  alignItems:
                                    "center",

                                  justifyContent:
                                    "center",

                                  gap:
                                    "6px",

                                  fontWeight:
                                    700
                                }}
                              >

                                {guardandoCurso
                                  ? "Guardando..."
                                  : cursoAsignado
                                    ? "✓ Acceso activo"
                                    : "Dar acceso"}

                              </button>

                            </div>


                            <div
                              style={{
                                padding:
                                  "8px 16px 14px"
                              }}
                            >

                              {modulosCurso.length ===
                                0 ? (

                                <div className="muted">
                                  Este curso todavía no tiene módulos.
                                </div>

                              ) : (

                                modulosCurso.map(
                                  (modulo) => {

                                    const moduloId =
                                      String(
                                        modulo.id
                                      )


                                    const moduloAsignado =
                                      usuarioEsAdmin ||
                                      permisos.modulos.has(
                                        moduloId
                                      )


                                    const guardandoEste =
                                      guardandoPermiso ===
                                      `modulo-${modulo.id}`


                                    return (
                                      <div
                                        key={
                                          modulo.id
                                        }
                                        style={{
                                          display:
                                            "flex",

                                          justifyContent:
                                            "space-between",

                                          alignItems:
                                            "center",

                                          gap:
                                            "16px",

                                          padding:
                                            "12px 0",

                                          borderBottom:
                                            "1px solid #f1f5f9"
                                        }}
                                      >

                                        <div
                                          style={{
                                            minWidth:
                                              0,

                                            paddingRight:
                                              "8px"
                                          }}
                                        >

                                          <div
                                            style={{
                                              fontWeight:
                                                600
                                            }}
                                          >

                                            {modulo.nombre}

                                          </div>


                                          {modulo.descripcion && (

                                            <div
                                              className="muted"
                                              style={{
                                                marginTop:
                                                  "2px"
                                              }}
                                            >

                                              {modulo.descripcion}

                                            </div>

                                          )}


                                          {modulo.clave && (

                                            <code
                                              style={{
                                                display:
                                                  "inline-block",

                                                marginTop:
                                                  "4px",

                                                fontSize:
                                                  "11px"
                                              }}
                                            >

                                              {modulo.clave}

                                            </code>

                                          )}

                                        </div>


                                        <button
                                          type="button"
                                          className={
                                            moduloAsignado
                                              ? "btn btn-sm"
                                              : "btn btn-light btn-sm"
                                          }
                                          aria-pressed={
                                            moduloAsignado
                                          }
                                          disabled={
                                            usuarioEsAdmin ||
                                            guardandoPermiso !==
                                            ""
                                          }
                                          onClick={
                                            () =>
                                              cambiarModulo(
                                                curso,
                                                modulo,
                                                !moduloAsignado
                                              )
                                          }
                                          style={{
                                            minWidth:
                                              "118px",

                                            flexShrink:
                                              0,

                                            display:
                                              "inline-flex",

                                            alignItems:
                                              "center",

                                            justifyContent:
                                              "center",

                                            gap:
                                              "6px",

                                            fontWeight:
                                              700
                                          }}
                                        >

                                          {guardandoEste
                                            ? "Guardando..."
                                            : moduloAsignado
                                              ? "✓ Permitido"
                                              : "Permitir"}

                                        </button>

                                      </div>
                                    )
                                  }
                                )

                              )}

                            </div>

                          </div>
                        )
                      }
                    )}

                  </div>

                )}

              </>
            )}

          </div>

        </div>

      )}


      {/* ====================================================
          MODAL CODIGO
          ==================================================== */}

      {codigoGenerado && (

        <Modal
          title="Recuperación autorizada"
          onClose={
            () =>
              setCodigoGenerado(
                null
              )
          }
          footer={
            (cerrar) => (
              <>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={
                    copiarCodigo
                  }
                >
                  Copiar código
                </button>


                <button
                  type="button"
                  className="btn"
                  onClick={
                    cerrar
                  }
                >
                  Listo
                </button>

              </>
            )
          }
        >

          <p
            className="muted"
            style={{
              marginTop:
                0,

              marginBottom:
                "16px"
            }}
          >

            Entrega este código únicamente
            al usuario que solicitó la recuperación.

          </p>


          <div
            style={{
              padding:
                "12px",

              borderRadius:
                "8px",

              background:
                "#f8fafc"
            }}
          >

            <strong>
              {codigoGenerado.nombre}
            </strong>


            <div
              className="muted"
              style={{
                marginTop:
                  "4px"
              }}
            >

              {codigoGenerado.email}

            </div>

          </div>


          <div
            style={{
              marginTop:
                "18px",

              textAlign:
                "center"
            }}
          >

            <div className="muted">
              Código temporal
            </div>


            <div
              style={{
                marginTop:
                  "8px",

                fontSize:
                  "34px",

                lineHeight:
                  1,

                fontWeight:
                  800,

                letterSpacing:
                  "8px",

                fontFamily:
                  "monospace"
              }}
            >

              {codigoGenerado.codigo}

            </div>


            <div
              className="muted"
              style={{
                marginTop:
                  "12px"
              }}
            >

              Válido aproximadamente{" "}
              {codigoGenerado.venceEnMinutos} minutos.

            </div>


            {codigoGenerado.expiresAt && (

              <div
                className="muted"
                style={{
                  marginTop:
                    "4px"
                }}
              >

                Vence:{" "}
                {formatoFecha(
                  codigoGenerado.expiresAt
                )}

              </div>

            )}

          </div>


          <div
            className="alert alert-success"
            style={{
              marginTop:
                "18px"
            }}
          >

            {codigoGenerado.advertencia}

          </div>


          <div
            className="muted"
            style={{
              marginTop:
                "12px",

              fontSize:
                "12px"
            }}
          >

            El administrador no conoce ni define
            la nueva contraseña. El usuario la crea
            personalmente usando este código.

          </div>

        </Modal>

      )}


      {/* ====================================================
          MODAL RECHAZAR RECUPERACION
          ==================================================== */}

      {solicitudRechazo && (

        <Modal
          title="Rechazar recuperación"
          onClose={
            cerrarRechazoRecuperacion
          }
          footer={
            (cerrar) => (
              <>

                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={
                    accionRecuperacion.startsWith(
                      "rechazar-"
                    )
                  }
                  onClick={
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    accionRecuperacion.startsWith(
                      "rechazar-"
                    )
                  }
                  onClick={
                    confirmarRechazoRecuperacion
                  }
                  style={{
                    border:
                      "1px solid #b91c1c",

                    background:
                      "#b91c1c",

                    color:
                      "#ffffff"
                  }}
                >

                  {accionRecuperacion.startsWith(
                    "rechazar-"
                  )
                    ? "Rechazando..."
                    : "Rechazar solicitud"}

                </button>

              </>
            )
          }
        >

          <p
            style={{
              marginTop:
                0
            }}
          >

            ¿Confirmas que deseas rechazar
            esta solicitud de recuperación
            de contraseña?

          </p>


          <div
            style={{
              padding:
                "12px",

              borderRadius:
                "8px",

              background:
                "#f8fafc"
            }}
          >

            <strong>

              {obtenerNombreSolicitud(
                solicitudRechazo
              )}

            </strong>


            <div
              className="muted"
              style={{
                marginTop:
                  "4px"
              }}
            >

              {solicitudRechazo.email}

            </div>

          </div>


          {String(
            solicitudRechazo.estado ||
            ""
          ).toLowerCase() ===
            "aprobado" && (

            <div
              className="alert alert-error"
              style={{
                marginTop:
                  "16px"
              }}
            >

              Esta solicitud ya estaba aprobada.
              Al rechazarla, el código temporal
              quedará invalidado.

            </div>

          )}

        </Modal>

      )}


      {/* ====================================================
          MODAL EDITAR
          ==================================================== */}

      {mostrarEdicion &&
        usuarioSeleccionado && (

        <Modal
          title="Editar usuario"
          onClose={
            cerrarEdicion
          }
          footer={
            (cerrar) => (
              <>

                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={
                    guardandoEdicion
                  }
                  onClick={
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    guardandoEdicion
                  }
                  onClick={
                    guardarEdicion
                  }
                >

                  {guardandoEdicion
                    ? "Guardando..."
                    : "Guardar cambios"}

                </button>

              </>
            )
          }
        >

          <p
            className="muted"
            style={{
              marginBottom:
                "18px"
            }}
          >

            Modifica el nombre y la empresa
            del usuario. El correo, contraseña,
            estado y permisos no se cambiarán.

          </p>


          <div className="field">

            <label>
              Nombre completo
            </label>


            <input
              type="text"
              value={
                usuarioEdicion.full_name
              }
              maxLength={
                150
              }
              autoFocus
              disabled={
                guardandoEdicion
              }
              onChange={
                (event) =>
                  setUsuarioEdicion({
                    ...usuarioEdicion,

                    full_name:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Correo electrónico
            </label>


            <input
              type="email"
              value={
                usuarioSeleccionado.email ||
                ""
              }
              disabled
              readOnly
            />


            <span className="muted">
              El correo no se modifica desde esta opción.
            </span>

          </div>


          <div className="field">

            <label>
              Empresa
            </label>


            <input
              type="text"
              value={
                usuarioEdicion.empresa
              }
              maxLength={
                150
              }
              disabled={
                guardandoEdicion
              }
              onChange={
                (event) =>
                  setUsuarioEdicion({
                    ...usuarioEdicion,

                    empresa:
                      event.target.value
                  })
              }
            />


            <span className="muted">

              Cambiar la empresa puede modificar
              qué CSV internos compartidos puede ver
              este usuario.

            </span>

          </div>


          <div
            style={{
              padding:
                "12px",

              marginTop:
                "10px",

              borderRadius:
                "8px",

              background:
                "#f8fafc",

              fontSize:
                "13px"
            }}
          >

            <strong>
              Se conservará sin cambios
            </strong>


            <div
              className="muted"
              style={{
                marginTop:
                  "4px"
              }}
            >

              Correo, contraseña, rol, estado
              de la cuenta, cursos, módulos,
              permisos, CSV, proyectos e historial.

            </div>

          </div>


          {errorEdicion && (

            <div
              className="alert alert-error"
              style={{
                marginTop:
                  "16px"
              }}
            >

              {errorEdicion}

            </div>

          )}

        </Modal>

      )}


      {/* ====================================================
          MODAL ESTADO
          ==================================================== */}

      {usuarioEstadoPendiente && (

        <Modal
          title={
            usuarioEstadoPendiente.activo ===
            false
              ? "Reactivar usuario"
              : "Desactivar usuario"
          }
          onClose={
            cerrarCambioEstado
          }
          footer={
            (cerrar) => (
              <>

                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={
                    cambiandoEstado
                  }
                  onClick={
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    cambiandoEstado
                  }
                  onClick={
                    confirmarCambioEstado
                  }
                  style={{
                    border:
                      usuarioEstadoPendiente.activo ===
                      false
                        ? undefined
                        : "1px solid #b91c1c",

                    background:
                      usuarioEstadoPendiente.activo ===
                      false
                        ? undefined
                        : "#b91c1c",

                    color:
                      "#ffffff"
                  }}
                >

                  {cambiandoEstado
                    ? "Guardando..."
                    : usuarioEstadoPendiente.activo ===
                      false
                      ? "Reactivar usuario"
                      : "Desactivar usuario"}

                </button>

              </>
            )
          }
        >

          <p
            style={{
              marginTop:
                0
            }}
          >

            {usuarioEstadoPendiente.activo ===
            false
              ? "El usuario podrá volver a iniciar sesión y conservará los mismos permisos que tenía antes."
              : "El usuario dejará de poder utilizar RIMBERIO. No se eliminarán sus datos, cursos, módulos, CSV, proyectos ni historial."}

          </p>


          <div
            style={{
              padding:
                "12px",

              borderRadius:
                "8px",

              background:
                "#f8fafc"
            }}
          >

            <strong>

              {usuarioEstadoPendiente.full_name ||
                usuarioEstadoPendiente.email}

            </strong>


            <div
              className="muted"
              style={{
                marginTop:
                  "4px"
              }}
            >

              {usuarioEstadoPendiente.email}

            </div>

          </div>

        </Modal>

      )}


      {/* ====================================================
          MODAL REGISTRAR
          ==================================================== */}

      {mostrarRegistro && (

        <Modal
          title="Registrar usuario"
          onClose={
            () => {

              if (
                registrando
              ) {
                return
              }


              setMostrarRegistro(
                false
              )


              setErrorRegistro(
                ""
              )
            }
          }
          footer={
            (cerrar) => (
              <>

                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={
                    registrando
                  }
                  onClick={
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    registrando
                  }
                  onClick={
                    registrarNuevoUsuario
                  }
                >

                  {registrando
                    ? "Registrando..."
                    : "Registrar usuario"}

                </button>

              </>
            )
          }
        >

          <p
            className="muted"
            style={{
              marginBottom:
                "18px"
            }}
          >

            Crea una nueva cuenta de RIMBERIO.
            Después podrás seleccionar al usuario
            y asignarle los cursos y módulos
            que necesite.

          </p>


          <div className="field">

            <label>
              Nombre completo
            </label>


            <input
              type="text"
              value={
                nuevoUsuario.full_name
              }
              placeholder="Ej. Juan Pérez"
              autoFocus
              disabled={
                registrando
              }
              onChange={
                (event) =>
                  setNuevoUsuario({
                    ...nuevoUsuario,

                    full_name:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Correo electrónico
            </label>


            <input
              type="email"
              value={
                nuevoUsuario.email
              }
              placeholder="juan@correo.com"
              disabled={
                registrando
              }
              onChange={
                (event) =>
                  setNuevoUsuario({
                    ...nuevoUsuario,

                    email:
                      event.target.value
                  })
              }
            />

          </div>


          <div className="field">

            <label>
              Contraseña temporal
            </label>


            <input
              type="password"
              value={
                nuevoUsuario.password
              }
              placeholder="Mínimo 8 caracteres"
              disabled={
                registrando
              }
              onChange={
                (event) =>
                  setNuevoUsuario({
                    ...nuevoUsuario,

                    password:
                      event.target.value
                  })
              }
            />


            <span className="muted">
              El usuario utilizará esta contraseña
              para iniciar sesión.
            </span>

          </div>


          <div className="field">

            <label>
              Empresa
            </label>


            <input
              type="text"
              value={
                nuevoUsuario.empresa
              }
              placeholder="Mi Restaurante"
              disabled={
                registrando
              }
              onChange={
                (event) =>
                  setNuevoUsuario({
                    ...nuevoUsuario,

                    empresa:
                      event.target.value
                  })
              }
            />


            <span className="muted">

              Los CSV propios se compartirán
              con los usuarios que pertenezcan
              a esta misma empresa.

            </span>

          </div>


          <div
            style={{
              padding:
                "12px",

              marginTop:
                "10px",

              borderRadius:
                "8px",

              background:
                "#f8fafc",

              fontSize:
                "13px"
            }}
          >

            <strong>
              Después del registro
            </strong>


            <div
              className="muted"
              style={{
                marginTop:
                  "4px"
              }}
            >

              La cuenta se crea activa y sin permisos
              de cursos. Selecciona al nuevo usuario
              en esta misma pantalla y habilita solamente
              los módulos que necesite.

            </div>

          </div>


          {errorRegistro && (

            <div
              className="alert alert-error"
              style={{
                marginTop:
                  "16px"
              }}
            >

              {errorRegistro}

            </div>

          )}

        </Modal>

      )}

    </>
  )
}


export default AdminUsuarios