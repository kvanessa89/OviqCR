import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCatalogo,
  crearCatalogo,
  actualizarCatalogo,
  desactivarCatalogo,
} from '../../api/catalogos';
import type { CatalogoDto } from '../../types';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';

// ── Colores por sección ───────────────────────────────────────────────

const DOT_COLORS: Record<string, string> = {
  'estados-cliente':  '#3B6EF5',
  'estados-proyecto': '#10B981',
  'estados-ticket':   '#F59E0B',
  'estados-factura':  '#8B5CF6',
  'prioridades-ticket': '#EF4444',
  'monedas':          '#06B6D4',
  'formas-pago':      '#EC4899',
  'roles':            '#7C3AED',
  'cargos':           '#F97316',
};

// ── Configuración de secciones ────────────────────────────────────────

interface CatalogoConfig {
  id: string;
  label: string;
  icon: string;
  iconColor: string;
  soloLectura?: boolean;
}

interface Seccion {
  titulo: string;
  icono: string;
  catalogos: CatalogoConfig[];
}

const SECCIONES: Seccion[] = [
  {
    titulo: 'Clientes',
    icono: 'fa-solid fa-building-user',
    catalogos: [
      { id: 'estados-cliente', label: 'Estados de cliente', icon: 'fa-solid fa-circle-half-stroke', iconColor: '#3B6EF5' },
    ],
  },
  {
    titulo: 'Proyectos',
    icono: 'fa-solid fa-diagram-project',
    catalogos: [
      { id: 'estados-proyecto', label: 'Estados de proyecto', icon: 'fa-solid fa-circle-half-stroke', iconColor: '#10B981' },
      { id: 'monedas',          label: 'Monedas',             icon: 'fa-solid fa-coins',             iconColor: '#06B6D4' },
    ],
  },
  {
    titulo: 'Tickets',
    icono: 'fa-solid fa-ticket',
    catalogos: [
      { id: 'estados-ticket',    label: 'Estados de ticket',    icon: 'fa-solid fa-circle-half-stroke', iconColor: '#F59E0B' },
      { id: 'prioridades-ticket', label: 'Prioridades',         icon: 'fa-solid fa-flag',              iconColor: '#EF4444' },
    ],
  },
  {
    titulo: 'Facturación',
    icono: 'fa-solid fa-file-invoice-dollar',
    catalogos: [
      { id: 'estados-factura', label: 'Estados de factura', icon: 'fa-solid fa-circle-half-stroke', iconColor: '#8B5CF6' },
    ],
  },
  {
    titulo: 'Usuarios',
    icono: 'fa-solid fa-users',
    catalogos: [
      { id: 'roles',      label: 'Roles',          icon: 'fa-solid fa-shield-halved',       iconColor: '#7C3AED' },
      { id: 'cargos',     label: 'Cargos',          icon: 'fa-solid fa-hard-hat',            iconColor: '#F97316' },
      { id: 'formas-pago', label: 'Formas de pago', icon: 'fa-solid fa-hand-holding-dollar', iconColor: '#EC4899' },
    ],
  },
];

// ── Tarjeta de catálogo ───────────────────────────────────────────────

