# CAPITALIZE Platform API

This repo powers the CAPITALIZE referral engine on Vercel.

## Endpoints

- `GET /api/healthz` → health check  
- `POST /api/referrals` → create a referral  
- `GET /api/referrals` → list referrals  
- `GET /api/referrals/:id` → get one referral  

## Features
- Express on Vercel serverless functions
- Helmet security headers
- CORS allowlist (edit `allowedOrigins`)
- Rate limiting (100 requests / 15min per IP)
- Request IDs for easy logging
- Zod validation for all inputs 
- In-memory referral store (replace with DB later)
<!-- redeploy -->
