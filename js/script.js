// ============================================================
// CONFIGURACION DE ESCALAS IRPF 2025
// ============================================================

// Escala estatal (común para toda España)
const ESCALA_ESTATAL = [
  { hasta: 12450,    tipo: 0.095 },
  { hasta: 20200,    tipo: 0.12  },
  { hasta: 35200,    tipo: 0.15  },
  { hasta: 60000,    tipo: 0.185 },
  { hasta: 300000,   tipo: 0.225 },
  { hasta: Infinity, tipo: 0.245 },
];

// Escalas autonómicas 2025 (fuentes oficiales)
const ESCALAS_AUTONOMICAS = {
  murcia: {
    nombre: "Región de Murcia",
    escala: [
      { hasta: 12450,    tipo: 0.0950 },
      { hasta: 20200,    tipo: 0.1120 },
      { hasta: 34000,    tipo: 0.1330 },
      { hasta: 60000,    tipo: 0.1790 },
      { hasta: Infinity, tipo: 0.2250 },
    ]
  },
  madrid: {
    nombre: "Comunidad de Madrid",
    escala: [
      { hasta: 12450,    tipo: 0.0950 },
      { hasta: 20200,    tipo: 0.1100 },
      { hasta: 34000,    tipo: 0.1300 },
      { hasta: 60000,    tipo: 0.1750 },
      { hasta: Infinity, tipo: 0.2150 },
    ]
  },
  cataluna: {
    nombre: "Cataluña",
    escala: [
      { hasta: 12450,    tipo: 0.1000 },
      { hasta: 20200,    tipo: 0.1250 },
      { hasta: 34000,    tipo: 0.1550 },
      { hasta: 60000,    tipo: 0.1950 },
      { hasta: Infinity, tipo: 0.2350 },
    ]
  },
  andalucia: {
    nombre: "Andalucía",
    escala: [
      { hasta: 12450,    tipo: 0.0950 },
      { hasta: 20200,    tipo: 0.1150 },
      { hasta: 34000,    tipo: 0.1400 },
      { hasta: 60000,    tipo: 0.1850 },
      { hasta: Infinity, tipo: 0.2250 },
    ]
  },
  valencia: {
    nombre: "Comunidad Valenciana",
    escala: [
      { hasta: 12450,    tipo: 0.0950 },
      { hasta: 20200,    tipo: 0.1200 },
      { hasta: 34000,    tipo: 0.1450 },
      { hasta: 60000,    tipo: 0.1900 },
      { hasta: Infinity, tipo: 0.2350 },
    ]
  },
  galicia: {
    nombre: "Galicia",
    escala: [
      { hasta: 12450,    tipo: 0.0950 },
      { hasta: 20200,    tipo: 0.1150 },
      { hasta: 34000,    tipo: 0.1400 },
      { hasta: 60000,    tipo: 0.1850 },
      { hasta: Infinity, tipo: 0.2250 },
    ]
  },
  castillayleon: {
    nombre: "Castilla y León",
    escala: [
      { hasta: 12450,    tipo: 0.0950 },
      { hasta: 20200,    tipo: 0.1150 },
      { hasta: 34000,    tipo: 0.1400 },
      { hasta: 60000,    tipo: 0.1850 },
      { hasta: Infinity, tipo: 0.2250 },
    ]
  },
  canarias: {
    nombre: "Canarias",
    escala: [
      { hasta: 12450,    tipo: 0.0900 },
      { hasta: 20200,    tipo: 0.1100 },
      { hasta: 34000,    tipo: 0.1300 },
      { hasta: 60000,    tipo: 0.1700 },
      { hasta: Infinity, tipo: 0.2100 },
    ]
  }
};

// Comunidad actual
let comunidadActual = "murcia";

// Configuración Seguridad Social 2025 (con MEI incluido)
const SS_TOTAL = 0.0470 + 0.0155 + 0.0010 + 0.0013; // 6.48%

const MINIMO_PERSONAL = 5550;

// ============================================================
// FUNCIONES DE FORMATO
// ============================================================

function formatearNumero(numero, decimales = 0) {
  let partes = numero.toFixed(decimales).split('.');
  let entero = partes[0];
  let decimal = partes[1] ? ',' + partes[1] : '';
  
  let enteroConPuntos = '';
  for (let i = entero.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      enteroConPuntos = '.' + enteroConPuntos;
    }
    enteroConPuntos = entero[i] + enteroConPuntos;
  }
  
  return enteroConPuntos + decimal;
}

