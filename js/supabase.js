/**
 * ===================================================
 * Sistema de Tabla de Posiciones de Fútbol
 * Archivo: js/supabase.js
 * Descripción: Configuración del cliente Supabase y Capa de Datos Unificada
 * Incluye soporte para: Equipos, Partidos, Jugadores, Goles y Autenticación
 * ===================================================
 */

// 1. Configuración de credenciales de Supabase
const SUPABASE_URL = 'https://krqnvhrbwkxkehnojtnu.supabase.co'; // Ej: https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycW52aHJid2t4a2Vobm9qdG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDIxODIsImV4cCI6MjEwNDExODE4Mn0.wQ1DJedQ3dQWT19w5N93oaGxa_wL-dmxm84Ye27Z7ds'; // Clave pública anónima (anon public)

// 2. Inicialización del cliente de Supabase
let supabaseClient = null;
const isSupabaseConfigured = () => {
  return typeof supabase !== 'undefined' &&
    SUPABASE_URL !== 'TU_SUPABASE_URL_AQUI' &&
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_ANON_KEY !== 'TU_SUPABASE_ANON_KEY_AQUI';
};

if (isSupabaseConfigured()) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Conectado a Supabase Cloud exitosamente.');
  } catch (err) {
    console.error('❌ Error al inicializar Supabase:', err);
  }
} else {
  console.info('ℹ️ Modo Local activo: el sistema está utilizando LocalStorage. Cuando agregues tus credenciales en js/supabase.js, se sincronizará automáticamente con Supabase.');
}

window.db = supabaseClient;

