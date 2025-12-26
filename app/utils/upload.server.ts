import {
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";
import { writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const uploadHandler = unstable_createMemoryUploadHandler({
  maxPartSize: 10_000_000, // 10MB
});

/**
 * Parses a multipart form request, saves the uploaded audio file to disk, and returns its public URL path.
 *
 * @param request - The incoming HTTP request containing multipart form data with an `audio` file field.
 * @returns The public URL path to the saved audio file (e.g. `/uploads/<filename>.webm`).
 * @throws Error if the `audio` field is missing or is not a file.
 */
export async function uploadAudioFile(request: Request) {
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const audioFile = formData.get("audio");

  if (!audioFile || typeof audioFile === "string") {
    throw new Error("No audio file uploaded");
  }

  const fileName = `${randomBytes(16).toString("hex")}.webm`;
  const filePath = path.join(process.cwd(), "public", "uploads", fileName);

  const arrayBuffer = await audioFile.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));

  return `/uploads/${fileName}`;
}