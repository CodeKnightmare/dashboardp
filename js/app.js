/**
 * js/app.js
 * Coordinador general de la aplicación, manejo de estados, eventos del DOM y ciclo reactivo.
 */

import {
  VARIABLE_DEFINITIONS,
  loadDefaultCSV,
  loadCSVFromFile,
  splitMultiValue
} from './dataLoader.js';

import {
  filterData,
  calculateKPIs,
  calculateDescriptiveStats,
  calculateFrequencyTable,
  calculateContingencyTable
} from './analytics.js';

import {
  renderDonutChart,
  renderHorizontalBarChart,
  renderStackedBarChart,
  renderUnivariateChart,
  renderBivariateChart,
  exportChartAsSVG,
  resizeAllCharts
} from './charts.js';

// Estado global reactivo
const state = {
  rawData: [],
  filteredData: [],
  filters: {
    nivelEstudios: 'TODOS',
    ingresoFamiliar: 'TODOS',
    nivelHijos: [], // Array de strings seleccionados
    nivelSupervision: 'TODOS',
    frecuenciaUsoHijo: 'TODOS',
    conocimientoMin: 1,
    conocimientoMax: 5,
    impactoGlobal: 'TODOS'
  },
  activeTab: 'tabResumen',
  univariate: {
    selectedVar: 'nivelEstudios',
    chartType: 'bar' // 'bar' | 'pie'
  },
  bivariate: {
    varX: 'nivelSupervision',
    varY: 'impactoGlobal',
    vizType: 'Barras Agrupadas' // 'Barras Agrupadas' | 'Barras Apiladas 100%' | 'Radar'
  },
  tab1DonutVar: 'nivelEstudios'
};

// Elementos del DOM
const dom = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  sidebar: document.getElementById('sidebar'),
  btnToggleSidebar: document.getElementById('btnToggleSidebar'),
  csvFileInput: document.getElementById('csvFileInput'),
  fileNameDisplay: document.getElementById('fileNameDisplay'),
  filterNivelEstudios: document.getElementById('filterNivelEstudios'),
  filterIngresoFamiliar: document.getElementById('filterIngresoFamiliar'),
  filterNivelHijosChips: document.getElementById('filterNivelHijosChips'),
  filterNivelSupervision: document.getElementById('filterNivelSupervision'),
  filterFrecuenciaUsoHijo: document.getElementById('filterFrecuenciaUsoHijo'),
  filterConocimientoMin: document.getElementById('filterConocimientoMin'),
  conocimientoDisplay: document.getElementById('conocimientoDisplay'),
  quickImpactoButtons: document.getElementById('quickImpactoButtons'),
  btnResetFilters: document.getElementById('btnResetFilters'),
  filterCountDisplay: document.getElementById('filterCountDisplay'),
  headerDatasetStatus: document.getElementById('headerDatasetStatus'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),

  // Tab 1
  kpiTotal: document.getElementById('kpiTotal'),
  kpiTotalSub: document.getElementById('kpiTotalSub'),
  kpiConocimiento: document.getElementById('kpiConocimiento'),
  kpiSupervision: document.getElementById('kpiSupervision'),
  kpiSupervisionSub: document.getElementById('kpiSupervisionSub'),
  kpiPositivo: document.getElementById('kpiPositivo'),
  toggleDonutVar: document.getElementById('toggleDonutVar'),
  donutTitleText: document.getElementById('donutTitleText'),

  // Tab 2
  selectUnivariateVar: document.getElementById('selectUnivariateVar'),
  btnViewBar: document.getElementById('btnViewBar'),
  btnViewPie: document.getElementById('btnViewPie'),
  univariateStatsRow: document.getElementById('univariateStatsRow'),
  frequencyTableBody: document.getElementById('frequencyTableBody'),
  frequencyTableFoot: document.getElementById('frequencyTableFoot'),
  univariateChartTitle: document.getElementById('univariateChartTitle'),
  tableSubtitle: document.getElementById('tableSubtitle'),

  // Tab 3
  selectBivarX: document.getElementById('selectBivarX'),
  selectBivarY: document.getElementById('selectBivarY'),
  selectBivarVizType: document.getElementById('selectBivarVizType'),
  bivariateChartTitle: document.getElementById('bivariateChartTitle'),
  contingencyTableWrapper: document.getElementById('contingencyTableWrapper')
};

