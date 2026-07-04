'use client';

import { useState } from 'react';
import { useAuth } from '../../../../AuthContext';
import backendApi from '@/utils/backendApi';
import { getCsrfToken } from '@/utils/csrf';
import { Wallet, X, AlertCircle, CheckCircle } from 'lucide-react';

const MINIMUM_WITHDRAWAL = 500;

export default function WithdrawalModal({ onClose, availableBalance, onSuccess }) {
  const { authToken } = useAuth();

  const [form, setForm] = useState({
    amount:         '',
    bank_name:      '',
    account_number: '',
    account_name:   '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Client-side guards
    const amount = parseFloat(form.amount);
    if (!amount || isNaN(amount)) {
      setError('Please enter a valid amount.');
      return;
    }
    if (amount < MINIMUM_WITHDRAWAL) {
      setError(`Minimum withdrawal is R${MINIMUM_WITHDRAWAL}.`);
      return;
    }
    if (amount > availableBalance) {
      setError(`Amount exceeds your available balance of R${availableBalance.toFixed(2)}.`);
      return;
    }
    if (!form.bank_name.trim() || !form.account_number.trim() || !form.account_name.trim()) {
      setError('All banking details are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await backendApi.post(
        '/media_streaming_management/request_withdrawal/',
        {
          amount:         parseFloat(form.amount),
          bank_name:      form.bank_name.trim(),
          account_number: form.account_number.trim(),
          account_name:   form.account_name.trim(),
        },
        { headers: { Authorization: `Token ${authToken}`, 'X-CSRFToken': csrfToken } }
      );

      if (res.data.status === 'success') {
        setSuccess(res.data.message || 'Withdrawal request submitted.');
        onSuccess?.(res.data.data);
      } else {
        setError(res.data.message || 'Submission failed.');
      }
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setError(err?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16,
          padding: 28, width: '100%', maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={20} color="#f59e0b" />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>
              Withdraw Funds
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={20} />
          </button>
        </div>

        {/* Balance info */}
        <div style={{
          background: '#fefce8', border: '1px solid #fde68a',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 2px', fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            AVAILABLE BALANCE
          </p>
          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#111' }}>
            R{availableBalance?.toFixed(2) ?? '0.00'}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
            Minimum withdrawal: R{MINIMUM_WITHDRAWAL} · Processed within 3–5 business days
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, padding: '20px 0',
          }}>
            <CheckCircle size={48} color="#10b981" />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#065f46', textAlign: 'center' }}>
              {success}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
              Your request is under review. You'll receive confirmation once processed.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 8, padding: '10px 28px', borderRadius: 8,
                background: '#10b981', color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Form fields */}
            {[
              { label: 'Withdrawal Amount (R)', name: 'amount', type: 'number', placeholder: `Min R${MINIMUM_WITHDRAWAL}` },
              { label: 'Bank Name',             name: 'bank_name',      type: 'text', placeholder: 'e.g. FNB, Standard Bank, Capitec' },
              { label: 'Account Number',        name: 'account_number', type: 'text', placeholder: 'Your bank account number' },
              { label: 'Account Holder Name',   name: 'account_name',   type: 'text', placeholder: 'Name as it appears on your account' },
            ].map(field => (
              <div key={field.name} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  min={field.name === 'amount' ? MINIMUM_WITHDRAWAL : undefined}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', borderRadius: 8,
                    border: '1px solid #e5e7eb', fontSize: 14,
                    color: '#111', background: '#f9fafb',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            ))}

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13,
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={onClose}
                disabled={submitting}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8,
                  border: '1px solid #e5e7eb', background: 'transparent',
                  color: '#6b7280', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8, border: 'none',
                  background: submitting ? '#d1d5db' : '#f59e0b',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.15s',
                }}
              >
                {submitting ? 'Submitting…' : 'Request Withdrawal'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}