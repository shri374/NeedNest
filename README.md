# NeedNest

NeedNest is a full-stack local services platform for daily needs (cleaning, electrician, repairs, etc.).

## Simple Local Run (One `.env`, One Command)

1. Create root env file:

```bash
cp .env.example .env
```

2. In root `.env`, set your Neon `DATABASE_URL`.

3. Install all dependencies from project root:

```bash
npm install
npm run setup
```

4. Run DB setup once:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start everything (API + frontend) with one command:

```bash
npm run dev
```

App URL: `http://localhost:5173`  
Health check: `http://localhost:4000/health`

## What is Vite?

Vite is only the frontend dev server tool.  
You do not need to run it separately now. `npm run dev` handles both backend and frontend.

## Optional Seed Data

Run:

```bash
npm run db:seed
```

Demo credentials (after seed):

- Provider: `provider@neednest.com` / `Pass@123`
- User: `user@neednest.com` / `Pass@123`

## Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL (Neon), JWT auth
- Frontend: React + Vite
- Deployment: Neon + Render (API) + Vercel (web)

## Deploy

## 1) Neon (database)

1. Create Neon project.
2. Copy pooled connection string.
3. Set this as `DATABASE_URL` in Render API service.

## 2) Render (API)

1. Push this project to GitHub.
2. In Render, create a new Blueprint and select repository.
3. It will use `render.yaml`.
4. Add env values:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL` (your deployed Vercel URL)

5. Deploy.

## 3) Vercel (Frontend)

1. Import repo in Vercel.
2. Set root directory as `web`.
3. Deploy.

## Interview Enhancements You Can Add

- Razorpay/Stripe payments
- Provider KYC docs upload
- Real-time booking status with Socket.IO
- Admin analytics dashboard
- OTP login with Twilio
