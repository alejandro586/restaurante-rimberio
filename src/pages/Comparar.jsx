import {
  useEffect,
  useState
} from "react"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

import api, {
  esAdmin,
  getMessage,
  getUserName,
  getInitials,
  soles,
  miles
} from "../api"

import Modal from "../components/Modal"


/* ==========================================================
   COLORES
   ========================================================== */

const SERIE_PROPIA = "#c1541f"
const SERIE_OTRA = "#1a6fb0"

const EJE = "#8d7663"
const GRID = "#efe4d8"


/* ==========================================================
   CONFIGURACION DE CADA MODULO
   ========================================================== */

const MODOS = {
  completo: {
    titulo: "Comparar restaurantes",
    descripcion:
      "Elige uno o dos datasets para analizarlos, graficarlos y comparar sus resultados.",
    minimo: 1,
    maximo: 2,
    indicadores: true,
    graficos: true,
    insights: true,
    productos: true
  },

  analisis: {
    titulo: "Análisis",
    descripcion:
      "Selecciona un dataset para revisar sus indicadores, productos y observaciones principales.",
    minimo: 1,
    maximo: 1,
    indicadores: true,
    graficos: false,
    insights: true,
    productos: true
  },

  comparacion: {
    titulo: "Comparación",
    descripcion:
      "Selecciona exactamente dos datasets para comparar sus resultados y detectar diferencias.",
    minimo: 2,
    maximo: 2,
    indicadores: true,
    graficos: false,
    insights: true,
    productos: true
  },

  graficos: {
    titulo: "Gráficos",
    descripcion:
      "Selecciona un dataset para visualizar sus ingresos por categoría y su evolución.",
    minimo: 1,
    maximo: 1,
    indicadores: false,
    graficos: true,
    insights: false,
    productos: false
  }
}


/* ==========================================================
   FORMATO CORTO PARA LOS EJES
   ========================================================== */

const corto = (valor) => {
  const n =
    Number(valor) || 0

  if (
    Math.abs(n) >=
    1000000
  ) {
    return `${(
      n / 1000000
    ).toFixed(1)}M`
  }

  if (
    Math.abs(n) >=
    1000
  ) {
    return `${Math.round(
      n / 1000
    )}k`
  }

  return String(
    Math.round(n)
  )
}


/* ==========================================================
   TOOLTIP DE LOS GRAFICOS
   ========================================================== */

const Tip = ({
  active,
  payload,
  label
}) => {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null
  }

  return (
    <div className="tooltip">

      <strong>
        {label}
      </strong>

      {payload.map(
        (serie) => (
          <div
            key={serie.name}
            className="tooltip-fila"
          >
            <span
              className="tooltip-punto"
              style={{
                background:
                  serie.color
              }}
            />

            <span>
              {serie.name}
            </span>

            <b>
              {soles(
                serie.value
              )}
            </b>
          </div>
        )
      )}

    </div>
  )
}


/* ==========================================================
   COMPONENTE
   ========================================================== */

