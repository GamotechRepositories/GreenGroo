# GreenGrocc Microservices Backend

```
backend/
├── index.js              → Single entry point (port 5001)
├── .env                  → Single environment file
├── api-gateway/          → Reserved for future split
├── auth-service/
├── user-service/
├── product-service/
├── inventory-service/
├── order-service/
├── payment-service/
├── delivery-service/
├── notification-service/
├── shared/               → Common middleware & DB helpers
└── legacy/               → Original monolith (reference during migration)
```

Each service folder contains `src/routes.js` (route definitions only). All services run together from the single `index.js`.

## Quick start

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

Runs on **http://localhost:5001**.

## Environment

All configuration lives in one file: `backend/.env`. See `.env.example` for every variable.

## Legacy monolith

The original fully-working API is preserved in `backend/legacy/`:

```bash
npm run dev:legacy
```

## Docker

```bash
cd backend
cp .env.example .env
docker compose up --build
```
