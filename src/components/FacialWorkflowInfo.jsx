const NODOS = [
  {
    numero: 1,
    titulo: "Entrada de imagen",
    detalle: "La foto o el fotograma de la cámara entra al Workflow."
  },
  {
    numero: 2,
    titulo: "Detección de rostro",
    detalle: "Un modelo visual localiza el rostro en la imagen."
  },
  {
    numero: 3,
    titulo: "Filtro de confianza",
    detalle: "Se descartan detecciones inseguras antes de continuar."
  },
  {
    numero: 4,
    titulo: "Recorte facial",
    detalle: "El Workflow trabaja solo con la región donde está la cara."
  },
  {
    numero: 5,
    titulo: "Clasificación de expresión",
    detalle: "Un modelo clasifica la expresión visible del rostro."
  },
  {
    numero: 6,
    titulo: "Etiqueta y confianza",
    detalle: "Se obtiene la clase principal y su porcentaje de confianza."
  },
  {
    numero: 7,
    titulo: "Salida del Workflow",
    detalle: "RIMBERIO recibe el resultado para mostrarlo y registrarlo."
  }
]

const FacialWorkflowInfo = ({ configurado = false }) => (
  <div
    className="card"
    style={{
      marginTop: "18px"
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "14px",
        flexWrap: "wrap",
        marginBottom: "16px"
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "18px"
          }}
        >
          Flujo visual sin código · 7 nodos
        </h2>

        <p
          className="muted"
          style={{
            margin: "6px 0 0"
          }}
        >
          La inteligencia artificial se configura en un Workflow visual. RIMBERIO solo consume su salida.
        </p>
      </div>

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "999px",
          padding: "6px 10px",
          fontSize: "12px",
          fontWeight: 700,
          background: configurado ? "#e9f8ef" : "#fff4df",
          color: configurado ? "#22683c" : "#8b5a00"
        }}
      >
        {configurado
          ? "Workflow conectado"
          : "Workflow pendiente de configurar"}
      </span>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "10px"
      }}
    >
      {NODOS.map((nodo) => (
        <div
          key={nodo.numero}
          style={{
            border: "1px solid #eadfd8",
            borderRadius: "12px",
            padding: "13px",
            background: "#fffdfb"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "7px"
            }}
          >
            <span
              style={{
                width: "27px",
                height: "27px",
                borderRadius: "50%",
                background: "#a9461c",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "12px"
              }}
            >
              {nodo.numero}
            </span>

            <strong
              style={{
                fontSize: "13px"
              }}
            >
              {nodo.titulo}
            </strong>
          </div>

          <div
            className="muted"
            style={{
              fontSize: "12px",
              lineHeight: 1.5
            }}
          >
            {nodo.detalle}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default FacialWorkflowInfo