function CatalogoCard({ config }: { config: CatalogoConfig }) {
  const [items, setItems]           = useState<CatalogoDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [nuevoNombre, setNuevo]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [itemEliminando, setItemEliminando] = useState<CatalogoDto | null>(null);
  const [loadingDel, setLoadingDel] = useState(false);
  const [errorDel, setErrorDel]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const dotColor = DOT_COLORS[config.id] || '#94A3B8';

  const cargar = () =>
    getCatalogo(config.id).then(data => {
      setItems(data);
      setLoading(false);
    });

  useEffect(() => { cargar(); }, []);

  const handleAgregar = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;

    const codigo = nombre
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    setSaving(true);
    try {
      await crearCatalogo(config.id, {
        codigo,
        nombre,
        orden: items.filter(i => i.activo).length + 1,
      });
      setNuevo('');
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || 'Error al crear el ítem');
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!itemEliminando) return;
    setLoadingDel(true);
    try {
      await desactivarCatalogo(config.id, itemEliminando.id);
      setItemEliminando(null);
      cargar();
    } catch {
      setErrorDel('No se pudo eliminar el ítem');
    } finally {
      setLoadingDel(false);
    }
  };

  const handleGuardarEdicion = async (id: number) => {
    const nombre = editNombre.trim();
    if (!nombre) return;
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await actualizarCatalogo(config.id, id, {
        nombre,
        orden: item.orden,
        activo: item.activo,
      });
      setEditandoId(null);
      cargar();
    } catch {
      alert('Error al actualizar');
    }
  };

  const activos = items.filter(i => i.activo);

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Cabecera de la tarjeta */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${dotColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dotColor, fontSize: 14,
        }}>
          <i className={config.icon}></i>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{config.label}</span>
      </div>

      {/* Input agregar */}
      {!config.soloLectura && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          borderBottom: '0.5px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <input
            ref={inputRef}
            className="input"
            value={nuevoNombre}
            onChange={e => setNuevo(e.target.value)}
            placeholder="Agregar nuevo..."
            style={{ flex: 1, fontSize: 13, height: 36 }}
            onKeyDown={e => { if (e.key === 'Enter') handleAgregar(); }}
          />
          <button
            onClick={handleAgregar}
            disabled={saving || !nuevoNombre.trim()}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: saving || !nuevoNombre.trim() ? 'var(--border)' : '#111',
              color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            {saving
              ? <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 13 }}></i>
              : <i className="fa-solid fa-plus"></i>
            }
          </button>
        </div>
      )}

      {/* Lista de ítems */}
      <div>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>
        ) : activos.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Sin ítems
          </div>
        ) : activos.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 16px',
              borderBottom: idx < activos.length - 1 ? '0.5px solid var(--border)' : 'none',
              gap: 10,
            }}
          >
            {/* Punto de color */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: dotColor, flexShrink: 0,
            }} />

            {/* Nombre editable inline */}
            {editandoId === item.id ? (
              <input
                className="input"
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                autoFocus
                style={{ flex: 1, fontSize: 13, height: 32 }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleGuardarEdicion(item.id);
                  if (e.key === 'Escape') setEditandoId(null);
                }}
                onBlur={() => handleGuardarEdicion(item.id)}
              />
            ) : (
              <span
                style={{ flex: 1, fontSize: 13.5, color: 'var(--text-1)', cursor: 'text' }}
                onDoubleClick={() => { setEditandoId(item.id); setEditNombre(item.nombre); }}
                title="Doble clic para editar"
              >
                {item.nombre}
              </span>
            )}

            {/* Acciones */}
            {!config.soloLectura && editandoId !== item.id && (
              <button
                className="cc-menu cc-menu-danger"
                title="Eliminar"
                onClick={() => { setErrorDel(''); setItemEliminando(item); }}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            )}
          </div>
        ))}
      </div>

      {itemEliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar ítem"
          mensaje={<>¿Estás seguro que querés eliminar <strong>{itemEliminando.nombre}</strong>?</>}
          detalle="El ítem dejará de aparecer en los formularios."
          loading={loadingDel}
          error={errorDel}
          onConfirmar={confirmarEliminar}
          onCancelar={() => { setItemEliminando(null); setErrorDel(''); }}
        />
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb">
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Inicio</span>
            <span className="sep">›</span>
            <span>Configuración</span>
          </div>
          <div className="page-title">Configuración</div>
          <div className="page-subtitle">Administre los catálogos del sistema.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {SECCIONES.map(seccion => (
          <div key={seccion.titulo}>
            {/* Cabecera de sección */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 14,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#11111108',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-1)', fontSize: 15,
              }}>
                <i className={seccion.icono}></i>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
                {seccion.titulo}
              </span>
            </div>

            {/* Grilla de tarjetas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {seccion.catalogos.map(config => (
                <CatalogoCard key={config.id} config={config} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
