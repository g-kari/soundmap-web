import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { login } from "~/utils/auth.server";
import { createUserSession, getUserId } from "~/utils/session.server";

/**
 * Redirects authenticated users to "/timeline"; returns an empty JSON response for anonymous requests.
 *
 * @returns A redirect response to "/timeline" when a user session exists, otherwise an empty JSON response object.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/timeline");
  return json({});
}

/**
 * Handles login form submissions by validating credentials, authenticating the user, and creating a session.
 *
 * Validates `email`, `password`, and optional `redirectTo` from the submitted form; returns a 400 JSON error when validation or authentication fails, and creates a user session and redirects on success.
 *
 * @returns A Response containing a JSON error with status 400 for invalid input or failed authentication, or a redirect response that establishes a user session on successful login.
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") || "/timeline";

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return json(
      { error: "入力内容が正しくありません" },
      { status: 400 }
    );
  }

  const user = await login({ email, password });

  if (!user) {
    return json(
      { error: "メールアドレスまたはパスワードが間違っています" },
      { status: 400 }
    );
  }

  return createUserSession(user.id, redirectTo);
}

/**
 * Render the login page UI including an email and password form, a hidden `redirectTo` field populated from the URL, server-provided error display, and a link to registration.
 *
 * @returns The login page JSX element
 */
export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ログイン</h1>
        <Form method="post" className="auth-form">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />
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
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              required
            />
          </div>
          {actionData?.error && (
            <div className="error-message">{actionData.error}</div>
          )}
          <button type="submit" className="button button-primary button-full">
            ログイン
          </button>
        </Form>
        <p className="auth-footer">
          アカウントをお持ちでない方は{" "}
          <Link to="/register" className="link">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}