import { Extension, Node, mergeAttributes } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import { TextSelection } from "prosemirror-state";

// =============================================
// DOCUMENT SCHEMA - FORCED CONTENT STRUCTURE
// =============================================
// This is Tiptap's own "forced content structure" pattern
// (https://tiptap.dev/docs/examples/advanced/forced-content-structure):
// the top node's `content` expression is what actually guarantees
// "always exactly one title, then exactly one description, then the
// body" - not a runtime check. articleTitle/articleDescription are
// intentionally NOT part of the "block" group, so they can never be
// matched by the body's `block+` slot, inserted mid-document, pasted
// in twice, or converted into from the block-type dropdown.
export const ArticleDocument = Document.extend({
  content: "articleTitle articleDescription block+",
});

// Shared helper: since the schema above guarantees the doc always
// starts with exactly [articleTitle, articleDescription, ...body],
// we can compute every section boundary directly instead of
// searching for nodes.
export function getSectionPositions(doc: any) {
  const title = doc.child(0);
  const description = doc.child(1);
  const titleSize = title.nodeSize;
  const descriptionSize = description.nodeSize;

  return {
    titleContentStart: 1,
    titleContentEnd: titleSize - 1,
    descriptionContentStart: titleSize + 1,
    descriptionContentEnd: titleSize + descriptionSize - 1,
    bodyStart: titleSize + descriptionSize, // position just before the first body block
  };
}

// =============================================
// ARTICLE TITLE - SINGLE INSTANCE, ALWAYS FIRST
// =============================================
export const ArticleTitle = Node.create({
  name: "articleTitle",
  content: "inline*",
  defining: true,
  isolating: true, // fences backspace/join operations at its boundary

  parseHTML() {
    return [{ tag: 'h1[data-type="article-title"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "h1",
      mergeAttributes(HTMLAttributes, {
        "data-type": "article-title",
        class: "article-title",
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Enter moves down into the description instead of splitting
      // the title into two nodes (which the schema would reject anyway).
      // Shift-Enter still inserts a hard break inside the title, via
      // HardBreak's own default shortcut - we only handle plain Enter.
      Enter: () => {
        const editor = this.editor;
        const { $from } = editor.state.selection;
        if ($from.parent.type.name !== this.name) return false;

        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (!dispatch) return true;
            if (!tr.selection.empty) tr.deleteSelection();
            const { descriptionContentStart } = getSectionPositions(tr.doc);
            const pos = Math.min(descriptionContentStart, tr.doc.content.size);
            tr.setSelection(TextSelection.near(tr.doc.resolve(pos)));
            tr.scrollIntoView();
            return true;
          })
          .run();

        return true;
      },
    };
  },
});

// =============================================
// ARTICLE DESCRIPTION - SINGLE INSTANCE, ALWAYS SECOND
// =============================================
export const ArticleDescription = Node.create({
  name: "articleDescription",
  content: "block*",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'p[data-type="article-description"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      mergeAttributes(HTMLAttributes, {
        "data-type": "article-description",
        class: "article-description",
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Enter moves down into the body's first block.
      Enter: () => {
        const editor = this.editor;
        const { $from } = editor.state.selection;
        if ($from.parent.type.name !== this.name) return false;

        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (!dispatch) return true;
            if (!tr.selection.empty) tr.deleteSelection();
            const { bodyStart } = getSectionPositions(tr.doc);
            const pos = Math.min(bodyStart + 1, tr.doc.content.size);
            tr.setSelection(TextSelection.near(tr.doc.resolve(pos)));
            tr.scrollIntoView();
            return true;
          })
          .run();

        return true;
      },
      // Backspace at the very start moves the cursor back into the
      // title instead of trying (and failing) to merge two different
      // node types together.
      Backspace: () => {
        const editor = this.editor;
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type.name !== this.name) return false;
        if ($from.parentOffset !== 0) return false;

        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (!dispatch) return true;
            const { titleContentEnd } = getSectionPositions(tr.doc);
            tr.setSelection(TextSelection.near(tr.doc.resolve(titleContentEnd)));
            tr.scrollIntoView();
            return true;
          })
          .run();

        return true;
      },
    };
  },
});

// =============================================
// SECTION NAVIGATION - handles the one transition that isn't owned
// by a specific node: Backspace at the very start of the FIRST body
// block should move the cursor back into the description, rather
// than merging body text into it.
// =============================================
export const SectionNavigation = Extension.create({
  name: "sectionNavigation",

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const editor = this.editor;
        const { state } = editor;
        const { $from, empty } = state.selection;
        if (!empty || $from.depth !== 1 || $from.parentOffset !== 0) return false;

        const { bodyStart } = getSectionPositions(state.doc);
        if ($from.before(1) !== bodyStart) return false;

        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (!dispatch) return true;
            const { descriptionContentEnd } = getSectionPositions(tr.doc);
            tr.setSelection(TextSelection.near(tr.doc.resolve(descriptionContentEnd)));
            tr.scrollIntoView();
            return true;
          })
          .run();

        return true;
      },
    };
  },
});

