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

### Local infrastructure (Docker quick start)

You can spin up the required services with Docker:

```bash
# Elasticsearch 9 (wolfi build)
docker run \
  --name pixel-elastic \
  -p 9200:9200 \
  -e ELASTIC_PASSWORD=<ES password>\
  docker.elastic.co/elasticsearch/elasticsearch-wolfi:9.2.0

# MySQL
docker run \
  --name pixelated-mysql \
  -p 3306:3306 \
  -e MYSQL_DATABASE=pixelated_odyssey \
  -e MYSQL_ROOT_PASSWORD=<MySQL password> \
  mysql

# Redis 8
docker run \
  --name pixel-redis \
  -d \
  -p 6379:6379 \
  redis:8-alpine
```

### NOTE 
> MySQL 8 defaults to `caching_sha2_password`. If your client is using the older mysql_native_password plugin you may need to run:
> ```sql
> ALTER USER 'root' IDENTIFIED WITH caching_sha2_password BY '<MySQL password>';
> FLUSH PRIVILEGES;
> ```
> A MySQL CLI inside the container can be opened with `docker exec -it pixelated-mysql mysql -u root -p pixelated_odyssey`. Then enter the 'MySQL password'.

When Elasticsearch boots it prints the generated enrollment token and CA certificate path. Copy the CA as noted below in step 6 of Backend setup (or disable TLS verification for local dev).

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
| `GET` | `/api/videos/categories` | List distinct video categories |
| `GET` | `/api/videos/tags/popular` | Frequency-ranked tag cloud data |
| `GET` | `/api/videos/:id/related` | Related videos (tags & content similarity) |

Responses normalise tag relations into string arrays for frontend ergonomics. Validation uses Zod, and all controllers funnel through consistent error handling.

### Search Stack

- **Elasticsearch** for multi-field, fuzzy search with relevance boosting (titles > descriptions > tags > uploader).
- Supports secure clusters via HTTPS with either the container-provided CA certificate or optional TLS verification skip for local development.
- **Redis** caches frequent queries (`search:*` keys, 120s TTL), automatically invalidates whenever videos are created/updated/deleted, and gracefully degrades if Redis is offline.
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

- Debounced instant search (300 ms) with autocomplete dropdown and trending tag pill suggestions.
- Rich filter panel: category, duration buckets, upload-date range, resolution, and a weighted tag cloud that can be toggled like badges.
- Save/search history panes, trending list, pagination controls (first/prev/next/last) and adjustable page size up to 100 results.
- CSV or playlist export buttons, and responsive grid/list layouts.
- Video detail page with inline player, external-link fallback, delete confirmation, view tracking, and related recommendations.
- Dedicated upload form with validation for metadata, categories, and tags—success redirects to the detail page.

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
