import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { getUser } from "~/utils/session.server";
import stylesheet from "~/styles/app.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  },
];

/**
 * Loads the current authenticated user from the session for use by the route.
 *
 * @returns An object containing `user`: the authenticated user object if present, `null` otherwise.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

/**
 * Render the application's root HTML layout with a navigation bar that adapts to the current user.
 *
 * The layout includes document metadata, linked styles, a language-set HTML shell, a navigation bar
 * that shows authenticated links when a user is present and auth links otherwise, a main outlet
 * for nested routes, and Remix runtime components (scroll restoration, scripts, live reload).
 *
 * @returns The React element representing the full HTML document for the app's root layout.
 */
export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SoundMap - 音声SNS</title>
        <Meta />
        <Links />
      </head>
      <body>
        <nav className="navbar">
          <div className="container">
            <div className="navbar-brand">
              <a href="/" className="navbar-logo">
                🎵 SoundMap
              </a>
            </div>
            <div className="navbar-menu">
              {user ? (
                <>
                  <a href="/timeline" className="navbar-link">
                    タイムライン
                  </a>
                  <a href="/map" className="navbar-link">
                    地図
                  </a>
                  <a href="/post/new" className="navbar-link">
                    投稿
                  </a>
                  <a href={`/profile/${user.username}`} className="navbar-link">
                    プロフィール
                  </a>
                  <form action="/logout" method="post" style={{ display: "inline" }}>
                    <button type="submit" className="navbar-link">
                      ログアウト
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <a href="/login" className="navbar-link">
                    ログイン
                  </a>
                  <a href="/register" className="navbar-link">
                    新規登録
                  </a>
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="main-content">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}