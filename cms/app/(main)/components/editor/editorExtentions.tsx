import { Extension, Node, mergeAttributes } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import { TextSelection } from "prosemirror-state";
import "@tiptap/core";

// =============================================
// TYPES & MODULE AUGMENTATION
// =============================================
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlight: {
      /** Set text highlight background color */
      setTextHighlight: (color: string) => ReturnType;
      /** Unset text highlight background color */
      unsetTextHighlight: () => ReturnType;
    };
    fontSize: {
      /** Set inline font size in px */
      setFontSize: (size: string) => ReturnType;
      /** Unset inline font size */
      unsetFontSize: () => ReturnType;
    };
    imageNode: {
      /** Insert an image node */
      insertImage: (attrs: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
    videoNode: {
      /** Insert a video node */
      insertVideo: (attrs: {
        src: string | null;
        poster?: string;
        caption?: string;
        controls?: boolean;
        autoplay?: boolean;
        loop?: boolean;
      }) => ReturnType;
    };
    embedNode: {
      /** Insert an embedded video / iframe node */
      insertEmbed: (attrs: { src: string; caption?: string }) => ReturnType;
    };
    galleryNode: {
      /** Insert an image gallery node */
      insertGallery: (items: { src: string }[], caption?: string) => ReturnType;
    };
  }
}
// =============================================
// SEPARATED MEDIA NODES
// =============================================

// 1. IMAGE NODE
export const ImageNode = Node.create({
  name: "imageNode",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.querySelector("img")?.getAttribute("src") || "",
        renderHTML: (attributes) => ({ src: attributes.src }),
      },
      alt: {
        default: "",
        parseHTML: (element) => element.querySelector("img")?.getAttribute("alt") || "",
        renderHTML: (attributes) => (attributes.alt ? { alt: attributes.alt } : {}),
      },
      caption: {
        default: "",
        parseHTML: (element) => element.querySelector("figcaption")?.textContent || "",
        renderHTML: (attributes) => (attributes.caption ? { "data-caption": attributes.caption } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-media="image"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, ...rest } = HTMLAttributes;

    const imgAttrs: Record<string, string> = { src: src || "" };
    if (alt) imgAttrs.alt = alt;

    const children: any[] = [["img", imgAttrs]];

    if (caption) {
      children.push(["figcaption", {}, caption]);
    }

    return [
      "figure",
      mergeAttributes(rest, { "data-media": "image" }),
      ...children,
    ];
  },

  addCommands() {
    return {
      insertImage:
        (attrs: { src: string; alt?: string; caption?: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src,
              alt: attrs.alt || "",
              caption: attrs.caption || "",
            },
          }),
    };
  },
});

// 2. VIDEO NODE
export const VideoNode = Node.create({
  name: "videoNode",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.querySelector("video")?.getAttribute("src") || "",
      },
      poster: {
        default: "",
        parseHTML: (element) => element.querySelector("video")?.getAttribute("poster") || "",
      },
      caption: {
        default: "",
        parseHTML: (element) => element.querySelector("figcaption")?.textContent || "",
      },
      controls: {
        default: true,
        parseHTML: (element) => element.querySelector("video")?.hasAttribute("controls") ?? true,
      },
      autoplay: {
        default: false,
        parseHTML: (element) => element.querySelector("video")?.hasAttribute("autoplay") ?? false,
      },
      loop: {
        default: false,
        parseHTML: (element) => element.querySelector("video")?.hasAttribute("loop") ?? false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-media="video"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, poster, caption, controls, autoplay, loop, ...rest } = HTMLAttributes;

    const videoAttrs: Record<string, any> = {
      src: src || "",
      style: "width:100%;height:auto;display:block;",
    };

    if (poster) videoAttrs.poster = poster;
    if (controls) videoAttrs.controls = "";
    if (autoplay) videoAttrs.autoplay = "";
    if (loop) videoAttrs.loop = "";

    const children: any[] = [["video", videoAttrs]];

    if (caption) {
      children.push(["figcaption", {}, caption]);
    }

    return [
      "figure",
      mergeAttributes(rest, { "data-media": "video" }),
      ...children,
    ];
  },

  addCommands() {
    return {
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
              src: attrs.src || "",
              poster: attrs.poster || "",
              caption: attrs.caption || "",
              controls: attrs.controls ?? true,
              autoplay: attrs.autoplay ?? false,
              loop: attrs.loop ?? false,
            },
          }),
    };
  },
});

