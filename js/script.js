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
  murcia: { nombre: "Región de Murcia", escala: [{ hasta: 12450, tipo: 0.0950 }, { hasta: 20200, tipo: 0.1120 }, { hasta: 34000, tipo: 0.1330 }, { hasta: 60000, tipo: 0.1790 }, { hasta: Infinity, tipo: 0.2250 }] },
  madrid: { nombre: "Comunidad de Madrid", escala: [{ hasta: 12450, tipo: 0.0950 }, { hasta: 20200, tipo: 0.1100 }, { hasta: 34000, tipo: 0.1300 }, { hasta: 60000, tipo: 0.1750 }, { hasta: Infinity, tipo: 0.2150 }] },
  cataluna: { nombre: "Cataluña", escala: [{ hasta: 12450, tipo: 0.1000 }, { hasta: 20200, tipo: 0.1250 }, { hasta: 34000, tipo: 0.1550 }, { hasta: 60000, tipo: 0.1950 }, { hasta: Infinity, tipo: 0.2350 }] },
  andalucia: { nombre: "Andalucía", escala: [{ hasta: 12450, tipo: 0.0950 }, { hasta: 20200, tipo: 0.1150 }, { hasta: 34000, tipo: 0.1400 }, { hasta: 60000, tipo: 0.1850 }, { hasta: Infinity, tipo: 0.2250 }] },
  valencia: { nombre: "Comunidad Valenciana", escala: [{ hasta: 12450, tipo: 0.0950 }, { hasta: 20200, tipo: 0.1200 }, { hasta: 34000, tipo: 0.1450 }, { hasta: 60000, tipo: 0.1900 }, { hasta: Infinity, tipo: 0.2350 }] },
  galicia: { nombre: "Galicia", escala: [{ hasta: 12450, tipo: 0.0950 }, { hasta: 20200, tipo: 0.1150 }, { hasta: 34000, tipo: 0.1400 }, { hasta: 60000, tipo: 0.1850 }, { hasta: Infinity, tipo: 0.2250 }] },
  castillayleon: { nombre: "Castilla y León", escala: [{ hasta: 12450, tipo: 0.0950 }, { hasta: 20200, tipo: 0.1150 }, { hasta: 34000, tipo: 0.1400 }, { hasta: 60000, tipo: 0.1850 }, { hasta: Infinity, tipo: 0.2250 }] },
  canarias: { nombre: "Canarias", escala: [{ hasta: 12450, tipo: 0.0900 }, { hasta: 20200, tipo: 0.1100 }, { hasta: 34000, tipo: 0.1300 }, { hasta: 60000, tipo: 0.1700 }, { hasta: Infinity, tipo: 0.2100 }] }
};

let comunidadActual = "murcia";
const SS_TOTAL = 0.0470 + 0.0155 + 0.0010 + 0.0013;
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
    if (j > 0 && j % 3 === 0) enteroConPuntos = '.' + enteroConPuntos;
    enteroConPuntos = entero[i] + enteroConPuntos;
  }
  return enteroConPuntos + decimal;
}

function fmt(n, d = 0) { return formatearNumero(n, d) + ' €'; }
function fmtBig(n) { return formatearNumero(n, 2) + ' €'; }
function fmtNumber(n, d = 0) { return formatearNumero(n, d); }
function fmtPercent(n, d = 2) { return formatearNumero(n, d) + '%'; }

function setMode(is14) {
  const toggle = document.getElementById('togglePagas');
  if (toggle) toggle.checked = is14;
  calcular();
}

function reduccionRendTrabajo(rnt) {
  if (rnt >= 19747.50) return 0;
  if (rnt <= 14852) return 7302;
  if (rnt <= 17673.52) return Math.max(7302 - (1.75 * (rnt - 14852)), 0);
  return Math.max(2364.34 - (1.14 * (rnt - 17673.52)), 0);
}

function calcularCuota(base, escala) {
  let cuota = 0, limiteAnterior = 0;
  for (const tramo of escala) {
    if (base <= limiteAnterior) break;
    const limite = Math.min(tramo.hasta, base);
    cuota += (limite - limiteAnterior) * tramo.tipo;
    limiteAnterior = limite;
  }
  return cuota;
}

