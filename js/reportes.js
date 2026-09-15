/**
 * ===================================================
 * Sistema de Tabla de Posiciones de Fútbol
 * Archivo: js/reportes.js
 * Descripción: Módulo unificado para exportación de reportes en PDF e impresión
 * ===================================================
 */

/**
 * Exporta la tabla de posiciones en un archivo PDF profesional
 */
async function exportarTablaPDF() {
  let elemento = document.querySelector('.standings-card');
  let clon = null;

  // Si no estamos en index.html y no hay .standings-card (ej. en el Admin),
  // obtenemos las posiciones desde la API y construimos la tabla al vuelo para exportar
  if (!elemento) {
    if (!window.api || !window.api.posiciones) {
      alert('No se pudo cargar la información de la tabla de posiciones.');
      return;
    }
    const posiciones = await window.api.posiciones.calcular();
    const tempCard = document.createElement('div');
    tempCard.className = 'standings-card bg-white p-3 rounded';
    tempCard.innerHTML = `
      <div class="standings-card-header mb-3">
        <h3 style="font-size: 18px; font-weight: bold; margin: 0; color: #1e3a8a;">Tabla General de Clasificación</h3>
      </div>
      <table class="table align-middle" style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead style="background-color: #0f172a; color: #ffffff;">
          <tr style="text-align: center;">
            <th style="padding: 8px; width: 40px;">#</th>
            <th style="padding: 8px; text-align: left;">Equipo</th>
            <th style="padding: 8px;">PJ</th>
            <th style="padding: 8px;">PG</th>
            <th style="padding: 8px;">PE</th>
            <th style="padding: 8px;">PP</th>
            <th style="padding: 8px;">GF</th>
            <th style="padding: 8px;">GC</th>
            <th style="padding: 8px;">DG</th>
            <th style="padding: 8px; font-weight: bold;">PTS</th>
            <th style="padding: 8px; width: 120px;">Forma</th>
          </tr>
        </thead>
        <tbody>
          ${posiciones.map((eq, idx) => {
            const pos = idx + 1;
            const rowBg = pos <= 4 ? '#f0fdf4' : (pos >= 7 ? '#fef2f2' : '#ffffff');
            const dgStr = eq.dg > 0 ? `+${eq.dg}` : String(eq.dg);
            const rachaHtml = (eq.racha && eq.racha.length > 0)
              ? eq.racha.map(r => {
                  const bg = r.resultado === 'V' ? '#10b981' : (r.resultado === 'E' ? '#64748b' : '#ef4444');
                  return `<span style="display:inline-block; width:18px; height:18px; border-radius:50%; background:${bg}; color:#fff; font-size:10px; font-weight:bold; line-height:18px; text-align:center; margin:0 1px;">${r.resultado}</span>`;
                }).join('')
              : '-';

            return `
              <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0; text-align: center;">
                <td style="padding: 8px; font-weight: bold;">${pos}</td>
                <td style="padding: 8px; text-align: left; font-weight: 600;">${eq.logo_url || '🛡️'} ${eq.nombre}</td>
                <td style="padding: 8px;">${eq.pj}</td>
                <td style="padding: 8px;">${eq.pg}</td>
                <td style="padding: 8px;">${eq.pe}</td>
                <td style="padding: 8px;">${eq.pp}</td>
                <td style="padding: 8px;">${eq.gf}</td>
                <td style="padding: 8px;">${eq.gc}</td>
                <td style="padding: 8px; font-weight: 600;">${dgStr}</td>
                <td style="padding: 8px; font-weight: bold; color: #1e3a8a;">${eq.pts}</td>
                <td style="padding: 8px;">${rachaHtml}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    clon = tempCard;
  } else {
    clon = elemento.cloneNode(true);
  }

  // Si html2pdf está disponible, generamos el PDF descargable
  if (typeof html2pdf !== 'undefined') {
    // Crear contenedor de reporte con encabezado oficial
    const contenedorReporte = document.createElement('div');
    contenedorReporte.style.padding = '20px';
    contenedorReporte.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    const fechaHoy = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const encabezado = document.createElement('div');
    encabezado.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px;">
        <h2 style="color: #1e3a8a; margin: 0 0 5px 0; font-size: 22px; font-weight: bold;">⚽ LIGA DE FÚTBOL GARCÍA</h2>
        <h4 style="color: #475569; margin: 0 0 5px 0; font-size: 15px;">REPORTE OFICIAL - TABLA GENERAL DE POSICIONES</h4>
        <div style="color: #64748b; font-size: 11px;">Temporada 2026 • Generado el ${fechaHoy}</div>
      </div>
    `;

    // Quitar botones del clon
    const botones = clon.querySelectorAll('.btn, button');
    botones.forEach(b => b.remove());

    contenedorReporte.appendChild(encabezado);
    contenedorReporte.appendChild(clon);

    // Opciones de configuración para html2pdf
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Tabla_de_Posiciones_Liga_Elite_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Mostrar feedback al usuario
    const btnPdf = document.getElementById('btn-exportar-pdf');
    const textoOriginal = btnPdf ? btnPdf.innerHTML : '';
    if (btnPdf) {
      btnPdf.disabled = true;
      btnPdf.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generando PDF...';
    }

    html2pdf().set(opt).from(contenedorReporte).save()
      .then(() => {
        if (btnPdf) {
          btnPdf.disabled = false;
          btnPdf.innerHTML = textoOriginal;
        }
      })
      .catch((err) => {
        console.error('Error al exportar con html2pdf:', err);
        if (btnPdf) {
          btnPdf.disabled = false;
          btnPdf.innerHTML = textoOriginal;
        }
        // Fallback a impresión de navegador
        window.print();
      });
  } else {
    // Si no está la librería, usar diálogo nativo de impresión
    window.print();
  }
}

/**
 * Invoca el cuadro de impresión nativo del navegador
 */
function imprimirReporte() {
  window.print();
}

window.exportarTablaPDF = exportarTablaPDF;
window.imprimirReporte = imprimirReporte;
