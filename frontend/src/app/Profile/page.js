'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import backendApi from '@/utils/backendApi';
import { getCsrfToken } from '@/utils/csrf';
import Sidebar from '@/app/Components/System_Management_Components/dashboard/SideBarComponent/sidebar';
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthGuard } from '../../../utils/useAuthGuard';

export default function AdminProfilePage() {
  useAuthGuard('/login', 'Admin');
  
  const { authToken, user: authUser } = useAuth();

console.log('Auth User:', authUser);

  const [form, setForm]       = useState({ first_name: '', last_name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Pre-fill from auth context on mount
useEffect(() => {
  if (!authToken) return;
  const fetchProfile = async () => {
    try {
      const res = await backendApi.get(
        '/system_management/get_admin_profile/',
        { headers: { Authorization: `Token ${authToken}` } }
      );
      if (res.data.status === 'success') {
        const u = res.data.data;
        setForm({
          first_name: u.first_name || '',
          last_name:  u.last_name  || '',
          email:      u.email      || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin profile:', err);
      // Graceful fallback to localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setForm({
          first_name: u.first_name || '',
          last_name:  u.last_name  || '',
          email:      u.email      || '',
        });
      }
    }
  };
  fetchProfile();
}, [authToken]);



  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setFeedback(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const csrfToken = await getCsrfToken();
      const res = await backendApi.patch(
        '/system_management/update_admin_profile/',
        form,
        { headers: { Authorization: `Token ${authToken}`, 'X-CSRFToken': csrfToken } },

      );

        console.log('Response__________________________________:', res.data)

      if (res.data.status === 'success') {
        setFeedback({ type: 'success', message: 'Profile updated successfully.' });
      } else {
        setFeedback({ type: 'error', message: res.data.message || 'Update failed.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Update failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'First Name', name: 'first_name', type: 'text'  },
    { label: 'Last Name',  name: 'last_name',  type: 'text'  },
    { label: 'Email',      name: 'email',       type: 'email' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1">
        <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" /> My Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Update your admin account details
            </p>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div style={{ maxWidth: 480 }}>

            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', marginBottom: 28,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
            }}>
              {(form.first_name?.[0] || '?').toUpperCase()}
            </div>

            {/* Fields */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: 24, marginBottom: 20,
            }}>
              {fields.map(field => (
                <div key={field.name} style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 600,
                    color: '#6b7280', marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px', borderRadius: 8,
                      border: '1px solid #e5e7eb', fontSize: 14,
                      color: '#111', background: '#f9fafb',
                      fontFamily: 'inherit', transition: 'border-color 0.15s',
                    }}
                    onFocus={e  => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e   => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              ))}
            </div>

            {/* Feedback */}
            {feedback && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: 13, fontWeight: 500,
              }}>
                {feedback.type === 'success'
                  ? <CheckCircle size={16} />
                  : <AlertCircle size={16} />
                }
                {feedback.message}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: '#111', color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
              }}
            >
              <Save size={16} />
              {loading ? 'Saving…' : 'Save Changes'}
            </button>

          </div>
        </main>
      </div>
    </div>
  );
}