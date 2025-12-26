import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = Route.useRouteContext();

  return (
    <div className="hero">
      <div className="container">
        <h1 className="hero-title">SoundMap へようこそ</h1>
        <p className="hero-subtitle">
          位置情報と音声で繋がる新しいSNS体験
        </p>
        <div className="hero-description">
          <p>
            SoundMapは、あなたの周りの音を記録し、地図上で共有できるSNSアプリです。
            環境音、音楽、声のメッセージなど、さまざまな音を世界中の人々と共有しましょう。
          </p>
        </div>
        {user ? (
          <div className="hero-actions">
            <Link to="/timeline" className="button button-primary">
              タイムラインを見る
            </Link>
            <Link to="/map" className="button button-secondary">
              地図を見る
            </Link>
          </div>
        ) : (
          <div className="hero-actions">
            <Link to="/register" className="button button-primary">
              今すぐ始める
            </Link>
            <Link to="/login" className="button button-secondary">
              ログイン
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
