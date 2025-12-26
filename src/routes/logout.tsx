import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { deleteCurrentSession } from "~/utils/session";

const logoutFn = createServerFn({ method: "POST" }).handler(
  async ({ context }) => {
    const env = (context as any).cloudflare.env;

    // Delete session from KV and clear cookie
    await deleteCurrentSession(env.SESSION_KV);

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