function fmt(n, d = 0) {
  return formatearNumero(n, d) + ' €';
}

function fmtBig(n) {
  return formatearNumero(n, 2) + ' €';
}

function fmtNumber(n, d = 0) {
  return formatearNumero(n, d);
}

function fmtPercent(n, d = 2) {
  return formatearNumero(n, d) + '%';
}

// ============================================================
// FUNCIONES DE CALCULO IRPF
// ============================================================

function setMode(is14) {
  document.getElementById('togglePagas').checked = is14;
  calcular();
}

// Reducción por rendimientos del trabajo (Art. 20) - 2025
function reduccionRendTrabajo(rnt) {
  if (rnt >= 19747.50) return 0;
  if (rnt <= 14852) return 7302;
  if (rnt <= 17673.52) {
    const reduccion = 7302 - (1.75 * (rnt - 14852));
    return Math.max(reduccion, 0);
  }
  const reduccion = 2364.34 - (1.14 * (rnt - 17673.52));
  return Math.max(reduccion, 0);
}

function calcularCuota(base, escala) {
  let cuota = 0;
  let limiteAnterior = 0;
  
  for (const tramo of escala) {
    if (base <= limiteAnterior) break;
    const limite = Math.min(tramo.hasta, base);
    const baseTramo = limite - limiteAnterior;
    cuota += baseTramo * tramo.tipo;
    limiteAnterior = limite;
  }
  return cuota;
}

function calcularCuotaTotal(baseImponible, comunidad = comunidadActual) {
  const escalaAutonomica = ESCALAS_AUTONOMICAS[comunidad]?.escala || ESCALAS_AUTONOMICAS.murcia.escala;
  const cuotaEstatal = calcularCuota(baseImponible, ESCALA_ESTATAL);
  const cuotaAutonomica = calcularCuota(baseImponible, escalaAutonomica);
  return cuotaEstatal + cuotaAutonomica;
}

function cambiarComunidad(comunidadId) {
  if (ESCALAS_AUTONOMICAS[comunidadId]) {
    comunidadActual = comunidadId;
    const selector = document.getElementById('selectorComunidad');
    if (selector) selector.value = comunidadId;
    calcular();
    return true;
  }
  return false;
}

function getComunidadesDisponibles() {
  return Object.keys(ESCALAS_AUTONOMICAS).map(key => ({
    id: key,
    nombre: ESCALAS_AUTONOMICAS[key].nombre
  }));
}

function onComunidadChange() {
  const selector = document.getElementById('selectorComunidad');
  if (selector) cambiarComunidad(selector.value);
}

// ============================================================
// TOOLTIPS PARA GRAFICOS
// ============================================================

let chartTooltip = null;

function createChartTooltip() {
  if (!chartTooltip) {
    chartTooltip = document.createElement('div');
    chartTooltip.className = 'chart-tooltip';
    document.body.appendChild(chartTooltip);
  }
  return chartTooltip;
}

function showChartTooltip(event, text) {
  const tooltip = createChartTooltip();
  tooltip.innerHTML = text.replace(/\n/g, '<br>');
  tooltip.classList.add('visible');
  tooltip.style.left = (event.clientX + 15) + 'px';
  tooltip.style.top = (event.clientY - 10) + 'px';
}

function moveChartTooltip(event) {
  if (chartTooltip && chartTooltip.classList.contains('visible')) {
    chartTooltip.style.left = (event.clientX + 15) + 'px';
    chartTooltip.style.top = (event.clientY - 10) + 'px';
  }
}

function hideChartTooltip() {
  if (chartTooltip) {
    chartTooltip.classList.remove('visible');
  }
}

// ============================================================
// DONUT CHART INTERACTIVO
// ============================================================

