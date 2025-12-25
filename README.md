# SoundMap - 音声SNSアプリ

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

- **フレームワーク**: Remix
- **言語**: TypeScript
- **プラットフォーム**: Cloudflare Pages
- **データベース**: Cloudflare D1 (SQLite)
- **ストレージ**: Cloudflare R2 (音声ファイル)
- **セッション**: Cloudflare KV
- **スタイリング**: CSS
- **地図**: Leaflet
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

作成されたデータベースIDを `wrangler.toml` の `database_id` に設定します。

#### KVネームスペースの作成

```bash
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

現在のコードは2つのバージョンが共存しています：
- `*.server.ts` - Node.js環境用（レガシー）
- `*.cloudflare.ts` - Cloudflare環境用（推奨）

Cloudflare Pagesで実行する場合は、`.cloudflare.ts` ファイルを使用するようにルートを更新する必要があります。

## ライセンス

このプロジェクトはオープンソースです。
