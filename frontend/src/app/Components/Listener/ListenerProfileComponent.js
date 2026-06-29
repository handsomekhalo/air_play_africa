'use client';

import { useState, useEffect } from "react";
import backendApi from "../../../utils/backendApi";
import { useAuthGuard } from "../../../utils/useAuthGuard";
// ─── Field config ────────────────────────────────────────────────
// Maps to what UserModelSerializer + Profile model returns
const FIELD_CONFIG = [
  { label: "First Name",   key: "first_name",   editable: true,  type: "text"  },
  { label: "Last Name",    key: "last_name",    editable: true,  type: "text"  },
  { label: "Email",        key: "email",        editable: false, type: "email" },
  { label: "Phone Number", key: "phone_number", editable: true,  type: "text"  },
  { label: "Location",     key: "location",     editable: true,  type: "text"  },
  { label: "Joined",       key: "date_joined",  editable: false, type: "text"  },
];

// ─── Flatten profile response into one flat object ───────────────
function flattenProfile(data) {
  return {
    first_name:   data?.first_name   ?? '',
    last_name:    data?.last_name    ?? '',
    email:        data?.email        ?? '',
    phone_number: data?.phone_number ?? '',
    location:     data?.location     ?? '',
    date_joined:  data?.date_joined
      ? new Date(data.date_joined).toLocaleDateString('en-ZA', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : '',
  };
}

// ─── Component ───────────────────────────────────────────────────

const ListenerProfileComponent = () => {
  useAuthGuard('/listener/login', 'Listener');

  const [profile, setProfile]   = useState(null);
  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  // ── Load profile on mount ─────────────────────────────────────
  // useEffect(() => {
    useEffect(() => {
  const fetchProfile = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        setProfile(user);
        setForm(flattenProfile(user));
      } else {
        setError('Could not load profile.');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Could not load profile.');
    } finally {
      setLoading(false);
    }
  };
  fetchProfile();
}, []);

  // ── Handle field changes ──────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSuccess(null);
    setError(null);
  };

  // ── Handle save ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const csrfFromCookies = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))?.split('=')[1];

      const payload = {
        first_name:   form.first_name,
        last_name:    form.last_name,
        phone_number: form.phone_number,
        location:     form.location,
      };

      const response = await backendApi.patch(
        '/system_management/update_profile/',
        payload,
        {
          headers: {
            'X-CSRFToken': csrfFromCookies || '',
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.data.status === 'success') {
        setProfile(response.data.data);
        setForm(flattenProfile(response.data.data));

        // Keep localStorage in sync
        const stored = localStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          localStorage.setItem('user', JSON.stringify({
            ...user,
            first_name: form.first_name,
            last_name:  form.last_name,
          }));
        }

        setSuccess('Profile updated successfully.');
        setEditing(false);
      } else {
        setError(response.data.message || 'Update failed.');
      }

    } catch (err) {
      console.error('Failed to update profile:', err);
      const detail = err?.response?.data?.errors || err?.response?.data?.message;
      setError(
        typeof detail === 'object'
          ? Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join(' | ')
          : detail || 'Update failed. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Handle cancel ─────────────────────────────────────────────
  const handleCancel = () => {
    setForm(flattenProfile(profile));
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  // ── States ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        padding: 24, background: '#fef2f2',
        border: '1px solid #fecaca', borderRadius: 8,
        color: '#991b1b', fontSize: 14,
      }}>
        ⚠️ {error || 'No profile found.'}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <>
      <style>{`
        .lp-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          max-width: 640px;
          margin: 0 auto;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        .lp-avatar {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: white;
          flex-shrink: 0;
        }
        .lp-name { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 3px; }
        .lp-email { font-size: 13px; color: #6b7280; margin: 0; }
        .lp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .lp-field { display: flex; flex-direction: column; gap: 5px; }
        .lp-label {
          font-size: 11px; font-weight: 600;
          color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .lp-value { font-size: 14px; color: #111827; margin: 0; min-height: 22px; }
        .lp-empty { color: #d1d5db; font-style: italic; }
        .lp-input {
          padding: 8px 11px;
          border: 1px solid #d1d5db; border-radius: 7px;
          font-size: 14px; color: #111827;
          background: #f9fafb;
          font-family: inherit; width: 100%; box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .lp-input:focus {
          outline: none; border-color: #6366f1; background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .lp-btn {
          padding: 8px 16px; border-radius: 7px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .lp-btn-primary { background: #6366f1; color: white; }
        .lp-btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .lp-btn-save { background: #10b981; color: white; }
        .lp-btn-save:hover:not(:disabled) { background: #059669; }
        .lp-btn-ghost {
          background: transparent; color: #6b7280;
          border: 1px solid #e5e7eb;
        }
        .lp-btn-ghost:hover { background: #f9fafb; }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .lp-feedback {
          margin-top: 18px; padding: 11px 14px;
          border-radius: 7px; font-size: 13px; font-weight: 500;
        }
        .lp-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .lp-error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .lp-banner {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 7px; padding: 9px 13px;
          font-size: 12px; color: #1d4ed8;
          margin-bottom: 20px; font-weight: 500;
        }
        .lp-readonly {
          display: inline-block; font-size: 10px; font-weight: 600;
          color: #9ca3af; background: #f3f4f6;
          padding: 1px 5px; border-radius: 3px;
          margin-left: 5px; vertical-align: middle;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .lp-loading {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          padding: 60px; color: #6b7280; font-size: 14px;
        }
        .lp-spinner {
          width: 28px; height: 28px;
          border: 3px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: lp-spin 0.7s linear infinite;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        @media (max-width: 560px) {
          .lp-grid { grid-template-columns: 1fr; }
          .lp-header { flex-direction: column; align-items: flex-start; gap: 14px; }
        }
      `}</style>

      <div className="lp-card">

        {/* Header */}
        <div className="lp-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="lp-avatar">
              {(form.first_name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="lp-name">{form.first_name} {form.last_name}</p>
              <p className="lp-email">{form.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <button className="lp-btn lp-btn-ghost" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="lp-btn lp-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button className="lp-btn lp-btn-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Editing banner */}
        {editing && (
          <div className="lp-banner">
            ✏️ Edit mode — fields marked <span className="lp-readonly">read only</span> cannot be changed.
          </div>
        )}

        {/* Fields */}
        <div className="lp-grid">
          {FIELD_CONFIG.map(field => {
            const isEditable = field.editable && editing;
            const value = form[field.key] ?? '';

            return (
              <div key={field.key} className="lp-field">
                <label className="lp-label">
                  {field.label}
                  {!field.editable && editing && (
                    <span className="lp-readonly">read only</span>
                  )}
                </label>

                {isEditable ? (
                  <input
                    type={field.type}
                    name={field.key}
                    value={value}
                    onChange={handleChange}
                    className="lp-input"
                  />
                ) : (
                  <p className={`lp-value ${!value ? 'lp-empty' : ''}`}>
                    {value || '—'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback */}
        {success && <div className="lp-feedback lp-success">✅ {success}</div>}
        {error   && <div className="lp-feedback lp-error">⚠️ {error}</div>}

      </div>
    </>
  );
};

export default ListenerProfileComponent;