const Comparar = ({
  modo = "completo"
}) => {

  const modoActual =
    MODOS[modo]
      ? modo
      : "completo"

  const configuracion =
    MODOS[modoActual]

  const administrador =
    esAdmin()


  /* ========================================================
     DATASETS
     ======================================================== */

  const [
    lista,
    setLista
  ] = useState([])

  const [
    elegidos,
    setElegidos
  ] = useState([])

  const [
    resultado,
    setResultado
  ] = useState(null)

  const [
    cargando,
    setCargando
  ] = useState(true)

  const [
    analizando,
    setAnalizando
  ] = useState(false)

  const [
    error,
    setError
  ] = useState("")


  /* ========================================================
     TAREAS DEL ADMINISTRADOR
     ======================================================== */

  const [
    trabajadores,
    setTrabajadores
  ] = useState([])

  const [
    asignando,
    setAsignando
  ] = useState(null)

  const [
    guardando,
    setGuardando
  ] = useState(false)

  const [
    asignadas,
    setAsignadas
  ] = useState({})


  /* ========================================================
     CARGAR DATASETS
     ======================================================== */

  useEffect(() => {
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

          const datos =
            Array.isArray(
              respuesta.data
            )
              ? respuesta.data
              : respuesta.data
                  ?.imports || []

          setLista(
            datos
          )

        } catch (problema) {

          if (activo) {
            setError(
              getMessage(
                problema
              )
            )
          }

        } finally {

          if (activo) {
            setCargando(false)
          }

        }
      }

    cargar()

    return () => {
      activo = false
    }

  }, [])


  /* ========================================================
     CARGAR TRABAJADORES
     SOLO PARA EL ADMINISTRADOR
     ======================================================== */

  useEffect(() => {

    if (!administrador) {
      return
    }

    let activo = true

    const cargar =
      async () => {

        try {
          const respuesta =
            await api.get(
              "/tareas/trabajadores"
            )

          if (!activo) {
            return
          }

          setTrabajadores(
            Array.isArray(
              respuesta.data
            )
              ? respuesta.data
              : []
          )

        } catch {
          /*
           * No bloqueamos Comparar si falla
           * solamente la lista de trabajadores.
           */
        }
      }

    cargar()

    return () => {
      activo = false
    }

  }, [
    administrador
  ])


  /* ========================================================
     CAMBIAR ENTRE ANALISIS / COMPARACION / GRAFICOS
     ======================================================== */

  useEffect(() => {
    setElegidos([])
    setResultado(null)
    setError("")
  }, [
    modoActual
  ])


  /* ========================================================
     COLORES DE LAS EMPRESAS
     ======================================================== */

  const colorDe = (
    indice
  ) =>
    indice === 0
      ? SERIE_PROPIA
      : SERIE_OTRA


  /* ========================================================
     SELECCIONAR DATASET
     ======================================================== */

  const alternar = (
    id
  ) => {

    setResultado(null)
    setError("")

    setElegidos(
      (actuales) => {

        /*
         * Si ya estaba seleccionado,
         * lo quitamos.
         */
        if (
          actuales.includes(
            id
          )
        ) {
          return actuales.filter(
            (item) =>
              item !== id
          )
        }


        /*
         * Analisis y Graficos
         * solamente permiten un dataset.
         */
        if (
          configuracion.maximo ===
          1
        ) {
          return [id]
        }


        /*
         * Comparacion permite dos.
         *
         * Si ya hay dos y seleccionamos
         * un tercero, sustituimos el primero.
         */
        if (
          actuales.length >=
          configuracion.maximo
        ) {
          return [
            ...actuales.slice(1),
            id
          ]
        }


        return [
          ...actuales,
          id
        ]
      }
    )
  }


  /* ========================================================
     VALIDAR SELECCION
     ======================================================== */

  const seleccionValida =
    elegidos.length >=
      configuracion.minimo &&
    elegidos.length <=
      configuracion.maximo


  /* ========================================================
     TEXTO DEL BOTON
     ======================================================== */

  const textoBoton = () => {

    if (analizando) {

      if (
        modoActual ===
        "graficos"
      ) {
        return "Generando gráficos..."
      }

      if (
        modoActual ===
        "comparacion"
      ) {
        return "Comparando..."
      }

      return "Analizando..."
    }


    if (
      modoActual ===
      "analisis"
    ) {
      return "Analizar dataset"
    }


    if (
      modoActual ===
      "comparacion"
    ) {
      return "Comparar datasets"
    }


    if (
      modoActual ===
      "graficos"
    ) {
      return "Generar gráficos"
    }


    if (
      elegidos.length ===
      2
    ) {
      return "Comparar los dos archivos"
    }


    return "Analizar archivo"
  }


  /* ========================================================
     PROCESAR
     ======================================================== */

  const analizar =
    async () => {

      if (!seleccionValida) {

        if (
          modoActual ===
          "comparacion"
        ) {
          setError(
            "Selecciona exactamente dos datasets para realizar la comparación"
          )
        } else {
          setError(
            "Selecciona un dataset para continuar"
          )
        }

        return
      }


      setAnalizando(true)
      setError("")


      try {

        /* ====================================================
          ELEGIR ENDPOINT SEGUN EL MODULO
          ==================================================== */

        let endpoint =
          "/comparar"


        if (
          modoActual ===
          "analisis"
        ) {
          endpoint =
            "/comparar/analisis"
        }


        if (
          modoActual ===
          "comparacion"
        ) {
          endpoint =
            "/comparar/comparacion"
        }


        if (
          modoActual ===
          "graficos"
        ) {
          endpoint =
            "/comparar/graficos"
        }


        /* ====================================================
          EJECUTAR
          ==================================================== */

        const {
          data
        } =
          await api.post(
            endpoint,
            {
              ids:
                elegidos
            }
          )


        setResultado(
          data
        )

      } catch (problema) {

        setError(
          getMessage(
            problema
          )
        )

      } finally {

        setAnalizando(false)
      }
    }

  /* ========================================================
     RESULTADOS
     ======================================================== */

  const empresas =
    Array.isArray(
      resultado?.empresas
    )
      ? resultado.empresas
      : []


  const [
    primera,
    segunda
  ] = empresas


  const categorias =
    Array.isArray(
      resultado
        ?.series
        ?.categorias
    )
      ? resultado
          .series
          .categorias
      : []


  const periodos =
    Array.isArray(
      resultado
        ?.series
        ?.periodos
    )
      ? resultado
          .series
          .periodos
      : []


  const insights =
    Array.isArray(
      resultado?.insights
    )
      ? resultado.insights
      : []


  /* ========================================================
     ASIGNAR TAREA
     SOLO ADMIN
     ======================================================== */

  const asignar =
    async () => {

      if (
        !administrador ||
        !asignando
      ) {
        return
      }


      if (
        !asignando.trabajador
      ) {
        return setAsignando({
          ...asignando,

          error:
            "Elige a que trabajador se le asigna"
        })
      }


      setGuardando(true)


      try {

        const {
          insight
        } =
          asignando


        await api.post(
          "/tareas",
          {
            titulo:
              insight.titulo,

            mensaje:
              insight.mensaje,

            nivel:
              insight.nivel,

            accion:
              insight.accion ||
              null,

            origen:
              segunda
                ? segunda.empresa
                : primera
                    ?.empresa,

            asignadaA:
              asignando
                .trabajador
          }
        )


        const nombre =
          trabajadores.find(
            (trabajador) =>
              trabajador.id ===
              asignando.trabajador
          )?.nombre ||
          "el trabajador"


        setAsignadas(
          (actuales) => ({
            ...actuales,

            [insight.titulo]:
              nombre
          })
        )


        setAsignando(
          null
        )

      } catch (problema) {

        setAsignando({
          ...asignando,

          error:
            getMessage(
              problema
            )
        })

      } finally {

        setGuardando(false)
      }
    }


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
            {
              configuracion
                .titulo
            }
          </h1>

          <p>
            {
              configuracion
                .descripcion
            }
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
          ERROR
          ==================================================== */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}


      {/* ====================================================
          SELECTOR DE DATASETS
          ==================================================== */}

      <div className="card">

        <div className="chart-title">

          Datasets disponibles

          <span className="muted">

            {" — seleccionados "}

            {elegidos.length}

            {" de "}

            {
              configuracion
                .maximo
            }

          </span>

        </div>


        {modoActual ===
          "comparacion" && (
          <p
            className="muted"
            style={{
              marginTop: 6,
              marginBottom: 15
            }}
          >
            Debes seleccionar
            exactamente dos datasets.
          </p>
        )}


        {cargando && (
          <div className="loading">
            Cargando
          </div>
        )}


        {!cargando &&
          lista.length ===
            0 && (
            <div className="empty">
              No hay datasets
              importados todavía
            </div>
          )}


        <div className="seleccion">

          {lista.map(
            (item) => {

              const activo =
                elegidos.includes(
                  item.id
                )

              const orden =
                elegidos.indexOf(
                  item.id
                )


              return (
                <button
                  type="button"
                  key={item.id}
                  className={
                    `seleccion-item ${
                      activo
                        ? "activo"
                        : ""
                    }`
                  }
                  style={
                    activo
                      ? {
                          borderColor:
                            colorDe(
                              orden
                            ),

                          boxShadow:
                            `inset 0 0 0 1px ${colorDe(
                              orden
                            )}`
                        }
                      : undefined
                  }
                  onClick={
                    () =>
                      alternar(
                        item.id
                      )
                  }
                >

                  {activo && (
                    <span
                      className="seleccion-orden"
                      style={{
                        background:
                          colorDe(
                            orden
                          )
                      }}
                    >
                      {orden + 1}
                    </span>
                  )}


                  <div>

                    <strong>
                      {item.empresa}
                    </strong>

                    <span className="muted">
                      {item.archivo}
                    </span>

                  </div>


                  <div className="seleccion-meta">

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


                    <span className="muted">

                      {miles(
                        item.total_filas
                      )}

                      {" filas"}

                    </span>

                  </div>

                </button>
              )
            }
          )}

        </div>


        <button
          type="button"
          className="btn"
          onClick={
            analizar
          }
          disabled={
            !seleccionValida ||
            analizando
          }
          style={{
            marginTop:
              "18px"
          }}
        >
          {textoBoton()}
        </button>

      </div>


      {/* ====================================================
          RESULTADOS
          ==================================================== */}

      {resultado &&
        primera && (
        <>

          {resultado.advertencia && (
            <div className="alert alert-info">
              {
                resultado
                  .advertencia
              }
            </div>
          )}


          {/* ==================================================
              INDICADORES

              Analisis
              Comparacion
              Admin completo
              ================================================== */}

          {configuracion.indicadores && (
            <div className="comparativa">

              {[
                {
                  clave:
                    "ingresos",

                  label:
                    "Ingresos",

                  formato:
                    soles
                },

                {
                  clave:
                    "unidades",

                  label:
                    "Unidades vendidas",

                  formato:
                    miles
                },

                {
                  clave:
                    "ticketPromedio",

                  label:
                    "Ticket promedio",

                  formato:
                    soles
                },

                {
                  clave:
                    "productos",

                  label:
                    "Productos distintos",

                  formato:
                    miles
                }
              ].map(
                (fila) => {

                  const valorA =
                    Number(
                      primera[
                        fila.clave
                      ] || 0
                    )

                  const valorB =
                    segunda
                      ? Number(
                          segunda[
                            fila.clave
                          ] || 0
                        )
                      : 0

                  const maximo =
                    Math.max(
                      valorA,
                      valorB
                    ) || 1


                  return (
                    <div
                      className="comparativa-fila"
                      key={
                        fila.clave
                      }
                    >

                      <span className="comparativa-label">
                        {
                          fila.label
                        }
                      </span>


                      <div className="comparativa-barras">

                        {empresas.map(
                          (
                            empresa,
                            indice
                          ) => {

                            const valor =
                              Number(
                                empresa[
                                  fila.clave
                                ] || 0
                              )


                            return (
                              <div
                                className="comparativa-barra"
                                key={
                                  empresa.id
                                }
                              >

                                <div className="comparativa-nombre">

                                  <span
                                    className="punto"
                                    style={{
                                      background:
                                        colorDe(
                                          indice
                                        )
                                    }}
                                  />

                                  {
                                    empresa
                                      .empresa
                                  }

                                </div>


                                <div className="comparativa-pista">

                                  <div
                                    className="comparativa-relleno"
                                    style={{
                                      width:
                                        `${Math.max(
                                          (
                                            valor /
                                            maximo
                                          ) *
                                            100,
                                          2
                                        )}%`,

                                      background:
                                        colorDe(
                                          indice
                                        )
                                    }}
                                  />

                                </div>


                                <strong>
                                  {
                                    fila.formato(
                                      valor
                                    )
                                  }
                                </strong>

                              </div>
                            )
                          }
                        )}

                      </div>

                    </div>
                  )
                }
              )}

            </div>
          )}


          {/* ==================================================
              GRAFICOS

              Graficos
              Admin completo
              ================================================== */}

          {configuracion.graficos && (
            <div className="grid-2">

              {/* ==============================================
                  CATEGORIAS
                  ============================================== */}

              <div className="card">

                <div className="chart-title">
                  Ingresos por categoría
                </div>


                {categorias.length ===
                0 ? (

                  <div className="empty">
                    El dataset no trae
                    una columna de categoría
                  </div>

                ) : (

                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >

                    <BarChart
                      data={
                        categorias
                      }
                      barGap={2}
                    >

                      <CartesianGrid
                        stroke={GRID}
                        vertical={
                          false
                        }
                      />

                      <XAxis
                        dataKey="nombre"
                        tick={{
                          fontSize: 11,
                          fill: EJE
                        }}
                        axisLine={{
                          stroke:
                            GRID
                        }}
                        tickLine={
                          false
                        }
                      />

                      <YAxis
                        tickFormatter={
                          corto
                        }
                        tick={{
                          fontSize: 11,
                          fill: EJE
                        }}
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                      />

                      <Tooltip
                        content={
                          <Tip />
                        }
                        cursor={{
                          fill:
                            "rgba(38,23,15,0.04)"
                        }}
                      />

                      {empresas.length >
                        1 && (
                        <Legend
                          iconType="circle"
                          iconSize={8}
                        />
                      )}

                      {empresas.map(
                        (
                          empresa,
                          indice
                        ) => (
                          <Bar
                            key={
                              empresa.id
                            }
                            dataKey={
                              empresa
                                .empresa
                            }
                            fill={
                              colorDe(
                                indice
                              )
                            }
                            radius={[
                              4,
                              4,
                              0,
                              0
                            ]}
                            maxBarSize={
                              38
                            }
                          />
                        )
                      )}

                    </BarChart>

                  </ResponsiveContainer>
                )}

              </div>


              {/* ==============================================
                  EVOLUCION
                  ============================================== */}

              <div className="card">

                <div className="chart-title">
                  Evolución de ingresos
                </div>


                {periodos.length ===
                0 ? (

                  <div className="empty">
                    El dataset no trae
                    una columna de fecha
                    o mes
                  </div>

                ) : (

                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >

                    <LineChart
                      data={
                        periodos
                      }
                    >

                      <CartesianGrid
                        stroke={GRID}
                        vertical={
                          false
                        }
                      />

                      <XAxis
                        dataKey="nombre"
                        tick={{
                          fontSize: 11,
                          fill: EJE
                        }}
                        axisLine={{
                          stroke:
                            GRID
                        }}
                        tickLine={
                          false
                        }
                      />

                      <YAxis
                        tickFormatter={
                          corto
                        }
                        tick={{
                          fontSize: 11,
                          fill: EJE
                        }}
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                      />

                      <Tooltip
                        content={
                          <Tip />
                        }
                      />

                      {empresas.length >
                        1 && (
                        <Legend
                          iconType="circle"
                          iconSize={8}
                        />
                      )}

                      {empresas.map(
                        (
                          empresa,
                          indice
                        ) => (
                          <Line
                            key={
                              empresa.id
                            }
                            type="monotone"
                            dataKey={
                              empresa
                                .empresa
                            }
                            stroke={
                              colorDe(
                                indice
                              )
                            }
                            strokeWidth={
                              2
                            }
                            dot={{
                              r: 4,
                              strokeWidth:
                                2,
                              fill:
                                "#fff"
                            }}
                            activeDot={{
                              r: 6
                            }}
                          />
                        )
                      )}

                    </LineChart>

                  </ResponsiveContainer>
                )}

              </div>

            </div>
          )}


          {/* ==================================================
              ANALISIS / INSIGHTS
              ================================================== */}

          {configuracion.insights && (
            <div className="card">

              <div className="chart-title">

                {segunda
                  ? "Diferencias detectadas"
                  : "Análisis del dataset"}

              </div>


              {insights.length ===
              0 ? (

                <div className="empty">
                  No se detectaron
                  observaciones relevantes.
                </div>

              ) : (

                insights.map(
                  (insight) => {

                    const asignada =
                      asignadas[
                        insight
                          .titulo
                      ]


                    return (
                      <div
                        className="insight"
                        key={
                          insight.titulo
                        }
                      >

                        <div
                          className={
                            `insight-bar ${
                              insight.nivel
                            }`
                          }
                        />


                        <div>

                          <h4>
                            {
                              insight
                                .titulo
                            }
                          </h4>

                          <p>
                            {
                              insight
                                .mensaje
                            }
                          </p>


                          {insight.accion && (
                            <div className="insight-accion">

                              Acción sugerida:
                              agregar la columna{" "}

                              <code>
                                {
                                  insight
                                    .accion
                                    .columna
                                }
                              </code>

                              {" ("}

                              {
                                insight
                                  .accion
                                  .tipoDato
                              }

                              {") a la tabla de la empresa."}

                            </div>
                          )}


                          {/* ================================
                              SOLO ADMINISTRADOR
                              ================================ */}

                          {administrador &&
                            insight.accion && (
                            <div className="insight-pie">

                              {asignada ? (

                                <span className="asignada-ok">

                                  Asignada a{" "}
                                  {
                                    asignada
                                  }

                                </span>

                              ) : (

                                <button
                                  type="button"
                                  className="btn btn-light btn-sm"
                                  onClick={
                                    () =>
                                      setAsignando({
                                        insight,

                                        trabajador:
                                          "",

                                        error:
                                          ""
                                      })
                                  }
                                >
                                  Asignar tarea al trabajador
                                </button>

                              )}

                            </div>
                          )}

                        </div>

                      </div>
                    )
                  }
                )

              )}

            </div>
          )}


          {/* ==================================================
              PRODUCTOS
              ================================================== */}

          {configuracion.productos && (
            <div
              className={
                empresas.length >
                1
                  ? "grid-2"
                  : ""
              }
            >

              {empresas.map(
                (
                  empresa,
                  indice
                ) => {

                  const productos =
                    Array.isArray(
                      empresa
                        .topProductos
                    )
                      ? empresa
                          .topProductos
                      : []


                  const capacidades =
                    Array.isArray(
                      empresa
                        .capacidades
                    )
                      ? empresa
                          .capacidades
                      : []


                  return (
                    <div
                      className="card"
                      key={
                        empresa.id
                      }
                    >

                      <div className="chart-title">

                        <span
                          className="punto"
                          style={{
                            background:
                              colorDe(
                                indice
                              )
                          }}
                        />

                        {" "}

                        {
                          empresa
                            .empresa
                        }

                        <span className="muted">
                          {" — productos con más ingreso"}
                        </span>

                      </div>


                      <div className="table-wrap">

                        <table>

                          <thead>
                            <tr>

                              <th>
                                Producto
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "right"
                                }}
                              >
                                Unidades
                              </th>

                              <th
                                style={{
                                  textAlign:
                                    "right"
                                }}
                              >
                                Ingresos
                              </th>

                            </tr>
                          </thead>


                          <tbody>

                            {productos
                              .slice(
                                0,
                                8
                              )
                              .map(
                                (
                                  producto
                                ) => (
                                  <tr
                                    key={
                                      producto
                                        .nombre
                                    }
                                  >

                                    <td className="cell-main">
                                      {
                                        producto
                                          .nombre
                                      }
                                    </td>

                                    <td
                                      style={{
                                        textAlign:
                                          "right"
                                      }}
                                    >
                                      {miles(
                                        producto
                                          .unidades
                                      )}
                                    </td>

                                    <td
                                      style={{
                                        textAlign:
                                          "right"
                                      }}
                                    >
                                      {soles(
                                        producto
                                          .ingresos
                                      )}
                                    </td>

                                  </tr>
                                )
                              )}

                          </tbody>

                        </table>

                      </div>


                      {capacidades.length >
                        0 && (
                        <div className="capacidades">

                          <span className="muted">
                            Registra además:
                          </span>

                          {capacidades.map(
                            (
                              capacidad
                            ) => (
                              <span
                                className="chip chip-capacidad"
                                key={
                                  capacidad
                                    .clave
                                }
                              >
                                {
                                  capacidad
                                    .etiqueta
                                }
                              </span>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  )
                }
              )}

            </div>
          )}

        </>
      )}


      {/* ====================================================
          MODAL DE TAREA
          SOLO ADMINISTRADOR
          ==================================================== */}

      {administrador &&
        asignando && (
        <Modal
          title="Asignar tarea al trabajador"
          onClose={
            () =>
              setAsignando(
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
                    asignar
                  }
                  disabled={
                    guardando
                  }
                >
                  {guardando
                    ? "Asignando..."
                    : "Asignar tarea"}
                </button>

              </>
            )
          }
        >

          <div className="tarea-previa">

            <div
              className={
                `insight-bar ${
                  asignando
                    .insight
                    .nivel
                }`
              }
            />

            <div>

              <h4>
                {
                  asignando
                    .insight
                    .titulo
                }
              </h4>

              <p>
                {
                  asignando
                    .insight
                    .mensaje
                }
              </p>

            </div>

          </div>


          <div
            className="insight-accion"
            style={{
              marginBottom:
                "18px"
            }}
          >

            La tarea le indicará
            que cree la columna{" "}

            <code>
              {
                asignando
                  .insight
                  .accion
                  .columna
              }
            </code>

            {" de tipo "}

            <strong>
              {
                asignando
                  .insight
                  .accion
                  .tipoDato
              }
            </strong>

            {" en la tabla de la empresa."}

          </div>


          <div className="field">

            <label>
              Trabajador que la recibe
            </label>

            <select
              value={
                asignando.trabajador
              }
              onChange={
                (event) =>
                  setAsignando({
                    ...asignando,

                    trabajador:
                      event.target
                        .value
                  })
              }
              autoFocus
            >

              <option value="">
                Elegir trabajador...
              </option>
              {trabajadores.map(
                (
                  trabajador
                ) => (
                  <option
                    key={
                      trabajador.id
                    }
                    value={
                      trabajador.id
                    }
                  >
                    {
                      trabajador.nombre
                    }
                    {" ("}
                    {
                      trabajador.email
                    }
                    {")"}
                  </option>
                )
              )}
            </select>
          </div>
          {trabajadores.length ===
            0 && (
            <div className="alert alert-error">
              No hay trabajadores registrados
            </div>
          )}
          {asignando.error && (
            <div className="alert alert-error">
              {
                asignando.error
              }
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

export default Comparar