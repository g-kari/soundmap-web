import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";

/**
 * Server entry handler that renders the Remix app to an HTML response.
 *
 * @param request - The incoming HTTP request whose URL is used for routing
 * @param responseStatusCode - The HTTP status code for the response
 * @param responseHeaders - Headers to include on the response; `Content-Type` will be set to `text/html`
 * @param remixContext - Remix `EntryContext` used to render the application state
 * @returns A Response containing the rendered HTML document (prefixed with `<!DOCTYPE html>`) and the provided headers and status code
 */
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}