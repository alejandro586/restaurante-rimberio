/* ==========================================================
   CONFIGURACION DE CURSOS Y FUNCIONES DEL FRONTEND
   ========================================================== */

/*
 * Supabase decide qué cursos y módulos puede usar cada usuario.
 * Este archivo solo relaciona la clave de cada módulo con una
 * pantalla real del frontend.
 *
 * Al agregar Reconocimiento Facial solo tendremos que registrar
 * aquí sus nuevas rutas, sin volver a mezclar sus opciones con
 * las de Big Data.
 */

export const CURSOS_APP = {
  "big-data": {
    slug: "big-data",
    nombre: "Big Data",
    rutaInicio: "/curso/big-data",
    prefijos: [
      "/big-data"
    ]
  }
}


export const MODULOS_APP = {
  "big_data.importar": {
    curso: "big-data",
    nombre: "Cargar archivos",
    ruta: "/big-data/importar",
    icono: "↑"
  },

  "big_data.datasets": {
    curso: "big-data",
    nombre: "Datasets",
    ruta: "/big-data/datasets",
    icono: "▦"
  },

  "big_data.analisis": {
    curso: "big-data",
    nombre: "Análisis",
    ruta: "/big-data/analisis",
    icono: "⌁"
  },

  "big_data.comparar": {
    curso: "big-data",
    nombre: "Comparación",
    ruta: "/big-data/comparar",
    icono: "⇄"
  },

  "big_data.estructura": {
    curso: "big-data",
    nombre: "Estructura de datos",
    ruta: "/big-data/estructura",
    icono: "≡"
  },

  /*
   * Gráficos está integrado en Datasets y por eso no tiene una
   * ruta independiente dentro del menú.
   */
  "big_data.graficos": {
    curso: "big-data",
    nombre: "Gráficos",
    ruta: "",
    icono: "▥"
  }
}


export const obtenerRutaInicioCurso = (
  curso
) => {
  const slug =
    String(
      curso?.slug ||
      curso?.id ||
      ""
    ).trim()

  if (!slug) {
    return ""
  }

  return `/curso/${encodeURIComponent(slug)}`
}


export const obtenerConfigModulo = (
  clave
) => {
  if (!clave) {
    return null
  }

  return MODULOS_APP[String(clave)] || null
}


export const obtenerRutaModulo = (
  clave
) =>
    obtenerConfigModulo(clave)?.ruta || ""


export const obtenerNombreModulo = (
  modulo
) => {
  const config =
    obtenerConfigModulo(
      modulo?.clave
    )

  return (
    config?.nombre ||
    modulo?.nombre ||
    "Función"
  )
}


export const obtenerIconoModulo = (
  modulo
) => {
  const config =
    obtenerConfigModulo(
      modulo?.clave
    )

  return config?.icono || "•"
}


export const resolverCursoSlugPorRuta = (
  pathname
) => {
  const ruta =
    String(pathname || "")
      .trim()

  /* Página de entrada de cualquier curso. */
  const coincidencia =
    ruta.match(/^\/curso\/([^/]+)/)

  if (coincidencia?.[1]) {
    try {
      return decodeURIComponent(
        coincidencia[1]
      )
    } catch {
      return coincidencia[1]
    }
  }

  /* Pantallas internas conocidas. */
  for (const curso of Object.values(CURSOS_APP)) {
    const coincide =
      (curso.prefijos || [])
        .some(
          (prefijo) =>
            ruta === prefijo ||
            ruta.startsWith(`${prefijo}/`)
        )

    if (coincide) {
      return curso.slug
    }
  }

  return ""
}
