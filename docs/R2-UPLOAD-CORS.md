# Cloudflare R2 — browser upload CORS

Presigned uploads send files **directly from the browser to R2**, bypassing Netlify’s ~30s proxy limit.

In **Cloudflare Dashboard → R2 → your bucket → Settings → CORS**, add:

```json
[
  {
    "AllowedOrigins": [
      "https://sanson-lawfirm.netlify.app",
      "https://sansonlawfirm.web.app",
      "https://sansonlawfirm.firebaseapp.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

After saving, redeploy is not required on Netlify; retry upload in the app.

If R2 is not configured on Render, the app falls back to multipart upload directly to Render.
