import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import {
  listarDocumentosCurso,
  subirDocumentoCurso,
  obtenerUrlDocumento,
  eliminarDocumentoCurso,
  obtenerModulosCurso,
  getMessage,
  getPerfil,
  esAdmin
} from "../api"

import Modal from "../components/Modal"


/* ==========================================================
   CONFIGURACION
   ========================================================== */

const MAX_BYTES =
  25 * 1024 * 1024


const EXTENSIONES = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx"
]


/* ==========================================================
   NORMALIZAR MODULOS
   ========================================================== */

const normalizarModulos = (
  respuesta
) => {

  if (
    Array.isArray(
      respuesta
    )
  ) {
    return respuesta
  }


  if (
    Array.isArray(
      respuesta?.modulos
    )
  ) {
    return respuesta.modulos
  }


  if (
    Array.isArray(
      respuesta?.modules
    )
  ) {
    return respuesta.modules
  }


  if (
    Array.isArray(
      respuesta?.data
    )
  ) {
    return respuesta.data
  }


  if (
    Array.isArray(
      respuesta?.data?.modulos
    )
  ) {
    return respuesta.data.modulos
  }


  if (
    Array.isArray(
      respuesta?.data?.modules
    )
  ) {
    return respuesta.data.modules
  }


  return []
}


/* ==========================================================
   NORMALIZAR DOCUMENTOS
   ========================================================== */

const normalizarDocumentos = (
  respuesta
) => {

  if (
    Array.isArray(
      respuesta
    )
  ) {
    return respuesta
  }


  if (
    Array.isArray(
      respuesta?.documentos
    )
  ) {
    return respuesta.documentos
  }


  if (
    Array.isArray(
      respuesta?.data?.documentos
    )
  ) {
    return respuesta.data.documentos
  }


  return []
}


/* ==========================================================
   EXTENSION DEL DOCUMENTO
   ========================================================== */

const obtenerExtensionDocumento = (
  documento
) => {

  const extension =
    String(
      documento?.extension ||
      ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /^\./,
        ""
      )


  if (
    extension
  ) {
    return extension
  }


  const nombre =
    String(
      documento?.nombre_original ||
      documento?.nombre_archivo ||
      ""
    )


  const partes =
    nombre.split(".")


  if (
    partes.length <= 1
  ) {
    return ""
  }


  return String(
    partes[
      partes.length - 1
    ] ||
    ""
  ).toLowerCase()
}


/* ==========================================================
   DETECTAR PDF
   ========================================================== */

const esDocumentoPdf = (
  documento
) => {

  const extension =
    obtenerExtensionDocumento(
      documento
    )


  const mime =
    String(
      documento?.mime_type ||
      ""
    ).toLowerCase()


  return (
    extension === "pdf" ||
    mime === "application/pdf"
  )
}


/* ==========================================================
   FORMATO DE TAMAÑO
   ========================================================== */

const formatoTamano = (
  bytes
) => {

  const numero =
    Number(
      bytes ||
      0
    )


  if (
    !Number.isFinite(
      numero
    ) ||
    numero <= 0
  ) {
    return "0 KB"
  }


  if (
    numero < 1024
  ) {
    return `${numero} B`
  }


  if (
    numero <
    1024 * 1024
  ) {
    return `${(
      numero /
      1024
    ).toFixed(
      1
    )} KB`
  }


  return `${(
    numero /
    (
      1024 *
      1024
    )
  ).toFixed(
    1
  )} MB`
}


/* ==========================================================
   FORMATO DE FECHA
   ========================================================== */

const formatoFecha = (
  valor
) => {

  if (
    !valor
  ) {
    return "Sin fecha"
  }


  const fecha =
    new Date(
      valor
    )


  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "Sin fecha"
  }


  return fecha.toLocaleString(
    "es-PE",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit"
    }
  )
}


/* ==========================================================
   NOMBRE DEL TIPO
   ========================================================== */

