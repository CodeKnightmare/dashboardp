/**
 * js/dataLoader.js
 * Ingesta, parseo con PapaParse y normalización del dataset.
 */

// Diccionario oficial de variables y reglas de mapeo
export const VARIABLE_DEFINITIONS = {
  ocupacion: {
    key: 'ocupacion',
    label: 'Ocupación Laboral Principal',
    category: 'Demográfica',
    type: 'categorical',
    multi: false,
    headerPattern: /ocupaci[oó]n\s*laboral/i,
    description: 'Ocupación o sector laboral de quien responde la encuesta.'
  },
  nivelEstudios: {
    key: 'nivelEstudios',
    label: 'Nivel Máximo de Estudios',
    category: 'Demográfica',
    type: 'ordinal',
    multi: false,
    headerPattern: /nivel\s*m[aá]ximo\s*de\s*estudios/i,
    description: 'Nivel académico más alto alcanzado en el hogar.',
    order: [
      'Primaria',
      'Secundaria',
      'Técnico superior / Carrera técnica',
      'Preparatoria / Bachillerato',
      'Licenciatura / Ingeniería',
      'Posgrado (Maestría / Doctorado)'
    ]
  },
  ingresoFamiliar: {
    key: 'ingresoFamiliar',
    label: 'Rango de Ingreso Familiar Mensual',
    category: 'Demográfica',
    type: 'ordinal',
    multi: false,
    headerPattern: /ingreso\s*familiar\s*mensual/i,
    description: 'Estimado en salarios mínimos mensuales en el hogar.',
    order: [
      'Menos del salario mínimo',
      'Entre 1 y 2 salarios mínimos',
      'Entre 3 y 5 salarios mínimos',
      'Más de 5 salarios mínimos',
      'Prefiero no responder'
    ]
  },
  tiempoApoyo: {
    key: 'tiempoApoyo',
    label: 'Tiempo Diario de Convivencia y Apoyo Escolar',
    category: 'Acompañamiento',
    type: 'ordinal',
    multi: false,
    headerPattern: /tiempo\s*aproximado\s*convives\s*o\s*apoyas/i,
    description: 'Tiempo dedicado diariamente a tareas y actividades escolares.',
    order: [
      'No me es posible apoyarlos por temas de horario',
      'Menos de 30 minutos al día',
      'Entre 30 minutos y 1 hora al día',
      'Entre 1 y 2 horas al día',
      'Más de 2 horas al día',
      'Solo los fines de semana'
    ]
  },
  nivelHijos: {
    key: 'nivelHijos',
    label: 'Nivel Educativo de los Hijos',
    category: 'Demográfica',
    type: 'categorical',
    multi: true,
    headerPattern: /nivel\s*educativo\s*se\s*encuentran\s*tus\s*hijos/i,
    description: 'Niveles escolares cursados actualmente por los hijos (opción múltiple).'
  },
  conocimientoIA: {
    key: 'conocimientoIA',
    label: 'Grado de Conocimiento sobre la IA (1-5)',
    category: 'Percepción',
    type: 'quantitative',
    multi: false,
    headerPattern: /grado\s*de\s*conocimiento\s*sobre\s*qu[eé]\s*es/i,
    description: 'Autoevaluación del entendimiento sobre qué es y cómo funciona la IA.',
    min: 1,
    max: 5
  },
  frecuenciaUsoHijo: {
    key: 'frecuenciaUsoHijo',
    label: 'Frecuencia de Uso de IA por el Hijo',
    category: 'Uso y Hábitos',
    type: 'ordinal',
    multi: false,
    headerPattern: /frecuencia\s*utiliza\s*tu\s*hijo/i,
    description: 'Periodicidad con la que el hijo utiliza herramientas de IA para tareas.',
    order: [
      'Nunca',
      'Rara vez (1 o 2 veces al mes)',
      'Varias veces por semana',
      'Diariamente',
      'No lo sé'
    ]
  },
  usosPrincipalesIA: {
    key: 'usosPrincipalesIA',
    label: 'Principales Usos de la IA',
    category: 'Uso y Hábitos',
    type: 'categorical',
    multi: true,
    headerPattern: /principales\s*usos\s*que\s*tu\s*hijo\s*le\s*da/i,
    description: 'Finalidades para las que el estudiante recurre a la IA (opción múltiple).'
  },
  nivelSupervision: {
    key: 'nivelSupervision',
    label: 'Nivel de Supervisión Parental',
    category: 'Supervisión',
    type: 'ordinal',
    multi: false,
    headerPattern: /nivel\s*de\s*supervisi[oó]n\s*mantienes/i,
    description: 'Grado de acompañamiento y revisión cuando el hijo utiliza IA.',
    order: [
      'Ninguna (No conozco las herramientas que utiliza)',
      'Mínima o nula (Confío en que lo use adecuadamente)',
      'Supervisión ocasional (Pregunto de vez en cuando)',
      'Supervisión constante (Reviso activamente qué usa y cómo)'
    ]
  },
  impactoGlobal: {
    key: 'impactoGlobal',
    label: 'Percepción del Impacto Global en la Educación',
    category: 'Percepción',
    type: 'ordinal',
    multi: false,
    headerPattern: /impacto\s*global\s*que\s*la\s*inteligencia\s*artificial/i,
    description: 'Evaluación general del efecto de la IA en la formación del estudiante.',
    order: [
      'Muy negativo',
      'Moderadamente negativo',
      'Neutro (Ni positivo ni negativo)',
      'Moderadamente positivo',
      'Muy positivo',
      'No estoy seguro/a'
    ]
  },
  principalBeneficio: {
    key: 'principalBeneficio',
    label: 'Principal Beneficio de la IA en el Aprendizaje',
    category: 'Percepción',
    type: 'categorical',
    multi: false,
    headerPattern: /PRINCIPAL\s*beneficio/i,
    description: 'Mayor ventaja percibida del uso pedagógico de la IA.'
  },
  principalRiesgo: {
    key: 'principalRiesgo',
    label: 'Principal Riesgo del Uso de IA',
    category: 'Percepción',
    type: 'categorical',
    multi: false,
    headerPattern: /PRINCIPAL\s*riesgo/i,
    description: 'Mayor peligro o desventaja identificada por los padres.'
  },
  normativaEscuela: {
    key: 'normativaEscuela',
    label: 'Normas Comunicadas por la Escuela',
    category: 'Institucional',
    type: 'categorical',
    multi: false,
    headerPattern: /normas\s*o\s*reglas\s*claras/i,
    description: 'Claridad en la comunicación institucional respecto a la IA.'
  },
  posturaEscuela: {
    key: 'posturaEscuela',
    label: 'Postura Esperada de las Escuelas',
    category: 'Institucional',
    type: 'categorical',
    multi: false,
    headerPattern: /postura\s*crees\s*que\s*deber[ií]an\s*adoptar/i,
    description: 'Acción que los padres consideran que la escuela debería tomar.'
  }
};

