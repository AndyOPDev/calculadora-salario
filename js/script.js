// ============================================================
// TOOLTIPS OPTIMIZADOS PARA MÓVIL
// ============================================================

let chartTooltip = null;
let tooltipTimeout = null;
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
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  if (chartTooltip) {
    chartTooltip.classList.remove('visible');
  }
  activeTooltipElement = null;
}

function showChartTooltip(event, text, isTap = false) {
  // Ocultar tooltip anterior si existe
  hideChartTooltip();
  
  const tooltip = createChartTooltip();
  tooltip.innerHTML = text.replace(/\n/g, '<br>');
  
  // Obtener coordenadas
  let clientX, clientY;
  if (event.touches) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  
  tooltip.classList.add('visible');
  
  // Posicionar tooltip
  let x = clientX + 15;
  let y = clientY - 10;
  
  // Ajustar posición después de mostrar
  setTimeout(() => {
    const tooltipRect = tooltip.getBoundingClientRect();
    if (x + tooltipRect.width > window.innerWidth) {
      x = clientX - tooltipRect.width - 10;
    }
    if (y + tooltipRect.height > window.innerHeight) {
      y = clientY - tooltipRect.height - 10;
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }, 10);
  
  if (isTap) {
    activeTooltipElement = event.currentTarget;
  }
}

function moveChartTooltip(event) {
  if (chartTooltip && chartTooltip.classList.contains('visible') && !activeTooltipElement) {
    const x = event.clientX + 15;
    const y = event.clientY - 10;
    chartTooltip.style.left = x + 'px';
    chartTooltip.style.top = y + 'px';
  }
}

// Manejador para tap (móvil) - tooltip se queda fijo
function onTooltipTap(event, text) {
  event.preventDefault();
  event.stopPropagation();
  showChartTooltip(event, text, true);
}

// Manejador para ratón (hover)
function onTooltipMouseEnter(event, text) {
  showChartTooltip(event, text, false);
}

function onTooltipMouseLeave() {
  // Solo ocultar si no es un tooltip fijo (de tap)
  if (!activeTooltipElement) {
    hideChartTooltip();
  }
}

// Cerrar tooltips al hacer scroll
let scrollTimer = null;
function onScrollOrTouchMove() {
  if (activeTooltipElement) {
    // Pequeño retraso para evitar que se cierre con toques accidentales
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      hideChartTooltip();
      scrollTimer = null;
    }, 50);
  }
}

// ============================================================
// ACTUALIZAR TODOS LOS ELEMENTOS CON TOOLTIPS
// ============================================================

function initTooltips() {
  // Tooltips para inputs (labels)
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
      if (label && !label.hasAttribute('data-tooltip-attached')) {
        label.setAttribute('data-tooltip-attached', 'true');
        // Ratón
        label.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, field.text));
        label.addEventListener('mouseleave', onTooltipMouseLeave);
        // Táctil (tap)
        label.addEventListener('touchstart', (e) => onTooltipTap(e, field.text));
        label.style.cursor = 'help';
      }
    }
  });
  
  // Tooltips para filas del desglose
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
      if (browDiv && !browDiv.hasAttribute('data-tooltip-attached')) {
        browDiv.setAttribute('data-tooltip-attached', 'true');
        browDiv.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, field.text));
        browDiv.addEventListener('mouseleave', onTooltipMouseLeave);
        browDiv.addEventListener('touchstart', (e) => onTooltipTap(e, field.text));
        browDiv.style.cursor = 'help';
      }
    }
  });
  
  // Tooltips para labels de métricas
  const netoMesLabel = document.getElementById('netoMesLabel');
  if (netoMesLabel && !netoMesLabel.hasAttribute('data-tooltip-attached')) {
    netoMesLabel.setAttribute('data-tooltip-attached', 'true');
    netoMesLabel.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.netoMesLabel));
    netoMesLabel.addEventListener('mouseleave', onTooltipMouseLeave);
    netoMesLabel.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.netoMesLabel));
    netoMesLabel.style.cursor = 'help';
  }
  
  const netoExtraLabel = document.getElementById('netoExtraLabel');
  if (netoExtraLabel && !netoExtraLabel.hasAttribute('data-tooltip-attached')) {
    netoExtraLabel.setAttribute('data-tooltip-attached', 'true');
    netoExtraLabel.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipsText.netoExtraLabel));
    netoExtraLabel.addEventListener('mouseleave', onTooltipMouseLeave);
    netoExtraLabel.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipsText.netoExtraLabel));
    netoExtraLabel.style.cursor = 'help';
  }
  
  // Tooltips para resumen ejecutivo
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
}

// ============================================================
// DONUT CHART (ACTUALIZADO)
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
    if (seg.label === 'Neto') tooltipText = 'Neto\nEl dinero que realmente llega a tu bolsillo despues de pagar impuestos y cotizaciones sociales.\n\n';
    else if (seg.label === 'IRPF') tooltipText = 'IRPF\nImpuesto sobre la renta. Financia: sanidad, educacion, infraestructuras, defensa, pensiones...\n\n';
    else tooltipText = 'Seguridad Social\nFinancia: pensiones, desempleo, bajas laborales, formacion profesional...\n\n';
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
    if (tooltipText && !el.hasAttribute('data-tooltip-attached')) {
      el.setAttribute('data-tooltip-attached', 'true');
      // Ratón
      el.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipText));
      el.addEventListener('mouseleave', onTooltipMouseLeave);
      // Táctil
      el.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipText));
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
    
    return `<div class="legend-item" style="cursor:help" data-tooltip-text="${legendTooltip.replace(/"/g, '&quot;')}">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div class="legend-info">
        <div class="legend-name">${s.label}</div>
        <div class="legend-val" style="color:${s.color}">${fmt(s.val, 2)}<span class="legend-pct">${fmtPercent(s.val / total * 100, 1)}</span></div>
      </div>
    </div>`;
  }).join('');
  
  // Añadir event listeners a los legend items
  document.querySelectorAll('.legend-item').forEach(el => {
    const tooltipText = el.dataset.tooltipText;
    if (tooltipText && !el.hasAttribute('data-tooltip-attached')) {
      el.setAttribute('data-tooltip-attached', 'true');
      el.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipText));
      el.addEventListener('mouseleave', onTooltipMouseLeave);
      el.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipText));
    }
  });
}

// ============================================================
// ACTUALIZAR TRAMOS (tooltip-tramo)
// ============================================================

// Dentro de la función calcular(), después de generar tramosHtml,
// actualizar los event listeners de .tooltip-tramo:

// En lugar de los event listeners actuales, usa:

/*
document.querySelectorAll('.tooltip-tramo').forEach(el => {
  const tooltipText = el.dataset.tooltip;
  if (tooltipText && !el.hasAttribute('data-tooltip-attached')) {
    el.setAttribute('data-tooltip-attached', 'true');
    el.addEventListener('mouseenter', (e) => onTooltipMouseEnter(e, tooltipText));
    el.addEventListener('mouseleave', onTooltipMouseLeave);
    el.addEventListener('touchstart', (e) => onTooltipTap(e, tooltipText));
  }
});
*/

// ============================================================
// EVENTOS GLOBALES PARA CERRAR TOOLTIPS
// ============================================================

// Cerrar tooltips al hacer scroll
window.addEventListener('scroll', onScrollOrTouchMove);
window.addEventListener('touchmove', onScrollOrTouchMove);