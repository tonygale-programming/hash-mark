import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/** Minimal hast shapes for the tree walk below (avoids depending on @types/hast directly). */
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const ALERTS: Record<string, string> = {
  NOTE: 'Note',
  TIP: 'Tip',
  IMPORTANT: 'Important',
  WARNING: 'Warning',
  CAUTION: 'Caution',
};

/**
 * GitHub alerts: a quote starting with "[!NOTE]" (TIP, IMPORTANT, WARNING, CAUTION) becomes a
 * callout with a title. Returns false for an ordinary quote.
 */
function toCallout(quote: HastNode): boolean {
  const paragraph = quote.children?.find((child) => child.type === 'element');
  const first = paragraph?.tagName === 'p' ? paragraph.children?.[0] : undefined;
  const marker =
    first?.type === 'text' ? /^\[!(\w+)\][ \t]*(?:\n|$)/.exec(first.value ?? '') : null;
  const kind = marker?.[1]?.toUpperCase();
  if (!paragraph || !first || !marker || !kind || !ALERTS[kind]) return false;
  first.value = first.value!.slice(marker[0].length);
  if (!first.value && paragraph.children!.length === 1) {
    quote.children = quote.children!.filter((child) => child !== paragraph);
  } else if (!first.value) {
    paragraph.children!.shift();
  }
  quote.tagName = 'div';
  quote.properties = { className: ['callout', `callout--${kind.toLowerCase()}`] };
  quote.children!.unshift({
    type: 'element',
    tagName: 'p',
    properties: { className: ['callout__title'] },
    children: [{ type: 'text', value: ALERTS[kind] }],
  });
  return true;
}

/**
 * Runs after sanitizing, so it only adds safe attributes:
 * external links open in a new tab, images load lazily without a referrer,
 * tables get a scroll wrapper for narrow screens, and GitHub alerts become callouts.
 */
function rehypeReadPolish() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      const children = node.children;
      if (!children) return;
      children.forEach((child, index) => {
        if (child.type !== 'element') return;
        const props = (child.properties ??= {});
        if (
          child.tagName === 'a' &&
          typeof props.href === 'string' &&
          /^https?:/i.test(props.href)
        ) {
          props.target = '_blank';
          props.rel = ['noopener', 'noreferrer'];
        }
        if (child.tagName === 'img') {
          props.loading = 'lazy';
          props.referrerPolicy = 'no-referrer';
        }
        if (child.tagName === 'blockquote') toCallout(child);
        if (child.tagName === 'table') {
          children[index] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-wrap'] },
            children: [child],
          };
        }
        walk(child);
      });
    };
    walk(tree);
  };
}

// Raw HTML in Markdown is dropped (remark-rehype default); GitHub-style sanitizing covers the rest.
// remark-rehype already prefixes the only ids it creates (footnotes) with "user-content-", so the
// sanitizer must not prefix again or footnote links break. Revisit if raw HTML is ever allowed.
const schema = { ...defaultSchema, clobberPrefix: '' };

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeReadPolish)
  .use(rehypeStringify);

/** Markdown → sanitized HTML string, safe for innerHTML. */
export function renderMarkdown(markdown: string): string {
  return String(processor.processSync(markdown));
}