function calcularCuotaTotal(baseImponible) {
  const escalaAut = ESCALAS_AUTONOMICAS[comunidadActual]?.escala || ESCALAS_AUTONOMICAS.murcia.escala;
  return calcularCuota(baseImponible, ESCALA_ESTATAL) + calcularCuota(baseImponible, escalaAut);
}

function cambiarComunidad(comunidadId) {
  if (ESCALAS_AUTONOMICAS[comunidadId]) {
    comunidadActual = comunidadId;
    const selector = document.getElementById('selectorComunidad');
    if (selector) selector.value = comunidadId;
    calcular();
  }
}

function onComunidadChange() {
  const selector = document.getElementById('selectorComunidad');
  if (selector) cambiarComunidad(selector.value);
}

// ============================================================
// TEXTOS DE TOOLTIPS
// ============================================================

const tooltipsText = {
  brutoAnual: 'Salario bruto anual antes de impuestos. Incluye todas las pagas extraordinarias, bonus fijos y conceptos salariales.',
  extraMes: 'Plus por disponibilidad, guardias locales, atencion continuada, bonus, etc. Se paga mensualmente y tributa como salario normal.',
  ayudaMes: 'Ayuda para luz, agua, internet, transporte, dietas. Esta exenta de IRPF segun convenio.',
  retencionEmpresa: 'Porcentaje de IRPF que aparece en tu nomina como "Retencion a cuenta del IRPF". Si es mayor que tu tipo efectivo, Hacienda te devolvera la diferencia.',
  dBruto: 'Salario base anual acordado en tu contrato, sin incluir pluses ni complementos.',
  dExtra: 'Suma anual del plus de guardias o bonus (multiplicado por 12 meses).',
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
  tipoEfectivo: 'El tipo efectivo es el porcentaje real que pagas sobre el total de tu salario. Suele ser menor que el tipo marginal.',
  netoValue: 'Cantidad neta que ingresara en tu cuenta por cada paga, despues de impuestos y cotizaciones.',
  netoAnualValue: 'Cantidad neta total que recibes al año despues de impuestos y seguridad social, mas ayudas exentas.',
  cuotaTotalValue: 'Cantidad total que pagas de IRPF al año. Suma de cuota estatal + autonómica.',
  ssValue: 'Cotizacion del trabajador a la Seguridad Social: contingencias comunes (4,70%), desempleo (1,55%), formacion profesional (0,10%) y MEI (0,13%). Total 6,48%.'
};

// ============================================================
// TOOLTIPS OPTIMIZADOS PARA MÓVIL - SIN DELAY
// ============================================================

let chartTooltip = null;
let activeTooltipElement = null;

function createChartTooltip() {
  if (!chartTooltip) {
    chartTooltip = document.createElement('div');
    chartTooltip.className = 'chart-tooltip';
    document.body.appendChild(chartTooltip);
  }
  return chartTooltip;
}

function hideChartTooltip() {
  if (chartTooltip) {
    chartTooltip.classList.remove('visible');
    chartTooltip.style.left = '-9999px';
    chartTooltip.style.top = '-9999px';
  }
  activeTooltipElement = null;
}

function showChartTooltip(event, text, isTap = false) {
  // Si es el mismo elemento y ya está visible, no hacer nada
  if (isTap && activeTooltipElement === event.currentTarget && chartTooltip?.classList.contains('visible')) {
    return;
  }
  
  hideChartTooltip();
  
  const tooltip = createChartTooltip();
  // Limpiar el texto y convertirlo a HTML con saltos de línea
  let formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/([\.\!])\s/g, '$1<br>'); // Añadir saltos después de puntos
  
  tooltip.innerHTML = formattedText;
  
  // Obtener coordenadas del toque/ratón
  let clientX, clientY;
  if (event.touches) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  
  tooltip.classList.add('visible');
  
  // Posicionar después de que el tooltip tenga dimensiones
  setTimeout(() => {
    const tooltipRect = tooltip.getBoundingClientRect();
    let x, y;
    
    // Posicionar arriba o abajo según espacio disponible
    if (clientY - tooltipRect.height - 20 > 0) {
      // Arriba
      y = clientY - tooltipRect.height - 15;
    } else {
      // Abajo
      y = clientY + 25;
    }
    
    // Centrar horizontalmente, pero sin salirse de la pantalla
    x = clientX - (tooltipRect.width / 2);
    
    // Ajustar si se sale por la izquierda
    if (x < 10) {
      x = 10;
    }
    
    // Ajustar si se sale por la derecha
    if (x + tooltipRect.width > window.innerWidth - 10) {
      x = window.innerWidth - tooltipRect.width - 10;
    }
    
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }, 10);
  
  if (isTap) {
    activeTooltipElement = event.currentTarget;
  }
}

