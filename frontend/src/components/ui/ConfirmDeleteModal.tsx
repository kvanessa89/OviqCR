interface Props {
  titulo: string;
  mensaje: React.ReactNode;
  detalle?: string;
  loading?: boolean;
  error?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmDeleteModal({ titulo, mensaje, detalle, loading, error, onConfirmar, onCancelar }: Props) {
  return (
    <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1' && !loading) onCancelar(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--danger)' }}></i>
          <div className="modal-title">{titulo}</div>
          <button className="modal-close" onClick={onCancelar} disabled={loading}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-1)' }}>{mensaje}</p>
          {detalle && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-3)' }}>{detalle}</p>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onCancelar} disabled={loading}>Cancelar</button>
          <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={onConfirmar} disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Eliminando...</>
              : <><i className="fa-solid fa-trash"></i> Eliminar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
