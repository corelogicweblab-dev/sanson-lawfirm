# Firebase vs Netlify — tamang setup

## Flow ngayon (official)

```
GitHub (main) → Netlify (web UI)
              → Render (API only)
Firebase      → Authentication lang (login), HINDI hosting
```

| Service | Ginagawa | URL |
|---------|----------|-----|
| **Netlify** | Website (HTML/JS) | `https://sanson-lawfirm.netlify.app` |
| **Render** | Backend API | proxied via `https://your-site.netlify.app/api/...` |
| **Firebase** | Sign-in lang (email, Google) | Walang web hosting dito |

---

## HUWAG gawin (screenshot mo)

Sa **Firebase Console → Hosting → Add custom domain**, huwag ilagay ang:

- `sanson-lawfirm.netlify.app`
- anumang `*.netlify.app`

**Bakit may error (CAA records)?**  
Ang `netlify.app` ay pag-aari ng Netlify. Hindi pwedeng i-SSL o i-host ng Firebase Hosting ang subdomain na iyon. Mali ang lugar — hindi ito DNS fix, **maling product** sa Firebase.

**Huwag** i-point ang Netlify URL sa `sansonlawfirm.web.app` (Firebase Hosting). Baliktad at hindi kailangan.

---

## Tama: Firebase Authentication lang

1. [Firebase Console](https://console.firebase.google.com/) → project **sansonlawfirm**
2. **Build** → **Authentication** (hindi Hosting)
3. **Settings** → **Authorized domains** → **Add domain**:
   - `sanson-lawfirm.netlify.app` (eksaktong Netlify URL mo)
   - custom domain kung mayroon sa Netlify
4. **Sign-in method** → enable **Email/Password** at **Google** kung kailangan

Walang CNAME, walang CAA, walang certificate sa Authentication step.

---

## Netlify (GitHub deploy)

Sundin ang [NETLIFY.md](./NETLIFY.md):

- Repo connected sa GitHub, branch `main`
- Environment variables: lahat ng `NEXT_PUBLIC_FIREBASE_*`
- `SECRETS_SCAN_OMIT_KEYS` kung kailangan (see NETLIFY.md)
- Live URL: Netlify dashboard → domain

---

## Firebase Hosting (deprecated para sa project na ito)

Hindi na ginagamit ang `firebase deploy --only hosting` bilang primary.

Kung may lumang link na `sansonlawfirm.web.app`, puwede mong i-ignore o i-redirect sa Netlify URL sa Firebase Hosting settings (optional), pero **huwag** idagdag ang Netlify subdomain bilang custom domain sa Firebase.

---

## Login error: `auth/api-key-not-valid`

Ang Netlify build ay may **maling o blank** na `NEXT_PUBLIC_FIREBASE_API_KEY`.

1. Firebase → Project settings → Your apps → Web → copy **apiKey** (`AIzaSy...`)
2. Netlify → Environment variables → `NEXT_PUBLIC_FIREBASE_API_KEY` = exact copy
3. **Clear cache and redeploy** (required — key is baked into JS at build time)
4. Authorized domains: add `sanson-lawfirm.netlify.app`

Hindi ito Render/API issue — Firebase Auth client config lang.

## Quick checklist

- [ ] Web: Netlify build **Published**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` starts with `AIza` (from Firebase Web app)
- [ ] Firebase **Authentication** authorized domain = Netlify URL
- [ ] Firebase **Hosting** custom domain: **walang** `*.netlify.app`
- [ ] Login test sa `https://sanson-lawfirm.netlify.app/login/`