function onTooltipTap(event, text) {
  event.preventDefault();
  event.stopPropagation();
  showChartTooltip(event, text, true);
}

function onTooltipMouseEnter(event, text) {
  showChartTooltip(event, text, false);
}

function onTooltipMouseLeave() {
  if (!activeTooltipElement) {
    hideChartTooltip();
  }
}

// Eliminar delay al hacer scroll - ocultar inmediatamente
function onScrollOrTouchMove() {
  if (chartTooltip && chartTooltip.classList.contains('visible')) {
    hideChartTooltip();
  }
}

// También ocultar al tocar cualquier parte de la pantalla (fuera de elementos con tooltip)
document.addEventListener('touchstart', function(e) {
  // Verificar si el toque fue en un elemento que tiene tooltip
  let target = e.target;
  let isTooltipElement = false;
  
  while (target && target !== document.body) {
    if (target.hasAttribute && target.hasAttribute('data-tooltip-attached')) {
      isTooltipElement = true;
      break;
    }
    if (target.classList && target.classList.contains('donut-segment')) {
      isTooltipElement = true;
      break;
    }
    if (target.classList && target.classList.contains('legend-item')) {
      isTooltipElement = true;
      break;
    }
    if (target.classList && target.classList.contains('tooltip-tramo')) {
      isTooltipElement = true;
      break;
    }
    target = target.parentElement;
  }
  
  if (!isTooltipElement && chartTooltip && chartTooltip.classList.contains('visible')) {
    hideChartTooltip();
  }
});

// ============================================================
// DONUT CHART INTERACTIVO
// ============================================================

function drawDonutInteractive(segments) {
  const svg = document.getElementById('donutSvg');
  if (!svg) return;
  
  const cx = 75, cy = 75, r = 58, strokeW = 22;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.val, 0);
  let html = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e1e22" stroke-width="${strokeW}"/>`;
  let offset = 0;
  
  segments.forEach((seg, idx) => {
    const pct = seg.val / total;
    const dash = pct * circ;
    const gap = circ - dash;
// Dentro de drawDonutInteractive, reemplaza la construcción del tooltipText:
let tooltipText = '';
if (seg.label === 'Neto') {
  tooltipText = 'NETO\nEl dinero que llega a tu bolsillo\n\n';
} else if (seg.label === 'IRPF') {
  tooltipText = 'IRPF\nImpuesto sobre la renta\nSanidad · Educación · Infraestructuras · Defensa · Pensiones\n\n';
} else {
  tooltipText = 'SEGURIDAD SOCIAL\nPensiones · Desempleo · Bajas laborales · Formación\n\n';
}
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
  html += `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" fill="#555560" letter-spacing="1">NETO</text>
           <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#e8ff47" id="donutCenter">${fmtPercent(netoPct, 1)}</text>`;
  svg.innerHTML = html;
  
  document.querySelectorAll('.donut-segment').forEach(el => {
    const tt = el.dataset.tooltip;
    if (tt && !el.hasAttribute('data-tooltip-attached')) {
      el.setAttribute('data-tooltip-attached', 'true');
      el.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tt));
      el.addEventListener('mouseleave', onTooltipMouseLeave);
      el.addEventListener('touchstart', (e) => onTooltipTap(e, tt));
    }
  });
}