// 3. API Unificada para Vistas Públicas y Panel Administrador
const api = {
  isCloud: isSupabaseConfigured,

  // --- AUTENTICACIÓN ---
  auth: {
    async login(email, password) {
      const normalizedEmail = (email || '').trim();
      const normalizedPassword = (password || '').toString();

      if (!normalizedEmail || !normalizedPassword) {
        throw new Error('Debes ingresar un correo y una contraseña.');
      }

      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword
        });
        if (error) throw error;
        return data.user;
      }

      const fakeUser = {
        email: normalizedEmail,
        role: 'admin',
        id: `local-admin-${Date.now()}`
      };

      localStorage.setItem('torneo_admin_session', JSON.stringify(fakeUser));
      return fakeUser;
    },

    async logout() {
      if (isSupabaseConfigured()) {
        await supabaseClient.auth.signOut();
      }
      localStorage.removeItem('torneo_admin_session');
    },

    async getUser() {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session ? session.user : null;
      }

      const local = localStorage.getItem('torneo_admin_session');
      return local ? JSON.parse(local) : null;
    }
  },

  // --- EQUIPOS ---
  equipos: {
    async getAll() {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('equipos').select('*').order('id', { ascending: true });
        if (error) throw error;
        return data;
      }
      return window.storageManager.getEquipos();
    },

    async getById(id) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('equipos').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.getEquipoById(id);
    },

    async create(nombre, logo_url) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('equipos').insert([{ nombre, logo_url }]).select().single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.addEquipo(nombre, logo_url);
    },

    async update(id, { nombre, logo_url }) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('equipos').update({ nombre, logo_url }).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.updateEquipo(id, { nombre, logo_url });
    },

    async delete(id) {
      if (isSupabaseConfigured()) {
        const { error } = await supabaseClient.from('equipos').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      window.storageManager.deleteEquipo(id);
      return true;
    }
  },

  // --- JUGADORES ---
  jugadores: {
    async getAll(equipo_id = null) {
      if (isSupabaseConfigured()) {
        let query = supabaseClient.from('jugadores').select('*, equipos(nombre, logo_url)').order('numero', { ascending: true });
        if (equipo_id !== null && equipo_id !== undefined && equipo_id !== '' && equipo_id !== 'todos') {
          query = query.eq('equipo_id', equipo_id);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }
      return window.storageManager.getJugadores(equipo_id);
    },

    async getById(id) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('jugadores').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.getJugadorById(id);
    },

    async create(jugador) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('jugadores').insert([jugador]).select().single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.addJugador(jugador);
    },

    async update(id, datos) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('jugadores').update(datos).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.updateJugador(id, datos);
    },

    async delete(id) {
      if (isSupabaseConfigured()) {
        const { error } = await supabaseClient.from('jugadores').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      window.storageManager.deleteJugador(id);
      return true;
    }
  },

  // --- PARTIDOS ---
  partidos: {
    async getAll() {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('partidos').select('*').order('jornada', { ascending: true });
        if (error) throw error;
        return data;
      }
      return window.storageManager.getPartidos();
    },

    async create(partido) {
      if (isSupabaseConfigured()) {
        const {
          jornada,
          fecha,
          local_id,
          equipo_local_id,
          visitante_id,
          equipo_visitante_id,
          goles_local,
          goles_visitante,
          estado
        } = partido;
        const registro = {
          jornada,
          fecha,
          equipo_local_id: equipo_local_id ?? local_id,
          equipo_visitante_id: equipo_visitante_id ?? visitante_id,
          goles_local,
          goles_visitante,
          estado
        };
        const { data, error } = await supabaseClient.from('partidos').insert([registro]).select().single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.addPartido(partido);
    },

    async update(id, datos) {
      if (isSupabaseConfigured()) {
        const registro = { ...datos };
        if (registro.local_id !== undefined) {
          registro.equipo_local_id = registro.local_id;
          delete registro.local_id;
        }
        if (registro.visitante_id !== undefined) {
          registro.equipo_visitante_id = registro.visitante_id;
          delete registro.visitante_id;
        }
        const { data, error } = await supabaseClient.from('partidos').update(registro).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      return window.storageManager.updatePartido(id, datos);
    },

    async delete(id) {
      if (isSupabaseConfigured()) {
        const { error } = await supabaseClient.from('partidos').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      window.storageManager.deletePartido(id);
      return true;
    }
  },

  // --- GOLES ---
  goles: {
    async getByPartido(partido_id) {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('goles').select('*').eq('partido_id', partido_id);
        if (error) throw error;
        return data;
      }
      return window.storageManager.getGoles(partido_id);
    },

    async setPartidoGoles(partido_id, listaGoles) {
      if (isSupabaseConfigured()) {
        // Eliminar goles previos de este partido
        await supabaseClient.from('goles').delete().eq('partido_id', partido_id);

        if (listaGoles.length > 0) {
          const insertData = listaGoles.map(g => ({
            partido_id: Number(partido_id),
            jugador_id: Number(g.jugador_id),
            equipo_id: Number(g.equipo_id),
            minuto: g.minuto ? Number(g.minuto) : null
          }));
          const { data, error } = await supabaseClient.from('goles').insert(insertData).select();
          if (error) throw error;
          return data;
        }
        return [];
      }
      return window.storageManager.setGolesPartido(partido_id, listaGoles);
    },

    async getTablaGoleadores() {
      if (isSupabaseConfigured()) {
        // Obtenemos jugadores, goles, equipos y partidos para calcular el ranking
        const { data: jugadores } = await supabaseClient.from('jugadores').select('*');
        const { data: goles } = await supabaseClient.from('goles').select('*');
        const { data: equipos } = await supabaseClient.from('equipos').select('*');
        const { data: partidos } = await supabaseClient.from('partidos').select('*');

        const mapaGoles = {};
        (goles || []).forEach(g => {
          mapaGoles[g.jugador_id] = (mapaGoles[g.jugador_id] || 0) + 1;
        });

        const lista = (jugadores || []).map(j => {
          const eq = (equipos || []).find(e => String(e.id) === String(j.equipo_id)) || { nombre: 'Sin Club', logo_url: '🛡️' };
          const totalGoles = mapaGoles[j.id] || 0;
          const partidosEquipo = (partidos || []).filter(p => 
            p.estado === 'finalizado' && (String(p.local_id || p.equipo_local_id) === String(j.equipo_id) || String(p.visitante_id || p.equipo_visitante_id) === String(j.equipo_id))
          ).length;

          const promedio = partidosEquipo > 0 ? (totalGoles / partidosEquipo).toFixed(2) : '0.00';

          return {
            id: j.id,
            nombre: j.nombre,
            numero: j.numero,
            posicion: j.posicion,
            foto_url: j.foto_url,
            equipo_id: j.equipo_id,
            equipo_nombre: eq.nombre,
            equipo_logo: eq.logo_url,
            goles: totalGoles,
            partidos_jugados: partidosEquipo,
            promedio: promedio
          };
        });

        lista.sort((a, b) => {
          if (b.goles !== a.goles) return b.goles - a.goles;
          return a.nombre.localeCompare(b.nombre);
        });

        return lista;
      }
      return window.storageManager.calcularTablaGoleadores();
    },

    async getPichichi() {
      const tabla = await api.goles.getTablaGoleadores();
      if (!tabla || tabla.length === 0 || tabla[0].goles === 0) return null;
      return tabla[0];
    }
  },

  // Alias conveniente para goleadores
  goleadores: {
    async getTabla() {
      return api.goles.getTablaGoleadores();
    },
    async getPichichi() {
      return api.goles.getPichichi();
    }
  },

  // --- CÁLCULO DE POSICIONES ---
  posiciones: {
    async calcular() {
      const equipos = await api.equipos.getAll();
      const partidos = await api.partidos.getAll();

      const tabla = {};
      equipos.forEach(eq => {
        tabla[eq.id] = {
          id: eq.id,
          nombre: eq.nombre,
          logo_url: eq.logo_url,
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
          dg: 0,
          pts: 0
        };
      });

      partidos.forEach(p => {
        if (p.estado !== 'finalizado') return;

        const locId = p.local_id || p.equipo_local_id;
        const visId = p.visitante_id || p.equipo_visitante_id;
        const loc = tabla[locId];
        const vis = tabla[visId];
        if (!loc || !vis) return;

        const gl = Number(p.goles_local);
        const gv = Number(p.goles_visitante);

        loc.pj += 1;
        vis.pj += 1;
        loc.gf += gl;
        loc.gc += gv;
        vis.gf += gv;
        vis.gc += gl;

        if (gl > gv) {
          loc.pg += 1;
          loc.pts += 3;
          vis.pp += 1;
        } else if (gl < gv) {
          vis.pg += 1;
          vis.pts += 3;
          loc.pp += 1;
        } else {
          loc.pe += 1;
          loc.pts += 1;
          vis.pe += 1;
          vis.pts += 1;
        }
      });

      // Calcular historial de formas (últimos 5 partidos terminados)
      const partidosFinalizados = partidos
        .filter(p => p.estado === 'finalizado')
        .sort((a, b) => {
          if (a.jornada !== b.jornada) return a.jornada - b.jornada;
          return new Date(a.fecha) - new Date(b.fecha);
        });

      equipos.forEach(eq => {
        const eqId = String(eq.id);
        const historial = [];
        partidosFinalizados.forEach(p => {
          const locId = String(p.local_id || p.equipo_local_id);
          const visId = String(p.visitante_id || p.equipo_visitante_id);
          const esLocal = locId === eqId;
          const esVis = visId === eqId;
          if (!esLocal && !esVis) return;

          const gl = Number(p.goles_local);
          const gv = Number(p.goles_visitante);

          if (gl === gv) {
            historial.push({ resultado: 'E', detalle: `Empate ${gl}-${gv}` });
          } else if ((esLocal && gl > gv) || (esVis && gv > gl)) {
            historial.push({ resultado: 'V', detalle: `Victoria ${esLocal ? gl : gv}-${esLocal ? gv : gl}` });
          } else {
            historial.push({ resultado: 'D', detalle: `Derrota ${esLocal ? gl : gv}-${esLocal ? gv : gl}` });
          }
        });

        tabla[eq.id].racha = historial.slice(-5);
      });

      const resultado = Object.values(tabla).map(item => {
        item.dg = item.gf - item.gc;
        return item;
      });

      resultado.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.nombre.localeCompare(b.nombre);
      });

      return resultado;
    }
  }
};

window.api = api;
