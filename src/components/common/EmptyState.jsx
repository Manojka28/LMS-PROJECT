import React from 'react';

export default function EmptyState({ icon = 'ri-inbox-line', title, description, action }) {
  return (
    <div className="empty-state" role="region" aria-label={title}>
      <i className={`${icon} empty-state-icon`} aria-hidden="true"></i>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-text">{description}</p>}
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}
