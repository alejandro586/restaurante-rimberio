import {
  useEffect,
  useRef,
  useState
} from "react"

import api, {
  getMessage,
  getUserName,
  getInitials,
  getEmpresa,
  miles
} from "../api"

import * as db
  from "../empresaDb"

import Modal
  from "../components/Modal"

import DocumentosCurso
  from "./DocumentosCurso"


/* ==========================================================
   CONFIGURACION
   ========================================================== */

const BIG_DATA_CURSO_ID =
  1


/* ==========================================================
   ZONA DE CARGA DE DATOS
   ========================================================== */

/**
 * Mantiene la lógica original:
 *
 * - Nuestra empresa
 * - Otra empresa
 * - CSV
 * - XLSX
 * - XLS
 */
const ZonaCarga =
  ({
    propia,
    empresaFija,
    onSubido
  }) => {

    const input =
      useRef(
        null
      )


    const [
      archivo,
      setArchivo
    ] =
      useState(
        null
      )


    const [
      empresa,
      setEmpresa
    ] =
      useState(
        propia
          ? empresaFija
          : ""
      )


    const [
      subiendo,
      setSubiendo
    ] =
      useState(
        false
      )


    const [
      error,
      setError
    ] =
      useState(
        ""
      )


    const [
      arrastrando,
      setArrastrando
    ] =
      useState(
        false
      )


    /* ========================================================
       ACTUALIZAR EMPRESA FIJA
       ======================================================== */

    useEffect(
      () => {

        if (
          propia
        ) {

          setEmpresa(
            empresaFija ||
            ""
          )
        }

      },
      [
        propia,
        empresaFija
      ]
    )


    /* ========================================================
       TOMAR ARCHIVO
       ======================================================== */

    const tomar =
      (
        lista
      ) => {

        const elegido =
          lista &&
          lista[0]


        if (
          !elegido
        ) {
          return
        }


        if (
          !/\.(csv|xlsx|xls)$/i
            .test(
              elegido.name
            )
        ) {

          setArchivo(
            null
          )


          setError(
            "Solo se aceptan archivos CSV, XLSX o XLS"
          )


          if (
            input.current
          ) {

            input.current.value =
              ""
          }


          return
        }


        /*
         * La interfaz original indica
         * máximo 10 MB.
         */
        const limite =
          10 *
          1024 *
          1024


        if (
          elegido.size >
          limite
        ) {

          setArchivo(
            null
          )


          setError(
            "El archivo supera el límite máximo de 10 MB"
          )


          if (
            input.current
          ) {

            input.current.value =
              ""
          }


          return
        }


        setError(
          ""
        )


        setArchivo(
          elegido
        )
      }


    /* ========================================================
       ENVIAR ARCHIVO
       ======================================================== */

    const enviar =
      async () => {

        if (
          !archivo
        ) {

          setError(
            "Selecciona un archivo"
          )

          return
        }


        if (
          !empresa.trim()
        ) {

          setError(
            "Indica el nombre del restaurante"
          )

          return
        }


        const cuerpo =
          new FormData()


        cuerpo.append(
          "file",
          archivo
        )


        cuerpo.append(
          "empresa",
          empresa.trim()
        )


        cuerpo.append(
          "esPropia",
          String(
            propia
          )
        )


        setSubiendo(
          true
        )


        setError(
          ""
        )


        try {

          const {
            data
          } =
            await api.post(
              "/imports",
              cuerpo
            )


          /*
           * Se conserva la lógica original.
           *
           * Cuando el archivo pertenece
           * a la propia empresa,
           * se materializa la estructura.
           */
          let materializacion =
            null


          if (
            propia
          ) {

            try {

              materializacion =
                await db.materializar(
                  data.importacion.id,
                  data.estructura
                )

            } catch (
              problema
            ) {

              materializacion = {
                error:
                  problema.message
              }
            }
          }


          setArchivo(
            null
          )


          if (
            !propia
          ) {

            setEmpresa(
              ""
            )
          }


          if (
            input.current
          ) {

            input.current.value =
              ""
          }


          onSubido({
            ...data,

            materializacion
          })

        } catch (
          problema
        ) {

          setError(
            getMessage(
              problema
            )
          )

        } finally {

          setSubiendo(
            false
          )
        }
      }


    /* ========================================================
       RENDER
       ======================================================== */

    return (

      <div
        className={
          `card carga ${
            propia
              ? "carga-propia"
              : "carga-externa"
          }`
        }
      >

        {/* ====================================================
            CABECERA
            ==================================================== */}

        <div className="carga-head">

          <span
            className={
              `carga-tag ${
                propia
                  ? "tag-propia"
                  : "tag-externa"
              }`
            }
          >

            {propia
              ? "Nuestra empresa"
              : "Otra empresa"}

          </span>


          <h3>

            {propia
              ? "Importar datos de la empresa"
              : "Importar datos de otra empresa"}

          </h3>


          <p>

            {propia
              ? "Los datos propios crean y alimentan la tabla que podrás ampliar con columnas nuevas."
              : "Datos externos que sirven como referencia para realizar comparaciones."}

          </p>

        </div>


        {/* ====================================================
            DROPZONE
            ==================================================== */}

        <div
          className={
            `dropzone ${
              arrastrando
                ? "activa"
                : ""
            } ${
              archivo
                ? "con-archivo"
                : ""
            }`
          }
          onDragOver={
            (
              event
            ) => {

              event.preventDefault()


              setArrastrando(
                true
              )
            }
          }
          onDragLeave={
            () =>
              setArrastrando(
                false
              )
          }
          onDrop={
            (
              event
            ) => {

              event.preventDefault()


              setArrastrando(
                false
              )


              tomar(
                event.dataTransfer.files
              )
            }
          }
          onClick={
            () =>
              input.current &&
              input.current.click()
          }
        >

          <input
            ref={
              input
            }
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            disabled={
              subiendo
            }
            onChange={
              (
                event
              ) =>
                tomar(
                  event.target.files
                )
            }
          />


          {archivo ? (

            <>

              <strong>
                {archivo.name}
              </strong>


              <span>

                {(
                  archivo.size /
                  1024
                ).toFixed(
                  0
                )} KB · listo para subir

              </span>

            </>

          ) : (

            <>

              <strong>
                Arrastra el archivo o haz clic
              </strong>


              <span>
                CSV, XLSX o XLS · hasta 10 MB
              </span>

            </>

          )}

        </div>


        {/* ====================================================
            RESTAURANTE
            ==================================================== */}

        <div className="field">

          <label>
            Restaurante al que pertenecen los datos
          </label>


          <input
            value={
              empresa
            }
            disabled={
              propia ||
              subiendo
            }
            placeholder={
              propia
                ? empresaFija
                : "Ej. Sabor Norteño"
            }
            onChange={
              (
                event
              ) =>
                setEmpresa(
                  event.target.value
                )
            }
          />

        </div>


        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (

          <div className="alert alert-error">
            {error}
          </div>

        )}


        {/* ====================================================
            BOTON
            ==================================================== */}

        <button
          type="button"
          className="btn btn-block"
          disabled={
            subiendo ||
            !archivo
          }
          onClick={
            enviar
          }
        >

          {subiendo
            ? "Procesando archivo..."
            : "Importar datos"}

        </button>

      </div>
    )
  }


