/**
 * Pomocná funkce pro odstranění Markdown značek z textu (pro perexy, náhledy karet atd.)
 */
export function stripMarkdown(markdown: string = ''): string {
  if (!markdown) return '';
  return markdown
    // Odstranění HTML tagů pokud existují
    .replace(/<[^>]*>/g, '')
    // Odstranění nadpisů (#, ##, ###...)
    .replace(/^#{1,6}\s+/gm, '')
    // Odstranění tučného a kurzívy (**text**, *text*, __text__, _text_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Odstranění obrázků ![alt](url)
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
    // Odstranění odkazů [text](url) -> zachová pouze text
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    // Odstranění inline kódu `code`
    .replace(/`([^`]+)`/g, '$1')
    // Odstranění bloků kódu
    .replace(/```[\s\S]*?```/g, '')
    // Odstranění citací >
    .replace(/^\s*>\s+/gm, '')
    // Odstranění odrážek a seznamů (-, *, +, 1.)
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Odstranění vodorovných čar (---, ***)
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Nahrazení vícenásobných mezer a nových řádků jedinou mezerou
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Zkrátí text na požadovanou délku a přidá trojtečku bez porušení slov.
 */
export function truncateText(text: string, maxLength: number = 160): string {
  const clean = stripMarkdown(text);
  if (clean.length <= maxLength) return clean;
  const truncated = clean.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}
