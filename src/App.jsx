import {
  useEffect,
  useState
} from "react"

import {
  Navigate,
  Route,
  Routes
} from "react-router-dom"

import {
  esAdmin,
  esTrabajador,
  isLogged,
  obtenerMisPermisos
} from "./api"

import Layout
  from "./components/Layout"

import Login
  from "./pages/Login"

import Register
  from "./pages/Register"

import RecuperarPassword
  from "./pages/RecuperarPassword"

import RestablecerPassword
  from "./pages/RestablecerPassword"

import Importar
  from "./pages/Importar"

import DatosEmpresa
  from "./pages/DatosEmpresa"

import Archivos
  from "./pages/Archivos"

import Comparar
  from "./pages/Comparar"

import AdminUsuarios
  from "./pages/AdminUsuarios"


/* ==========================================================
   RUTAS PRINCIPALES DE BIG DATA
   ========================================================== */

/*
 * IMPORTANTE:
 *
 * big_data.graficos SIGUE EXISTIENDO
 * como permiso administrativo.
 *
 * Pero ya NO tiene una página propia.
 *
 * Ahora controla la pestaña:
 *
 * Datasets
 *    ├── Datos
 *    └── Gráficos
 *
 *
 * Documentación tampoco tiene
 * una ruta principal propia.
 *
 * Ahora está integrada en:
 *
 * Cargar archivos
 *    ├── Datos CSV / Excel
 *    └── Documentación
 */

const RUTA_POR_PERMISO = {

  "big_data.importar":
    "/big-data/importar",

  "big_data.datasets":
    "/big-data/datasets",

  "big_data.analisis":
    "/big-data/analisis",

  "big_data.comparar":
    "/big-data/comparar",

  "big_data.estructura":
    "/big-data/estructura"

}


/* ==========================================================
   ORDEN PARA PAGINA INICIAL
   ========================================================== */

/*
 * Solo aparecen aquí los módulos
 * que tienen página propia.
 *
 * big_data.graficos queda fuera porque
 * es una funcionalidad interna
 * del módulo Datasets.
 */

const ORDEN_PERMISOS = [

  "big_data.importar",

  "big_data.datasets",

  "big_data.analisis",

  "big_data.comparar",

  "big_data.estructura"

]


/* ==========================================================
   OBTENER CURSOS DE LA RESPUESTA
   ========================================================== */

const obtenerCursosRespuesta =
  (
    respuesta
  ) => {

    if (
      Array.isArray(
        respuesta?.cursos
      )
    ) {

      return respuesta.cursos
    }


    if (
      Array.isArray(
        respuesta?.permisos?.cursos
      )
    ) {

      return respuesta.permisos.cursos
    }


    return []
  }


/* ==========================================================
   EXTRAER PERMISOS
   ========================================================== */

