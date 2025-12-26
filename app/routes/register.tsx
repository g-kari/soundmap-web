import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { register } from "~/utils/auth.server";
import { createUserSession, getUserId } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";

/**
 * Redirects authenticated users to the timeline route or returns an empty JSON response for unauthenticated requests.
 *
 * @returns A Response that redirects to `/timeline` if the request is from an authenticated user, otherwise an empty JSON response.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/timeline");
  return json({});
}

/**
 * Handle registration form submissions, validate input, create a new user, and start a session redirecting to /timeline.
 *
 * @param request - The incoming HTTP request containing form data fields `email`, `username`, and `password`.
 * @returns A redirect response to "/timeline" on successful registration; a JSON error response with HTTP status 400 when input is invalid, the password is shorter than 6 characters, or the email/username is already in use.
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const username = formData.get("username");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return json(
      { error: "入力内容が正しくありません" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return json(
      { error: "パスワードは6文字以上である必要があります" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    return json(
      { error: "そのメールアドレスまたはユーザー名は既に使用されています" },
      { status: 400 }
    );
  }

  const user = await register({ email, username, password });

  return createUserSession(user.id, "/timeline");
}

/**
 * Render the registration page with a form for email, username, and password.
 *
 * The form posts to the route's action handler, enforces client-side required/minLength constraints,
 * and displays server-side error messages returned by the action.
 *
 * @returns The JSX element for the registration page
 */
export default function Register() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">新規登録</h1>
        <Form method="post" className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              minLength={6}
              required
            />
          </div>
          {actionData?.error && (
            <div className="error-message">{actionData.error}</div>
          )}
          <button type="submit" className="button button-primary button-full">
            登録
          </button>
        </Form>
        <p className="auth-footer">
          既にアカウントをお持ちの方は{" "}
          <Link to="/login" className="link">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}