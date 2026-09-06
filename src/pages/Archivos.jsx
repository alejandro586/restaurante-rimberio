import {
  useEffect,
  useMemo,
  useState
} from "react"

import api, {
  esAdmin,
  getInitials,
  getMessage,
  getUserName,
  miles,
  obtenerMisPermisos
} from "../api"

import Modal from "../components/Modal"


/* ==========================================================
   CONFIGURACION
   ========================================================== */

const FILAS_TABLA = 100

const FILAS_GRAFICO_MAX = 5000

const PERMISO_GRAFICOS =
  "big_data.graficos"


const COLORES_SERIES = [
  "#c85c2d",
  "#256f68",
  "#7c3aed",
  "#2563eb",
  "#a16207",
  "#4d7c0f",
  "#be123c",
  "#0f766e",
  "#9333ea",
  "#0369a1"
]


/* ==========================================================
   UTILIDADES
   ========================================================== */

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )


/* ==========================================================
   CONVERTIR A NUMERO
   ========================================================== */

const aNumero = (valor) => {

  if (
    typeof valor ===
    "number"
  ) {
    return Number.isFinite(valor)
      ? valor
      : null
  }


  if (
    valor === null ||
    valor === undefined
  ) {
    return null
  }


  let texto =
    String(valor)
      .trim()


  if (!texto) {
    return null
  }


  texto =
    texto
      .replace(/\s/g, "")
      .replace(/S\/\.?/gi, "")
      .replace(/\$/g, "")
      .replace(/€/g, "")
      .replace(/%/g, "")


  /*
   * Ejemplos compatibles:
   *
   * 1,200.50
   * 1.200,50
   * 28,50
   * S/. 2,500.00
   */
  if (
    texto.includes(",") &&
    texto.includes(".")
  ) {

    const ultimaComa =
      texto.lastIndexOf(",")

    const ultimoPunto =
      texto.lastIndexOf(".")


    if (
      ultimaComa >
      ultimoPunto
    ) {

      texto =
        texto
          .replace(/\./g, "")
          .replace(",", ".")

    } else {

      texto =
        texto.replace(/,/g, "")
    }

  } else if (
    texto.includes(",")
  ) {

    const partes =
      texto.split(",")

    const ultima =
      partes[
        partes.length - 1
      ]


    if (
      partes.length === 2 &&
      ultima.length <= 2
    ) {

      texto =
        texto.replace(",", ".")

    } else {

      texto =
        texto.replace(/,/g, "")
    }
  }


  texto =
    texto.replace(
      /[^0-9.-]/g,
      ""
    )


  if (
    !texto ||
    texto === "-" ||
    texto === "."
  ) {
    return null
  }


  const numero =
    Number(texto)


  return Number.isFinite(numero)
    ? numero
    : null
}


/* ==========================================================
   FORMATO NUMERICO
   ========================================================== */

const formatoNumero = (numero) => {

  const valor =
    Number(numero)


  if (
    !Number.isFinite(valor)
  ) {
    return "0"
  }


  return valor.toLocaleString(
    "es-PE",
    {
      maximumFractionDigits: 2
    }
  )
}


/* ==========================================================
   FORMATO CORTO PARA EJES
   ========================================================== */

const formatoCorto = (numero) => {

  const valor =
    Number(numero)


  if (
    !Number.isFinite(valor)
  ) {
    return "0"
  }


  const absoluto =
    Math.abs(valor)


  if (
    absoluto >= 1000000
  ) {
    return `${(
      valor /
      1000000
    ).toFixed(1)}M`
  }


  if (
    absoluto >= 1000
  ) {
    return `${(
      valor /
      1000
    ).toFixed(0)}k`
  }


  return valor.toLocaleString(
    "es-PE",
    {
      maximumFractionDigits: 1
    }
  )
}


/* ==========================================================
   ACORTAR TEXTO
   ========================================================== */

const cortarTexto = (
  valor,
  limite = 14
) => {

  const texto =
    String(valor ?? "")


  if (
    texto.length <= limite
  ) {
    return texto
  }


  return `${texto.slice(
    0,
    limite
  )}…`
}


/* ==========================================================
   DETECTAR COLUMNAS
   ========================================================== */

const detectarColumnas = (
  filas,
  columnas
) => {

  const muestra =
    filas.slice(
      0,
      200
    )


  const numericas = []
  const dimensiones = []


  for (
    const columna
    of columnas
  ) {

    const valores =
      muestra
        .map(
          (fila) =>
            fila[columna]
        )
        .filter(
          (valor) =>
            valor !== null &&
            valor !== undefined &&
            String(valor).trim() !== ""
        )


    if (
      valores.length === 0
    ) {

      dimensiones.push(
        columna
      )

      continue
    }


    const convertibles =
      valores.filter(
        (valor) =>
          aNumero(valor) !== null
      )


    const porcentaje =
      convertibles.length /
      valores.length


    if (
      porcentaje >= 0.7
    ) {

      numericas.push(
        columna
      )

    } else {

      dimensiones.push(
        columna
      )
    }
  }


  return {
    numericas,
    dimensiones
  }
}


/* ==========================================================
   ELEGIR METRICA INICIAL
   ========================================================== */

const elegirMetrica = (
  columnas
) => {

  if (
    columnas.length === 0
  ) {
    return ""
  }


  const prioridades = [
    "ingreso_total",
    "ingreso",
    "venta_total",
    "ventas",
    "ganancia",
    "utilidad",
    "unidades_vendidas",
    "cantidad",
    "precio_total",
    "precio_unitario",
    "precio",
    "costo_total",
    "costo"
  ]


  for (
    const prioridad
    of prioridades
  ) {

    const encontrada =
      columnas.find(
        (columna) => {

          const texto =
            normalizarTexto(
              columna
            ).replace(
              /\s+/g,
              "_"
            )


          return (
            texto === prioridad ||
            texto.includes(
              prioridad
            )
          )
        }
      )


    if (
      encontrada
    ) {
      return encontrada
    }
  }


  return columnas[0]
}


/* ==========================================================
   ELEGIR DIMENSION
   ========================================================== */

const elegirDimension = (
  columnas
) => {

  if (
    columnas.length === 0
  ) {
    return "__fila__"
  }


  const prioridades = [
    "mes",
    "fecha",
    "periodo",
    "ano",
    "año",
    "categoria",
    "plato",
    "producto",
    "restaurante",
    "cliente"
  ]


  for (
    const prioridad
    of prioridades
  ) {

    const encontrada =
      columnas.find(
        (columna) =>
          normalizarTexto(
            columna
          ).includes(
            normalizarTexto(
              prioridad
            )
          )
      )


    if (
      encontrada
    ) {
      return encontrada
    }
  }


  return columnas[0]
}