/**
 * Inicialización al cargar el DOM.
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();

  try {
    showLoading(true);
    const { data, fileName } = await loadDefaultCSV();
    initDataset(data, fileName);
  } catch (error) {
    console.error('Error cargando dataset inicial:', error);
    alert('No se pudo cargar el archivo CSV por defecto automáticamente. Por favor, selecciona el archivo manualmente usando el botón "Cargar otro CSV" en la barra lateral.');
    if (dom.fileNameDisplay) {
      dom.fileNameDisplay.textContent = 'Selecciona un archivo CSV...';
    }
  } finally {
    showLoading(false);
  }
});

/**
 * Configura los datos cargados y llena los controles.
 * @param {Array<Object>} data 
 * @param {string} fileName 
 */
function initDataset(data, fileName = 'Estudio_ IA en la Educación.csv') {
  state.rawData = data;
  state.filteredData = [...data];

  if (dom.fileNameDisplay) {
    dom.fileNameDisplay.textContent = fileName;
    dom.fileNameDisplay.title = fileName;
  }

  if (dom.headerDatasetStatus) {
    dom.headerDatasetStatus.textContent = `${data.length} encuestas activas`;
  }

  // Llenar selectores del sidebar con opciones únicas del dataset
  populateSidebarOptions();

  // Llenar selectores de Tab 2 y Tab 3
  populateVariablesSelectors();

  // Actualizar vistas
  applyFiltersAndRender();
}

/**
 * Llena dinámicamente los dropdowns y chips del sidebar con valores únicos.
 */
function populateSidebarOptions() {
  const getUniqueValues = (key, isMulti = false, preOrder = null) => {
    const set = new Set();
    state.rawData.forEach(row => {
      if (isMulti) {
        const list = row[`${key}List`] || splitMultiValue(row[key]);
        list.forEach(v => { if (v.trim()) set.add(v.trim()); });
      } else {
        const v = String(row[key] || '').trim();
        if (v) set.add(v);
      }
    });

    const arr = Array.from(set);
    if (preOrder && Array.isArray(preOrder)) {
      arr.sort((a, b) => {
        const idxA = preOrder.indexOf(a);
        const idxB = preOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
    } else {
      arr.sort();
    }
    return arr;
  };

  // 1. Nivel de Estudios
  const defEstudios = VARIABLE_DEFINITIONS.nivelEstudios;
  const estudiosList = getUniqueValues('nivelEstudios', false, defEstudios.order);
  dom.filterNivelEstudios.innerHTML = '<option value="TODOS">Todos los niveles</option>';
  estudiosList.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    dom.filterNivelEstudios.appendChild(opt);
  });

  // 2. Ingreso Familiar
  const defIngreso = VARIABLE_DEFINITIONS.ingresoFamiliar;
  const ingresoList = getUniqueValues('ingresoFamiliar', false, defIngreso.order);
  dom.filterIngresoFamiliar.innerHTML = '<option value="TODOS">Todos los rangos</option>';
  ingresoList.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    dom.filterIngresoFamiliar.appendChild(opt);
  });

  // 3. Chips Nivel Hijos (multiselección)
  const hijosList = getUniqueValues('nivelHijos', true);
  dom.filterNivelHijosChips.innerHTML = '';
  hijosList.forEach(level => {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.textContent = level;
    chip.dataset.level = level;
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const activeChips = Array.from(dom.filterNivelHijosChips.querySelectorAll('.filter-chip.active'))
        .map(c => c.dataset.level);
      state.filters.nivelHijos = activeChips;
      applyFiltersAndRender();
    });
    dom.filterNivelHijosChips.appendChild(chip);
  });

  // 4. Nivel de Supervisión
  const defSup = VARIABLE_DEFINITIONS.nivelSupervision;
  const supList = getUniqueValues('nivelSupervision', false, defSup.order);
  dom.filterNivelSupervision.innerHTML = '<option value="TODOS">Todos los niveles</option>';
  supList.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    dom.filterNivelSupervision.appendChild(opt);
  });

  // 5. Frecuencia de Uso
  const defFrec = VARIABLE_DEFINITIONS.frecuenciaUsoHijo;
  const frecList = getUniqueValues('frecuenciaUsoHijo', false, defFrec.order);
  dom.filterFrecuenciaUsoHijo.innerHTML = '<option value="TODOS">Todas las frecuencias</option>';
  frecList.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    dom.filterFrecuenciaUsoHijo.appendChild(opt);
  });
}

