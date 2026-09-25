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
 * TAB 2: Gráfico Univariable (Histograma con Curva de Densidad, Barras o Donut)
 * @param {string} domId 
 * @param {Array<string>} categories 
 * @param {Array<number>} values 
 * @param {string} chartType - 'bar' | 'pie' | 'histogram'
 * @param {string} varLabel 
 * @param {boolean} isQuantitative 
 */
export function renderUnivariateChart(domId, categories, values, chartType = 'bar', varLabel = '', isQuantitative = false) {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  if (!categories || categories.length === 0 || values.every(v => v === 0)) {
    showEmptyState(chart);
    return;
  }

  const total = values.reduce((a, b) => a + b, 0);

  // Si la variable es cuantitativa o se eligió histograma
  if (isQuantitative || chartType === 'histogram') {
    const option = {
      title: {
        text: `Histograma de Frecuencias y Curva de Densidad: ${varLabel}`,
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        formatter: (params) => {
          const item = params[0];
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return `
            <div style="font-weight:600; margin-bottom:4px;">Valor / Escala: ${item.name}</div>
            <div>Frecuencia Absoluta (fi): <strong>${item.value}</strong></div>
            <div>Frecuencia Relativa: <strong>${pct}%</strong></div>
          `;
        }
      },
      legend: {
        data: ['Frecuencia (Histograma)', 'Curva de Densidad / Tendencia'],
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#475569',
          fontSize: 12,
          fontWeight: 600,
          interval: 0
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
          name: 'Frecuencia (Histograma)',
          type: 'bar',
          data: values,
          barCategoryGap: '2%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#60a5fa' },
              { offset: 1, color: '#2563eb' }
            ]),
            borderColor: '#1d4ed8',
            borderWidth: 1.5,
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: '#1e293b',
            fontWeight: 600,
            fontSize: 11
          }
        },
        {
          name: 'Curva de Densidad / Tendencia',
          type: 'line',
          data: values,
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: '#f59e0b'
          },
          itemStyle: {
            color: '#f59e0b',
            borderWidth: 2,
            borderColor: '#ffffff'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 158, 11, 0.35)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
            ])
          }
        }
      ]
    };

    chart.setOption(option, true);
    return;
  }

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
 * TAB 3: Gráfico Bivariable (5 Opciones de Visualización)
 * @param {string} domId 
 * @param {string} vizType - 'Radar' | 'Barras Agrupadas' | 'Barras Apiladas 100%' | 'Mapa de Calor (Heatmap)' | 'Boxplot con Puntos / Dispersión (Jitter)'
 * @param {Object} contingencyData - resultado de calculateContingencyTable
 * @param {Object} boxplotScatterData - resultado de calculateBoxplotAndScatterData
 * @param {string} labelX 
 * @param {string} labelY 
 */
