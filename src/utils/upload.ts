import type { Env } from "../../load-context";

// Generate a unique filename
export function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop() || "webm";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}.${ext}`;
}

// Upload audio file to R2
export async function uploadAudioToR2(
  bucket: R2Bucket,
  file: File
): Promise<string> {
  const fileName = generateFileName(file.name);
  const key = `audio/${fileName}`;

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "audio/webm",
    },
  });

  return key;
}

// Get public URL for R2 object
export function getR2PublicUrl(key: string): string {
  // This should be configured based on your R2 bucket's public domain
  // For now, we'll use a relative path that can be proxied
  return `/audio/${key.replace("audio/", "")}`;
}

// Delete audio file from R2
export async function deleteAudioFromR2(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}