/**
 * Llena los selectores de variables para el Tab 2 (Univariable) y Tab 3 (Bivariable).
 */
function populateVariablesSelectors() {
  const vars = Object.values(VARIABLE_DEFINITIONS);

  // Tab 2: Selector Univariable
  dom.selectUnivariateVar.innerHTML = '';
  vars.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.key;
    opt.textContent = `${v.label} (${v.category})`;
    if (v.key === state.univariate.selectedVar) opt.selected = true;
    dom.selectUnivariateVar.appendChild(opt);
  });

  // Tab 3: Selector Bivariable X e Y
  dom.selectBivarX.innerHTML = '';
  dom.selectBivarY.innerHTML = '';

  vars.forEach(v => {
    const optX = document.createElement('option');
    optX.value = v.key;
    optX.textContent = v.label;
    if (v.key === state.bivariate.varX) optX.selected = true;
    dom.selectBivarX.appendChild(optX);

    const optY = document.createElement('option');
    optY.value = v.key;
    optY.textContent = v.label;
    if (v.key === state.bivariate.varY) optY.selected = true;
    dom.selectBivarY.appendChild(optY);
  });
}

/**
 * Registra todos los escuchadores de eventos.
 */
function setupEventListeners() {
  // Toggle Sidebar
  dom.btnToggleSidebar.addEventListener('click', () => {
    dom.sidebar.classList.toggle('collapsed');
    setTimeout(() => resizeAllCharts(), 260);
  });

  // Carga manual de CSV
  dom.csvFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showLoading(true);
      const { data, fileName } = await loadCSVFromFile(file);
      resetFilterControls();
      initDataset(data, fileName);
    } catch (err) {
      alert(`Error al procesar el archivo CSV: ${err.message}`);
    } finally {
      showLoading(false);
      dom.csvFileInput.value = '';
    }
  });

  // Filtros de Sidebar
  dom.filterNivelEstudios.addEventListener('change', (e) => {
    state.filters.nivelEstudios = e.target.value;
    applyFiltersAndRender();
  });

  dom.filterIngresoFamiliar.addEventListener('change', (e) => {
    state.filters.ingresoFamiliar = e.target.value;
    applyFiltersAndRender();
  });

  dom.filterNivelSupervision.addEventListener('change', (e) => {
    state.filters.nivelSupervision = e.target.value;
    applyFiltersAndRender();
  });

  dom.filterFrecuenciaUsoHijo.addEventListener('change', (e) => {
    state.filters.frecuenciaUsoHijo = e.target.value;
    applyFiltersAndRender();
  });

  dom.filterConocimientoMin.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.filters.conocimientoMin = val;
    dom.conocimientoDisplay.textContent = `≥ ${val} / 5`;
    applyFiltersAndRender();
  });

  // Botones rápidos de impacto global
  dom.quickImpactoButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-btn');
    if (!btn) return;

    dom.quickImpactoButtons.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.filters.impactoGlobal = btn.dataset.impact;
    applyFiltersAndRender();
  });

  // Botón Restablecer Filtros
  dom.btnResetFilters.addEventListener('click', () => {
    resetFilterControls();
    applyFiltersAndRender();
  });

  // Navegación de Tabs
  dom.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      state.activeTab = targetTab;

      dom.tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      dom.tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === targetTab);
      });

      // Redimensionar gráficos inmediatamente tras cambiar de pestaña
      setTimeout(() => resizeAllCharts(), 60);
    });
  });

  // Toggle Donut en Tab 1 (Nivel de estudios vs Ocupación)
  dom.toggleDonutVar.addEventListener('change', (e) => {
    state.tab1DonutVar = e.target.value;
    dom.donutTitleText.textContent = state.tab1DonutVar === 'nivelEstudios'
      ? 'Distribución por Nivel de Estudios'
      : 'Distribución por Ocupación Laboral';
    updateTab1Charts();
  });

  // Tab 2: Selector de variable a explorar
  dom.selectUnivariateVar.addEventListener('change', (e) => {
    state.univariate.selectedVar = e.target.value;
    updateTab2();
  });

  // Tab 2: Botones de tipo de gráfico (Barras vs Circular)
  dom.btnViewBar.addEventListener('click', () => {
    state.univariate.chartType = 'bar';
    dom.btnViewBar.classList.add('active');
    dom.btnViewPie.classList.remove('active');
    updateTab2();
  });

  dom.btnViewPie.addEventListener('click', () => {
    state.univariate.chartType = 'pie';
    dom.btnViewPie.classList.add('active');
    dom.btnViewBar.classList.remove('active');
    updateTab2();
  });

  // Tab 3: Selectores Bivariables
  dom.selectBivarX.addEventListener('change', (e) => {
    state.bivariate.varX = e.target.value;
    updateTab3();
  });

  dom.selectBivarY.addEventListener('change', (e) => {
    state.bivariate.varY = e.target.value;
    updateTab3();
  });

  dom.selectBivarVizType.addEventListener('change', (e) => {
    state.bivariate.vizType = e.target.value;
    updateTab3();
  });

  // Botones de exportación SVG en tarjetas de gráficos
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-export-svg');
    if (!btn) return;
    const chartId = btn.dataset.chart;
    let chartName = btn.dataset.name || 'grafica';

    if (chartId === 'chartDonutEstudios') {
      chartName = `distribucion-${state.tab1DonutVar}`;
    } else if (chartId === 'chartUnivariate') {
      chartName = `univariable-${state.univariate.selectedVar}-${state.univariate.chartType}`;
    } else if (chartId === 'chartBivariate') {
      chartName = `bivariable-${state.bivariate.varX}-vs-${state.bivariate.varY}`;
    }

    exportChartAsSVG(chartId, chartName);
  });

  // Resize de la ventana
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => resizeAllCharts(), 150);
  });
}

