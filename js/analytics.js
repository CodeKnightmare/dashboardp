/**
 * js/analytics.js
 * Cálculos estadísticos descriptivos, tablas de frecuencia, contingencia y filtrado reactivo.
 */

import { VARIABLE_DEFINITIONS, splitMultiValue } from './dataLoader.js';

/**
 * Filtra el dataset en base a los criterios activos del sidebar.
 * @param {Array<Object>} dataset 
 * @param {Object} filters 
 * @returns {Array<Object>}
 */
export function filterData(dataset, filters = {}) {
  if (!dataset || !dataset.length) return [];

  return dataset.filter(row => {
    // 1. Nivel de Estudios
    if (filters.nivelEstudios && filters.nivelEstudios !== 'TODOS') {
      if (row.nivelEstudios !== filters.nivelEstudios) return false;
    }

    // 2. Ingreso Familiar
    if (filters.ingresoFamiliar && filters.ingresoFamiliar !== 'TODOS') {
      if (row.ingresoFamiliar !== filters.ingresoFamiliar) return false;
    }

    // 3. Nivel Educativo de los Hijos (multiselección)
    if (filters.nivelHijos && Array.isArray(filters.nivelHijos) && filters.nivelHijos.length > 0) {
      if (!filters.nivelHijos.includes('TODOS')) {
        const rowLevels = row.nivelHijosList || splitMultiValue(row.nivelHijos);
        // Debe coincidir con al menos uno de los niveles seleccionados
        const hasMatch = filters.nivelHijos.some(selected => rowLevels.includes(selected));
        if (!hasMatch) return false;
      }
    }

    // 4. Nivel de Supervisión
    if (filters.nivelSupervision && filters.nivelSupervision !== 'TODOS') {
      if (row.nivelSupervision !== filters.nivelSupervision) return false;
    }

    // 5. Frecuencia de Uso
    if (filters.frecuenciaUsoHijo && filters.frecuenciaUsoHijo !== 'TODOS') {
      if (row.frecuenciaUsoHijo !== filters.frecuenciaUsoHijo) return false;
    }

    // 6. Grado de Conocimiento IA (Rango Min - Max)
    const minConocimiento = filters.conocimientoMin !== undefined ? Number(filters.conocimientoMin) : 1;
    const maxConocimiento = filters.conocimientoMax !== undefined ? Number(filters.conocimientoMax) : 5;
    const rowConocimiento = Number(row.conocimientoIA) || 0;
    if (rowConocimiento < minConocimiento || rowConocimiento > maxConocimiento) {
      return false;
    }

    // 7. Impacto Global (Botones rápidos o valor exacto)
    if (filters.impactoGlobal && filters.impactoGlobal !== 'TODOS') {
      const imp = (row.impactoGlobal || '').toLowerCase();
      if (filters.impactoGlobal === 'Positivo') {
        if (!imp.includes('positivo')) return false;
      } else if (filters.impactoGlobal === 'Neutro') {
        if (!imp.includes('neutro')) return false;
      } else if (filters.impactoGlobal === 'Negativo') {
        if (!imp.includes('negativo')) return false;
      } else {
        if (row.impactoGlobal !== filters.impactoGlobal) return false;
      }
    }

    return true;
  });
}

/**
 * Calcula los 4 KPIs principales para el Tab 1 (Resumen General).
 * @param {Array<Object>} data 
 * @param {number} totalOriginal
 * @returns {Object}
 */
