import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  // TODO: セッション削除
  return { success: true };
});

export const Route = createFileRoute("/logout")({
  beforeLoad: async () => {
    await logoutFn();
    throw redirect({ to: "/" });
  },
  component: () => null,
});
