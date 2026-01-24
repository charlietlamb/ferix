/**
 * Signal detection utilities for identifying partial ferix tags
 */

/**
 * Check if text buffer might contain the start of a ferix tag
 */
export function mightContainFerixTagStart(buffer: string): boolean {
  if (!buffer.includes("<")) {
    return false;
  }
  // Partial matches for any ferix tag
  const partials = ["<f", "<fe", "<fer", "<feri", "<ferix", "<ferix:"];
  return partials.some((p) => buffer.endsWith(p));
}
