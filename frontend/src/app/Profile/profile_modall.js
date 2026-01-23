'use client';

import ProfileForm from './profile_form';


export default function ProfileModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal wrapper (true center) */}
      <div className="inset-0 flex items-center justify-center px-4">
        
        {/* Modal shell */}
        <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col h-[80vh]">

          {/* Header (fixed) */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold">My Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>
          </div>

          {/* Body (ONLY thing that scrolls) */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ProfileForm />
          </div>

        </div>
      </div>
    </div>
  );
}
