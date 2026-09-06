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

/*
 * Usamos más filas para los cálculos de los gráficos,
 * pero seguimos mostrando solamente 100 en la tabla.
 */
const FILAS_GRAFICO_MAX = 5000

const PERMISO_GRAFICOS =
  "big_data.graficos"


/* ==========================================================
   UTILIDADES
   ========================================================== */

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")


/* ==========================================================
   CONVERTIR VALORES A NUMERO
   ========================================================== */

const aNumero = (valor) => {
  if (typeof valor === "number") {
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
   * Ejemplos:
   *
   * 1,200.50
   * 1.200,50
   */
  if (
    texto.includes(",") &&
    texto.includes(".")
  ) {
    const ultimaComa =
      texto.lastIndexOf(",")

    const ultimoPunto =
      texto.lastIndexOf(".")

    if (ultimaComa > ultimoPunto) {
      texto =
        texto
          .replace(/\./g, "")
          .replace(",", ".")
    } else {
      texto =
        texto.replace(/,/g, "")
    }
  } else if (texto.includes(",")) {
    const partes =
      texto.split(",")

    const ultima =
      partes[
        partes.length - 1
      ]

    /*
     * 25,50
     */
    if (
      partes.length === 2 &&
      ultima.length <= 2
    ) {
      texto =
        texto.replace(",", ".")
    } else {
      /*
       * 1,200
       */
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
   FORMATEAR NUMERO
   ========================================================== */

const formatoNumero = (numero) => {
  const valor =
    Number(numero)

  if (!Number.isFinite(valor)) {
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
   ACORTAR TEXTO
   ========================================================== */

const cortarTexto = (
  valor,
  limite = 13
) => {
  const texto =
    String(valor ?? "")

  if (
    texto.length <=
    limite
  ) {
    return texto
  }

  return `${texto.slice(
    0,
    limite
  )}…`
}


/* ==========================================================
   DETECTAR COLUMNAS NUMERICAS Y DIMENSIONES
   ========================================================== */

const detectarColumnas = (
  filas,
  columnas
) => {
  const muestra =
    filas.slice(0, 200)

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
   METRICA INICIAL
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
    "venta",
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
            normalizarTexto(columna)
              .replace(
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

    if (encontrada) {
      return encontrada
    }
  }

  return columnas[0]
}


/* ==========================================================
   DIMENSION INICIAL
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

    if (encontrada) {
      return encontrada
    }
  }

  return columnas[0]
}


/* ==========================================================
   DETECTAR DIMENSION TEMPORAL
   ========================================================== */

const esTemporal = (columna) => {
  const texto =
    normalizarTexto(columna)

  return (
    texto.includes("fecha") ||
    texto.includes("mes") ||
    texto.includes("periodo") ||
    texto.includes("ano")
  )
}


/* ==========================================================
   CONSTRUIR SERIE
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
   * Si no existe una dimensión textual,
   * usamos cada fila individualmente.
   */
  if (
    dimension ===
    "__fila__"
  ) {
    return filas
      .slice(0, 30)
      .map(
        (
          fila,
          indice
        ) => {
          const valor =
            aNumero(
              fila[metrica]
            )

          return {
            etiqueta:
              `Fila ${indice + 1}`,

            valor:
              valor ?? 0
          }
        }
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

    const actual =
      grupos.get(
        etiqueta
      ) || 0

    grupos.set(
      etiqueta,
      actual + valor
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

  /*
   * Fechas y meses:
   * respetamos el orden natural.
   *
   * El resto:
   * ordenamos del mayor al menor.
   */
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

  /*
   * Evitamos mostrar cientos de
   * categorías simultáneamente.
   */
  return serie.slice(
    0,
    15
  )
}


/* ==========================================================
   GRAFICO DE BARRAS
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

  const maximo =
    Math.max(
      ...datos.map(
        (item) =>
          Math.abs(
            item.valor
          )
      ),
      1
    )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "11px"
      }}
    >
      {datos.map(
        (
          item,
          indice
        ) => {
          const ancho =
            Math.max(
              2,
              (
                Math.abs(
                  item.valor
                ) /
                maximo
              ) * 100
            )

          return (
            <div
              key={
                `${item.etiqueta}-${indice}`
              }
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(110px, 180px) 1fr minmax(85px, auto)",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <div
                title={
                  item.etiqueta
                }
                style={{
                  fontSize: "12px",
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace:
                    "nowrap"
                }}
              >
                {item.etiqueta}
              </div>

              <div
                style={{
                  height: "20px",
                  borderRadius:
                    "999px",
                  background:
                    "#f2ebe6",
                  overflow:
                    "hidden"
                }}
              >
                <div
                  style={{
                    width:
                      `${ancho}%`,
                    height: "100%",
                    borderRadius:
                      "999px",
                    background:
                      "#c85c2d",
                    transition:
                      "width .3s ease"
                  }}
                />
              </div>

              <div
                style={{
                  textAlign:
                    "right",
                  fontSize:
                    "12px",
                  fontWeight:
                    700
                }}
              >
                {formatoNumero(
                  item.valor
                )}
              </div>
            </div>
          )
        }
      )}
    </div>
  )
}


/* ==========================================================
   GRAFICO DE PUNTOS
   ========================================================== */

const GraficoPuntos = ({
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

  const ancho = 900
  const alto = 320

  const margenIzquierdo = 60
  const margenDerecho = 25
  const margenSuperior = 35
  const margenInferior = 70

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

  /*
   * Normalmente nuestros valores
   * de ventas/cantidades serán positivos.
   * Dejamos cero como base visual.
   */
  const minimo =
    Math.min(
      ...valores,
      0
    )

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
              areaAncho / 2
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
                item.valor || 0
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
        role="img"
        aria-label="Gráfico de puntos"
        style={{
          display: "block",
          width: "100%",
          minWidth: "650px",
          height: "auto"
        }}
      >
        {/* ================================================
            GUIAS HORIZONTALES
            ================================================ */}

        {[
          0,
          0.25,
          0.5,
          0.75,
          1
        ].map(
          (proporcion) => {
            const y =
              margenSuperior +
              areaAlto *
                proporcion

            const valor =
              maximo -
              rango *
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
                  y1={y}
                  x2={
                    ancho -
                    margenDerecho
                  }
                  y2={y}
                  stroke="#eee7e2"
                  strokeDasharray="4 4"
                />

                <text
                  x={
                    margenIzquierdo -
                    10
                  }
                  y={
                    y + 4
                  }
                  textAnchor="end"
                  fontSize="11"
                  fill="#86786f"
                >
                  {formatoNumero(
                    valor
                  )}
                </text>
              </g>
            )
          }
        )}

        {/* ================================================
            EJE X
            ================================================ */}

        <line
          x1={
            margenIzquierdo
          }
          y1={
            margenSuperior +
            areaAlto
          }
          x2={
            ancho -
            margenDerecho
          }
          y2={
            margenSuperior +
            areaAlto
          }
          stroke="#d8cdc5"
          strokeWidth="1"
        />

        {/* ================================================
            EJE Y
            ================================================ */}

        <line
          x1={
            margenIzquierdo
          }
          y1={
            margenSuperior
          }
          x2={
            margenIzquierdo
          }
          y2={
            margenSuperior +
            areaAlto
          }
          stroke="#d8cdc5"
          strokeWidth="1"
        />

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
              {/* guía vertical */}

              <line
                x1={
                  punto.x
                }
                y1={
                  punto.y
                }
                x2={
                  punto.x
                }
                y2={
                  margenSuperior +
                  areaAlto
                }
                stroke="#eadfd7"
                strokeDasharray="3 3"
              />

              {/* punto */}

              <circle
                cx={
                  punto.x
                }
                cy={
                  punto.y
                }
                r="7"
                fill="#c85c2d"
                stroke="#ffffff"
                strokeWidth="3"
              >
                <title>
                  {`${punto.etiqueta}: ${formatoNumero(
                    punto.valor
                  )}`}
                </title>
              </circle>

              {/* valor */}

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
                fill="#5f5149"
              >
                {formatoNumero(
                  punto.valor
                )}
              </text>

              {/* etiqueta */}

              <text
                x={
                  punto.x
                }
                y={
                  margenSuperior +
                  areaAlto +
                  25
                }
                textAnchor="middle"
                fontSize="10"
                fill="#756861"
              >
                {cortarTexto(
                  punto.etiqueta,
                  11
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
   PANEL COMPLETO DE GRAFICOS
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


  /* ========================================================
     CORREGIR SELECCIONES AL CAMBIAR DATASET
     ======================================================== */

  useEffect(
    () => {
      if (
        !deteccion.numericas.includes(
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
        !deteccion.dimensiones.includes(
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
     SERIE
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
     RESUMEN NUMERICO
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
                  fila[
                    metrica
                  ]
                )
            )
            .filter(
              (valor) =>
                valor !== null
            )

        if (
          valores.length ===
          0
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
     SIN DATOS NUMERICOS
     ======================================================== */

  if (
    deteccion.numericas.length ===
    0
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
          Este archivo no contiene suficientes valores numéricos para generar gráficos automáticamente.
        </span>
      </div>
    )
  }


  /* ========================================================
     RENDER
     ======================================================== */

  return (
    <div
      style={{
        marginTop: "18px"
      }}
    >
      {/* ====================================================
          INFORMACION SOBRE LA MUESTRA
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
            )} filas. Para mantener una visualización rápida, los gráficos utilizan las primeras ${miles(
              filas.length
            )} filas.`
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
        {/* METRICA */}

        <div className="field">
          <label>
            Métrica
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


        {/* AGRUPACION */}

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
            {deteccion.dimensiones.length ===
              0 && (
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
          METRICAS
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
          GRAFICO DE BARRAS
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
              "4px 0 18px"
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
          GRAFICO DE PUNTOS
          ==================================================== */}

      <div
        className="card"
        style={{
          marginTop: "16px",
          boxShadow: "none"
        }}
      >
        <div className="chart-title">
          Gráfico de puntos
        </div>

        <p
          className="muted"
          style={{
            margin:
              "4px 0 12px"
          }}
        >
          {dimension ===
          "__fila__"
            ? `Distribución de ${metrica} por registro.`
            : `Distribución visual de ${metrica} agrupada por ${dimension}.`}
        </p>

        <GraficoPuntos
          datos={
            serie
          }
        />
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
        ? respuesta.permisos.cursos
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

  /*
   * Compatibilidad si los módulos
   * llegan separados.
   */
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
        ? respuesta.permisos.modulos
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
   ARCHIVOS / DATASETS
   ========================================================== */

const Archivos = () => {
  /* ========================================================
     LISTADO
     ======================================================== */

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
    useState("todos")

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
    useState("datos")


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
     CARGAR DATASETS
     ======================================================== */

  useEffect(
    () => {
      let activo = true

      const cargar =
        async () => {
          setCargando(true)
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
     PERMISO DE GRAFICOS
     ======================================================== */

  useEffect(
    () => {
      /*
       * Admin siempre puede
       * visualizar gráficos.
       */
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

      let activo = true

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
              /*
               * Si no podemos comprobar
               * el permiso, ocultamos
               * la funcionalidad.
               */
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

      setDetalle(
        null
      )

      setVistaModal(
        "datos"
      )

      setErrorDetalle(
        ""
      )

      setCargandoDetalle(
        true
      )

      /*
       * La tabla mostrará 100,
       * pero podemos cargar hasta 5000
       * para los gráficos.
       */
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
     FILTROS
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
     FILAS DE TABLA
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

        return detalle.filas.slice(
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
          METRICAS GENERALES
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
          BUSCADOR
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


        {/* ==================================================
            FILTROS
            ================================================== */}

        <div className="tabs">
          {[
            {
              valor:
                "todos",
              label:
                "Todos"
            },
            {
              valor:
                "propias",
              label:
                "De la empresa"
            },
            {
              valor:
                "otras",
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


      {/* ====================================================
          VACIO
          ==================================================== */}

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
          TARJETAS
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
              {/* ============================================
                  CABECERA CARD
                  ============================================ */}

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


              {/* ============================================
                  EMPRESA / ARCHIVO
                  ============================================ */}

              <h3>
                {item.empresa}
              </h3>

              <p className="archivo-nombre">
                {item.archivo}
              </p>


              {/* ============================================
                  CIFRAS
                  ============================================ */}

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


              {/* ============================================
                  COLUMNAS
                  ============================================ */}

              <div className="archivo-columnas">
                {Array.isArray(
                  item.columnas
                ) &&
                  item.columnas
                    .slice(0, 4)
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
                    +{item.columnas.length -
                      4}
                  </span>
                )}
              </div>


              {/* ============================================
                  PIE
                  ============================================ */}

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
          MODAL DATASET
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
          {/* ================================================
              CARGANDO
              ================================================ */}

          {cargandoDetalle && (
            <div className="loading">
              Cargando contenido
            </div>
          )}


          {/* ================================================
              ERROR
              ================================================ */}

          {errorDetalle && (
            <div className="alert alert-error">
              {errorDetalle}
            </div>
          )}


          {/* ================================================
              DETALLE
              ================================================ */}

          {detalle && (
            <>
              {/* ============================================
                  METRICAS DATASET
                  ============================================ */}

              <div className="metrics metrics-4">
                <div className="metric">
                  <span>
                    Filas
                  </span>

                  <strong>
                    {miles(
                      detalle.importacion.total_filas
                    )}
                  </strong>
                </div>

                <div className="metric">
                  <span>
                    Columnas
                  </span>

                  <strong>
                    {Array.isArray(
                      detalle.importacion.columnas
                    )
                      ? detalle.importacion.columnas.length
                      : 0}
                  </strong>
                </div>

                <div className="metric">
                  <span>
                    Origen
                  </span>

                  <strong>
                    {detalle.importacion.es_propia
                      ? "Propia"
                      : "Competencia"}
                  </strong>
                </div>

                <div className="metric">
                  <span>
                    Cargado por
                  </span>

                  <strong className="ellipsis">
                    {detalle.importacion.autor}
                  </strong>
                </div>
              </div>


              {/* ============================================
                  TABS
                  ============================================ */}

              <div
                className="tabs"
                style={{
                  marginTop: "20px",
                  marginBottom: "18px",
                  borderBottom:
                    "1px solid #eadfd7",
                  paddingBottom: "8px"
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
                  TAB DATOS
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

                          {detalle.importacion.columnas.map(
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

                              {detalle.importacion.columnas.map(
                                (columna) => (
                                  <td
                                    key={
                                      columna
                                    }
                                  >
                                    {fila[columna] ===
                                      undefined ||
                                    fila[columna] ===
                                      null ||
                                    fila[columna] ===
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
                  TAB GRAFICOS
                  ============================================ */}

              {vistaModal ===
                "graficos" &&
                puedeVerGraficos && (
                <PanelGraficos
                  key={
                    detalle.importacion.id
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