// =============================================
// HEAD MEDIA (for featured image/video)
// =============================================
export const HeadMedia = Node.create({
  name: "headMedia",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      mediaType: { default: "image" },
      source: { default: "external" },
      url: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="head-media"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-type": "head-media",
        class: "head-media my-8 text-center",
      }),
      0,
    ];
  },
});

export const MediaBlock = Node.create({
  name: "mediaBlock",

  group: "block",

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      kind: {
        default: "image", // image | video | embed | gallery
      },

      src: {
        default: "",
      },

      poster: {
        default: null,
      },

      caption: {
        default: null,
      },

      provider: {
        default: "local",
      },

      controls: {
        default: true,
      },

      autoplay: {
        default: false,
      },

      loop: {
        default: false,
      },

      alt: {
        default: null,
      },

      width: {
        default: "100%",
      },

      height: {
        default: "auto",
      },

      items: {
        default: null, // gallery array
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-media]",
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const kind = node.getAttribute("data-media");
          const img = node.querySelector("img");
          const video = node.querySelector("video");
          const iframe = node.querySelector("iframe");
          const figcaption = node.querySelector("figcaption");
          const caption = figcaption?.textContent || null;

          if (kind === "image" && img) {
            return {
              kind,
              src: img.getAttribute("src"),
              alt: img.getAttribute("alt"),
              caption,
            };
          }
          if (kind === "video" && video) {
            return {
              kind,
              src: video.getAttribute("src"),
              poster: video.getAttribute("poster"),
              controls: video.hasAttribute("controls"),
              autoplay: video.hasAttribute("autoplay"),
              loop: video.hasAttribute("loop"),
              caption,
            };
          }
          if (kind === "embed" && iframe) {
            return { kind, src: iframe.getAttribute("src"), caption };
          }
          // Handle gallery as needed
          return { kind };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { kind, src, poster, caption, controls, autoplay, loop, alt, items } =
      HTMLAttributes;

    if (kind === "image") {
      const children: any[] = [
        ["img", mergeAttributes({ src, alt })],
      ];
      if (caption) {
        children.push(["figcaption", {}, caption]);
      }
      return ["figure", mergeAttributes({ "data-media": "image" }), children];
    }

    if (kind === "video") {
      const children: any[] = [
        [
          "video",
          mergeAttributes({
            src,
            poster,
            controls,
            autoplay,
            loop,
            style: "width:100%;height:auto;display:block;",
          }),
        ],
      ];
      if (caption) {
        children.push(["figcaption", {}, caption]);
      }
      return ["figure", mergeAttributes({ "data-media": "video" }), children];
    }

    if (kind === "embed") {
      const children: any[] = [
        [
          "iframe",
          mergeAttributes({
            src,
            frameborder: "0",
            allowfullscreen: "true",
            sandbox: "allow-scripts allow-same-origin allow-presentation",
          }),
        ],
      ];
      if (caption) {
        children.push(["figcaption", {}, caption]);
      }
      return ["figure", mergeAttributes({ "data-media": "embed" }), children];
    }

    if (kind === "gallery") {
      const children: any[] = [
        [
          "div",
          { class: "gallery-grid" },
          ...(items || []).map((img: any) => ["img", { src: img.src }]),
        ],
      ];
      if (caption) {
        children.push(["figcaption", {}, caption]);
      }
      return ["figure", mergeAttributes({ "data-media": "gallery" }), children];
    }

    return ["figure", mergeAttributes({ "data-media": "unknown" }), 0];
  },

  addCommands() {
    return {
      insertImage:
        (attrs: { src: string; alt?: string; caption?: string }) =>
        ({ commands }: any) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              kind: "image",
              ...attrs,
            },
          }),

      insertVideo:
        (attrs: {
          src: string | null;
          poster?: string;
          caption?: string;
          controls?: boolean;
          autoplay?: boolean;
          loop?: boolean;
        }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              kind: "video",
              controls: true,
              ...attrs,
            },
          }),

      insertEmbed:
        (attrs: { src: string; caption?: string; provider?: string }) =>
        ({ commands }: any) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              kind: "embed",
              ...attrs,
            },
          }),

      insertGallery:
        (items: { src: string }[]) =>
        ({ commands }: any) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              kind: "gallery",
              items,
            },
          }),
    };
  },
});

export const Highlight = Extension.create({
  name: "highlight",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (el) => el.style.backgroundColor || null,
            renderHTML: (attrs) =>
              attrs.backgroundColor
                ? { style: `background-color: ${attrs.backgroundColor}` }
                : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setTextHighlight:
        (color: string) =>
        ({ chain }: any) => {
          return chain()
            .setMark("textStyle", {
              backgroundColor: color,
            })
            .run();
        },
      unsetTextHighlight:
        () =>
        ({ chain }: any) => {
          return chain()
            .setMark("textStyle", { backgroundColor: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize.replace("px", "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});