export function calculateKPIs(data, totalOriginal = 0) {
  const total = data.length;
  if (total === 0) {
    return {
      total: 0,
      totalOriginal,
      percentOfOriginal: 0,
      avgConocimiento: '0.00',
      modaSupervision: 'N/A',
      modaSupervisionFreq: 0,
      modaSupervisionPercent: 0,
      percentImpactoPositivo: '0.0%'
    };
  }

  // 1. Promedio Conocimiento IA
  const sumConocimiento = data.reduce((acc, row) => acc + (Number(row.conocimientoIA) || 0), 0);
  const avgConocimiento = (sumConocimiento / total).toFixed(2);

  // 2. Moda Nivel de Supervisión
  const supCounts = {};
  data.forEach(row => {
    const val = row.nivelSupervision || 'Sin respuesta';
    supCounts[val] = (supCounts[val] || 0) + 1;
  });

  let modaSupervision = 'N/A';
  let maxSupCount = -1;
  Object.entries(supCounts).forEach(([cat, count]) => {
    if (count > maxSupCount) {
      maxSupCount = count;
      modaSupervision = cat;
    }
  });
  const modaSupervisionPercent = total > 0 ? ((maxSupCount / total) * 100).toFixed(1) : 0;

  // 3. % Impacto Positivo
  const positivosCount = data.filter(row => {
    const imp = (row.impactoGlobal || '').toLowerCase();
    return imp.includes('positivo');
  }).length;
  const percentImpactoPositivo = ((positivosCount / total) * 100).toFixed(1);

  const percentOfOriginal = totalOriginal > 0 ? ((total / totalOriginal) * 100).toFixed(1) : 100;

  return {
    total,
    totalOriginal: totalOriginal || total,
    percentOfOriginal,
    avgConocimiento,
    modaSupervision,
    modaSupervisionFreq: maxSupCount,
    modaSupervisionPercent,
    percentImpactoPositivo: `${percentImpactoPositivo}%`
  };
}

/**
 * Calcula estadísticas descriptivas para una variable dada.
 * Si es cuantitativa: Media, Mediana, Moda, Varianza, Desviación Estándar, Rango (Min, Max).
 * Si es cualitativa: Moda, Frecuencia absoluta de la moda, % de la moda, Número de categorías únicas.
 * @param {Array<Object>} data 
 * @param {string} varKey 
 * @returns {Object}
 */
export function calculateDescriptiveStats(data, varKey) {
  const def = VARIABLE_DEFINITIONS[varKey];
  if (!def || !data || data.length === 0) {
    return { isQuantitative: false, isEmpty: true };
  }

  if (def.type === 'quantitative') {
    // Variable numérica (ej: conocimientoIA)
    const values = data.map(r => Number(r[varKey]) || 0).sort((a, b) => a - b);
    const n = values.length;

    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Mediana
    let median = 0;
    if (n % 2 === 0) {
      median = (values[n / 2 - 1] + values[n / 2]) / 2;
    } else {
      median = values[Math.floor(n / 2)];
    }

    // Moda
    const freq = {};
    let maxF = 0;
    values.forEach(v => {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxF) maxF = freq[v];
    });
    const modes = Object.keys(freq).filter(k => freq[k] === maxF).map(Number);
    const modeStr = modes.join(', ');

    // Varianza y Desviación Estándar muestral (n - 1)
    let variance = 0;
    if (n > 1) {
      const sumSquares = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
      variance = sumSquares / (n - 1);
    }
    const stdDev = Math.sqrt(variance);

    const min = values[0];
    const max = values[n - 1];
    const range = max - min;

    return {
      isQuantitative: true,
      n,
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      mode: modeStr,
      modeFreq: maxF,
      variance: variance.toFixed(3),
      stdDev: stdDev.toFixed(3),
      min,
      max,
      range
    };
  } else {
    // Variable cualitativa / ordinal
    const freq = {};
    let totalItems = 0;

    data.forEach(r => {
      if (def.multi) {
        const list = r[`${varKey}List`] || splitMultiValue(r[varKey]);
        list.forEach(val => {
          const item = val.trim();
          if (item) {
            freq[item] = (freq[item] || 0) + 1;
            totalItems++;
          }
        });
      } else {
        const item = String(r[varKey] || 'Sin respuesta').trim();
        if (item) {
          freq[item] = (freq[item] || 0) + 1;
          totalItems++;
        }
      }
    });

    let maxF = 0;
    let modeCategory = 'N/A';
    const categories = Object.keys(freq);

    categories.forEach(cat => {
      if (freq[cat] > maxF) {
        maxF = freq[cat];
        modeCategory = cat;
      }
    });

    const modePercent = totalItems > 0 ? ((maxF / totalItems) * 100).toFixed(1) : 0;
    const modePercentOfRespondents = data.length > 0 ? ((maxF / data.length) * 100).toFixed(1) : 0;

    return {
      isQuantitative: false,
      n: data.length,
      totalMentions: totalItems,
      isMulti: !!def.multi,
      uniqueCategories: categories.length,
      mode: modeCategory,
      modeFreq: maxF,
      modePercent: `${modePercent}%`,
      modePercentOfRespondents: `${modePercentOfRespondents}%`
    };
  }
}

