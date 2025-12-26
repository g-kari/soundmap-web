import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { logout } from "~/utils/session.server.cloudflare";

export async function action({ request, context }: ActionFunctionArgs) {
  return logout(request);
}

export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
