import { unstable_parseMultipartFormData } from "@remix-run/cloudflare";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { generateId } from "./db.server.cloudflare";

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
