import { useState, useEffect } from "react";
import { Media, MediaItemRes } from "@/app/types/media";
import { confirmSave, getMedia } from "@/app/lib/api";
import { putMedia } from "@/app/components/utils/putMedia";

interface MediaBlockProps {
  data: Media;
  onChange: (data: Media) => void;
}

interface SelectMediaProps {
  data: Media;
  onChange: (data: Media) => void;
  setShowModal: (show: boolean) => void;
}

export default function MediaBlock({ data, onChange }: MediaBlockProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {showModal && (
        <SelectMedia
          data={data}
          onChange={onChange}
          setShowModal={setShowModal}
        />
      )}
      <div className="flex gap-2 items-center">
        <select
          value={data.mediaType}
          onChange={(e) =>
            onChange({
              ...data,
              mediaType: e.target.value as "image" | "video" | "embed",
              url: "",
            })
          }
          className="border border-gray-300 p-2 rounded bg-white text-gray-800"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="embed">Embed Video</option>
        </select>

        {data.mediaType !== "embed" && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="border border-gray-300 p-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={showModal}
          >
            {showModal ? "Selecting..." : "Browse"}
          </button>
        )}

        <input
          type="text"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          placeholder={
            data.mediaType === "embed"
              ? "Enter embed URL (e.g., YouTube)"
              : "Enter URL"
          }
          className="border border-gray-300 p-2 rounded bg-white text-gray-800 flex-1"
        />
      </div>
    </>
  );
}

function SelectMedia({
  data,
  onChange,
  setShowModal,
}: SelectMediaProps) {
  const [uploadedFiles, setUploadedFiles] = useState<MediaItemRes[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      setLoading(true);
      const mediaFiles = await getMedia();
      if (mediaFiles) {
        setUploadedFiles(mediaFiles?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch uploaded files:", error);
      setUploadedFiles([]);
    } finally {
      setLoading(false); // Fixed: Ensures loading screen disappears
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    formData.append("type", data.mediaType === "video" ? "video" : "image");
    formData.append("source", "user");

    try {
      setUploading(true);

      const putRes = await putMedia(formData);
      
      // 1. Capture the saved media returned by confirmSave
      const savedMedia = await confirmSave([putRes.storageKey]);

      // 2. Prepend the new file(s) to the local state immediately
      const newMediaItems = savedMedia?.data;
      if (Array.isArray(newMediaItems) && newMediaItems.length > 0) {
        setUploadedFiles((prev) => [...newMediaItems, ...prev]);
      }

    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed w-full h-full inset-0 z-50 bg-black/50 flex flex-col justify-center items-center">

      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-bold text-west">Select Media</h2>
      </div>

      <div className="bg-white rounded-lg p-6 w-full max-w-[85vw] max-h-[90vh] overflow-y-auto">

        <div className="mt-6 flex justify-between items-center border-t border-b py-4">
          <label className={`cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? "Uploading..." : "+ Upload New File"}
            <input
              type="file"
              accept={data.mediaType === "image" ? "image/*" : "video/*"}
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = ""; // Reset input so re-uploading the same file triggers onChange
              }}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center py-8">Loading files...</p>
        ) : uploadedFiles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No files found. Upload one below.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-4">
            {uploadedFiles.map((file) => {
              const fileKey = file.id || file.url;
              return (
                <div
                  key={fileKey}
                  className="border border-gray-300 rounded-lg p-2 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                  onClick={() => {
                    onChange({ ...data, url: file.url });
                    setShowModal(false);
                  }}
                >
                  {data.mediaType === "image" ? (
                    <img
                      src={file.url}
                      className="w-full h-24 object-cover rounded"
                      alt={file.fileName || "Uploaded image"}
                    />
                  ) : (
                    <video
                      src={file.url}
                      className="w-full h-24 object-cover rounded pointer-events-none"
                      poster={file.thumbnailUrl}
                      muted
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}