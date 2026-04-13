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
  const planIndiv = parseFloat(planIndivEl?.value) || 0;
  const planEmpresa = parseFloat(planEmpresaEl?.value) || 0;

  // 1. Rendimientos del capital (intereses + dividendos)
  const rendimientosCapital = intereses + dividendos;

  // 2. Retenciones del ahorro (solo si NO es extranjero)
  let retencionesAhorro = 0;
  if (!interesesExtranjero) retencionesAhorro += intereses * 0.19;
  if (!dividendosExtranjero) retencionesAhorro += dividendos * 0.19;

  // 3. Ganancias patrimoniales netas (pérdidas del año compensan ganancias SIN límite)
  let gananciasPatrimonialesNetas = ganancias - perdidas;
  let excesoPerdidas = 0;

  if (gananciasPatrimonialesNetas < 0) {
    excesoPerdidas = Math.abs(gananciasPatrimonialesNetas);
    gananciasPatrimonialesNetas = 0;
  }

  // 4. Compensación del exceso de pérdidas con rendimientos del capital (límite 25%)
  let perdidasUsadasContraCapital = 0;
  const limiteCompensacion = rendimientosCapital * 0.25;

  if (excesoPerdidas > 0 && rendimientosCapital > 0) {
    perdidasUsadasContraCapital = Math.min(excesoPerdidas, limiteCompensacion);
  }

  // 5. Base del ahorro final (después de compensación)
  const baseAhorroFinal = Math.max(0, rendimientosCapital - perdidasUsadasContraCapital);

  // 6. Cuota del ahorro
  const cuotaAhorro = calcularCuotaAhorro(baseAhorroFinal);

  // 7. Cuota de las ganancias patrimoniales
  const cuotaPatrimoniales = calcularCuotaAhorro(gananciasPatrimonialesNetas);

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

  // Mostrar desglose con tooltips
  if (desgloseRentaEl) {
    desgloseRentaEl.innerHTML = `
      <div class="brow" tooltip-data="Es tu base imponible despues de restar la Seguridad Social, la reduccion por rendimientos del trabajo y el minimo personal. Sobre esta cantidad se calcula el IRPF de tu sueldo.">
        <span class="name">Base imponible general (trabajo)</span>
        <span class="val neutral">${fmt(baseGeneralOriginal, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Las aportaciones a planes de pensiones reducen tu base imponible general. Limite individual: 1.500 €, limite empresa: 8.500 €.">
        <span class="name">- Reduccion plan pensiones</span>
        <span class="val neg">-${fmt(reduccionPensiones, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Resultado de restar las aportaciones a planes de pensiones de tu base imponible general. Sobre esta cantidad se calcula la cuota IRPF general.">
        <span class="name">= Base general final</span>
        <span class="val neutral">${fmt(nuevaBaseGeneral, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Impuesto que debes pagar por tu salario. Se calcula aplicando la escala estatal + autonómica sobre la base general final.">
        <span class="name">Cuota IRPF (general)</span>
        <span class="val neg">-${fmt(nuevaCuotaGeneral, 2)}</span>
      </div>
      <div class="brow" tooltip-data="RSuma de los intereses de cuentas bancarias y dividendos de acciones. Los bancos españoles ya retienen el 19% en origen.">
        <span class="name">Rendimientos capital</span>
        <span class="val neutral">${fmt(rendimientosCapital, 2)}</span>
      </div>
      ${perdidasUsadasContraCapital > 0 ? `
      <div class="brow" tooltip-data="Exceso de perdidas usado - Las perdidas patrimoniales que exceden las ganancias pueden compensar hasta el 25% de los intereses y dividendos.">
        <span class="name">- Exceso perdidas usado</span>
        <span class="val neg">-${fmt(perdidasUsadasContraCapital, 2)}</span>
      </div>` : ''}
      <div class="brow" tooltip-data="Cantidad sobre la que tributan tus intereses y dividendos despues de aplicar las compensaciones por perdidas.">
        <span class="name">= Base ahorro final</span>
        <span class="val neutral">${fmt(baseAhorroFinal, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Impuesto que pagas por tus intereses y dividendos. Se calcula con la escala progresiva del ahorro: 19% hasta 6.000 €, 21% hasta 50.000 €, 23% hasta 200.000 €, 27% hasta 300.000 €, 28% en adelante.">
        <span class="name">Cuota IRPF (ahorro)</span>
        <span class="val neg">-${fmt(cuotaAhorro, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Ganancias obtenidas por la venta de activos (acciones, fondos, ETF, criptomonedas, inmuebles) menos las perdidas del mismo año.">
        <span class="name">Ganancias patrimoniales netas</span>
        <span class="val neutral">${fmt(gananciasPatrimonialesNetas, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Impuesto que pagas por tus ganancias patrimoniales. Se calcula con la misma escala progresiva del ahorro.">
        <span class="name">Cuota IRPF (patrimoniales)</span>
        <span class="val neg">-${fmt(cuotaPatrimoniales, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Cantidad que tu empresa ya ha retenido de tu nomina durante el año. Es dinero que ya has pagado a Hacienda.">
        <span class="name">Retenciones trabajo</span>
        <span class="val pos">+${fmt(retencionesTrabajo, 2)}</span>
      </div>
      <div class="brow" tooltip-data="Cantidad que tu banco o broker ya ha retenido de tus intereses y dividendos. Si el origen es extranjero, esta retencion puede ser 0% o diferente (ej: 15% en USA).">
        <span class="name">Retenciones ahorro (19%)</span>
        <span class="val pos">+${fmt(retencionesAhorro, 2)}</span>
      </div>
      <div class="brow total" tooltip-data="Diferencia entre lo que debes pagar (cuotas) y lo que ya has pagado (retenciones). Si es positivo, Hacienda te devuelve. Si es negativo, te sale a pagar.">
        <span class="name">RESULTADO</span>
        <span class="val">${resultadoFinal > 0.01 ? 'A devolver ' + fmt(resultadoFinal, 2) : (resultadoFinal < -0.01 ? 'A pagar ' + fmt(Math.abs(resultadoFinal), 2) : '0,00 €')}</span>
      </div>
      ${excesoPerdidas > perdidasUsadasContraCapital ? `
      <div class="brow" tooltip-data="Perdidas no compensadas - El exceso de perdidas que no se ha podido compensar este año se pierde (no se arrastra a años siguientes).">
        <span class="name">Perdidas no compensadas (se pierden)</span>
        <span class="val neutral">${fmt(excesoPerdidas - perdidasUsadasContraCapital, 2)}</span>
      </div>` : ''}
    `;
  }

  // Después de actualizar el desglose, reinicializar tooltips
  if (typeof initTooltips === 'function') {
    setTimeout(initTooltips, 50);
  }
};

function initRentaListeners() {
  const inputs = ['intereses', 'interesesExtranjero', 'dividendos', 'dividendosExtranjero', 
                  'ganancias', 'perdidas', 'planPensionesIndividual', 'planPensionesEmpresa'];

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