/* ==========================================================
   DIMENSION TEMPORAL
   ========================================================== */

const esTemporal = (columna) => {

  const texto =
    normalizarTexto(
      columna
    )


  return (
    texto.includes("fecha") ||
    texto.includes("mes") ||
    texto.includes("periodo") ||
    texto.includes("ano")
  )
}


/* ==========================================================
   SERIE PARA UNA METRICA
   ========================================================== */

const construirSerie = (
  filas,
  dimension,
  metrica
) => {

  if (!metrica) {
    return []
  }


  /*
   * Si no existe dimensión categórica,
   * usamos las filas.
   */
  if (
    dimension === "__fila__"
  ) {

    return filas
      .slice(0, 20)
      .map(
        (
          fila,
          indice
        ) => ({
          etiqueta:
            `Fila ${indice + 1}`,

          valor:
            aNumero(
              fila[metrica]
            ) ?? 0
        })
      )
  }


  const grupos =
    new Map()


  for (
    const fila
    of filas
  ) {

    const valor =
      aNumero(
        fila[metrica]
      )


    if (
      valor === null
    ) {
      continue
    }


    let etiqueta =
      String(
        fila[dimension] ??
        ""
      ).trim()


    if (!etiqueta) {
      etiqueta =
        "Sin dato"
    }


    grupos.set(
      etiqueta,
      (
        grupos.get(
          etiqueta
        ) ||
        0
      ) +
      valor
    )
  }


  let serie =
    Array.from(
      grupos.entries()
    ).map(
      ([
        etiqueta,
        valor
      ]) => ({
        etiqueta,
        valor
      })
    )


  if (
    esTemporal(
      dimension
    )
  ) {

    serie =
      serie.sort(
        (a, b) =>
          String(
            a.etiqueta
          ).localeCompare(
            String(
              b.etiqueta
            ),
            "es",
            {
              numeric: true
            }
          )
      )

  } else {

    serie =
      serie.sort(
        (a, b) =>
          b.valor -
          a.valor
      )
  }


  return serie.slice(
    0,
    15
  )
}


/* ==========================================================
   TODAS LAS METRICAS
   ========================================================== */

const construirTodasMetricas = (
  filas,
  dimension,
  metricas,
  metricaOrden
) => {

  if (
    metricas.length === 0
  ) {
    return {
      etiquetas: [],
      series: []
    }
  }


  let registros = []


  /* ========================================================
     POR FILA
     ======================================================== */

  if (
    dimension === "__fila__"
  ) {

    registros =
      filas
        .slice(0, 15)
        .map(
          (
            fila,
            indice
          ) => {

            const valores = {}


            for (
              const metrica
              of metricas
            ) {

              valores[metrica] =
                aNumero(
                  fila[metrica]
                ) ?? 0
            }


            return {
              etiqueta:
                `Fila ${indice + 1}`,
              valores
            }
          }
        )

  } else {

    /* ======================================================
       AGRUPADO
       ====================================================== */

    const grupos =
      new Map()


    for (
      const fila
      of filas
    ) {

      let etiqueta =
        String(
          fila[dimension] ??
          ""
        ).trim()


      if (!etiqueta) {
        etiqueta =
          "Sin dato"
      }


      if (
        !grupos.has(
          etiqueta
        )
      ) {

        const valores = {}


        for (
          const metrica
          of metricas
        ) {
          valores[metrica] =
            0
        }


        grupos.set(
          etiqueta,
          valores
        )
      }


      const grupo =
        grupos.get(
          etiqueta
        )


      for (
        const metrica
        of metricas
      ) {

        const numero =
          aNumero(
            fila[metrica]
          )


        if (
          numero !== null
        ) {

          grupo[metrica] +=
            numero
        }
      }
    }


    registros =
      Array.from(
        grupos.entries()
      ).map(
        ([
          etiqueta,
          valores
        ]) => ({
          etiqueta,
          valores
        })
      )


    if (
      esTemporal(
        dimension
      )
    ) {

      registros.sort(
        (a, b) =>
          String(
            a.etiqueta
          ).localeCompare(
            String(
              b.etiqueta
            ),
            "es",
            {
              numeric: true
            }
          )
      )

    } else {

      registros.sort(
        (a, b) =>
          (
            b.valores[
              metricaOrden
            ] ||
            0
          ) -
          (
            a.valores[
              metricaOrden
            ] ||
            0
          )
      )
    }


    registros =
      registros.slice(
        0,
        15
      )
  }


  /* ========================================================
     NORMALIZAR CADA METRICA 0 - 100
     ======================================================== */

  const series =
    metricas.map(
      (
        metrica,
        indice
      ) => {

        const valores =
          registros.map(
            (registro) =>
              Number(
                registro
                  .valores[
                  metrica
                ] ||
                0
              )
          )


        const minimo =
          Math.min(
            ...valores
          )


        const maximo =
          Math.max(
            ...valores
          )


        const rango =
          maximo -
          minimo


        const puntos =
          registros.map(
            (
              registro
            ) => {

              const real =
                Number(
                  registro
                    .valores[
                    metrica
                  ] ||
                  0
                )


              let normalizado = 0


              if (
                rango === 0
              ) {

                normalizado =
                  maximo === 0
                    ? 0
                    : 100

              } else {

                normalizado =
                  (
                    (
                      real -
                      minimo
                    ) /
                    rango
                  ) *
                  100
              }


              return {
                etiqueta:
                  registro.etiqueta,

                valorReal:
                  real,

                valorNormalizado:
                  normalizado
              }
            }
          )


        return {
          nombre:
            metrica,

          color:
            COLORES_SERIES[
              indice %
              COLORES_SERIES.length
            ],

          puntos
        }
      }
    )


  return {
    etiquetas:
      registros.map(
        (registro) =>
          registro.etiqueta
      ),

    series
  }
}


/* ==========================================================
   GRAFICO DE BARRAS VERTICALES
   ========================================================== */

