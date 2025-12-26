import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

let router: ReturnType<typeof createTanStackRouter> | undefined;

export function createRouter() {
  if (router) return router;

  router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: () => (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>404 - ページが見つかりません</h1>
        <p>お探しのページは存在しません。</p>
      </div>
    ),
  });

  return router;
}

export function getRouter() {
  return createRouter();
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
