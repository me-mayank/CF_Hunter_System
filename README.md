# Hunter Engine Backend

The Hunter Engine backend is a pure Node.js service that connects to the Codeforces API, pulls competitive programming history, and transforms it into gamified RPG metrics (Hunter Level, Mana Power, Combat Proficiency, etc.).

## Stack
- **Node.js (ES Modules)**
- **Express** (API routes and SSE)
- **Mongoose** (MongoDB Atlas M0 for storage)
- **BullMQ / Redis** (Background job queue)
- **Jest** (Unit & Integration tests)

## Prerequisites
- Node.js (v18+ recommended)
- A Redis instance (for BullMQ, either installed locally or a cloud URL)
- A MongoDB Atlas connection string

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   **Important:** `MONGO_URI` must be a valid MongoDB Atlas connection string (e.g. `mongodb+srv://...`). Local MongoDB is intentionally not supported to ensure strict adherence to M0 constraints.

3. Run Redis:
   Ensure you have a Redis instance running either locally or via a cloud provider (like Upstash or Redis Labs). Update `REDIS_URL` in your `.env` to point to it.

## Running the Application

**Development (with Hot Reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Running Tests

The test suite runs against an in-memory MongoDB server, bypassing the Atlas check.
```bash
npm test
```

## API Endpoints

- `GET /healthz` - Health check
- `GET /hunter/:handle` - Get hunter profile. If not found, enqueues a sync job and returns 202.
- `GET /hunter/:handle/status` - Check the sync job status.
- `POST /hunter/:handle/refresh` - Enqueue an incremental refresh job.
- `GET /hunter/:handle/events` - SSE endpoint to stream job progress.
- `GET /hunter/:handleA/compare/:handleB` - Compare two hunters.

## Engine Architecture

The core gamification logic lives in `src/engine/`. These are pure functions that take Codeforces API payloads and return computed metrics. They are fully unit-tested and have zero side effects (no database or network calls).
