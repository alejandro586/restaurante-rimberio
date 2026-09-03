import {
  useEffect,
  useState
} from "react"

import {
  getEmpresa,
  getInitials,
  getUserName,
  miles
} from "../api"

import * as db
  from "../empresaDb"

import Modal
  from "../components/Modal"

import Confirm
  from "../components/Confirm"


const PAGINA = 25


/* ==========================================================
   ESTRUCTURA DE DATOS
   ========================================================== */

/**
 * Modulo:
 * big_data.estructura
 *
 * Permite:
 *
 * - consultar las tablas de datos
 * - revisar columnas
 * - agregar columnas
 * - eliminar columnas
 * - editar valores
 * - crear tablas auxiliares
 * - revisar cambios realizados
 * - atender tareas relacionadas
 *
 * Las operaciones de estructura se realizan
 * mediante las funciones RPC protegidas
 * de Supabase.
 */
const DatosEmpresa = () => {

  const [
    tabla,
    setTabla
  ] = useState(
    "empresa_datos"
  )


  const [
    tablas,
    setTablas
  ] = useState([])


  const [
    datos,
    setDatos
  ] = useState(null)


  const [
    pagina,
    setPagina
  ] = useState(0)


  const [
    cargando,
    setCargando
  ] = useState(true)


  const [
    error,
    setError
  ] = useState("")


  const [
    aviso,
    setAviso
  ] = useState("")


  const [
    cambios,
    setCambios
  ] = useState([])


  const [
    tareas,
    setTareas
  ] = useState([])


  const [
    verTareas,
    setVerTareas
  ] = useState(false)


  const [
    formColumna,
    setFormColumna
  ] = useState(null)


  const [
    formTabla,
    setFormTabla
  ] = useState(null)


  const [
    borrando,
    setBorrando
  ] = useState(null)


  const [
    editando,
    setEditando
  ] = useState(null)


  const [
    guardando,
    setGuardando
  ] = useState(false)


  /* ========================================================
     CARGAR DATOS DE UNA TABLA
     ======================================================== */

  const cargarDatos =
    async (
      destino = tabla,
      desde = 0
    ) => {

      setCargando(true)
      setError("")


      try {

        const respuesta =
          await db.leer(
            destino,
            PAGINA,
            desde
          )


        setDatos(
          respuesta
        )

      } catch (problema) {

        setError(
          problema.message
        )

      } finally {

        setCargando(false)

      }
    }


  /* ========================================================
     CARGAR CONTEXTO
     ======================================================== */

  const cargarContexto =
    async () => {

      try {

        const [
          nuevasTablas,
          nuevosCambios,
          nuevasTareas
        ] =
          await Promise.all([
            db.tablas(),
            db.cambios(),
            db.tareas()
          ])


        setTablas(
          nuevasTablas
        )


        setCambios(
          nuevosCambios
        )


        setTareas(
          nuevasTareas
        )

      } catch (problema) {

        setError(
          problema.message
        )

      }
    }


  /* ========================================================
     CAMBIO DE TABLA
     ======================================================== */

  useEffect(() => {

    cargarDatos(
      tabla,
      0
    )


    setPagina(0)

  }, [
    tabla
  ])


  /* ========================================================
     CARGA INICIAL
     ======================================================== */

  useEffect(() => {

    cargarContexto()

  }, [])


  /* ========================================================
     REFRESCAR
     ======================================================== */

  const refrescar = () => {

    cargarDatos(
      tabla,
      pagina * PAGINA
    )


    cargarContexto()
  }


  /* ========================================================
     MENSAJE TEMPORAL
     ======================================================== */

  const mostrarAviso =
    (texto) => {

      setAviso(
        texto
      )


      setTimeout(
        () =>
          setAviso(""),
        6000
      )
    }


  /* ========================================================
     AGREGAR COLUMNA
     ======================================================== */

  const agregarColumna =
    async () => {

      setGuardando(true)


      try {

        const resultado =
          await db.agregarColumna({
            ...formColumna,
            tabla
          })


        setFormColumna(
          null
        )


        mostrarAviso(
          `Se agregó la columna "${resultado.columna}" (${resultado.tipo}) a ${resultado.tabla}` +
          (
            resultado.tareasCerradas >
            0
              ? `. Se cerró ${
                  resultado.tareasCerradas ===
                  1
                    ? "la tarea relacionada"
                    : `${resultado.tareasCerradas} tareas relacionadas`
                }`
              : ""
          )
        )


        refrescar()

      } catch (problema) {

        setFormColumna({
          ...formColumna,

          error:
            problema.message
        })

      } finally {

        setGuardando(false)

      }
    }


  /* ========================================================
     COMPLETAR TAREA
     ======================================================== */

  const completarTarea =
    async (id) => {

      try {

        await db.completarTarea(
          id
        )


        setTareas(
          await db.tareas()
        )

      } catch (problema) {

        setError(
          problema.message
        )

      }
    }


  /* ========================================================
     CREAR TABLA
     ======================================================== */

  const crearTabla =
    async () => {

      const columnas =
        formTabla.columnas.filter(
          (columna) =>
            columna.nombre.trim()
        )


      if (
        columnas.length ===
        0
      ) {

        return setFormTabla({
          ...formTabla,

          error:
            "Define al menos una columna"
        })
      }


      setGuardando(true)


      try {

        const resultado =
          await db.crearTabla({
            ...formTabla,
            columnas
          })


        setFormTabla(
          null
        )


        mostrarAviso(
          `Se creó la tabla "${resultado.tabla}" con ${resultado.columnas} columnas`
        )


        await cargarContexto()


        setTabla(
          resultado.tabla
        )

      } catch (problema) {

        setFormTabla({
          ...formTabla,

          error:
            problema.message
        })

      } finally {

        setGuardando(false)

      }
    }


  /* ========================================================
     ELIMINAR COLUMNA
     ======================================================== */

  const eliminarColumna =
    async () => {

      try {

        await db.eliminarColumna({
          tabla,
          nombre:
            borrando
        })


        mostrarAviso(
          `Se eliminó la columna "${borrando}"`
        )


        setBorrando(
          null
        )


        refrescar()

      } catch (problema) {

        setError(
          problema.message
        )


        setBorrando(
          null
        )

      }
    }


  /* ========================================================
     EDITAR CELDA
     ======================================================== */

  const guardarCelda =
    async () => {

      try {

        await db.actualizarCelda({
          tabla,

          id:
            editando.id,

          columna:
            editando.columna,

          valor:
            editando.valor
        })


        setEditando(
          null
        )


        cargarDatos(
          tabla,
          pagina * PAGINA
        )

      } catch (problema) {

        setEditando({
          ...editando,

          error:
            problema.message
        })

      }
    }


  /* ========================================================
     PAGINACION
     ======================================================== */

  const cambiarPagina =
    (siguiente) => {

      setPagina(
        siguiente
      )


      cargarDatos(
        tabla,
        siguiente * PAGINA
      )
    }


  /* ========================================================
     DATOS DERIVADOS
     ======================================================== */

  const columnasVisibles =
    datos &&
    datos.existe
      ? datos.columnas.filter(
          (columna) =>
            columna.columna !==
            "created_at"
        )
      : []


  const pendientes =
    tareas.filter(
      (tarea) =>
        tarea.estado ===
        "pendiente"
    )


  const completadas =
    tareas.filter(
      (tarea) =>
        tarea.estado ===
        "completada"
    )


  const totalPaginas =
    datos &&
    datos.total
      ? Math.ceil(
          datos.total /
            PAGINA
        )
      : 1


  /* ========================================================
     INTERFAZ
     ======================================================== */

  return (
    <>

      {/* ====================================================
          CABECERA
          ==================================================== */}

      <div className="topbar">

        <div>

          <h1>
            Estructura de datos
          </h1>


          <p>
            Gestiona la estructura de los datos de{" "}
            <strong>
              {getEmpresa()}
            </strong>
            , incluyendo tablas, columnas y valores registrados.
          </p>

        </div>


        <div className="topbar-actions">

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
          HERRAMIENTAS
          ==================================================== */}

      <div className="toolbar">

        <div className="toolbar-left">

          <select
            value={tabla}
            onChange={
              (event) =>
                setTabla(
                  event.target.value
                )
            }
          >

            {tablas.map(
              (item) => (
                <option
                  key={
                    item.tabla
                  }
                  value={
                    item.tabla
                  }
                >
                  {item.tabla}
                </option>
              )
            )}

          </select>


          {datos &&
            datos.existe && (
            <span className="muted">

              {miles(
                datos.total
              )}

              {" filas · "}

              {
                datos.columnas
                  .length
              }

              {" columnas"}

            </span>
          )}

        </div>


        <div className="row-actions">

          <button
            type="button"
            className={
              `btn btn-ghost btn-tareas ${
                pendientes.length >
                0
                  ? "con-pendientes"
                  : ""
              }`
            }
            onClick={
              () =>
                setVerTareas(
                  true
                )
            }
          >

            Mis tareas

            {pendientes.length >
              0 && (
              <span className="badge">
                {pendientes.length}
              </span>
            )}

          </button>


          <button
            type="button"
            className="btn btn-light"
            onClick={
              () =>
                setFormTabla({
                  nombre:
                    "",

                  motivo:
                    "",

                  columnas: [
                    {
                      nombre:
                        "",

                      tipo:
                        "texto"
                    }
                  ]
                })
            }
          >
            Crear tabla
          </button>


          <button
            type="button"
            className="btn"
            disabled={
              !datos ||
              !datos.existe
            }
            onClick={
              () =>
                setFormColumna({
                  nombre:
                    "",

                  tipo:
                    "texto",

                  valorDefecto:
                    "",

                  motivo:
                    ""
                })
            }
          >
            Agregar columna
          </button>

        </div>

      </div>


      {/* ====================================================
          TABLA
          ==================================================== */}

      <div className="card">

        {cargando && (
          <div className="loading">
            Cargando estructura...
          </div>
        )}


        {!cargando &&
          datos &&
          !datos.existe && (
          <div className="empty">

            Todavía no existen datos estructurados de la empresa.

            <br />

            Importa primero un archivo desde el módulo{" "}

            <strong>
              Importar datos
            </strong>

            {" "}para crear la estructura inicial.

          </div>
        )}


        {!cargando &&
          datos &&
          datos.existe &&
          datos.filas.length ===
            0 && (
          <div className="empty">
            La tabla existe, pero todavía no contiene filas.
          </div>
        )}


        {!cargando &&
          datos &&
          datos.existe &&
          datos.filas.length >
            0 && (
          <>

            <div className="table-wrap">

              <table className="tabla-dinamica">

                <thead>

                  <tr>

                    {columnasVisibles.map(
                      (columna) => (
                        <th
                          key={
                            columna.columna
                          }
                        >

                          <span>
                            {
                              columna.columna
                            }
                          </span>


                          {!db.COLUMNAS_SISTEMA.includes(
                            columna.columna
                          ) && (
                            <button
                              type="button"
                              className="col-borrar"
                              title={
                                `Eliminar la columna ${columna.columna}`
                              }
                              onClick={
                                () =>
                                  setBorrando(
                                    columna.columna
                                  )
                              }
                            >
                              ×
                            </button>
                          )}

                        </th>
                      )
                    )}

                  </tr>

                </thead>


                <tbody>

                  {datos.filas.map(
                    (fila) => (

                      <tr
                        key={
                          fila.id
                        }
                      >

                        {columnasVisibles.map(
                          (columna) => {

                            const valor =
                              fila[
                                columna
                                  .columna
                              ]


                            const editable =
                              !db.COLUMNAS_SISTEMA.includes(
                                columna.columna
                              )


                            return (
                              <td
                                key={
                                  columna.columna
                                }
                                className={
                                  editable
                                    ? "celda-editable"
                                    : ""
                                }
                                onClick={
                                  () => {

                                    if (
                                      !editable
                                    ) {
                                      return
                                    }


                                    setEditando({
                                      id:
                                        fila.id,

                                      columna:
                                        columna.columna,

                                      tipo:
                                        columna.tipo,

                                      valor:
                                        valor ===
                                          null ||
                                        valor ===
                                          undefined
                                          ? ""
                                          : String(
                                              valor
                                            )
                                    })

                                  }
                                }
                              >

                                {valor ===
                                  null ||
                                valor ===
                                  undefined ||
                                valor ===
                                  "" ? (

                                  <span className="vacio">
                                    —
                                  </span>

                                ) : typeof valor ===
                                  "boolean" ? (

                                  valor
                                    ? "Sí"
                                    : "No"

                                ) : (

                                  String(
                                    valor
                                  )

                                )}

                              </td>
                            )
                          }
                        )}

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>


            <div className="table-foot">

              <span>

                Mostrando{" "}

                {
                  pagina *
                    PAGINA +
                  1
                }

                {" a "}

                {Math.min(
                  (
                    pagina +
                    1
                  ) *
                    PAGINA,

                  datos.total
                )}

                {" de "}

                {miles(
                  datos.total
                )}

              </span>


              <div className="pagination">

                <button
                  type="button"
                  disabled={
                    pagina ===
                    0
                  }
                  onClick={
                    () =>
                      cambiarPagina(
                        pagina -
                          1
                      )
                  }
                >
                  ‹
                </button>


                <button
                  type="button"
                  className="active"
                >
                  {pagina + 1}
                </button>


                <button
                  type="button"
                  disabled={
                    pagina +
                      1 >=
                    totalPaginas
                  }
                  onClick={
                    () =>
                      cambiarPagina(
                        pagina +
                          1
                      )
                  }
                >
                  ›
                </button>

              </div>

            </div>

          </>
        )}

      </div>


      {/* ====================================================
          HISTORIAL
          ==================================================== */}

      {cambios.length >
        0 && (

        <div className="card">

          <div className="chart-title">
            Cambios de estructura aplicados
          </div>


          <div className="table-wrap">

            <table>

              <thead>

                <tr>
                  <th>
                    Operación
                  </th>

                  <th>
                    Tabla
                  </th>

                  <th>
                    Detalle
                  </th>

                  <th>
                    Motivo
                  </th>

                  <th>
                    Fecha
                  </th>
                </tr>

              </thead>


              <tbody>

                {cambios.map(
                  (cambio) => (

                    <tr
                      key={
                        cambio.id
                      }
                    >

                      <td>

                        <span
                          className={
                            `chip chip-${cambio.operacion}`
                          }
                        >

                          {cambio.operacion ===
                          "add_column"
                            ? "Columna agregada"
                            : cambio.operacion ===
                              "create_table"
                              ? "Tabla creada"
                              : "Columna eliminada"}

                        </span>

                      </td>


                      <td className="cell-main">
                        {cambio.tabla}
                      </td>


                      <td className="muted ellipsis">

                        {cambio.detalle
                          .columna ||
                          (
                            Array.isArray(
                              cambio.detalle
                                .columnas
                            )
                              ? cambio.detalle.columnas
                                  .map(
                                    (columna) =>
                                      columna.columna ||
                                      columna.nombre
                                  )
                                  .join(
                                    ", "
                                  )
                              : "-"
                          )}

                      </td>


                      <td className="muted ellipsis">
                        {cambio.motivo ||
                          "-"}
                      </td>


                      <td className="muted">

                        {new Date(
                          cambio.created_at
                        ).toLocaleDateString(
                          "es-PE"
                        )}

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {/* ====================================================
          MODAL AGREGAR COLUMNA
          ==================================================== */}

      {formColumna && (

        <Modal
          title="Agregar columna"
          onClose={
            () =>
              setFormColumna(
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
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    guardando
                  }
                  onClick={
                    agregarColumna
                  }
                >
                  {guardando
                    ? "Aplicando..."
                    : "Agregar columna"}
                </button>

              </>
            )
          }
        >

          <p
            className="muted"
            style={{
              marginBottom:
                "16px"
            }}
          >
            La columna se agregará de forma permanente a la estructura de{" "}

            <strong>
              {tabla}
            </strong>
            .
          </p>


          <div className="field">

            <label>
              Nombre de la columna
            </label>


            <input
              value={
                formColumna.nombre
              }
              placeholder="Ej. canal_venta"
              autoFocus
              onChange={
                (event) =>
                  setFormColumna({
                    ...formColumna,

                    nombre:
                      event.target
                        .value
                  })
              }
            />


            {formColumna.nombre &&
              db.aIdentificador(
                formColumna.nombre
              ) !==
                formColumna.nombre && (

              <span className="muted">

                Se guardará como{" "}

                <code>
                  {db.aIdentificador(
                    formColumna.nombre
                  ) ||
                    "(inválido)"}
                </code>

              </span>
            )}

          </div>


          <div className="field-row">

            <div className="field">

              <label>
                Tipo de dato
              </label>


              <select
                value={
                  formColumna.tipo
                }
                onChange={
                  (event) =>
                    setFormColumna({
                      ...formColumna,

                      tipo:
                        event.target
                          .value
                    })
                }
              >

                {db.TIPOS.map(
                  (tipo) => (
                    <option
                      key={
                        tipo.valor
                      }
                      value={
                        tipo.valor
                      }
                    >
                      {tipo.label}
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="field">

              <label>
                Valor por defecto
                (opcional)
              </label>


              <input
                value={
                  formColumna
                    .valorDefecto
                }
                placeholder="Ej. Salón"
                onChange={
                  (event) =>
                    setFormColumna({
                      ...formColumna,

                      valorDefecto:
                        event.target
                          .value
                    })
                }
              />

            </div>

          </div>


          <div className="field">

            <label>
              Motivo del cambio
            </label>


            <textarea
              rows="2"
              value={
                formColumna.motivo
              }
              placeholder="Describe por qué necesitas registrar esta información"
              onChange={
                (event) =>
                  setFormColumna({
                    ...formColumna,

                    motivo:
                      event.target
                        .value
                  })
              }
            />

          </div>


          {formColumna.error && (
            <div className="alert alert-error">
              {formColumna.error}
            </div>
          )}

        </Modal>
      )}


      {/* ====================================================
          MODAL CREAR TABLA
          ==================================================== */}

      {formTabla && (

        <Modal
          title="Crear tabla"
          onClose={
            () =>
              setFormTabla(
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
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  disabled={
                    guardando
                  }
                  onClick={
                    crearTabla
                  }
                >
                  {guardando
                    ? "Creando..."
                    : "Crear tabla"}
                </button>

              </>
            )
          }
        >

          <p
            className="muted"
            style={{
              marginBottom:
                "16px"
            }}
          >
            Crea una tabla auxiliar para almacenar información que todavía no existe en la estructura actual.
            El prefijo{" "}

            <code>
              emp_
            </code>

            {" "}se agregará automáticamente.
          </p>


          <div className="field">

            <label>
              Nombre de la tabla
            </label>


            <input
              value={
                formTabla.nombre
              }
              placeholder="Ej. programa_fidelidad"
              autoFocus
              onChange={
                (event) =>
                  setFormTabla({
                    ...formTabla,

                    nombre:
                      event.target
                        .value
                  })
              }
            />

          </div>


          <label className="etiqueta-bloque">
            Columnas
          </label>


          {formTabla.columnas.map(
            (
              columna,
              indice
            ) => (

              <div
                className="field-row"
                key={indice}
              >

                <div className="field">

                  <input
                    value={
                      columna.nombre
                    }
                    placeholder="nombre_columna"
                    onChange={
                      (event) => {

                        const copia =
                          [
                            ...formTabla.columnas
                          ]


                        copia[indice] = {
                          ...copia[indice],

                          nombre:
                            event.target
                              .value
                        }


                        setFormTabla({
                          ...formTabla,

                          columnas:
                            copia
                        })

                      }
                    }
                  />

                </div>


                <div className="field">

                  <select
                    value={
                      columna.tipo
                    }
                    onChange={
                      (event) => {

                        const copia =
                          [
                            ...formTabla.columnas
                          ]


                        copia[indice] = {
                          ...copia[indice],

                          tipo:
                            event.target
                              .value
                        }


                        setFormTabla({
                          ...formTabla,

                          columnas:
                            copia
                        })

                      }
                    }
                  >

                    {db.TIPOS.map(
                      (tipo) => (
                        <option
                          key={
                            tipo.valor
                          }
                          value={
                            tipo.valor
                          }
                        >
                          {tipo.label}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={
                    formTabla
                      .columnas
                      .length ===
                    1
                  }
                  onClick={
                    () =>
                      setFormTabla({
                        ...formTabla,

                        columnas:
                          formTabla.columnas.filter(
                            (
                              _,
                              posicion
                            ) =>
                              posicion !==
                              indice
                          )
                      })
                  }
                >
                  Quitar
                </button>

              </div>
            )
          )}


          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={
              () =>
                setFormTabla({
                  ...formTabla,

                  columnas: [
                    ...formTabla.columnas,

                    {
                      nombre:
                        "",

                      tipo:
                        "texto"
                    }
                  ]
                })
            }
          >
            Añadir columna
          </button>


          <div
            className="field"
            style={{
              marginTop:
                "16px"
            }}
          >

            <label>
              Motivo del cambio
            </label>


            <textarea
              rows="2"
              value={
                formTabla.motivo
              }
              placeholder="Describe por qué necesitas esta nueva estructura"
              onChange={
                (event) =>
                  setFormTabla({
                    ...formTabla,

                    motivo:
                      event.target
                        .value
                  })
              }
            />

          </div>


          {formTabla.error && (
            <div className="alert alert-error">
              {formTabla.error}
            </div>
          )}

        </Modal>
      )}


      {/* ====================================================
          EDITAR CELDA
          ==================================================== */}

      {editando && (

        <Modal
          title={
            `Editar ${editando.columna}`
          }
          onClose={
            () =>
              setEditando(
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
                    cerrar
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="btn"
                  onClick={
                    guardarCelda
                  }
                >
                  Guardar
                </button>

              </>
            )
          }
        >

          <div className="field">

            <label>

              Valor{" "}

              <span className="muted">
                ({editando.tipo})
              </span>

            </label>


            <input
              value={
                editando.valor
              }
              autoFocus
              onChange={
                (event) =>
                  setEditando({
                    ...editando,

                    valor:
                      event.target
                        .value
                  })
              }
            />

          </div>


          {editando.error && (
            <div className="alert alert-error">
              {editando.error}
            </div>
          )}

        </Modal>
      )}


      {/* ====================================================
          TAREAS
          ==================================================== */}

      {verTareas && (

        <Modal
          ancho
          title="Mis tareas"
          onClose={
            () =>
              setVerTareas(
                false
              )
          }
        >

          {tareas.length ===
            0 && (
            <div className="empty">
              No tienes tareas asignadas.
            </div>
          )}


          {pendientes.length >
            0 && (
            <>

              <div className="chart-title">
                Pendientes ({pendientes.length})
              </div>


              {pendientes.map(
                (tarea) => (

                  <div
                    className="tarea"
                    key={
                      tarea.id
                    }
                  >

                    <div
                      className={
                        `insight-bar ${tarea.nivel}`
                      }
                    />


                    <div className="tarea-cuerpo">

                      <h4>
                        {tarea.titulo}
                      </h4>


                      <p>
                        {tarea.mensaje}
                      </p>


                      {tarea.columna_sugerida ? (

                        <div className="tarea-instruccion">

                          Crea la columna{" "}

                          <code>
                            {
                              tarea.columna_sugerida
                            }
                          </code>

                          {" de tipo "}

                          <strong>
                            {
                              tarea.tipo_sugerido
                            }
                          </strong>

                          {" en "}

                          <code>
                            {
                              tarea.tabla_destino
                            }
                          </code>


                          {tarea.ejemplo && (
                            <>
                              {" — "}
                              {tarea.ejemplo}
                            </>
                          )}


                          <span className="muted">

                            Utiliza el botón{" "}

                            <strong>
                              Agregar columna
                            </strong>
                            .

                            La tarea se completará automáticamente cuando la columna sea creada.

                          </span>

                        </div>

                      ) : (

                        <div className="tarea-instruccion tarea-lectura">

                          Esta tarea no requiere crear una columna.

                          Márcala como completada cuando hayas realizado la acción indicada.

                        </div>

                      )}


                      <div className="tarea-pie">

                        <span className="muted">

                          {tarea.origen &&
                            `Origen: ${tarea.origen} · `}


                          {new Date(
                            tarea.created_at
                          ).toLocaleDateString(
                            "es-PE"
                          )}

                        </span>


                        {!tarea.columna_sugerida && (

                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={
                              () =>
                                completarTarea(
                                  tarea.id
                                )
                            }
                          >
                            Marcar como completada
                          </button>

                        )}

                      </div>

                    </div>

                  </div>
                )
              )}

            </>
          )}


          {completadas.length >
            0 && (
            <>

              <div
                className="chart-title"
                style={{
                  marginTop:
                    "24px"
                }}
              >
                Completadas ({completadas.length})
              </div>


              <div className="table-wrap">

                <table>

                  <thead>

                    <tr>
                      <th>
                        Tarea
                      </th>

                      <th>
                        Columna
                      </th>

                      <th>
                        Cierre
                      </th>

                      <th>
                        Fecha
                      </th>
                    </tr>

                  </thead>


                  <tbody>

                    {completadas.map(
                      (tarea) => (

                        <tr
                          key={
                            tarea.id
                          }
                        >

                          <td className="cell-main ellipsis">
                            {tarea.titulo}
                          </td>


                          <td className="muted">
                            {tarea.columna_sugerida ||
                              "-"}
                          </td>


                          <td>

                            <span className="chip chip-tipo">

                              {tarea.cierre ===
                              "automatico"
                                ? "Automático"
                                : "Manual"}

                            </span>

                          </td>


                          <td className="muted">

                            {tarea.completada_at
                              ? new Date(
                                  tarea.completada_at
                                ).toLocaleDateString(
                                  "es-PE"
                                )
                              : "-"}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </>
          )}

        </Modal>
      )}


      {/* ====================================================
          CONFIRMAR ELIMINACION
          ==================================================== */}

      {borrando && (

        <Confirm
          title="Eliminar columna"
          message={
            `Se eliminará la columna "${borrando}" de ${tabla}.`
          }
          detail="Los datos almacenados en esta columna se perderán permanentemente. Esta operación no se puede deshacer."
          confirmLabel="Eliminar"
          danger
          onCancel={
            () =>
              setBorrando(
                null
              )
          }
          onConfirm={
            eliminarColumna
          }
        />

      )}

    </>
  )
}


export default DatosEmpresa