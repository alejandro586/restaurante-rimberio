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

import Layout from "./components/Layout"

import Login from "./pages/Login"
import Register from "./pages/Register"

import RecuperarPassword
  from "./pages/RecuperarPassword"

import RestablecerPassword
  from "./pages/RestablecerPassword"

import MisCursos
  from "./pages/MisCursos"

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
      respuesta
        ?.permisos
        ?.cursos
    )
  ) {
    return respuesta
      .permisos
      .cursos
  }


  if (
    Array.isArray(
      respuesta
        ?.data
        ?.cursos
    )
  ) {
    return respuesta
      .data
      .cursos
  }


  return []
}


/* ==========================================================
   OBTENER CLAVES DE MODULOS
   ========================================================== */

const obtenerClavesPermisos = (
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
     MODULOS SEPARADOS
     ======================================================== */

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
   RUTA PRIVADA
   ========================================================== */

const Privada = ({
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
    useState(null)


  const [
    errorPermisos,
    setErrorPermisos
  ] =
    useState(false)


  /* ========================================================
     COMPROBAR PERMISOS
     ======================================================== */

  useEffect(
    () => {

      /*
       * Sin sesión.
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
       * Admin puede acceder a todos
       * los módulos.
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
       * Ruta privada general.
       *
       * Ejemplo:
       * /mis-cursos
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


            /*
             * Seguridad por defecto:
             *
             * si no se puede comprobar
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
     SOLO ADMIN
     ======================================================== */

  if (
    rol === "admin" &&
    !administrador
  ) {

    return (
      <Navigate
        to="/mis-cursos"
        replace
      />
    )
  }


  /* ========================================================
     RUTA PARA USUARIO NORMAL
     ======================================================== */

  /*
   * Actualmente el backend utiliza
   * el rol legacy "trabajador".
   *
   * Admin también puede acceder a
   * estas páginas.
   */
  if (
    rol === "trabajador" &&
    !administrador &&
    !trabajador
  ) {

    return (
      <Navigate
        to="/mis-cursos"
        replace
      />
    )
  }


  /* ========================================================
     COMPROBAR PERMISO DEL MODULO
     ======================================================== */

  if (
    permiso &&
    !administrador
  ) {

    if (
      permisos === null
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
          to="/mis-cursos"
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
   INICIO DEL ERP
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


  /*
   * NUEVO FLUJO:
   *
   * Login
   *   ↓
   * Mis cursos
   *   ↓
   * Curso
   *   ↓
   * Módulo
   */
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

const App = () => (

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
        MIS CURSOS
        ====================================================== */}

    <Route
      path="/mis-cursos"
      element={
        <Privada>

          <MisCursos />

        </Privada>
      }
    />


    {/* ======================================================
        BIG DATA
        ====================================================== */}


    {/* ======================================================
        CARGAR ARCHIVOS

        Incluye:
        - CSV
        - XLS
        - XLSX
        - Documentación
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
        DATASETS

        Incluye:
        - Datos
        - Gráficos

        La pestaña Gráficos se controla
        internamente mediante:
        big_data.graficos
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
        ANALISIS
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
        COMPARACION
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
        ESTRUCTURA DE DATOS
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
        RUTAS ANTIGUAS
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
        GRAFICOS - ANTIGUA RUTA

        Los gráficos ahora están dentro
        de cada dataset.
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
        DOCUMENTACION - ANTIGUA RUTA

        Documentación ahora está dentro
        de Cargar archivos.
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
              ? "/mis-cursos"
              : "/login"
          }
          replace
        />
      }
    />

  </Routes>
)


export default App