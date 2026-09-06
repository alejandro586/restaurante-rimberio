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
  obtenerCurso,
  obtenerModulosCurso,
  getMessage,
  getPerfil,
  getInitials,
  getUserName,
  esAdmin
} from "../api"


/* ==========================================================
   CONFIGURACION
   ========================================================== */

const MAX_BYTES =
  25 * 1024 * 1024


const EXTENSIONES =
  [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx"
  ]


/* ==========================================================
   NORMALIZAR CURSO
   ========================================================== */

const normalizarCurso =
  (
    respuesta
  ) => {

    if (
      respuesta?.curso
    ) {

      return respuesta.curso
    }


    if (
      respuesta?.data?.curso
    ) {

      return respuesta.data.curso
    }


    if (
      respuesta?.data &&
      !Array.isArray(
        respuesta.data
      )
    ) {

      return respuesta.data
    }


    return respuesta || null
  }


/* ==========================================================
   NORMALIZAR MODULOS
   ========================================================== */

const normalizarModulos =
  (
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

const normalizarDocumentos =
  (
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
   FORMATEAR FECHA
   ========================================================== */

const formatoFecha =
  (
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
   FORMATEAR TAMAÑO
   ========================================================== */

const formatoTamano =
  (
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
      numero <=
        0
    ) {

      return "0 KB"
    }


    if (
      numero <
      1024
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
   NOMBRE DEL TIPO
   ========================================================== */

const nombreTipo =
  (
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
      valor ===
      "pdf"
    ) {

      return "PDF"
    }


    if (
      valor ===
        "doc" ||
      valor ===
        "docx"
    ) {

      return "Word"
    }


    if (
      valor ===
        "xls" ||
      valor ===
        "xlsx"
    ) {

      return "Excel"
    }


    if (
      valor ===
        "ppt" ||
      valor ===
        "pptx"
    ) {

      return "PowerPoint"
    }


    return valor
      ? valor.toUpperCase()
      : "Archivo"
  }


/* ==========================================================
   COLOR / ETIQUETA DEL TIPO
   ========================================================== */

const estiloTipo =
  (
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
      valor ===
      "pdf"
    ) {

      return {
        background:
          "#fef2f2",

        color:
          "#b91c1c",

        border:
          "1px solid #fecaca"
      }
    }


    if (
      valor ===
        "doc" ||
      valor ===
        "docx"
    ) {

      return {
        background:
          "#eff6ff",

        color:
          "#1d4ed8",

        border:
          "1px solid #bfdbfe"
      }
    }


    if (
      valor ===
        "xls" ||
      valor ===
        "xlsx"
    ) {

      return {
        background:
          "#f0fdf4",

        color:
          "#15803d",

        border:
          "1px solid #bbf7d0"
      }
    }


    if (
      valor ===
        "ppt" ||
      valor ===
        "pptx"
    ) {

      return {
        background:
          "#fff7ed",

        color:
          "#c2410c",

        border:
          "1px solid #fed7aa"
      }
    }


    return {
      background:
        "#f8fafc",

      color:
        "#475569",

      border:
        "1px solid #e2e8f0"
    }
  }


/* ==========================================================
   DOCUMENTOS DEL CURSO
   ========================================================== */

const DocumentosCurso =
  ({
    cursoId =
      1
  }) => {

    /* ========================================================
       DATOS GENERALES
       ======================================================== */

    const [
      curso,
      setCurso
    ] =
      useState(
        null
      )


    const [
      modulos,
      setModulos
    ] =
      useState(
        []
      )


    const [
      documentos,
      setDocumentos
    ] =
      useState(
        []
      )


    /* ========================================================
       FORMULARIO
       ======================================================== */

    const [
      archivo,
      setArchivo
    ] =
      useState(
        null
      )


    const [
      moduloId,
      setModuloId
    ] =
      useState(
        ""
      )


    const [
      descripcion,
      setDescripcion
    ] =
      useState(
        ""
      )


    /* ========================================================
       FILTRO
       ======================================================== */

    const [
      filtroModulo,
      setFiltroModulo
    ] =
      useState(
        ""
      )


    /* ========================================================
       ESTADOS
       ======================================================== */

    const [
      cargando,
      setCargando
    ] =
      useState(
        true
      )


    const [
      subiendo,
      setSubiendo
    ] =
      useState(
        false
      )


    const [
      abriendoId,
      setAbriendoId
    ] =
      useState(
        null
      )


    const [
      descargandoId,
      setDescargandoId
    ] =
      useState(
        null
      )


    const [
      eliminandoId,
      setEliminandoId
    ] =
      useState(
        null
      )


    const [
      error,
      setError
    ] =
      useState(
        ""
      )


    const [
      aviso,
      setAviso
    ] =
      useState(
        ""
      )


    const inputArchivoRef =
      useRef(
        null
      )


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
       OBTENER NOMBRE DEL MODULO
       ======================================================== */

    const nombreModulo =
      useCallback(
        (
          id
        ) => {

          if (
            id ===
              null ||
            id ===
              undefined
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
       CARGAR TODO
       ======================================================== */

    const cargarDatos =
      useCallback(
        async (
          mostrarCarga =
            true
        ) => {

          if (
            mostrarCarga
          ) {

            setCargando(
              true
            )
          }


          setError(
            ""
          )


          try {

            const [
              respuestaCurso,
              respuestaModulos,
              respuestaDocumentos
            ] =
              await Promise.all([
                obtenerCurso(
                  cursoId
                ),

                obtenerModulosCurso(
                  cursoId
                ),

                listarDocumentosCurso(
                  cursoId
                )
              ])


            setCurso(
              normalizarCurso(
                respuestaCurso
              )
            )


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

              setCargando(
                false
              )
            }
          }
        },
        [
          cursoId
        ]
      )


    /* ========================================================
       PRIMERA CARGA
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
       MENSAJE TEMPORAL
       ======================================================== */

    const mostrarAviso =
      (
        mensaje
      ) => {

        setAviso(
          mensaje
        )


        window.setTimeout(
          () => {

            setAviso(
              ""
            )

          },
          4000
        )
      }


    /* ========================================================
       SELECCIONAR ARCHIVO
       ======================================================== */

    const cambiarArchivo =
      (
        event
      ) => {

        const seleccionado =
          event.target.files?.[0] ||
          null


        setError(
          ""
        )


        if (
          !seleccionado
        ) {

          setArchivo(
            null
          )

          return
        }


        if (
          seleccionado.size >
          MAX_BYTES
        ) {

          setArchivo(
            null
          )


          event.target.value =
            ""


          setError(
            "El archivo supera el límite máximo de 25 MB."
          )

          return
        }


        const nombre =
          String(
            seleccionado.name ||
            ""
          )
            .toLowerCase()


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

          setArchivo(
            null
          )


          event.target.value =
            ""


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

        setArchivo(
          null
        )


        setModuloId(
          ""
        )


        setDescripcion(
          ""
        )


        if (
          inputArchivoRef.current
        ) {

          inputArchivoRef.current.value =
            ""
        }
      }


    /* ========================================================
       SUBIR
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


        setError(
          ""
        )


        if (
          !archivo
        ) {

          setError(
            "Selecciona un archivo antes de continuar."
          )

          return
        }


        setSubiendo(
          true
        )


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

          setSubiendo(
            false
          )
        }
      }


    /* ========================================================
       ABRIR
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
         * Abrimos primero una pestaña vacía.
         *
         * Esto evita que algunos navegadores
         * bloqueen window.open después del await.
         */
        const ventana =
          window.open(
            "",
            "_blank"
          )


        setAbriendoId(
          documento.id
        )


        setError(
          ""
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
              "No se pudo obtener el acceso al documento"
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
       DESCARGAR
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


        setError(
          ""
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
              "No se pudo obtener el acceso al documento"
            )
          }


          /*
           * Intentamos descargar como Blob.
           *
           * Si el navegador no permite leer
           * directamente la URL firmada,
           * usamos la URL como respaldo.
           */
        try {

          const respuesta =
            await fetch(
              resultado.url
            )


          if (
            !respuesta.ok
          ) {

            throw new Error(
              "No se pudo descargar el archivo"
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

          const enlace =
            document.createElement(
              "a"
            )


          enlace.href =
            resultado.url


          enlace.target =
            "_blank"


          enlace.rel =
            "noopener noreferrer"


          enlace.download =
            documento.nombre_original ||
            ""


          document.body.appendChild(
            enlace
          )


          enlace.click()


          enlace.remove()
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
       PUEDE ELIMINAR
       ======================================================== */

    const puedeEliminar =
      (
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
       ELIMINAR
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
            `¿Eliminar "${documento.nombre_original}"?\n\nEsta acción quitará el documento del curso.`
          )


        if (
          !confirmado
        ) {

          return
        }


        setEliminandoId(
          documento.id
        )


        setError(
          ""
        )


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

        {/* ====================================================
            CABECERA
            ==================================================== */}

        <div className="topbar">

          <div>

            <h1>
              Documentación
            </h1>


            <p>
              Gestiona los documentos del curso{" "}
              <strong>
                {curso?.nombre ||
                  "Big Data"}
              </strong>.
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
            CARGA
            ==================================================== */}

        {cargando ? (

          <div className="card">

            <div className="loading">
              Cargando documentos...
            </div>

          </div>

        ) : (

          <>

            {/* =================================================
                RESUMEN
                ================================================= */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",

                gap:
                  "14px",

                marginBottom:
                  "20px"
              }}
            >

              <div className="card">

                <div
                  className="muted"
                  style={{
                    fontSize:
                      "13px"
                  }}
                >
                  Documentos disponibles
                </div>


                <div
                  style={{
                    fontSize:
                      "28px",

                    fontWeight:
                      800,

                    marginTop:
                      "6px"
                  }}
                >
                  {documentos.length}
                </div>

              </div>


              <div className="card">

                <div
                  className="muted"
                  style={{
                    fontSize:
                      "13px"
                  }}
                >
                  Módulos disponibles
                </div>


                <div
                  style={{
                    fontSize:
                      "28px",

                    fontWeight:
                      800,

                    marginTop:
                      "6px"
                  }}
                >
                  {modulos.length}
                </div>

              </div>


              <div className="card">

                <div
                  className="muted"
                  style={{
                    fontSize:
                      "13px"
                  }}
                >
                  Límite por archivo
                </div>


                <div
                  style={{
                    fontSize:
                      "28px",

                    fontWeight:
                      800,

                    marginTop:
                      "6px"
                  }}
                >
                  25 MB
                </div>

              </div>

            </div>


            {/* =================================================
                FORMULARIO DE SUBIDA
                ================================================= */}

            <div
              className="card"
              style={{
                marginBottom:
                  "20px"
              }}
            >

              <div
                style={{
                  marginBottom:
                    "18px"
                }}
              >

                <div className="chart-title">
                  Subir documento
                </div>


                <div
                  className="muted"
                  style={{
                    marginTop:
                      "4px"
                  }}
                >
                  Puedes subir PDF, Word, Excel o PowerPoint.
                  El módulo es opcional.
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
                      "16px"
                  }}
                >

                  {/* ===========================================
                      ARCHIVO
                      =========================================== */}

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
                        : "Máximo 25 MB"}

                    </span>

                  </div>


                  {/* ===========================================
                      MODULO
                      =========================================== */}

                  <div className="field">

                    <label>
                      Relacionar con módulo
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
                        Documento general del curso
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


                    <span className="muted">
                      Si no eliges módulo será visible como documentación general.
                    </span>

                  </div>

                </div>


                {/* =============================================
                    DESCRIPCION
                    ============================================= */}

                <div
                  className="field"
                  style={{
                    marginTop:
                      "16px"
                  }}
                >

                  <label>
                    Descripción
                  </label>


                  <textarea
                    value={
                      descripcion
                    }
                    rows={
                      3
                    }
                    maxLength={
                      500
                    }
                    disabled={
                      subiendo
                    }
                    placeholder="Ejemplo: Material correspondiente a la semana 1..."
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
                    {descripcion.length}/500 caracteres
                  </span>

                </div>


                {/* =============================================
                    ACCIONES
                    ============================================= */}

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
                      "18px"
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
                DOCUMENTOS
                ================================================= */}

            <div className="card">

              {/* ===============================================
                  CABECERA LISTA
                  =============================================== */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "flex-end",

                  gap:
                    "16px",

                  flexWrap:
                    "wrap",

                  marginBottom:
                    "18px"
                }}
              >

                <div>

                  <div className="chart-title">
                    Documentos del curso
                  </div>


                  <div
                    className="muted"
                    style={{
                      marginTop:
                        "4px"
                    }}
                  >
                    {documentosVisibles.length} documento
                    {documentosVisibles.length ===
                    1
                      ? ""
                      : "s"} visible
                    {documentosVisibles.length ===
                    1
                      ? ""
                      : "s"}.
                  </div>

                </div>


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
                    Filtrar
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
                      Documentos generales
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


              {/* ===============================================
                  LISTA VACIA
                  =============================================== */}

              {documentosVisibles.length ===
              0 ? (

                <div className="empty">

                  <strong
                    style={{
                      display:
                        "block",

                      marginBottom:
                        "6px"
                    }}
                  >
                    No hay documentos
                  </strong>


                  <span>
                    Todavía no se han subido documentos en esta sección.
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

                      const eliminando =
                        String(
                          eliminandoId
                        ) ===
                        String(
                          documento.id
                        )


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


                      return (

                        <div
                          key={
                            documento.id
                          }
                          style={{
                            border:
                              "1px solid #e5e7eb",

                            borderRadius:
                              "12px",

                            padding:
                              "14px 16px",

                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            gap:
                              "16px",

                            flexWrap:
                              "wrap"
                          }}
                        >

                          {/* ===================================
                              INFORMACION
                              =================================== */}

                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "flex-start",

                              gap:
                                "12px",

                              minWidth:
                                0,

                              flex:
                                "1 1 340px"
                            }}
                          >

                            <div
                              style={{
                                ...estiloTipo(
                                  documento.extension
                                ),

                                borderRadius:
                                  "8px",

                                padding:
                                  "6px 8px",

                                fontSize:
                                  "11px",

                                fontWeight:
                                  800,

                                flexShrink:
                                  0
                              }}
                            >
                              {nombreTipo(
                                documento.extension
                              )}
                            </div>


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

                                  overflowWrap:
                                    "anywhere"
                                }}
                              >
                                {documento.nombre_original ||
                                  documento.nombre_archivo ||
                                  `Documento ${documento.id}`}
                              </div>


                              <div
                                className="muted"
                                style={{
                                  display:
                                    "flex",

                                  gap:
                                    "6px",

                                  flexWrap:
                                    "wrap",

                                  marginTop:
                                    "4px",

                                  fontSize:
                                    "12px"
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
                                      "7px",

                                    fontSize:
                                      "13px",

                                    lineHeight:
                                      1.5
                                  }}
                                >
                                  {documento.descripcion}
                                </div>

                              )}

                            </div>

                          </div>


                          {/* ===================================
                              ACCIONES
                              =================================== */}

                          <div
                            style={{
                              display:
                                "flex",

                              gap:
                                "8px",

                              alignItems:
                                "center",

                              flexWrap:
                                "wrap"
                            }}
                          >

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
                                : "Abrir"}

                            </button>


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
                                  border:
                                    "1px solid #fecaca",

                                  color:
                                    "#b91c1c",

                                  background:
                                    "#ffffff"
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

      </>
    )
  }


export default DocumentosCurso