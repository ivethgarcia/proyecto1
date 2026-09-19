/**
 * ===================================================
 * Sistema de Tabla de Posiciones de Fútbol
 * Archivo: js/jugadores.js
 * Descripción: Gestión completa de Jugadores (CRUD, Modal de Edición, Filtro por Club)
 * Compatible con Supabase y LocalStorage
 * ===================================================
 */

let modalEdicionJugador = null;
let equiposCache = [];
let jugadoresCache = [];

function renderJugadorFotoHtml(fotoUrl) {
  if (!fotoUrl) {
    return '<span style="font-size: 1.25rem;">⚽</span>';
  }

  const valor = String(fotoUrl).trim();
  if (valor.startsWith('http://') || valor.startsWith('https://') || valor.startsWith('data:')) {
    return `<img src="${valor}" alt="foto jugador" style="width: 28px; height: 28px; object-fit: cover; border-radius: 50%;">`;
  }

  return `<span style="font-size: 1.25rem;">${valor}</span>`;
}

async function subirFotoJugador(file) {
  if (!file) return '';

  if (typeof supabase === 'undefined' || !supabaseClient || !supabaseClient.storage) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen local.'));
      reader.readAsDataURL(file);
    });
  }

  const extension = (file.name.split('.').pop() || 'png').toLowerCase();
  const fileName = `jugadores/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabaseClient.storage.from('jugadores').upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/png'
  });

  if (error) {
    throw new Error(`No se pudo subir la imagen a Supabase Storage: ${error.message}`);
  }

  const { data } = supabaseClient.storage.from('jugadores').getPublicUrl(fileName);
  return data?.publicUrl || '';
}

document.addEventListener('DOMContentLoaded', async () => {
  const modalEl = document.getElementById('modalEditarJugador');
  if (modalEl && typeof bootstrap !== 'undefined') {
    modalEdicionJugador = new bootstrap.Modal(modalEl);
  }

  await cargarSelectsEquipos();
  verificarFiltroURL();
  await renderizarJugadores();
  configurarFormularioCrearJugador();
  configurarFormularioEditarJugador();
  configurarFiltroEquipo();
});

/**
 * Carga los selectores de equipos en el formulario y en el filtro
 */
async function cargarSelectsEquipos() {
  const selectCrear = document.getElementById('equipo-jugador');
  const selectFiltro = document.getElementById('filtro-equipo-jugador');
  const selectEditar = document.getElementById('edit-equipo-jugador');

  try {
    equiposCache = await window.api.equipos.getAll();

    const opciones = equiposCache.map(eq => `<option value="${eq.id}">${eq.nombre}</option>`).join('');

    if (selectCrear) {
      selectCrear.innerHTML = `<option value="" selected disabled>Selecciona un club...</option>` + opciones;
    }
    if (selectEditar) {
      selectEditar.innerHTML = opciones;
    }
    if (selectFiltro) {
      selectFiltro.innerHTML = `<option value="todos">Todos los Equipos</option>` + opciones;
    }
  } catch (err) {
    console.error('Error al cargar equipos para jugadores:', err);
  }
}

/**
 * Revisa si viene un parámetro en la URL (?equipo=ID) para preseleccionar el filtro
 */
function verificarFiltroURL() {
  const params = new URLSearchParams(window.location.search);
  const equipoId = params.get('equipo');
  if (equipoId) {
    const selectFiltro = document.getElementById('filtro-equipo-jugador');
    const selectCrear = document.getElementById('equipo-jugador');
    if (selectFiltro) selectFiltro.value = equipoId;
    if (selectCrear) selectCrear.value = equipoId;
  }
}

/**
 * Configura el evento de cambio en el selector de filtro
 */
function configurarFiltroEquipo() {
  const selectFiltro = document.getElementById('filtro-equipo-jugador');
  if (!selectFiltro) return;

  selectFiltro.addEventListener('change', async () => {
    await renderizarJugadores();
  });
}

/**
 * Renderiza la lista de jugadores en la tabla
 */
async function renderizarJugadores() {
  const tbody = document.getElementById('lista-jugadores-body');
  const contador = document.getElementById('contador-jugadores');
  const selectFiltro = document.getElementById('filtro-equipo-jugador');
  if (!tbody) return;

  const equipoFiltro = selectFiltro ? selectFiltro.value : 'todos';

  try {
    if (equiposCache.length === 0) {
      equiposCache = await window.api.equipos.getAll();
    }

    jugadoresCache = await window.api.jugadores.getAll(equipoFiltro);

    if (contador) {
      contador.textContent = `${jugadoresCache.length} Futbolistas`;
    }

    if (jugadoresCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-info-circle me-1"></i> No se encontraron jugadores para el equipo seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    const getEquipo = (eqId) => equiposCache.find(e => String(e.id) === String(eqId)) || { nombre: 'Club', logo_url: '🛡️' };

    const getBadgePosicion = (pos) => {
      switch (pos) {
        case 'Delantero':
          return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Delantero</span>`;
        case 'Mediocampista':
          return `<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">Mediocampista</span>`;
        case 'Defensa':
          return `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Defensa</span>`;
        case 'Portero':
          return `<span class="badge bg-dark-subtle text-dark border border-dark-subtle px-2 py-1">Portero</span>`;
        default:
          return `<span class="badge bg-light text-dark border px-2 py-1">${pos || 'Jugador'}</span>`;
      }
    };

    tbody.innerHTML = jugadoresCache.map(j => {
      const eq = getEquipo(j.equipo_id);
      const fotoHtml = renderJugadorFotoHtml(j.foto_url);

      return `
        <tr>
          <td class="text-center">
            <span class="badge bg-light text-dark border fw-bold px-2 py-1">#${j.numero}</span>
          </td>
          <td class="text-center">${fotoHtml}</td>
          <td class="fw-bold text-dark">${j.nombre}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <span>${eq.logo_url && eq.logo_url.startsWith('http') ? `<img src="${eq.logo_url}" style="width: 20px; height: 20px;">` : (eq.logo_url || '🛡️')}</span>
              <span class="small fw-semibold">${eq.nombre}</span>
            </div>
          </td>
          <td class="text-center">${getBadgePosicion(j.posicion)}</td>
          <td class="text-center">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-primary" onclick="abrirModalEditarJugador(${j.id})" title="Editar datos">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-danger" onclick="eliminarJugador(${j.id}, '${escapeHtml(j.nombre)}')" title="Eliminar jugador">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error al renderizar jugadores:', err);
  }
}

/**
 * Formulario para registrar un nuevo jugador
 */
function configurarFormularioCrearJugador() {
  const form = document.getElementById('form-jugador');
  const btn = document.getElementById('btn-crear-jugador');
  const fileInput = document.getElementById('foto-archivo');
  const fotoInput = document.getElementById('foto-jugador');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const equipo_id = document.getElementById('equipo-jugador').value;
    const nombre = document.getElementById('nombre-jugador').value.trim();
    const numero = document.getElementById('numero-jugador').value;
    const posicion = document.getElementById('posicion-jugador').value;
    const fotoTexto = (fotoInput ? fotoInput.value.trim() : '').trim();
    const archivo = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!equipo_id || !nombre || !numero) {
      alert('Por favor completa los campos requeridos (Equipo, Nombre y Dorsal).');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';
    }

    try {
      let foto_url = fotoTexto;
      if (archivo) {
        foto_url = await subirFotoJugador(archivo);
      }

      await window.api.jugadores.create({
        equipo_id: Number(equipo_id),
        nombre,
        numero: Number(numero),
        posicion,
        foto_url: foto_url || fotoTexto || '⚽'
      });

      form.reset();
      if (fileInput) fileInput.value = '';
      if (fotoInput) fotoInput.value = '';

      const selectFiltro = document.getElementById('filtro-equipo-jugador');
      if (selectFiltro && selectFiltro.value !== 'todos') {
        document.getElementById('equipo-jugador').value = selectFiltro.value;
      }

      await renderizarJugadores();
      document.getElementById('nombre-jugador').focus();
    } catch (error) {
      alert(error.message || 'Error al registrar el jugador.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Jugador';
      }
    }
  });
}

/**
 * Abre el modal para editar datos del jugador
 */
window.abrirModalEditarJugador = function(id) {
  const jugador = jugadoresCache.find(j => String(j.id) === String(id));
  if (!jugador) return;

  document.getElementById('edit-jugador-id').value = jugador.id;
  document.getElementById('edit-equipo-jugador').value = jugador.equipo_id;
  document.getElementById('edit-nombre-jugador').value = jugador.nombre;
  document.getElementById('edit-numero-jugador').value = jugador.numero;
  document.getElementById('edit-posicion-jugador').value = jugador.posicion;
  document.getElementById('edit-foto-jugador').value = jugador.foto_url || '';

  const editFileInput = document.getElementById('edit-foto-archivo');
  if (editFileInput) {
    editFileInput.value = '';
  }

  if (modalEdicionJugador) {
    modalEdicionJugador.show();
  }
};

/**
 * Formulario para guardar la edición del jugador
 */
function configurarFormularioEditarJugador() {
  const formEdit = document.getElementById('form-editar-jugador');
  const btnEdit = document.getElementById('btn-guardar-edicion-jugador');
  const fileInput = document.getElementById('edit-foto-archivo');
  const fotoInput = document.getElementById('edit-foto-jugador');
  if (!formEdit) return;

  formEdit.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-jugador-id').value;
    const equipo_id = document.getElementById('edit-equipo-jugador').value;
    const nombre = document.getElementById('edit-nombre-jugador').value.trim();
    const numero = document.getElementById('edit-numero-jugador').value;
    const posicion = document.getElementById('edit-posicion-jugador').value;
    const fotoTexto = (fotoInput ? fotoInput.value.trim() : '').trim();
    const archivo = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!equipo_id || !nombre || !numero) {
      alert('Por favor completa los campos requeridos.');
      return;
    }

    if (btnEdit) {
      btnEdit.disabled = true;
      btnEdit.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Actualizando...';
    }

    try {
      let foto_url = fotoTexto;
      if (archivo) {
        foto_url = await subirFotoJugador(archivo);
      }

      await window.api.jugadores.update(id, {
        equipo_id: Number(equipo_id),
        nombre,
        numero: Number(numero),
        posicion,
        foto_url: foto_url || fotoTexto || '⚽'
      });

      if (modalEdicionJugador) {
        modalEdicionJugador.hide();
      }
      await renderizarJugadores();
    } catch (error) {
      alert(error.message || 'Error al actualizar jugador.');
    } finally {
      if (btnEdit) {
        btnEdit.disabled = false;
        btnEdit.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Guardar Cambios';
      }
    }
  });
}

/**
 * Elimina un jugador con confirmación
 */
window.eliminarJugador = async function(id, nombre) {
  if (confirm(`¿Estás seguro de dar de baja al jugador "${nombre}"?`)) {
    try {
      await window.api.jugadores.delete(id);
      await renderizarJugadores();
    } catch (err) {
      alert('Error al eliminar jugador: ' + err.message);
    }
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
