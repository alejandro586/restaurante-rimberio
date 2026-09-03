import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  asignarCurso,
  asignarModulo,
  getMessage,
  listarUsuarios,
  obtenerCatalogoCursos,
  obtenerPermisosUsuario,
  quitarCurso,
  quitarModulo
} from "../api"


const AdminUsuarios = () => {
  const [usuarios, setUsuarios] =
    useState([])

  const [catalogo, setCatalogo] =
    useState([])

  const [
    usuarioSeleccionadoId,
    setUsuarioSeleccionadoId
  ] = useState("")

  const [
    permisos,
    setPermisos
  ] = useState([])

  const [
    busqueda,
    setBusqueda
  ] = useState("")

  const [
    cargandoInicial,
    setCargandoInicial
  ] = useState(true)

  const [
    cargandoPermisos,
    setCargandoPermisos
  ] = useState(false)

  const [
    accion,
    setAccion
  ] = useState("")

  const [
    error,
    setError
  ] = useState("")

  const [
    mensaje,
    setMensaje
  ] = useState("")


  /* ==========================================================
     CARGA INICIAL
     ========================================================== */

  useEffect(() => {
    const cargar = async () => {
      setCargandoInicial(true)
      setError("")

      try {
        const [
          respuestaUsuarios,
          respuestaCatalogo
        ] = await Promise.all([
          listarUsuarios(),
          obtenerCatalogoCursos()
        ])


        const listaUsuarios =
          respuestaUsuarios.usuarios || []

        const listaCursos =
          respuestaCatalogo.cursos || []


        setUsuarios(
          listaUsuarios
        )

        setCatalogo(
          listaCursos
        )


        /*
         * Seleccionamos primero un trabajador
         * para que la pantalla sea util
         * inmediatamente.
         *
         * El administrador tambien aparece
         * en la lista.
         */
        if (
          listaUsuarios.length > 0
        ) {
          const primero =
            listaUsuarios.find(
              (usuario) =>
                usuario.role !== "admin"
            ) ||
            listaUsuarios[0]


          setUsuarioSeleccionadoId(
            primero.id
          )
        }

      } catch (error) {
        setError(
          getMessage(error)
        )
      } finally {
        setCargandoInicial(false)
      }
    }


    cargar()
  }, [])


  /* ==========================================================
     USUARIO SELECCIONADO
     ========================================================== */

  const usuarioSeleccionado =
    useMemo(
      () =>
        usuarios.find(
          (usuario) =>
            usuario.id ===
            usuarioSeleccionadoId
        ) || null,

      [
        usuarios,
        usuarioSeleccionadoId
      ]
    )


  /* ==========================================================
     CARGAR PERMISOS
     ========================================================== */

  const cargarPermisos =
    async (userId) => {

      if (!userId) {
        setPermisos([])
        return
      }


      setCargandoPermisos(true)
      setError("")


      try {
        const respuesta =
          await obtenerPermisosUsuario(
            userId
          )


        setPermisos(
          respuesta.permisos
            ?.cursos || []
        )

      } catch (error) {
        setPermisos([])

        setError(
          getMessage(error)
        )

      } finally {
        setCargandoPermisos(false)
      }
    }


  useEffect(() => {
    if (
      usuarioSeleccionadoId
    ) {
      cargarPermisos(
        usuarioSeleccionadoId
      )
    }
  }, [
    usuarioSeleccionadoId
  ])


  /* ==========================================================
     FILTRO DE USUARIOS
     ========================================================== */

  const usuariosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase()


      if (!texto) {
        return usuarios
      }


      return usuarios.filter(
        (usuario) => {

          const nombre =
            String(
              usuario.full_name || ""
            )
              .toLowerCase()


          const email =
            String(
              usuario.email || ""
            )
              .toLowerCase()


          const rol =
            String(
              usuario.role || ""
            )
              .toLowerCase()


          return (
            nombre.includes(texto) ||
            email.includes(texto) ||
            rol.includes(texto)
          )
        }
      )

    }, [
      usuarios,
      busqueda
    ])


  /* ==========================================================
     IDS DE CURSOS ASIGNADOS
     ========================================================== */

  const cursosAsignados =
    useMemo(
      () =>
        new Set(
          permisos.map(
            (curso) =>
              Number(curso.id)
          )
        ),

      [permisos]
    )


  /* ==========================================================
     IDS DE MODULOS ASIGNADOS
     ========================================================== */

  const modulosAsignados =
    useMemo(() => {
      const ids =
        []


      for (
        const curso
        of permisos
      ) {
        for (
          const modulo
          of curso.modulos || []
        ) {
          ids.push(
            Number(modulo.id)
          )
        }
      }


      return new Set(ids)

    }, [
      permisos
    ])


  /* ==========================================================
     ADMIN SELECCIONADO
     ========================================================== */

  const seleccionadoEsAdmin =
    usuarioSeleccionado?.role ===
    "admin"


  /* ==========================================================
     SABER SI TIENE CURSO
     ========================================================== */

  const tieneCurso = (
    courseId
  ) => {

    /*
     * El administrador tiene acceso
     * completo por su rol.
     */
    if (
      seleccionadoEsAdmin
    ) {
      return true
    }


    return cursosAsignados.has(
      Number(courseId)
    )
  }


  /* ==========================================================
     SABER SI TIENE MODULO
     ========================================================== */

  const tieneModulo = (
    moduleId
  ) => {

    if (
      seleccionadoEsAdmin
    ) {
      return true
    }


    return modulosAsignados.has(
      Number(moduleId)
    )
  }


  /* ==========================================================
     MENSAJE TEMPORAL
     ========================================================== */

  const mostrarExito = (
    texto
  ) => {
    setMensaje(texto)

    window.setTimeout(
      () => {
        setMensaje("")
      },
      3000
    )
  }


  /* ==========================================================
     CAMBIAR PERMISO DE CURSO
     ========================================================== */

  const cambiarCurso =
    async (
      curso,
      activado
    ) => {

      if (
        !usuarioSeleccionado ||
        seleccionadoEsAdmin
      ) {
        return
      }


      setAccion(
        `curso-${curso.id}`
      )

      setError("")
      setMensaje("")


      try {
        if (activado) {
          await asignarCurso(
            usuarioSeleccionado.id,
            curso.id
          )

          mostrarExito(
            `${curso.nombre} fue asignado correctamente`
          )

        } else {
          await quitarCurso(
            usuarioSeleccionado.id,
            curso.id
          )

          mostrarExito(
            `${curso.nombre} fue retirado correctamente`
          )
        }


        await cargarPermisos(
          usuarioSeleccionado.id
        )

      } catch (error) {
        setError(
          getMessage(error)
        )

      } finally {
        setAccion("")
      }
    }


  /* ==========================================================
     CAMBIAR PERMISO DE MODULO
     ========================================================== */

  const cambiarModulo =
    async (
      modulo,
      activado
    ) => {

      if (
        !usuarioSeleccionado ||
        seleccionadoEsAdmin
      ) {
        return
      }


      setAccion(
        `modulo-${modulo.id}`
      )

      setError("")
      setMensaje("")


      try {
        if (activado) {
          await asignarModulo(
            usuarioSeleccionado.id,
            modulo.id
          )

          mostrarExito(
            `${modulo.nombre} fue habilitado`
          )

        } else {
          await quitarModulo(
            usuarioSeleccionado.id,
            modulo.id
          )

          mostrarExito(
            `${modulo.nombre} fue deshabilitado`
          )
        }


        await cargarPermisos(
          usuarioSeleccionado.id
        )

      } catch (error) {
        setError(
          getMessage(error)
        )

      } finally {
        setAccion("")
      }
    }


  /* ==========================================================
     INICIAL DEL USUARIO
     ========================================================== */

  const inicialUsuario = (
    usuario
  ) => {

    const texto =
      usuario.full_name ||
      usuario.email ||
      "U"


    return texto
      .trim()
      .charAt(0)
      .toUpperCase()
  }


  /* ==========================================================
     CARGANDO
     ========================================================== */

  if (cargandoInicial) {
    return (
      <div className="loading">
        Cargando administración...
      </div>
    )
  }


  /* ==========================================================
     INTERFAZ
     ========================================================== */

  return (
    <>
      {/* ======================================================
          CABECERA
          ====================================================== */}

      <div className="topbar">
        <div>
          <h1>
            Administración de usuarios
          </h1>

          <p>
            Asigna cursos y permisos
            a los trabajadores de RIMBERIO.
          </p>
        </div>
      </div>


      {/* ======================================================
          MENSAJES
          ====================================================== */}

      {error && (
        <div
          className="alert alert-error"
          style={{
            marginBottom: 18
          }}
        >
          {error}
        </div>
      )}


      {mensaje && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: 18
          }}
        >
          {mensaje}
        </div>
      )}


      {/* ======================================================
          RESUMEN
          ====================================================== */}

      <div
        className="grid-2"
      >
        <div className="metric">
          <span>
            Usuarios registrados
          </span>

          <strong>
            {usuarios.length}
          </strong>
        </div>


        <div className="metric">
          <span>
            Cursos disponibles
          </span>

          <strong>
            {catalogo.length}
          </strong>
        </div>
      </div>


      {/* ======================================================
          PANEL PRINCIPAL
          ====================================================== */}

      <div className="grid-2">

        {/* ====================================================
            LISTA DE USUARIOS
            ==================================================== */}

        <section className="card">
          <div
            className="toolbar"
          >
            <div>
              <strong>
                Usuarios
              </strong>

              <div
                className="muted"
                style={{
                  marginTop: 4,
                  fontSize: 13
                }}
              >
                Selecciona un usuario
                para administrar sus permisos.
              </div>
            </div>
          </div>


          <div
            className="toolbar"
          >
            <div
              className="toolbar-left"
              style={{
                width: "100%"
              }}
            >
              <input
                type="search"
                placeholder="Buscar nombre o correo..."
                value={busqueda}
                onChange={
                  (event) =>
                    setBusqueda(
                      event.target.value
                    )
                }
                style={{
                  width: "100%"
                }}
              />
            </div>
          </div>


          {usuariosFiltrados.length ===
          0 ? (
            <div className="empty">
              No se encontraron usuarios.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      Usuario
                    </th>

                    <th>
                      Rol
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map(
                    (usuario) => {

                      const seleccionado =
                        usuario.id ===
                        usuarioSeleccionadoId


                      return (
                        <tr
                          key={
                            usuario.id
                          }
                          className={
                            seleccionado
                              ? "selected"
                              : ""
                          }
                          onClick={
                            () =>
                              setUsuarioSeleccionadoId(
                                usuario.id
                              )
                          }
                          style={{
                            cursor:
                              "pointer"
                          }}
                        >
                          <td>
                            <div className="cell-main">
                              <span className="bullet">
                                {inicialUsuario(
                                  usuario
                                )}
                              </span>

                              <div>
                                <strong>
                                  {usuario.full_name ||
                                    "Sin nombre"}
                                </strong>

                                <div
                                  className="muted"
                                  style={{
                                    marginTop:
                                      3,
                                    fontSize:
                                      12
                                  }}
                                >
                                  {usuario.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={
                                usuario.role ===
                                "admin"
                                  ? "chip chip-propia"
                                  : "chip chip-tipo"
                              }
                            >
                              {usuario.role ===
                              "admin"
                                ? "Administrador"
                                : "Trabajador"}
                            </span>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>


        {/* ====================================================
            PERMISOS
            ==================================================== */}

        <section className="card">
          {!usuarioSeleccionado ? (
            <div className="empty">
              Selecciona un usuario.
            </div>
          ) : (
            <>
              {/* =================================================
                  CABECERA DEL USUARIO
                  ================================================= */}

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 14,
                  paddingBottom:
                    18,
                  marginBottom:
                    18,
                  borderBottom:
                    "1px solid var(--border)"
                }}
              >
                <span
                  className="avatar"
                >
                  {inicialUsuario(
                    usuarioSeleccionado
                  )}
                </span>


                <div
                  style={{
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <strong
                    style={{
                      display:
                        "block"
                    }}
                  >
                    {usuarioSeleccionado
                      .full_name ||
                      "Sin nombre"}
                  </strong>


                  <span
                    className="muted"
                    style={{
                      fontSize: 13
                    }}
                  >
                    {
                      usuarioSeleccionado
                        .email
                    }
                  </span>
                </div>


                <span
                  className={
                    seleccionadoEsAdmin
                      ? "chip chip-propia"
                      : "chip chip-tipo"
                  }
                >
                  {seleccionadoEsAdmin
                    ? "Administrador"
                    : "Trabajador"}
                </span>
              </div>


              {/* =================================================
                  ADMIN
                  ================================================= */}

              {seleccionadoEsAdmin && (
                <div
                  className="alert alert-info"
                  style={{
                    marginBottom:
                      18
                  }}
                >
                  El administrador tiene
                  acceso completo a todos
                  los cursos y módulos.
                  No necesita permisos
                  individuales.
                </div>
              )}


              {/* =================================================
                  CARGANDO PERMISOS
                  ================================================= */}

              {cargandoPermisos ? (
                <div className="loading">
                  Cargando permisos...
                </div>
              ) : catalogo.length ===
                0 ? (
                <div className="empty">
                  No existen cursos
                  configurados.
                </div>
              ) : (
                <div>
                  {catalogo.map(
                    (curso) => {

                      const cursoActivo =
                        tieneCurso(
                          curso.id
                        )

                      const procesandoCurso =
                        accion ===
                        `curso-${curso.id}`


                      return (
                        <div
                          key={
                            curso.id
                          }
                          style={{
                            padding:
                              "18px 0",
                            borderBottom:
                              "1px solid var(--border)"
                          }}
                        >

                          {/* ===============================
                              CURSO
                              =============================== */}

                          <label
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "flex-start",
                              gap: 12,
                              cursor:
                                seleccionadoEsAdmin
                                  ? "default"
                                  : "pointer"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                cursoActivo
                              }
                              disabled={
                                seleccionadoEsAdmin ||
                                Boolean(
                                  accion
                                )
                              }
                              onChange={
                                (event) =>
                                  cambiarCurso(
                                    curso,
                                    event
                                      .target
                                      .checked
                                  )
                              }
                              style={{
                                marginTop:
                                  4
                              }}
                            />


                            <div
                              style={{
                                flex: 1
                              }}
                            >
                              <strong>
                                {curso.nombre}
                              </strong>

                              {curso.descripcion && (
                                <p
                                  className="muted"
                                  style={{
                                    marginTop:
                                      4,
                                    fontSize:
                                      13,
                                    lineHeight:
                                      1.5
                                  }}
                                >
                                  {
                                    curso.descripcion
                                  }
                                </p>
                              )}
                            </div>


                            <span
                              className={
                                cursoActivo
                                  ? "chip chip-capacidad"
                                  : "chip chip-tipo"
                              }
                            >
                              {procesandoCurso
                                ? "Guardando..."
                                : cursoActivo
                                  ? "Asignado"
                                  : "Sin acceso"}
                            </span>
                          </label>


                          {/* ===============================
                              MODULOS
                              =============================== */}

                          <div
                            style={{
                              marginTop:
                                16,
                              marginLeft:
                                28,
                              display:
                                "grid",
                              gap: 10
                            }}
                          >
                            {(curso.modulos ||
                              []).map(
                              (modulo) => {

                                const moduloActivo =
                                  tieneModulo(
                                    modulo.id
                                  )

                                const procesandoModulo =
                                  accion ===
                                  `modulo-${modulo.id}`


                                return (
                                  <label
                                    key={
                                      modulo.id
                                    }
                                    style={{
                                      display:
                                        "flex",
                                      gap: 10,
                                      alignItems:
                                        "flex-start",
                                      padding:
                                        "10px 12px",
                                      borderRadius:
                                        10,
                                      background:
                                        "var(--bg)",
                                      opacity:
                                        cursoActivo
                                          ? 1
                                          : 0.55,
                                      cursor:
                                        cursoActivo &&
                                        !seleccionadoEsAdmin
                                          ? "pointer"
                                          : "default"
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        moduloActivo
                                      }
                                      disabled={
                                        seleccionadoEsAdmin ||
                                        !cursoActivo ||
                                        Boolean(
                                          accion
                                        )
                                      }
                                      onChange={
                                        (
                                          event
                                        ) =>
                                          cambiarModulo(
                                            modulo,
                                            event
                                              .target
                                              .checked
                                          )
                                      }
                                      style={{
                                        marginTop:
                                          3
                                      }}
                                    />


                                    <div
                                      style={{
                                        flex:
                                          1,
                                        minWidth:
                                          0
                                      }}
                                    >
                                      <strong
                                        style={{
                                          fontSize:
                                            14
                                        }}
                                      >
                                        {
                                          modulo.nombre
                                        }
                                      </strong>


                                      {modulo.descripcion && (
                                        <p
                                          className="muted"
                                          style={{
                                            marginTop:
                                              3,
                                            fontSize:
                                              12,
                                            lineHeight:
                                              1.5
                                          }}
                                        >
                                          {
                                            modulo.descripcion
                                          }
                                        </p>
                                      )}


                                      <span
                                        className="muted"
                                        style={{
                                          display:
                                            "block",
                                          marginTop:
                                            5,
                                          fontSize:
                                            11
                                        }}
                                      >
                                        {
                                          modulo.clave
                                        }
                                      </span>
                                    </div>


                                    {procesandoModulo && (
                                      <span
                                        className="muted"
                                        style={{
                                          fontSize:
                                            11
                                        }}
                                      >
                                        Guardando...
                                      </span>
                                    )}
                                  </label>
                                )
                              }
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
        </section>
      </div>
    </>
  )
}


export default AdminUsuarios