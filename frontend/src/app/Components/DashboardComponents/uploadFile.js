"use client";
import React, { useState } from "react";
import Swal from "sweetalert2";
// import UploadFileButton from "./UploadFileButton";
// import UploadFileButton from "./uploadFileButton";
// import Swal from "sweetalert2";
import { useAuth } from "../../../../AuthContext";
// import UploadFileButton from "./uploadFileButton";
 import UploadFileButton from './UploadFileComponent'

// import backendApi from "../../../utils/backendApi";
import backendApi from "@/utils/backendApi";

export default function UploadPage({ onSuccess }) {
  const { authToken, isAuthenticated } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");

  

  const handleUpload = async (file) => {
    if (!authToken || !isAuthenticated) {
      Swal.fire("Error", "You must be logged in to upload files.", "error");
      return;

    }
    if (!title.trim()) {
  Swal.fire("Missing Title", "Please enter a track title.", "warning");
  return;
}

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("audio_file", file);


      // formData.append("file", file);
      // formData.append("file_name", file);
      

      const res = await backendApi.post("/media_streaming_management/upload_track/", formData, {
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log('res is', res)

      if (res.data.status === "success") {
        Swal.fire("Success", "File uploaded successfully!", "success");
        if (onSuccess) onSuccess(res.data.data);
      } else {
        Swal.fire("Error", res.data.message || "Upload failed.", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire("Error", "Server error during upload.", "error");
    }

    setIsUploading(false);
  };

  return (
    
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-lg font-semibold mb-4">Upload Reconciliation File</h2>
      {/* ✅ Pass props correctly */}
      <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Track Title <span className="text-red-500">*</span>
  </label>

  <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Enter song title"
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
    required
  />
</div>

      <UploadFileButton onUpload={handleUpload} isUploading={isUploading} />
    </div>
  );
}

