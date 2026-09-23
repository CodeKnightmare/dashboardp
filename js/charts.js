/**
 * js/charts.js
 * Configuración y renderizado modular de visualizaciones interactivas con Apache ECharts.
 */

// Instancias activas de ECharts indexadas por el ID del elemento contenedor
const chartInstances = new Map();

// Paleta corporativa moderna para el dashboard
export const CHART_PALETTE = [
  '#2563eb', // Azul primario
  '#06b6d4', // Cyan
  '#10b981', // Verde esmeralda
  '#f59e0b', // Ámbar
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#3b82f6', // Azul claro
  '#6366f1', // Índigo
  '#14b8a6', // Turquesa
  '#f97316'  // Naranja
];

/**
 * Obtiene o inicializa la instancia de ECharts para un contenedor DOM dado.
 * @param {string} domId 
 * @returns {echarts.ECharts|null}
 */
export function getOrCreateChart(domId) {
  const container = document.getElementById(domId);
  if (!container) return null;

  let instance = echarts.getInstanceByDom(container);
  if (!instance) {
    instance = echarts.init(container, null, { renderer: 'svg' });
    chartInstances.set(domId, instance);
  }
  return instance;
}

/**
 * Exporta una gráfica como archivo vectorial SVG descargable.
 * @param {string} domId 
 * @param {string} filename 
 */
