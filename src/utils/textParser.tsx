import React from 'react';
import Link from 'next/link';

// Pattern matches 2-5 uppercase letters, a hyphen, and 1 or more digits
const ISSUE_KEY_REGEX = /([A-Z]{2,5}-[0-9]+)/g;

export function parseIssueKeys(text: string, projectKey?: string) {
  if (!text) return null;
  
  const parts = text.split(ISSUE_KEY_REGEX);
  
  return parts.map((part, i) => {
    if (part.match(ISSUE_KEY_REGEX)) {
      // It's an issue key
      const routeProjectKey = projectKey || part.split('-')[0];
      return (
        <Link 
          key={i} 
          href={`/${routeProjectKey}/${part}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-medium hover:bg-brand-100 hover:underline transition-colors text-sm"
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function parseIssueKeysHTML(html: string, projectKey?: string) {
  if (!html) return '';
  
  // Regex to match issue keys that are NOT inside HTML tags (like href="")
  // This is a naive regex approach suitable for SSR where DOM is unavailable.
  // It looks for issue keys and uses a negative lookahead to avoid replacing them if they are inside an HTML tag.
  // Not perfect for all edge cases but works for standard Tiptap output.
  const regex = /([A-Z]{2,5}-[0-9]+)(?![^<]*>|[^<>]*<\/a>)/g;
  
  return html.replace(regex, (match) => {
    const routeProjectKey = projectKey || match.split('-')[0];
    return `<a href="/${routeProjectKey}/${match}" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-medium hover:bg-brand-100 hover:underline transition-colors text-sm">${match}</a>`;
  });
}
