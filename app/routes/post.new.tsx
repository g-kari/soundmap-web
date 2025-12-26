import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { uploadAudioFile } from "~/utils/upload.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  try {
    const audioUrl = await uploadAudioFile(request);
    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const location = formData.get("location");

    if (
      typeof title !== "string" ||
      typeof latitude !== "string" ||
      typeof longitude !== "string"
    ) {
      return json(
        { error: "必須項目を入力してください" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId,
        title,
        description: typeof description === "string" ? description : null,
        audioUrl,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location: typeof location === "string" ? location : null,
      },
    });

    return redirect(`/post/${post.id}`);
  } catch (error) {
    return json(
      { error: "投稿に失敗しました" },
      { status: 500 }
    );
  }
}

export default function NewPost() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container">
      <div className="post-form-container">
        <h1 className="page-title">新しい音声投稿</h1>
        <Form method="post" encType="multipart/form-data" className="post-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              タイトル *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audio" className="form-label">
              音声ファイル *
            </label>
            <input
              type="file"
              id="audio"
              name="audio"
              accept="audio/*"
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude" className="form-label">
                緯度 *
              </label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                step="0.000001"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude" className="form-label">
                経度 *
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                step="0.000001"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">
              場所の名前
            </label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-input"
              placeholder="例: 東京タワー"
            />
          </div>

          <button
            type="button"
            className="button button-secondary button-full"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  const latInput = document.getElementById("latitude") as HTMLInputElement;
                  const lngInput = document.getElementById("longitude") as HTMLInputElement;
                  if (latInput && lngInput) {
                    latInput.value = position.coords.latitude.toString();
                    lngInput.value = position.coords.longitude.toString();
                  }
                });
              }
            }}
          >
            現在地を取得
          </button>

          {actionData?.error && (
            <div className="error-message">{actionData.error}</div>
          )}

          <button type="submit" className="button button-primary button-full">
            投稿する
          </button>
        </Form>
      </div>
    </div>
  );
}
