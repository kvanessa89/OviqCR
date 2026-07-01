import { useState, useEffect } from 'react';

export interface UsuariosFilterState {
  roles: string[];
  estados: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: UsuariosFilterState) => void;
  initialFilters: UsuariosFilterState;
}

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        padding: '6px 14px', borderRadius: 99,
        border: selected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
        background: selected ? 'rgba(59,110,245,0.10)' : 'var(--surface)',
        color: selected ? 'var(--primary)' : 'var(--text-2)',
        fontSize: 13, fontWeight: selected ? 600 : 400,
        cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  );
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

export default function UsuariosFilterSheet({ isOpen, onClose, onApply, initialFilters }: Props) {
  const [local, setLocal] = useState<UsuariosFilterState>(initialFilters);

  useEffect(() => { if (isOpen) setLocal(initialFilters); }, [isOpen]);

  const total = local.roles.length + local.estados.length;
  const limpiar = () => setLocal({ roles: [], estados: [] });

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 1000, animation: 'fadeInBd .18s ease' }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
        background: 'var(--surface)', borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', maxHeight: '82vh',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUpSheet .22s ease',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--border-strong)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 12px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Filtros</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {total > 0 && (
              <button type="button" onClick={limpiar} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                Limpiar todo
              </button>
            )}
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '4px 18px 8px', flex: 1 }}>
          <Section title="Rol">
            {['Administrador', 'Trabajador'].map(r => (
              <Chip key={r} label={r} selected={local.roles.includes(r)} onToggle={() => setLocal(s => ({ ...s, roles: toggle(s.roles, r) }))} />
            ))}
          </Section>
          <Section title="Estado">
            {['Activo', 'Inactivo'].map(e => (
              <Chip key={e} label={e} selected={local.estados.includes(e)} onToggle={() => setLocal(s => ({ ...s, estados: toggle(s.estados, e) }))} />
            ))}
          </Section>
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => onApply(local)}
            style={{
              width: '100%', background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Aplicar filtros
            {total > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 99, padding: '1px 8px', fontSize: 12 }}>
                {total}
              </span>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes fadeInBd { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </>
  );
}
