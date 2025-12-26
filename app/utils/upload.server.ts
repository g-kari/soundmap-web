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
