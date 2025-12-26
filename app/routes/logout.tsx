import type { ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/utils/session.server";

/**
 * Ends the session for the incoming request and returns the HTTP response produced by the logout operation.
 *
 * @param request - The incoming request whose session should be cleared.
 * @returns The Response produced by the logout operation.
 */
export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

/**
 * Responds to requests with HTTP 405 indicating the method is not allowed.
 *
 * @returns A Response with body "Method Not Allowed" and HTTP status 405.
 */
export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}