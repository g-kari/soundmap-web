/// <reference types="vite/client" />
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import appCss from "~/styles/app.css?url";
import { getCurrentSession } from "~/utils/session";
import { getEnv } from "~/utils/db.server";

const getSessionFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = getEnv(context);
    
    // SESSION_KVが利用できない場合（開発環境など）はnullを返す
    if (!env.SESSION_KV) {
      return { user: null };
    }
    
    const session = await getCurrentSession(env.SESSION_KV);
    return { user: session };
  }
);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SoundMap - 音声SNS" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      },
    ],
  }),
  loader: async () => {
    const { user } = await getSessionFn();
    return { user };
  },
  component: RootComponent,
});

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { user } = Route.useLoaderData();

  return (
    <RootDocument>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <Link to="/" className="navbar-logo">
              SoundMap
            </Link>
          </div>
          <div className="navbar-menu">
            <Link to="/timeline" className="navbar-link">
              タイムライン
            </Link>
            <Link to="/map" className="navbar-link">
              地図
            </Link>
            {user ? (
              <>
                <Link to="/post/new" className="navbar-link">
                  投稿
                </Link>
                <Link
                  to="/profile/$username"
                  params={{ username: user.username }}
                  className="navbar-link"
                >
                  {user.username}
                </Link>
                <Link to="/logout" className="navbar-link">
                  ログアウト
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link">
                  ログイン
                </Link>
                <Link to="/register" className="navbar-link">
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </RootDocument>
  );
}
