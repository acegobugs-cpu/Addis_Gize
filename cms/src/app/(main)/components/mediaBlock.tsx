import { useState, useEffect } from "react";
import { Media, MediaItemRes } from "@/app/types/types";
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
  handleFileUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export default function MediaBlock({ data, onChange }: MediaBlockProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name); // Used original file name instead of hardcoded string
    formData.append("type", data.mediaType === "video" ? "video" : "image");
    formData.append("source", "user");

    try {
      setUploading(true);

      const putRes = await putMedia(formData);
      await confirmSave([putRes.storageKey]);

      // Automatically assign uploaded file URL to editor state and close modal
      // if (putRes.url) {
      //   onChange({ ...data, url: putRes.url, source: "local" });
      //   setShowModal(false);
      // }
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {showModal && (
        <SelectMedia
          data={data}
          onChange={onChange}
          setShowModal={setShowModal}
          handleFileUpload={handleFileUpload}
          uploading={uploading}
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
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Browse"}
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
  handleFileUpload,
  uploading,
}: SelectMediaProps) {
  const [uploadedFiles, setUploadedFiles] = useState<MediaItemRes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUploadedFiles = async () => {
      try {
        const mediaFiles = await getMedia();
        if (isMounted) {
          setUploadedFiles(mediaFiles?.files || []);
        }
      } catch (error) {
        console.error("Failed to fetch uploaded files:", error);
        if (isMounted) setUploadedFiles([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUploadedFiles();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Select Media</h2>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center py-8">Loading files...</p>
        ) : uploadedFiles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No files found. Upload one below.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedFiles.map((file) => {
              const fileKey = file.id || file.url;
              return (
                <div
                  key={fileKey}
                  className="border border-gray-300 rounded-lg p-2 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                  onClick={() => {
                    onChange({ ...data, url: file.url, source: "local" });
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

        <div className="mt-6 flex justify-between items-center border-t pt-4">
          <label className={`cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? "Uploading..." : "+ Upload New File"}
            <input
              type="file"
              accept={data.mediaType === "image" ? "image/*" : "video/*"}
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
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
      </div>
    </div>
  );
}