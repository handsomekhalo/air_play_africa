'use client';

import { useAuthGuard } from "@/utils/useAuthGuard";

import { useState, useEffect } from "react";
import { getArtistProfile } from "@/utils/admin_artists";
import { updateArtistProfile } from "@/utils/admin_artists";// ─── Field config ────────────────────────────────────────────────
// Maps exactly to what GetArtistProfileSerializer returns via Artist model
// editable: true  → user can change it
// editable: false → display only
const FIELD_CONFIG = [
  // ── User fields (nested under data.user) ──
  { label: "First Name",    key: "user.first_name",  editable: true,  type: "text" },
  { label: "Last Name",     key: "user.last_name",   editable: true,  type: "text" },
  { label: "Email",         key: "user.email",       editable: false, type: "email" },

  // ── Artist fields (top level of data) ──
  { label: "Bio",           key: "bio",              editable: true,  type: "textarea" },
  { label: "Location",      key: "location",         editable: true,  type: "text" },
  { label: "Wallet Address",key: "wallet_address",   editable: true,  type: "text" },
  { label: "Onboarding Step", key: "onboarding_step", editable: false, type: "text" },
  { label: "Merit Score",   key: "merit_score",      editable: false, type: "text" },
  { label: "Joined",        key: "created_at",       editable: false, type: "text" },
];

// ─── Helpers ─────────────────────────────────────────────────────

// Safely read a nested key like "user.first_name" from an object
function getNestedValue(obj, key) {
  return key.split('.').reduce((acc, part) => acc?.[part], obj) ?? '';
}

