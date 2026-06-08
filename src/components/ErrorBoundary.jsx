import React from 'react';
import EmptyState from './common/EmptyState';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong' };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0b0b' }}>
          <EmptyState 
            icon="ri-error-warning-fill" 
            title="Something went wrong" 
            description={this.state.message || "An unexpected error occurred in the application."} 
            action={
              <button type="button" className="btn btn-primary" onClick={() => window.location.assign('/')}>
                <i className="ri-home-4-line" style={{ marginRight: '8px' }}></i> Back to home
              </button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
