import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  crearUsuario,
  listarUsuarios,
  obtenerCatalogoCursos,
  obtenerPermisosUsuario,
  asignarCurso,
  quitarCurso,
  asignarModulo,
  quitarModulo,
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


/* ==========================================================
   NORMALIZAR PERMISOS
   ========================================================== */

const normalizarPermisos = (respuesta) => {
  /*
   * El backend puede devolver:
   *
   * {
   *   user_id,
   *   permisos: { ... }
   * }
   *
   * o api.js puede devolver directamente:
   *
   * {
   *   cursos: [...],
   *   modulos: [...]
   * }
   *
   * Soportamos ambas formas.
   */
  const origen =
    respuesta?.permisos ??
    respuesta ??
    {}

  const cursos =
    new Set()

  const modulos =
    new Set()


  const agregarCurso =
    (valor) => {

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


  const agregarModulo =
    (valor) => {

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


  /* ========================================================
     CURSOS ANIDADOS
     ======================================================== */

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


  /* ========================================================
     MODULOS SEPARADOS
     ======================================================== */

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


  /* ========================================================
     ARRAYS DE IDS
     ======================================================== */

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
        ) || null,
      [
        usuarios,
        usuarioSeleccionadoId
      ]
    )


  const usuarioEsAdmin =
    usuarioSeleccionado?.role ===
    "admin"


  /* ========================================================
     FILTRO DE USUARIOS
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
                usuario.role
              ]
                .filter(Boolean)
                .join(" ")
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
    (texto) => {

      setAviso(
        texto
      )


      window.setTimeout(
        () => {

          setAviso("")

        },
        5000
      )
    }


  /* ========================================================
     CARGAR USUARIOS
     ======================================================== */

  const cargarUsuarios =
    async (
      seleccionarId = null
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


      /* ====================================================
         SELECCIONAR USUARIO RECIEN CREADO
         ==================================================== */

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


        if (existe) {

          setUsuarioSeleccionadoId(
            String(
              seleccionarId
            )
          )


          return lista
        }
      }


      /* ====================================================
         CONSERVAR USUARIO ACTUAL
         ==================================================== */

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


      /* ====================================================
         SELECCION INICIAL
         ==================================================== */

      const primerUsuarioNormal =
        lista.find(
          (usuario) =>
            usuario.role !==
            "admin"
        )


      const inicial =
        primerUsuarioNormal ||
        lista[0]


      if (inicial) {

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
      mostrarCarga = true
    ) => {

      if (!userId) {

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


      setError("")


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

      } catch (problema) {

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
     CARGA INICIAL
     ======================================================== */

  useEffect(
    () => {

      const cargar =
        async () => {

          setCargando(
            true
          )


          setError("")


          try {

            await Promise.all([
              cargarUsuarios(),
              cargarCatalogo()
            ])

          } catch (problema) {

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
     ABRIR REGISTRO
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


  /* ========================================================
     REGISTRAR USUARIO
     ======================================================== */

  const registrarNuevoUsuario =
    async () => {

      setErrorRegistro(
        ""
      )


      const nombre =
        String(
          nuevoUsuario
            .full_name ||
          ""
        ).trim()


      const correo =
        String(
          nuevoUsuario
            .email ||
          ""
        )
          .trim()
          .toLowerCase()


      const password =
        String(
          nuevoUsuario
            .password ||
          ""
        )


      const empresa =
        String(
          nuevoUsuario
            .empresa ||
          ""
        ).trim()


      /* ====================================================
         VALIDACIONES
         ==================================================== */

      if (!nombre) {

        return setErrorRegistro(
          "Ingresa el nombre completo."
        )
      }


      if (!correo) {

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


      if (!empresa) {

        return setErrorRegistro(
          "Ingresa la empresa."
        )
      }


      /* ====================================================
         CREAR
         ==================================================== */

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

      } catch (problema) {

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
     ASIGNAR / QUITAR CURSO
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


      setError("")


      try {

        if (activo) {

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

      } catch (problema) {

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
     ASIGNAR / QUITAR MODULO
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


      setError("")


      try {

        if (activo) {

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

      } catch (problema) {

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
            Registra usuarios y controla el acceso a cursos y módulos de RIMBERIO.
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
                  {usuarios.length} registrados
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
                            : "transparent",

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

                {/* =============================================
                    USUARIO
                    ============================================= */}

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

                </div>


                {usuarioEsAdmin && (

                  <div className="alert alert-success">

                    El administrador tiene acceso completo al sistema.
                    No necesita asignaciones individuales de cursos o módulos.

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

                            {/* =================================
                                CURSO
                                ================================= */}

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


                              {/* ===============================
                                  BOTON DE ACCESO AL CURSO
                                  =============================== */}

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


                            {/* =================================
                                MODULOS
                                ================================= */}

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


                                        {/* ===========================
                                            BOTON DEL MODULO
                                            =========================== */}

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
          MODAL REGISTRAR USUARIO
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
            Después podrás seleccionar al usuario y asignarle los cursos y módulos que necesite.

          </p>


          {/* ==================================================
              NOMBRE
              ================================================== */}

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


          {/* ==================================================
              CORREO
              ================================================== */}

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


          {/* ==================================================
              CONTRASEÑA
              ================================================== */}

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

              El usuario utilizará esta contraseña para iniciar sesión.

            </span>

          </div>


          {/* ==================================================
              EMPRESA
              ================================================== */}

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

              Los CSV propios se compartirán con los usuarios que pertenezcan a esta misma empresa.

            </span>

          </div>


          {/* ==================================================
              INFORMACION
              ================================================== */}

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

              La cuenta se crea sin permisos de cursos.
              Selecciona al nuevo usuario en esta misma pantalla y habilita solamente los módulos que necesite.

            </div>

          </div>


          {/* ==================================================
              ERROR
              ================================================== */}

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