const GraficoBarras = ({
  datos
}) => {

  if (
    datos.length === 0
  ) {

    return (
      <div className="empty">
        No hay datos suficientes para construir este gráfico.
      </div>
    )
  }


  const ancho =
    Math.max(
      760,
      datos.length * 90
    )

  const alto =
    390


  const margenIzquierdo = 70
  const margenDerecho = 25
  const margenSuperior = 50
  const margenInferior = 85


  const areaAncho =
    ancho -
    margenIzquierdo -
    margenDerecho

  const areaAlto =
    alto -
    margenSuperior -
    margenInferior


  const valores =
    datos.map(
      (item) =>
        Number(
          item.valor
        ) || 0
    )


  const maximo =
    Math.max(
      ...valores,
      1
    )


  const minimo =
    Math.min(
      ...valores,
      0
    )


  const rango =
    maximo -
    minimo ||
    1


  const convertirY =
    (valor) =>
      margenSuperior +
      (
        (
          maximo -
          valor
        ) /
        rango
      ) *
        areaAlto


  const baseY =
    convertirY(0)


  const espacio =
    areaAncho /
    datos.length


  const anchoBarra =
    Math.min(
      52,
      espacio * 0.58
    )


  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto"
      }}
    >
      <svg
        viewBox={
          `0 0 ${ancho} ${alto}`
        }
        style={{
          display: "block",
          minWidth:
            `${ancho}px`,
          width: "100%",
          height: "auto"
        }}
        role="img"
        aria-label="Gráfico de barras"
      >
        {/* ================================================
            GUIAS
            ================================================ */}

        {[
          0,
          0.25,
          0.5,
          0.75,
          1
        ].map(
          (proporcion) => {

            const valor =
              maximo -
              rango *
                proporcion


            const y =
              convertirY(
                valor
              )


            return (
              <g
                key={
                  proporcion
                }
              >
                <line
                  x1={
                    margenIzquierdo
                  }
                  x2={
                    ancho -
                    margenDerecho
                  }
                  y1={y}
                  y2={y}
                  stroke="#eadfd7"
                  strokeDasharray="4 5"
                />

                <text
                  x={
                    margenIzquierdo -
                    12
                  }
                  y={
                    y + 4
                  }
                  textAnchor="end"
                  fontSize="11"
                  fill="#8a7568"
                >
                  {formatoCorto(
                    valor
                  )}
                </text>
              </g>
            )
          }
        )}


        {/* EJE Y */}

        <line
          x1={
            margenIzquierdo
          }
          x2={
            margenIzquierdo
          }
          y1={
            margenSuperior
          }
          y2={
            margenSuperior +
            areaAlto
          }
          stroke="#cfc2b9"
        />


        {/* EJE X */}

        <line
          x1={
            margenIzquierdo
          }
          x2={
            ancho -
            margenDerecho
          }
          y1={
            baseY
          }
          y2={
            baseY
          }
          stroke="#cfc2b9"
        />


        {/* ================================================
            BARRAS
            ================================================ */}

        {datos.map(
          (
            item,
            indice
          ) => {

            const valor =
              Number(
                item.valor
              ) || 0


            const centroX =
              margenIzquierdo +
              espacio *
                indice +
              espacio /
                2


            const yValor =
              convertirY(
                valor
              )


            const yBarra =
              Math.min(
                yValor,
                baseY
              )


            const alturaBarra =
              Math.max(
                1,
                Math.abs(
                  baseY -
                  yValor
                )
              )


            return (
              <g
                key={
                  `${item.etiqueta}-${indice}`
                }
              >
                <rect
                  x={
                    centroX -
                    anchoBarra /
                      2
                  }
                  y={
                    yBarra
                  }
                  width={
                    anchoBarra
                  }
                  height={
                    alturaBarra
                  }
                  rx="7"
                  fill="#c85c2d"
                >
                  <title>
                    {`${item.etiqueta}: ${formatoNumero(
                      valor
                    )}`}
                  </title>
                </rect>


                {/* VALOR */}

                <text
                  x={
                    centroX
                  }
                  y={
                    yValor -
                    10
                  }
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#4f3c32"
                >
                  {formatoCorto(
                    valor
                  )}
                </text>


                {/* ETIQUETA */}

                <text
                  x={
                    centroX
                  }
                  y={
                    margenSuperior +
                    areaAlto +
                    25
                  }
                  textAnchor="end"
                  transform={
                    `rotate(-35 ${centroX} ${
                      margenSuperior +
                      areaAlto +
                      25
                    })`
                  }
                  fontSize="11"
                  fill="#6c5b51"
                >
                  {cortarTexto(
                    item.etiqueta,
                    17
                  )}
                </text>
              </g>
            )
          }
        )}
      </svg>
    </div>
  )
}


/* ==========================================================
   GRAFICO DE LINEA + PUNTOS
   ========================================================== */

