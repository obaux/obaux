/** "example.org" from "https://www.example.org/learning" — a website row's second line. */
export function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
