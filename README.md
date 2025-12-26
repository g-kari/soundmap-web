# SoundMap - 音声SNSアプリ

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/g-kari/soundmap-web?utm_source=oss&utm_medium=github&utm_campaign=g-kari%2Fsoundmap-web&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

位置情報と連動した音声SNSアプリケーション。ユーザーが各地点で録音した環境音や音楽を地図上で共有し、タイムラインでフォローしているユーザーの投稿を確認できます。

## 主な機能

- **ユーザー認証**: 新規登録、ログイン、ログアウト機能
- **音声投稿**: 音声ファイルのアップロードと位置情報の記録
- **地図表示**: 投稿を地図上にマーカーとして表示
- **タイムライン**: フォローしているユーザーの投稿を時系列で表示
- **フォロー機能**: 他のユーザーをフォロー/フォロー解除
- **いいね機能**: 投稿にいいねを付ける
- **コメント機能**: 投稿にコメントを追加
- **プロフィール**: ユーザープロフィールと投稿一覧の表示

## 技術スタック

- **フレームワーク**: Remix 2.x (React Router v7 準拠)
- **言語**: TypeScript
- **プラットフォーム**: Cloudflare Pages
- **データベース**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2 (音声ファイル)
- **セッション**: Cloudflare KV
- **スタイリング**: CSS
- **地図**: Leaflet
- **認証**: セッションベース認証 (Cookie)

### React Router v7 対応

このプロジェクトは React Router v7 への移行準備が完了しています：
- ✅ 全ての future flags が有効化済み
- ✅ ビルド警告なし
- ⏳ パッケージの完全移行は任意のタイミングで実行可能

## Cloudflare Pagesでのセットアップ

### 1. 前提条件

- Cloudflareアカウント
- Node.js 18以上
- Wrangler CLI

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Cloudflareリソースの作成

#### D1データベースの作成

```bash
npx wrangler d1 create soundmap-db
```

作成されたデータベースIDを `wrangler.toml` の `database_id` に設定します。

#### KVネームスペースの作成

```bash
# Wrangler v3+ の場合
npx wrangler kv namespace create SESSION_KV

# Wrangler v2 の場合（レガシー）
npx wrangler kv:namespace create SESSION_KV
```

作成されたKV IDを `wrangler.toml` の `id` に設定します。

#### R2バケットの作成

```bash
npx wrangler r2 bucket create soundmap-audio
```

### 4. データベースマイグレーション

```bash
npm run db:migrate
```

### 5. 開発環境での実行

```bash
npm run build
npm run dev
```

アプリケーションは `http://localhost:8788` で起動します。

### 6. Cloudflare Pagesへのデプロイ

#### ビルド

```bash
npm run build
```

#### デプロイ

```bash
npm run deploy
```

または、GitHubリポジトリを連携してCloudflare Pagesで自動デプロイを設定できます：

1. Cloudflare Dashboardにログイン
2. Pages → Create a project
3. GitHubリポジトリを選択
4. ビルド設定：
   - Build command: `npm run build`
   - Build output directory: `build/client`
5. 環境変数を設定（D1、KV、R2のバインディング）

### 7. カスタムドメインの設定

プロジェクトのカスタムドメイン: `soundmap.0g0.xyz`

#### Cloudflare Pagesでカスタムドメインを追加

1. Cloudflare Dashboard → Pages → プロジェクトを選択
2. **Custom domains** タブを開く
3. **Set up a custom domain** をクリック
4. ドメイン `soundmap.0g0.xyz` を入力
5. DNSレコードを確認（自動的に設定されます）

#### DNSレコード（参考）

Cloudflareが自動的に以下のレコードを設定します：

- **CNAME** レコード: `soundmap.0g0.xyz` → `your-project.pages.dev`

または、手動で設定する場合：
```
Type: CNAME
Name: soundmap
Content: your-soundmap-project.pages.dev
Proxy status: Proxied (オレンジクラウド)
```

## プロジェクト構造