/**
 * Restablece visualmente y en el estado los controles de filtro.
 */
function resetFilterControls() {
  state.filters = {
    nivelEstudios: 'TODOS',
    ingresoFamiliar: 'TODOS',
    nivelHijos: [],
    nivelSupervision: 'TODOS',
    frecuenciaUsoHijo: 'TODOS',
    conocimientoMin: 1,
    conocimientoMax: 5,
    impactoGlobal: 'TODOS'
  };

  dom.filterNivelEstudios.value = 'TODOS';
  dom.filterIngresoFamiliar.value = 'TODOS';
  dom.filterNivelSupervision.value = 'TODOS';
  dom.filterFrecuenciaUsoHijo.value = 'TODOS';

  dom.filterConocimientoMin.value = 1;
  dom.conocimientoDisplay.textContent = '≥ 1 / 5';

  dom.quickImpactoButtons.querySelectorAll('.quick-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.impact === 'TODOS');
  });

  dom.filterNivelHijosChips.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.remove('active');
  });
}

/**
 * Ejecuta el filtrado y actualiza los 3 tabs de forma sincronizada.
 */
function applyFiltersAndRender() {
  state.filteredData = filterData(state.rawData, state.filters);

  // Actualizar leyenda de conteo
  const count = state.filteredData.length;
  const total = state.rawData.length;
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  dom.filterCountDisplay.textContent = `Mostrando ${count} de ${total} encuestados (${pct}%)`;

  // Actualizar pestañas
  updateTab1();
  updateTab2();
  updateTab3();
}