const obtenerClavesPermisos =
  (
    respuesta
  ) => {

    const claves =
      new Set()


    const cursos =
      obtenerCursosRespuesta(
        respuesta
      )


    /* ========================================================
       MODULOS DENTRO DE CURSOS
       ======================================================== */

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

        /*
         * Si backend indica que el módulo
         * está desactivado, no cuenta.
         */
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


    /* ========================================================
       COMPATIBILIDAD:
       MODULOS FUERA DE CURSOS
       ======================================================== */

    const modulosSeparados =
      Array.isArray(
        respuesta?.modulos
      )
        ? respuesta.modulos
        : Array.isArray(
            respuesta?.permisos?.modulos
          )
          ? respuesta.permisos.modulos
          : []


    for (
      const modulo
      of modulosSeparados
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
   RUTA PRIVADA
   ========================================================== */

const Privada =
  ({
    rol,
    permiso,
    children
  }) => {

    const conectado =
      isLogged()


    const administrador =
      esAdmin()


    const trabajador =
      esTrabajador()


    const [
      permisos,
      setPermisos
    ] =
      useState(
        null
      )


    const [
      errorPermisos,
      setErrorPermisos
    ] =
      useState(
        false
      )


    /* ========================================================
       CARGAR PERMISOS
       ======================================================== */

    useEffect(
      () => {

        /*
         * SIN LOGIN
         */
        if (
          !conectado
        ) {

          setPermisos(
            new Set()
          )


          return
        }


        /*
         * ADMIN
         *
         * No necesita consultar permisos
         * individuales.
         */
        if (
          administrador
        ) {

          setPermisos(
            new Set()
          )


          setErrorPermisos(
            false
          )


          return
        }


        /*
         * RUTA QUE NO REQUIERE
         * UN PERMISO DE MODULO.
         */
        if (
          !permiso
        ) {

          setPermisos(
            new Set()
          )


          setErrorPermisos(
            false
          )


          return
        }


        let activo =
          true


        const cargar =
          async () => {

            setErrorPermisos(
              false
            )


            try {

              const respuesta =
                await obtenerMisPermisos()


              if (
                !activo
              ) {

                return
              }


              const claves =
                obtenerClavesPermisos(
                  respuesta
                )


              setPermisos(
                claves
              )

            } catch (
              error
            ) {

              if (
                !activo
              ) {

                return
              }


              /*
               * Seguridad por defecto:
               *
               * si no podemos comprobar
               * el permiso, no damos acceso.
               */
              setPermisos(
                new Set()
              )


              setErrorPermisos(
                true
              )
            }
          }


        cargar()


        return () => {

          activo =
            false
        }

      },
      [
        conectado,
        administrador,
        permiso
      ]
    )


    /* ========================================================
       NO CONECTADO
       ======================================================== */

    if (
      !conectado
    ) {

      return (

        <Navigate
          to="/login"
          replace
        />

      )
    }


    /* ========================================================
       SOLO ADMIN
       ======================================================== */

    if (
      rol ===
        "admin" &&
      !administrador
    ) {

      return (

        <Navigate
          to="/"
          replace
        />

      )
    }


    /* ========================================================
       USUARIO NORMAL
       ======================================================== */

    /*
     * Actualmente el backend conserva
     * el rol legacy "trabajador".
     *
     * El administrador también puede
     * entrar a Big Data, así que no
     * lo bloqueamos por esta condición.
     */

    if (
      rol ===
        "trabajador" &&
      !administrador &&
      !trabajador
    ) {

      return (

        <Navigate
          to="/"
          replace
        />

      )
    }


    /* ========================================================
       COMPROBAR PERMISO
       ======================================================== */

    if (
      permiso &&
      !administrador
    ) {

      /*
       * Todavía consultando.
       */
      if (
        permisos ===
        null
      ) {

        return (

          <Layout>

            <div className="loading">
              Comprobando permiso...
            </div>

          </Layout>

        )
      }


      /*
       * Error o permiso no asignado.
       */
      if (
        errorPermisos ||
        !permisos.has(
          permiso
        )
      ) {

        return (

          <Navigate
            to="/"
            replace
          />

        )
      }
    }


    /* ========================================================
       AUTORIZADO
       ======================================================== */

    return (

      <Layout>
        {children}
      </Layout>

    )
  }


/* ==========================================================
   RUTA PUBLICA
   ========================================================== */

const Publica =
  ({
    children
  }) => {

    /*
     * Si ya existe sesión,
     * no dejamos volver al Login,
     * Registro o recuperación.
     */

    if (
      isLogged()
    ) {

      return (

        <Navigate
          to="/"
          replace
        />

      )
    }


    return children
  }


/* ==========================================================
   INICIO INTELIGENTE
   ========================================================== */

const InicioPrivado =
  () => {

    const [
      cargando,
      setCargando
    ] =
      useState(
        true
      )


    const [
      ruta,
      setRuta
    ] =
      useState(
        ""
      )


    /* ========================================================
       CALCULAR PRIMER MODULO
       ======================================================== */

    useEffect(
      () => {

        /*
         * Sin sesión.
         */
        if (
          !isLogged()
        ) {

          setCargando(
            false
          )


          return
        }


        /*
         * ADMIN
         *
         * Datasets es una página adecuada
         * como inicio administrativo.
         */
        if (
          esAdmin()
        ) {

          setRuta(
            "/big-data/datasets"
          )


          setCargando(
            false
          )


          return
        }


        let activo =
          true


        const cargar =
          async () => {

            try {

              const respuesta =
                await obtenerMisPermisos()


              if (
                !activo
              ) {

                return
              }


              const claves =
                obtenerClavesPermisos(
                  respuesta
                )


              /*
               * Elegimos el primer módulo
               * principal permitido.
               */
              const primerPermiso =
                ORDEN_PERMISOS.find(
                  (
                    clave
                  ) =>
                    claves.has(
                      clave
                    )
                )


              if (
                primerPermiso
              ) {

                setRuta(
                  RUTA_POR_PERMISO[
                    primerPermiso
                  ]
                )

              } else {

                /*
                 * Por ejemplo:
                 *
                 * si un usuario tuviera
                 * solamente big_data.graficos,
                 * NO puede entrar a Datasets,
                 * porque también necesita
                 * big_data.datasets.
                 */
                setRuta(
                  ""
                )
              }

            } catch (
              error
            ) {

              if (
                activo
              ) {

                setRuta(
                  ""
                )
              }

            } finally {

              if (
                activo
              ) {

                setCargando(
                  false
                )
              }
            }
          }


        cargar()


        return () => {

          activo =
            false
        }

      },
      []
    )


    /* ========================================================
       NO LOGUEADO
       ======================================================== */

    if (
      !isLogged()
    ) {

      return (

        <Navigate
          to="/login"
          replace
        />

      )
    }


    /* ========================================================
       CARGANDO
       ======================================================== */

    if (
      cargando
    ) {

      return (

        <Layout>

          <div className="loading">
            Cargando tus módulos...
          </div>

        </Layout>

      )
    }


    /* ========================================================
       TIENE MODULO
       ======================================================== */

    if (
      ruta
    ) {

      return (

        <Navigate
          to={
            ruta
          }
          replace
        />

      )
    }


    /* ========================================================
       SIN MODULOS
       ======================================================== */

    return (

      <Layout>

        <div className="topbar">

          <div>

            <h1>
              RIMBERIO
            </h1>


            <p>
              Sistema ERP organizado por cursos.
            </p>

          </div>

        </div>


        <div className="card">

          <div className="empty">

            <strong
              style={{
                display:
                  "block",

                marginBottom:
                  "7px"
              }}
            >
              No tienes módulos habilitados
            </strong>


            <span>
              Un administrador debe asignarte acceso para comenzar.
            </span>

          </div>

        </div>

      </Layout>

    )
  }


/* ==========================================================
   APP
   ========================================================== */

const App =
  () => (

    <Routes>

      {/* ======================================================
          PUBLICAS
          ====================================================== */}

      <Route
        path="/login"
        element={
          <Publica>

            <Login />

          </Publica>
        }
      />


      <Route
        path="/registro"
        element={
          <Publica>

            <Register />

          </Publica>
        }
      />


      <Route
        path="/recuperar-password"
        element={
          <Publica>

            <RecuperarPassword />

          </Publica>
        }
      />


      <Route
        path="/restablecer-password"
        element={
          <Publica>

            <RestablecerPassword />

          </Publica>
        }
      />


      {/* ======================================================
          INICIO
          ====================================================== */}

      <Route
        path="/"
        element={
          <InicioPrivado />
        }
      />


      {/* ======================================================
          BIG DATA - CARGAR ARCHIVOS

          Incluye:

          DATOS:
          - CSV
          - XLS
          - XLSX

          DOCUMENTACION:
          - PDF
          - Word
          - Excel
          - PowerPoint

          Todo se controla mediante:
          big_data.importar
          ====================================================== */}

      <Route
        path="/big-data/importar"
        element={
          <Privada
            rol="trabajador"
            permiso="big_data.importar"
          >

            <Importar />

          </Privada>
        }
      />


      {/* ======================================================
          BIG DATA - DATASETS

          El módulo contiene:

          [ Datos ]

          y, solamente cuando tiene:

          big_data.graficos

          también:

          [ Gráficos ]

          El acceso a la página completa
          sigue dependiendo de:
          big_data.datasets
          ====================================================== */}

      <Route
        path="/big-data/datasets"
        element={
          <Privada
            rol="trabajador"
            permiso="big_data.datasets"
          >

            <Archivos />

          </Privada>
        }
      />


      {/* ======================================================
          BIG DATA - ANALISIS
          ====================================================== */}

      <Route
        path="/big-data/analisis"
        element={
          <Privada
            rol="trabajador"
            permiso="big_data.analisis"
          >

            <Comparar
              modo="analisis"
            />

          </Privada>
        }
      />


      {/* ======================================================
          BIG DATA - COMPARACION
          ====================================================== */}

      <Route
        path="/big-data/comparar"
        element={
          <Privada
            rol="trabajador"
            permiso="big_data.comparar"
          >

            <Comparar
              modo="comparacion"
            />

          </Privada>
        }
      />


      {/* ======================================================
          BIG DATA - ESTRUCTURA
          ====================================================== */}

      <Route
        path="/big-data/estructura"
        element={
          <Privada
            rol="trabajador"
            permiso="big_data.estructura"
          >

            <DatosEmpresa />

          </Privada>
        }
      />


      {/* ======================================================
          ADMINISTRACION
          ====================================================== */}

      <Route
        path="/administracion/usuarios"
        element={
          <Privada
            rol="admin"
          >

            <AdminUsuarios />

          </Privada>
        }
      />


      {/* ======================================================
          COMPATIBILIDAD CON RUTAS ANTIGUAS
          ====================================================== */}

      <Route
        path="/importar"
        element={
          <Navigate
            to="/big-data/importar"
            replace
          />
        }
      />


      <Route
        path="/datos-empresa"
        element={
          <Navigate
            to="/big-data/estructura"
            replace
          />
        }
      />


      <Route
        path="/archivos"
        element={
          <Navigate
            to="/big-data/datasets"
            replace
          />
        }
      />


      <Route
        path="/comparar"
        element={
          <Navigate
            to="/big-data/comparar"
            replace
          />
        }
      />


      {/* ======================================================
          GRAFICOS - RUTA ANTIGUA

          Ya NO tiene pantalla propia.

          Redirigimos al dataset,
          donde se encuentra ahora
          la pestaña Graficos.
          ====================================================== */}

      <Route
        path="/big-data/graficos"
        element={
          <Navigate
            to="/big-data/datasets"
            replace
          />
        }
      />


      {/* ======================================================
          DOCUMENTACION - RUTA ANTIGUA

          Ya NO tiene pantalla propia.

          Ahora está integrada en:
          Cargar archivos.
          ====================================================== */}

      <Route
        path="/big-data/documentos"
        element={
          <Navigate
            to="/big-data/importar"
            replace
          />
        }
      />


      {/* ======================================================
          RUTA DESCONOCIDA
          ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              isLogged()
                ? "/"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  )


export default App