function buildLegend(segments, total) {
  const el = document.getElementById('chartLegend');
  if (!el) return;
  
  el.innerHTML = segments.map(s => {
    let legendTooltip = '';
    if (s.label === 'Neto') legendTooltip = 'El dinero que realmente llega a tu bolsillo despues de impuestos y cotizaciones sociales.';
    else if (s.label === 'IRPF') legendTooltip = 'Impuesto sobre la renta. Financia: sanidad, educacion, infraestructuras, defensa, pensiones...';
    else legendTooltip = 'Seguridad Social. Financia: pensiones, desempleo, bajas laborales, formacion profesional...';
    
    return `<div class="legend-item" style="cursor:help" data-tooltip-text="${legendTooltip.replace(/"/g, '&quot;')}">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div class="legend-info">
        <div class="legend-name">${s.label}</div>
        <div class="legend-val" style="color:${s.color}">${fmt(s.val, 2)}<span class="legend-pct">${fmtPercent(s.val / total * 100, 1)}</span></div>
      </div>
    </div>`;
  }).join('');
  
  document.querySelectorAll('.legend-item').forEach(el => {
    const tt = el.dataset.tooltipText;
    if (tt && !el.hasAttribute('data-tooltip-attached')) {
      el.setAttribute('data-tooltip-attached', 'true');
      el.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tt));
      el.addEventListener('mouseleave', onTooltipMouseLeave);
      el.addEventListener('touchstart', (e) => onTooltipTap(e, tt));
    }
  });
}

// ============================================================
// INICIALIZAR TOOLTIPS
// ============================================================

function initTooltips() {
  // Inputs
  const inputFields = ['brutoAnual', 'extraMes', 'ayudaMes', 'retencionEmpresa'];
  inputFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const label = element.closest('.field')?.querySelector('label');
      if (label && !label.hasAttribute('data-tooltip-attached')) {
        label.setAttribute('data-tooltip-attached', 'true');
        label.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText[id]));
        label.addEventListener('mouseleave', onTooltipMouseLeave);
        label.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText[id]));
        label.style.cursor = 'help';
      }
    }
  });
  
  // Desglose (filas completas)
  const browIds = ['dBruto', 'dExtra', 'dBrutoTotal', 'dSS', 'dRNT', 'dReduc', 'dBL', 'dBI', 'dCuotaTotal', 'dTipoEfectivo', 'dAyuda', 'dNetoAnual'];
  browIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const browDiv = element.closest('.brow');
      if (browDiv && !browDiv.hasAttribute('data-tooltip-attached')) {
        browDiv.setAttribute('data-tooltip-attached', 'true');
        browDiv.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText[id]));
        browDiv.addEventListener('mouseleave', onTooltipMouseLeave);
        browDiv.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText[id]));
        browDiv.style.cursor = 'help';
      }
    }
  });
  
  // Labels de métricas principales
  const netoMesLabel = document.getElementById('netoMesLabel');
  if (netoMesLabel && !netoMesLabel.hasAttribute('data-tooltip-attached')) {
    netoMesLabel.setAttribute('data-tooltip-attached', 'true');
    netoMesLabel.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.netoMesLabel));
    netoMesLabel.addEventListener('mouseleave', onTooltipMouseLeave);
    netoMesLabel.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.netoMesLabel));
    netoMesLabel.style.cursor = 'help';
  }
  
  // Resumen ejecutivo
  const tipoMarginalEl = document.getElementById('tipoMarginal');
  if (tipoMarginalEl) {
    const parentMetric = tipoMarginalEl.closest('.metric');
    const parentLabel = parentMetric?.querySelector('.metric-label');
    if (parentLabel && !parentLabel.hasAttribute('data-tooltip-attached')) {
      parentLabel.setAttribute('data-tooltip-attached', 'true');
      parentLabel.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.tipoMarginal));
      parentLabel.addEventListener('mouseleave', onTooltipMouseLeave);
      parentLabel.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.tipoMarginal));
      parentLabel.style.cursor = 'help';
    }
  }
  
  const tipoEfectivoResumen = document.getElementById('tipoEfectivoResumen');
  if (tipoEfectivoResumen) {
    const parentMetric = tipoEfectivoResumen.closest('.metric');
    const parentLabel = parentMetric?.querySelector('.metric-label');
    if (parentLabel && !parentLabel.hasAttribute('data-tooltip-attached')) {
      parentLabel.setAttribute('data-tooltip-attached', 'true');
      parentLabel.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.tipoEfectivo));
      parentLabel.addEventListener('mouseleave', onTooltipMouseLeave);
      parentLabel.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.tipoEfectivo));
      parentLabel.style.cursor = 'help';
    }
  }
  
  // Valores numéricos importantes
  const netoMes = document.getElementById('netoMes');
  if (netoMes && !netoMes.hasAttribute('data-tooltip-attached')) {
    netoMes.setAttribute('data-tooltip-attached', 'true');
    netoMes.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.netoValue));
    netoMes.addEventListener('mouseleave', onTooltipMouseLeave);
    netoMes.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.netoValue));
    netoMes.style.cursor = 'help';
  }
  
  const dNetoAnual = document.getElementById('dNetoAnual');
  if (dNetoAnual && !dNetoAnual.hasAttribute('data-tooltip-attached')) {
    dNetoAnual.setAttribute('data-tooltip-attached', 'true');
    dNetoAnual.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.netoAnualValue));
    dNetoAnual.addEventListener('mouseleave', onTooltipMouseLeave);
    dNetoAnual.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.netoAnualValue));
    dNetoAnual.style.cursor = 'help';
  }
  
  const dCuotaTotal = document.getElementById('dCuotaTotal');
  if (dCuotaTotal && !dCuotaTotal.hasAttribute('data-tooltip-attached')) {
    dCuotaTotal.setAttribute('data-tooltip-attached', 'true');
    dCuotaTotal.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.cuotaTotalValue));
    dCuotaTotal.addEventListener('mouseleave', onTooltipMouseLeave);
    dCuotaTotal.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.cuotaTotalValue));
    dCuotaTotal.style.cursor = 'help';
  }
  
  const dSS = document.getElementById('dSS');
  if (dSS && !dSS.hasAttribute('data-tooltip-attached')) {
    dSS.setAttribute('data-tooltip-attached', 'true');
    dSS.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.ssValue));
    dSS.addEventListener('mouseleave', onTooltipMouseLeave);
    dSS.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.ssValue));
    dSS.style.cursor = 'help';
  }
}