export function exportChartAsSVG(domId, filename = 'grafica') {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  const svgDataUrl = chart.getDataURL({
    type: 'svg',
    pixelRatio: 2,
    excludeComponents: ['toolbox']
  });

  const a = document.createElement('a');
  a.href = svgDataUrl;
  a.download = `grafica-${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Redimensiona todas las instancias activas de ECharts.
 */
export function resizeAllCharts() {
  chartInstances.forEach(instance => {
    if (instance && !instance.isDisposed()) {
      instance.resize();
    }
  });
}

/**
 * Muestra mensaje de "Sin datos disponibles" cuando el filtrado retorna 0 registros.
 * @param {echarts.ECharts} instance 
 * @param {string} message 
 */
function showEmptyState(instance, message = 'No se encontraron datos con los filtros seleccionados') {
  instance.clear();
  instance.setOption({
    title: {
      text: message,
      left: 'center',
      top: 'middle',
      textStyle: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: 'normal'
      }
    }
  });
}

/**
 * TAB 1: Gráfico Donut para Distribución (Nivel de Estudios u Ocupación)
 * @param {string} domId 
 * @param {Array<{name: string, value: number}>} data 
 * @param {string} title 
 */
export function renderDonutChart(domId, data, title = 'Distribución') {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    showEmptyState(chart);
    return;
  }

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  const option = {
    color: CHART_PALETTE,
    title: {
      text: title,
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1e293b' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#0f172a' },
      formatter: (params) => {
        const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
        return `
          <div style="font-weight:600; margin-bottom:4px;">${params.name}</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${params.color};"></span>
            <span>Respuestas: <strong>${params.value}</strong> (${pct}%)</span>
          </div>
        `;
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      type: 'scroll',
      textStyle: { color: '#64748b', fontSize: 11 }
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#ffffff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%'
          }
        },
        data: data
      }
    ]
  };

  chart.setOption(option, true);
}

/**
 * TAB 1: Gráfico de Barras Horizontales (Ranking de Riesgos o Beneficios)
 * @param {string} domId 
 * @param {Array<string>} categories 
 * @param {Array<number>} values 
 * @param {string} title 
 */
export function renderHorizontalBarChart(domId, categories, values, title = 'Ranking') {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  if (!categories || categories.length === 0 || values.every(v => v === 0)) {
    showEmptyState(chart);
    return;
  }

  // Ordenamos ascendente para que la categoría mayor quede arriba en el eje horizontal
  const combined = categories.map((cat, i) => ({ cat, val: values[i] }));
  combined.sort((a, b) => a.val - b.val);

  const sortedCategories = combined.map(c => c.cat);
  const sortedValues = combined.map(c => c.val);

  const option = {
    title: {
      text: title,
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1e293b' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#0f172a' },
      formatter: (params) => {
        const item = params[0];
        return `
          <div style="font-weight:600; margin-bottom:4px; max-width:280px; white-space:normal;">${item.name}</div>
          <div>Menciones: <strong>${item.value}</strong></div>
        `;
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '5%',
      top: '14%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.05],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'category',
      data: sortedCategories,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#475569',
        fontSize: 11,
        width: 170,
        overflow: 'truncate',
        formatter: (val) => val.length > 28 ? val.substring(0, 26) + '...' : val
      }
    },
    series: [
      {
        type: 'bar',
        data: sortedValues,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#2563eb' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          color: '#1e293b',
          fontWeight: 600,
          fontSize: 11
        }
      }
    ]
  };

  chart.setOption(option, true);
}

/**
 * TAB 1: Gráfico de Barras Apiladas (Impacto Global por Nivel de Supervisión)
 * @param {string} domId 
 * @param {Array<string>} xCategories 
 * @param {Array<{name: string, data: Array<number>}>} seriesData 
 * @param {Array<string>} legendData 
 * @param {string} title 
 */
export function renderStackedBarChart(domId, xCategories, seriesData, legendData, title = 'Percepción de Impacto por Nivel de Supervisión') {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  if (!xCategories || xCategories.length === 0 || seriesData.length === 0) {
    showEmptyState(chart);
    return;
  }

  const series = seriesData.map((s, idx) => ({
    name: s.name,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: s.data,
    color: CHART_PALETTE[idx % CHART_PALETTE.length]
  }));

  const option = {
    title: {
      text: title,
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1e293b' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#0f172a' },
      formatter: (params) => {
        let html = `<div style="font-weight:600; margin-bottom:6px;">${params[0].name}</div>`;
        let sum = 0;
        params.forEach(p => { sum += (p.value || 0); });
        params.forEach(p => {
          if (p.value > 0) {
            const pct = sum > 0 ? ((p.value / sum) * 100).toFixed(1) : 0;
            html += `
              <div style="display:flex; justify-content:space-between; gap:16px; margin-bottom:3px; font-size:12px;">
                <span style="display:flex; align-items:center; gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};"></span>
                  <span>${p.seriesName}:</span>
                </span>
                <span><strong>${p.value}</strong> (${pct}%)</span>
              </div>
            `;
          }
        });
        return html;
      }
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 11 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '14%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      axisLabel: {
        color: '#475569',
        fontSize: 11,
        interval: 0,
        formatter: (val) => {
          const clean = val.replace(/\s*\([^)]*\)/g, '').trim();
          return clean.length > 20 ? clean.substring(0, 18) + '...' : clean;
        }
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#64748b' }
    },
    series: series
  };

  chart.setOption(option, true);
}

/**
 * TAB 2: Gráfico Univariable (Permite alternar entre Barras y Donut)
 * @param {string} domId 
 * @param {Array<string>} categories 
 * @param {Array<number>} values 
 * @param {string} chartType - 'bar' o 'pie'
 * @param {string} varLabel 
 */
export function renderUnivariateChart(domId, categories, values, chartType = 'bar', varLabel = '') {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  if (!categories || categories.length === 0 || values.every(v => v === 0)) {
    showEmptyState(chart);
    return;
  }

  const total = values.reduce((a, b) => a + b, 0);

  if (chartType === 'pie') {
    const pieData = categories.map((cat, i) => ({ name: cat, value: values[i] }));
    const option = {
      color: CHART_PALETTE,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        formatter: (params) => {
          const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
          return `
            <div style="font-weight:600; margin-bottom:4px;">${params.name}</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${params.color};"></span>
              <span>Frecuencia: <strong>${params.value}</strong> (${pct}%)</span>
            </div>
          `;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      series: [
        {
          name: varLabel,
          type: 'pie',
          radius: ['42%', '70%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 11,
            color: '#475569'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold'
            }
          },
          data: pieData
        }
      ]
    };
    chart.setOption(option, true);
  } else {
    // Gráfico de Barras verticales
    const option = {
      color: ['#2563eb'],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        formatter: (params) => {
          const item = params[0];
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return `
            <div style="font-weight:600; margin-bottom:4px;">${item.name}</div>
            <div>Frecuencia: <strong>${item.value}</strong> (${pct}%)</div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#475569',
          fontSize: 11,
          interval: 0,
          rotate: categories.length > 5 ? 25 : 0,
          width: 90,
          overflow: 'truncate',
          formatter: (v) => v.length > 20 ? v.substring(0, 18) + '...' : v
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b' }
      },
      series: [
        {
          name: varLabel,
          type: 'bar',
          data: values,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#2563eb' }
            ])
          },
          label: {
            show: true,
            position: 'top',
            color: '#1e293b',
            fontWeight: 600,
            fontSize: 11
          }
        }
      ]
    };
    chart.setOption(option, true);
  }
}

/**
 * TAB 3: Gráfico Bivariable (Radar, Barras Agrupadas o Barras Apiladas 100%)
 * @param {string} domId 
 * @param {string} vizType - 'Radar', 'Barras Agrupadas', 'Barras Apiladas 100%'
 * @param {Object} contingencyData - resultado de calculateContingencyTable
 * @param {string} labelX 
 * @param {string} labelY 
 */
