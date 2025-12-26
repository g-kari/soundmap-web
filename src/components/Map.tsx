import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  location: string | null;
  user: {
    username: string;
  };
}

interface MapProps {
  posts: Post[];
}

export default function Map({ posts }: MapProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let map: any = null;

    const initMap = async () => {
      const leafletModule = await import("leaflet");
      const L = leafletModule.default;

      map = L.map("map").setView([35.6762, 139.6503], 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const customIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      posts.forEach((post) => {
        const marker = L.marker([post.latitude, post.longitude], {
          icon: customIcon,
        }).addTo(map);

        marker.bindPopup(`
          <div>
            <h3>${post.title}</h3>
            <p>投稿者: ${post.user.username}</p>
            ${post.location ? `<p>📍 ${post.location}</p>` : ""}
            <a href="/post/${post.id}">詳細を見る</a>
          </div>
        `);
      });

      setIsLoading(false);
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [posts]);

  return (
    <div style={{ position: "relative", height: "600px", width: "100%" }}>
      {isLoading && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          地図を読み込み中...
        </div>
      )}
      <div id="map" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
