/**
 * HTML Sanitization Utilities
 *
 * Provides safe HTML escaping to prevent XSS attacks.
 * Use these utilities when rendering user-provided content in HTML.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 *
 * @param str - The string to escape
 * @returns HTML-safe string with special characters escaped
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHTML(userInput);
 * element.innerHTML = `<div>${safe}</div>`;
 * // Renders: &lt;script&gt;alert("XSS")&lt;/script&gt;
 * ```
 */
export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escapes HTML attribute values to prevent XSS in attributes.
 *
 * @param str - The string to escape
 * @returns Attribute-safe string with quotes escaped
 *
 * @example
 * ```typescript
 * const userTitle = 'User\'s "Title"';
 * const safe = escapeAttribute(userTitle);
 * element.innerHTML = `<div title="${safe}">...</div>`;
 * ```
 */
export function escapeAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Safely creates HTML from a template string with escaped interpolations.
 *
 * @param strings - Template literal strings
 * @param values - Values to interpolate and escape
 * @returns Safe HTML string
 *
 * @example
 * ```typescript
 * const name = '<script>alert("XSS")</script>';
 * const age = 25;
 * const html = safeHTML`<div class="user">
 *   <h3>${name}</h3>
 *   <p>Age: ${age}</p>
 * </div>`;
 * // name is escaped, age is safe as-is
 * ```
 */
export function safeHTML(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    const safeValue = value === undefined || value === null
      ? ''
      : typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : escapeHTML(String(value));
    return result + str + safeValue;
  }, '');
}

/**
 * Sanitizes a URL to prevent javascript: protocol attacks.
 *
 * @param url - The URL to sanitize
 * @returns Safe URL or empty string if dangerous
 *
 * @example
 * ```typescript
 * const userUrl = 'javascript:alert("XSS")';
 * const safe = sanitizeURL(userUrl);  // Returns ''
 *
 * const httpUrl = 'https://example.com';
 * const safe2 = sanitizeURL(httpUrl);  // Returns 'https://example.com'
 * ```
 */
export function sanitizeURL(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  // Allow http(s), mailto, relative URLs
  return url;
}

/**
 * Strips all HTML tags from a string, leaving only text.
 *
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 *
 * @example
 * ```typescript
 * const html = '<p>Hello <strong>world</strong>!</p>';
 * const text = stripHTML(html);  // 'Hello world!'
 * ```
 */
export function stripHTML(html: string): string {
  // Use DOMParser which does not execute scripts
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || ''; 
}
