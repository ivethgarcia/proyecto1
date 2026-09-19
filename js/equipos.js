/**
 * ===================================================
 * Sistema de Tabla de Posiciones de Fútbol
 * Archivo: js/equipos.js
 * Descripción: Gestión completa de Equipos (Crear, Editar, Eliminar)
 * Compatible con Supabase y LocalStorage
 * ===================================================
 */

let modalEdicion = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar instancia de modal de Bootstrap si existe
  const modalEl = document.getElementById('modalEditarEquipo');
  if (modalEl && typeof bootstrap !== 'undefined') {
    modalEdicion = new bootstrap.Modal(modalEl);
  }

  await renderizarEquipos();
  configurarFormularioCrear();
  configurarFormularioEditar();
});

/**
 * Renderiza la lista de equipos en la tabla HTML del panel admin
 */
async function renderizarEquipos() {
  const tbody = document.getElementById('lista-equipos-body');
  const contador = document.getElementById('contador-equipos');
  if (!tbody) return;

  try {
    const equipos = await window.api.equipos.getAll();

    if (contador) {
      contador.textContent = `${equipos.length} Clubes`;
    }

    if (equipos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            <i class="bi bi-info-circle me-1"></i> No hay equipos registrados aún. Agrega uno usando el formulario de la izquierda.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = equipos.map((eq, index) => {
      const logoHtml = eq.logo_url && eq.logo_url.startsWith('http')
        ? `<img src="${eq.logo_url}" alt="${eq.nombre}" style="width: 28px; height: 28px; object-fit: contain;">`
        : `<span style="font-size: 1.25rem;">${eq.logo_url || '🛡️'}</span>`;

      return `
        <tr>
          <td class="fw-bold text-muted">${index + 1}</td>
          <td>
            <div class="team-shield">
              ${logoHtml}
            </div>
          </td>
          <td class="fw-semibold text-dark">${eq.nombre}</td>
          <td class="text-center">
            <div class="btn-group btn-group-sm" role="group">
              <a href="admin-jugadores.html?equipo=${eq.id}" class="btn btn-outline-info" title="Ver y gestionar plantilla de jugadores">
                <i class="bi bi-people-fill"></i> Plantilla
              </a>
              <button class="btn btn-outline-primary" onclick="abrirModalEditarEquipo(${eq.id}, '${escapeHtml(eq.nombre)}', '${escapeHtml(eq.logo_url || '')}')" title="Editar equipo">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-danger" onclick="eliminarEquipo(${eq.id}, '${escapeHtml(eq.nombre)}')" title="Eliminar equipo">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error al cargar equipos:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle me-1"></i> Error al cargar equipos: ${err.message}
        </td>
      </tr>
    `;
  }
}

/**
 * Configura el formulario para crear un nuevo equipo
 */
function configurarFormularioCrear() {
  const form = document.getElementById('form-equipo');
  const btn = document.getElementById('btn-crear-equipo');
  const logoInput = document.getElementById('logo-equipo');
  const fileInput = document.getElementById('logo-file');
  const preview = document.getElementById('logo-preview');

  if (!form) return;

  const actualizarPreview = (value) => {
    if (!preview) return;
    preview.textContent = value && value.trim() ? value.trim() : '🛡️';
  };

  const seleccionarEmoji = (emoji) => {
    if (logoInput) {
      logoInput.value = emoji;
    }
    actualizarPreview(emoji);
  };

  document.querySelectorAll('#emoji-picker .emoji-option').forEach(button => {
    button.addEventListener('click', () => seleccionarEmoji(button.dataset.emoji));
  });

  if (logoInput) {
    logoInput.addEventListener('input', (e) => actualizarPreview(e.target.value));
  }

  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        if (logoInput) {
          logoInput.value = result;
        }
        actualizarPreview(result);
      };
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreInput = document.getElementById('nombre-equipo');

    const nombre = nombreInput.value.trim();
    const logo = (logoInput && logoInput.value.trim()) || '';

    if (!nombre) {
      alert('Por favor ingresa el nombre del equipo.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';
    }

    try {
      await window.api.equipos.create(nombre, logo || '🛡️');
      form.reset();
      if (fileInput) fileInput.value = '';
      actualizarPreview('🛡️');
      await renderizarEquipos();
      nombreInput.focus();
    } catch (error) {
      alert(error.message || 'Error al crear el equipo.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Equipo';
      }
    }
  });
}

/**
 * Abre el modal para editar un equipo
 */
window.abrirModalEditarEquipo = function(id, nombre, logo) {
  document.getElementById('edit-equipo-id').value = id;
  document.getElementById('edit-nombre-equipo').value = nombre;
  document.getElementById('edit-logo-equipo').value = logo || '';
  const preview = document.getElementById('edit-logo-preview');
  if (preview) {
    preview.textContent = logo && logo.trim() ? logo.trim() : '🛡️';
  }
  const fileInput = document.getElementById('edit-logo-file');
  if (fileInput) {
    fileInput.value = '';
  }

  if (modalEdicion) {
    modalEdicion.show();
  }
};

/**
 * Configura el formulario para guardar la edición del equipo
 */
function configurarFormularioEditar() {
  const formEdit = document.getElementById('form-editar-equipo');
  const btnEdit = document.getElementById('btn-guardar-edicion-equipo');
  const logoInput = document.getElementById('edit-logo-equipo');
  const fileInput = document.getElementById('edit-logo-file');
  const preview = document.getElementById('edit-logo-preview');
  if (!formEdit) return;

  const actualizarPreview = (value) => {
    if (!preview) return;
    preview.textContent = value && value.trim() ? value.trim() : '🛡️';
  };

  document.querySelectorAll('#edit-emoji-picker .emoji-option').forEach(button => {
    button.addEventListener('click', () => {
      if (logoInput) {
        logoInput.value = button.dataset.emoji;
      }
      actualizarPreview(button.dataset.emoji);
    });
  });

  if (logoInput) {
    logoInput.addEventListener('input', (e) => actualizarPreview(e.target.value));
  }

  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        if (logoInput) {
          logoInput.value = result;
        }
        actualizarPreview(result);
      };
      reader.readAsDataURL(file);
    });
  }

  formEdit.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-equipo-id').value;
    const nombre = document.getElementById('edit-nombre-equipo').value.trim();
    const logo = (logoInput && logoInput.value.trim()) || '';

    if (!nombre) {
      alert('El nombre del equipo no puede estar vacío.');
      return;
    }

    if (btnEdit) {
      btnEdit.disabled = true;
      btnEdit.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Actualizando...';
    }

    try {
      await window.api.equipos.update(id, { nombre, logo_url: logo || '🛡️' });
      if (modalEdicion) {
        modalEdicion.hide();
      }
      await renderizarEquipos();
    } catch (error) {
      alert(error.message || 'Error al actualizar el equipo.');
    } finally {
      if (btnEdit) {
        btnEdit.disabled = false;
        btnEdit.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Guardar Cambios';
      }
    }
  });
}

/**
 * Elimina un equipo con confirmación
 */
window.eliminarEquipo = async function(id, nombre) {
  if (confirm(`¿Estás seguro de eliminar el equipo "${nombre}"?\nNota: También se eliminarán los partidos relacionados a este equipo.`)) {
    try {
      await window.api.equipos.delete(id);
      await renderizarEquipos();
    } catch (err) {
      alert('Error al eliminar equipo: ' + err.message);
    }
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
