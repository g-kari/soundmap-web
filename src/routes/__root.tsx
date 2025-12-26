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
import { getEnvAsync } from "~/utils/db.server";

const getSessionFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = await getEnvAsync(context);
    
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
      <main className="main-content">
        <Outlet />
      </main>

      {/* モバイル用下部ナビゲーションバー */}
      <nav className="mobile-navbar">
        <Link to="/map" className="mobile-nav-item">
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
            </svg>
          </div>
          <span className="mobile-nav-label">投稿</span>
        </Link>

        <Link to="/timeline" className="mobile-nav-item">
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </div>
          <span className="mobile-nav-label">タイムライン</span>
        </Link>

        <Link to="/post/new" className="mobile-nav-item mobile-nav-record">
          <div className="mobile-nav-record-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0 -3 3v7a3 3 0 0 0 6 0v-7a3 3 0 0 0 -3 -3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
              <path d="M12 19v3" />
            </svg>
          </div>
          <span className="mobile-nav-label">録音</span>
        </Link>

        <Link to={user ? "/logout" : "/login"} className="mobile-nav-item">
          <div className="mobile-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
              <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
            </svg>
          </div>
          <span className="mobile-nav-label">設定</span>
        </Link>

        {user ? (
          <Link
            to="/profile/$username"
            params={{ username: user.username }}
            className="mobile-nav-item"
          >
            <div className="mobile-nav-icon mobile-nav-avatar">
              {user.username[0].toUpperCase()}
            </div>
            <span className="mobile-nav-label">プロフィール</span>
          </Link>
        ) : (
          <Link to="/register" className="mobile-nav-item">
            <div className="mobile-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>
            <span className="mobile-nav-label">登録</span>
          </Link>
        )}
      </nav>
    </RootDocument>
  );
}