/**
 * Renderiza el Tab 1: KPIs y Gráficos Principales.
 */
function updateTab1() {
  const kpis = calculateKPIs(state.filteredData, state.rawData.length);

  dom.kpiTotal.textContent = kpis.total;
  dom.kpiTotalSub.textContent = `${kpis.percentOfOriginal}% de la muestra total (${kpis.totalOriginal})`;

  dom.kpiConocimiento.textContent = kpis.avgConocimiento;
  dom.kpiSupervision.textContent = kpis.modaSupervision;
  dom.kpiSupervisionSub.textContent = `${kpis.modaSupervisionFreq} menciones (${kpis.modaSupervisionPercent}%)`;

  dom.kpiPositivo.textContent = kpis.percentImpactoPositivo;

  updateTab1Charts();
}

function updateTab1Charts() {
  // 1. Gráfico Donut (Nivel de Estudios u Ocupación)
  const donutVar = state.tab1DonutVar || 'nivelEstudios';
  const donutDef = VARIABLE_DEFINITIONS[donutVar];
  const freqTable = calculateFrequencyTable(state.filteredData, donutVar);
  const donutData = freqTable.rows.map(r => ({ name: r.category, value: r.fi }));
  renderDonutChart('chartDonutEstudios', donutData, donutDef ? donutDef.label : 'Distribución');

  // 2. Gráfico Horizontal de Riesgos
  const riesgosTable = calculateFrequencyTable(state.filteredData, 'principalRiesgo');
  const catRiesgos = riesgosTable.rows.map(r => r.category);
  const valRiesgos = riesgosTable.rows.map(r => r.fi);
  renderHorizontalBarChart('chartRiesgos', catRiesgos, valRiesgos, 'Ranking de Riesgos Percibidos');

  // 3. Gráfico de Barras Apiladas: Impacto Global por Nivel de Supervisión
  const contingency = calculateContingencyTable(state.filteredData, 'nivelSupervision', 'impactoGlobal');
  const seriesData = contingency.yCategories.map(y => ({
    name: y,
    data: contingency.xCategories.map(x => contingency.matrix[x][y] || 0)
  }));
  renderStackedBarChart('chartSupervisionImpacto', contingency.xCategories, seriesData, contingency.yCategories);
}

/**
 * Renderiza el Tab 2: Explorador Univariable (Estadística + Tabla de Frecuencias + Gráfico).
 */
function updateTab2() {
  const varKey = state.univariate.selectedVar;
  const def = VARIABLE_DEFINITIONS[varKey];
  if (!def) return;

  dom.univariateChartTitle.textContent = `Distribución de: ${def.label}`;
  dom.tableSubtitle.textContent = def.multi ? 'Frecuencias de opciones múltiples' : 'fi, hi, %, Fi, Hi%';

  // 1. Estadísticas Descriptivas Adaptativas
  const stats = calculateDescriptiveStats(state.filteredData, varKey);
  renderAdaptiveStatsCards(stats, def);

  // 2. Tabla de Frecuencias
  const freqData = calculateFrequencyTable(state.filteredData, varKey);
  renderFrequencyTable(freqData);

  // 3. Gráfico Univariable
  const categories = freqData.rows.map(r => r.category);
  const values = freqData.rows.map(r => r.fi);
  renderUnivariateChart('chartUnivariate', categories, values, state.univariate.chartType, def.label);
}

/**
 * Genera dinámicamente las tarjetas de estadísticas descriptivas.
 * @param {Object} stats 
 * @param {Object} def 
 */
