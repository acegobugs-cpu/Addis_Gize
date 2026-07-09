// components/editor/Canvas.tsx
import { EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import { ToolbarButton } from "./tools";
import { Bold, Italic, List, ListOrdered, UnderlineIcon } from "lucide-react";
import { MediaWindow } from "./editorMedia";

interface CanvasProps {
  editor: any;
  showImageWindow: boolean;
  setShowImageWindow: (val: boolean) => void;
}

export default function Canvas({ editor, showImageWindow, setShowImageWindow }: CanvasProps) {
  return (
    <div className="flex justify-center px-4 py-10">
      <div
        className="relative bg-white w-full max-w-[816px] min-h-[1200px] rounded-sm overflow-hidden"
        style={{
          boxShadow: "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
        }}
      >
        <EditorContent editor={editor} />

        {/* Bubble and Floating Menus */}
        <BubbleMenu editor={editor}>
          <div className="flex items-center bg-white text-gray-700 rounded-lg shadow-lg border border-gray-200 p-1 gap-0.5">
            <ToolbarButton title="Bold" active={editor.isActive("bold")} onMouseDown={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton title="Italic" active={editor.isActive("italic")} onMouseDown={() => editor.chain().focus().toggleItalic().run()}>
              <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton title="Underline" active={editor.isActive("underline")} onMouseDown={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon size={16} />
            </ToolbarButton>
          </div>
        </BubbleMenu>

        <FloatingMenu editor={editor}>
          <div className="flex items-center bg-white text-gray-700 rounded-lg shadow-lg border border-gray-200 p-1 gap-0.5 ml-2">
            <ToolbarButton title="Heading 1" onMouseDown={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <span className="text-sm font-semibold">H1</span>
            </ToolbarButton>
            <ToolbarButton title="Heading 2" onMouseDown={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <span className="text-sm font-semibold">H2</span>
            </ToolbarButton>
            <ToolbarButton title="Bulleted list" onMouseDown={() => editor.chain().focus().toggleBulletList().run()}>
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton title="Numbered list" onMouseDown={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={16} />
            </ToolbarButton>
          </div>
        </FloatingMenu>
      </div>

      {showImageWindow && <MediaWindow editor={editor} onClose={() => setShowImageWindow(false)} />}
    </div>
  );
}