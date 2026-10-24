
"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";

import { useAuth } from "../../../../../AuthContext";
import UploadFileButton from "./UploadFileComponent";
import backendApi from "../../../../utils/backendApi";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MiB

export default function UploadPage({ onSuccess }) {
  const { authToken, isAuthenticated } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (file) => {
    if (isUploading) return;

    if (!authToken || !isAuthenticated) {
      Swal.fire(
        "Authentication Required",
        "You must be logged in to upload tracks.",
        "error"
      );
      return;
    }

    if (!title.trim()) {
      Swal.fire(
        "Missing Title",
        "Please enter a track title.",
        "warning"
      );
      return;
    }

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      Swal.fire(
        "File Too Large",
        "Tracks must be 15 MB or smaller.",
        "warning"
      );
      return;
    }

    if (file.size === 0) {
      Swal.fire(
        "Invalid File",
        "The selected audio file is empty.",
        "error"
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("audio_file", file);

   
      const res = await backendApi.post(
      "/media_streaming_management/upload_track/",
      formData,
      {
        headers: {
          Authorization: `Token ${authToken}`,
        },
        timeout: 300000,
        onUploadProgress: (event) => {
          if (!event.total) return;

          setUploadProgress(
            Math.round((event.loaded * 100) / event.total)
          );
        },
      }
    );

      if (res.data.status === "success") {
        await Swal.fire(
          "Upload Successful",
          "Your track has been uploaded successfully!",
          "success"
        );

        setTitle("");

        if (onSuccess) {
          onSuccess(res.data.data);
        }
      } else {
        Swal.fire(
          "Upload Failed",
          res.data.message || "Unable to upload track.",
          "error"
        );
      }

    } catch (error) {
      console.error("Upload error:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (
          error.code === "ECONNABORTED"
            ? "Upload timed out. Check your track list before retrying."
            : "An error occurred while uploading your track."
        );

      Swal.fire("Upload Failed", message, "error");

    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">

      <h2 className="text-lg font-semibold mb-4">
        Upload Music Track
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Track Title <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter song title"
          disabled={isUploading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          required
        />
      </div>

      <UploadFileButton
        onUpload={handleUpload}
        isUploading={isUploading}
        maxFileSize={MAX_FILE_SIZE}
      />

      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Uploading track...</span>
            <span>{uploadProgress}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            After transfer completes, the server may still
            be processing your track.
          </p>
        </div>
      )}

    </div>
  );
}


// "use client";
// import React, { useState } from "react";
// import Swal from "sweetalert2";

// import { useAuth } from "../../../../../AuthContext";// import UploadFileButton from "./uploadFileButton";
// import UploadFileButton from "./UploadFileComponent";
// import backendApi from '../../../../utils/backendApi'

// export default function UploadPage({ onSuccess }) {
//   const { authToken, isAuthenticated } = useAuth();
//   const [isUploading, setIsUploading] = useState(false);
//   const [title, setTitle] = useState("");

  

//   const handleUpload = async (file) => {
//     if (!authToken || !isAuthenticated) {
//       Swal.fire("Error", "You must be logged in to upload files.", "error");
//       return;

//     }
//     if (!title.trim()) {
//   Swal.fire("Missing Title", "Please enter a track title.", "warning");
//   return;
// }

//     setIsUploading(true);

//     try {
//       const formData = new FormData();
//       formData.append("title", title);
//       formData.append("audio_file", file);


//       // formData.append("file", file);
//       // formData.append("file_name", file);
      

//       const res = await backendApi.post("/media_streaming_management/upload_track/", formData, {
//         headers: {
//           Authorization: `Token ${authToken}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       console.log('res is', res)

//       if (res.data.status === "success") {
//         Swal.fire("Success", "File uploaded successfully!", "success");
//         if (onSuccess) onSuccess(res.data.data);
//       } else {
//         Swal.fire("Error", res.data.message || "Upload failed.", "error");
//       }
//     } catch (error) {
//       console.error("Upload error:", error);
//       Swal.fire("Error", "Server error during upload.", "error");
//     }

//     setIsUploading(false);
//   };

//   return (
    
//     <div className="p-4 bg-white rounded shadow-md">
//       <h2 className="text-lg font-semibold mb-4">Upload Reconciliation File</h2>
//       {/* ✅ Pass props correctly */}
//       <div className="mb-4">
//   <label className="block text-sm font-medium text-gray-700 mb-1">
//     Track Title <span className="text-red-500">*</span>
//   </label>

//   <input
//     type="text"
//     value={title}
//     onChange={(e) => setTitle(e.target.value)}
//     placeholder="Enter song title"
//     className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
//     required
//   />
// </div>

//       <UploadFileButton onUpload={handleUpload} isUploading={isUploading} />
//     </div>
//   );
// }