export function renderBivariateChart(domId, vizType, contingencyData, labelX = '', labelY = '') {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  const { xCategories, yCategories, matrix, rowTotals, normalizedMatrix, grandTotal } = contingencyData;

  if (!xCategories || xCategories.length === 0 || !yCategories || yCategories.length === 0 || grandTotal === 0) {
    showEmptyState(chart);
    return;
  }

  if (vizType === 'Radar') {
    let axes = xCategories;
    let seriesCats = yCategories;
    let getValue = (ax, ser) => matrix[ax] ? (matrix[ax][ser] || 0) : 0;

    // Si X tiene menos de 3 categorías y Y tiene 3 o más, invertimos para que el polígono tenga al menos 3 vértices
    if (xCategories.length < 3 && yCategories.length >= 3) {
      axes = yCategories;
      seriesCats = xCategories;
      getValue = (ax, ser) => matrix[ser] ? (matrix[ser][ax] || 0) : 0;
    }

    let maxValue = 1;
    seriesCats.forEach(ser => {
      axes.forEach(ax => {
        const val = getValue(ax, ser);
        if (val > maxValue) maxValue = val;
      });
    });

    const indicators = axes.map(ax => {
      const clean = ax.replace(/\s*\([^)]*\)/g, '').trim();
      return {
        name: clean.length > 20 ? clean.substring(0, 18) + '...' : clean,
        max: Math.ceil(maxValue * 1.15) || 5
      };
    });

    const seriesData = seriesCats.map((ser, idx) => {
      const vals = axes.map(ax => getValue(ax, ser));
      return {
        value: vals,
        name: ser,
        itemStyle: { color: CHART_PALETTE[idx % CHART_PALETTE.length] },
        areaStyle: { opacity: 0.18 }
      };
    });

    const option = {
      color: CHART_PALETTE,
      title: {
        text: `Perfil Multidimensional: ${labelX} vs ${labelY}`,
        left: 'left',
        textStyle: { fontSize: 15, fontWeight: 600, color: '#1e293b' }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' }
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#475569',
          fontSize: 11,
          fontWeight: 500
        },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['#f8fafc', '#ffffff']
          }
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      series: [
        {
          type: 'radar',
          data: seriesData
        }
      ]
    };

    chart.setOption(option, true);

  } else if (vizType === 'Barras Apiladas 100%') {
    // Normalizado al 100% por categoría de X
    const series = yCategories.map((y, idx) => {
      const data = xCategories.map(x => normalizedMatrix[x][y] || 0);
      return {
        name: y,
        type: 'bar',
        stack: 'total100',
        emphasis: { focus: 'series' },
        data: data,
        color: CHART_PALETTE[idx % CHART_PALETTE.length]
      };
    });

    const option = {
      title: {
        text: `Distribución Porcentual Relativa (100%): ${labelX} vs ${labelY}`,
        left: 'left',
        textStyle: { fontSize: 15, fontWeight: 600, color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        formatter: (params) => {
          let html = `<div style="font-weight:600; margin-bottom:6px;">${params[0].name}</div>`;
          params.forEach(p => {
            const absCount = matrix[p.name] ? (matrix[p.name][p.seriesName] || 0) : 0;
            html += `
              <div style="display:flex; justify-content:space-between; gap:16px; margin-bottom:3px; font-size:12px;">
                <span style="display:flex; align-items:center; gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};"></span>
                  <span>${p.seriesName}:</span>
                </span>
                <span><strong>${p.value}%</strong> (${absCount})</span>
              </div>
            `;
          });
          return html;
        }
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '14%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xCategories,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#475569',
          fontSize: 11,
          interval: 0,
          rotate: xCategories.length > 5 ? 25 : 0,
          width: 90,
          overflow: 'truncate',
          formatter: (v) => v.length > 18 ? v.substring(0, 16) + '...' : v
        }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%', color: '#64748b' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      series: series
    };

    chart.setOption(option, true);

  } else {
    // Barras Agrupadas por defecto
    const series = yCategories.map((y, idx) => {
      const data = xCategories.map(x => matrix[x][y] || 0);
      return {
        name: y,
        type: 'bar',
        data: data,
        emphasis: { focus: 'series' },
        color: CHART_PALETTE[idx % CHART_PALETTE.length]
      };
    });

    const option = {
      title: {
        text: `Frecuencias Cruzadas: ${labelX} vs ${labelY}`,
        left: 'left',
        textStyle: { fontSize: 15, fontWeight: 600, color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' }
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '14%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xCategories,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#475569',
          fontSize: 11,
          interval: 0,
          rotate: xCategories.length > 5 ? 25 : 0,
          width: 90,
          overflow: 'truncate',
          formatter: (v) => v.length > 18 ? v.substring(0, 16) + '...' : v
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b' }
      },
      series: series
    };

    chart.setOption(option, true);
  }
}
