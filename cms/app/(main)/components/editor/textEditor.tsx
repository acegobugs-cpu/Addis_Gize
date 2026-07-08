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
  MediaBlock,
  FontSize,
  Highlight,
  ArticleTitle,
  ArticleDescription,
  HeadMedia,
} from "./editorExtentions";

import Toolbar from "./toolBar";
import Canvas from "./canvas";

interface EditorProps {
  initialValue?: any;
  onChange?: (json: any) => void;
}

export interface TextEditorRef {
  getTitle: () => any;
  getDescription: () => any;     // Will contain media + text
  getBody: () => any;            // Main content only
  getContent: () => any;         // Full JSON
  editor: any;
}

const defaultDoc = {
  type: "doc",
  content: [
    { type: "articleTitle" },
    { type: "articleDescription" },   // Will include media
    { type: "paragraph" },            // Start of body
  ],
};

const TextEditor = forwardRef<TextEditorRef, EditorProps>(({ initialValue, onChange }, ref) => {
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
          if (node.type.name === "articleTitle") return "Enter article title...";
          if (node.type.name === "articleDescription") return "Write description and add media...";
          return "Start writing the main article content...";
        },
        showOnlyCurrent: false,
        includeChildren: true,
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
      Link.configure({ openOnClick: false }),
    ],
    content: defaultDoc,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "docs-page-content prose prose-lg max-w-none focus:outline-none min-h-[1000px] px-12 sm:px-24 py-16",
      },
    },
  });

// ====================== HELPER METHODS ======================
const getTitle = () => {
  const json = editor?.getJSON();
  const node = json?.content?.find((n: any) => n.type === "articleTitle");
  
  return {
    type: "articleTitle",
    content: node?.content || [],
    // You can add more metadata if needed
  };
};

const getDescription = () => {
  const json = editor?.getJSON();
  const node = json?.content?.find((n: any) => n.type === "articleDescription");
  
  return {
    type: "articleDescription",
    content: node?.content || [],
    attrs: node?.attrs || {},           // for media, alignment, etc.
  };
};

const getBody = () => {
  const json = editor?.getJSON();
  return {
    type: "doc",
    content: json?.content?.filter((node: any) => 
      !["articleTitle", "articleDescription"].includes(node.type)
    ) || [],
  };
};

const getContent = () => editor?.getJSON(); // Full document

  useImperativeHandle(ref, () => ({
    getTitle,
    getDescription,
    getBody,
    getContent,
    editor,
  }));

  // Sync font size
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

  useEffect(() => {
  if (!editor) return;

  const preventDuplicates = () => {
    const json = editor.getJSON();
    const titles = json.content?.filter((n: any) => n.type === "articleTitle") || [];
    const descriptions = json.content?.filter((n: any) => n.type === "articleDescription") || [];

    if (titles.length > 1) {
      editor.commands.deleteNode("articleTitle");
    }
    if (descriptions.length > 1) {
      editor.commands.deleteNode("articleDescription");
    }
  };

  editor.on("update", preventDuplicates);

  return () => {
    editor.off("update", preventDuplicates);
  };
}, [editor]);


  if (!editor) return null;

  return (
    <div className="docs-editor min-h-screen bg-[#f8f9fa]">
      <style>{`
        .docs-editor .ProseMirror {
          padding: 40px 48px;
          caret-color: #1a73e8;
        }
        .docs-editor .ProseMirror h1[data-type="article-title"] {
          font-size: 2.75rem;
          font-weight: 800;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 3px solid #e5e7eb;
        }
        .docs-editor .ProseMirror [data-type="article-description"] {
          font-size: 1.2rem;
          line-height: 1.7;
          color: #374151;
          margin-bottom: 2.5rem;
          padding: 1.5rem;
          border: 2px dashed #9ca3af;
          border-radius: 12px;
          background: #f9fafb;
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
        setShowImageWindow={setShowImageWindow}
      />
      <Canvas
        editor={editor}
        showImageWindow={showImageWindow}
        setShowImageWindow={setShowImageWindow}
      />
    </div>
  );
});

TextEditor.displayName = "TextEditor";
export default TextEditor;