const GraficoLineaPuntos = ({
  datos
}) => {

  if (
    datos.length === 0
  ) {

    return (
      <div className="empty">
        No hay datos suficientes para construir este gráfico.
      </div>
    )
  }


  const ancho =
    Math.max(
      780,
      datos.length * 90
    )

  const alto =
    390


  const margenIzquierdo = 75
  const margenDerecho = 30
  const margenSuperior = 55
  const margenInferior = 75


  const areaAncho =
    ancho -
    margenIzquierdo -
    margenDerecho

  const areaAlto =
    alto -
    margenSuperior -
    margenInferior


  const valores =
    datos.map(
      (item) =>
        Number(
          item.valor
        ) || 0
    )


  const minimoReal =
    Math.min(
      ...valores
    )


  const maximoReal =
    Math.max(
      ...valores
    )


  const diferencia =
    maximoReal -
    minimoReal


  const padding =
    diferencia > 0
      ? diferencia * 0.16
      : Math.max(
          Math.abs(maximoReal) *
            0.1,
          1
        )


  const minimo =
    minimoReal -
    padding

  const maximo =
    maximoReal +
    padding


  const rango =
    maximo -
    minimo ||
    1


  const puntos =
    datos.map(
      (
        item,
        indice
      ) => {

        const x =
          datos.length === 1
            ? margenIzquierdo +
              areaAncho /
                2
            : margenIzquierdo +
              (
                indice /
                (
                  datos.length -
                  1
                )
              ) *
                areaAncho


        const y =
          margenSuperior +
          (
            (
              maximo -
              Number(
                item.valor
              )
            ) /
            rango
          ) *
            areaAlto


        return {
          ...item,
          x,
          y
        }
      }
    )


  const linea =
    puntos
      .map(
        (punto) =>
          `${punto.x},${punto.y}`
      )
      .join(" ")


  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto"
      }}
    >
      <svg
        viewBox={
          `0 0 ${ancho} ${alto}`
        }
        style={{
          display: "block",
          minWidth:
            `${ancho}px`,
          width: "100%",
          height: "auto"
        }}
        role="img"
        aria-label="Gráfico de línea con puntos"
      >
        {/* ================================================
            GUIAS
            ================================================ */}

        {[
          0,
          0.25,
          0.5,
          0.75,
          1
        ].map(
          (proporcion) => {

            const valor =
              maximo -
              rango *
                proporcion


            const y =
              margenSuperior +
              areaAlto *
                proporcion


            return (
              <g
                key={
                  proporcion
                }
              >
                <line
                  x1={
                    margenIzquierdo
                  }
                  x2={
                    ancho -
                    margenDerecho
                  }
                  y1={y}
                  y2={y}
                  stroke="#eadfd7"
                  strokeDasharray="4 5"
                />

                <text
                  x={
                    margenIzquierdo -
                    12
                  }
                  y={
                    y + 4
                  }
                  textAnchor="end"
                  fontSize="11"
                  fill="#89756a"
                >
                  {formatoCorto(
                    valor
                  )}
                </text>
              </g>
            )
          }
        )}


        {/* EJE X */}

        <line
          x1={
            margenIzquierdo
          }
          x2={
            ancho -
            margenDerecho
          }
          y1={
            margenSuperior +
            areaAlto
          }
          y2={
            margenSuperior +
            areaAlto
          }
          stroke="#cfc2b9"
        />


        {/* EJE Y */}

        <line
          x1={
            margenIzquierdo
          }
          x2={
            margenIzquierdo
          }
          y1={
            margenSuperior
          }
          y2={
            margenSuperior +
            areaAlto
          }
          stroke="#cfc2b9"
        />


        {/* ================================================
            LINEA QUE CONECTA TODOS LOS PUNTOS
            ================================================ */}

        {puntos.length > 1 && (
          <polyline
            points={
              linea
            }
            fill="none"
            stroke="#c85c2d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}


        {/* ================================================
            PUNTOS
            ================================================ */}

        {puntos.map(
          (
            punto,
            indice
          ) => (
            <g
              key={
                `${punto.etiqueta}-${indice}`
              }
            >
              <circle
                cx={
                  punto.x
                }
                cy={
                  punto.y
                }
                r="6"
                fill="#ffffff"
                stroke="#c85c2d"
                strokeWidth="4"
              >
                <title>
                  {`${punto.etiqueta}: ${formatoNumero(
                    punto.valor
                  )}`}
                </title>
              </circle>


              <text
                x={
                  punto.x
                }
                y={
                  punto.y -
                  14
                }
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#4f3c32"
              >
                {formatoCorto(
                  punto.valor
                )}
              </text>


              <text
                x={
                  punto.x
                }
                y={
                  margenSuperior +
                  areaAlto +
                  26
                }
                textAnchor="middle"
                fontSize="11"
                fill="#6c5b51"
              >
                {cortarTexto(
                  punto.etiqueta,
                  12
                )}
              </text>
            </g>
          )
        )}
      </svg>
    </div>
  )
}


/* ==========================================================
   LINEAS DE TODAS LAS METRICAS
   ========================================================== */

const GraficoTodasMetricas = ({
  modelo
}) => {

  const {
    etiquetas,
    series
  } = modelo


  if (
    etiquetas.length === 0 ||
    series.length === 0
  ) {

    return (
      <div className="empty">
        No hay suficientes datos para comparar las métricas.
      </div>
    )
  }


  const ancho =
    Math.max(
      800,
      etiquetas.length * 95
    )

  const alto =
    420


  const margenIzquierdo = 65
  const margenDerecho = 30
  const margenSuperior = 30
  const margenInferior = 80


  const areaAncho =
    ancho -
    margenIzquierdo -
    margenDerecho

  const areaAlto =
    alto -
    margenSuperior -
    margenInferior


  const posicionX =
    (indice) => {

      if (
        etiquetas.length === 1
      ) {

        return margenIzquierdo +
          areaAncho /
            2
      }


      return margenIzquierdo +
        (
          indice /
          (
            etiquetas.length -
            1
          )
        ) *
          areaAncho
    }


  const posicionY =
    (valor) =>
      margenSuperior +
      (
        (
          100 -
          valor
        ) /
        100
      ) *
        areaAlto


  return (
    <>
      {/* ====================================================
          LEYENDA
          ==================================================== */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          marginBottom: "18px"
        }}
      >
        {series.map(
          (serie) => (
            <div
              key={
                serie.nombre
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12px"
              }}
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius:
                    "999px",
                  display:
                    "inline-block",
                  background:
                    serie.color
                }}
              />

              <strong>
                {serie.nombre}
              </strong>
            </div>
          )
        )}
      </div>


      <div
        style={{
          width: "100%",
          overflowX: "auto"
        }}
      >
        <svg
          viewBox={
            `0 0 ${ancho} ${alto}`
          }
          style={{
            display: "block",
            minWidth:
              `${ancho}px`,
            width: "100%",
            height: "auto"
          }}
          role="img"
          aria-label="Comparación de todas las métricas"
        >
          {/* ==============================================
              GUIAS 0 - 100
              ============================================== */}

          {[
            0,
            25,
            50,
            75,
            100
          ].map(
            (valor) => {

              const y =
                posicionY(
                  valor
                )


              return (
                <g
                  key={
                    valor
                  }
                >
                  <line
                    x1={
                      margenIzquierdo
                    }
                    x2={
                      ancho -
                      margenDerecho
                    }
                    y1={y}
                    y2={y}
                    stroke="#eadfd7"
                    strokeDasharray="4 5"
                  />

                  <text
                    x={
                      margenIzquierdo -
                      12
                    }
                    y={
                      y + 4
                    }
                    textAnchor="end"
                    fontSize="11"
                    fill="#89756a"
                  >
                    {valor}%
                  </text>
                </g>
              )
            }
          )}


          {/* EJE X */}

          <line
            x1={
              margenIzquierdo
            }
            x2={
              ancho -
              margenDerecho
            }
            y1={
              margenSuperior +
              areaAlto
            }
            y2={
              margenSuperior +
              areaAlto
            }
            stroke="#cfc2b9"
          />


          {/* EJE Y */}

          <line
            x1={
              margenIzquierdo
            }
            x2={
              margenIzquierdo
            }
            y1={
              margenSuperior
            }
            y2={
              margenSuperior +
              areaAlto
            }
            stroke="#cfc2b9"
          />


          {/* ==============================================
              ETIQUETAS X
              ============================================== */}

          {etiquetas.map(
            (
              etiqueta,
              indice
            ) => {

              const x =
                posicionX(
                  indice
                )


              return (
                <text
                  key={
                    `${etiqueta}-${indice}`
                  }
                  x={x}
                  y={
                    margenSuperior +
                    areaAlto +
                    28
                  }
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6c5b51"
                >
                  {cortarTexto(
                    etiqueta,
                    12
                  )}
                </text>
              )
            }
          )}


          {/* ==============================================
              TODAS LAS SERIES
              ============================================== */}

          {series.map(
            (serie) => {

              const puntos =
                serie.puntos.map(
                  (
                    punto,
                    indice
                  ) => ({
                    ...punto,

                    x:
                      posicionX(
                        indice
                      ),

                    y:
                      posicionY(
                        punto.valorNormalizado
                      )
                  })
                )


              const linea =
                puntos
                  .map(
                    (punto) =>
                      `${punto.x},${punto.y}`
                  )
                  .join(" ")


              return (
                <g
                  key={
                    serie.nombre
                  }
                >
                  {puntos.length >
                    1 && (
                    <polyline
                      points={
                        linea
                      }
                      fill="none"
                      stroke={
                        serie.color
                      }
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}


                  {puntos.map(
                    (
                      punto,
                      indice
                    ) => (
                      <circle
                        key={
                          `${serie.nombre}-${indice}`
                        }
                        cx={
                          punto.x
                        }
                        cy={
                          punto.y
                        }
                        r="5"
                        fill="#ffffff"
                        stroke={
                          serie.color
                        }
                        strokeWidth="3"
                      >
                        <title>
                          {`${serie.nombre}
${punto.etiqueta}
Valor real: ${formatoNumero(
                            punto.valorReal
                          )}
Escala visual: ${punto.valorNormalizado.toFixed(
                            1
                          )}%`}
                        </title>
                      </circle>
                    )
                  )}
                </g>
              )
            }
          )}
        </svg>
      </div>
    </>
  )
}