// Flatten profile so we can work with it in one flat object
function flattenProfile(data) {
  return {
    first_name:     data?.user?.first_name    ?? '',
    last_name:      data?.user?.last_name     ?? '',
    email:          data?.user?.email         ?? '',
    bio:            data?.bio                 ?? '',
    location:       data?.location            ?? '',
    wallet_address: data?.wallet_address      ?? '',
    onboarding_step: data?.onboarding_step    ?? '',
    merit_score:    data?.merit_score         ?? '',
    created_at:     data?.created_at
      ? new Date(data.created_at).toLocaleDateString('en-ZA', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : '',
  };
}

// ─── Component ───────────────────────────────────────────────────

const ArtistProfileComponent = () => {
  useAuthGuard('/login', 'Artist');

  const [profile, setProfile]   = useState(null);
  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  // ── Load profile on mount ──────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getArtistProfile();
        // API returns { status: 'success', data: { ...artistFields, user: {...} } }
        if (res.status === 'success') {
          setProfile(res.data);
          setForm(flattenProfile(res.data));
        } else {
          setError(res.message || 'Failed to load profile.');
        }
      } catch (err) {
        console.error("Failed to fetch artist profile:", err);
        setError('Could not load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Handle field changes ───────────────────────────────────────
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
      // Only send editable fields that have actually changed
      const payload = {
        first_name:     form.first_name,
        last_name:      form.last_name,
        bio:            form.bio,
        location:       form.location,
        wallet_address: form.wallet_address,
      };

      const res = await updateArtistProfile(payload);

      if (res.status === 'success') {
        // Update local state with returned data so display is fresh
        setProfile(res.data);
        setForm(flattenProfile(res.data));
        setSuccess('Profile updated successfully.');
        setEditing(false);
      } else {
        setError(res.message || 'Update failed.');
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      const detail = err?.response?.data?.errors || err?.response?.data?.message;
      setError(typeof detail === 'object'
        ? Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : detail || 'Update failed. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Handle cancel ─────────────────────────────────────────────
  const handleCancel = () => {
    setForm(flattenProfile(profile)); // reset to last saved
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  // ── Render helpers ────────────────────────────────────────────
  const renderField = ({ label, key, editable, type }) => {
    // flat key: "user.first_name" → "first_name", "bio" → "bio"
    const flatKey = key.includes('.') ? key.split('.').pop() : key;
    const value   = form[flatKey] ?? '';
    const isEditable = editable && editing;

    return (
      <div key={key} className="profile-field">
        <label className="field-label">{label}</label>
        {isEditable ? (
          type === 'textarea' ? (
            <textarea
              name={flatKey}
              value={value}
              onChange={handleChange}
              rows={4}
              className="field-input field-textarea"
            />
          ) : (
            <input
              type={type}
              name={flatKey}
              value={value}
              onChange={handleChange}
              className="field-input"
            />
          )
        ) : (
          <p className={`field-value ${!value ? 'field-empty' : ''}`}>
            {value || '—'}
          </p>
        )}
      </div>
    );
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
      <div className="profile-error">
        <p>⚠️ {error || 'No profile found.'}</p>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <>
      <style>{`
        .profile-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          max-width: 720px;
          margin: 0 auto;
          font-family: 'DM Sans', sans-serif;
        }

        .profile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .profile-title-block {
          margin-left: 16px;
          flex: 1;
        }

        .profile-name {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .profile-email {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-ghost {
          background: transparent;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .btn-ghost:hover {
          background: #f9fafb;
          color: #374151;
        }

        .btn-save {
          background: #10b981;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #059669;
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .profile-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .profile-field:has(textarea) {
          grid-column: 1 / -1;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .field-value {
          font-size: 15px;
          color: #111827;
          margin: 0;
          min-height: 24px;
        }

        .field-empty {
          color: #d1d5db;
          font-style: italic;
        }

        .field-input {
          padding: 9px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          background: #f9fafb;
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }

        .field-input:focus {
          outline: none;
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .field-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .profile-feedback {
          margin-top: 20px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .feedback-success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .feedback-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .editing-banner {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #1d4ed8;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .profile-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px;
          color: #6b7280;
          font-size: 14px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .profile-error {
          padding: 24px;
          color: #991b1b;
          background: #fef2f2;
          border-radius: 8px;
          font-size: 14px;
        }

        .readonly-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
          vertical-align: middle;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        @media (max-width: 600px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
          .profile-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>

      <div className="profile-card">

        {/* ── Header ── */}
        <div className="profile-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="profile-avatar">
              {(form.first_name?.[0] || '?').toUpperCase()}
            </div>
            <div className="profile-title-block">
              <p className="profile-name">
                {form.first_name} {form.last_name}
              </p>
              <p className="profile-email">{form.email}</p>
            </div>
          </div>

          <div className="profile-actions">
            {editing ? (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Editing banner ── */}
        {editing && (
          <div className="editing-banner">
            ✏️ You are in edit mode. Fields marked <span className="readonly-badge">read only</span> cannot be changed.
          </div>
        )}

        {/* ── Fields grid ── */}
        <div className="profile-grid">
          {FIELD_CONFIG.map(field => {
            const flatKey = field.key.includes('.') ? field.key.split('.').pop() : field.key;
            const value   = form[flatKey] ?? '';
            const isEditable = field.editable && editing;

            return (
              <div
                key={field.key}
                className="profile-field"
                style={field.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}
              >
                <label className="field-label">
                  {field.label}
                  {!field.editable && editing && (
                    <span className="readonly-badge">read only</span>
                  )}
                </label>

                {isEditable ? (
                  field.type === 'textarea' ? (
                    <textarea
                      name={flatKey}
                      value={value}
                      onChange={handleChange}
                      rows={4}
                      className="field-input field-textarea"
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={flatKey}
                      value={value}
                      onChange={handleChange}
                      className="field-input"
                    />
                  )
                ) : (
                  <p className={`field-value ${!value ? 'field-empty' : ''}`}>
                    {value || '—'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Feedback ── */}
        {success && (
          <div className="profile-feedback feedback-success">✅ {success}</div>
        )}
        {error && (
          <div className="profile-feedback feedback-error">⚠️ {error}</div>
        )}

      </div>
    </>
  );
};

export default ArtistProfileComponent;
