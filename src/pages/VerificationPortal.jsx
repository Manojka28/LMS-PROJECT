import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function VerificationPortal() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [inputToken, setInputToken] = useState(token || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (verifyTokenStr) => {
    if (!verifyTokenStr) return;
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      // Use axios directly or api (api handles tokens, but public route shouldn't require it)
      // Since our api service attaches interceptors, we can just use it. It's fine if no token is sent.
      const res = await api.get(`/certificate/verify/${verifyTokenStr}`);
      if (res.success) {
        setVerificationResult(res);
      } else {
        setError(res.message || 'Invalid certificate');
      }
    } catch (err) {
      // 404 handled here
      if (err.status === 404) {
        setError('Certificate not found. Please check the Certificate ID or Token.');
      } else {
        setError('Error verifying certificate. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputToken) {
      navigate(`/verify-certificate/${inputToken}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '20px 5%', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ri-shield-check-fill" style={{ fontSize: '24px', color: '#fff' }}></i>
        </div>
        <h1 style={{ margin: 0, fontSize: '20px', fontFamily: 'Space Grotesk, sans-serif' }}>LMS Verification Portal</h1>
      </header>

      <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '15px', fontFamily: 'Space Grotesk, sans-serif' }}>Verify a Certificate</h2>
          <p style={{ color: '#888', fontSize: '18px' }}>Enter a Certificate ID or secure token to verify its authenticity.</p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '50px' }}>
          <input 
            type="text" 
            placeholder="e.g., CERT-ABC-123 or secure token..." 
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            style={{ flex: 1, padding: '16px 20px', fontSize: '16px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', outline: 'none' }}
          />
          <button 
            type="submit" 
            disabled={loading || !inputToken}
            style={{ padding: '0 30px', fontSize: '16px', fontWeight: 'bold', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: (loading || !inputToken) ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: (loading || !inputToken) ? 0.7 : 1 }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {error && (
          <div style={{ background: '#7f1d1d20', border: '1px solid #7f1d1d', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#f87171' }}>
            <i className="ri-error-warning-fill" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
            <h3 style={{ margin: '0 0 5px 0' }}>Invalid Certificate</h3>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {verificationResult && verificationResult.status === 'Revoked' && (
          <div style={{ background: '#7f1d1d20', border: '1px solid #7f1d1d', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="ri-close-line" style={{ fontSize: '36px', color: '#fff' }}></i>
            </div>
            <h2 style={{ color: '#f87171', margin: '0 0 10px 0', fontSize: '28px' }}>CERTIFICATE REVOKED</h2>
            <p style={{ color: '#fca5a5', marginBottom: '20px' }}>This certificate was officially revoked by the issuing authority.</p>
            
            <div style={{ background: '#00000040', padding: '20px', borderRadius: '8px', textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ marginBottom: '10px' }}><span style={{ color: '#888' }}>ID:</span> <strong style={{ color: '#fff' }}>{verificationResult.certificate.certificateId}</strong></div>
              <div style={{ marginBottom: '10px' }}><span style={{ color: '#888' }}>Student:</span> <span style={{ color: '#fff' }}>{verificationResult.certificate.studentName}</span></div>
              <div style={{ marginBottom: '10px' }}><span style={{ color: '#888' }}>Course:</span> <span style={{ color: '#fff' }}>{verificationResult.certificate.courseTitle}</span></div>
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}>
                <span style={{ color: '#888' }}>Reason:</span> <span style={{ color: '#f87171' }}>{verificationResult.revocationReason}</span>
              </div>
            </div>
          </div>
        )}

        {verificationResult && verificationResult.status === 'Valid' && (
          <div style={{ background: '#1a1a1a', border: '1px solid #10b98150', padding: '40px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 40px #10b98110' }}>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 20px #10b98150' }}>
              <i className="ri-check-line" style={{ fontSize: '48px', color: '#fff' }}></i>
            </div>
            <h2 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: '32px', fontFamily: 'Space Grotesk, sans-serif' }}>VERIFIED & AUTHENTIC</h2>
            <p style={{ color: '#a7f3d0', fontSize: '16px', marginBottom: '40px' }}>This certificate is official and was securely issued by the LMS platform.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left', background: '#0b0b0b', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
              <div>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '14px' }}>Certificate ID</p>
                <p style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{verificationResult.certificate.certificateId}</p>
              </div>
              <div>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '14px' }}>Issue Date</p>
                <p style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{new Date(verificationResult.certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '14px' }}>Recipient Name</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{verificationResult.certificate.studentName}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '14px' }}>Course Completed</p>
                <p style={{ color: '#fff', margin: 0, fontSize: '18px' }}>{verificationResult.certificate.courseTitle}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '14px' }}>Issued By</p>
                <p style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{verificationResult.certificate.instructorName} (Lead Instructor)</p>
              </div>
            </div>
            
            {verificationResult.certificate.pdfUrl && (
              <button 
                onClick={() => window.open(`http://localhost:5000${verificationResult.certificate.pdfUrl}`, '_blank')}
                style={{ marginTop: '30px', padding: '12px 24px', background: 'transparent', color: '#10b981', border: '1px solid #10b981', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="ri-external-link-line"></i> View Original Document
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