function drawDonutInteractive(segments) {
  const svg = document.getElementById('donutSvg');
  const cx = 75, cy = 75, r = 58, strokeW = 22;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.val, 0);

  let html = '';
  
  html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e1e22" stroke-width="${strokeW}"/>`;

  let offset = 0;
  segments.forEach((seg, idx) => {
    const pct = seg.val / total;
    const dash = pct * circ;
    const gap = circ - dash;
    let tooltipText = '';
    //if (seg.label === 'Neto') tooltipText = 'Neto\nEl dinero que realmente llega a tu bolsillo despues de pagar impuestos y cotizaciones sociales.';
    //else if (seg.label === 'IRPF') tooltipText = 'IRPF\nImpuesto sobre la renta. Financia: sanidad, educacion, infraestructuras, defensa, pensiones...';
    //else tooltipText = 'Seguridad Social\nFinancia: pensiones, desempleo, bajas laborales, formacion profesional...';
    tooltipText += fmtNumber(seg.val, 2) + ' €\n' + fmtPercent(pct * 100, 1);
    
    html += `<circle
      cx="${cx}" cy="${cy}" r="${r}"
      fill="none"
      stroke="${seg.color}"
      stroke-width="${strokeW}"
      stroke-dasharray="${dash.toFixed(3)} ${gap.toFixed(3)}"
      stroke-dashoffset="${(circ * (1 - offset + 0.25)).toFixed(3)}"
      style="transition: stroke-dasharray 0.5s ease; cursor: pointer;"
      class="donut-segment"
      data-tooltip="${tooltipText.replace(/"/g, '&quot;')}"
      data-segment="${idx}"
    />`;
    offset += pct;
  });

  const netoPct = (segments[0].val / total * 100);
  html += `
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" fill="#555560" letter-spacing="1">NETO</text>
    <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#e8ff47" id="donutCenter">${fmtPercent(netoPct, 1)}</text>
  `;

  svg.innerHTML = html;

  document.querySelectorAll('.donut-segment').forEach(el => {
    const tooltipText = el.dataset.tooltip;
    if (tooltipText) {
      el.addEventListener('mouseenter', (e) => showChartTooltip(e, tooltipText));
      el.addEventListener('mouseleave', hideChartTooltip);
      el.addEventListener('mousemove', moveChartTooltip);
    }
  });
}

