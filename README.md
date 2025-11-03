# Pixelated Odyssey Video Library

A full-stack digital video library featuring a Node.js + MySQL REST API and a React search experience. The system focuses on fast discovery with Elasticsearch-backed search, Redis caching, and rich filtering controls.

## Project Structure

```
├── backend/    # Express + Prisma + Elasticsearch REST API
├── frontend/   # React + Vite client with real-time search UI
├── prisma/     # Prisma schema & seed script (inside backend/)
└── README.md
```

## Prerequisites

- Node.js 18+
- MySQL 8+
- Elasticsearch 8+
- Redis 6+

## Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy environment template and edit values:
   ```bash
   cp .env.example .env
   ```
3. Apply database schema & generate Prisma client:
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:generate
   ```
4. (Optional) Seed sample videos and index them:
   ```bash
   npm run seed
   ```
5. Start the API:
   ```bash
   npm run dev
   ```
6. If your Elasticsearch instance runs with TLS (default for 8.x images), copy the generated CA certificate and point the API to it:
   ```bash
   # determine the container id/name first (e.g. elasticsearch)
   docker cp elasticsearch:/usr/share/elasticsearch/config/certs/http_ca.crt ./backend/http_ca.crt
   ```
   Update `backend/.env`:
   ```ini
   ELASTICSEARCH_NODE="https://localhost:9200"
   ELASTICSEARCH_USERNAME="elastic"
   ELASTICSEARCH_PASSWORD="your_password"
   ELASTICSEARCH_CA_CERT_PATH="./http_ca.crt"
   ```
   For local experiments only, you can skip certificate verification by setting `ELASTICSEARCH_SKIP_TLS_VERIFY=true`.

The server boots with database + Redis connections, creates the Elasticsearch index (if missing), and exposes the API at `http://localhost:4000`.

### API Surface

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/videos` | Create a new video entry |
| `GET` | `/api/videos` | List videos with pagination |
| `GET` | `/api/videos/:id` | Fetch video detail |
| `PUT` | `/api/videos/:id` | Update video metadata |
| `DELETE` | `/api/videos/:id` | Delete a video |
| `POST` | `/api/videos/:id/view` | Increment the view counter & track analytics |
| `GET` | `/api/videos/trending` | Most-viewed videos in the last 7 days |
| `GET` | `/api/videos/search` | Advanced search with filters and sorting |
| `GET` | `/api/videos/search/suggestions` | Auto-complete + popular tag data |
| `POST` | `/api/videos/search/save` | Persist a search/filter combination |
| `GET` | `/api/videos/search/saved` | Retrieve saved searches |
| `GET` | `/api/videos/search/saved/:id` | Pull a specific saved search |
| `GET` | `/api/videos/:id/related` | Related videos (tags & content similarity) |

Responses normalise tag relations into string arrays for frontend ergonomics. Validation uses Zod, and all controllers funnel through consistent error handling.

### Search Stack

- **Elasticsearch** for multi-field, fuzzy search with relevance boosting (titles > descriptions > tags > uploader).
- Supports secure clusters via HTTPS with either the container-provided CA certificate or optional TLS verification skip for local development.
- **Redis** caches frequent queries (`search:*` keys, 120s TTL) and gracefully degrades if redis is offline.
- Automatic index bootstrap with custom autocomplete analyzers for suggestions.
- Fallback Prisma/SQL search path ensures service continuity if ES is unreachable.
- Search metrics persisted for analytics & popular-search surfacing.

### Database Schema & Indexing

- Prisma models cover `Video`, `Tag`, `VideoTag`, `VideoView`, `SearchHistory`, `SavedSearch`, and `SearchMetric`.
- MySQL indexes:
  - Composite index on `(videoId, viewedAt)` for trending aggregation.
  - Full-text index across `title`, `description`, `uploaderName` (supports fallback search).
  - Lookup indexes on `category`, `resolution`, `uploadDate`, plus tag join indices.
- View tracking stores raw events (per day) to support analytics & trending calculations.

### Performance Notes

- Search requests return timing metadata (`tookMs`) for UX messaging and instrumentation.
- Redis caching, request debouncing (frontend), and HTTP compression (backend) help sustain performance with 1000+ videos.
- Prisma's connection pool + batched queries are used for pagination and search hydration.
- Trending & related lookups limit result sets and reuse Elasticsearch for similarity scoring.

### Security & Hardening

- Input validation, pagination clamping, and parameterised queries prevent SQL injection.
- Helmet, compression, and CORS configured centrally.
- Graceful shutdown closes DB/Redis connections.

## Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the dev server (proxies API requests to `localhost:4000`):
   ```bash
   npm run dev
   ```

### UX Highlights

- Debounced instant search (300 ms) with autocomplete dropdown & popular tags.
- Rich filter panel: category, duration buckets, upload-date range, resolution, tag toggles.
- Save/search history panes, trending list, and “no results” helper suggestions.
- Grid/List toggle, highlighted terms (via `<mark>`), responsive layout, and lightweight CSS.
- Video detail page with inline player, related videos, and automatic view tracking.

### Example Queries

- `GET /api/videos/search?q=react+tutorial&category=educational&duration=short&sort=viewCount&resolution=1080p`
- `GET /api/videos/search?q=documentary&uploadDateFrom=2023-01-01&tags=ocean`
- `GET /api/videos/trending?limit=5`

## Analytics & Future Improvements

- Extend `SearchMetric` aggregation into a dashboard (e.g., Prometheus/Grafana or custom charts).
- Add spell-check (“Did you mean?”) via Elasticsearch term suggester.
- Enrich saved searches with user accounts + sharing.
- Integrate background jobs for periodic popularity recalculation and cache warming.
- Attach load-testing scripts (k6/Artillery) to benchmark search throughput with >1000 videos.
- Expand video ingestion with signed upload URLs and background transcoding hooks.

## Development Tips

- Run `npm run lint` in both `backend/` and `frontend/` to keep TypeScript healthy.
- Use the provided `prisma/seed.ts` to populate sample data and warm the search index.
- Environment-specific overrides (e.g., staging vs production) can be managed with additional env files.

Happy streaming!