// ============================================================
// CALCULO PRINCIPAL
// ============================================================

function calcular() {
  const brutoBase = parseFloat(document.getElementById('brutoAnual')?.value) || 0;
  const extraMes = parseFloat(document.getElementById('extraMes')?.value) || 0;
  const ayudaMes = parseFloat(document.getElementById('ayudaMes')?.value) || 0;
  const pagas14 = document.getElementById('togglePagas')?.checked || false;
  const numPagas = pagas14 ? 14 : 12;

  const lbl12 = document.getElementById('lbl12');
  const lbl14 = document.getElementById('lbl14');
  if (lbl12) lbl12.classList.toggle('active', !pagas14);
  if (lbl14) lbl14.classList.toggle('active', pagas14);

  if (brutoBase <= 0) {
    const resultCard = document.getElementById('resultCard');
    if (resultCard) resultCard.style.display = 'none';
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
  const cuotaTotal = calcularCuotaTotal(baseImp);
  const tipoEfect = brutoSujeto > 0 ? (cuotaTotal / brutoSujeto * 100) : 0;
  const netoAnual = brutoSujeto - ss - cuotaTotal + ayudaAnual;
  const netoAnualBase = brutoBase / brutoSujeto * (brutoSujeto - ss - cuotaTotal) + ayudaAnual;
  const netoPagaBase = netoAnualBase / numPagas;
  const netoPagaTotal = netoAnual / numPagas;

  const resultCard = document.getElementById('resultCard');
  if (resultCard) resultCard.style.display = 'block';

  const pagaLabel = pagas14 ? 'por paga (x14)' : 'mensual (x12)';
  const netoMesLabel = document.getElementById('netoMesLabel');
  const netoMes = document.getElementById('netoMes');
  const netoMesSub = document.getElementById('netoMesSub');
  if (netoMesLabel) netoMesLabel.textContent = 'Neto ' + pagaLabel;
  if (netoMes) netoMes.textContent = fmtBig(netoPagaBase);
  if (netoMesSub) netoMesSub.textContent = fmt(netoAnualBase, 2) + ' neto anual';

  const hasExtra = extraMes > 0;
  const metricExtra = document.getElementById('metricExtra');
  const grid = document.getElementById('resultGrid');

  if (metricExtra && grid) {
    if (hasExtra) {
      metricExtra.style.display = 'block';
      grid.className = 'result-grid double';
      const netoExtraLabel = document.getElementById('netoExtraLabel');
      const netoMesExtra = document.getElementById('netoMesExtra');
      const netoMesExtraSub = document.getElementById('netoMesExtraSub');
      if (netoExtraLabel) netoExtraLabel.textContent = 'Con guardias ' + pagaLabel;
      if (netoMesExtra) netoMesExtra.textContent = fmtBig(netoPagaTotal);
      if (netoMesExtraSub) netoMesExtraSub.textContent = '+' + fmtBig(extraMes) + ' guardias/mes';
      metricExtra.style.animation = 'none';
      void metricExtra.offsetWidth;
      metricExtra.style.animation = '';
    } else {
      metricExtra.style.display = 'none';
      grid.className = 'result-grid single';
    }
  }

  const rowExtra = document.getElementById('rowExtra');
  if (rowExtra) rowExtra.style.display = extraAnual > 0 ? 'flex' : 'none';
  
  const dBruto = document.getElementById('dBruto');
  const dExtra = document.getElementById('dExtra');
  const dBrutoTotal = document.getElementById('dBrutoTotal');
  const dSS = document.getElementById('dSS');
  const dRNT = document.getElementById('dRNT');
  const dReduc = document.getElementById('dReduc');
  const dBL = document.getElementById('dBL');
  const dBI = document.getElementById('dBI');
  const dCuotaTotal = document.getElementById('dCuotaTotal');
  const dTipoEfectivo = document.getElementById('dTipoEfectivo');
  const dAyuda = document.getElementById('dAyuda');
  const dNetoAnual = document.getElementById('dNetoAnual');
  
  if (dBruto) dBruto.textContent = fmt(brutoBase);
  if (dExtra) dExtra.textContent = extraAnual > 0 ? '+' + fmt(extraAnual) : '+0 €';
  if (dBrutoTotal) dBrutoTotal.textContent = fmt(brutoSujeto);
  if (dSS) dSS.textContent = '-' + fmt(ss, 2);
  if (dRNT) dRNT.textContent = fmt(rnt, 2);
  if (dReduc) dReduc.textContent = '-' + fmt(reduccion, 2);
  if (dBL) dBL.textContent = fmt(baseLiq, 2);
  if (dBI) dBI.textContent = fmt(baseImp, 2);
  if (dCuotaTotal) dCuotaTotal.textContent = '-' + fmt(cuotaTotal, 2);
  if (dTipoEfectivo) dTipoEfectivo.textContent = fmtPercent(tipoEfect, 2);
  if (dAyuda) dAyuda.textContent = '+' + fmt(ayudaAnual, 2);
  if (dNetoAnual) dNetoAnual.textContent = fmt(netoAnual, 2);

  // Tipo marginal
  let tipoMarginal = 0;
  if (baseImp > 0) {
    const escalaAut = ESCALAS_AUTONOMICAS[comunidadActual]?.escala || ESCALAS_AUTONOMICAS.murcia.escala;
    const todosTramos = [...ESCALA_ESTATAL.map(e => ({ hasta: e.hasta, tipo: e.tipo })), ...escalaAut.map(e => ({ hasta: e.hasta, tipo: e.tipo }))];
    const ultimoTramo = todosTramos.filter(t => t.hasta >= baseImp).sort((a, b) => a.hasta - b.hasta)[0];
    if (ultimoTramo) tipoMarginal = (ultimoTramo.tipo * 2) * 100;
  }
  
  const tipoEfectivoElem = document.getElementById('tipoEfectivoResumen');
  const tipoMarginalElem = document.getElementById('tipoMarginal');
  if (tipoEfectivoElem) tipoEfectivoElem.textContent = fmtPercent(tipoEfect, 2);
  if (tipoMarginalElem) tipoMarginalElem.textContent = fmtPercent(tipoMarginal, 2);

  // Devolucion
  const retencionEmpresa = parseFloat(document.getElementById('retencionEmpresa')?.value) || 0;
  const devolucionCard = document.getElementById('devolucionCard');
  
  if (retencionEmpresa > 0 && brutoSujeto > 0 && devolucionCard) {
    const retenidoEmpresa = brutoSujeto * (retencionEmpresa / 100);
    const diferencia = retenidoEmpresa - cuotaTotal;
    const devolucionValue = document.getElementById('devolucionValue');
    const devolucionLabel = document.getElementById('devolucionLabel');
    const devolucionSub = document.getElementById('devolucionSub');
    const devolucionMetric = document.getElementById('devolucionMetric');
    
    if (devolucionLabel && devolucionValue && devolucionSub && devolucionMetric) {
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
        devolucionSub.textContent = `Tu retencion (${fmtPercent(retencionEmpresa, 2)}) coincide con tu IRPF real`;
      }
      devolucionCard.style.display = 'block';
    }
  } else if (devolucionCard) {
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
    for (const t of ESCALA_ESTATAL) if (t.hasta >= hasta) { tipoEstatal = t.tipo; break; }
    let tipoAut = 0;
    for (const t of ESCALAS_AUTONOMICAS[comunidadActual].escala) if (t.hasta >= hasta) { tipoAut = t.tipo; break; }
    const bt = hasta - prev;
    combined.push({ desde: prev, hasta: hasta, tipo: tipoEstatal + tipoAut, cuota: bt * (tipoEstatal + tipoAut) });
    prev = hasta;
  }
  
  if (prev < baseImp) {
    let tipoEstatal = 0;
    for (const t of ESCALA_ESTATAL) if (t.hasta >= baseImp) { tipoEstatal = t.tipo; break; }
    let tipoAut = 0;
    for (const t of ESCALAS_AUTONOMICAS[comunidadActual].escala) if (t.hasta >= baseImp) { tipoAut = t.tipo; break; }
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

  const tramosViz = document.getElementById('tramosViz');
  if (tramosViz) {
    tramosViz.innerHTML = tramosHtml || '<div style="color:var(--muted);font-family:var(--mono);font-size:0.75rem">Base imponible es 0 o negativa.</div>';
  }

  document.querySelectorAll('.tooltip-tramo').forEach(el => {
    const tt = el.dataset.tooltip;
    if (tt && !el.hasAttribute('data-tooltip-attached')) {
      el.setAttribute('data-tooltip-attached', 'true');
      el.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tt));
      el.addEventListener('mouseleave', onTooltipMouseLeave);
      el.addEventListener('touchstart', (e) => onTooltipTap(e, tt));
    }
  });

  // Donut chart
  const brutoTotal = brutoSujeto + ayudaAnual;
  const segments = [
    { label: 'Neto', val: netoAnual, color: '#e8ff47' },
    { label: 'IRPF', val: cuotaTotal, color: '#ff5757' },
    { label: 'Seguridad Social', val: ss, color: '#47c8ff' }
  ];
  drawDonutInteractive(segments);
  buildLegend(segments, brutoTotal);
  
  // Reinicializar tooltips después de actualizar el DOM
  setTimeout(() => {
    initTooltips();
  }, 50);
}

