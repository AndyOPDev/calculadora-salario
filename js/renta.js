// ============================================================
// MODULO DE SIMULADOR DE RENTA (Inversiones y Planes de Pensiones)
// ============================================================

window.baseImponibleGeneral = 0;
window.retencionesTrabajo = 0;
window.tipoEfectivoGeneral = 0;
window.MINIMO_PERSONAL_GLOBAL = 5550;

window.calcularRenta = function() {

  // Obtener elementos
  const interesesEl = document.getElementById('intereses');
  const interesesExtEl = document.getElementById('interesesExtranjero');
  const dividendosEl = document.getElementById('dividendos');
  const dividendosExtEl = document.getElementById('dividendosExtranjero');
  const gananciasEl = document.getElementById('ganancias');
  const perdidasEl = document.getElementById('perdidas');
  const perdidasAnterioresEl = document.getElementById('perdidasAnteriores');
  const planIndivEl = document.getElementById('planPensionesIndividual');
  const planEmpresaEl = document.getElementById('planPensionesEmpresa');
  const resultadoRentaEl = document.getElementById('resultadoRenta');
  const resultadoRentaSubEl = document.getElementById('resultadoRentaSub');
  const desgloseRentaEl = document.getElementById('desgloseRenta');

  // Leer valores
  const intereses = parseFloat(interesesEl?.value) || 0;
  const interesesExtranjero = interesesExtEl?.checked || false;
  const dividendos = parseFloat(dividendosEl?.value) || 0;
  const dividendosExtranjero = dividendosExtEl?.checked || false;
  const ganancias = parseFloat(gananciasEl?.value) || 0;
  const perdidas = parseFloat(perdidasEl?.value) || 0;
  const perdidasAnteriores = parseFloat(perdidasAnterioresEl?.value) || 0;
  const planIndiv = parseFloat(planIndivEl?.value) || 0;
  const planEmpresa = parseFloat(planEmpresaEl?.value) || 0;

  // 1. Rendimientos del capital (intereses + dividendos)
  const rendimientosCapital = intereses + dividendos;

  // 2. Retenciones del ahorro (solo si NO es extranjero)
  let retencionesAhorro = 0;
  if (!interesesExtranjero) retencionesAhorro += intereses * 0.19;
  if (!dividendosExtranjero) retencionesAhorro += dividendos * 0.19;

  // 3. Ganancias patrimoniales netas (pérdidas del año compensan ganancias)
  let gananciasPatrimonialesNetas = ganancias - perdidas;

  // 4. Compensación con pérdidas de años anteriores (límite 25% de rendimientosCapital)
  let perdidasAnterioresUsadas = 0;
  const limiteCompensacion = rendimientosCapital * 0.25;
  if (perdidasAnteriores > 0 && gananciasPatrimonialesNetas < 0) {
    // Si ya hay pérdidas este año, se suman a las anteriores
    const perdidasTotales = Math.abs(gananciasPatrimonialesNetas) + perdidasAnteriores;
    perdidasAnterioresUsadas = Math.min(perdidasTotales, limiteCompensacion);
    gananciasPatrimonialesNetas = 0; // Se compensaron todas
  } else if (perdidasAnteriores > 0 && rendimientosCapital > 0) {
    perdidasAnterioresUsadas = Math.min(perdidasAnteriores, limiteCompensacion);
  }

  // 5. Base del ahorro final (después de compensaciones)
  const baseAhorroFinal = Math.max(0, rendimientosCapital - perdidasAnterioresUsadas);

  // 6. Cuota del ahorro
  const cuotaAhorro = calcularCuotaAhorro(baseAhorroFinal);

  // 7. Ganancias patrimoniales netas (lo que queda por tributar)
  const gananciasPatrimonialesTributables = Math.max(0, gananciasPatrimonialesNetas);
  const cuotaPatrimoniales = calcularCuotaAhorro(gananciasPatrimonialesTributables);

  // 8. Cuota total del ahorro
  const cuotaTotalAhorro = cuotaAhorro + cuotaPatrimoniales;

  // 9. Planes de pensiones
  const reduccionPensiones = calcularReduccionPensiones(planIndiv, planEmpresa);

  // 10. Base general
  const baseGeneralOriginal = window.baseImponibleGeneral || 0;
  const nuevaBaseGeneral = Math.max(baseGeneralOriginal - reduccionPensiones, 0);
  const nuevaCuotaGeneral = window.calcularCuotaTotalGlobal ? window.calcularCuotaTotalGlobal(nuevaBaseGeneral) : 0;

  // 11. Cuota total
  const cuotaTotal = nuevaCuotaGeneral + cuotaTotalAhorro;

  // 12. Retenciones trabajo
  let retencionesTrabajo = window.retencionesTrabajo || 0;
  if (retencionesTrabajo === 0 && baseGeneralOriginal > 0 && window.tipoEfectivoGeneral > 0) {
    retencionesTrabajo = (baseGeneralOriginal + window.MINIMO_PERSONAL_GLOBAL) * (window.tipoEfectivoGeneral / 100);
  }

  // 13. Retenciones totales
  const retencionesTotales = retencionesTrabajo + retencionesAhorro;

  // 14. Resultado final
  const resultadoFinal = retencionesTotales - cuotaTotal;

  // Mostrar resultado
  if (resultadoRentaEl) {
    if (resultadoFinal > 0.01) {
      resultadoRentaEl.textContent = fmt(resultadoFinal, 2);
      resultadoRentaEl.style.color = 'var(--green)';
      resultadoRentaSubEl.textContent = 'Hacienda te devuelve ' + fmt(resultadoFinal, 2);
    } else if (resultadoFinal < -0.01) {
      resultadoRentaEl.textContent = fmt(Math.abs(resultadoFinal), 2);
      resultadoRentaEl.style.color = 'var(--red)';
      resultadoRentaSubEl.textContent = 'Te sale a pagar ' + fmt(Math.abs(resultadoFinal), 2);
    } else {
      resultadoRentaEl.textContent = '0,00 €';
      resultadoRentaEl.style.color = 'var(--accent)';
      resultadoRentaSubEl.textContent = 'Cuadra exactamente';
    }
  }

  // Mostrar desglose
  if (desgloseRentaEl) {
    desgloseRentaEl.innerHTML = `
      <div class="brow"><span class="name">Base imponible general (trabajo)</span><span class="val neutral">${fmt(baseGeneralOriginal, 2)}</span></div>
      <div class="brow"><span class="name">- Reduccion plan pensiones</span><span class="val neg">-${fmt(reduccionPensiones, 2)}</span></div>
      <div class="brow"><span class="name">= Base general final</span><span class="val neutral">${fmt(nuevaBaseGeneral, 2)}</span></div>
      <div class="brow"><span class="name">Cuota IRPF (general)</span><span class="val neg">-${fmt(nuevaCuotaGeneral, 2)}</span></div>
      <div class="brow"><span class="name">Rendimientos capital</span><span class="val neutral">${fmt(rendimientosCapital, 2)}</span></div>
      <div class="brow"><span class="name">- Perdidas anteriores</span><span class="val neg">-${fmt(perdidasAnterioresUsadas, 2)}</span></div>
      <div class="brow"><span class="name">= Base ahorro final</span><span class="val neutral">${fmt(baseAhorroFinal, 2)}</span></div>
      <div class="brow"><span class="name">Cuota IRPF (ahorro)</span><span class="val neg">-${fmt(cuotaAhorro, 2)}</span></div>
      <div class="brow"><span class="name">Ganancias patrimoniales netas</span><span class="val neutral">${fmt(gananciasPatrimonialesTributables, 2)}</span></div>
      <div class="brow"><span class="name">Cuota IRPF (patrimoniales)</span><span class="val neg">-${fmt(cuotaPatrimoniales, 2)}</span></div>
      <div class="brow"><span class="name">Retenciones trabajo</span><span class="val pos">+${fmt(retencionesTrabajo, 2)}</span></div>
      <div class="brow"><span class="name">Retenciones ahorro (19%)</span><span class="val pos">+${fmt(retencionesAhorro, 2)}</span></div>
      <div class="brow total"><span class="name">RESULTADO</span><span class="val">${resultadoFinal > 0.01 ? 'A devolver ' + fmt(resultadoFinal, 2) : (resultadoFinal < -0.01 ? 'A pagar ' + fmt(Math.abs(resultadoFinal), 2) : '0,00 €')}</span></div>
      ${perdidasAnterioresUsadas > 0 ? `<div class="brow"><span class="name">Perdidas restantes para proximos años</span><span class="val neutral">${fmt(perdidasAnteriores - perdidasAnterioresUsadas, 2)}</span></div>` : ''}
    `;
  }
};

function initRentaListeners() {

  const inputs = ['intereses', 'interesesExtranjero', 'dividendos', 'dividendosExtranjero', 
                  'ganancias', 'perdidas', 'perdidasAnteriores', 
                  'planPensionesIndividual', 'planPensionesEmpresa'];

  inputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.removeEventListener('input', window.calcularRenta);
      element.removeEventListener('change', window.calcularRenta);
      element.addEventListener('input', window.calcularRenta);
      if (element.type === 'checkbox') {
        element.addEventListener('change', window.calcularRenta);
      }
    }
  });

  if (typeof window.calcularRenta === 'function') {
    window.calcularRenta();
  }
}

window.initRentaListeners = initRentaListeners;