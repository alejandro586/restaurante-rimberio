import {
  useEffect,
  useState
} from "react"

import {
  Routes,
  Route,
  Navigate
} from "react-router-dom"

import {
  esAdmin,
  esTrabajador,
  isLogged,
  obtenerMisPermisos
} from "./api"

import Layout from "./components/Layout"

import Login from "./pages/Login"
import Register from "./pages/Register"
import RecuperarPassword from "./pages/RecuperarPassword"
import RestablecerPassword from "./pages/RestablecerPassword"

import Importar from "./pages/Importar"
import DatosEmpresa from "./pages/DatosEmpresa"
import Archivos from "./pages/Archivos"
import Comparar from "./pages/Comparar"

import AdminUsuarios from "./pages/AdminUsuarios"


/* ==========================================================
   RUTAS DE LOS PERMISOS
   ========================================================== */

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
    "/big-data/estructura",

  "big_data.graficos":
    "/big-data/graficos"
}


/*
 * Orden que utilizaremos para decidir
 * la pagina inicial de un usuario.
 */
const ORDEN_PERMISOS = [
  "big_data.importar",
  "big_data.datasets",
  "big_data.analisis",
  "big_data.comparar",
  "big_data.estructura",
  "big_data.graficos"
]


/* ==========================================================
   NORMALIZAR RESPUESTA DE PERMISOS
   ========================================================== */

const obtenerCursosRespuesta = (
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
   EXTRAER CLAVES DE MODULOS
   ========================================================== */

const obtenerClavesPermisos = (
  respuesta
) => {

  const cursos =
    obtenerCursosRespuesta(
      respuesta
    )


  const claves =
    new Set()


  for (
    const curso
    of cursos
  ) {

    for (
      const modulo
      of curso.modulos || []
    ) {

      if (
        modulo.clave
      ) {
        claves.add(
          modulo.clave
        )
      }

    }

  }


  return claves
}


/* ==========================================================
   RUTA PRIVADA
   ========================================================== */

const Privada = ({
  rol,
  permiso,
  children
}) => {

  const [
    permisos,
    setPermisos
  ] = useState(null)


  const [
    errorPermisos,
    setErrorPermisos
  ] = useState(false)


  const conectado =
    isLogged()


  const administrador =
    esAdmin()


  const trabajador =
    esTrabajador()


  /* ========================================================
     COMPROBAR PERMISO DEL MODULO
     ======================================================== */

  useEffect(() => {

    /*
     * No necesitamos consultar permisos:
     *
     * - si no hay sesion
     * - si es administrador
     * - si la ruta no pide permiso
     */
    if (
      !conectado ||
      administrador ||
      !permiso
    ) {

      setPermisos(
        new Set()
      )

      return
    }


    let activo =
      true


    const cargar =
      async () => {

        try {

          setErrorPermisos(
            false
          )


          const respuesta =
            await obtenerMisPermisos()


          if (
            !activo
          ) {
            return
          }


          setPermisos(
            obtenerClavesPermisos(
              respuesta
            )
          )

        } catch (
          error
        ) {

          if (
            !activo
          ) {
            return
          }


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

  }, [
    conectado,
    administrador,
    permiso
  ])


  /* ========================================================
     SIN SESION
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
     RUTA SOLO ADMIN
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
     RUTA DE USUARIO
     ======================================================== */

  if (
    rol ===
      "trabajador" &&
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
     ADMIN NO NECESITA PERMISO INDIVIDUAL
     ======================================================== */

  if (
    permiso &&
    !administrador
  ) {

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
     ACCESO PERMITIDO
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

const Publica = ({
  children
}) => {

  /*
   * Si ya existe sesión activa,
   * no necesitamos mostrar Login,
   * Registro o Recuperación.
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
   PAGINA INICIAL SEGUN PERMISOS
   ========================================================== */

const InicioPrivado =
  () => {

    const [
      cargando,
      setCargando
    ] = useState(true)


    const [
      ruta,
      setRuta
    ] = useState("")


    /* ========================================================
       BUSCAR PRIMER MODULO DISPONIBLE
       ======================================================== */

    useEffect(() => {

      if (
        !isLogged()
      ) {

        setCargando(
          false
        )

        return
      }


      /*
       * El administrador mantiene
       * su pagina principal actual.
       */
      if (
        esAdmin()
      ) {

        setRuta(
          "/archivos"
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


            const primero =
              ORDEN_PERMISOS.find(
                (
                  clave
                ) =>
                  claves.has(
                    clave
                  )
              )


            if (
              primero
            ) {

              setRuta(
                RUTA_POR_PERMISO[
                  primero
                ]
              )

            } else {

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

    }, [])


    /* ========================================================
       SIN SESION
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
       TIENE MODULOS
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
              Sistema de gestión
              por cursos.
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
                  8
              }}
            >
              No tienes módulos
              habilitados
            </strong>


            <span>
              Un administrador debe
              asignarte al menos un
              módulo para comenzar.
            </span>

          </div>

        </div>

      </Layout>
    )
  }


/* ==========================================================
   APLICACION
   ========================================================== */

const App =
  () => (

    <Routes>

      {/* ======================================================
          PUBLICO
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


      {/* ======================================================
          RECUPERAR CONTRASEÑA

          NO requiere iniciar sesión.
          ====================================================== */}

      <Route
        path="/recuperar-password"
        element={
          <Publica>
            <RecuperarPassword />
          </Publica>
        }
      />


      {/* ======================================================
          RESTABLECER CONTRASEÑA

          Usuario utiliza:
          - correo
          - código
          - contraseña nueva

          NO requiere iniciar sesión.
          ====================================================== */}

      <Route
        path="/restablecer-password"
        element={
          <Publica>
            <RestablecerPassword />
          </Publica>
        }
      />


      {/* ======================================================
          INICIO INTELIGENTE
          ====================================================== */}

      <Route
        path="/"
        element={
          <InicioPrivado />
        }
      />


      {/* ======================================================
          BIG DATA - IMPORTAR

          Reutiliza:
          Importar.jsx
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

          Reutiliza:
          Archivos.jsx
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

          Reutiliza:
          Comparar.jsx
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

          Reutiliza:
          Comparar.jsx
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

          Reutiliza:
          DatosEmpresa.jsx
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
          BIG DATA - GRAFICOS

          Reutiliza:
          Comparar.jsx
          ====================================================== */}

      <Route
        path="/big-data/graficos"
        element={
          <Privada
            rol="trabajador"
            permiso="big_data.graficos"
          >

            <Comparar
              modo="graficos"
            />

          </Privada>
        }
      />


      {/* ======================================================
          ADMINISTRADOR
          ====================================================== */}

      <Route
        path="/archivos"
        element={
          <Privada
            rol="admin"
          >

            <Archivos />

          </Privada>
        }
      />


      <Route
        path="/comparar"
        element={
          <Privada
            rol="admin"
          >

            <Comparar />

          </Privada>
        }
      />


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
          RUTAS ANTIGUAS

          Las conservamos como redireccion
          para no romper enlaces anteriores.
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


      {/* ======================================================
          DESCONOCIDA
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