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


import Login
  from "./pages/Login"

import Register
  from "./pages/Register"

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
   NORMALIZAR CURSOS DE LA RESPUESTA
   ========================================================== */

const obtenerCursosRespuesta = (
  respuesta
) => {

  /*
   * Forma principal:
   *
   * {
   *   cursos: [...]
   * }
   */
  if (
    Array.isArray(
      respuesta?.cursos
    )
  ) {

    return respuesta.cursos
  }


  /*
   * Compatibilidad:
   *
   * {
   *   permisos: {
   *     cursos: [...]
   *   }
   * }
   */
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


  /*
   * Compatibilidad:
   *
   * {
   *   data: {
   *     cursos: [...]
   *   }
   * }
   */
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
   EXTRAER CLAVES DE PERMISOS
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

    /*
     * Un curso desactivado
     * no entrega permisos.
     */
    if (
      curso?.activo ===
      false
    ) {
      continue
    }


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
     COMPATIBILIDAD CON MODULOS SEPARADOS
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

        : Array.isArray(
            respuesta
              ?.data
              ?.modulos
          )
          ? respuesta
              .data
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

/*
 * IMPORTANTE:
 *
 * Ya NO verificamos:
 *
 * rol === "trabajador"
 *
 * porque el acceso de un usuario normal
 * depende ahora de sus permisos reales.
 *
 * Ejemplo:
 *
 * big_data.importar
 * big_data.datasets
 * big_data.analisis
 *
 * El único rol especial que comprobamos
 * directamente es ADMIN.
 */

const Privada = ({
  soloAdmin = false,
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
    errorPermisos,
    setErrorPermisos
  ] =
    useState(false)


  /* ========================================================
     CARGAR PERMISOS
     ======================================================== */

  useEffect(
    () => {

      /*
       * No hay sesión.
       */
      if (
        !conectado
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
       * Administrador:
       *
       * no necesita consultar permisos
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
       * Ruta privada general:
       *
       * ejemplo:
       *
       * /mis-cursos
       *
       * No necesita un permiso específico.
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
             * Seguridad:
             *
             * si no podemos comprobar
             * el permiso, bloqueamos
             * la ruta.
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
     SOLO ADMINISTRADOR
     ======================================================== */

  if (
    soloAdmin &&
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
     COMPROBAR PERMISO
     ======================================================== */

  if (
    permiso &&
    !administrador
  ) {

    /*
     * Aún estamos consultando
     * /courses/me
     */
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


    /*
     * Error o permiso inexistente.
     */
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

  /*
   * Si ya inició sesión,
   * no debe volver a Login/Register.
   */
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
   INICIO PRIVADO
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
   * Flujo principal de RIMBERIO:
   *
   * Login
   *   ↓
   * Mis cursos
   *   ↓
   * Curso
   *   ↓
   * Funciones
   */
  return (
    <Navigate
      to="/mis-cursos"
      replace
    />
  )
}


/* ==========================================================
   APLICACION
   ========================================================== */

const App = () => (

  <Routes>

    {/* ======================================================
        LOGIN
        ====================================================== */}

    <Route
      path="/login"
      element={
        <Publica>

          <Login />

        </Publica>
      }
    />


    {/* ======================================================
        REGISTRO
        ====================================================== */}

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
        RAIZ
        ====================================================== */}

    <Route
      path="/"
      element={
        <InicioPrivado />
      }
    />


    {/* ======================================================
        MIS CURSOS

        Cualquier usuario autenticado
        puede entrar.
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

        Permiso:
        big_data.importar

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
          permiso="big_data.importar"
        >

          <Importar />

        </Privada>
      }
    />


    {/* ======================================================
        DATASETS

        Permiso:
        big_data.datasets

        Incluye:
        - Datos
        - Gráficos

        La pestaña de gráficos utiliza
        además:
        big_data.graficos
        ====================================================== */}

    <Route
      path="/big-data/datasets"
      element={
        <Privada
          permiso="big_data.datasets"
        >

          <Archivos />

        </Privada>
      }
    />


    {/* ======================================================
        ANALISIS

        Permiso:
        big_data.analisis
        ====================================================== */}

    <Route
      path="/big-data/analisis"
      element={
        <Privada
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

        Permiso:
        big_data.comparar
        ====================================================== */}

    <Route
      path="/big-data/comparar"
      element={
        <Privada
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

        Permiso:
        big_data.estructura
        ====================================================== */}

    <Route
      path="/big-data/estructura"
      element={
        <Privada
          permiso="big_data.estructura"
        >

          <DatosEmpresa />

        </Privada>
      }
    />


    {/* ======================================================
        ADMINISTRACION

        Solo administrador.
        ====================================================== */}

    <Route
      path="/administracion/usuarios"
      element={
        <Privada
          soloAdmin
        >

          <AdminUsuarios />

        </Privada>
      }
    />


    {/* ======================================================
        RUTAS ANTIGUAS
        ====================================================== */}


    {/* IMPORTAR ANTIGUO */}

    <Route
      path="/importar"
      element={
        <Navigate
          to="/big-data/importar"
          replace
        />
      }
    />


    {/* DATASETS ANTIGUO */}

    <Route
      path="/archivos"
      element={
        <Navigate
          to="/big-data/datasets"
          replace
        />
      }
    />


    {/* ESTRUCTURA ANTIGUA */}

    <Route
      path="/datos-empresa"
      element={
        <Navigate
          to="/big-data/estructura"
          replace
        />
      }
    />


    {/* COMPARACION ANTIGUA */}

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
        GRAFICOS

        Ya NO es una pantalla independiente.

        Ahora está dentro de:
        Datasets → Gráficos
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
        DOCUMENTACION

        Ya NO es una pantalla independiente.

        Ahora está dentro de:
        Cargar archivos → Documentación
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