/**
 * ===================================================
 * Sistema de Tabla de Posiciones de Fútbol
 * Archivo: js/posiciones.js
 * Descripción: Cálculo y renderizado dinámico de la tabla de posiciones y métricas
 * ===================================================
 */

let isLoading = true;

document.addEventListener('DOMContentLoaded', async () => {
  await renderizarTablaPosiciones();
});

/**
 * Renderiza la tabla de posiciones con los datos calculados de la API
 */
async function renderizarTablaPosiciones() {
  const tbody = document.getElementById('tabla-posiciones-body');
  if (!tbody) return;

  isLoading = true;
  tbody.innerHTML = `
    <tr>
      <td colspan="11" class="text-center py-4 text-muted">
        <i class="bi bi-arrow-repeat me-2"></i> Cargando posiciones...
      </td>
    </tr>
  `;

  try {
    let posiciones = [];

    if (window.api && typeof window.api.posiciones?.calcular === 'function') {
      posiciones = await window.api.posiciones.calcular();
    } else if (typeof window !== 'undefined' && window.db && typeof window.db.from === 'function') {
      const { data, error } = await window.db.from('equipos').select('id, nombre, logo_url');
      if (error) throw error;
      posiciones = Array.isArray(data) ? data.map((eq, index) => ({
        id: eq.id,
        nombre: eq.nombre,
        logo_url: eq.logo_url || '🛡️',
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
        racha: [],
        orden: index + 1
      })) : [];
    }

    if (!Array.isArray(posiciones) || posiciones.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-4 text-muted">
            <i class="bi bi-info-circle me-1"></i> No hay equipos registrados aún.
          </td>
        </tr>
      `;
      return;
    }

    const totalEquipos = posiciones.length;
    isLoading = false;

    await actualizarMetricas(posiciones);

    tbody.innerHTML = posiciones.map((eq, index) => {
      const pos = index + 1;
      const nombre = eq.nombre || eq.equipo || 'Equipo';
      const logo_url = eq.logo_url || eq.escudo || '🛡️';
      const pj = Number(eq.pj ?? eq.partidos_jugados ?? 0);
      const pg = Number(eq.pg ?? eq.partidos_ganados ?? 0);
      const pe = Number(eq.pe ?? eq.partidos_empatados ?? 0);
      const pp = Number(eq.pp ?? eq.partidos_perdidos ?? 0);
      const gf = Number(eq.gf ?? eq.goles_favor ?? 0);
      const gc = Number(eq.gc ?? eq.goles_contra ?? 0);
      const dg = Number(eq.dg ?? eq.diferencia_goles ?? 0);
      const pts = Number(eq.pts ?? eq.puntos ?? 0);

      let rowClass = 'row-neutral';
      let badgeClass = 'pos-regular';
      let badgeTitle = 'Permanencia';

      if (pos === 1) {
        rowClass = 'row-champions';
        badgeClass = 'pos-gold';
        badgeTitle = 'Líder del Torneo';
      } else if (pos <= 4 && totalEquipos >= 4) {
        rowClass = 'row-champions';
        badgeClass = 'pos-champions';
        badgeTitle = 'Zona de Clasificación Internacional';
      } else if (totalEquipos > 4 && pos > totalEquipos - 2) {
        rowClass = 'row-relegation';
        badgeClass = 'pos-relegation';
        badgeTitle = 'Zona de Descenso';
      }

      let dgClass = 'dg-neutral';
      let dgTexto = `${dg}`;
      if (dg > 0) {
        dgClass = 'dg-positive';
        dgTexto = `+${dg}`;
      } else if (dg < 0) {
        dgClass = 'dg-negative';
      }

      const logoHtml = logo_url && String(logo_url).startsWith('http')
        ? `<img src="${logo_url}" alt="${nombre}" style="width: 22px; height: 22px; object-fit: contain;">`
        : `<span>${logo_url || '🛡️'}</span>`;

      const racha = Array.isArray(eq.racha) ? eq.racha : [];
      const rachaBadges = racha.length > 0
        ? racha.map(r => {
            const cls = r.resultado === 'V' ? 'forma-v' : (r.resultado === 'E' ? 'forma-e' : 'forma-d');
            return `<span class="forma-badge ${cls}" title="${r.detalle || r.resultado}">${r.resultado}</span>`;
          }).join('')
        : '<span class="text-muted small">-</span>';

      return `
        <tr class="${rowClass}">
          <td>
            <span class="pos-badge ${badgeClass}" title="${badgeTitle}">${pos}</span>
          </td>
          <td class="col-team">
            <div class="team-item">
              <div class="team-shield">${logoHtml}</div>
              <span class="team-name">${nombre}</span>
            </div>
          </td>
          <td>${pj}</td>
          <td>${pg}</td>
          <td>${pe}</td>
          <td>${pp}</td>
          <td>${gf}</td>
          <td>${gc}</td>
          <td class="${dgClass}">${dgTexto}</td>
          <td class="col-points">${pts}</td>
          <td class="text-center">
            <div class="forma-container">${rachaBadges}</div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    isLoading = false;
    console.error('Error al renderizar tabla de posiciones:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle me-1"></i> No se pudieron cargar las posiciones.
        </td>
      </tr>
    `;
  }
}

/**
 * Actualiza las estadísticas rápidas del encabezado
 */
async function actualizarMetricas(posiciones) {
  try {
    const partidos = await window.api.partidos.getAll();
    const partidosJugados = partidos.filter(p => p.estado === 'finalizado');

    const totalGoles = partidosJugados.reduce((acc, p) => acc + Number(p.goles_local || 0) + Number(p.goles_visitante || 0), 0);
    const lider = posiciones.length > 0 ? posiciones[0].nombre : 'Sin definir';

    const metricCards = document.querySelectorAll('.stat-pill-card');
    if (metricCards.length >= 4) {
      const valEquipos = metricCards[0].querySelector('.fs-5');
      if (valEquipos) valEquipos.textContent = `${posiciones.length} Clubes`;

      const valLider = metricCards[1].querySelector('.fs-6');
      if (valLider) valLider.textContent = lider;

      const valPartidos = metricCards[2].querySelector('.fs-5');
      if (valPartidos) valPartidos.textContent = `${partidosJugados.length} Jugados`;

      const valGoles = metricCards[3].querySelector('.fs-5');
      if (valGoles) valGoles.textContent = `${totalGoles} Goles`;
    }
  } catch (err) {
    console.error('Error al actualizar métricas:', err);
  }
}
