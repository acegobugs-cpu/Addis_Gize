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
  ArticleDocument,
  ArticleTitle,
  ArticleDescription,
  SectionNavigation,
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
  getDescription: () => any;     // Subtitle / summary text only
  getBody: () => any;            // Main content only
  getContent: () => any;         // Full JSON
  editor: any;
}

const defaultDoc = {
  type: "doc",
  content: [
    { type: "articleTitle" },
    { type: "articleDescription" },
    { type: "paragraph" }, // start of body - media can be inserted here via the toolbar
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
      ArticleDocument,
      ArticleTitle,
      ArticleDescription,
      SectionNavigation,
      HeadMedia,
      StarterKit.configure({
        // We bring our own top node (ArticleDocument) so the built-in
        // one must be disabled, or Tiptap will complain about two
        // extensions named "doc".
        document: false,
        // Without this, the Trailing Node extension would fall back to
        // guessing a default trailing node type from the schema - and
        // since articleTitle is the first node in our content
        // expression, it could wrongly pick that. Pin it to paragraph.
        trailingNode: { node: "paragraph" },
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc ml-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal ml-5" } },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "articleTitle") return "Enter article title...";
          if (node.type.name === "articleDescription") return "Write a short description...";
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

  // NOTE: there's intentionally no reactive "delete duplicate title/description"
  // effect here anymore. That approach could only ever react *after* an invalid
  // state briefly existed (causing flicker, and it only removed one extra node
  // per update). Duplication is now impossible by construction: ArticleDocument's
  // content expression is "articleTitle articleDescription block+", and neither
  // node belongs to the "block" group, so the schema itself rejects any attempt
  // to insert, paste, or convert a second title/description anywhere in the doc.

  if (!editor) return null;

  return (
    <div className="docs-editor min-h-screen bg-[#f8f9fa]">
      <style>{`
        .docs-editor .ProseMirror {
          padding: 40px 48px;
          caret-color: #1a73e8;
        }
        .docs-editor .ProseMirror h1[data-type="article-title"] {
          font-size: 2.5rem;
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #202124;
          margin: 0 0 0.5rem;
        }
        .docs-editor .ProseMirror p[data-type="article-description"] {
          font-size: 1.25rem;
          line-height: 1.5;
          font-weight: 400;
          color: #5f6368;
          margin: 0 0 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e8eaed;
        }
        .docs-editor .ProseMirror h1[data-type="article-title"].is-empty::before,
        .docs-editor .ProseMirror p[data-type="article-description"].is-empty::before {
          color: #9aa0a6;
          font-weight: 400;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
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