import {
  Bold,
  Italic,
  Underline as UnderLineIcon,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  ImagePlus,
  Link as LinkIcon,
  TextAlignStart,
  TextAlignEnd,
  TextAlignCenter,
  TextAlignJustify,
  ChevronDown,
  Baseline,
  ImageIcon,
  Video,
  Code,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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


// ---------------------------------------------------------------------------
// Toolbar Primitives
// ---------------------------------------------------------------------------
export function ToolbarButton({
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

// ---------------------------------------------------------------------------
export function BlockTypeSelector({ editor, showHeadingMenu, setShowHeadingMenu, headingRef }: any) {
  const getCurrentBlockLabel = () => {
    if (editor?.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor?.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor?.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor?.isActive("blockquote")) return "Quote";
    return "Normal text";
  };

  return (
    <div className="relative" ref={headingRef}>
      <button
        type="button"
        onMouseDown={() => setShowHeadingMenu((prev: boolean) => !prev)}
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
              editor.isActive("heading", { level: 1 }) ? "bg-[#e8f0fe] text-[#1a73e8]" : ""
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
              editor.isActive("heading", { level: 2 }) ? "bg-[#e8f0fe] text-[#1a73e8]" : ""
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
              editor.isActive("heading", { level: 3 }) ? "bg-[#e8f0fe] text-[#1a73e8]" : ""
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
  );
}

export function FontControls({ editor, fontSize, pendingFontSize, setPendingFontSize, showFontSizeDropdown, setShowFontSizeDropdown, fontSizeRef, setSize, commitFontSize }: any) {
  return (
    <>
      {/* Font Family */}
      <select
        value={editor.getAttributes("textStyle").fontFamily || "sans-serif"}
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
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

      {/* Font Size */}
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
                  setShowFontSizeDropdown(false);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function TextFormattingControls({ editor, currentColor, showColorPicker, setShowColorPicker, colorRef, currentHighlight, showHighlightDropdown, setShowHighlightDropdown, highlightRef }: any) {
  return (
    <>
      {/* Bold / Italic / Underline */}
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
        <UnderLineIcon size={18} />
      </ToolbarButton>

      {/* Text Color */}
      <div className="relative" ref={colorRef}>
        <button
          type="button"
          onMouseDown={() => setShowColorPicker((prev: boolean) => !prev)}
          className="flex flex-col items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100"
          title="Text color"
        >
          <Baseline size={16} />
          <span className="w-4 h-1 rounded-sm mt-0.5" style={{ backgroundColor: currentColor }} />
        </button>
        {showColorPicker && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-56">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="w-full h-9 cursor-pointer border-none rounded"
            />
            <div className="grid grid-cols-8 gap-1.5 mt-3">
              {["#000000", "#434343", "#dc2626", "#16a34a", "#2563eb", "#ca8a04", "#9333ea", "#ea580c"].map((color) => (
                <button
                  key={color}
                  type="button"
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
          onMouseDown={() => setShowHighlightDropdown((prev: boolean) => !prev)}
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
    </>
  );
}

type MediaType = "image" | "video" | "embed";

interface InsertControlsProps {
  editor: any;
  setShowImageWindow: (type: MediaType) => void;
}

export function InsertControls({ editor, setShowImageWindow }: InsertControlsProps) {
  const [showMediaDropdown, setShowMediaDropdown] = useState(false);
  const mediaDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mediaDropdownRef.current &&
        !mediaDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMediaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMedia = (type: MediaType) => {
    setShowMediaDropdown(false);
    setShowImageWindow(type);
  };

  return (
    <div className="flex items-center gap-0.5">
      {/* Blockquote */}
      <ToolbarButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onMouseDown={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={18} />
      </ToolbarButton>

      {/* Link */}
      <ToolbarButton
        title="Insert link"
        active={editor.isActive("link")}
        onMouseDown={() => {
          const url = window.prompt("Enter link URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        <LinkIcon size={18} />
      </ToolbarButton>

      {/* Media Dropdown Trigger */}
      <div className="relative" ref={mediaDropdownRef}>
        <button
          type="button"
          title="Insert media"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowMediaDropdown((prev) => !prev);
          }}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-gray-700 hover:bg-gray-100 transition-colors ${
            showMediaDropdown ? "bg-gray-100" : ""
          }`}
        >
          <ImageIcon size={18} />
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        {/* Media Type Dropdown Menu */}
        {showMediaDropdown && (
          <div className="absolute left-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectMedia("image");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left transition-colors"
            >
              <ImageIcon size={15} />
              <span>Image</span>
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectMedia("video");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left transition-colors"
            >
              <Video size={15} />
              <span>Video</span>
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectMedia("embed");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left transition-colors"
            >
              <Code size={15} />
              <span>Embed</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AlignmentAndListControls({ editor, showAlignDropdown, setShowAlignDropdown, alignRef }: any) {
  return (
    <>
      {/* Alignment */}
      <div className="relative" ref={alignRef}>
        <button
          type="button"
          onMouseDown={() => setShowAlignDropdown((prev: boolean) => !prev)}
          className="flex items-center gap-0.5 px-1.5 rounded-md hover:bg-gray-100"
          title="Align"
        >
          {(() => {
            const currentAlign = editor.getAttributes("paragraph").textAlign || "left";
            const Icon = alignOptions.find((opt: any) => opt.value === currentAlign)?.icon;
            return Icon ? <Icon size={18} /> : null;
          })()}
          <ChevronDown size={14} className="text-gray-500" />
        </button>
        {showAlignDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 w-40">
            {alignOptions.map((opt: any) => {
              const Icon = opt.icon;
              const currentAlign = editor.getAttributes("paragraph").textAlign || "left";
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`flex items-center gap-3 px-3 py-1.5 w-full text-left text-sm hover:bg-gray-100 ${
                    currentAlign === opt.value ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-gray-700"
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
    </>
  );
}