function renderAdaptiveStatsCards(stats, def) {
  dom.univariateStatsRow.innerHTML = '';

  if (stats.isEmpty) {
    dom.univariateStatsRow.innerHTML = `
      <div class="stat-metric-card" style="grid-column: 1 / -1;">
        <span class="stat-metric-label">Sin Registros</span>
        <span class="stat-metric-value" style="font-size: 14px; color: var(--text-muted);">
          No hay datos con los filtros seleccionados
        </span>
      </div>
    `;
    return;
  }

  if (stats.isQuantitative) {
    // Media, Mediana, Moda, Desv. Estándar, Varianza, Rango
    const metrics = [
      { label: 'Media (x̄)', val: stats.mean, sub: 'Promedio aritmético' },
      { label: 'Mediana (Me)', val: stats.median, sub: 'Percentil 50' },
      { label: 'Moda (Mo)', val: stats.mode, sub: `${stats.modeFreq} ocurrencias` },
      { label: 'Desv. Estándar (s)', val: stats.stdDev, sub: 'Dispersión muestral' },
      { label: 'Varianza (s²)', val: stats.variance, sub: 'Varianza muestral' },
      { label: 'Rango (Min - Max)', val: `${stats.min} a ${stats.max}`, sub: `Amplitud: ${stats.range}` }
    ];

    metrics.forEach(m => {
      const card = document.createElement('div');
      card.className = 'stat-metric-card';
      card.innerHTML = `
        <span class="stat-metric-label">${m.label}</span>
        <span class="stat-metric-value">${m.val}</span>
        <span class="stat-metric-sub">${m.sub}</span>
      `;
      dom.univariateStatsRow.appendChild(card);
    });
  } else {
    // Moda, Frecuencia de la moda, % de la moda, Categorías únicas
    const metrics = [
      { label: 'Moda (Categoría Predominante)', val: stats.mode, sub: `${stats.modeFreq} votos` },
      { label: 'Frecuencia Absoluta Moda (fm)', val: stats.modeFreq, sub: 'Número de menciones' },
      { label: 'Porcentaje de la Moda', val: stats.modePercent, sub: stats.isMulti ? `${stats.modePercentOfRespondents} de los encuestados` : 'del total' },
      { label: 'Categorías Únicas', val: stats.uniqueCategories, sub: 'Diversidad de respuestas' }
    ];

    metrics.forEach(m => {
      const card = document.createElement('div');
      card.className = 'stat-metric-card';
      card.innerHTML = `
        <span class="stat-metric-label">${m.label}</span>
        <span class="stat-metric-value" style="font-size: ${m.val.length > 20 ? '15px' : '20px'};">${m.val}</span>
        <span class="stat-metric-sub">${m.sub}</span>
      `;
      dom.univariateStatsRow.appendChild(card);
    });
  }
}

/**
 * Renderiza la tabla HTML de frecuencias.
 * @param {Object} freqData 
 */
function renderFrequencyTable(freqData) {
  dom.frequencyTableBody.innerHTML = '';
  dom.frequencyTableFoot.innerHTML = '';

  const { rows, totals, isMulti } = freqData;

  if (!rows || rows.length === 0) {
    dom.frequencyTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
          No hay datos disponibles para mostrar
        </td>
      </tr>
    `;
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 500;">${r.category}</td>
      <td class="text-right"><strong>${r.fi}</strong></td>
      <td class="text-right">${r.hi.toFixed(4)}</td>
      <td class="text-right">${r.percent.toFixed(2)}%</td>
      <td class="text-right">${r.Fi}</td>
      <td class="text-right">${r.HiPercent.toFixed(2)}%</td>
    `;
    dom.frequencyTableBody.appendChild(tr);
  });

  // Fila de totales en tfoot
  const trFoot = document.createElement('tr');
  trFoot.innerHTML = `
    <td>TOTALES</td>
    <td class="text-right"><strong>${totals.fi}</strong></td>
    <td class="text-right">1.0000</td>
    <td class="text-right">100.00%</td>
    <td class="text-right">-</td>
    <td class="text-right">-</td>
  `;
  dom.frequencyTableFoot.appendChild(trFoot);
}

