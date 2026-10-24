
"use client";

import React, { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function UploadFileButton({
  onUpload,
  isUploading,
  maxFileSize = 15 * 1024 * 1024,
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndUpload = (file) => {
    if (!file || isUploading) return;

    if (file.size > maxFileSize) {
      Swal.fire(
        "File Too Large",
        "Maximum allowed track size is 15 MB.",
        "warning"
      );
      return;
    }

    if (file.size === 0) {
      Swal.fire(
        "Empty File",
        "Please select a valid audio file.",
        "warning"
      );
      return;
    }

    const allowedExtensions = [
      ".mp3",
      ".wav",
      ".m4a",
      ".flac",
      ".ogg",
    ];

    const extension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));

    if (!allowedExtensions.includes(extension)) {
      Swal.fire(
        "Unsupported File",
        "Please select an MP3, WAV, M4A, FLAC, or OGG file.",
        "warning"
      );
      return;
    }

    onUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUploading) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    }

    if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];

    validateAndUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    validateAndUpload(file);

    // Allow selecting the same file again
    e.target.value = "";
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
        dragActive
          ? "border-amber-500 bg-amber-50"
          : "border-gray-300 bg-white"
      }`}
    >
      <div className="flex justify-center mb-3">
        {isUploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        ) : (
          <Upload className="w-8 h-8 text-gray-600" />
        )}
      </div>

      <p className="text-gray-800 font-semibold">
        Upload Audio Track
      </p>

      <p className="text-sm text-gray-500 mb-4">
        Drag and drop your audio file here
      </p>

      <p className="text-xs text-gray-500 mb-4">
        MP3, WAV, M4A, FLAC or OGG — maximum 15 MB
      </p>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Select File"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".mp3,.wav,.m4a,.flac,.ogg,audio/*"
        disabled={isUploading}
      />
    </div>
  );
}


// 'use client';

// import React, { useState, useRef } from "react";
// import { Upload, Loader2 } from "lucide-react";
// // import UploadPage from "../uploadFile";

// export default function UploadFileButton({ onUpload, isUploading }) {
//   const [dragActive, setDragActive] = useState(false);
//   const fileInputRef = useRef(null);

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
//     if (e.type === "dragleave") setDragActive(false);
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     const file = e.dataTransfer.files?.[0];
//     if (file) onUpload(file);
    
//   };

//   const handleFileSelect = (e) => {
//     const file = e.target.files?.[0];
//     if (file) onUpload(file);
    
//   };

//   return (
//     <div
//       onDragEnter={handleDrag}
//       onDragLeave={handleDrag}
//       onDragOver={handleDrag}
//       onDrop={handleDrop}
//       className={`border-2 border-dashed rounded-xl p-6 text-center transition
//         ${dragActive ? "border-amber-500 bg-amber-50" : "border-gray-300 bg-white"}
//       `}
//     >
//       <div className="flex justify-center mb-3">
//         {isUploading ? (
//           <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
//         ) : (
//           <Upload className="w-8 h-8 text-gray-600" />
//           // <Upload onSuccess={(data) => console.log("Uploaded:", data)} />
//         )}
//       </div>

//       <p className="text-gray-800 font-semibold">Upload File</p>
//       <p className="text-sm text-gray-500 mb-4">
//         Drag & drop here or click to select
//       </p>

//       <button
//         onClick={() => fileInputRef.current?.click()}
//         disabled={isUploading}
//         className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
//       >
//         {isUploading ? "Uploading..." : "Select File"}
//       </button>

//           <input
//       ref={fileInputRef}
//       type="file"
//       className="hidden"
//       onChange={handleFileSelect}
//       accept="audio/*"
//     />

//     </div>
//   );
// }
