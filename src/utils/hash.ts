/**
 * Compute a SHA-256 hash for a file
 * @param file The file to hash
 * @returns Promise resolving to the hex-encoded hash string
 */
export async function sha256File(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