/**
 * Genera la tabla completa de frecuencias (fi, hi, %, Fi, Hi%).
 * @param {Array<Object>} data 
 * @param {string} varKey 
 * @returns {{ rows: Array<Object>, totals: Object, isMulti: boolean }}
 */
export function calculateFrequencyTable(data, varKey) {
  const def = VARIABLE_DEFINITIONS[varKey];
  if (!def || !data || data.length === 0) {
    return { rows: [], totals: { fi: 0, hi: 0, percent: 0 }, isMulti: false };
  }

  const freqMap = new Map();
  let totalCount = 0;

  data.forEach(r => {
    if (def.multi) {
      const list = r[`${varKey}List`] || splitMultiValue(r[varKey]);
      list.forEach(val => {
        const trimmed = val.trim();
        if (trimmed) {
          freqMap.set(trimmed, (freqMap.get(trimmed) || 0) + 1);
          totalCount++;
        }
      });
    } else {
      let val = r[varKey];
      if (val === undefined || val === null || String(val).trim() === '') {
        val = 'Sin respuesta';
      }
      val = String(val).trim();
      freqMap.set(val, (freqMap.get(val) || 0) + 1);
      totalCount++;
    }
  });

  // Ordenamiento de categorías
  let categories = Array.from(freqMap.keys());

  if (def.order && Array.isArray(def.order)) {
    // Orden predefinido para variables ordinales
    categories.sort((a, b) => {
      const idxA = def.order.indexOf(a);
      const idxB = def.order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  } else if (def.type === 'quantitative') {
    // Orden numérico
    categories.sort((a, b) => Number(a) - Number(b));
  } else {
    // Orden por frecuencia descendente
    categories.sort((a, b) => freqMap.get(b) - freqMap.get(a));
  }

  let accumulatedFi = 0;
  let accumulatedHi = 0;

  const rows = categories.map(cat => {
    const fi = freqMap.get(cat) || 0;
    const hi = totalCount > 0 ? (fi / totalCount) : 0;
    const percent = hi * 100;
    accumulatedFi += fi;
    accumulatedHi += hi;

    // Si es multiselección, también calculamos el porcentaje respecto a los encuestados (N)
    const percentRespondents = data.length > 0 ? ((fi / data.length) * 100).toFixed(1) : 0;

    return {
      category: cat,
      fi,
      hi: Number(hi.toFixed(4)),
      percent: Number(percent.toFixed(2)),
      Fi: accumulatedFi,
      Hi: Number(accumulatedHi.toFixed(4)),
      HiPercent: Number((accumulatedHi * 100).toFixed(2)),
      percentRespondents: `${percentRespondents}%`
    };
  });

  const totals = {
    fi: totalCount,
    hi: (1.0).toFixed(4),
    percent: (100.0).toFixed(2),
    respondentsCount: data.length
  };

  return {
    rows,
    totals,
    isMulti: !!def.multi
  };
}

/**
 * Genera la matriz de contingencia de doble entrada para cruzar Variable X y Variable Y.
 * @param {Array<Object>} data 
 * @param {string} varXKey 
 * @param {string} varYKey 
 * @param {boolean} normalizeRows - Si true, calcula porcentajes por fila (suma 100%)
 * @returns {Object}
 */
export function calculateContingencyTable(data, varXKey, varYKey, normalizeRows = false) {
  const defX = VARIABLE_DEFINITIONS[varXKey];
  const defY = VARIABLE_DEFINITIONS[varYKey];

  if (!defX || !defY || !data || data.length === 0) {
    return {
      xCategories: [],
      yCategories: [],
      matrix: [],
      rowTotals: [],
      colTotals: [],
      grandTotal: 0,
      normalizedMatrix: []
    };
  }

  // Obtener categorías únicas respetando orden si existe
  const getCategories = (key, def) => {
    const set = new Set();
    data.forEach(r => {
      if (def.multi) {
        const list = r[`${key}List`] || splitMultiValue(r[key]);
        list.forEach(v => { if (v.trim()) set.add(v.trim()); });
      } else {
        const v = String(r[key] || 'Sin respuesta').trim();
        if (v) set.add(v);
      }
    });

    const arr = Array.from(set);
    if (def.order) {
      arr.sort((a, b) => {
        const idxA = def.order.indexOf(a);
        const idxB = def.order.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
    } else if (def.type === 'quantitative') {
      arr.sort((a, b) => Number(a) - Number(b));
    } else {
      arr.sort();
    }
    return arr;
  };

  const xCategories = getCategories(varXKey, defX);
  const yCategories = getCategories(varYKey, defY);

  // Inicializar matriz de conteo
  const countMatrix = {};
  xCategories.forEach(x => {
    countMatrix[x] = {};
    yCategories.forEach(y => {
      countMatrix[x][y] = 0;
    });
  });

  // Llenar conteos
  data.forEach(r => {
    let xVals = defX.multi ? (r[`${varXKey}List`] || splitMultiValue(r[varXKey])) : [String(r[varXKey] || 'Sin respuesta').trim()];
    let yVals = defY.multi ? (r[`${varYKey}List`] || splitMultiValue(r[varYKey])) : [String(r[varYKey] || 'Sin respuesta').trim()];

    xVals.forEach(x => {
      const cleanX = x.trim();
      if (!countMatrix[cleanX]) return;
      yVals.forEach(y => {
        const cleanY = y.trim();
        if (countMatrix[cleanX][cleanY] !== undefined) {
          countMatrix[cleanX][cleanY]++;
        }
      });
    });
  });

  // Totales marginales por fila
  const rowTotals = {};
  xCategories.forEach(x => {
    rowTotals[x] = yCategories.reduce((acc, y) => acc + countMatrix[x][y], 0);
  });

  // Totales marginales por columna
  const colTotals = {};
  yCategories.forEach(y => {
    colTotals[y] = xCategories.reduce((acc, x) => acc + countMatrix[x][y], 0);
  });

  // Gran Total
  const grandTotal = Object.values(rowTotals).reduce((acc, v) => acc + v, 0);

  // Matriz normalizada al 100% por fila
  const normalizedMatrix = {};
  xCategories.forEach(x => {
    normalizedMatrix[x] = {};
    const totalRow = rowTotals[x] || 0;
    yCategories.forEach(y => {
      const count = countMatrix[x][y];
      normalizedMatrix[x][y] = totalRow > 0 ? Number(((count / totalRow) * 100).toFixed(1)) : 0;
    });
  });

  return {
    xCategories,
    yCategories,
    matrix: countMatrix,
    rowTotals,
    colTotals,
    grandTotal,
    normalizedMatrix
  };
}

/**
 * Calcula los metadatos y cardinalidad dinámica de cada variable del cuestionario.
 * @param {Array<Object>} data 
 * @returns {Array<Object>}
 */
export function calculateDictionaryMetadata(data) {
  return Object.values(VARIABLE_DEFINITIONS).map(def => {
    const uniqueSet = new Set();
    data.forEach(r => {
      if (def.multi) {
        const list = r[`${def.key}List`] || splitMultiValue(r[def.key]);
        list.forEach(v => { if (v.trim()) uniqueSet.add(v.trim()); });
      } else {
        const v = String(r[def.key] !== undefined && r[def.key] !== null ? r[def.key] : '').trim();
        if (v) uniqueSet.add(v);
      }
    });

    const resolvedType = def.multi ? 'multi' : (def.type === 'categorical' ? 'nominal' : def.type);

    return {
      code: def.code,
      key: def.key,
      label: def.label,
      exactQuestion: def.exactQuestion,
      type: resolvedType,
      typeLabel: def.typeLabel,
      category: def.category,
      scaleDescription: def.scaleDescription,
      cardinality: uniqueSet.size,
      sampleValues: Array.from(uniqueSet).slice(0, 5)
    };
  });
}

/**
 * Calcula estadísticas para Boxplot y puntos individuales con Jitter determinista.
 * @param {Array<Object>} data 
 * @param {string} varXKey 
 * @param {string} varYKey 
 * @returns {Object}
 */
export function calculateBoxplotAndScatterData(data, varXKey, varYKey) {
  const defX = VARIABLE_DEFINITIONS[varXKey];
  const defY = VARIABLE_DEFINITIONS[varYKey];

  if (!defX || !defY || !data || data.length === 0) {
    return { categories: [], boxplotData: [], scatterData: [], metricLabel: '', groupLabel: '' };
  }

  // Identificar cuál variable será la métrica numérica continua
  let metricKey = 'conocimientoIA';
  let groupKey = varXKey;

  if (defY.type === 'quantitative') {
    metricKey = varYKey;
    groupKey = varXKey;
  } else if (defX.type === 'quantitative') {
    metricKey = varXKey;
    groupKey = varYKey;
  } else {
    if (defY.order && defY.order.length > 0) {
      metricKey = varYKey;
      groupKey = varXKey;
    } else {
      metricKey = 'conocimientoIA';
      groupKey = varXKey;
    }
  }

  const defGroup = VARIABLE_DEFINITIONS[groupKey];
  const defMetric = VARIABLE_DEFINITIONS[metricKey];

  // Obtener categorías únicas del grupo respetando orden si existe
  const groupSet = new Set();
  data.forEach(r => {
    if (defGroup.multi) {
      const list = r[`${groupKey}List`] || splitMultiValue(r[groupKey]);
      list.forEach(v => { if (v.trim()) groupSet.add(v.trim()); });
    } else {
      const v = String(r[groupKey] || 'Sin respuesta').trim();
      if (v) groupSet.add(v);
    }
  });

  const categories = Array.from(groupSet);
  if (defGroup.order) {
    categories.sort((a, b) => {
      const idxA = defGroup.order.indexOf(a);
      const idxB = defGroup.order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  } else {
    categories.sort();
  }

  const groupValuesMap = new Map();
  categories.forEach(c => groupValuesMap.set(c, []));

  data.forEach((r, rowIdx) => {
    let rawVal = r[metricKey];
    let numVal = 0;
    if (defMetric.type === 'quantitative') {
      numVal = Number(rawVal) || 0;
    } else if (defMetric.order) {
      const idx = defMetric.order.indexOf(String(rawVal).trim());
      numVal = idx !== -1 ? idx + 1 : 1;
    } else {
      numVal = Number(r.conocimientoIA) || 0;
    }

    const gVals = defGroup.multi
      ? (r[`${groupKey}List`] || splitMultiValue(r[groupKey]))
      : [String(r[groupKey] || 'Sin respuesta').trim()];

    gVals.forEach(g => {
      const cleanG = g.trim();
      if (groupValuesMap.has(cleanG)) {
        groupValuesMap.get(cleanG).push({ val: numVal, id: r.id || (rowIdx + 1) });
      }
    });
  });

  const getPercentile = (sortedArr, p) => {
    if (!sortedArr.length) return 0;
    const index = (sortedArr.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
  };

  const boxplotData = [];
  const scatterData = [];

  categories.forEach((cat, catIdx) => {
    const items = groupValuesMap.get(cat) || [];
    const values = items.map(it => it.val).sort((a, b) => a - b);

    if (values.length === 0) {
      boxplotData.push([0, 0, 0, 0, 0]);
    } else {
      const min = values[0];
      const q1 = Number(getPercentile(values, 0.25).toFixed(2));
      const median = Number(getPercentile(values, 0.50).toFixed(2));
      const q3 = Number(getPercentile(values, 0.75).toFixed(2));
      const max = values[values.length - 1];
      boxplotData.push([min, q1, median, q3, max]);
    }

    // Jitter determinista
    items.forEach((it, itemIdx) => {
      const pseudoRandom = Math.sin((itemIdx + 1) * 37.17 + (catIdx + 1) * 91.53);
      const jitter = pseudoRandom * 0.22;
      scatterData.push([
        Number((catIdx + jitter).toFixed(3)),
        it.val,
        `Encuestado #${it.id} (${cat}): ${it.val}`
      ]);
    });
  });

  return {
    categories,
    boxplotData,
    scatterData,
    metricLabel: defMetric.label,
    groupLabel: defGroup.label
  };
}
