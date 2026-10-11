# Vercel Deployment Guide: Provident SMS (Client & Server)

This guide provides step-by-step instructions for deploying both the **Frontend (React + Vite)** and the **Backend (Django REST Framework)** on **Vercel**.

---

## Architecture Overview

You have two supported deployment architectures configured in this repository:

| Deployment Mode | Description | Recommended For |
| :--- | :--- | :--- |
| **Option A: Unified Monorepo (Single Project)** | Deploys frontend and backend under a **single Vercel domain** (`https://your-app.vercel.app`). The client runs as a static SPA, and Django runs as a serverless WSGI function (`/api/*`, `/admin/*`, `/static/*`). | **Production & Simplicity** (Eliminates CORS issues, shared cookies, single project dashboard). |
| **Option B: Two Standalone Projects** | Frontend (`frontend/`) and Backend (`backend/`) deployed as two separate Vercel projects with independent domains. | Independent staging pipelines or team separation. |

---

## Critical Prerequisites

### 1. Hosted PostgreSQL Database
> [!IMPORTANT]
> **Vercel Serverless Functions run in an ephemeral (read-only) execution environment.**
> Local SQLite databases (`db.sqlite3`) will reset on every serverless invocation and **cannot be written to in production**.
> You must use an external PostgreSQL database.

Free & high-performance hosted PostgreSQL providers:
- **[Neon](https://neon.tech)** (Recommended — Serverless Postgres with instant branching & generous free tier)
- **[Supabase](https://supabase.com)**
- **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)**

Obtain your Postgres connection URI (e.g., `postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require`).

---

## Option A: Unified Monorepo Deployment (Recommended)

In this mode, a single Vercel project serves the frontend on `/` and routes API requests to Django via `api/index.py`.

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure all repository files (including the newly created `vercel.json` at root, `api/index.py`, and `build_files.sh`) are committed and pushed:
```bash
git add .
git commit -m "Configure codebase for Vercel deployment"
git push origin main
```

### Step 2: Import into Vercel
1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** > **"Project"**.
3. Import your **PROVI SMS** repository.
4. **Root Directory**: Leave as `./` (Root).
5. **Framework Preset**: Leave as **Other** (Vercel will detect configuration from `vercel.json`).

### Step 3: Configure Environment Variables
In the Vercel project configuration, expand **Environment Variables** and add:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require` | Hosted PostgreSQL connection string |
| `DJANGO_SECRET_KEY` | *(Generate a 50+ random character string)* | Django cryptographic key |
| `DJANGO_DEBUG` | `False` | Must be `False` in production |
| `DJANGO_ALLOWED_HOSTS` | `.vercel.app` | Hostnames allowed by Django |
| `CORS_ALLOWED_ORIGINS` | `https://your-project.vercel.app` | Allowed CORS origins (optional when unified) |
| `CSRF_TRUSTED_ORIGINS` | `https://*.vercel.app` | Trusted origins for Django CSRF |

### Step 4: Run Initial Database Migrations & Seed Data
Because serverless functions do not execute persistent CLI commands, run your initial schema setup and migration from your local terminal pointing to the remote production database:

```bash
# In backend/ directory:
cd backend

# On Windows PowerShell:
$env:DATABASE_URL="postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require"
python manage.py migrate
python manage.py seed_data      # Seeds default roles, admin, & demo school
python manage.py createsuperuser # Optional: create manual superuser
```

*(On macOS / Linux, use `export DATABASE_URL="postgresql://..."` before running the commands).*

### Step 5: Click Deploy
Click **Deploy** in Vercel. Once completed:
- Frontend: `https://your-project.vercel.app/`
- Backend API: `https://your-project.vercel.app/api/v1/`
- Django Admin: `https://your-project.vercel.app/admin/`

---

## Option B: Standalone Deployments (Separate Client & Server)

If you prefer two isolated projects:

### Part 1: Deploy Backend (`backend/`)
1. In Vercel, click **Add New...** > **Project** and select your repository.
2. Under **Root Directory**, click **Edit** and choose `backend`.
3. Add Environment Variables:
   - `DATABASE_URL`: Hosted Postgres connection string
   - `DJANGO_SECRET_KEY`: Random 50+ character string
   - `DJANGO_DEBUG`: `False`
   - `DJANGO_ALLOWED_HOSTS`: `.vercel.app`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
4. Click **Deploy**. Note down your backend URL (e.g., `https://provi-sms-api.vercel.app`).

### Part 2: Deploy Frontend (`frontend/`)
1. In Vercel, click **Add New...** > **Project** and select your repository.
2. Under **Root Directory**, click **Edit** and choose `frontend`.
3. Framework Preset: **Vite**.
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://provi-sms-api.vercel.app` (Backend URL from Part 1)
5. Click **Deploy**.

---

## Troubleshooting & Verification Checklist

- **500 Server Error on `/api/*`**:
  - Check Vercel **Function Logs** (under the project's **Logs** tab).
  - Verify that `DATABASE_URL` is set correctly and the remote database is accessible.
  - Verify that `python manage.py migrate` was executed against the database.
- **CORS Errors**:
  - In Option A, relative endpoints `/api/v1` bypass CORS entirely.
  - In Option B, make sure `CORS_ALLOWED_ORIGINS` in the backend matches the frontend Vercel URL.
- **Admin CSS / Static Files Missing**:
  - WhiteNoise has been installed and configured in `settings.py` and `build_files.sh`. Vercel automatically runs static collection on deployment.