const nombreTipo = (
  extension
) => {

  const valor =
    String(
      extension ||
      ""
    )
      .trim()
      .toLowerCase()


  if (
    valor === "pdf"
  ) {
    return "PDF"
  }


  if (
    valor === "doc" ||
    valor === "docx"
  ) {
    return "Word"
  }


  if (
    valor === "xls" ||
    valor === "xlsx"
  ) {
    return "Excel"
  }


  if (
    valor === "ppt" ||
    valor === "pptx"
  ) {
    return "PowerPoint"
  }


  return valor
    ? valor.toUpperCase()
    : "Archivo"
}


/* ==========================================================
   PANEL DE DOCUMENTACION
   ========================================================== */

const DocumentosCurso = ({
  cursoId = 1
}) => {

  /* ========================================================
     DATOS
     ======================================================== */

  const [
    modulos,
    setModulos
  ] =
    useState([])


  const [
    documentos,
    setDocumentos
  ] =
    useState([])


  /* ========================================================
     FORMULARIO
     ======================================================== */

  const [
    archivo,
    setArchivo
  ] =
    useState(null)


  const [
    moduloId,
    setModuloId
  ] =
    useState("")


  const [
    descripcion,
    setDescripcion
  ] =
    useState("")


  /* ========================================================
     FILTRO
     ======================================================== */

  const [
    filtroModulo,
    setFiltroModulo
  ] =
    useState("")


  /* ========================================================
     ESTADOS
     ======================================================== */

  const [
    cargando,
    setCargando
  ] =
    useState(true)


  const [
    subiendo,
    setSubiendo
  ] =
    useState(false)


  const [
    abriendoId,
    setAbriendoId
  ] =
    useState(null)


  const [
    descargandoId,
    setDescargandoId
  ] =
    useState(null)


  const [
    eliminandoId,
    setEliminandoId
  ] =
    useState(null)


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
     VISTA PREVIA PDF
     ======================================================== */

  const [
    documentoPreview,
    setDocumentoPreview
  ] =
    useState(null)


  const [
    urlPreview,
    setUrlPreview
  ] =
    useState("")


  const [
    cargandoPreview,
    setCargandoPreview
  ] =
    useState(false)


  const [
    errorPreview,
    setErrorPreview
  ] =
    useState("")


  const inputArchivoRef =
    useRef(null)


  /* ========================================================
     USUARIO
     ======================================================== */

  const perfil =
    getPerfil()


  const administrador =
    esAdmin()


  /* ========================================================
     MAPA DE MODULOS
     ======================================================== */

  const modulosPorId =
    useMemo(
      () => {

        const mapa =
          new Map()


        for (
          const modulo
          of modulos
        ) {

          mapa.set(
            String(
              modulo.id
            ),
            modulo
          )
        }


        return mapa
      },
      [
        modulos
      ]
    )


  /* ========================================================
     NOMBRE DEL MODULO
     ======================================================== */

  const nombreModulo =
    useCallback(
      (
        id
      ) => {

        if (
          id === null ||
          id === undefined
        ) {
          return "General"
        }


        return (
          modulosPorId.get(
            String(
              id
            )
          )?.nombre ||
          `Módulo ${id}`
        )
      },
      [
        modulosPorId
      ]
    )


  /* ========================================================
     CARGAR DOCUMENTACION
     ======================================================== */

  const cargarDatos =
    useCallback(
      async (
        mostrarCarga = true
      ) => {

        if (
          mostrarCarga
        ) {
          setCargando(true)
        }


        setError("")


        try {

          const [
            respuestaModulos,
            respuestaDocumentos
          ] =
            await Promise.all([
              obtenerModulosCurso(
                cursoId
              ),

              listarDocumentosCurso(
                cursoId
              )
            ])


          setModulos(
            normalizarModulos(
              respuestaModulos
            )
          )


          setDocumentos(
            normalizarDocumentos(
              respuestaDocumentos
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
            setCargando(false)
          }
        }
      },
      [
        cursoId
      ]
    )


  /* ========================================================
     CARGA INICIAL
     ======================================================== */

  useEffect(
    () => {

      cargarDatos()

    },
    [
      cargarDatos
    ]
  )


  /* ========================================================
     AVISO TEMPORAL
     ======================================================== */

  const mostrarAviso = (
    mensaje
  ) => {

    setAviso(
      mensaje
    )


    window.setTimeout(
      () => {

        setAviso("")

      },
      4000
    )
  }


  /* ========================================================
     SELECCIONAR ARCHIVO
     ======================================================== */

  const cambiarArchivo = (
    event
  ) => {

    const seleccionado =
      event
        .target
        .files?.[0] ||
      null


    setError("")


    if (
      !seleccionado
    ) {

      setArchivo(null)

      return
    }


    if (
      seleccionado.size >
      MAX_BYTES
    ) {

      setArchivo(null)

      event.target.value = ""


      setError(
        "El archivo supera el límite máximo de 25 MB."
      )

      return
    }


    const nombre =
      String(
        seleccionado.name ||
        ""
      ).toLowerCase()


    const valido =
      EXTENSIONES.some(
        (
          extension
        ) =>
          nombre.endsWith(
            extension
          )
      )


    if (
      !valido
    ) {

      setArchivo(null)

      event.target.value = ""


      setError(
        "Formato no permitido. Usa PDF, Word, Excel o PowerPoint."
      )

      return
    }


    setArchivo(
      seleccionado
    )
  }


  /* ========================================================
     LIMPIAR FORMULARIO
     ======================================================== */

  const limpiarFormulario =
    () => {

      setArchivo(null)

      setModuloId("")

      setDescripcion("")


      if (
        inputArchivoRef.current
      ) {

        inputArchivoRef.current.value =
          ""
      }
    }


  /* ========================================================
     SUBIR DOCUMENTO
     ======================================================== */

  const enviarDocumento =
    async (
      event
    ) => {

      event.preventDefault()


      if (
        subiendo
      ) {
        return
      }


      setError("")


      if (
        !archivo
      ) {

        setError(
          "Selecciona un archivo antes de continuar."
        )

        return
      }


      setSubiendo(true)


      try {

        const resultado =
          await subirDocumentoCurso({
            cursoId,

            moduloId:
              moduloId ||
              null,

            archivo,

            descripcion
          })


        limpiarFormulario()


        await cargarDatos(
          false
        )


        mostrarAviso(
          resultado?.mensaje ||
          "Documento subido correctamente."
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

        setSubiendo(false)
      }
    }


  /* ========================================================
     VISTA PREVIA DEL PDF
     ======================================================== */

  const previsualizarPdf =
    async (
      documento
    ) => {

      if (
        !esDocumentoPdf(
          documento
        )
      ) {

        setError(
          "La vista previa interna está disponible por ahora solo para archivos PDF."
        )

        return
      }


      setDocumentoPreview(
        documento
      )

      setUrlPreview("")

      setErrorPreview("")

      setCargandoPreview(
        true
      )


      try {

        const resultado =
          await obtenerUrlDocumento(
            documento.id
          )


        if (
          !resultado?.url
        ) {

          throw new Error(
            "No se pudo obtener la URL del PDF."
          )
        }


        setUrlPreview(
          resultado.url
        )

      } catch (
        problema
      ) {

        setErrorPreview(
          getMessage(
            problema
          )
        )

      } finally {

        setCargandoPreview(
          false
        )
      }
    }


  /* ========================================================
     CERRAR VISTA PREVIA
     ======================================================== */

  const cerrarPreview =
    () => {

      setDocumentoPreview(
        null
      )

      setUrlPreview("")

      setErrorPreview("")

      setCargandoPreview(
        false
      )
    }


  /* ========================================================
     ABRIR EN OTRA PESTAÑA
     ======================================================== */

  const abrirDocumento =
    async (
      documento
    ) => {

      if (
        abriendoId
      ) {
        return
      }


      /*
       * Abrimos la ventana antes del await
       * para evitar que el navegador la
       * bloquee como popup.
       */
      const ventana =
        window.open(
          "",
          "_blank"
        )


      setAbriendoId(
        documento.id
      )

      setError("")


      try {

        const resultado =
          await obtenerUrlDocumento(
            documento.id
          )


        if (
          !resultado?.url
        ) {

          throw new Error(
            "No se pudo obtener el acceso al documento."
          )
        }


        if (
          ventana
        ) {

          ventana.opener =
            null

          ventana.location.href =
            resultado.url

        } else {

          window.open(
            resultado.url,
            "_blank",
            "noopener,noreferrer"
          )
        }

      } catch (
        problema
      ) {

        if (
          ventana
        ) {
          ventana.close()
        }


        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setAbriendoId(
          null
        )
      }
    }


  /* ========================================================
     ABRIR URL DEL PREVIEW EN OTRA PESTAÑA
     ======================================================== */

  const abrirPreviewEnPestana =
    () => {

      if (
        !urlPreview
      ) {
        return
      }


      window.open(
        urlPreview,
        "_blank",
        "noopener,noreferrer"
      )
    }


  /* ========================================================
     DESCARGAR DOCUMENTO
     ======================================================== */

  const descargarDocumento =
    async (
      documento
    ) => {

      if (
        descargandoId
      ) {
        return
      }


      setDescargandoId(
        documento.id
      )

      setError("")


      try {

        const resultado =
          await obtenerUrlDocumento(
            documento.id
          )


        if (
          !resultado?.url
        ) {

          throw new Error(
            "No se pudo obtener el acceso al documento."
          )
        }


        try {

          const respuesta =
            await fetch(
              resultado.url
            )


          if (
            !respuesta.ok
          ) {

            throw new Error(
              "No se pudo descargar el archivo."
            )
          }


          const blob =
            await respuesta.blob()


          const urlTemporal =
            URL.createObjectURL(
              blob
            )


          const enlace =
            document.createElement(
              "a"
            )


          enlace.href =
            urlTemporal


          enlace.download =
            documento.nombre_original ||
            documento.nombre_archivo ||
            `documento-${documento.id}`


          document.body.appendChild(
            enlace
          )


          enlace.click()

          enlace.remove()


          URL.revokeObjectURL(
            urlTemporal
          )

        } catch {

          /*
           * Fallback en caso de que el
           * navegador bloquee el fetch
           * por CORS.
           */
          window.open(
            resultado.url,
            "_blank",
            "noopener,noreferrer"
          )
        }

      } catch (
        problema
      ) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setDescargandoId(
          null
        )
      }
    }


  /* ========================================================
     DESCARGAR DESDE VISTA PREVIA
     ======================================================== */

  const descargarDesdePreview =
    async () => {

      if (
        !documentoPreview
      ) {
        return
      }


      await descargarDocumento(
        documentoPreview
      )
    }


  /* ========================================================
     PERMISO DE ELIMINACION
     ======================================================== */

  const puedeEliminar = (
    documento
  ) => {

    if (
      administrador
    ) {
      return true
    }


    if (
      !perfil?.id ||
      !documento?.user_id
    ) {
      return false
    }


    return (
      String(
        perfil.id
      ) ===
      String(
        documento.user_id
      )
    )
  }


  /* ========================================================
     ELIMINAR DOCUMENTO
     ======================================================== */

  const eliminarDocumento =
    async (
      documento
    ) => {

      if (
        eliminandoId
      ) {
        return
      }


      const confirmado =
        window.confirm(
          `¿Eliminar "${documento.nombre_original}"?`
        )


      if (
        !confirmado
      ) {
        return
      }


      setEliminandoId(
        documento.id
      )

      setError("")


      try {

        const resultado =
          await eliminarDocumentoCurso(
            documento.id
          )


        setDocumentos(
          (
            actuales
          ) =>
            actuales.filter(
              (
                item
              ) =>
                String(
                  item.id
                ) !==
                String(
                  documento.id
                )
            )
        )


        if (
          documentoPreview &&
          String(
            documentoPreview.id
          ) ===
          String(
            documento.id
          )
        ) {

          cerrarPreview()
        }


        mostrarAviso(
          resultado?.mensaje ||
          "Documento eliminado correctamente."
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

        setEliminandoId(
          null
        )
      }
    }


  /* ========================================================
     FILTRAR DOCUMENTOS
     ======================================================== */

  const documentosVisibles =
    useMemo(
      () => {

        if (
          !filtroModulo
        ) {
          return documentos
        }


        if (
          filtroModulo ===
          "general"
        ) {

          return documentos.filter(
            (
              documento
            ) =>
              documento.modulo_id ===
                null ||
              documento.modulo_id ===
                undefined
          )
        }


        return documentos.filter(
          (
            documento
          ) =>
            String(
              documento.modulo_id
            ) ===
            String(
              filtroModulo
            )
        )
      },
      [
        documentos,
        filtroModulo
      ]
    )


  /* ========================================================
     RENDER
     ======================================================== */

  return (
    <>
      <div>

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
            CARGANDO
            ==================================================== */}

        {cargando ? (

          <div className="loading">
            Cargando documentación...
          </div>

        ) : (

          <>
            {/* =================================================
                INFORMACION GENERAL
                ================================================= */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",

                gap:
                  "12px",

                marginBottom:
                  "18px"
              }}
            >
              {/* DOCUMENTOS */}

              <div
                style={{
                  border:
                    "1px solid #eee5df",

                  borderRadius:
                    "12px",

                  padding:
                    "14px 16px",

                  background:
                    "#fff"
                }}
              >
                <div
                  className="muted"
                  style={{
                    fontSize:
                      "12px"
                  }}
                >
                  Documentos
                </div>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",

                    fontSize:
                      "22px"
                  }}
                >
                  {documentos.length}
                </strong>
              </div>


              {/* FORMATOS */}

              <div
                style={{
                  border:
                    "1px solid #eee5df",

                  borderRadius:
                    "12px",

                  padding:
                    "14px 16px",

                  background:
                    "#fff"
                }}
              >
                <div
                  className="muted"
                  style={{
                    fontSize:
                      "12px"
                  }}
                >
                  Formatos
                </div>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",

                    fontSize:
                      "14px"
                  }}
                >
                  PDF · Word · Excel · PowerPoint
                </strong>
              </div>


              {/* VISTA PREVIA */}

              <div
                style={{
                  border:
                    "1px solid #eee5df",

                  borderRadius:
                    "12px",

                  padding:
                    "14px 16px",

                  background:
                    "#fff"
                }}
              >
                <div
                  className="muted"
                  style={{
                    fontSize:
                      "12px"
                  }}
                >
                  Vista previa
                </div>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",

                    fontSize:
                      "14px"
                  }}
                >
                  PDF disponible
                </strong>
              </div>


              {/* MAXIMO */}

              <div
                style={{
                  border:
                    "1px solid #eee5df",

                  borderRadius:
                    "12px",

                  padding:
                    "14px 16px",

                  background:
                    "#fff"
                }}
              >
                <div
                  className="muted"
                  style={{
                    fontSize:
                      "12px"
                  }}
                >
                  Tamaño máximo
                </div>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      "4px",

                    fontSize:
                      "22px"
                  }}
                >
                  25 MB
                </strong>
              </div>
            </div>


            {/* =================================================
                SUBIDA
                ================================================= */}

            <div
              style={{
                border:
                  "1px solid #eadfd7",

                borderRadius:
                  "14px",

                padding:
                  "18px",

                background:
                  "#fff",

                marginBottom:
                  "20px"
              }}
            >
              <div
                style={{
                  marginBottom:
                    "16px"
                }}
              >
                <strong
                  style={{
                    fontSize:
                      "16px"
                  }}
                >
                  Subir documentación
                </strong>

                <div
                  className="muted"
                  style={{
                    marginTop:
                      "4px",

                    fontSize:
                      "13px"
                  }}
                >
                  Adjunta material relacionado con el curso.
                </div>
              </div>


              <form
                onSubmit={
                  enviarDocumento
                }
              >
                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(240px, 1fr))",

                    gap:
                      "14px"
                  }}
                >
                  {/* ARCHIVO */}

                  <div className="field">
                    <label>
                      Archivo
                    </label>

                    <input
                      ref={
                        inputArchivoRef
                      }
                      type="file"
                      accept={
                        EXTENSIONES.join(
                          ","
                        )
                      }
                      disabled={
                        subiendo
                      }
                      onChange={
                        cambiarArchivo
                      }
                    />

                    <span className="muted">
                      {archivo
                        ? `${archivo.name} · ${formatoTamano(
                            archivo.size
                          )}`
                        : "PDF, Word, Excel o PowerPoint"}
                    </span>
                  </div>


                  {/* MODULO */}

                  <div className="field">
                    <label>
                      Relacionar con
                    </label>

                    <select
                      value={
                        moduloId
                      }
                      disabled={
                        subiendo
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setModuloId(
                            event.target.value
                          )
                      }
                    >
                      <option value="">
                        General del curso
                      </option>

                      {modulos.map(
                        (
                          modulo
                        ) => (
                          <option
                            key={
                              modulo.id
                            }
                            value={
                              modulo.id
                            }
                          >
                            {modulo.nombre}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>


                {/* DESCRIPCION */}

                <div
                  className="field"
                  style={{
                    marginTop:
                      "14px"
                  }}
                >
                  <label>
                    Descripción
                  </label>

                  <textarea
                    rows={3}
                    maxLength={500}
                    value={
                      descripcion
                    }
                    disabled={
                      subiendo
                    }
                    placeholder="Ejemplo: Material de la semana 2..."
                    onChange={
                      (
                        event
                      ) =>
                        setDescripcion(
                          event.target.value
                        )
                    }
                  />

                  <span className="muted">
                    {descripcion.length}/500
                  </span>
                </div>


                {/* BOTONES */}

                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "flex-end",

                    gap:
                      "10px",

                    flexWrap:
                      "wrap",

                    marginTop:
                      "16px"
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-light"
                    disabled={
                      subiendo
                    }
                    onClick={
                      limpiarFormulario
                    }
                  >
                    Limpiar
                  </button>

                  <button
                    type="submit"
                    className="btn"
                    disabled={
                      subiendo ||
                      !archivo
                    }
                  >
                    {subiendo
                      ? "Subiendo..."
                      : "Subir documento"}
                  </button>
                </div>
              </form>
            </div>


            {/* =================================================
                LISTADO
                ================================================= */}

            <div>
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "flex-end",

                  gap:
                    "14px",

                  flexWrap:
                    "wrap",

                  marginBottom:
                    "14px"
                }}
              >
                <div>
                  <strong
                    style={{
                      fontSize:
                        "16px"
                    }}
                  >
                    Documentos cargados
                  </strong>

                  <div
                    className="muted"
                    style={{
                      marginTop:
                        "3px",

                      fontSize:
                        "13px"
                    }}
                  >
                    {documentosVisibles.length} archivo
                    {documentosVisibles.length === 1
                      ? ""
                      : "s"}
                  </div>
                </div>


                {/* FILTRO */}

                <div
                  className="field"
                  style={{
                    margin:
                      0,

                    minWidth:
                      "220px"
                  }}
                >
                  <label>
                    Mostrar
                  </label>

                  <select
                    value={
                      filtroModulo
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setFiltroModulo(
                          event.target.value
                        )
                    }
                  >
                    <option value="">
                      Todos
                    </option>

                    <option value="general">
                      Generales
                    </option>

                    {modulos.map(
                      (
                        modulo
                      ) => (
                        <option
                          key={
                            modulo.id
                          }
                          value={
                            modulo.id
                          }
                        >
                          {modulo.nombre}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>


              {/* VACIO */}

              {documentosVisibles.length === 0 ? (

                <div className="empty">
                  <strong
                    style={{
                      display:
                        "block",

                      marginBottom:
                        "5px"
                    }}
                  >
                    No hay documentación cargada
                  </strong>

                  <span>
                    Los documentos que subas aparecerán aquí.
                  </span>
                </div>

              ) : (

                <div
                  style={{
                    display:
                      "flex",

                    flexDirection:
                      "column",

                    gap:
                      "10px"
                  }}
                >
                  {documentosVisibles.map(
                    (
                      documento
                    ) => {

                      const abriendo =
                        String(
                          abriendoId
                        ) ===
                        String(
                          documento.id
                        )


                      const descargando =
                        String(
                          descargandoId
                        ) ===
                        String(
                          documento.id
                        )


                      const eliminando =
                        String(
                          eliminandoId
                        ) ===
                        String(
                          documento.id
                        )


                      const pdf =
                        esDocumentoPdf(
                          documento
                        )


                      return (
                        <div
                          key={
                            documento.id
                          }
                          style={{
                            border:
                              "1px solid #eadfd7",

                            borderRadius:
                              "12px",

                            padding:
                              "13px 14px",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "space-between",

                            gap:
                              "14px",

                            flexWrap:
                              "wrap",

                            background:
                              "#fff"
                          }}
                        >
                          {/* ===============================
                              INFORMACION
                              =============================== */}

                          <div
                            style={{
                              minWidth:
                                0,

                              flex:
                                "1 1 320px"
                            }}
                          >
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
                              <strong
                                style={{
                                  overflowWrap:
                                    "anywhere"
                                }}
                              >
                                {documento.nombre_original ||
                                  documento.nombre_archivo ||
                                  `Documento ${documento.id}`}
                              </strong>


                              <span
                                style={{
                                  border:
                                    "1px solid #eadfd7",

                                  borderRadius:
                                    "999px",

                                  padding:
                                    "3px 7px",

                                  fontSize:
                                    "11px",

                                  fontWeight:
                                    700,

                                  background:
                                    pdf
                                      ? "#fff4ee"
                                      : "#faf7f5",

                                  color:
                                    pdf
                                      ? "#a9461c"
                                      : "inherit"
                                }}
                              >
                                {nombreTipo(
                                  obtenerExtensionDocumento(
                                    documento
                                  )
                                )}
                              </span>


                              {pdf && (
                                <span
                                  style={{
                                    border:
                                      "1px solid #bbf7d0",

                                    background:
                                      "#f0fdf4",

                                    color:
                                      "#166534",

                                    borderRadius:
                                      "999px",

                                    padding:
                                      "3px 7px",

                                    fontSize:
                                      "11px",

                                    fontWeight:
                                      700
                                  }}
                                >
                                  Vista previa
                                </span>
                              )}
                            </div>


                            <div
                              className="muted"
                              style={{
                                marginTop:
                                  "5px",

                                fontSize:
                                  "12px",

                                display:
                                  "flex",

                                gap:
                                  "5px",

                                flexWrap:
                                  "wrap"
                              }}
                            >
                              <span>
                                {nombreModulo(
                                  documento.modulo_id
                                )}
                              </span>

                              <span>
                                ·
                              </span>

                              <span>
                                {formatoTamano(
                                  documento.tamano_bytes
                                )}
                              </span>

                              <span>
                                ·
                              </span>

                              <span>
                                {formatoFecha(
                                  documento.created_at
                                )}
                              </span>
                            </div>


                            {documento.descripcion && (
                              <div
                                className="muted"
                                style={{
                                  marginTop:
                                    "6px",

                                  fontSize:
                                    "13px"
                                }}
                              >
                                {documento.descripcion}
                              </div>
                            )}
                          </div>


                          {/* ===============================
                              ACCIONES
                              =============================== */}

                          <div
                            style={{
                              display:
                                "flex",

                              gap:
                                "7px",

                              flexWrap:
                                "wrap"
                            }}
                          >
                            {/* PDF */}

                            {pdf && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={
                                  () =>
                                    previsualizarPdf(
                                      documento
                                    )
                                }
                              >
                                Vista previa
                              </button>
                            )}


                            {/* ABRIR */}

                            <button
                              type="button"
                              className="btn btn-light btn-sm"
                              disabled={
                                abriendo
                              }
                              onClick={
                                () =>
                                  abrirDocumento(
                                    documento
                                  )
                              }
                            >
                              {abriendo
                                ? "Abriendo..."
                                : pdf
                                  ? "Abrir pestaña"
                                  : "Abrir"}
                            </button>


                            {/* DESCARGAR */}

                            <button
                              type="button"
                              className="btn btn-light btn-sm"
                              disabled={
                                descargando
                              }
                              onClick={
                                () =>
                                  descargarDocumento(
                                    documento
                                  )
                              }
                            >
                              {descargando
                                ? "Descargando..."
                                : "Descargar"}
                            </button>


                            {/* ELIMINAR */}

                            {puedeEliminar(
                              documento
                            ) && (
                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                disabled={
                                  eliminando
                                }
                                onClick={
                                  () =>
                                    eliminarDocumento(
                                      documento
                                    )
                                }
                                style={{
                                  color:
                                    "#b91c1c",

                                  border:
                                    "1px solid #fecaca"
                                }}
                              >
                                {eliminando
                                  ? "Eliminando..."
                                  : "Eliminar"}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>


      {/* ====================================================
          MODAL VISTA PREVIA PDF
          ==================================================== */}

      {documentoPreview && (
        <Modal
          ancho
          title={
            `Vista previa — ${
              documentoPreview.nombre_original ||
              documentoPreview.nombre_archivo ||
              "Documento PDF"
            }`
          }
          onClose={
            cerrarPreview
          }
        >
          {/* ================================================
              INFORMACION SUPERIOR
              ================================================ */}

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

              flexWrap:
                "wrap",

              marginBottom:
                "14px"
            }}
          >
            <div>
              <strong
                style={{
                  display:
                    "block",

                  fontSize:
                    "14px"
                }}
              >
                {documentoPreview.nombre_original ||
                  documentoPreview.nombre_archivo}
              </strong>

              <div
                className="muted"
                style={{
                  fontSize:
                    "12px",

                  marginTop:
                    "3px"
                }}
              >
                PDF ·{" "}
                {formatoTamano(
                  documentoPreview.tamano_bytes
                )}
                {" · "}
                {nombreModulo(
                  documentoPreview.modulo_id
                )}
              </div>
            </div>


            <div
              style={{
                display:
                  "flex",

                gap:
                  "8px",

                flexWrap:
                  "wrap"
              }}
            >
              <button
                type="button"
                className="btn btn-light btn-sm"
                disabled={
                  !urlPreview ||
                  cargandoPreview
                }
                onClick={
                  abrirPreviewEnPestana
                }
              >
                Abrir en otra pestaña
              </button>


              <button
                type="button"
                className="btn btn-light btn-sm"
                disabled={
                  descargandoId ===
                  documentoPreview.id
                }
                onClick={
                  descargarDesdePreview
                }
              >
                {descargandoId ===
                documentoPreview.id
                  ? "Descargando..."
                  : "Descargar"}
              </button>
            </div>
          </div>


          {/* ================================================
              CARGANDO
              ================================================ */}

          {cargandoPreview && (
            <div
              className="loading"
              style={{
                minHeight:
                  "420px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center"
              }}
            >
              Cargando vista previa del PDF...
            </div>
          )}


          {/* ================================================
              ERROR
              ================================================ */}

          {!cargandoPreview &&
            errorPreview && (
              <div
                style={{
                  minHeight:
                    "360px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center"
                }}
              >
                <div
                  className="alert alert-error"
                  style={{
                    width:
                      "100%"
                  }}
                >
                  <strong
                    style={{
                      display:
                        "block",

                      marginBottom:
                        "5px"
                    }}
                  >
                    No se pudo mostrar el PDF
                  </strong>

                  {errorPreview}
                </div>
              </div>
            )}


          {/* ================================================
              PDF
              ================================================ */}

          {!cargandoPreview &&
            !errorPreview &&
            urlPreview && (
              <div
                style={{
                  border:
                    "1px solid #e5ddd7",

                  borderRadius:
                    "12px",

                  overflow:
                    "hidden",

                  background:
                    "#f4f1ef",

                  width:
                    "100%"
                }}
              >
                <iframe
                  src={
                    `${urlPreview}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`
                  }
                  title={
                    documentoPreview.nombre_original ||
                    "Vista previa PDF"
                  }
                  style={{
                    display:
                      "block",

                    width:
                      "100%",

                    height:
                      "72vh",

                    minHeight:
                      "500px",

                    border:
                      "0",

                    background:
                      "#fff"
                  }}
                />
              </div>
            )}


          {/* ================================================
              MENSAJE DE SEGURIDAD
              ================================================ */}

          {!cargandoPreview &&
            urlPreview && (
              <p
                className="muted"
                style={{
                  margin:
                    "10px 0 0",

                  fontSize:
                    "12px",

                  textAlign:
                    "center"
                }}
              >
                La vista previa utiliza un acceso temporal protegido al documento.
              </p>
            )}
        </Modal>
      )}
    </>
  )
}


export default DocumentosCurso