/* ==========================================================
   IMPORTAR
   ========================================================== */

const Importar =
  () => {

    /* ========================================================
       PESTAÑA PRINCIPAL
       ======================================================== */

    const [
      seccion,
      setSeccion
    ] =
      useState(
        "datos"
      )


    /* ========================================================
       IMPORTACIONES
       ======================================================== */

    const [
      lista,
      setLista
    ] =
      useState(
        []
      )


    const [
      cargando,
      setCargando
    ] =
      useState(
        true
      )


    const [
      error,
      setError
    ] =
      useState(
        ""
      )


    const [
      resultado,
      setResultado
    ] =
      useState(
        null
      )


    /* ========================================================
       CARGAR IMPORTACIONES
       ======================================================== */

    const cargar =
      async () => {

        setCargando(
          true
        )


        setError(
          ""
        )


        try {

          const respuesta =
            await api.get(
              "/imports"
            )


          setLista(
            Array.isArray(
              respuesta.data
            )
              ? respuesta.data
              : []
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

          setCargando(
            false
          )
        }
      }


    /* ========================================================
       CARGA INICIAL
       ======================================================== */

    useEffect(
      () => {

        cargar()

      },
      []
    )


    /* ========================================================
       ARCHIVO SUBIDO
       ======================================================== */

    const subido =
      (
        data
      ) => {

        setResultado(
          data
        )


        cargar()
      }


    /* ========================================================
       RENDER
       ======================================================== */

    return (

      <>

        {/* ====================================================
            TOPBAR
            ==================================================== */}

        <div className="topbar">

          <div>

            <h1>
              Cargar archivos
            </h1>


            <p>
              Importa datos para Big Data o adjunta documentación relacionada con el curso.
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
            SELECTOR PRINCIPAL
            ==================================================== */}

        <div
          className="card"
          style={{
            padding:
              "8px",

            marginBottom:
              "20px"
          }}
        >

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",

              gap:
                "8px"
            }}
          >

            {/* =================================================
                DATOS
                ================================================= */}

            <button
              type="button"
              onClick={
                () =>
                  setSeccion(
                    "datos"
                  )
              }
              style={{
                border:
                  seccion ===
                  "datos"
                    ? "1px solid #c85c2d"
                    : "1px solid transparent",

                background:
                  seccion ===
                  "datos"
                    ? "#fff7f2"
                    : "transparent",

                color:
                  seccion ===
                  "datos"
                    ? "#9a3f18"
                    : "#6b625d",

                borderRadius:
                  "10px",

                padding:
                  "14px 16px",

                cursor:
                  "pointer",

                textAlign:
                  "left",

                transition:
                  "all 0.2s ease"
              }}
            >

              <div
                style={{
                  fontWeight:
                    800,

                  fontSize:
                    "14px"
                }}
              >
                Datos CSV / Excel
              </div>


              <div
                style={{
                  marginTop:
                    "3px",

                  fontSize:
                    "12px",

                  opacity:
                    0.75
                }}
              >
                CSV, XLSX o XLS para análisis.
              </div>

            </button>


            {/* =================================================
                DOCUMENTACION
                ================================================= */}

            <button
              type="button"
              onClick={
                () =>
                  setSeccion(
                    "documentacion"
                  )
              }
              style={{
                border:
                  seccion ===
                  "documentacion"
                    ? "1px solid #c85c2d"
                    : "1px solid transparent",

                background:
                  seccion ===
                  "documentacion"
                    ? "#fff7f2"
                    : "transparent",

                color:
                  seccion ===
                  "documentacion"
                    ? "#9a3f18"
                    : "#6b625d",

                borderRadius:
                  "10px",

                padding:
                  "14px 16px",

                cursor:
                  "pointer",

                textAlign:
                  "left",

                transition:
                  "all 0.2s ease"
              }}
            >

              <div
                style={{
                  fontWeight:
                    800,

                  fontSize:
                    "14px"
                }}
              >
                Documentación
              </div>


              <div
                style={{
                  marginTop:
                    "3px",

                  fontSize:
                    "12px",

                  opacity:
                    0.75
                }}
              >
                PDF, Word, Excel o PowerPoint.
              </div>

            </button>

          </div>

        </div>


        {/* ====================================================
            SECCION DATOS
            ==================================================== */}

        {seccion ===
        "datos" && (

          <>

            {/* =================================================
                TITULO
                ================================================= */}

            <div
              style={{
                marginBottom:
                  "14px"
              }}
            >

              <h2
                style={{
                  margin:
                    0,

                  fontSize:
                    "18px"
                }}
              >
                Importar datos
              </h2>


              <p
                className="muted"
                style={{
                  margin:
                    "4px 0 0"
                }}
              >
                Selecciona si la información pertenece a tu empresa o a otro restaurante.
              </p>

            </div>


            {/* =================================================
                ZONAS DE CARGA
                ================================================= */}

            <div className="grid-2 grid-carga">

              <ZonaCarga
                propia
                empresaFija={
                  getEmpresa()
                }
                onSubido={
                  subido
                }
              />


              <ZonaCarga
                propia={
                  false
                }
                onSubido={
                  subido
                }
              />

            </div>


            {/* =================================================
                ARCHIVOS CARGADOS
                ================================================= */}

            <div className="card">

              <div className="chart-title">
                Archivos de datos cargados
              </div>


              <p
                className="muted"
                style={{
                  margin:
                    "5px 0 18px"
                }}
              >
                Historial de archivos CSV y Excel disponibles para Big Data.
              </p>


              {cargando && (

                <div className="loading">
                  Cargando...
                </div>

              )}


              {error && (

                <div className="alert alert-error">
                  {error}
                </div>

              )}


              {!cargando &&
                lista.length ===
                0 && (

                <div className="empty">
                  Todavía no has importado ningún archivo de datos.
                </div>

              )}


              {lista.length >
                0 && (

                <div className="table-wrap">

                  <table>

                    <thead>

                      <tr>

                        <th>
                          Archivo
                        </th>


                        <th>
                          Restaurante
                        </th>


                        <th>
                          Origen
                        </th>


                        <th
                          style={{
                            textAlign:
                              "right"
                          }}
                        >
                          Filas
                        </th>


                        <th
                          style={{
                            textAlign:
                              "right"
                          }}
                        >
                          Columnas
                        </th>


                        <th>
                          Fecha
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {lista.map(
                        (
                          item
                        ) => (

                          <tr
                            key={
                              item.id
                            }
                          >

                            <td>

                              <span className="cell-main">
                                {item.archivo}
                              </span>


                              <span className="muted">

                                {String(
                                  item.formato ||
                                  ""
                                ).toUpperCase()}

                              </span>

                            </td>


                            <td>
                              {item.empresa}
                            </td>


                            <td>

                              <span
                                className={
                                  `chip ${
                                    item.es_propia
                                      ? "chip-propia"
                                      : "chip-externa"
                                  }`
                                }
                              >

                                {item.es_propia
                                  ? "Nuestra"
                                  : "Competencia"}

                              </span>

                            </td>


                            <td
                              style={{
                                textAlign:
                                  "right"
                              }}
                            >
                              {miles(
                                item.total_filas
                              )}
                            </td>


                            <td
                              style={{
                                textAlign:
                                  "right"
                              }}
                            >

                              {Array.isArray(
                                item.columnas
                              )
                                ? item.columnas.length
                                : 0}

                            </td>


                            <td className="muted">

                              {item.created_at
                                ? new Date(
                                    item.created_at
                                  ).toLocaleDateString(
                                    "es-PE"
                                  )
                                : "—"}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </>

        )}


        {/* ====================================================
            SECCION DOCUMENTACION
            ==================================================== */}

        {seccion ===
        "documentacion" && (

          <div className="card">

            <div
              style={{
                marginBottom:
                  "18px"
              }}
            >

              <div className="chart-title">
                Documentación del curso
              </div>


              <p
                className="muted"
                style={{
                  margin:
                    "5px 0 0"
                }}
              >
                Adjunta archivos de apoyo, informes, prácticas, presentaciones y material relacionado con Big Data.
              </p>

            </div>


            <DocumentosCurso
              cursoId={
                BIG_DATA_CURSO_ID
              }
            />

          </div>

        )}


        {/* ====================================================
            MODAL DE IMPORTACION
            ==================================================== */}

        {resultado && (

          <Modal
            title="Archivo importado"
            onClose={
              () =>
                setResultado(
                  null
                )
            }
          >

            {/* =================================================
                RESUMEN
                ================================================= */}

            <div className="metrics metrics-3">

              <div className="metric">

                <span>
                  Filas cargadas
                </span>


                <strong>

                  {miles(
                    resultado?.resumen?.filas ||
                    0
                  )}

                </strong>

              </div>


              <div className="metric">

                <span>
                  Columnas detectadas
                </span>


                <strong>
                  {resultado?.resumen?.columnas ||
                    0}
                </strong>

              </div>


              <div className="metric">

                <span>
                  Formato
                </span>


                <strong>

                  {String(
                    resultado?.resumen?.formato ||
                    ""
                  ).toUpperCase()}

                </strong>

              </div>

            </div>


            {/* =================================================
                ESTRUCTURA
                ================================================= */}

            <p
              className="muted"
              style={{
                margin:
                  "18px 0 10px"
              }}
            >

              Estructura reconocida en{" "}

              <strong>
                {resultado?.importacion?.archivo ||
                  "archivo"}
              </strong>:

            </p>


            <div
              className="table-wrap"
              style={{
                maxHeight:
                  "260px",

                overflowY:
                  "auto"
              }}
            >

              <table>

                <thead>

                  <tr>

                    <th>
                      Columna del archivo
                    </th>


                    <th>
                      Nombre en la base
                    </th>


                    <th>
                      Tipo deducido
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {Array.isArray(
                    resultado.estructura
                  ) &&
                    resultado.estructura.map(
                      (
                        campo
                      ) => (

                        <tr
                          key={
                            campo.columna
                          }
                        >

                          <td className="cell-main">
                            {campo.original}
                          </td>


                          <td className="muted">
                            {campo.columna}
                          </td>


                          <td>

                            <span className="chip chip-tipo">
                              {campo.tipo}
                            </span>

                          </td>

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>


            {/* =================================================
                MATERIALIZACION CORRECTA
                ================================================= */}

            {resultado.materializacion &&
              !resultado.materializacion.error && (

              <div
                className="alert alert-success"
                style={{
                  marginTop:
                    "16px"
                }}
              >

                Los datos se volcaron en la tabla{" "}

                <strong>
                  {resultado.materializacion.tabla}
                </strong>

                {resultado.materializacion.creada
                  ? ", que se creó con este archivo. "
                  : ", que ya existía. "}

                Ya puedes agregarle columnas desde Estructura de datos.

              </div>

            )}


            {/* =================================================
                MATERIALIZACION CON ERROR
                ================================================= */}

            {resultado.materializacion &&
              resultado.materializacion.error && (

              <div
                className="alert alert-error"
                style={{
                  marginTop:
                    "16px"
                }}
              >

                El archivo quedó guardado, pero no se pudo volcar a la tabla de la empresa:{" "}

                {resultado.materializacion.error}

              </div>

            )}

          </Modal>

        )}

      </>
    )
  }


export default Importar