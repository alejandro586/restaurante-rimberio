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


  if (
    administrador
  ) {

    return (
      <Layout>
        {children}
      </Layout>
    )
  }


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


      <Route
        path="/"
        element={
          <InicioPrivado />
        }
      />


      <Route
        path="/mis-cursos"
        element={
          <PrivadaGeneral>
            <MisCursos />
          </PrivadaGeneral>
        }
      />


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


      <Route
        path="/administracion/usuarios"
        element={
          <RutaAdmin>
            <AdminUsuarios />
          </RutaAdmin>
        }
      />


      <Route
        path="/administracion/cursos"
        element={
          <RutaAdmin>
            <AdminCursos />
          </RutaAdmin>
        }
      />


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


      <Route
        path="/cursos"
        element={
          <Navigate
            to="/mis-cursos"
            replace
          />
        }
      />


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