/**
 * Función auxiliar para dividir cadenas con múltiples valores respetando comas y puntos y coma.
 * @param {string|any} value 
 * @returns {string[]}
 */
export function splitMultiValue(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  const str = String(value).trim();
  if (!str) return [];
  // Divide por punto y coma o coma
  return str
    .split(/[;,]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Mapea las columnas del CSV original a las claves internas estandarizadas.
 * @param {Array<Object>} rawRows - Filas obtenidas directamente de PapaParse
 * @returns {Array<Object>} Filas normalizadas
 */
export function normalizeDataset(rawRows) {
  if (!rawRows || !rawRows.length) return [];

  // Mapeador de encabezados
  const originalHeaders = Object.keys(rawRows[0]);
  const headerMap = {};

  Object.entries(VARIABLE_DEFINITIONS).forEach(([key, def]) => {
    // Buscar el encabezado que coincida con el patrón regex
    const matchedHeader = originalHeaders.find(h => def.headerPattern.test(h));
    if (matchedHeader) {
      headerMap[key] = matchedHeader;
    } else {
      // Fallback a coincidencia directa por nombre de clave
      const fallback = originalHeaders.find(h => h.toLowerCase().includes(key.toLowerCase()));
      if (fallback) headerMap[key] = fallback;
    }
  });

  return rawRows.map((row, index) => {
    const normalized = {
      id: index + 1,
      marcaTemporal: row['Marca temporal'] || row['Timestamp'] || ''
    };

    Object.entries(VARIABLE_DEFINITIONS).forEach(([key, def]) => {
      const originalHeader = headerMap[key];
      let val = originalHeader ? row[originalHeader] : row[key];

      if (val === undefined || val === null) {
        val = '';
      }

      if (def.type === 'quantitative') {
        const num = parseFloat(val);
        normalized[key] = isNaN(num) ? 0 : num;
      } else {
        const cleanStr = String(val).trim();
        normalized[key] = cleanStr;

        if (def.multi) {
          normalized[`${key}List`] = splitMultiValue(cleanStr);
        }
      }
    });

    return normalized;
  });
}

/**
 * Carga el dataset por defecto vía fetch con fallback.
 * @returns {Promise<{data: Array<Object>, fileName: string}>}
 */
export async function loadDefaultCSV() {
  const defaultPaths = [
    './data/Estudio_ La Inteligencia Artificial en la Educación (Perspectiva de Padres).csv',
    './Estudio_ La Inteligencia Artificial en la Educación (Perspectiva de Padres).csv'
  ];

  let lastError = null;

  for (const path of defaultPaths) {
    const candidates = [path, encodeURI(path)];
    for (const target of candidates) {
      try {
        const response = await fetch(target);
        if (response.ok) {
          const csvText = await response.text();
          const parsedData = await parseCSVString(csvText);
          return {
            data: parsedData,
            fileName: path.split('/').pop()
          };
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(`No se pudo cargar el archivo CSV por defecto: ${lastError?.message || 'Error de red'}`);
}

/**
 * Parsea un archivo CSV subido por el usuario mediante un objeto File.
 * @param {File} file 
 * @returns {Promise<{data: Array<Object>, fileName: string}>}
 */
export function loadCSVFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se ha proporcionado un archivo válido.'));
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('Advertencias al parsear CSV:', results.errors);
        }
        if (!results.data || results.data.length === 0) {
          return reject(new Error('El archivo CSV seleccionado está vacío o no contiene registros válidos.'));
        }
        const normalized = normalizeDataset(results.data);
        resolve({
          data: normalized,
          fileName: file.name
        });
      },
      error: (err) => {
        reject(new Error(`Error al leer el archivo CSV: ${err.message}`));
      }
    });
  });
}

/**
 * Parsea una cadena de texto en formato CSV utilizando PapaParse.
 * @param {string} csvText 
 * @returns {Promise<Array<Object>>}
 */
export function parseCSVString(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('El contenido CSV está vacío.'));
        }
        const normalized = normalizeDataset(results.data);
        resolve(normalized);
      },
      error: (err) => {
        reject(new Error(`Error de análisis sintáctico CSV: ${err.message}`));
      }
    });
  });
}
