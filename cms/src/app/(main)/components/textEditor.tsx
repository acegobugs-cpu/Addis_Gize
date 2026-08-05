"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderLineIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Highlighter,
  ImagePlus,
  Link as LinkIcon,
  TextAlignStart,
  TextAlignEnd,
  TextAlignCenter,
  TextAlignJustify,
  UnderlineIcon,
  ChevronDown,
  Baseline,
} from "lucide-react";
import {
  MediaBlock,
  FontSize,
  Highlight,
  ArticleTitle,
  ArticleDescription,
  HeadMedia,
} from "./editor/editorExtentions";
import { getMedia, uploadFile } from "@/app/lib/api";

interface EditorProps {
  initialValue?: any;
  onChange?: (json: any) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textHighlight: {
      setTextHighlight: (color: string) => ReturnType;
      unsetTextHighlight: () => ReturnType;
    };
  }
}

// ---------------------------------------------------------------------------
// Shared "Docs-like" UI primitives
// ---------------------------------------------------------------------------

const DOCS_BLUE = "#1a73e8";
const DOCS_BLUE_BG = "#e8f0fe";

function ToolbarButton({
  onMouseDown,
  active,
  disabled,
  title,
  children,
}: {
  onMouseDown: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? "bg-[#e8f0fe] text-[#1a73e8]"
          : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0" />;
}

export default function TextEditor({
  initialValue = {},
  onChange,
}: EditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [pendingFontSize, setPendingFontSize] = useState<number>(16);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showImageWindow, setShowImageWindow] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const headingRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const presetHighlights = [
    { color: "#fff59d", label: "Yellow" },
    { color: "#ffcc80", label: "Orange" },
    { color: "#80deea", label: "Cyan" },
    { color: "#a5d6a7", label: "Green" },
    { color: "#f48fb1", label: "Pink" },
    { color: "#b39ddb", label: "Purple" },
    { color: "#ffffff", label: "None" },
  ];

  const presetSizes = [8, 10, 12, 14, 16, 18, 24, 32, 48, 60, 72, 96];
  const alignOptions = [
    { value: "left", label: "Left", icon: TextAlignStart },
    { value: "center", label: "Center", icon: TextAlignCenter },
    { value: "right", label: "Right", icon: TextAlignEnd },
    { value: "justify", label: "Justify", icon: TextAlignJustify },
  ];

  const defaultDoc = {
    type: "doc",
    content: [
      { type: "articleTitle" },
      { type: "headMedia" },
      { type: "articleDescription" },
      { type: "paragraph" },
    ],
  };

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;

    const refs = [headingRef, colorRef, fontSizeRef, alignRef, highlightRef];

    const isClickInsideAny = refs.some((ref) => ref.current?.contains(target));

    if (!isClickInsideAny) {
      setShowHeadingMenu(false);
      setShowColorPicker(false);
      setShowFontSizeDropdown(false);
      setShowAlignDropdown(false);
      setShowHighlightDropdown(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  // Give the toolbar a subtle elevation once the page has scrolled under it,
  // the same way Docs' toolbar picks up a hairline shadow.
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const editor = useEditor({
    extensions: [
      ArticleTitle,
      HeadMedia,
      ArticleDescription,
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc ml-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal ml-5" } },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "articleTitle") return "Untitled document";
          if (node.type.name === "articleDescription")
            return "Add a description\u2026";
          return "Start typing like in Google Docs\u2026";
        },
        showOnlyCurrent: false,
        includeChildren: true,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0",
      }),
      Color.configure({ types: ["textStyle"] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      FontSize,
      MediaBlock,
      Image,
      Highlight,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: defaultDoc,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "docs-page-content prose prose-lg max-w-none focus:outline-none min-h-[1000px] px-12 sm:px-24 py-16",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const size = Number(editor.getAttributes("textStyle").fontSize) || 16;
      setFontSize(size);
      setPendingFontSize(size);
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const currentColor = editor?.getAttributes("textStyle").color || "#000000";
  const currentHighlight =
    editor?.getAttributes("textStyle").backgroundColor || null;

  const getCurrentBlockLabel = () => {
    if (editor?.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor?.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor?.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor?.isActive("blockquote")) return "Quote";
    return "Normal text";
  };

  const setSize = (size: number) => {
    editor?.chain().focus().setFontSize(String(size)).run();
  };

  const commitFontSize = () => {
    let value = Number(pendingFontSize);
    if (isNaN(value) || value < 8) value = 8;
    if (value > 96) value = 96;
    setSize(value);
    setFontSize(value);
    setPendingFontSize(value);
  };

  if (!editor) return null;

  return (
    <div className="docs-editor min-h-screen bg-[#f8f9fa]">
      {/* Scoped CSS: renders per-node placeholders (title, description, body)
          the way Google Docs shows "Untitled document" in light grey. */}
      <style>{`
        .docs-editor .ProseMirror [data-placeholder]::before {
          content: attr(data-placeholder);
          color: #9aa0a6;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .docs-editor .ProseMirror {
          caret-color: ${DOCS_BLUE};
        }
        .docs-editor .ProseMirror h1[data-title] {
          margin-top: 0;
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* Toolbar                                                        */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`sticky top-0 z-300 bg-white border-b transition-shadow ${
          isScrolled
            ? "border-gray-200 shadow-[0_1px_2px_rgba(60,64,67,0.15)]"
            : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-0.5 px-3 py-1.5 max-w-[1000px] mx-auto overflow-x-auto">
          {/* Undo / redo */}
          <ToolbarButton
            title="Undo"
            onMouseDown={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            onMouseDown={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo size={18} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block type */}
          <div className="relative" ref={headingRef}>
            <button
              type="button"
              onMouseDown={() => setShowHeadingMenu((prev) => !prev)}
              className="flex items-center gap-1 h-8 px-3 rounded-md text-sm text-gray-700 hover:bg-gray-100 min-w-[130px] justify-between"
            >
              <span>{getCurrentBlockLabel()}</span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>

            {showHeadingMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-56 py-1 overflow-hidden">
                <button
                  type="button"
                  onMouseDown={() => {
                    editor.chain().focus().setParagraph().run();
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    editor.isActive("paragraph") ? "bg-[#e8f0fe] text-[#1a73e8]" : ""
                  }`}
                >
                  Normal text
                </button>
                <button
                  type="button"
                  onMouseDown={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 font-bold text-lg ${
                    editor.isActive("heading", { level: 1 })
                      ? "bg-[#e8f0fe] text-[#1a73e8]"
                      : ""
                  }`}
                >
                  Heading 1
                </button>
                <button
                  type="button"
                  onMouseDown={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold text-base ${
                    editor.isActive("heading", { level: 2 })
                      ? "bg-[#e8f0fe] text-[#1a73e8]"
                      : ""
                  }`}
                >
                  Heading 2
                </button>
                <button
                  type="button"
                  onMouseDown={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 font-medium ${
                    editor.isActive("heading", { level: 3 })
                      ? "bg-[#e8f0fe] text-[#1a73e8]"
                      : ""
                  }`}
                >
                  Heading 3
                </button>
                <div className="h-px bg-gray-200 my-1" />
                <button
                  type="button"
                  onMouseDown={() => {
                    editor.chain().focus().toggleBlockquote().run();
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm italic hover:bg-gray-100 ${
                    editor.isActive("blockquote") ? "bg-[#e8f0fe] text-[#1a73e8]" : ""
                  }`}
                >
                  Quote
                </button>
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Font family */}
          <select
            value={editor.getAttributes("textStyle").fontFamily || "sans-serif"}
            onChange={(e) =>
              editor.chain().focus().setFontFamily(e.target.value).run()
            }
            className="h-8 px-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer max-w-[140px]"
          >
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="'Georgia', serif">Georgia</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
          </select>

          <div className="w-2" />

          {/* Font size */}
          <div className="relative flex items-center" ref={fontSizeRef}>
            <input
              type="number"
              value={pendingFontSize}
              onChange={(e) => setPendingFontSize(Number(e.target.value))}
              onFocus={() => setShowFontSizeDropdown(true)}
              onBlur={commitFontSize}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                  setShowFontSizeDropdown(false);
                }
              }}
              className="w-12 h-8 text-center text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
              min={8}
              max={96}
            />

            {showFontSizeDropdown && (
              <div className="absolute top-full left-0 mt-1 w-16 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {presetSizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                      fontSize === size ? "bg-[#e8f0fe] text-[#1a73e8]" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSize(size);
                      setFontSize(size);
                      setPendingFontSize(size);
                      setShowFontSizeDropdown(false);
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Bold / italic / underline */}
          <ToolbarButton
            title="Bold (Ctrl+B)"
            active={editor.isActive("bold")}
            onMouseDown={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Italic (Ctrl+I)"
            active={editor.isActive("italic")}
            onMouseDown={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Underline (Ctrl+U)"
            active={editor.isActive("underline")}
            onMouseDown={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon size={18} />
          </ToolbarButton>

          {/* Text color */}
          <div className="relative" ref={colorRef}>
            <button
              type="button"
              onMouseDown={() => setShowColorPicker((prev) => !prev)}
              className="flex flex-col items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100"
              title="Text color"
            >
              <Baseline size={16} />
              <span
                className="w-4 h-1 rounded-sm mt-0.5"
                style={{ backgroundColor: currentColor }}
              />
            </button>

            {showColorPicker && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-56">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    editor.chain().focus().setColor(e.target.value).run();
                  }}
                  className="w-full h-9 cursor-pointer border-none rounded"
                />
                <div className="grid grid-cols-8 gap-1.5 mt-3">
                  {[
                    "#000000",
                    "#434343",
                    "#dc2626",
                    "#16a34a",
                    "#2563eb",
                    "#ca8a04",
                    "#9333ea",
                    "#ea580c",
                  ].map((color) => (
                    <button
                      type="button"
                      key={color}
                      onMouseDown={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onMouseDown={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                  className="mt-3 w-full text-sm text-left px-2 py-1.5 hover:bg-gray-100 rounded"
                >
                  Reset color
                </button>
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="relative" ref={highlightRef}>
            <button
              type="button"
              onMouseDown={() => setShowHighlightDropdown((prev) => !prev)}
              className="flex flex-col items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100"
              title="Highlight color"
            >
              <Highlighter size={16} />
              <span
                className="w-4 h-1 rounded-sm mt-0.5 border border-gray-300"
                style={{ backgroundColor: currentHighlight || "transparent" }}
              />
            </button>

            {showHighlightDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 grid grid-cols-4 gap-2 w-44">
                {presetHighlights.map(({ color, label }) => (
                  <button
                    type="button"
                    key={color}
                    title={label}
                    style={{ backgroundColor: color }}
                    className="w-7 h-7 rounded-md border border-gray-300 hover:scale-110 transition-transform"
                    onMouseDown={() => {
                      if (color === "#ffffff") {
                        editor.chain().focus().unsetTextHighlight().run();
                      } else {
                        editor.chain().focus().setTextHighlight(color).run();
                      }
                      setShowHighlightDropdown(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Quote / link / image */}
          <ToolbarButton
            title="Quote"
            active={editor.isActive("blockquote")}
            onMouseDown={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Insert link"
            active={editor.isActive("link")}
            onMouseDown={() => {
              const url = window.prompt("Enter link URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          >
            <LinkIcon size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Insert image"
            onMouseDown={() => setShowImageWindow(true)}
          >
            <ImagePlus size={18} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <div className="relative" ref={alignRef}>
            <button
              type="button"
              onMouseDown={() => setShowAlignDropdown((prev) => !prev)}
              className="flex items-center gap-0.5 px-1.5 rounded-md hover:bg-gray-100"
              title="Align"
            >
              {(() => {
                const Icon = alignOptions.find(
                  (opt) =>
                    opt.value ===
                    (editor.getAttributes("paragraph").textAlign || "left"),
                )?.icon;
                return Icon ? <Icon size={18} /> : null;
              })()}
              <ChevronDown size={14} className="text-gray-500" />
            </button>

            {showAlignDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 w-40">
                {alignOptions.map((opt) => {
                  const Icon = opt.icon;
                  const currentAlign =
                    editor.getAttributes("paragraph").textAlign || "left";
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      className={`flex items-center gap-3 px-3 py-1.5 w-full text-left text-sm hover:bg-gray-100 ${
                        currentAlign === opt.value
                          ? "bg-[#e8f0fe] text-[#1a73e8]"
                          : "text-gray-700"
                      }`}
                      onMouseDown={() => {
                        editor.chain().focus().setTextAlign(opt.value).run();
                        setShowAlignDropdown(false);
                      }}
                    >
                      <Icon size={16} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lists */}
          <ToolbarButton
            title="Bulleted list"
            active={editor.isActive("bulletList")}
            onMouseDown={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onMouseDown={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={18} />
          </ToolbarButton>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Page canvas                                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex justify-center px-4 py-10 z-0">
        <div
          className="relative bg-white w-full max-w-[816px] min-h-[1056px] rounded-sm"
          style={{
            boxShadow:
              "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
          }}
        >
          <div className="flex border-b">
            <div className="flex flex-col">
              <div>title</div>
              <div>ddddd</div>
            </div>
            <div>image</div>
          </div>
          <EditorContent editor={editor} />

          <BubbleMenu editor={editor}>
            <div className="flex items-center bg-white text-gray-700 rounded-lg shadow-lg border border-gray-200 p-1 gap-0.5">
              <ToolbarButton
                title="Bold"
                active={editor.isActive("bold")}
                onMouseDown={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold size={16} />
              </ToolbarButton>
              <ToolbarButton
                title="Italic"
                active={editor.isActive("italic")}
                onMouseDown={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic size={16} />
              </ToolbarButton>
              <ToolbarButton
                title="Underline"
                active={editor.isActive("underline")}
                onMouseDown={() => editor.chain().focus().toggleUnderline().run()}
              >
                <UnderLineIcon size={16} />
              </ToolbarButton>
            </div>
          </BubbleMenu>

          <FloatingMenu editor={editor}>
            <div className="flex items-center bg-white text-gray-700 rounded-lg shadow-lg border border-gray-200 p-1 gap-0.5 ml-2">
              <ToolbarButton
                title="Heading 1"
                onMouseDown={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                <span className="text-sm font-semibold">H1</span>
              </ToolbarButton>
              <ToolbarButton
                title="Heading 2"
                onMouseDown={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                <span className="text-sm font-semibold">H2</span>
              </ToolbarButton>
              <ToolbarButton
                title="Bulleted list"
                onMouseDown={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List size={16} />
              </ToolbarButton>
              <ToolbarButton
                title="Numbered list"
                onMouseDown={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered size={16} />
              </ToolbarButton>
            </div>
          </FloatingMenu>
        </div>
      </div>

      {showImageWindow && (
        <MediaWindow editor={editor} onClose={() => setShowImageWindow(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Insert media dialog
// ---------------------------------------------------------------------------

type Props = {
  editor: any;
  onClose: () => void;
};

export function MediaWindow({ editor, onClose }: Props) {
  const [tab, setTab] = useState<"image" | "video" | "embed">("image");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<string[]>([]);

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      try {
        const mediaFiles = await getMedia();
        setMedia(mediaFiles.files.map((file) => file));
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
                tab === t
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* URL input */}
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700">
              External URL
            </label>
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
              <label className="text-sm font-medium text-gray-700">
                Media library
              </label>
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