export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', loading = false, danger = true, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal max-w-[420px]">
        <div className="modal-header">
          <h2 className={danger ? 'text-rose' : ''}>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">{message}</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} />Processing…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}