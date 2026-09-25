/**
 * js/dataLoader.js
 * Ingesta, parseo con PapaParse y normalización del dataset.
 */

// Diccionario oficial de variables y reglas de mapeo
export const VARIABLE_DEFINITIONS = {
  ocupacion: {
    code: 'P1',
    key: 'ocupacion',
    label: 'Ocupación Laboral Principal',
    exactQuestion: '1. ¿Cuál es tu ocupación laboral principal?',
    category: 'Demográfica',
    type: 'categorical',
    typeLabel: 'Cualitativa Nominal',
    multi: false,
    headerPattern: /ocupaci[oó]n\s*laboral/i,
    description: 'Ocupación o sector laboral de quien responde la encuesta.',
    scaleDescription: 'Categorías nominales de empleo (Sector público, privado, independiente, comercio, cuidados, etc.)'
  },
  nivelEstudios: {
    code: 'P2',
    key: 'nivelEstudios',
    label: 'Nivel Máximo de Estudios',
    exactQuestion: '2. ¿Cuál es el nivel máximo de estudios alcanzado en el hogar?',
    category: 'Demográfica',
    type: 'ordinal',
    typeLabel: 'Cualitativa Ordinal',
    multi: false,
    headerPattern: /nivel\s*m[aá]ximo\s*de\s*estudios/i,
    description: 'Nivel académico más alto alcanzado en el hogar.',
    scaleDescription: 'Escala educativa jerárquica: Primaria < Secundaria < Técnica < Bachillerato < Licenciatura < Posgrado',
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
    code: 'P3',
    key: 'ingresoFamiliar',
    label: 'Rango de Ingreso Familiar Mensual',
    exactQuestion: '3. Rango de ingreso familiar mensual aproximado (estimado en salarios mínimos):',
    category: 'Demográfica',
    type: 'ordinal',
    typeLabel: 'Cualitativa Ordinal',
    multi: false,
    headerPattern: /ingreso\s*familiar\s*mensual/i,
    description: 'Estimado en salarios mínimos mensuales en el hogar.',
    scaleDescription: '< 1 salario mínimo < 1 a 2 < 3 a 5 < Más de 5 salarios mínimos / Prefiero no responder',
    order: [
      'Menos del salario mínimo',
      'Entre 1 y 2 salarios mínimos',
      'Entre 3 y 5 salarios mínimos',
      'Más de 5 salarios mínimos',
      'Prefiero no responder'
    ]
  },
  tiempoApoyo: {
    code: 'P4',
    key: 'tiempoApoyo',
    label: 'Tiempo Diario de Convivencia y Apoyo Escolar',
    exactQuestion: '4. En tu rutina diaria, ¿cuánto tiempo aproximado convives o apoyas a tus hijos con sus actividades escolares?',
    category: 'Acompañamiento',
    type: 'ordinal',
    typeLabel: 'Cualitativa Ordinal',
    multi: false,
    headerPattern: /tiempo\s*aproximado\s*convives\s*o\s*apoyas/i,
    description: 'Tiempo dedicado diariamente a tareas y actividades escolares.',
    scaleDescription: 'No es posible apoyarlos < Menos de 30 min < 30 min a 1 h < 1 a 2 h < Más de 2 h / Solo fines de semana',
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
    code: 'P5',
    key: 'nivelHijos',
    label: 'Nivel Educativo de los Hijos',
    exactQuestion: '5. ¿En qué nivel educativo se encuentran tus hijos actualmente?',
    category: 'Demográfica',
    type: 'categorical',
    typeLabel: 'Opción Múltiple',
    multi: true,
    headerPattern: /nivel\s*educativo\s*se\s*encuentran\s*tus\s*hijos/i,
    description: 'Niveles escolares cursados actualmente por los hijos (opción múltiple).',
    scaleDescription: 'Opciones múltiples (Primaria, Secundaria, Preparatoria / Bachillerato, Universidad / Licenciatura)'
  },
  conocimientoIA: {
    code: 'P6',
    key: 'conocimientoIA',
    label: 'Grado de Conocimiento sobre la IA (1-5)',
    exactQuestion: '6. ¿Cuál es tu grado de conocimiento sobre qué es y cómo funciona la Inteligencia Artificial?',
    category: 'Percepción',
    type: 'quantitative',
    typeLabel: 'Cuantitativa Discreta',
    multi: false,
    headerPattern: /grado\s*de\s*conocimiento\s*sobre\s*qu[eé]\s*es/i,
    description: 'Autoevaluación del entendimiento sobre qué es y cómo funciona la IA.',
    scaleDescription: 'Escala numérica Likert de 1 (Conocimiento nulo o muy bajo) a 5 (Conocimiento avanzado / experto)',
    min: 1,
    max: 5
  },
  frecuenciaUsoHijo: {
    code: 'P7',
    key: 'frecuenciaUsoHijo',
    label: 'Frecuencia de Uso de IA por el Hijo',
    exactQuestion: '7. Hasta donde sabes, ¿con qué frecuencia utiliza tu hijo herramientas de IA (ChatGPT, buscadores integrados, etc.) para tareas escolares?',
    category: 'Uso y Hábitos',
    type: 'ordinal',
    typeLabel: 'Cualitativa Ordinal',
    multi: false,
    headerPattern: /frecuencia\s*utiliza\s*tu\s*hijo/i,
    description: 'Periodicidad con la que el hijo utiliza herramientas de IA para tareas.',
    scaleDescription: 'Nunca < Rara vez (1 o 2 al mes) < Varias veces por semana < Diariamente / No lo sé',
    order: [
      'Nunca',
      'Rara vez (1 o 2 veces al mes)',
      'Varias veces por semana',
      'Diariamente',
      'No lo sé'
    ]
  },
  usosPrincipalesIA: {
    code: 'P8',
    key: 'usosPrincipalesIA',
    label: 'Principales Usos de la IA',
    exactQuestion: '8. ¿Cuáles consideras que son los principales usos que tu hijo le da a la IA?',
    category: 'Uso y Hábitos',
    type: 'categorical',
    typeLabel: 'Opción Múltiple',
    multi: true,
    headerPattern: /principales\s*usos\s*que\s*tu\s*hijo\s*le\s*da/i,
    description: 'Finalidades para las que el estudiante recurre a la IA (opción múltiple).',
    scaleDescription: 'Dudas difíciles, redacción/ensayos, búsqueda rápida, matemáticas/programación, resúmenes, entretenimiento'
  },
  nivelSupervision: {
    code: 'P9',
    key: 'nivelSupervision',
    label: 'Nivel de Supervisión Parental',
    exactQuestion: '9. ¿Qué nivel de supervisión mantienes cuando tu hijo utiliza IA u otras herramientas digitales para estudiar?',
    category: 'Supervisión',
    type: 'ordinal',
    typeLabel: 'Cualitativa Ordinal',
    multi: false,
    headerPattern: /nivel\s*de\s*supervisi[oó]n\s*mantienes/i,
    description: 'Grado de acompañamiento y revisión cuando el hijo utiliza IA.',
    scaleDescription: 'Ninguna < Mínima o nula < Supervisión ocasional < Supervisión constante',
    order: [
      'Ninguna (No conozco las herramientas que utiliza)',
      'Mínima o nula (Confío en que lo use adecuadamente)',
      'Supervisión ocasional (Pregunto de vez en cuando)',
      'Supervisión constante (Reviso activamente qué usa y cómo)'
    ]
  },
  impactoGlobal: {
    code: 'P10',
    key: 'impactoGlobal',
    label: 'Percepción del Impacto Global en la Educación',
    exactQuestion: '10. ¿Cómo evalúas el impacto global que la Inteligencia Artificial está teniendo en la educación de tu hijo?',
    category: 'Percepción',
    type: 'ordinal',
    typeLabel: 'Cualitativa Ordinal',
    multi: false,
    headerPattern: /impacto\s*global\s*que\s*la\s*inteligencia\s*artificial/i,
    description: 'Evaluación general del efecto de la IA en la formación del estudiante.',
    scaleDescription: 'Muy negativo < Moderadamente negativo < Neutro < Moderadamente positivo < Muy positivo / No estoy seguro/a',
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
    code: 'P11',
    key: 'principalBeneficio',
    label: 'Principal Beneficio de la IA en el Aprendizaje',
    exactQuestion: '11. ¿Cuál consideras que es el PRINCIPAL beneficio de la IA en el aprendizaje?',
    category: 'Percepción',
    type: 'categorical',
    typeLabel: 'Cualitativa Nominal',
    multi: false,
    headerPattern: /PRINCIPAL\s*beneficio/i,
    description: 'Mayor ventaja percibida del uso pedagógico de la IA.',
    scaleDescription: 'Explicaciones personalizadas, apoyo en materias difíciles, ahorro de tiempo, habilidades tecnológicas, etc.'
  },
  principalRiesgo: {
    code: 'P12',
    key: 'principalRiesgo',
    label: 'Principal Riesgo del Uso de IA',
    exactQuestion: '12. ¿Cuál consideras que es el PRINCIPAL riesgo del uso de IA en los estudiantes?',
    category: 'Percepción',
    type: 'categorical',
    typeLabel: 'Cualitativa Nominal',
    multi: false,
    headerPattern: /PRINCIPAL\s*riesgo/i,
    description: 'Mayor peligro o desventaja identificada por los padres.',
    scaleDescription: 'Pérdida de pensamiento crítico, plagio, dependencia tecnológica, información falsa, pereza académica'
  },
  normativaEscuela: {
    code: 'P13',
    key: 'normativaEscuela',
    label: 'Normas Comunicadas por la Escuela',
    exactQuestion: '13. ¿La institución educativa de tu hijo ha comunicado normas o reglas claras sobre el uso de la IA?',
    category: 'Institucional',
    type: 'categorical',
    typeLabel: 'Cualitativa Nominal',
    multi: false,
    headerPattern: /normas\s*o\s*reglas\s*claras/i,
    description: 'Claridad en la comunicación institucional respecto a la IA.',
    scaleDescription: 'Sí, normas claras; Mencionaron de forma superficial; No han comunicado nada; No estoy seguro/a'
  },
  posturaEscuela: {
    code: 'P14',
    key: 'posturaEscuela',
    label: 'Postura Esperada de las Escuelas',
    exactQuestion: '14. ¿Qué postura crees que deberían adoptar las escuelas respecto al uso de la Inteligencia Artificial?',
    category: 'Institucional',
    type: 'categorical',
    typeLabel: 'Cualitativa Nominal',
    multi: false,
    headerPattern: /postura\s*crees\s*que\s*deber[ií]an\s*adoptar/i,
    description: 'Acción que los padres consideran que la escuela debería tomar.',
    scaleDescription: 'Enseñar éticamente e integrarla; Restringirla solo para ciertas actividades; Prohibir totalmente; No estoy seguro/a'
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
