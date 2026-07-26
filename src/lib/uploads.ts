import "server-only";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFor(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/**
 * Uploads listing photos to Vercel Blob and returns their public URLs. Blob
 * storage (not the local filesystem) because Vercel's serverless functions
 * have an ephemeral filesystem -- local writes wouldn't survive between
 * requests or deploys.
 */
export async function saveListingPhotos(listingId: string, files: File[]) {
  const validFiles = files.filter((f) => f && f.size > 0);
  if (validFiles.length === 0) return [];

  for (const file of validFiles) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(
        `Unsupported photo type: ${file.type || "unknown"}. Please use JPEG, PNG, WEBP, or GIF.`,
      );
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error("Each photo must be under 8MB.");
    }
  }

  const saved: { url: string }[] = [];
  for (const file of validFiles) {
    const filename = `listings/${listingId}/${randomUUID()}.${extensionFor(file.type)}`;
    const blob = await put(filename, file, { access: "public", addRandomSuffix: false });
    saved.push({ url: blob.url });
  }
  return saved;
}
