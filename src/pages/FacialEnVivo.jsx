import {
  useEffect,
  useRef,
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


const FacialEnVivo = () => {
  const videoRef =
    useRef(null)

  const streamRef =
    useRef(null)

  const [
    camaraActiva,
    setCamaraActiva
  ] = useState(false)

  const [
    procesando,
    setProcesando
  ] = useState(false)

  const [
    error,
    setError
  ] = useState("")

  const [
    resultado,
    setResultado
  ] = useState(null)

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

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop())
      }
    }
  }, [])


  const iniciarCamara = async () => {
    setError("")

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 960 },
            height: { ideal: 720 }
          },
          audio: false
        })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCamaraActiva(true)

    } catch (problema) {
      console.error(problema)
      setError(
        "No se pudo abrir la cámara. Revisa el permiso del navegador."
      )
    }
  }


  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop())
    }

    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCamaraActiva(false)
  }


  const capturar = async () => {
    if (
      !videoRef.current ||
      !camaraActiva
    ) {
      setError(
        "Primero inicia la cámara."
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
      const video =
        videoRef.current

      const ancho =
        video.videoWidth || 640

      const alto =
        video.videoHeight || 480

      const canvas =
        document.createElement("canvas")

      canvas.width = ancho
      canvas.height = alto

      const contexto =
        canvas.getContext("2d")

      contexto.drawImage(
        video,
        0,
        0,
        ancho,
        alto
      )

      const imagenBase64 =
        canvas.toDataURL(
          "image/jpeg",
          0.82
        )

      const respuesta =
        await analizarRostro({
          imagenBase64,
          fuente: "camara"
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
            Reconocimiento en vivo
          </h1>

          <p>
            Captura un fotograma de la cámara y envíalo al Workflow visual de reconocimiento facial.
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
          <div
            style={{
              borderRadius: "14px",
              overflow: "hidden",
              background: "#171717",
              aspectRatio: "4 / 3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: camaraActiva ? "block" : "none"
              }}
            />

            {!camaraActiva ? (
              <div
                style={{
                  color: "#eee",
                  textAlign: "center",
                  padding: "30px"
                }}
              >
                <div
                  style={{
                    fontSize: "38px",
                    marginBottom: "10px"
                  }}
                >
                  ◉
                </div>

                Cámara detenida
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px"
            }}
          >
            {!camaraActiva ? (
              <button
                type="button"
                className="btn"
                onClick={iniciarCamara}
              >
                Iniciar cámara
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn"
                  disabled={procesando}
                  onClick={capturar}
                >
                  {procesando
                    ? "Analizando..."
                    : "Analizar fotograma"}
                </button>

                <button
                  type="button"
                  className="btn btn-light"
                  disabled={procesando}
                  onClick={detenerCamara}
                >
                  Detener cámara
                </button>
              </>
            )}
          </div>

          <p
            className="muted"
            style={{
              margin: "12px 0 0",
              fontSize: "12px",
              lineHeight: 1.5
            }}
          >
            El análisis se ejecuta solo cuando presionas “Analizar fotograma”, para evitar consumo innecesario de créditos del servicio de visión.
          </p>
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

export default FacialEnVivo
