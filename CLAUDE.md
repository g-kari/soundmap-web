かならず日本語で返すこと

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoundMap is a location-based audio social network built with TanStack Start and deployed on Cloudflare Pages. Users can record and share audio at geographic locations, view posts on a map, follow other users, and interact via likes and comments.

**Tech Stack:**
- **Framework:** TanStack Start (TanStack Router + React Start)
- **Runtime:** Cloudflare Workers/Pages
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (audio files)
- **Session:** Cloudflare KV
- **Language:** TypeScript
- **Map:** Leaflet + React Leaflet

## Development Commands

```bash
# Development
npm run dev                    # Start dev server (http://localhost:5173)

# Build & Deploy
npm run build                  # Build for production
npm run preview                # Preview production build
npm run deploy                 # Build and deploy to Cloudflare Pages

# Type Checking
npm run typecheck              # TypeScript type checking
npm run cf-typegen             # Generate Cloudflare types from wrangler.jsonc

# Database
npm run db:migrate             # Apply migrations to production D1
npm run db:migrate:local       # Apply migrations to local D1
```

## Architecture & Key Patterns

### TanStack Start SSR Architecture

This project uses **TanStack Start**, which combines TanStack Router with server-side rendering on Cloudflare Workers. Key concepts:

1. **File-based routing:** Routes in `src/routes/` automatically become pages
2. **Server Functions:** Use `createServerFn()` to define server-side logic
3. **Loaders:** Fetch data server-side before rendering via route `loader` option
4. **Context access:** Cloudflare bindings accessed via `context.cloudflare.env`

### Server Function Pattern

**IMPORTANT:** The `createServerFn` API does NOT support `.validator()` chaining. Type the handler parameters directly:

```typescript
// ✅ CORRECT - Type parameters in handler
const myServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data, context }: {
    data: { username: string; email: string };
    context: any
  }) => {
    const db = (context as any).cloudflare.env.DATABASE;
    // ... implementation
  }
);

// ❌ INCORRECT - .validator() does not exist
const myServerFn = createServerFn({ method: "POST" })
  .validator((data: { username: string }) => data)  // This will cause errors
  .handler(async ({ data, context }) => { ... });
```

### Cloudflare Context Pattern

Access Cloudflare bindings through the context object:

```typescript
export const Route = createFileRoute("/my-route")({
  loader: async ({ context }) => {
    const env = (context as any).cloudflare.env;
    const db = env.DATABASE;        // D1 Database
    const kv = env.SESSION_KV;      // KV Namespace
    const bucket = env.AUDIO_BUCKET; // R2 Bucket

    // Use bindings...
  }
});
```

**Available bindings** (configured in `wrangler.jsonc`):
- `DATABASE` - D1 database for all app data
- `SESSION_KV` - KV store for user sessions
- `AUDIO_BUCKET` - R2 bucket for audio file storage

### Session Management

Sessions use Cloudflare KV with cookie-based tokens:

```typescript
import { getCurrentSession, createAndSetSession } from "~/utils/session";

// In a server function:
const session = await getCurrentSession(env.SESSION_KV);
if (!session) {
  return { error: "認証が必要です" };
}

// After login/register:
await createAndSetSession(env.SESSION_KV, {
  userId: user.id,
  username: user.username,
  email: user.email,
});
```

Sessions are automatically checked in `__root.tsx` and available via route loader data.

### Database Schema & Patterns

**Schema:** See `migrations/0001_initial_schema.sql` for the complete schema.

Key tables: `users`, `posts`, `follows`, `likes`, `comments`

**Important:**
- Primary keys are TEXT (UUIDs generated via `crypto.randomUUID()`)
- Timestamps are INTEGER (Unix seconds) - convert to ISO strings for client:
  ```typescript
  createdAt: new Date(dbRow.created_at * 1000).toISOString()
  ```
- Use `generateId()` from `~/utils/db.server` for new IDs
- Use `getCurrentTimestamp()` for manual timestamp fields

**D1 Query Pattern:**

```typescript
// Single row
const user = await db
  .prepare("SELECT * FROM users WHERE id = ?")
  .bind(userId)
  .first();

// Multiple rows
const postsResult = await db
  .prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC")
  .bind(userId)
  .all();
const posts = postsResult.results;

// With JOINs and subqueries (see timeline.tsx for example)
const result = await db.prepare(`
  SELECT p.*, u.username,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
  FROM posts p
  JOIN users u ON p.user_id = u.id
`).all();
```

