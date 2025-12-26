import {
  createFileRoute,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { generateId, getCurrentTimestamp, getEnvAsync } from "~/utils/db.server";
import { getCurrentSession } from "~/utils/session";
import { uploadAudioToR2, getR2PublicUrl } from "~/utils/upload";
import { checkRateLimit, UPLOAD_RATE_LIMIT } from "~/utils/rate-limit";
import { logger } from "~/utils/logger";

const uploadAudioFn = createServerFn({ method: "POST" }).handler(async ({ data: formData, context }: { data: FormData; context: any }) => {
    const env = await getEnvAsync(context);

    if (!env.SESSION_KV || !env.AUDIO_BUCKET) {
      return { error: "Cloudflareバインディングが利用できません" };
    }

    // Get session
    const session = await getCurrentSession(env.SESSION_KV);
    if (!session) {
      return { error: "認証が必要です" };
    }

    // Rate limiting: 10 uploads per hour per user
    const rateLimit = await checkRateLimit(
      env.SESSION_KV,
      `upload:${session.userId}`,
      UPLOAD_RATE_LIMIT
    );

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      const resetTime = resetDate.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        error: `アップロード回数の上限に達しました。${resetTime}以降に再度お試しください。`,
      };
    }

    const audioFile = formData.get("audio") as File | null;
    if (!audioFile || audioFile.size === 0) {
      return { error: "音声ファイルを選択してください" };
    }

    // Validate file type
    const allowedTypes = [
      "audio/webm",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/m4a",
    ];
    if (!allowedTypes.includes(audioFile.type)) {
      return { error: "対応していない音声形式です" };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return { error: "ファイルサイズが大きすぎます（最大50MB）" };
    }

    try {
      const key = await uploadAudioToR2(env.AUDIO_BUCKET, audioFile);
      const audioUrl = getR2PublicUrl(key);
      return { success: true, audioUrl, key };
    } catch (err) {
      logger.error("Upload error", {
        error: err instanceof Error ? err.message : String(err),
        fileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type,
      });
      return { error: "アップロードに失敗しました" };
    }
  });

const createPostFn = createServerFn({ method: "POST" }).handler(async ({ data, context }: { data: {
      title: string;
      description?: string;
      audioUrl: string;
      latitude?: number;
      longitude?: number;
      location?: string;
    }; context: any }) => {
    const env = await getEnvAsync(context);
    
    if (!env.DATABASE || !env.SESSION_KV) {
      return { error: "データベース接続が利用できません" };
    }
    
    const db = env.DATABASE;

    // Get session
    const session = await getCurrentSession(env.SESSION_KV);
    if (!session) {
      return { error: "認証が必要です" };
    }

    const postId = generateId();
    const now = getCurrentTimestamp();

    await db
      .prepare(
        `INSERT INTO posts (id, user_id, title, description, audio_url, latitude, longitude, location, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        postId,
        session.userId,
        data.title,
        data.description || null,
        data.audioUrl,
        data.latitude || null,
        data.longitude || null,
        data.location || null,
        now,
        now
      )
      .run();

    return { success: true, postId };
  });

const checkAuthFn = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = await getEnvAsync(context);
    
    if (!env.SESSION_KV) {
      return { authenticated: false };
    }
    
    const session = await getCurrentSession(env.SESSION_KV);
    return { authenticated: !!session };
  }
);

export const Route = createFileRoute("/post/new")({
  beforeLoad: async () => {
    const { authenticated } = await checkAuthFn();
    if (!authenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: NewPost,
});

function NewPost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const result = await uploadAudioFn({ data: formData });
      if (result.error) {
        setError(result.error);
        setAudioFile(null);
      } else if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
      }
    } catch (err) {
      setError("アップロードに失敗しました");
      setAudioFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報に対応していません");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        setError("位置情報を取得できませんでした");
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!audioUrl) {
      setError("音声ファイルをアップロードしてください");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createPostFn({
        data: {
          title,
          description: description || undefined,
          audioUrl,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          location: location || undefined,
        },
      });
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        navigate({ to: "/timeline" });
      }
    } catch (err) {
      setError("投稿に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="post-form-container">
        <h1 className="page-title">新規投稿</h1>
        <form onSubmit={handleSubmit} className="post-form">
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
              onChange={handleFileChange}
              ref={fileInputRef}
              required
            />
            {isUploading && (
              <p className="form-hint">アップロード中...</p>
            )}
            {audioFile && audioUrl && (
              <p className="form-hint success">
                {audioFile.name} をアップロードしました
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              タイトル *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
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
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: 渋谷駅前"
            />
          </div>
          <div className="form-group">
            <label className="form-label">位置情報</label>
            <button
              type="button"
              className="button button-secondary"
              onClick={getCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? "取得中..." : "現在地を取得"}
            </button>
            {latitude && longitude && (
              <p className="form-hint success">
                緯度: {latitude.toFixed(6)}, 経度: {longitude.toFixed(6)}
              </p>
            )}
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="button button-primary"
            disabled={isLoading || isUploading || !audioUrl}
          >
            {isLoading ? "投稿中..." : "投稿する"}
          </button>
        </form>
      </div>
    </div>
  );
}
