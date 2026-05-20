export default function EmptyState({ icon, title, subtitle, description, actionText, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-sub" style={{ marginBottom: '16px' }}>{subtitle || description}</div>
      {actionText && (
        <button className="btn btn-primary" onClick={onAction}>
          + {actionText}
        </button>
      )}
    </div>
  );
}