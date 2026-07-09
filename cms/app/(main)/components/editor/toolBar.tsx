// ---------------------------------------------------------------------------
// Main Toolbar

import { Redo, Undo } from "lucide-react";
import { AlignmentAndListControls, BlockTypeSelector, FontControls, InsertControls, TextFormattingControls, ToolbarButton } from "./tools";

// ---------------------------------------------------------------------------
export default function Toolbar({
  editor,
  isScrolled,
  showHeadingMenu,
  setShowHeadingMenu,
  headingRef,
  fontSize,
  pendingFontSize,
  setPendingFontSize,
  showFontSizeDropdown,
  setShowFontSizeDropdown,
  fontSizeRef,
  setSize,
  commitFontSize,
  currentColor,
  showColorPicker,
  setShowColorPicker,
  colorRef,
  currentHighlight,
  showHighlightDropdown,
  setShowHighlightDropdown,
  highlightRef,
  showAlignDropdown,
  setShowAlignDropdown,
  alignRef,
  setShowImageWindow,
}: any) {
  return (
    <div
      className={`bg-white border-b transition-shadow ${
        isScrolled ? "border-gray-200 shadow-[0_1px_2px_rgba(60,64,67,0.15)]" : "border-gray-100"
      }`}
    >
      <div className="flex items-center gap-0.5 px-3 py-1.5 max-w-[1000px] mx-auto">
        {/* Undo / Redo */}
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

        {/* Block Type */}
        <BlockTypeSelector
          editor={editor}
          showHeadingMenu={showHeadingMenu}
          setShowHeadingMenu={setShowHeadingMenu}
          headingRef={headingRef}
        />

        <ToolbarDivider />

        {/* Font Controls */}
        <FontControls
          editor={editor}
          fontSize={fontSize}
          pendingFontSize={pendingFontSize}
          setPendingFontSize={setPendingFontSize}
          showFontSizeDropdown={showFontSizeDropdown}
          setShowFontSizeDropdown={setShowFontSizeDropdown}
          fontSizeRef={fontSizeRef}
          setSize={setSize}
          commitFontSize={commitFontSize}
        />

        <ToolbarDivider />

        {/* Text Formatting */}
        <TextFormattingControls
          editor={editor}
          currentColor={currentColor}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          colorRef={colorRef}
          currentHighlight={currentHighlight}
          showHighlightDropdown={showHighlightDropdown}
          setShowHighlightDropdown={setShowHighlightDropdown}
          highlightRef={highlightRef}
        />

        <ToolbarDivider />

        {/* Insert Controls */}
        <InsertControls editor={editor} setShowImageWindow={setShowImageWindow} />

        <ToolbarDivider />

        {/* Alignment & Lists */}
        <AlignmentAndListControls
          editor={editor}
          showAlignDropdown={showAlignDropdown}
          setShowAlignDropdown={setShowAlignDropdown}
          alignRef={alignRef}
        />
      </div>
    </div>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-300 mx-1.5 shrink-0" />;
}