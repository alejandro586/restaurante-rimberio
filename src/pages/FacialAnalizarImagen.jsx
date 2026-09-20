import {
  useEffect,
  useState
} from "react"

import {
  analizarRostro,
  getMessage,
  obtenerEstadoReconocimientoFacial
} from "../api"

import FacialResultCard
  from "../components/FacialResultCard"

import FacialWorkflowInfo
  from "../components/FacialWorkflowInfo"


const leerArchivoBase64 = (archivo) =>
  new Promise((resolve, reject) => {
    const reader =
      new FileReader()

    reader.onload = () =>
      resolve(reader.result)

    reader.onerror = () =>
      reject(
        new Error(
          "No se pudo leer la imagen."
        )
      )

    reader.readAsDataURL(archivo)
  })


const FacialAnalizarImagen = () => {
  const [
    archivo,
    setArchivo
  ] = useState(null)

  const [
    vistaPrevia,
    setVistaPrevia
  ] = useState("")

  const [
    resultado,
    setResultado
  ] = useState(null)

  const [
    procesando,
    setProcesando
  ] = useState(false)

  const [
    error,
    setError
  ] = useState("")

  const [
    configurado,
    setConfigurado
  ] = useState(false)


  useEffect(() => {
    let activo = true

    obtenerEstadoReconocimientoFacial()
      .then((respuesta) => {
        if (activo) {
          setConfigurado(
            Boolean(respuesta?.configurado)
          )
        }
      })
      .catch(() => {
        if (activo) {
          setConfigurado(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])


  const seleccionarArchivo = async (
    evento
  ) => {
    const seleccionado =
      evento.target.files?.[0] || null

    setArchivo(null)
    setVistaPrevia("")
    setResultado(null)
    setError("")

    if (!seleccionado) {
      return
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp"
      ].includes(
        seleccionado.type
      )
    ) {
      setError(
        "Usa una imagen JPG, PNG o WEBP."
      )
      return
    }

    if (
      seleccionado.size >
      5 * 1024 * 1024
    ) {
      setError(
        "La imagen no debe superar 5 MB."
      )
      return
    }

    try {
      const base64 =
        await leerArchivoBase64(
          seleccionado
        )

      setArchivo(seleccionado)
      setVistaPrevia(base64)

    } catch (problema) {
      setError(
        getMessage(problema)
      )
    }
  }


  const analizar = async () => {
    if (!archivo || !vistaPrevia) {
      setError(
        "Selecciona una imagen primero."
      )
      return
    }

    if (!configurado) {
      setError(
        "El Workflow visual todavía no está conectado en el backend."
      )
      return
    }

    setProcesando(true)
    setError("")

    try {
      const respuesta =
        await analizarRostro({
          imagenBase64: vistaPrevia,
          fuente: "archivo"
        })

      setResultado(respuesta)

    } catch (problema) {
      setError(
        getMessage(problema)
      )

    } finally {
      setProcesando(false)
    }
  }


  return (
    <>
      <div className="topbar">
        <div>
          <h1>
            Analizar imagen
          </h1>

          <p>
            Sube una fotografía y envíala al mismo Workflow visual de siete nodos.
          </p>
        </div>
      </div>

      {error ? (
        <div
          className="alert alert-error"
          style={{
            marginBottom: "16px"
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.65fr)",
          gap: "16px",
          alignItems: "start"
        }}
      >
        <div
          className="card"
          style={{
            margin: 0
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "8px"
            }}
          >
            Imagen del rostro
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={seleccionarArchivo}
          />

          <div
            style={{
              marginTop: "14px",
              minHeight: "300px",
              borderRadius: "14px",
              border: "1px dashed #d7c6bb",
              background: "#fffdfb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {vistaPrevia ? (
              <img
                src={vistaPrevia}
                alt="Vista previa"
                style={{
                  width: "100%",
                  maxHeight: "520px",
                  objectFit: "contain"
                }}
              />
            ) : (
              <span className="muted">
                La vista previa aparecerá aquí.
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn"
            disabled={
              procesando ||
              !archivo
            }
            onClick={analizar}
            style={{
              marginTop: "14px"
            }}
          >
            {procesando
              ? "Analizando..."
              : "Analizar imagen"}
          </button>
        </div>

        <FacialResultCard
          resultado={resultado}
        />
      </div>

      <FacialWorkflowInfo
        configurado={configurado}
      />
    </>
  )
}

export default FacialAnalizarImagen
