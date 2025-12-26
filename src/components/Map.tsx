import { useEffect, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

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

/**
 * Escape special HTML characters in a string so it can be inserted into HTML safely.
 *
 * @param text - The string to escape
 * @returns The input text with characters like `<`, `>`, `&`, and `"` replaced by HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create a DOM element suitable for use as a Leaflet popup for the given post.
 *
 * @param post - Post object whose `title`, `user.username`, optional `location`, and `id` are used to build the popup
 * @returns A container HTMLElement containing an <h3> with the title, a paragraph with the author, an optional paragraph with the location (prefixed with a pin emoji), and an anchor linking to `/post/{encoded id}` with the text "詳細を見る"
 */
function createPopupContent(post: Post): HTMLElement {
  const container = document.createElement("div");

  const title = document.createElement("h3");
  title.textContent = post.title;
  container.appendChild(title);

  const author = document.createElement("p");
  author.textContent = `投稿者: ${post.user.username}`;
  container.appendChild(author);

  if (post.location) {
    const location = document.createElement("p");
    location.textContent = `📍 ${post.location}`;
    container.appendChild(location);
  }

  const link = document.createElement("a");
  link.href = `/post/${encodeURIComponent(post.id)}`;
  link.textContent = "詳細を見る";
  container.appendChild(link);

  return container;
}

/**
 * Render an interactive Leaflet map and display markers for the supplied posts.
 *
 * Each post is represented by a marker at its latitude/longitude; clicking a marker opens a popup that shows the post title, author, optional location, and a link to the post details. While the map library loads a centered loading indicator is shown; if initialization fails an error message is rendered instead.
 *
 * @param posts - Array of posts to display as markers. Each post's coordinates are used to place a marker and its metadata is shown in the marker popup.
 * @returns A React element containing the map container, plus a loading overlay or a centered error message when applicable.
 */
export default function Map({ posts }: MapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let map: LeafletMap | null = null;
    let isMounted = true;

    const initMap = async () => {
      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default;

        if (!isMounted) return;

        map = L.map("map").setView([35.6762, 139.6503], 10);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const customIcon = L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        posts.forEach((post) => {
          if (!map) return;
          const marker = L.marker([post.latitude, post.longitude], {
            icon: customIcon,
          }).addTo(map);

          marker.bindPopup(createPopupContent(post));
        });

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize map:", err);
        if (isMounted) {
          setError("地図の読み込みに失敗しました");
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        map.remove();
      }
    };
  }, [posts]);

  if (error) {
    return (
      <div
        style={{
          height: "600px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "600px", width: "100%" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          地図を読み込み中...
        </div>
      )}
      <div id="map" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}