"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

import {
  ImageNode,
  VideoNode,
  EmbedNode,
  FontSize,
  Highlight,
} from "./editorExtentions";

import Toolbar from "./toolBar";
import Canvas from "./canvas";

export type ActiveMediaType = "image" | "video" | "embed" | null;

export interface EditorProps {
  initialValue?: any;
  onChange?: (json: any) => void;
}

export interface TextEditorRef {
  getContent: () => any;
  editor: any;
}

const TextEditor = forwardRef<TextEditorRef, EditorProps>(({ initialValue, onChange }, ref) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [pendingFontSize, setPendingFontSize] = useState<number>(16);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Tracks active modal type: "image" | "video" | "embed" | null
  const [activeMediaModal, setActiveMediaModal] = useState<ActiveMediaType>(null);

  const headingRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc ml-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal ml-5" } },
      }),
      Placeholder.configure({
        placeholder: "Start writing the main article content here...",
      }),
      Color.configure({ types: ["textStyle"] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      FontSize,
      ImageNode,
      VideoNode,
      EmbedNode,
      Image,
      Highlight,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: initialValue || {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "docs-page-content prose prose-lg max-w-none focus:outline-none min-h-[800px] px-12 sm:px-24 py-16",
      },
    },
  });

  const getContent = () => editor?.getJSON();

  useImperativeHandle(ref, () => ({
    getContent,
    editor,
  }));

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
  const currentHighlight = editor?.getAttributes("textStyle").backgroundColor || null;

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
      <style>{`
        .docs-editor .ProseMirror {
          padding: 40px 48px;
          caret-color: #1a73e8;
        }
      `}</style>

      <Toolbar
        editor={editor}
        isScrolled={isScrolled}
        showHeadingMenu={showHeadingMenu}
        setShowHeadingMenu={setShowHeadingMenu}
        headingRef={headingRef}
        fontSize={fontSize}
        pendingFontSize={pendingFontSize}
        setPendingFontSize={setPendingFontSize}
        showFontSizeDropdown={showFontSizeDropdown}
        setShowFontSizeDropdown={setShowFontSizeDropdown}
        fontSizeRef={fontSizeRef}
        setSize={setSize}
        commitFontSize={commitFontSize}
        currentColor={currentColor}
        showColorPicker={showColorPicker}
        setShowColorPicker={setShowColorPicker}
        colorRef={colorRef}
        currentHighlight={currentHighlight}
        showHighlightDropdown={showHighlightDropdown}
        setShowHighlightDropdown={setShowHighlightDropdown}
        highlightRef={highlightRef}
        showAlignDropdown={showAlignDropdown}
        setShowAlignDropdown={setShowAlignDropdown}
        alignRef={alignRef}
        setShowImageWindow={(type: ActiveMediaType) => setActiveMediaModal(type)}
      />

      <Canvas
        editor={editor}
        activeMediaModal={activeMediaModal}
        onCloseMediaModal={() => setActiveMediaModal(null)}
      />
    </div>
  );
});

TextEditor.displayName = "TextEditor";
export default TextEditor;