export function renderBivariateChart(domId, vizType, contingencyData, boxplotScatterData = null, labelX = '', labelY = '') {
  const chart = getOrCreateChart(domId);
  if (!chart) return;

  const { xCategories, yCategories, matrix, rowTotals, normalizedMatrix, grandTotal } = contingencyData;

  // 1. Boxplot con Puntos / Dispersión (Jitter)
  if (vizType === 'Boxplot con Puntos / Dispersión (Jitter)') {
    if (!boxplotScatterData || !boxplotScatterData.categories || boxplotScatterData.categories.length === 0) {
      showEmptyState(chart);
      return;
    }

    const { categories, boxplotData, scatterData, metricLabel, groupLabel } = boxplotScatterData;

    const option = {
      title: {
        text: `Diagrama de Caja y Bigotes con Jitter: ${metricLabel} por ${groupLabel}`,
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' }
      },
      tooltip: {
        trigger: 'item',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        formatter: (p) => {
          if (p.seriesType === 'boxplot') {
            const catName = categories[p.dataIndex];
            const [min, q1, med, q3, max] = p.data;
            return `
              <div style="font-weight:700; margin-bottom:4px; color:#2563eb;">${catName}</div>
              <div>Máximo: <strong>${max}</strong></div>
              <div>Q3 (75%): <strong>${q3}</strong></div>
              <div>Mediana: <strong>${med}</strong></div>
              <div>Q1 (25%): <strong>${q1}</strong></div>
              <div>Mínimo: <strong>${min}</strong></div>
            `;
          } else if (p.seriesType === 'scatter') {
            return `<div>${p.data[2] || `Valor: ${p.data[1]}`}</div>`;
          }
          return '';
        }
      },
      legend: {
        data: ['Distribución (Boxplot)', 'Encuestados (Jitter)'],
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '16%',
        top: '14%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        boundaryGap: true,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#475569',
          fontSize: 11,
          interval: 0,
          rotate: categories.length > 4 ? 25 : 0,
          formatter: (v) => v.length > 20 ? v.substring(0, 18) + '...' : v
        }
      },
      yAxis: {
        type: 'value',
        name: metricLabel,
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b' }
      },
      series: [
        {
          name: 'Distribución (Boxplot)',
          type: 'boxplot',
          data: boxplotData,
          itemStyle: {
            color: '#eff6ff',
            borderColor: '#2563eb',
            borderWidth: 2
          }
        },
        {
          name: 'Encuestados (Jitter)',
          type: 'scatter',
          data: scatterData,
          symbolSize: 8,
          itemStyle: {
            color: '#f59e0b',
            opacity: 0.85
          }
        }
      ]
    };

    chart.setOption(option, true);
    return;
  }

  // 2. Mapa de Calor (Heatmap)
  if (vizType === 'Mapa de Calor (Heatmap)') {
    if (!xCategories || !yCategories || grandTotal === 0) {
      showEmptyState(chart);
      return;
    }

    const heatmapData = [];
    let maxCount = 1;
    xCategories.forEach((x, xIdx) => {
      yCategories.forEach((y, yIdx) => {
        const count = (matrix[x] && matrix[x][y]) ? matrix[x][y] : 0;
        if (count > maxCount) maxCount = count;
        heatmapData.push([xIdx, yIdx, count]);
      });
    });

    const option = {
      title: {
        text: `Mapa de Calor: ${labelX} vs ${labelY}`,
        left: 'left',
        textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' }
      },
      tooltip: {
        position: 'top',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        formatter: (p) => {
          const xName = xCategories[p.data[0]];
          const yName = yCategories[p.data[1]];
          const count = p.data[2];
          const rowTot = rowTotals[xName] || 1;
          const pct = ((count / rowTot) * 100).toFixed(1);
          return `
            <div style="font-weight:600; margin-bottom:4px;">${xName} × ${yName}</div>
            <div>Frecuencia: <strong>${count}</strong> respuestas (${pct}% de la fila)</div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '18%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xCategories,
        splitArea: { show: true },
        axisLabel: {
          color: '#475569',
          fontSize: 11,
          interval: 0,
          rotate: xCategories.length > 4 ? 25 : 0,
          formatter: (v) => v.length > 20 ? v.substring(0, 18) + '...' : v
        }
      },
      yAxis: {
        type: 'category',
        data: yCategories,
        splitArea: { show: true },
        axisLabel: {
          color: '#475569',
          fontSize: 11,
          formatter: (v) => v.length > 25 ? v.substring(0, 23) + '...' : v
        }
      },
      visualMap: {
        min: 0,
        max: maxCount,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        inRange: {
          color: ['#f8fafc', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af']
        },
        textStyle: { color: '#64748b', fontSize: 11 }
      },
      series: [
        {
          name: 'Frecuencia',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            formatter: (p) => p.data[2] > 0 ? p.data[2] : '',
            color: '#1e293b',
            fontWeight: 600
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.4)'
            }
          }
        }
      ]
    };

    chart.setOption(option, true);
    return;
  }

  // Verificación común para Radar, Barras Agrupadas y Barras Apiladas
  if (!xCategories || xCategories.length === 0 || !yCategories || yCategories.length === 0 || grandTotal === 0) {
    showEmptyState(chart);
    return;
  }

  // 3. Radar
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
        textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' }
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
    return;
  }

  // 4. Barras Apiladas 100%
  if (vizType === 'Barras Apiladas 100%') {
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
        textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' }
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
    return;
  }

  // 5. Barras Agrupadas por defecto
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
      textStyle: { fontSize: 14, fontWeight: 600, color: '#1e293b' }
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
