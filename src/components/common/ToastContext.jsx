import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000, action = null) => {
    setToasts(prev => {
      // Deduplicate: if a toast with the exact same message exists, don't add a new one
      if (prev.some(t => t.message === message)) {
        return prev;
      }
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      return [...prev, { id, message, type, action }];
    });
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((idOrUpdater) => {
    if (typeof idOrUpdater === 'function') {
      setToasts(idOrUpdater);
    } else {
      setToasts(prev => prev.filter(t => t.id !== idOrUpdater));
    }
  }, []);

  const showSuccess = (msg, dur, action) => showToast(msg, 'success', dur, action);
  const showError = (msg, dur, action) => showToast(msg, 'error', dur, action);
  const showInfo = (msg, dur, action) => showToast(msg, 'info', dur, action);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && <i className="ri-checkbox-circle-fill"></i>}
              {toast.type === 'error' && <i className="ri-error-warning-fill"></i>}
              {toast.type === 'info' && <i className="ri-information-fill"></i>}
            </div>
            <div className="toast-message">
              {toast.message}
              {toast.action && (
                <button 
                  onClick={() => { toast.action.onClick(); removeToast(toast.id); }}
                  style={{ marginLeft: '10px', background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close notification">
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
