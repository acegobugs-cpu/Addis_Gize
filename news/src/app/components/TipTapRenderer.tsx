'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import {TextStyle} from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';

// Import extensions and custom schema nodes from your editor file
import {
  FontSize,
  Highlight,
  EmbedNode,
  VideoNode,
  ImageNode,
} from './editorExtentions'; // Update this import path to match your file structure

interface TipTapRendererProps {
  content: any; // Accepts JSON object or HTML string
}

export default function TipTapRenderer({ content }: TipTapRendererProps) {
  const editor = useEditor({
    content,
    editable: false, // Read-only mode
    immediatelyRender: false,
    injectCSS: false,
    extensions: [
      // 2. Base Formatting
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc ml-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal ml-5" } },
      }),
      Underline,
      Link.configure({ openOnClick: false }),

      // 3. Typography & Styling
      TextStyle,
      FontFamily,
      Color.configure({ types: ['textStyle'] }),
      FontSize,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),

      // 4. Custom Media Node Handling (Matches Editor Output)
      ImageNode,
      VideoNode,
      EmbedNode,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none text-gray-800 focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="article-rendered-content w-full">
      {/* Scope custom CSS rules for specific schema attributes */}
      <style>{`
        .article-rendered-content h1.article-title {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.25;
          margin-bottom: 0.75rem;
        }
        .article-rendered-content p.article-description {
          font-size: 1.25rem;
          color: #4b5563;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .article-rendered-content figure[data-media] {
          margin: 2rem 0;
        }
        .article-rendered-content figure[data-media] img,
        .article-rendered-content figure[data-media] video,
        .article-rendered-content figure[data-media] iframe {
          border-radius: 0.5rem;
          max-width: 100%;
          height: auto;
          margin: 0 auto;
        }
        .article-rendered-content figcaption {
          text-align: center;
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }
        .article-rendered-content .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}