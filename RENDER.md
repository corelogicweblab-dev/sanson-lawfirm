# Render API deploy

## Kung Node ang runtime mo (default sa screenshot)

Render ay nagpapatakbo ng:
- **Build:** `npm install; npm run build`
- **Start:** `npm run start:prod`

Ang root `package.json` ay auto-detect ang Render:
- **Build** (`npm run build`) → Python `pip install` sa `apps/backend` kapag `RENDER=true`
- **Start** (`npm run start:prod`) → `uvicorn` API

Render dashboard — iwan ang default:
- Build: `npm install; npm run build`
- Start: `npm run start:prod`

## Pinakamagandang setup (Python)

| Setting | Value |
|---------|--------|
| Root Directory | `apps/backend` |
| Runtime | Python 3 |
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

## O gamitin ang render.yaml (Blueprint)

**New → Blueprint** → repo `sanson-lawfirm` → auto-apply ang Python config.

Web app: **Firebase** lang (`npm run deploy:hosting`), hindi Render.
