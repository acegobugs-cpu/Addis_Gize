import { Extension, Node, RawCommands, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

// =============================================
// ARTICLE TITLE - SINGLE INSTANCE
// =============================================
export const ArticleTitle = Node.create({
  name: "articleTitle",
  group: "block",
  content: "inline*",
  defining: true,
  priority: 1000,

  parseHTML() {
    return [{ tag: 'h1[data-type="article-title"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "h1",
      mergeAttributes(HTMLAttributes, {
        "data-type": "article-title",
        class: "article-title text-4xl font-bold tracking-tight mb-8 p-6 border-2 border-gray-200 rounded-2xl bg-white",
      }),
      0,
    ];
  },

  addAttributes() {
    return { placeholder: { default: "Enter article title..." } };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-T": () => false, // Disable manual insertion if needed
    };
  },

  // Prevent multiple titles
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("preventMultipleTitles"),
        props: {
          transformPasted: (slice: any) => {
            const hasTitle = slice.content.content.some(
              (node: any) => node.type.name === "articleTitle"
            );
            if (hasTitle) {
              // You can customize behavior here
              return slice;
            }
            return slice;
          },
        },
      }),
    ];
  },
});

// =============================================
// ARTICLE DESCRIPTION - SINGLE INSTANCE
// =============================================
export const ArticleDescription = Node.create({
  name: "articleDescription",
  group: "block",
  content: "block*",
  defining: true,
  priority: 900,

  parseHTML() {
    return [{ tag: 'div[data-type="article-description"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "article-description",
        class: "article-description border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-10 bg-gray-50 min-h-[140px]",
      }),
      0,
    ];
  },

  addAttributes() {
    return { placeholder: { default: "Write description / summary here..." } };
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
