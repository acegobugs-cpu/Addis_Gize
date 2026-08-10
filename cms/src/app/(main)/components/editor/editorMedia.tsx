'use client';

import { getMedia, uploadFile } from "@/app/lib/api";
import { MediaItemRes } from "@/app/types/media";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface BaseModalProps {
  editor: any;
  onClose: () => void;
}

// ============================================================================
// Shared Modal Wrapper
// ============================================================================
function ModalWrapper({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="font-medium text-lg text-gray-800">{title}</h2>
          <button
            onMouseDown={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// IMAGE MODAL
// ============================================================================
export function ImageModal({ editor, onClose }: BaseModalProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<MediaItemRes[]>([]);

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      try {
        const mediaFiles = await getMedia();
        setMedia(mediaFiles.data || []);
      } catch (error) {
        console.error("Failed to fetch uploaded files:", error);
        setMedia([]);
      }
    };
    fetchUploadedFiles();
  }, []);

  const handleInsert = (src: string) => {
    if (!src) return;
    editor.chain().focus().insertImage({ src, alt, caption }).run();
    onClose();
  };

  const handleUpload = async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name);
      form.append("type", "image");
      form.append("source", "user");

      const result: any = await uploadFile(form);
      const data = await result.json();
      handleInsert(data.url);
    } catch (error) {
      console.error("Failed to upload image:", error);
    }
  };

  return (
    <ModalWrapper title="Insert Image" onClose={onClose}>
      {/* External URL */}
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700">Image URL</label>
        <div className="flex gap-2 mt-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            placeholder="https://example.com/image.jpg"
          />
          <button
            onMouseDown={() => handleInsert(url)}
            className="bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium px-4 rounded-md transition-colors"
          >
            Insert
          </button>
        </div>
      </div>

      {/* Alt Text & Caption */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-sm font-medium text-gray-700">Alt Text</label>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm mt-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            placeholder="Image description"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Caption</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm mt-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            placeholder="Optional caption"
          />
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700">Upload Image</label>
        <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center hover:border-[#1a73e8] transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="text-sm"
          />
        </div>
      </div>

      {/* Media Library */}
      {media.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700">Media Library</label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {media.map((file, i) => (
              <div
                key={i}
                onMouseDown={() => handleInsert(file.url)}
                className="cursor-pointer border border-gray-200 rounded-md overflow-hidden hover:opacity-80 hover:ring-2 hover:ring-[#1a73e8] aspect-square"
              >
                <img src={file.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}

// ============================================================================
// VIDEO MODAL
// ============================================================================
export function VideoModal({ editor, onClose }: BaseModalProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [controls, setControls] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [media, setMedia] = useState<MediaItemRes[]>([]);

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      try {
        const mediaFiles = await getMedia();
        setMedia(mediaFiles.data || []);
      } catch (error) {
        console.error("Failed to fetch uploaded files:", error);
        setMedia([]);
      }
    };
    fetchUploadedFiles();
  }, []);

  const handleInsert = (src: string) => {
    if (!src) return;
    editor
      .chain()
      .focus()
      .insertVideo({ src, caption, controls, autoplay, loop })
      .run();
    onClose();
  };

  const handleUpload = async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name);
      form.append("type", "video");
      form.append("source", "user");

      const result: any = await uploadFile(form);
      const data = await result.json();
      handleInsert(data.url);
    } catch (error) {
      console.error("Failed to upload video:", error);
    }
  };

  return (
    <ModalWrapper title="Insert Video" onClose={onClose}>
      {/* External URL */}
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700">Video URL</label>
        <div className="flex gap-2 mt-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            placeholder="https://example.com/video.mp4"
          />
          <button
            onMouseDown={() => handleInsert(url)}
            className="bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium px-4 rounded-md transition-colors"
          >
            Insert
          </button>
        </div>
      </div>

      {/* Caption & Playback Options */}
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700">Caption</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm mt-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
          placeholder="Optional caption"
        />
      </div>

      <div className="flex items-center gap-6 mb-5">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={controls}
            onChange={(e) => setControls(e.target.checked)}
            className="rounded text-[#1a73e8]"
          />
          Show Controls
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
            className="rounded text-[#1a73e8]"
          />
          Autoplay
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="rounded text-[#1a73e8]"
          />
          Loop
        </label>
      </div>

      {/* Upload */}
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700">Upload Video</label>
        <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center hover:border-[#1a73e8] transition-colors">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="text-sm"
          />
        </div>
      </div>

      {/* Media Library */}
      {media.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700">Media Library</label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {media.map((file, i) => (
              <div
                key={i}
                onMouseDown={() => handleInsert(file.url)}
                className="cursor-pointer border border-gray-200 rounded-md overflow-hidden hover:opacity-80 hover:ring-2 hover:ring-[#1a73e8] aspect-square bg-black/5"
              >
                <video src={file.url} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}

// ============================================================================
// EMBED MODAL
// ============================================================================
export function EmbedModal({ editor, onClose }: BaseModalProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const handleInsert = () => {
    if (!url) return;
    editor.chain().focus().insertEmbed({ src: url, caption }).run();
    onClose();
  };

  return (
    <ModalWrapper title="Insert Embed / Iframe" onClose={onClose}>
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700">Embed URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm mt-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
          placeholder="https://www.youtube.com/embed/..."
        />
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700">Caption</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm mt-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
          placeholder="Optional caption"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onMouseDown={onClose}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onMouseDown={handleInsert}
          disabled={!url}
          className="bg-[#1a73e8] hover:bg-[#1765cc] disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Insert Embed
        </button>
      </div>
    </ModalWrapper>
  );
}