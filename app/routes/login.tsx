import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { login } from "~/utils/auth.server.cloudflare";
import { createUserSession, getUserId } from "~/utils/session.server.cloudflare";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/timeline");
  return json({});
}

export async function action({ request, context }: ActionFunctionArgs) {
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

  const user = await login({ email, password }, context);

  if (!user) {
    return json(
      { error: "メールアドレスまたはパスワードが間違っています" },
      { status: 400 }
    );
  }

  return createUserSession(user.id, redirectTo, context);
}

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
