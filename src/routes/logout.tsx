import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "vinxi/http";
import {
  deleteSession,
  getSessionTokenFromCookie,
  createLogoutCookie,
} from "~/utils/session";

const logoutFn = createServerFn({ method: "POST" }).handler(
  async ({ context }) => {
    const env = (context as any).cloudflare.env;
    const event = getEvent();

    // Get session token from cookie
    const cookieHeader = event.node.req.headers.cookie || "";
    const sessionToken = getSessionTokenFromCookie(cookieHeader);

    // Delete session from KV
    if (sessionToken) {
      await deleteSession(env.SESSION_KV, sessionToken);
    }

    // Clear session cookie
    event.node.res.setHeader("Set-Cookie", createLogoutCookie());

    return { success: true };
  }
);

export const Route = createFileRoute("/logout")({
  beforeLoad: async () => {
    await logoutFn();
    throw redirect({ to: "/" });
  },
  component: () => null,
});
