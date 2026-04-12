// ============================================================
// CONFIGURACIÓN DE ESCALAS IRPF
// ============================================================

const ESCALA_ESTATAL = [
  { hasta: 12450,    tipo: 0.095 },
  { hasta: 20200,    tipo: 0.12  },
  { hasta: 35200,    tipo: 0.15  },
  { hasta: 60000,    tipo: 0.185 },
  { hasta: 300000,   tipo: 0.225 },
  { hasta: Infinity, tipo: 0.245 },
];

const ESCALA_MURCIA = [
  { hasta: 12450,    tipo: 0.095 },
  { hasta: 20200,    tipo: 0.12  },
  { hasta: 35200,    tipo: 0.15  },
  { hasta: 60000,    tipo: 0.185 },
  { hasta: 120000,   tipo: 0.235 },
  { hasta: 175000,   tipo: 0.245 },
  { hasta: Infinity, tipo: 0.25  },
];

const SS_TOTAL = 0.047 + 0.0155 + 0.001;  // 6.35%
const MINIMO_PERSONAL = 5550;

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function setMode(is14) {
  document.getElementById('togglePagas').checked = is14;
  calcular();
}

function reduccionRendTrabajo(rnt) {
  if (rnt <= 14852)    return 6498;
  if (rnt <= 17673.52) return Math.max(6498 - 1.14286 * (rnt - 14852), 0);
  return 2364;
}

function calcularCuota(base, escala) {
  let c = 0, prev = 0;
  for (const t of escala) {
    const ap = Math.min(base, t.hasta) - prev;
    if (ap <= 0) break;
    c += ap * t.tipo;
    prev = t.hasta;
    if (base <= t.hasta) break;
  }
  return c;
}

function fmtBig(n) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmt(n, d = 0) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €';
}

// ============================================================
// DONUT CHART
// ============================================================

function drawDonut(segments) {
  const svg = document.getElementById('donutSvg');
  const cx = 75, cy = 75, r = 58, strokeW = 22;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.val, 0);

  let html = '';
  html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e1e22" stroke-width="${strokeW}"/>`;

  let offset = 0;
  segments.forEach(seg => {
    const pct = seg.val / total;
    const dash = pct * circ;
    const gap  = circ - dash;
    html += `<circle
      cx="${cx}" cy="${cy}" r="${r}"
      fill="none"
      stroke="${seg.color}"
      stroke-width="${strokeW}"
      stroke-dasharray="${dash.toFixed(3)} ${gap.toFixed(3)}"
      stroke-dashoffset="${(circ * (1 - offset + 0.25)).toFixed(3)}"
      style="transition: stroke-dasharray 0.5s ease;"
    />`;
    offset += pct;
  });

  html += `
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" fill="#555560" letter-spacing="1">NETO</text>
    <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#e8ff47" id="donutCenter">—</text>
  `;

  svg.innerHTML = html;
}

function updateDonutCenter(pct) {
  const el = document.getElementById('donutCenter');
  if (el) el.textContent = pct.toFixed(1) + '%';
}