```
soundmap-web/
├── app/
│   ├── components/       # 再利用可能なコンポーネント
│   ├── routes/          # ページルート
│   ├── styles/          # CSSスタイル
│   ├── utils/           # ユーティリティ関数
│   │   ├── *.cloudflare.ts  # Cloudflare専用ユーティリティ
│   │   └── *.server.ts      # サーバー側ユーティリティ（レガシー）
│   ├── entry.client.tsx # クライアントエントリーポイント
│   ├── entry.server.tsx # サーバーエントリーポイント
│   └── root.tsx         # ルートコンポーネント
├── migrations/          # D1データベースマイグレーション
├── public/
├── wrangler.toml        # Cloudflare設定
├── load-context.ts      # 型定義
└── package.json
```

## 利用可能なスクリプト

- `npm run build` - 本番用にビルド
- `npm run dev` - 開発サーバーを起動
- `npm run preview` - プレビューサーバーを起動
- `npm run deploy` - Cloudflare Pagesにデプロイ
- `npm run typecheck` - TypeScriptの型チェック
- `npm run lint` - ESLintでコードをチェック
- `npm run cf-typegen` - Cloudflare型定義を生成
- `npm run db:migrate` - 本番環境にマイグレーション適用
- `npm run db:migrate:local` - ローカルにマイグレーション適用

## 環境変数

Cloudflare Pagesの環境変数として以下を設定：

- `DATABASE` - D1データベースバインディング
- `SESSION_KV` - KVネームスペースバインディング
- `AUDIO_BUCKET` - R2バケットバインディング

これらは `wrangler.toml` で設定されます。

## 注意事項

### Cloudflare固有の制限

- **ファイルサイズ制限**: R2へのアップロードは25MBまで（音声ファイルに注意）
- **実行時間**: Workers/Pagesリクエストは30秒でタイムアウト
- **D1クエリ**: 各リクエストで複数のクエリを実行できますが、最適化が重要

### 開発時の注意

#### ✅ Cloudflare対応完了ファイル

以下のルートは既にCloudflare対応済みです：
- ✅ 認証: `login.tsx`, `register.tsx`, `logout.tsx`
- ✅ メイン: `root.tsx`, `_index.tsx`, `timeline.tsx`, `map.tsx`
- ✅ アクション: `post.$postId.like.tsx`, `post.$postId.comment.tsx`, `profile.$username.follow.tsx`

#### ⚠️ D1 移行待ちの機能（一時的に無効化）

以下の3つのルートは Prisma から D1 への移行が未完了のため、一時的にスタブ化されています（503 エラーを返します）：

1. **`app/routes/post.new.tsx`** - 新規投稿
   - TODO: R2へのファイルアップロード + D1 INSERT クエリの実装

2. **`app/routes/post.$postId.tsx`** - 投稿詳細
   - TODO: 複数テーブルの JOIN クエリ + いいね・コメントの集計

3. **`app/routes/profile.$username.tsx`** - ユーザープロフィール
   - TODO: ユーザー情報と投稿一覧の取得 + フォロー状態の確認

#### 移行方法（今後の作業）

各ファイルを以下のように変更してください：

```typescript
// Before (Prisma - 現在スタブ化)
import { json } from "@remix-run/cloudflare";

export async function loader({ request, context }: LoaderFunctionArgs) {
  throw new Response("This feature is being migrated to Cloudflare D1. Coming soon!", { status: 503 });
}

// After (D1 - 実装予定)
import { json } from "@remix-run/cloudflare";
import { getDB } from "~/utils/db.server.cloudflare";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context);
  const result = await db.prepare("SELECT * FROM posts WHERE user_id = ?").bind(userId).all();
  const posts = result.results;
  return json({ posts });
}
```

参考実装: `app/routes/timeline.tsx`, `app/routes/post.$postId.like.tsx`, `app/routes/post.$postId.comment.tsx`

## ライセンス

このプロジェクトはオープンソースです。
