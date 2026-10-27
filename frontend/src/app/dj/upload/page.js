
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../utils/useAuthGuard';
import { uploadMix } from '../../../utils/mixes_api_helper';
import DJNav from '@/app/Components/DJ/DJNav';

export default function DJUploadPage() {
  const router = useRouter();
  const authorized = useAuthGuard('/browse', 'DJ');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [mixFile, setMixFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;

    setError('');

    if (!title.trim() || !mixFile) {
      setError('Please enter a title and select a mix file.');
      return;
    }

    try {
      setUploading(true);

      const response = await uploadMix({
        title: title.trim(),
        description: description.trim(),
        genre: genre.trim(),
        mixFile,
        coverImage,
      });

      if (response.status === 'success') {
        router.replace('/dj/dashboard');
      } else {
        setError(response.message || 'Upload failed.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to upload your mix. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (!authorized) return null;

  return (
    <>
    <DJNav/>
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.push('/dj/dashboard')}
          className="text-gray-400 hover:text-white mb-8"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-2">
          Upload DJ Mix
        </h1>
        <p className="text-gray-400 mb-8">
          Share your mix with listeners on AirPlay Africa.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="mix-title" className="block mb-2">
              Mix Title *
            </label>
            <input
              id="mix-title"
              type="text"
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3"
              placeholder="e.g. Sunday Amapiano Sessions"
            />
          </div>

          <div>
            <label htmlFor="mix-description" className="block mb-2">
              Description
            </label>
            <textarea
              id="mix-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3"
              placeholder="Tell listeners about your mix..."
            />
          </div>

          <div>
            <label htmlFor="mix-genre" className="block mb-2">
              Genre
            </label>
            <input
              id="mix-genre"
              type="text"
              maxLength={100}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3"
              placeholder="Amapiano, Afro House, Hip-Hop..."
            />
          </div>

          <div>
            <label htmlFor="mix-file" className="block mb-2">
              Mix Audio File *
            </label>
            <input
              id="mix-file"
              type="file"
              accept=".mp3,audio/mpeg"
              required
              onChange={(e) =>
                setMixFile(e.target.files?.[0] || null)
              }
              className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3"
            />
            {mixFile && (
              <p className="text-sm text-gray-400 mt-2">
                Selected: {mixFile.name} (
                {(mixFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="mix-cover" className="block mb-2">
              Cover Image (optional)
            </label>
            <input
              id="mix-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setCoverImage(e.target.files?.[0] || null)
              }
              className="w-full bg-[#181818] border border-gray-700 rounded-lg p-3"
            />
          </div>

          {error && (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg py-3 font-semibold"
          >
            {uploading ? 'Uploading mix...' : 'Upload Mix'}
          </button>

          {uploading && (
            <p className="text-gray-400 text-sm text-center">
              Please keep this page open until the upload finishes.
            </p>
          )}
        </form>
      </div>
    </main>
     </>
  );
}