/* ==========================================================
   PANEL DE GRAFICOS
   ========================================================== */

const PanelGraficos = ({
  detalle
}) => {

  const filas =
    Array.isArray(
      detalle?.filas
    )
      ? detalle.filas
      : []


  const columnas =
    Array.isArray(
      detalle
        ?.importacion
        ?.columnas
    )
      ? detalle.importacion.columnas
      : []


  const deteccion =
    useMemo(
      () =>
        detectarColumnas(
          filas,
          columnas
        ),
      [
        filas,
        columnas
      ]
    )


  const [
    metrica,
    setMetrica
  ] =
    useState(
      () =>
        elegirMetrica(
          deteccion.numericas
        )
    )


  const [
    dimension,
    setDimension
  ] =
    useState(
      () =>
        elegirDimension(
          deteccion.dimensiones
        )
    )


  const [
    modoLinea,
    setModoLinea
  ] =
    useState(
      "una"
    )


  /* ========================================================
     CORREGIR SELECCIONES
     ======================================================== */

  useEffect(
    () => {

      if (
        !deteccion
          .numericas
          .includes(
            metrica
          )
      ) {

        setMetrica(
          elegirMetrica(
            deteccion.numericas
          )
        )
      }


      if (
        dimension !==
          "__fila__" &&
        !deteccion
          .dimensiones
          .includes(
            dimension
          )
      ) {

        setDimension(
          elegirDimension(
            deteccion.dimensiones
          )
        )
      }

    },
    [
      deteccion,
      metrica,
      dimension
    ]
  )


  /* ========================================================
     SERIE PRINCIPAL
     ======================================================== */

  const serie =
    useMemo(
      () =>
        construirSerie(
          filas,
          dimension,
          metrica
        ),
      [
        filas,
        dimension,
        metrica
      ]
    )


  /* ========================================================
     TODAS LAS METRICAS
     ======================================================== */

  const todasMetricas =
    useMemo(
      () =>
        construirTodasMetricas(
          filas,
          dimension,
          deteccion.numericas,
          metrica
        ),
      [
        filas,
        dimension,
        deteccion,
        metrica
      ]
    )


  /* ========================================================
     RESUMEN
     ======================================================== */

  const resumen =
    useMemo(
      () => {

        if (!metrica) {

          return {
            total: 0,
            promedio: 0,
            maximo: 0,
            minimo: 0,
            cantidad: 0
          }
        }


        const valores =
          filas
            .map(
              (fila) =>
                aNumero(
                  fila[metrica]
                )
            )
            .filter(
              (valor) =>
                valor !== null
            )


        if (
          valores.length === 0
        ) {

          return {
            total: 0,
            promedio: 0,
            maximo: 0,
            minimo: 0,
            cantidad: 0
          }
        }


        const total =
          valores.reduce(
            (
              acumulado,
              valor
            ) =>
              acumulado +
              valor,
            0
          )


        return {
          total,

          promedio:
            total /
            valores.length,

          maximo:
            Math.max(
              ...valores
            ),

          minimo:
            Math.min(
              ...valores
            ),

          cantidad:
            valores.length
        }
      },
      [
        filas,
        metrica
      ]
    )


  const totalFilas =
    Number(
      detalle
        ?.importacion
        ?.total_filas ||
      0
    )


  const muestraParcial =
    filas.length <
    totalFilas


  /* ========================================================
     SIN NUMEROS
     ======================================================== */

  if (
    deteccion
      .numericas
      .length === 0
  ) {

    return (
      <div
        className="empty"
        style={{
          marginTop: "18px"
        }}
      >
        <strong
          style={{
            display: "block",
            marginBottom: "6px"
          }}
        >
          No se detectaron columnas numéricas
        </strong>

        <span>
          El archivo no contiene suficientes datos numéricos para generar gráficos.
        </span>
      </div>
    )
  }


  return (
    <div
      style={{
        marginTop: "18px"
      }}
    >
      {/* ====================================================
          MUESTRA
          ==================================================== */}

      <div
        className={
          muestraParcial
            ? "alert"
            : "alert alert-success"
        }
        style={{
          marginBottom: "16px"
        }}
      >
        {muestraParcial
          ? `El dataset tiene ${miles(
              totalFilas
            )} filas. Los gráficos utilizan las primeras ${miles(
              filas.length
            )} para mantener una visualización rápida.`
          : `Los gráficos utilizan las ${miles(
              filas.length
            )} filas disponibles de este dataset.`}
      </div>


      {/* ====================================================
          SELECTORES
          ==================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "18px"
        }}
      >
        <div className="field">
          <label>
            Métrica principal
          </label>

          <select
            value={
              metrica
            }
            onChange={
              (event) =>
                setMetrica(
                  event.target.value
                )
            }
          >
            {deteccion.numericas.map(
              (columna) => (
                <option
                  key={
                    columna
                  }
                  value={
                    columna
                  }
                >
                  {columna}
                </option>
              )
            )}
          </select>
        </div>


        <div className="field">
          <label>
            Agrupar por
          </label>

          <select
            value={
              dimension
            }
            onChange={
              (event) =>
                setDimension(
                  event.target.value
                )
            }
          >
            {deteccion
              .dimensiones
              .length === 0 && (
              <option value="__fila__">
                Número de fila
              </option>
            )}

            {deteccion.dimensiones.map(
              (columna) => (
                <option
                  key={
                    columna
                  }
                  value={
                    columna
                  }
                >
                  {columna}
                </option>
              )
            )}
          </select>
        </div>
      </div>


      {/* ====================================================
          INDICADORES
          ==================================================== */}

      <div className="metrics metrics-4">
        <div className="metric">
          <span>
            Total
          </span>

          <strong>
            {formatoNumero(
              resumen.total
            )}
          </strong>
        </div>


        <div className="metric">
          <span>
            Promedio
          </span>

          <strong>
            {formatoNumero(
              resumen.promedio
            )}
          </strong>
        </div>


        <div className="metric">
          <span>
            Máximo
          </span>

          <strong>
            {formatoNumero(
              resumen.maximo
            )}
          </strong>
        </div>


        <div className="metric">
          <span>
            Valores analizados
          </span>

          <strong>
            {miles(
              resumen.cantidad
            )}
          </strong>
        </div>
      </div>


      {/* ====================================================
          BARRAS
          ==================================================== */}

      <div
        className="card"
        style={{
          marginTop: "18px",
          boxShadow: "none"
        }}
      >
        <div className="chart-title">
          Gráfico de barras
        </div>


        <p
          className="muted"
          style={{
            margin:
              "4px 0 10px"
          }}
        >
          {dimension ===
          "__fila__"
            ? `${metrica} por registro.`
            : `Comparación de ${metrica} agrupada por ${dimension}.`}
        </p>


        <GraficoBarras
          datos={
            serie
          }
        />
      </div>


      {/* ====================================================
          LINEAS
          ==================================================== */}

      <div
        className="card"
        style={{
          marginTop: "16px",
          boxShadow: "none"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent:
              "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "12px"
          }}
        >
          <div>
            <div className="chart-title">
              Gráfico de línea y puntos
            </div>

            <p
              className="muted"
              style={{
                margin:
                  "4px 0 0"
              }}
            >
              Observa la evolución de una métrica o compara todas las métricas numéricas del dataset.
            </p>
          </div>


          {/* ================================================
              MODO
              ================================================ */}

          <div
            className="tabs"
            style={{
              flexShrink: 0
            }}
          >
            <button
              type="button"
              className={
                modoLinea ===
                "una"
                  ? "active"
                  : ""
              }
              onClick={
                () =>
                  setModoLinea(
                    "una"
                  )
              }
            >
              Métrica seleccionada
            </button>

            <button
              type="button"
              className={
                modoLinea ===
                "todas"
                  ? "active"
                  : ""
              }
              onClick={
                () =>
                  setModoLinea(
                    "todas"
                  )
              }
            >
              Todas las métricas
            </button>
          </div>
        </div>


        {/* ================================================
            UNA METRICA
            ================================================ */}

        {modoLinea ===
          "una" && (
          <>
            <p
              className="muted"
              style={{
                margin:
                  "0 0 12px"
              }}
            >
              {dimension ===
              "__fila__"
                ? `${metrica} por registro.`
                : `${metrica} agrupada por ${dimension}.`}
            </p>

            <GraficoLineaPuntos
              datos={
                serie
              }
            />
          </>
        )}


        {/* ================================================
            TODAS LAS METRICAS
            ================================================ */}

        {modoLinea ===
          "todas" && (
          <>
            <div
              className="alert"
              style={{
                marginBottom: "16px"
              }}
            >
              Para comparar métricas con escalas diferentes, cada línea se normaliza visualmente de 0 a 100. Los valores reales del CSV no se modifican.
            </div>

            <GraficoTodasMetricas
              modelo={
                todasMetricas
              }
            />
          </>
        )}
      </div>
    </div>
  )
}


