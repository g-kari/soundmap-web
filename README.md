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
- **データベース**: SQLite (Prisma ORM)
- **スタイリング**: CSS
- **地図**: Leaflet
- **認証**: セッションベース認証 (Cookie)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定します:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-key-here"
```

### 3. データベースのセットアップ

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:5173` で起動します。

## 本番環境へのデプロイ

### ビルド

```bash
npm run build
```

### サーバーの起動

```bash
npm start
```

## プロジェクト構造

```
soundmap-web/
├── app/
│   ├── components/       # 再利用可能なコンポーネント
│   ├── models/          # データモデル
│   ├── routes/          # ページルート
│   ├── styles/          # CSSスタイル
│   ├── utils/           # ユーティリティ関数
│   ├── entry.client.tsx # クライアントエントリーポイント
│   ├── entry.server.tsx # サーバーエントリーポイント
│   └── root.tsx         # ルートコンポーネント
├── prisma/
│   └── schema.prisma    # データベーススキーマ
├── public/
│   └── uploads/         # アップロードされたファイル
└── package.json
```

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用にビルド
- `npm start` - 本番サーバーを起動
- `npm run typecheck` - TypeScriptの型チェック
- `npm run lint` - ESLintでコードをチェック
- `npm run prisma:generate` - Prisma Clientを生成
- `npm run prisma:migrate` - データベースマイグレーションを実行
- `npm run prisma:studio` - Prisma Studioを起動

## ライセンス

このプロジェクトはオープンソースです。
