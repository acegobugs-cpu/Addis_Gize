'use client';
import { getMedia, uploadFile } from "@/app/lib/api";
import {useState, useEffect} from "react";

// ---------------------------------------------------------------------------
// Media Window (unchanged)
// ---------------------------------------------------------------------------
type MediaWindowProps = {
  editor: any;
  onClose: () => void;
};

export function MediaWindow({ editor, onClose }: MediaWindowProps) {
  const [tab, setTab] = useState<"image" | "video" | "embed">("image");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<string[]>([]);

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      try {
        const mediaFiles = await getMedia();
        setMedia(mediaFiles.files.map((file: any) => file));
      } catch (error) {
        console.error("Failed to fetch uploaded files:", error);
        setMedia([]);
      }
    };
    fetchUploadedFiles();
  }, []);

  const insert = (src: string) => {
    if (!src) return;
    if (tab === "image") {
      editor.chain().focus().insertImage({ src, caption }).run();
    }
    if (tab === "video") {
      editor.chain().focus().insertVideo({ src, caption, controls: true }).run();
    }
    if (tab === "embed") {
      editor.chain().focus().insertEmbed({ src, caption }).run();
    }
    onClose();
  };

  const upload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("name", "filename");
    form.append("type", "image");
    form.append("source", "user");

    const result: any = await uploadFile(form);
    const data = await result.json();
    insert(data.url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="font-medium text-lg text-gray-800">Insert media</h2>
          <button
            onMouseDown={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b border-gray-200">
          {(["image", "video", "embed"] as const).map((t) => (
            <button
              key={t}
              onMouseDown={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                tab === t ? "border-[#1a73e8] text-[#1a73e8]" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* URL input */}
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700">External URL</label>
            <div className="flex gap-2 mt-1.5">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
                placeholder="https://..."
              />
              <button
                onMouseDown={() => insert(url)}
                className="bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium px-4 rounded-md"
              >
                Insert
              </button>
            </div>
          </div>

          {/* Caption */}
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700">Caption</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm mt-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
              placeholder="Optional caption"
            />
          </div>

          {/* Upload */}
          {tab !== "embed" && (
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700">Upload</label>
              <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center hover:border-[#1a73e8] transition-colors">
                <input
                  type="file"
                  accept={tab === "image" ? "image/*" : "video/*"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                  }}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Media library */}
          {tab !== "embed" && (
            <div>
              <label className="text-sm font-medium text-gray-700">Media library</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {media.map((file, i) => (
                  <div
                    key={i}
                    onMouseDown={() => insert(file)}
                    className="cursor-pointer border border-gray-200 rounded-md overflow-hidden hover:opacity-80 hover:ring-2 hover:ring-[#1a73e8] aspect-square"
                  >
                    {tab === "image" ? (
                      <img src={file} className="w-full h-full object-cover" />
                    ) : (
                      <video src={file} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}