/* ==========================================================
   NORMALIZAR PERMISOS
   ========================================================== */

const obtenerClavesPermisos = (
  respuesta
) => {

  const claves =
    new Set()


  const cursos =
    Array.isArray(
      respuesta?.cursos
    )
      ? respuesta.cursos
      : Array.isArray(
          respuesta
            ?.permisos
            ?.cursos
        )
        ? respuesta
            .permisos
            .cursos
        : []


  for (
    const curso
    of cursos
  ) {

    const modulos =
      Array.isArray(
        curso?.modulos
      )
        ? curso.modulos
        : Array.isArray(
            curso?.modules
          )
          ? curso.modules
          : []


    for (
      const modulo
      of modulos
    ) {

      if (
        modulo?.activo ===
        false
      ) {
        continue
      }


      if (
        modulo?.clave
      ) {

        claves.add(
          String(
            modulo.clave
          )
        )
      }
    }
  }


  const separados =
    Array.isArray(
      respuesta?.modulos
    )
      ? respuesta.modulos
      : Array.isArray(
          respuesta
            ?.permisos
            ?.modulos
        )
        ? respuesta
            .permisos
            .modulos
        : []


  for (
    const modulo
    of separados
  ) {

    if (
      modulo?.activo ===
      false
    ) {
      continue
    }


    if (
      modulo?.clave
    ) {

      claves.add(
        String(
          modulo.clave
        )
      )
    }
  }


  return claves
}


/* ==========================================================
   DATASETS
   ========================================================== */

