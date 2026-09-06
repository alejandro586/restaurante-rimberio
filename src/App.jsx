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
  isLogged,
  obtenerMisPermisos
} from "./api"

import Layout
  from "./components/Layout"


/* ==========================================================
   PAGINAS PUBLICAS
   ========================================================== */

import Login
  from "./pages/Login"

import Register
  from "./pages/Register"

import RecuperarPassword
  from "./pages/RecuperarPassword"

import RestablecerPassword
  from "./pages/RestablecerPassword"


/* ==========================================================
   PAGINAS GENERALES
   ========================================================== */

import MisCursos
  from "./pages/MisCursos"


/* ==========================================================
   BIG DATA
   ========================================================== */

import Importar
  from "./pages/Importar"

import Archivos
  from "./pages/Archivos"

import Comparar
  from "./pages/Comparar"

import DatosEmpresa
  from "./pages/DatosEmpresa"


/* ==========================================================
   ADMINISTRACION
   ========================================================== */

import AdminUsuarios
  from "./pages/AdminUsuarios"

import AdminCursos
  from "./pages/AdminCursos"


/* ==========================================================
   PERMISOS BIG DATA
   ========================================================== */

const PERMISOS_BIG_DATA = {

  importar:
    "big_data.importar",

  datasets:
    "big_data.datasets",

  analisis:
    "big_data.analisis",

  comparar:
    "big_data.comparar",

  estructura:
    "big_data.estructura",

  graficos:
    "big_data.graficos"
}


/* ==========================================================
   RUTAS BIG DATA
   ========================================================== */

const RUTAS_BIG_DATA = {

  importar:
    "/big-data/importar",

  datasets:
    "/big-data/datasets",

  analisis:
    "/big-data/analisis",

  comparar:
    "/big-data/comparar",

  estructura:
    "/big-data/estructura"
}


/* ==========================================================
   NORMALIZAR RESPUESTA DE PERMISOS
   ========================================================== */

const obtenerOrigenPermisos = (
  respuesta
) => {

  if (
    respuesta?.permisos &&
    typeof respuesta.permisos ===
      "object"
  ) {

    return respuesta.permisos
  }


  if (
    respuesta?.data &&
    typeof respuesta.data ===
      "object" &&
    !Array.isArray(
      respuesta.data
    )
  ) {

    return respuesta.data
  }


  return respuesta || {}
}


/* ==========================================================
   OBTENER CURSOS
   ========================================================== */

const obtenerCursosRespuesta = (
  respuesta
) => {

  const origen =
    obtenerOrigenPermisos(
      respuesta
    )


  if (
    Array.isArray(
      origen?.cursos
    )
  ) {

    return origen.cursos
  }


  if (
    Array.isArray(
      respuesta?.cursos
    )
  ) {

    return respuesta.cursos
  }


  return []
}


/* ==========================================================
   OBTENER MODULOS DE CURSO
   ========================================================== */

const obtenerModulosCurso = (
  curso
) => {

  if (
    Array.isArray(
      curso?.modulos
    )
  ) {

    return curso.modulos
  }


  if (
    Array.isArray(
      curso?.modules
    )
  ) {

    return curso.modules
  }


  return []
}


/* ==========================================================
   EXTRAER CLAVES DE PERMISOS
   ========================================================== */

const obtenerClavesPermisos = (
  respuesta
) => {

  const claves =
    new Set()


  const origen =
    obtenerOrigenPermisos(
      respuesta
    )


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

    if (
      curso?.activo ===
      false
    ) {
      continue
    }


    const modulos =
      obtenerModulosCurso(
        curso
      )


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


  /* ========================================================
     MODULOS SEPARADOS
     ======================================================== */

  const modulosSeparados =
    Array.isArray(
      origen?.modulos
    )
      ? origen.modulos

      : Array.isArray(
          origen?.modules
        )
        ? origen.modules

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


  /* ========================================================
     COMPATIBILIDAD CON ARRAYS DE PERMISOS
     ======================================================== */

  const permisosSeparados =
    Array.isArray(
      origen?.permisos
    )
      ? origen.permisos

      : Array.isArray(
          origen?.permissions
        )
        ? origen.permissions

        : []


  for (
    const permiso
    of permisosSeparados
  ) {

    if (
      typeof permiso ===
      "string"
    ) {

      claves.add(
        permiso
      )

      continue
    }


    if (
      permiso?.clave &&
      permiso?.activo !==
        false
    ) {

      claves.add(
        String(
          permiso.clave
        )
      )
    }
  }


  return claves
}