function buildLegend(segments, total) {
  const el = document.getElementById('chartLegend');
  el.innerHTML = segments.map(s => {
    let legendTooltip = '';
    if (s.label === 'Neto') legendTooltip = 'El dinero que realmente llega a tu bolsillo despues de impuestos y cotizaciones sociales.';
    else if (s.label === 'IRPF') legendTooltip = 'Impuesto sobre la renta. Financia: sanidad, educacion, infraestructuras, defensa, pensiones...';
    else legendTooltip = 'Seguridad Social. Financia: pensiones, desempleo, bajas laborales, formacion profesional...';
    
    return `<div class="legend-item" style="cursor:help" tooltip-data="${legendTooltip.replace(/"/g, '&quot;')}">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div class="legend-info">
        <div class="legend-name">${s.label}</div>
        <div class="legend-val" style="color:${s.color}">${fmt(s.val, 2)}<span class="legend-pct">${fmtPercent(s.val / total * 100, 1)}</span></div>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// INICIALIZAR TOOLTIPS
// ============================================================

const tooltipsText = {
  brutoAnual: 'Salario bruto anual antes de impuestos. Incluye todas las pagas extraordinarias, bonus fijos y conceptos salariales.',
  extraMes: 'Plus por disponibilidad, guardias locales o atencion continuada. Se paga mensualmente y tributa como salario normal.',
  ayudaMes: 'Ayuda para suministros (luz, agua, internet) o comunicaciones. Esta exenta de IRPF segun convenio.',
  retencionEmpresa: 'Porcentaje de IRPF que aparece en tu nomina como "Retencion a cuenta del IRPF". Si es mayor que tu tipo efectivo, Hacienda te devolvera la diferencia.',
  dBruto: 'Salario base anual acordado en tu contrato, sin incluir pluses ni complementos.',
  dExtra: 'Suma anual del plus de disponibilidad o guardias (multiplicado por 12 meses).',
  dBrutoTotal: 'Base total sobre la que se calculan las cotizaciones a la Seguridad Social y el IRPF.',
  dSS: 'Cotizacion del trabajador a la Seguridad Social: contingencias comunes (4,70%), desempleo (1,55%), formacion profesional (0,10%) y MEI (0,13%). Total 6,48%.',
  dRNT: 'Rendimiento neto del trabajo = bruto total - cotizaciones SS.',
  dReduc: 'Reduccion por rendimientos del trabajo (articulo 20 de la ley IRPF). Aplica solo si no hay otras rentas superiores a 6.500 €.',
  dBL: 'Base liquidable = rendimiento neto - reduccion. Es la base sobre la que se aplican los minimos personales.',
  dBI: 'Base imponible = base liquidable - minimo personal (5.550 euros). Sobre esta base se aplican los tramos IRPF.',
  dCuotaTotal: 'Suma de cuota estatal + autonómica. Es lo que pagas de IRPF al año.',
  dTipoEfectivo: 'Porcentaje real de IRPF que pagas sobre tu salario bruto total. No es el tipo marginal.',
  dAyuda: 'Ayuda exenta de suministros o comunicaciones. No tributa ni cotiza.',
  dNetoAnual: 'Cantidad neta que recibes al año despues de impuestos y seguridad social, mas ayudas exentas.',
  netoMesLabel: 'Cantidad que ingresara en tu cuenta bancaria por cada paga (mensual o extra), despues de impuestos y cotizaciones.',
  netoExtraLabel: 'Cantidad neta por paga cuando incluyes el plus de guardias o disponibilidad.',
  tipoMarginal: 'El tipo marginal es el porcentaje que pagas por cada euro adicional que ganas. Es el tramo mas alto que alcanza tu salario.',
  tipoEfectivo: 'El tipo efectivo es el porcentaje real que pagas sobre el total de tu salario. Suele ser menor que el tipo marginal.'
};

function initTooltips() {
  const inputFields = [
    { id: 'brutoAnual', text: tooltipsText.brutoAnual },
    { id: 'extraMes', text: tooltipsText.extraMes },
    { id: 'ayudaMes', text: tooltipsText.ayudaMes },
    { id: 'retencionEmpresa', text: tooltipsText.retencionEmpresa }
  ];
  
  inputFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      const label = element.closest('.field')?.querySelector('label');
      if (label && !label.hasAttribute('tooltip-data')) {
        label.setAttribute('tooltip-data', field.text);
        label.style.cursor = 'help';
      }
    }
  });
  
  const browFields = [
    { id: 'dBruto', text: tooltipsText.dBruto },
    { id: 'dExtra', text: tooltipsText.dExtra },
    { id: 'dBrutoTotal', text: tooltipsText.dBrutoTotal },
    { id: 'dSS', text: tooltipsText.dSS },
    { id: 'dRNT', text: tooltipsText.dRNT },
    { id: 'dReduc', text: tooltipsText.dReduc },
    { id: 'dBL', text: tooltipsText.dBL },
    { id: 'dBI', text: tooltipsText.dBI },
    { id: 'dCuotaTotal', text: tooltipsText.dCuotaTotal },
    { id: 'dTipoEfectivo', text: tooltipsText.dTipoEfectivo },
    { id: 'dAyuda', text: tooltipsText.dAyuda },
    { id: 'dNetoAnual', text: tooltipsText.dNetoAnual }
  ];
  
  browFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      const browDiv = element.closest('.brow');
      if (browDiv && !browDiv.hasAttribute('tooltip-data')) {
        browDiv.setAttribute('tooltip-data', field.text);
        browDiv.style.cursor = 'help';
      }
    }
  });
  
  const netoMesLabel = document.getElementById('netoMesLabel');
  if (netoMesLabel && !netoMesLabel.hasAttribute('tooltip-data')) {
    netoMesLabel.setAttribute('tooltip-data', tooltipsText.netoMesLabel);
    netoMesLabel.style.cursor = 'help';
  }
  
  const netoExtraLabel = document.getElementById('netoExtraLabel');
  if (netoExtraLabel && !netoExtraLabel.hasAttribute('tooltip-data')) {
    netoExtraLabel.setAttribute('tooltip-data', tooltipsText.netoExtraLabel);
    netoExtraLabel.style.cursor = 'help';
  }
  
  const tipoMarginalEl = document.getElementById('tipoMarginal');
  if (tipoMarginalEl) {
    const parentMetric = tipoMarginalEl.closest('.metric');
    const parentLabel = parentMetric?.querySelector('.metric-label');
    if (parentLabel && !parentLabel.hasAttribute('tooltip-data')) {
      parentLabel.setAttribute('tooltip-data', tooltipsText.tipoMarginal);
      parentLabel.style.cursor = 'help';
    }
  }
  
  const tipoEfectivoResumen = document.getElementById('tipoEfectivoResumen');
  if (tipoEfectivoResumen) {
    const parentMetric = tipoEfectivoResumen.closest('.metric');
    const parentLabel = parentMetric?.querySelector('.metric-label');
    if (parentLabel && !parentLabel.hasAttribute('tooltip-data')) {
      parentLabel.setAttribute('tooltip-data', tooltipsText.tipoEfectivo);
      parentLabel.style.cursor = 'help';
    }
  }
}

// ============================================================
// CALCULO PRINCIPAL
// ============================================================

function calcular() {
  const brutoBase = parseFloat(document.getElementById('brutoAnual').value) || 0;
  const extraMes = parseFloat(document.getElementById('extraMes').value) || 0;
  const ayudaMes = parseFloat(document.getElementById('ayudaMes').value) || 0;
  const pagas14 = document.getElementById('togglePagas').checked;
  const numPagas = pagas14 ? 14 : 12;

  document.getElementById('lbl12').classList.toggle('active', !pagas14);
  document.getElementById('lbl14').classList.toggle('active', pagas14);

  if (brutoBase <= 0) {
    document.getElementById('resultCard').style.display = 'none';
    return;
  }

  const extraAnual = extraMes * 12;
  const ayudaAnual = ayudaMes * 12;
  const brutoSujeto = brutoBase + extraAnual;

  const ss = brutoSujeto * SS_TOTAL;
  const rnt = brutoSujeto - ss;
  const reduccion = reduccionRendTrabajo(rnt);
  const baseLiq = Math.max(rnt - reduccion, 0);
  const baseImp = Math.max(baseLiq - MINIMO_PERSONAL, 0);
  const cuotaTotal = calcularCuotaTotal(baseImp, comunidadActual);
  const tipoEfect = brutoSujeto > 0 ? (cuotaTotal / brutoSujeto * 100) : 0;

  const netoAnual = brutoSujeto - ss - cuotaTotal + ayudaAnual;
  const netoAnualBase = brutoBase / brutoSujeto * (brutoSujeto - ss - cuotaTotal) + ayudaAnual;
  const netoPagaBase = netoAnualBase / numPagas;
  const netoPagaTotal = netoAnual / numPagas;

  document.getElementById('resultCard').style.display = 'block';

  const pagaLabel = pagas14 ? 'por paga (x14)' : 'mensual (x12)';
  document.getElementById('netoMesLabel').textContent = 'Neto ' + pagaLabel;
  document.getElementById('netoMes').textContent = fmtBig(netoPagaBase);
  document.getElementById('netoMesSub').textContent = fmt(netoAnualBase, 2) + ' neto anual';

  const hasExtra = extraMes > 0;
  const metricExtra = document.getElementById('metricExtra');
  const grid = document.getElementById('resultGrid');

  if (hasExtra) {
    metricExtra.style.display = 'block';
    grid.className = 'result-grid double';
    document.getElementById('netoExtraLabel').textContent = 'Con guardias ' + pagaLabel;
    document.getElementById('netoMesExtra').textContent = fmtBig(netoPagaTotal);
    document.getElementById('netoMesExtraSub').textContent = '+' + fmtBig(extraMes) + ' guardias/mes';
    metricExtra.style.animation = 'none';
    void metricExtra.offsetWidth;
    metricExtra.style.animation = '';
  } else {
    metricExtra.style.display = 'none';
    grid.className = 'result-grid single';
  }

  document.getElementById('rowExtra').style.display = extraAnual > 0 ? 'flex' : 'none';
  document.getElementById('rowBrutoTotal').style.display = 'flex';

  document.getElementById('dBruto').textContent = fmt(brutoBase);
  document.getElementById('dExtra').textContent = extraAnual > 0 ? '+' + fmt(extraAnual) : '+0 €';
  document.getElementById('dBrutoTotal').textContent = fmt(brutoSujeto);
  document.getElementById('dSS').textContent = '-' + fmt(ss, 2);
  document.getElementById('dRNT').textContent = fmt(rnt, 2);
  document.getElementById('dReduc').textContent = '-' + fmt(reduccion, 2);
  document.getElementById('dBL').textContent = fmt(baseLiq, 2);
  document.getElementById('dBI').textContent = fmt(baseImp, 2);
  document.getElementById('dCuotaTotal').textContent = '-' + fmt(cuotaTotal, 2);
  document.getElementById('dTipoEfectivo').textContent = fmtPercent(tipoEfect, 2);
  document.getElementById('dAyuda').textContent = '+' + fmt(ayudaAnual, 2);
  document.getElementById('dNetoAnual').textContent = fmt(netoAnual, 2);

  // Tipo marginal y efectivo para resumen
  let tipoMarginal = 0;
  if (baseImp > 0) {
    const escalasCombinadas = [...ESCALA_ESTATAL.map(e => ({ hasta: e.hasta, tipo: e.tipo })), 
                                ...ESCALAS_AUTONOMICAS[comunidadActual].escala.map(e => ({ hasta: e.hasta, tipo: e.tipo }))];
    const ultimoTramo = escalasCombinadas
      .filter(t => t.hasta >= baseImp)
      .sort((a, b) => a.hasta - b.hasta)[0];
    if (ultimoTramo) tipoMarginal = (ultimoTramo.tipo * 2) * 100;
  }
  
  const tipoEfectivoElem = document.getElementById('tipoEfectivoResumen');
  const tipoMarginalElem = document.getElementById('tipoMarginal');
  if (tipoEfectivoElem) tipoEfectivoElem.textContent = fmtPercent(tipoEfect, 2);
  if (tipoMarginalElem) tipoMarginalElem.textContent = fmtPercent(tipoMarginal, 2);

  // ============================================================
  // CALCULO DE DEVOLUCION SEGUN RETENCION DE LA EMPRESA
  // ============================================================
  
  const retencionEmpresa = parseFloat(document.getElementById('retencionEmpresa').value) || 0;
  const devolucionCard = document.getElementById('devolucionCard');
  
  if (retencionEmpresa > 0 && brutoSujeto > 0) {
    const retenidoEmpresa = brutoSujeto * (retencionEmpresa / 100);
    const diferencia = retenidoEmpresa - cuotaTotal;
    const devolucionValue = document.getElementById('devolucionValue');
    const devolucionLabel = document.getElementById('devolucionLabel');
    const devolucionSub = document.getElementById('devolucionSub');
    const devolucionMetric = document.getElementById('devolucionMetric');
    
    if (diferencia > 0) {
      devolucionLabel.textContent = 'HACIENDA TE DEVUELVE';
      devolucionValue.textContent = fmt(diferencia, 2);
      devolucionValue.style.color = 'var(--green)';
      devolucionSub.textContent = `Tu empresa retuvo ${fmtPercent(retencionEmpresa, 2)} (${fmt(retenidoEmpresa, 2)}) · Debias pagar ${fmtPercent(tipoEfect, 2)} (${fmt(cuotaTotal, 2)})`;
      devolucionMetric.classList.add('highlight');
    } else if (diferencia < 0) {
      devolucionLabel.textContent = 'TE SALE A PAGAR';
      devolucionValue.textContent = fmt(Math.abs(diferencia), 2);
      devolucionValue.style.color = 'var(--red)';
      devolucionSub.textContent = `Tu empresa retuvo ${fmtPercent(retencionEmpresa, 2)} (${fmt(retenidoEmpresa, 2)}) · Debias pagar ${fmtPercent(tipoEfect, 2)} (${fmt(cuotaTotal, 2)})`;
      devolucionMetric.classList.add('highlight2');
    } else {
      devolucionLabel.textContent = 'EXACTO';
      devolucionValue.textContent = '0,00 €';
      devolucionValue.style.color = 'var(--accent)';
      devolucionSub.textContent = `Tu retencion (${fmtPercent(retencionEmpresa, 2)}) coincide exactamente con tu IRPF real`;
    }
    
    devolucionCard.style.display = 'block';
  } else {
    devolucionCard.style.display = 'none';
  }

  // Tramos IRPF
  const colors = ['#47c8ff', '#47ffb2', '#e8ff47', '#ffb847', '#ff7847', '#ff4747'];
  
  const umbrales = new Set([
    ...ESCALA_ESTATAL.map(t => t.hasta),
    ...ESCALAS_AUTONOMICAS[comunidadActual].escala.map(t => t.hasta)
  ]);
  const umbralesOrdenados = [...umbrales].filter(v => v < Infinity).sort((a, b) => a - b);
  
  const combined = [];
  let prev = 0;
  for (const hasta of umbralesOrdenados) {
    if (hasta > baseImp) break;
    let tipoEstatal = 0;
    for (const t of ESCALA_ESTATAL) {
      if (t.hasta >= hasta) {
        tipoEstatal = t.tipo;
        break;
      }
    }
    let tipoAut = 0;
    for (const t of ESCALAS_AUTONOMICAS[comunidadActual].escala) {
      if (t.hasta >= hasta) {
        tipoAut = t.tipo;
        break;
      }
    }
    const bt = hasta - prev;
    combined.push({ desde: prev, hasta: hasta, tipo: tipoEstatal + tipoAut, cuota: bt * (tipoEstatal + tipoAut) });
    prev = hasta;
  }
  
  if (prev < baseImp) {
    let tipoEstatal = 0;
    for (const t of ESCALA_ESTATAL) {
      if (t.hasta >= baseImp) {
        tipoEstatal = t.tipo;
        break;
      }
    }
    let tipoAut = 0;
    for (const t of ESCALAS_AUTONOMICAS[comunidadActual].escala) {
      if (t.hasta >= baseImp) {
        tipoAut = t.tipo;
        break;
      }
    }
    const bt = baseImp - prev;
    combined.push({ desde: prev, hasta: baseImp, tipo: tipoEstatal + tipoAut, cuota: bt * (tipoEstatal + tipoAut) });
  }

  let tramosHtml = '';
  combined.forEach((t, i) => {
    const pct = baseImp > 0 ? ((t.hasta - t.desde) / baseImp * 100) : 0;
    const color = colors[i % colors.length];
    const tooltipText = fmtNumber(t.desde) + ' € - ' + fmtNumber(t.hasta) + ' €\nTipo: ' + fmtPercent(t.tipo * 100, 1) + '\nCuota: ' + fmtNumber(t.cuota, 0) + ' €';
    
    tramosHtml += `<div class="tramo-item">
      <div class="tramo-bar-bg">
        <div class="tramo-bar-fill tooltip-tramo" 
             style="width:${pct}%; background:${color}; cursor: pointer;"
             data-tooltip="${tooltipText.replace(/"/g, '&quot;')}">
        </div>
      </div>
    </div>`;
  });

  document.getElementById('tramosViz').innerHTML = tramosHtml ||
    '<div style="color:var(--muted);font-family:var(--mono);font-size:0.75rem">Base imponible es 0 o negativa.</div>';

  document.querySelectorAll('.tooltip-tramo').forEach(el => {
    const tooltipText = el.dataset.tooltip;
    if (tooltipText) {
      el.addEventListener('mouseenter', (e) => showChartTooltip(e, tooltipText));
      el.addEventListener('mouseleave', hideChartTooltip);
      el.addEventListener('mousemove', moveChartTooltip);
    }
  });

  // Donut chart interactivo
  const brutoTotal = brutoSujeto + ayudaAnual;
  const segments = [
    { label: 'Neto', val: netoAnual, color: '#e8ff47' },
    { label: 'IRPF', val: cuotaTotal, color: '#ff5757' },
    { label: 'Seguridad Social', val: ss, color: '#47c8ff' },
  ];

  drawDonutInteractive(segments);
  buildLegend(segments, brutoTotal);
}

// ============================================================
// INICIALIZACION
// ============================================================

function setupComunidadSelector() {
  const selector = document.getElementById('selectorComunidad');
  if (selector) {
    selector.innerHTML = '';
    const comunidades = getComunidadesDisponibles();
    comunidades.forEach(com => {
      const option = document.createElement('option');
      option.value = com.id;
      option.textContent = com.nombre;
      if (com.id === comunidadActual) option.selected = true;
      selector.appendChild(option);
    });
    selector.addEventListener('change', onComunidadChange);
  }
}

// Event listeners
document.getElementById('brutoAnual').addEventListener('input', calcular);
document.getElementById('extraMes').addEventListener('input', calcular);
document.getElementById('ayudaMes').addEventListener('input', calcular);
document.getElementById('togglePagas').addEventListener('change', calcular);
document.getElementById('retencionEmpresa').addEventListener('input', calcular);

document.addEventListener('DOMContentLoaded', () => {
  setupComunidadSelector();
  initTooltips();
  calcular();
});