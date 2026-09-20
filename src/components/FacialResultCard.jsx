const porcentaje = (valor) => {
  const numero = Number(valor)

  if (!Number.isFinite(numero)) {
    return "—"
  }

  const normalizado =
    numero <= 1
      ? numero * 100
      : numero

  return `${normalizado.toFixed(1)} %`
}

const FacialResultCard = ({ resultado }) => {
  if (!resultado) {
    return (
      <div
        className="card"
        style={{
          margin: 0,
          minHeight: "230px"
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: "18px"
          }}
        >
          Resultado
        </h2>

        <div
          className="empty"
          style={{
            padding: "34px 12px"
          }}
        >
          Analiza una imagen para ver aquí la expresión facial visible y la información del usuario autenticado.
        </div>
      </div>
    )
  }

  const usuario =
    resultado.usuario || {}

  return (
    <div
      className="card"
      style={{
        margin: 0
      }}
    >
      <h2
        style={{
          marginTop: 0,
          fontSize: "18px"
        }}
      >
        Resultado del análisis
      </h2>

      <div
        style={{
          padding: "14px",
          borderRadius: "12px",
          background: "#fff7f2",
          border: "1px solid #efd8ca",
          marginBottom: "16px"
        }}
      >
        <div
          className="muted"
          style={{
            fontSize: "12px",
            marginBottom: "4px"
          }}
        >
          Expresión facial visible
        </div>

        <strong
          style={{
            display: "block",
            fontSize: "22px",
            color: "#8e3514",
            marginBottom: "5px"
          }}
        >
          {resultado.expresion || "Sin resultado"}
        </strong>

        <span
          className="muted"
          style={{
            fontSize: "13px"
          }}
        >
          Confianza: {porcentaje(resultado.confianza)}
        </span>
      </div>

      <div
        style={{
          borderTop: "1px solid #eee3dc",
          paddingTop: "14px"
        }}
      >
        <strong
          style={{
            display: "block",
            marginBottom: "10px"
          }}
        >
          Datos del usuario autenticado
        </strong>

        <div
          style={{
            display: "grid",
            gap: "8px",
            fontSize: "13px"
          }}
        >
          <div>
            <span className="muted">Nombre: </span>
            <strong>{usuario.nombre || "—"}</strong>
          </div>

          <div>
            <span className="muted">Correo: </span>
            <strong>{usuario.email || "—"}</strong>
          </div>

          <div>
            <span className="muted">Rol: </span>
            <strong>{usuario.rol || "—"}</strong>
          </div>

          <div>
            <span className="muted">Empresa: </span>
            <strong>{usuario.empresa || "—"}</strong>
          </div>
        </div>
      </div>

      <p
        className="muted"
        style={{
          margin: "14px 0 0",
          fontSize: "11px",
          lineHeight: 1.5
        }}
      >
        La etiqueta describe la apariencia visible del rostro en ese fotograma; no demuestra el estado emocional real de la persona.
      </p>
    </div>
  )
}

export default FacialResultCard
