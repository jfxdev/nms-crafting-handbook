// SPDX-License-Identifier: GPL-3.0-or-later
// Renders the game's description markup and hand-written Markdown as safe HTML.
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[c]};`,
  );

// Innermost <TAG>text<> span (the game nests them, e.g. <VAL_ON>Plot (<IMG>KEY<>)<>).
const TAG = /&lt;([A-Z_]+)&gt;((?:(?!&lt;[A-Z_]*&gt;)[\s\S])*?)&lt;&gt;/g;

/** Converts in-game text such as "<TECHNOLOGY>starship parts<>" to coloured spans. */
export function gameTextToHtml(text: string): string {
  let html = escapeHtml(text.trim());
  for (let prev = ''; prev !== html;) {
    prev = html;
    html = html.replace(TAG, (_, tag: string, inner: string) =>
      tag === 'IMG'
        ? `<kbd>${inner}</kbd>`
        : `<span class="gt gt-${tag.toLowerCase().replace(/_/g, '-')}">${inner}</span>`,
    );
  }
  return html
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Hand-written Markdown notes; sanitized because they are rendered with innerHTML. */
export function markdownToHtml(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false }));
}
