import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { deleteCurrentSession } from "~/utils/session";

const logoutFn = createServerFn({ method: "POST" }).handler(
  async ({ context }) => {
    try {
      const env = (context as any).cloudflare?.env;
      if (!env?.SESSION_KV) {
        console.error("SESSION_KV not available");
        return { success: true }; // Still return success to allow logout
      }

      // Delete session from KV and clear cookie
      await deleteCurrentSession(env.SESSION_KV);

      return { success: true };
    } catch (error) {
      console.error("Error during logout:", error);
      return { success: true }; // Still return success to allow logout
    }
  }
);

export const Route = createFileRoute("/logout")({
  beforeLoad: async () => {
    await logoutFn();
    throw redirect({ to: "/" });
  },
  component: () => null,
});
