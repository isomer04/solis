/**
 * Validate a URL is http(s): before rendering as href to prevent javascript:
 * (and other) URL-scheme XSS.
 *
 * Returns the original URL string when its protocol is `http:` or `https:`,
 * otherwise returns `null`. Invalid URLs (parse errors) also return `null`.
 *
 * Use this everywhere a user-controlled or third-party URL flows into an
 * `<a href={...}>` to ensure schemes like `javascript:`, `data:`, `vbscript:`,
 * `file:` etc. are rejected before they reach the DOM.
 *
 * @example
 *   const href = safeHref(article.url);
 *   return href ? <a href={href} target="_blank" rel="noopener noreferrer">...</a> : null;
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const proto = new URL(url).protocol;
    return proto === "https:" || proto === "http:" ? url : null;
  } catch {
    return null;
  }
}