const Archivos = () => {

  const [
    lista,
    setLista
  ] =
    useState([])


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
    filtro,
    setFiltro
  ] =
    useState(
      "todos"
    )


  const [
    busqueda,
    setBusqueda
  ] =
    useState("")


  /* ========================================================
     MODAL
     ======================================================== */

  const [
    abierta,
    setAbierta
  ] =
    useState(null)


  const [
    detalle,
    setDetalle
  ] =
    useState(null)


  const [
    cargandoDetalle,
    setCargandoDetalle
  ] =
    useState(false)


  const [
    errorDetalle,
    setErrorDetalle
  ] =
    useState("")


  const [
    vistaModal,
    setVistaModal
  ] =
    useState(
      "datos"
    )


  /* ========================================================
     PERMISO GRAFICOS
     ======================================================== */

  const [
    puedeVerGraficos,
    setPuedeVerGraficos
  ] =
    useState(false)


  const [
    cargandoPermisoGraficos,
    setCargandoPermisoGraficos
  ] =
    useState(true)


  /* ========================================================
     LISTAR DATASETS
     ======================================================== */

  useEffect(
    () => {

      let activo =
        true


      const cargar =
        async () => {

          setCargando(
            true
          )

          setError("")


          try {

            const respuesta =
              await api.get(
                "/imports"
              )


            if (!activo) {
              return
            }


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

            if (activo) {

              setError(
                getMessage(
                  problema
                )
              )
            }

          } finally {

            if (activo) {

              setCargando(
                false
              )
            }
          }
        }


      cargar()


      return () => {
        activo = false
      }

    },
    []
  )


  /* ========================================================
     PERMISO GRAFICOS
     ======================================================== */

  useEffect(
    () => {

      if (
        esAdmin()
      ) {

        setPuedeVerGraficos(
          true
        )

        setCargandoPermisoGraficos(
          false
        )

        return
      }


      let activo =
        true


      const cargarPermisos =
        async () => {

          try {

            const respuesta =
              await obtenerMisPermisos()


            if (!activo) {
              return
            }


            const claves =
              obtenerClavesPermisos(
                respuesta
              )


            setPuedeVerGraficos(
              claves.has(
                PERMISO_GRAFICOS
              )
            )

          } catch (
            problema
          ) {

            if (activo) {

              setPuedeVerGraficos(
                false
              )
            }

          } finally {

            if (activo) {

              setCargandoPermisoGraficos(
                false
              )
            }
          }
        }


      cargarPermisos()


      return () => {
        activo = false
      }

    },
    []
  )


  /* ========================================================
     ABRIR DATASET
     ======================================================== */

  const abrir =
    async (
      importacion
    ) => {

      setAbierta(
        importacion
      )

      setDetalle(null)
      setVistaModal("datos")
      setErrorDetalle("")
      setCargandoDetalle(true)


      const total =
        Number(
          importacion
            .total_filas ||
          FILAS_TABLA
        )


      const limite =
        Math.min(
          Math.max(
            total,
            FILAS_TABLA
          ),
          FILAS_GRAFICO_MAX
        )


      try {

        const respuesta =
          await api.get(
            `/imports/${importacion.id}?limite=${limite}`
          )


        setDetalle(
          respuesta.data
        )

      } catch (
        problema
      ) {

        setErrorDetalle(
          getMessage(
            problema
          )
        )

      } finally {

        setCargandoDetalle(
          false
        )
      }
    }


  /* ========================================================
     CERRAR MODAL
     ======================================================== */

  const cerrarModal = () => {

    setAbierta(null)
    setDetalle(null)
    setVistaModal("datos")
    setErrorDetalle("")
  }


  /* ========================================================
     FILTRADO
     ======================================================== */

  const visibles =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase()


        return lista
          .filter(
            (item) => {

              if (
                filtro ===
                "propias"
              ) {
                return Boolean(
                  item.es_propia
                )
              }


              if (
                filtro ===
                "otras"
              ) {
                return !item.es_propia
              }


              return true
            }
          )
          .filter(
            (item) => {

              if (!texto) {
                return true
              }


              const empresa =
                String(
                  item.empresa ||
                  ""
                ).toLowerCase()


              const archivo =
                String(
                  item.archivo ||
                  ""
                ).toLowerCase()


              return (
                empresa.includes(
                  texto
                ) ||
                archivo.includes(
                  texto
                )
              )
            }
          )
      },
      [
        lista,
        filtro,
        busqueda
      ]
    )


  /* ========================================================
     TOTALES
     ======================================================== */

  const totales =
    useMemo(
      () => ({

        archivos:
          lista.length,

        propias:
          lista.filter(
            (item) =>
              item.es_propia
          ).length,

        otras:
          lista.filter(
            (item) =>
              !item.es_propia
          ).length,

        filas:
          lista.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.total_filas ||
                0
              ),
            0
          )

      }),
      [
        lista
      ]
    )


  /* ========================================================
     FILAS PARA TABLA
     ======================================================== */

  const filasTabla =
    useMemo(
      () => {

        if (
          !Array.isArray(
            detalle?.filas
          )
        ) {
          return []
        }


        return detalle
          .filas
          .slice(
            0,
            FILAS_TABLA
          )
      },
      [
        detalle
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
            Datasets
          </h1>

          <p>
            Consulta los archivos importados y visualiza sus datos y gráficos.
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
          INDICADORES GENERALES
          ==================================================== */}

      <div className="metrics metrics-4">

        <div className="metric">
          <span>
            Archivos
          </span>

          <strong>
            {totales.archivos}
          </strong>
        </div>


        <div className="metric">
          <span>
            De la empresa
          </span>

          <strong>
            {totales.propias}
          </strong>
        </div>


        <div className="metric">
          <span>
            De la competencia
          </span>

          <strong>
            {totales.otras}
          </strong>
        </div>


        <div className="metric">
          <span>
            Filas totales
          </span>

          <strong>
            {miles(
              totales.filas
            )}
          </strong>
        </div>

      </div>


      {/* ====================================================
          TOOLBAR
          ==================================================== */}

      <div className="toolbar">

        <div className="toolbar-left">

          <input
            value={
              busqueda
            }
            onChange={
              (event) =>
                setBusqueda(
                  event.target.value
                )
            }
            placeholder="Buscar por restaurante o archivo"
          />

        </div>


        <div className="tabs">

          {[
            {
              valor: "todos",
              label: "Todos"
            },
            {
              valor: "propias",
              label:
                "De la empresa"
            },
            {
              valor: "otras",
              label:
                "Competencia"
            }
          ].map(
            (opcion) => (
              <button
                key={
                  opcion.valor
                }
                type="button"
                className={
                  filtro ===
                  opcion.valor
                    ? "active"
                    : ""
                }
                onClick={
                  () =>
                    setFiltro(
                      opcion.valor
                    )
                }
              >
                {opcion.label}
              </button>
            )
          )}

        </div>

      </div>


      {/* ====================================================
          ESTADOS
          ==================================================== */}

      {cargando && (
        <div className="loading">
          Cargando archivos
        </div>
      )}


      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}


      {!cargando &&
        visibles.length === 0 && (

        <div className="card">

          <div className="empty">
            {lista.length === 0
              ? "Todavía no hay archivos importados."
              : "Ningún archivo coincide con la búsqueda."}
          </div>

        </div>
      )}


      {/* ====================================================
          CARDS
          ==================================================== */}

      <div className="cards">

        {visibles.map(
          (item) => (

            <button
              type="button"
              key={
                item.id
              }
              className={
                `archivo-card ${
                  item.es_propia
                    ? "es-propia"
                    : ""
                }`
              }
              onClick={
                () =>
                  abrir(
                    item
                  )
              }
            >
              <div className="archivo-head">

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
                    ? "Nuestra empresa"
                    : "Competencia"}
                </span>


                <span className="chip chip-tipo">
                  {String(
                    item.formato ||
                    ""
                  ).toUpperCase()}
                </span>

              </div>


              <h3>
                {item.empresa}
              </h3>


              <p className="archivo-nombre">
                {item.archivo}
              </p>


              <div className="archivo-cifras">

                <div>
                  <strong>
                    {miles(
                      item.total_filas
                    )}
                  </strong>

                  <span>
                    filas
                  </span>
                </div>


                <div>
                  <strong>
                    {Array.isArray(
                      item.columnas
                    )
                      ? item.columnas.length
                      : 0}
                  </strong>

                  <span>
                    columnas
                  </span>
                </div>

              </div>


              <div className="archivo-columnas">

                {Array.isArray(
                  item.columnas
                ) &&
                  item.columnas
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (columna) => (
                        <span
                          key={
                            columna
                          }
                        >
                          {columna}
                        </span>
                      )
                    )}


                {Array.isArray(
                  item.columnas
                ) &&
                  item.columnas.length >
                    4 && (

                  <span className="mas">
                    +{item.columnas.length - 4}
                  </span>
                )}

              </div>


              <div className="archivo-pie">

                <span>
                  {item.autor}
                </span>


                <span>
                  {item.created_at
                    ? new Date(
                        item.created_at
                      ).toLocaleDateString(
                        "es-PE"
                      )
                    : "—"}
                </span>

              </div>

            </button>
          )
        )}

      </div>


      {/* ====================================================
          MODAL
          ==================================================== */}

      {abierta && (

        <Modal
          ancho
          title={
            `${abierta.empresa} — ${abierta.archivo}`
          }
          onClose={
            cerrarModal
          }
        >
          {cargandoDetalle && (

            <div className="loading">
              Cargando contenido
            </div>

          )}


          {errorDetalle && (

            <div className="alert alert-error">
              {errorDetalle}
            </div>

          )}


          {detalle && (
            <>
              {/* ============================================
                  METRICAS DEL DATASET
                  ============================================ */}

              <div className="metrics metrics-4">

                <div className="metric">
                  <span>
                    Filas
                  </span>

                  <strong>
                    {miles(
                      detalle
                        .importacion
                        .total_filas
                    )}
                  </strong>
                </div>


                <div className="metric">
                  <span>
                    Columnas
                  </span>

                  <strong>
                    {Array.isArray(
                      detalle
                        .importacion
                        .columnas
                    )
                      ? detalle
                          .importacion
                          .columnas
                          .length
                      : 0}
                  </strong>
                </div>


                <div className="metric">
                  <span>
                    Origen
                  </span>

                  <strong>
                    {detalle
                      .importacion
                      .es_propia
                      ? "Propia"
                      : "Competencia"}
                  </strong>
                </div>


                <div className="metric">
                  <span>
                    Cargado por
                  </span>

                  <strong className="ellipsis">
                    {detalle
                      .importacion
                      .autor}
                  </strong>
                </div>

              </div>


              {/* ============================================
                  DATOS / GRAFICOS
                  ============================================ */}

              <div
                className="tabs"
                style={{
                  marginTop: "20px",
                  marginBottom:
                    "18px",
                  borderBottom:
                    "1px solid #eadfd7",
                  paddingBottom:
                    "8px"
                }}
              >
                <button
                  type="button"
                  className={
                    vistaModal ===
                    "datos"
                      ? "active"
                      : ""
                  }
                  onClick={
                    () =>
                      setVistaModal(
                        "datos"
                      )
                  }
                >
                  Datos
                </button>


                {!cargandoPermisoGraficos &&
                  puedeVerGraficos && (

                  <button
                    type="button"
                    className={
                      vistaModal ===
                      "graficos"
                        ? "active"
                        : ""
                    }
                    onClick={
                      () =>
                        setVistaModal(
                          "graficos"
                        )
                    }
                  >
                    Gráficos
                  </button>
                )}

              </div>


              {/* ============================================
                  DATOS
                  ============================================ */}

              {vistaModal ===
                "datos" && (
                <>
                  <p
                    className="muted"
                    style={{
                      margin:
                        "0 0 10px"
                    }}
                  >
                    Mostrando las primeras{" "}
                    {filasTabla.length} filas del archivo con sus columnas originales.
                  </p>


                  <div className="table-wrap tabla-modal">

                    <table className="tabla-dinamica">

                      <thead>
                        <tr>

                          <th className="col-num">
                            #
                          </th>


                          {detalle
                            .importacion
                            .columnas
                            .map(
                              (columna) => (

                                <th
                                  key={
                                    columna
                                  }
                                >
                                  {columna}
                                </th>

                              )
                            )}

                        </tr>
                      </thead>


                      <tbody>

                        {filasTabla.map(
                          (
                            fila,
                            indice
                          ) => (

                            <tr
                              key={
                                indice
                              }
                            >
                              <td className="col-num">
                                {indice + 1}
                              </td>


                              {detalle
                                .importacion
                                .columnas
                                .map(
                                  (columna) => (

                                    <td
                                      key={
                                        columna
                                      }
                                    >
                                      {fila[
                                        columna
                                      ] ===
                                        undefined ||
                                      fila[
                                        columna
                                      ] ===
                                        null ||
                                      fila[
                                        columna
                                      ] ===
                                        ""
                                        ? (
                                        <span className="vacio">
                                          &mdash;
                                        </span>
                                      )
                                        : String(
                                            fila[
                                              columna
                                            ]
                                          )}
                                    </td>

                                  )
                                )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                </>
              )}


              {/* ============================================
                  GRAFICOS
                  ============================================ */}

              {vistaModal ===
                "graficos" &&
                puedeVerGraficos && (

                <PanelGraficos
                  key={
                    detalle
                      .importacion
                      .id
                  }
                  detalle={
                    detalle
                  }
                />

              )}

            </>
          )}

        </Modal>
      )}

    </>
  )
}


export default Archivos