// 3. EMBED NODE
export const EmbedNode = Node.create({
  name: "embedNode",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.querySelector("iframe")?.getAttribute("src") || "",
      },
      caption: {
        default: "",
        parseHTML: (element) => element.querySelector("figcaption")?.textContent || "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-media="embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption, ...rest } = HTMLAttributes;

    const children: any[] = [
      [
        "iframe",
        {
          src: src || "",
          frameborder: "0",
          allowfullscreen: "true",
          sandbox: "allow-scripts allow-same-origin allow-presentation",
          style: "width:100%;aspect-ratio:16/9;border:0;",
        },
      ],
    ];

    if (caption) {
      children.push(["figcaption", {}, caption]);
    }

    return [
      "figure",
      mergeAttributes(rest, { "data-media": "embed" }),
      ...children,
    ];
  },

  addCommands() {
    return {
      insertEmbed:
        (attrs: { src: string; caption?: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src,
              caption: attrs.caption || "",
            },
          }),
    };
  },
});

// 4. GALLERY NODE
export const GalleryNode = Node.create({
  name: "galleryNode",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: [],
        parseHTML: (element) => {
          const imgs = element.querySelectorAll(".gallery-grid img");
          const items: { src: string }[] = [];
          imgs.forEach((img) => {
            const src = img.getAttribute("src");
            if (src) items.push({ src });
          });
          return items;
        },
      },
      caption: {
        default: "",
        parseHTML: (element) => element.querySelector("figcaption")?.textContent || "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-media="gallery"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { items, caption, ...rest } = HTMLAttributes;

    const children: any[] = [
      [
        "div",
        { class: "gallery-grid" },
        ...(Array.isArray(items) ? items : []).map((img: any) => ["img", { src: img.src }]),
      ],
    ];

    if (caption) {
      children.push(["figcaption", {}, caption]);
    }

    return [
      "figure",
      mergeAttributes(rest, { "data-media": "gallery" }),
      ...children,
    ];
  },

  addCommands() {
    return {
      insertGallery:
        (items: { src: string }[], caption?: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              items,
              caption: caption || "",
            },
          }),
    };
  },
});

// =============================================
// HIGHLIGHT & FONT SIZE EXTENSIONS
// =============================================
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
        ({ chain }) => {
          return chain()
            .setMark("textStyle", {
              backgroundColor: color,
            })
            .run();
        },
      unsetTextHighlight:
        () =>
        ({ chain }) => {
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







// =============================================
// DOCUMENT SCHEMA & NAVIGATION HELPERS
// =============================================
export const ArticleDocument = Document.extend({
  content: "articleTitle articleDescription block+",
});

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
    bodyStart: titleSize + descriptionSize,
  };
}

// =============================================
// ARTICLE TITLE & DESCRIPTION NODES
// =============================================
export const ArticleTitle = Node.create({
  name: "articleTitle",
  content: "inline*",
  defining: true,
  isolating: true,

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
      // Spread children into the parent tuple
      return ["figure", mergeAttributes({ "data-media": "image" }), ...children];
    }

    if (kind === "video") {
      const videoAttrs: Record<string, any> = {
        src,
        poster,
        style: "width:100%;height:auto;display:block;",
      };
      if (controls) videoAttrs.controls = "";
      if (autoplay) videoAttrs.autoplay = "";
      if (loop) videoAttrs.loop = "";

      const children: any[] = [
        ["video", mergeAttributes(videoAttrs)],
      ];
      if (caption) {
        children.push(["figcaption", {}, caption]);
      }
      return ["figure", mergeAttributes({ "data-media": "video" }), ...children];
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
            style: "width:100%;aspect-ratio:16/9;border:0;",
          }),
        ],
      ];
      if (caption) {
        children.push(["figcaption", {}, caption]);
      }
      // Spread children into the parent tuple
      return ["figure", mergeAttributes({ "data-media": "embed" }), ...children];
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
      return ["figure", mergeAttributes({ "data-media": "gallery" }), ...children];
    }

    return ["figure", mergeAttributes({ "data-media": "unknown" })];
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
        ({ commands }:any) =>
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