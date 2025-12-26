import { useEffect } from "react";

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
  useEffect(() => {
    if (typeof window === "undefined") return;

    const L = require("leaflet");

    const map = L.map("map").setView([35.6762, 139.6503], 10);

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

    return () => {
      map.remove();
    };
  }, [posts]);

  return <div id="map" style={{ height: "600px", width: "100%" }} />;
}
