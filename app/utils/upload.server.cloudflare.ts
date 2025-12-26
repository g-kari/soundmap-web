import { unstable_parseMultipartFormData } from "@remix-run/cloudflare";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { generateId } from "./db.server.cloudflare";

/**
 * Handles a multipart form upload for an audio file, saves the file to Cloudflare R2, and returns its public path.
 *
 * @param context - The Remix AppLoadContext containing `context.cloudflare.env.AUDIO_BUCKET` used to store the uploaded file.
 * @returns The public URL path for the uploaded audio file (e.g., `/audio/{fileName}`).
 * @throws Error when no audio file is provided in the multipart form or the form field is invalid.
 */
export async function uploadAudioFile(
  request: Request,
  context: AppLoadContext
) {
  const uploadHandler = async ({ data, filename }: any) => {
    const chunks: Uint8Array[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }

    const buffer = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    return buffer;
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const audioFile = formData.get("audio");

  if (!audioFile || typeof audioFile === "string") {
    throw new Error("No audio file uploaded");
  }

  const fileName = `${generateId()}.webm`;
  const bucket = context.cloudflare.env.AUDIO_BUCKET;

  await bucket.put(fileName, audioFile);

  // Return the public URL (you may need to adjust this based on your R2 setup)
  return `/audio/${fileName}`;
}

/**
 * Retrieve an audio file from the Cloudflare R2 bucket and return it as an HTTP response.
 *
 * @param fileName - The key/name of the audio file to fetch from the AUDIO_BUCKET.
 * @param context - The Remix AppLoadContext containing Cloudflare environment bindings (used to access `AUDIO_BUCKET`).
 * @returns A Response containing the object's body with its HTTP metadata headers (including `etag`), or a 404 Response if the object was not found.
 */
export async function getAudioFile(
  fileName: string,
  context: AppLoadContext
): Promise<Response> {
  const bucket = context.cloudflare.env.AUDIO_BUCKET;
  const object = await bucket.get(fileName);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, {
    headers,
  });
}