function buildLegend(segments, total) {
  const el = document.getElementById('chartLegend');
  el.innerHTML = segments.map(s => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div class="legend-info">
        <div class="legend-name">${s.label}</div>
        <div class="legend-val" style="color:${s.color}">${fmt(s.val, 2)}<span class="legend-pct">${(s.val/total*100).toFixed(1)}%</span></div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// CÁLCULO PRINCIPAL
// ============================================================

function calcular() {
  const brutoBase = parseFloat(document.getElementById('brutoAnual').value) || 0;
  const extraMes  = parseFloat(document.getElementById('extraMes').value)   || 0;
  const ayudaMes  = parseFloat(document.getElementById('ayudaMes').value)   || 0;
  const pagas14   = document.getElementById('togglePagas').checked;
  const numPagas  = pagas14 ? 14 : 12;

  document.getElementById('lbl12').classList.toggle('active', !pagas14);
  document.getElementById('lbl14').classList.toggle('active',  pagas14);

  if (brutoBase <= 0) {
    document.getElementById('resultCard').style.display = 'none';
    return;
  }

  const extraAnual  = extraMes * 12;
  const ayudaAnual  = ayudaMes * 12;
  const brutoSujeto = brutoBase + extraAnual;

  const ss         = brutoSujeto * SS_TOTAL;
  const rnt        = brutoSujeto - ss;
  const reduccion  = reduccionRendTrabajo(rnt);
  const baseLiq    = Math.max(rnt - reduccion, 0);
  const baseImp    = Math.max(baseLiq - MINIMO_PERSONAL, 0);
  const cuotaEst   = calcularCuota(baseImp, ESCALA_ESTATAL);
  const cuotaAut   = calcularCuota(baseImp, ESCALA_MURCIA);
  const cuotaTotal = cuotaEst + cuotaAut;
  const tipoEfect  = brutoSujeto > 0 ? (cuotaTotal / brutoSujeto * 100) : 0;

  const netoAnual      = brutoSujeto - ss - cuotaTotal + ayudaAnual;
  const netoAnualBase  = brutoBase / brutoSujeto * (brutoSujeto - ss - cuotaTotal) + ayudaAnual;
  const netoPagaBase   = netoAnualBase / numPagas;
  const netoPagaTotal  = netoAnual / numPagas;

  // Mostrar resultados
  document.getElementById('resultCard').style.display = 'block';

  const pagaLabel = pagas14 ? 'por paga (×14)' : 'mensual (×12)';
  document.getElementById('netoMesLabel').textContent = `Neto ${pagaLabel}`;
  document.getElementById('netoMes').textContent      = fmtBig(netoPagaBase);
  document.getElementById('netoMesSub').textContent   = `${fmt(netoAnualBase, 2)} neto anual`;

  const hasExtra    = extraMes > 0;
  const metricExtra = document.getElementById('metricExtra');
  const grid        = document.getElementById('resultGrid');

  if (hasExtra) {
    metricExtra.style.display = 'block';
    grid.className = 'result-grid double';
    document.getElementById('netoExtraLabel').textContent  = `Con guardias ${pagaLabel}`;
    document.getElementById('netoMesExtra').textContent    = fmtBig(netoPagaTotal);
    document.getElementById('netoMesExtraSub').textContent = `+${fmtBig(extraMes)} guardias/mes`;
    metricExtra.style.animation = 'none';
    void metricExtra.offsetWidth;
    metricExtra.style.animation = '';
  } else {
    metricExtra.style.display = 'none';
    grid.className = 'result-grid single';
  }

  // Desglose
  document.getElementById('rowExtra').style.display      = 'flex';
  document.getElementById('rowBrutoTotal').style.display = 'flex';

  document.getElementById('dBruto').textContent      = fmt(brutoBase);
  document.getElementById('dExtra').textContent      = `+${fmt(extraAnual)}`;
  document.getElementById('dBrutoTotal').textContent  = fmt(brutoSujeto);
  document.getElementById('dSS').textContent         = `−${fmt(ss, 2)}`;
  document.getElementById('dRNT').textContent        = fmt(rnt, 2);
  document.getElementById('dReduc').textContent      = `−${fmt(reduccion, 2)}`;
  document.getElementById('dBL').textContent         = fmt(baseLiq, 2);
  document.getElementById('dBI').textContent         = fmt(baseImp, 2);
  document.getElementById('dCuotaTotal').textContent  = `−${fmt(cuotaTotal, 2)}`;
  document.getElementById('dTipoEfectivo').textContent = `${tipoEfect.toFixed(2)}%`;
  document.getElementById('dAyuda').textContent      = `+${fmt(ayudaAnual, 2)}`;
  document.getElementById('dNetoAnual').textContent   = fmt(netoAnual, 2);

  // Tramos IRPF
  const colors = ['#47c8ff','#47ffb2','#e8ff47','#ffb847','#ff7847','#ff4747'];
  const breaks = [...new Set([
    ...ESCALA_ESTATAL.map(t => t.hasta),
    ...ESCALA_MURCIA.map(t => t.hasta)
  ])].filter(v => v < Infinity).sort((a,b) => a-b);

  const combined = [];
  let prev=0, iE=0, iA=0;
  for (const br of breaks) {
    if (br > baseImp) break;
    const bt = br - prev;
    if (bt <= 0) { prev=br; continue; }
    while (iE < ESCALA_ESTATAL.length && ESCALA_ESTATAL[iE].hasta <= prev) iE++;
    while (iA < ESCALA_MURCIA.length  && ESCALA_MURCIA[iA].hasta  <= prev) iA++;
    const tE = iE < ESCALA_ESTATAL.length ? ESCALA_ESTATAL[iE].tipo : 0;
    const tA = iA < ESCALA_MURCIA.length  ? ESCALA_MURCIA[iA].tipo  : 0;
    combined.push({ desde: prev, hasta: br, tipo: tE+tA, cuota: bt*(tE+tA) });
    prev = br;
  }
  if (prev < baseImp) {
    while (iE < ESCALA_ESTATAL.length && ESCALA_ESTATAL[iE].hasta <= prev) iE++;
    while (iA < ESCALA_MURCIA.length  && ESCALA_MURCIA[iA].hasta  <= prev) iA++;
    const tE = iE < ESCALA_ESTATAL.length ? ESCALA_ESTATAL[iE].tipo : 0;
    const tA = iA < ESCALA_MURCIA.length  ? ESCALA_MURCIA[iA].tipo  : 0;
    combined.push({ desde: prev, hasta: baseImp, tipo: tE+tA, cuota: (baseImp-prev)*(tE+tA) });
  }

  let tramosHtml = '';
  combined.forEach((t,i) => {
    const pct   = baseImp > 0 ? ((t.hasta-t.desde)/baseImp*100) : 0;
    const color = colors[i % colors.length];
    tramosHtml += `<div class="tramo-item">
      <div class="tramo-info">${fmt(t.desde)} – ${fmt(t.hasta)} · <strong>${(t.tipo*100).toFixed(1)}%</strong></div>
      <div class="tramo-bar-bg"><div class="tramo-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="tramo-tax" style="color:${color}">−${fmt(t.cuota,0)}</div>
    </div>`;
  });

  document.getElementById('tramosViz').innerHTML = tramosHtml ||
    '<div style="color:var(--muted);font-family:var(--mono);font-size:0.75rem">Base imponible ≤ 0.</div>';

  // Donut chart
  const brutoTotal = brutoSujeto + ayudaAnual;
  const segments = [
    { label: 'Neto',          val: netoAnual,  color: '#e8ff47' },
    { label: 'IRPF',          val: cuotaTotal, color: '#ff5757' },
    { label: 'SS trabajador', val: ss,         color: '#47c8ff' },
  ];

  drawDonut(segments);
  updateDonutCenter(netoAnual / brutoTotal * 100);
  buildLegend(segments, brutoTotal);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

document.getElementById('brutoAnual').addEventListener('input', calcular);
document.getElementById('extraMes').addEventListener('input', calcular);
document.getElementById('ayudaMes').addEventListener('input', calcular);
document.getElementById('togglePagas').addEventListener('change', calcular);

// Inicializar
calcular();dame la sen