/**
 * Renderiza el Tab 3: Comparativa Bivariable (Gráfico + Tabla de Contingencia).
 */
function updateTab3() {
  const varX = state.bivariate.varX;
  const varY = state.bivariate.varY;
  const vizType = state.bivariate.vizType;

  const defX = VARIABLE_DEFINITIONS[varX];
  const defY = VARIABLE_DEFINITIONS[varY];

  if (!defX || !defY) return;

  dom.bivariateChartTitle.textContent = `${vizType}: ${defX.label} frente a ${defY.label}`;

  // 1. Calcular matriz de contingencia
  const contingency = calculateContingencyTable(state.filteredData, varX, varY);

  // 2. Renderizar Gráfico Bivariable
  renderBivariateChart('chartBivariate', vizType, contingency, defX.label, defY.label);

  // 3. Renderizar Tabla de Contingencia (Matriz de doble entrada)
  renderContingencyTable(contingency, defX.label, defY.label);
}

/**
 * Construye la tabla HTML interactiva de doble entrada para la contingencia.
 * @param {Object} contingency 
 * @param {string} labelX 
 * @param {string} labelY 
 */
function renderContingencyTable(contingency, labelX, labelY) {
  const { xCategories, yCategories, matrix, rowTotals, colTotals, grandTotal } = contingency;

  if (!xCategories.length || !yCategories.length || grandTotal === 0) {
    dom.contingencyTableWrapper.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted);">
        No hay datos para construir la tabla de contingencia con los filtros actuales.
      </div>
    `;
    return;
  }

  // Hallar máximo valor para sombreado proporcional sutil
  let maxCell = 1;
  xCategories.forEach(x => {
    yCategories.forEach(y => {
      const v = matrix[x][y] || 0;
      if (v > maxCell) maxCell = v;
    });
  });

  let html = `
    <table class="matrix-table">
      <thead>
        <tr>
          <th class="corner-header">${labelX} \\ ${labelY}</th>
  `;

  yCategories.forEach(y => {
    html += `<th>${y}</th>`;
  });

  html += `<th class="marginal-total">Total Fila</th></tr></thead><tbody>`;

  xCategories.forEach(x => {
    html += `<tr><th class="row-header">${x}</th>`;
    const rTotal = rowTotals[x] || 0;

    yCategories.forEach(y => {
      const val = matrix[x][y] || 0;
      const pctRow = rTotal > 0 ? ((val / rTotal) * 100).toFixed(0) : 0;
      const intensity = (val / maxCell);
      const bg = val > 0 ? `background-color: rgba(37, 99, 235, ${Math.max(0.06, intensity * 0.28)});` : '';

      html += `
        <td class="matrix-cell-heat" style="${bg}" title="${val} respuestas (${pctRow}% de la fila)">
          <strong>${val}</strong>
          ${val > 0 ? `<span style="font-size:10px; color:var(--text-muted); display:block;">${pctRow}%</span>` : ''}
        </td>
      `;
    });

    html += `<td class="marginal-total">${rTotal}</td></tr>`;
  });

  // Fila de totales marginales de columna
  html += `
      </tbody>
      <tfoot>
        <tr>
          <th class="marginal-total" style="text-align: left;">Total Columna</th>
  `;

  yCategories.forEach(y => {
    html += `<td class="marginal-total">${colTotals[y] || 0}</td>`;
  });

  html += `
          <td class="marginal-total" style="background-color: #e2e8f0; font-size: 13px;">
            <strong>${grandTotal}</strong>
          </td>
        </tr>
      </tfoot>
    </table>
  `;

  dom.contingencyTableWrapper.innerHTML = html;
}

/**
 * Control del overlay de carga.
 * @param {boolean} show 
 */
function showLoading(show) {
  if (!dom.loadingOverlay) return;
  if (show) {
    dom.loadingOverlay.classList.remove('hidden');
  } else {
    dom.loadingOverlay.classList.add('hidden');
  }
}