/* ==========================================================
   RUTA PUBLICA
   ========================================================== */

const Publica = ({
  children
}) => {

  if (
    isLogged()
  ) {

    return (
      <Navigate
        to="/mis-cursos"
        replace
      />
    )
  }


  return children
}


/* ==========================================================
   RUTA PRIVADA GENERAL
   ========================================================== */

const PrivadaGeneral = ({
  children
}) => {

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


  return (
    <Layout>
      {children}
    </Layout>
  )
}


/* ==========================================================
   RUTA DE MODULO
   ========================================================== */

const RutaModulo = ({
  permiso,
  children
}) => {

  const conectado =
    isLogged()


  const administrador =
    esAdmin()


  const [
    permisos,
    setPermisos
  ] =
    useState(null)


  const [
    cargando,
    setCargando
  ] =
    useState(
      conectado &&
      !administrador
    )


  const [
    errorPermisos,
    setErrorPermisos
  ] =
    useState("")


  /* ========================================================
     CONSULTAR PERMISOS
     ======================================================== */

  useEffect(
    () => {

      if (
        !conectado
      ) {

        setPermisos(
          new Set()
        )

        setCargando(
          false
        )

        setErrorPermisos(
          ""
        )

        return
      }


      /*
       * Administrador:
       * acceso completo.
       */
      if (
        administrador
      ) {

        setPermisos(
          new Set()
        )

        setCargando(
          false
        )

        setErrorPermisos(
          ""
        )

        return
      }


      let activo =
        true


      const cargarPermisos =
        async () => {

          setCargando(
            true
          )

          setErrorPermisos(
            ""
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


            console.error(
              "Error cargando permisos:",
              error
            )


            setPermisos(
              new Set()
            )


            setErrorPermisos(
              "No se pudieron comprobar tus permisos."
            )

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


      cargarPermisos()


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
     ADMIN
     ======================================================== */

  if (
    administrador
  ) {

    return (
      <Layout>
        {children}
      </Layout>
    )
  }


  /* ========================================================
     CARGANDO
     ======================================================== */

  if (
    cargando ||
    permisos === null
  ) {

    return (
      <Layout>

        <div className="loading">
          Cargando módulo...
        </div>

      </Layout>
    )
  }


  /* ========================================================
     ERROR
     ======================================================== */

  if (
    errorPermisos
  ) {

    return (
      <Layout>

        <div className="card">

          <div className="alert alert-error">
            {errorPermisos}
          </div>


          <button
            type="button"
            className="btn"
            onClick={
              () =>
                window.location.reload()
            }
          >
            Reintentar
          </button>

        </div>

      </Layout>
    )
  }


  /* ========================================================
     SIN PERMISO
     ======================================================== */

  if (
    !permisos.has(
      permiso
    )
  ) {

    return (
      <Navigate
        to="/mis-cursos"
        replace
      />
    )
  }


  /* ========================================================
     PERMITIDO
     ======================================================== */

  return (
    <Layout>
      {children}
    </Layout>
  )
}


/* ==========================================================
   RUTA SOLO ADMINISTRADOR
   ========================================================== */

const RutaAdmin = ({
  children
}) => {

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


  if (
    !esAdmin()
  ) {

    return (
      <Navigate
        to="/mis-cursos"
        replace
      />
    )
  }


  return (
    <Layout>
      {children}
    </Layout>
  )
}


/* ==========================================================
   INICIO
   ========================================================== */

const InicioPrivado = () => {

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


  return (
    <Navigate
      to="/mis-cursos"
      replace
    />
  )
}


/* ==========================================================
   APP
   ========================================================== */

const App = () => {

  return (

    <Routes>

      {/* ====================================================
          LOGIN
          ==================================================== */}

      <Route
        path="/login"
        element={
          <Publica>

            <Login />

          </Publica>
        }
      />


      {/* ====================================================
          REGISTRO
          ==================================================== */}

      <Route
        path="/registro"
        element={
          <Publica>

            <Register />

          </Publica>
        }
      />


      {/* ====================================================
          RECUPERAR CONTRASEÑA
          ==================================================== */}

      <Route
        path="/recuperar-password"
        element={
          <Publica>

            <RecuperarPassword />

          </Publica>
        }
      />


      {/* ====================================================
          RESTABLECER CONTRASEÑA
          ==================================================== */}

      <Route
        path="/restablecer-password"
        element={
          <Publica>

            <RestablecerPassword />

          </Publica>
        }
      />


      {/* ====================================================
          INICIO
          ==================================================== */}

      <Route
        path="/"
        element={
          <InicioPrivado />
        }
      />


      {/* ====================================================
          MIS CURSOS
          ==================================================== */}

      <Route
        path="/mis-cursos"
        element={
          <PrivadaGeneral>

            <MisCursos />

          </PrivadaGeneral>
        }
      />


      {/* ====================================================
          BIG DATA - CARGAR ARCHIVOS
          ==================================================== */}

      <Route
        path={
          RUTAS_BIG_DATA
            .importar
        }
        element={
          <RutaModulo
            permiso={
              PERMISOS_BIG_DATA
                .importar
            }
          >

            <Importar />

          </RutaModulo>
        }
      />


      {/* ====================================================
          BIG DATA - DATASETS
          ==================================================== */}

      <Route
        path={
          RUTAS_BIG_DATA
            .datasets
        }
        element={
          <RutaModulo
            permiso={
              PERMISOS_BIG_DATA
                .datasets
            }
          >

            <Archivos />

          </RutaModulo>
        }
      />


      {/* ====================================================
          BIG DATA - ANALISIS
          ==================================================== */}

      <Route
        path={
          RUTAS_BIG_DATA
            .analisis
        }
        element={
          <RutaModulo
            permiso={
              PERMISOS_BIG_DATA
                .analisis
            }
          >

            <Comparar
              modo="analisis"
            />

          </RutaModulo>
        }
      />


      {/* ====================================================
          BIG DATA - COMPARACION
          ==================================================== */}

      <Route
        path={
          RUTAS_BIG_DATA
            .comparar
        }
        element={
          <RutaModulo
            permiso={
              PERMISOS_BIG_DATA
                .comparar
            }
          >

            <Comparar
              modo="comparacion"
            />

          </RutaModulo>
        }
      />


      {/* ====================================================
          BIG DATA - ESTRUCTURA
          ==================================================== */}

      <Route
        path={
          RUTAS_BIG_DATA
            .estructura
        }
        element={
          <RutaModulo
            permiso={
              PERMISOS_BIG_DATA
                .estructura
            }
          >

            <DatosEmpresa />

          </RutaModulo>
        }
      />


      {/* ====================================================
          ADMINISTRACION - USUARIOS
          ==================================================== */}

      <Route
        path="/administracion/usuarios"
        element={
          <RutaAdmin>

            <AdminUsuarios />

          </RutaAdmin>
        }
      />


      {/* ====================================================
          ADMINISTRACION - CURSOS Y MODULOS
          ==================================================== */}

      <Route
        path="/administracion/cursos"
        element={
          <RutaAdmin>

            <AdminCursos />

          </RutaAdmin>
        }
      />


      {/* ====================================================
          RUTAS ANTIGUAS
          ==================================================== */}


      {/* IMPORTAR */}

      <Route
        path="/importar"
        element={
          <Navigate
            to={
              RUTAS_BIG_DATA
                .importar
            }
            replace
          />
        }
      />


      {/* DATASETS */}

      <Route
        path="/archivos"
        element={
          <Navigate
            to={
              RUTAS_BIG_DATA
                .datasets
            }
            replace
          />
        }
      />


      {/* ESTRUCTURA */}

      <Route
        path="/datos-empresa"
        element={
          <Navigate
            to={
              RUTAS_BIG_DATA
                .estructura
            }
            replace
          />
        }
      />


      {/* COMPARACION */}

      <Route
        path="/comparar"
        element={
          <Navigate
            to={
              RUTAS_BIG_DATA
                .comparar
            }
            replace
          />
        }
      />


      {/* ====================================================
          GRAFICOS

          Ahora vive dentro de Datasets.
          ==================================================== */}

      <Route
        path="/big-data/graficos"
        element={
          <Navigate
            to={
              RUTAS_BIG_DATA
                .datasets
            }
            replace
          />
        }
      />


      {/* ====================================================
          DOCUMENTACION

          Ahora vive dentro de Cargar archivos.
          ==================================================== */}

      <Route
        path="/big-data/documentos"
        element={
          <Navigate
            to={
              RUTAS_BIG_DATA
                .importar
            }
            replace
          />
        }
      />


      {/* ====================================================
          ALIAS MIS CURSOS
          ==================================================== */}

      <Route
        path="/cursos"
        element={
          <Navigate
            to="/mis-cursos"
            replace
          />
        }
      />


      {/* ====================================================
          RUTA DESCONOCIDA
          ==================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              isLogged()
                ? "/mis-cursos"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  )
}


export default App