// ============================================================
// INICIALIZACION
// ============================================================

function setupComunidadSelector() {
  const selector = document.getElementById('selectorComunidad');
  if (selector) {
    selector.innerHTML = '';
    const comunidades = Object.keys(ESCALAS_AUTONOMICAS).map(key => ({
      id: key,
      nombre: ESCALAS_AUTONOMICAS[key].nombre
    }));
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

// Eventos globales
window.addEventListener('scroll', onScrollOrTouchMove);
window.addEventListener('touchmove', onScrollOrTouchMove);

// Event listeners
const brutoAnual = document.getElementById('brutoAnual');
const extraMes = document.getElementById('extraMes');
const ayudaMes = document.getElementById('ayudaMes');
const togglePagas = document.getElementById('togglePagas');
const retencionEmpresa = document.getElementById('retencionEmpresa');

if (brutoAnual) brutoAnual.addEventListener('input', calcular);
if (extraMes) extraMes.addEventListener('input', calcular);
if (ayudaMes) ayudaMes.addEventListener('input', calcular);
if (togglePagas) togglePagas.addEventListener('change', calcular);
if (retencionEmpresa) retencionEmpresa.addEventListener('input', calcular);

document.addEventListener('DOMContentLoaded', () => {
  setupComunidadSelector();
  initTooltips();
  calcular();
});