### Route Organization

```
src/routes/
├── __root.tsx           # Root layout with session loading
├── index.tsx            # Home page
├── login.tsx            # Login (POST server function)
├── register.tsx         # Registration (POST server function)
├── logout.tsx           # Logout (POST server function)
├── timeline.tsx         # Feed of posts (GET server function)
├── map.tsx              # Map view (GET server function)
├── post/
│   ├── $postId.tsx      # Post detail (GET server function)
│   └── new.tsx          # Create post (POST server function, R2 upload)
└── profile/
    └── $username.tsx    # User profile (GET server function)
```

**Route parameters:** Use `$` prefix (e.g., `$postId`, `$username`)

### Audio File Upload Pattern

See `src/routes/post/new.tsx` for the complete flow:

1. Client uploads file via `<input type="file">`
2. Server function receives `FormData`
3. Validate file type and size
4. Upload to R2 using `AUDIO_BUCKET.put()`
5. Store R2 object URL in D1 `posts.audio_url`

**R2 Upload:**
```typescript
const audioFile = formData.get("audio") as File;
const audioKey = `${Date.now()}-${audioFile.name}`;
await env.AUDIO_BUCKET.put(audioKey, audioFile.stream(), {
  httpMetadata: { contentType: audioFile.type }
});
const audioUrl = `https://your-bucket.r2.cloudflarestorage.com/${audioKey}`;
```

### TypeScript Configuration

- Path alias `~/*` maps to `src/*` (configured in `tsconfig.json` and `vite-tsconfig-paths`)
- Cloudflare types in `load-context.ts`:
  ```typescript
  export interface Env {
    DATABASE: D1Database;
    SESSION_KV: KVNamespace;
    AUDIO_BUCKET: R2Bucket;
  }
  ```

## Common Patterns & Gotchas

### 1. Server Function Data Flow

Server functions are called from loaders or client code. The `data` parameter contains the input:

```typescript
// In route:
loader: async ({ params }) => {
  return myServerFn({ data: { postId: params.postId } });
}

// In server function:
const myServerFn = createServerFn({ method: "GET" }).handler(
  async ({ data, context }: { data: { postId: string }; context: any }) => {
    // Use data.postId
  }
);
```

### 2. Client-Side Navigation

Use TanStack Router's `<Link>` and `useNavigate`:

```typescript
import { Link, useNavigate } from "@tanstack/react-router";

// Link with params
<Link to="/post/$postId" params={{ postId: post.id }}>View Post</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate({ to: "/timeline" });
```

### 3. Rate Limiting

Use `checkRateLimit` from `~/utils/rate-limit` for actions like uploads:

```typescript
import { checkRateLimit, UPLOAD_RATE_LIMIT } from "~/utils/rate-limit";

const rateLimit = await checkRateLimit(
  env.SESSION_KV,
  `upload:${session.userId}`,
  UPLOAD_RATE_LIMIT
);
if (!rateLimit.allowed) {
  return { error: "アップロード回数制限を超えました" };
}
```

### 4. Error Handling

Return error objects from server functions rather than throwing:

```typescript
if (!session) {
  return { error: "認証が必要です" };
}

// Client checks:
const result = await loginFn({ data: { email, password } });
if (result.error) {
  setError(result.error);
  return;
}
```

### 5. Styling

- CSS modules via `?url` import: `import appCss from "~/styles/app.css?url"`
- Add to route head: `links: [{ rel: "stylesheet", href: appCss }]`
- Japanese UI text throughout

## Cloudflare Deployment

**Prerequisites:**
1. Create D1 database: `npx wrangler d1 create soundmap-db`
2. Create KV namespace: `npx wrangler kv namespace create SESSION_KV`
3. Create R2 bucket: `npx wrangler r2 bucket create soundmap-audio`
4. Update `wrangler.jsonc` with IDs from above commands
5. Run migrations: `npm run db:migrate`

**Deploy:**
```bash
npm run deploy  # Builds and deploys to Cloudflare Pages
```

**Local Development:**
- Dev server uses local D1/KV/R2 via Wrangler
- Changes hot-reload automatically
- Check `wrangler.jsonc` for binding configuration

## Migration Notes

This project was recently migrated from Remix to TanStack Start. Key changes:

- Remix loaders → TanStack Router loaders with `createServerFn`
- `@remix-run/cloudflare` → `@tanstack/react-start`
- Route structure remains file-based but uses different conventions
- All `.validator()` calls removed (API doesn't support it)
