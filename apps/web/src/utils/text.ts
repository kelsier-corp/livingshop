// Client-side search filters (picking a category, an attribute catalog value, a product) should
// ignore accents the same way the server-side searches do — "gomez" should still match "Gómez".
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
