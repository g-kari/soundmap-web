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

- **フレームワーク**: TanStack Start (TanStack Router + React Start)
- **言語**: TypeScript
- **プラットフォーム**: Cloudflare Pages
- **データベース**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2 (音声ファイル)
- **セッション**: Cloudflare KV
- **スタイリング**: CSS
- **地図**: Leaflet + React Leaflet
- **認証**: セッションベース認証 (Cookie)

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

作成されたデータベースIDを `wrangler.jsonc` の `database_id` に設定します。

#### KVネームスペースの作成

```bash
# Wrangler v3+ の場合
npx wrangler kv namespace create SESSION_KV

# Wrangler v2 の場合（レガシー）
npx wrangler kv:namespace create SESSION_KV
```

作成されたKV IDを `wrangler.jsonc` の `id` に設定します。

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
npm run dev
```

アプリケーションは `http://localhost:5173` で起動します。

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
├── src/
│   ├── components/      # 再利用可能なコンポーネント
│   ├── routes/          # ファイルベースルーティング
│   │   ├── __root.tsx   # ルートレイアウト
│   │   ├── index.tsx    # ホームページ
│   │   ├── post/        # 投稿関連ルート
│   │   └── profile/     # プロフィール関連ルート
│   ├── styles/          # CSSスタイル
│   ├── utils/           # ユーティリティ関数
│   │   ├── session.ts   # セッション管理
│   │   ├── db.server.ts # データベースヘルパー
│   │   └── rate-limit.ts # レート制限
│   ├── types/           # TypeScript型定義
│   ├── client.tsx       # クライアントエントリーポイント
│   ├── ssr.tsx          # サーバーエントリーポイント
│   └── router.tsx       # ルーター設定
├── migrations/          # D1データベースマイグレーション
├── load-context.ts      # Cloudflare環境の型定義
├── wrangler.jsonc       # Cloudflare設定
├── vite.config.ts       # Vite設定
└── package.json
```

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動 (http://localhost:5173)
- `npm run build` - 本番用にビルド
- `npm run preview` - プレビューサーバーを起動
- `npm run deploy` - Cloudflare Pagesにデプロイ
- `npm run typecheck` - TypeScriptの型チェック
- `npm run cf-typegen` - Cloudflare型定義を生成
- `npm run db:migrate` - 本番環境にマイグレーション適用
- `npm run db:migrate:local` - ローカルにマイグレーション適用

## 環境変数

Cloudflare Pagesの環境変数として以下を設定：

- `DATABASE` - D1データベースバインディング
- `SESSION_KV` - KVネームスペースバインディング
- `AUDIO_BUCKET` - R2バケットバインディング

これらは `wrangler.jsonc` で設定されます。

## 注意事項

### Cloudflare固有の制限

- **ファイルサイズ制限**: R2へのアップロードは25MBまで（音声ファイルに注意）
- **実行時間**: Workers/Pagesリクエストは30秒でタイムアウト
- **D1クエリ**: 各リクエストで複数のクエリを実行できますが、最適化が重要

### 開発時の注意

#### サーバー関数の記述方法

TanStack Startでは、`.validator()`メソッドは使用できません。型は`handler`関数のパラメータで直接指定してください：

```typescript
// ✅ 正しい書き方
const myServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data, context }: {
    data: { email: string; password: string };
    context: any
  }) => {
    const db = (context as any).cloudflare.env.DATABASE;
    // ... 実装
  }
);

// ❌ 間違った書き方（エラーになります）
const myServerFn = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)  // このメソッドは存在しません
  .handler(async ({ data, context }) => { ... });
```

#### Cloudflareバインディングへのアクセス

コンテキストを通じてCloudflareのリソースにアクセスします：

```typescript
const env = (context as any).cloudflare.env;
const db = env.DATABASE;        // D1データベース
const kv = env.SESSION_KV;      // KVネームスペース
const bucket = env.AUDIO_BUCKET; // R2バケット
```

## ライセンス

このプロジェクトはオープンソースです。
