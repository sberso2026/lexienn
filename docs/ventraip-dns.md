# Connect a VentraIP domain to Lexienn on Vercel

This guide connects a VentraIP-managed domain (e.g. `lexienn.app`) to your Lexienn Vercel project. Replace `lexienn.app` with your actual domain.

**Do not guess DNS values.** Always copy the exact records Vercel displays after you add the domain.

## Overview

1. Deploy Lexienn on Vercel (see [vercel-deployment.md](./vercel-deployment.md))
2. **Add the domain in Vercel first**
3. Copy Vercel’s DNS instructions
4. Create matching records in VentraIP VIPControl
5. Wait for DNS propagation and Vercel SSL verification

## Step 1 — Add domain in Vercel

1. Open your Lexienn project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Settings → Domains**
3. Click **Add Domain**
4. Add the **root domain**, for example:
   - `lexienn.app`
5. Add the **www subdomain**, for example:
   - `www.lexienn.app`
6. Vercel shows required DNS records for each hostname. **Copy those values** — they are specific to your project.

Vercel may offer:

- An **A record** for the root (`@`) pointing to a Vercel IP, **or**
- Nameserver delegation (use only if you intend to move DNS to Vercel)

For VentraIP, the common pattern is **A + CNAME** as shown below.

## Step 2 — DNS table template (paste Vercel values)

Create these records in VentraIP using **exact values from Vercel** (placeholders shown):

| Host | Type | Value | TTL | Purpose |
| --- | --- | --- | --- | --- |
| `@` | A | *paste Vercel A record IP* | default | Root domain (`lexienn.app`) |
| `www` | CNAME | *paste Vercel CNAME target* | default | `www.lexienn.app` |

Typical Vercel patterns (verify in your dashboard — **do not use unless Vercel shows the same**):

- Root **A** → often `76.76.21.21` (Vercel anycast IP; confirm in UI)
- **www CNAME** → often `cname.vercel-dns.com` (confirm in UI)

If Vercel shows different values (e.g. `76.223.126.XX` or a project-specific CNAME), use **those** instead.

## Step 3 — Configure DNS in VentraIP / VIPControl

1. Log in to [VentraIP VIPControl](https://vipcontrol.com.au/)
2. Go to **Domains →** select your domain (e.g. `lexienn.app`)
3. Open **DNS** (or **DNS Management**)
4. **Add** the records from the table above:
   - **A record**: Host `@` (or blank/root), Value = Vercel IP
   - **CNAME record**: Host `www`, Value = Vercel CNAME target
5. Remove or update **conflicting** old A/CNAME records for `@` or `www` if they point elsewhere
6. Save changes

### VentraIP field names

VIPControl labels may vary:

- **Host / Name**: `@` or leave blank for root; `www` for www
- **Points to / Target / Value**: paste from Vercel
- **TTL**: default (often 3600) unless Vercel specifies otherwise

## Step 4 — Verify in Vercel

1. Return to **Vercel → Settings → Domains**
2. Wait for status to change from **Pending** to **Valid**
3. Vercel issues the **SSL certificate** automatically after DNS verification
4. Open `https://lexienn.app` and `https://www.lexienn.app` in a browser

## www redirect

In Vercel **Domains**, you can set:

- `lexienn.app` → primary production domain
- `www.lexienn.app` → redirect to root (or vice versa)

Choose one canonical hostname for SEO and bookmarks.

## Propagation and SSL notes

- **DNS propagation** can take from a few minutes up to 24–48 hours (usually faster)
- Use [dnschecker.org](https://dnschecker.org) to confirm `@` and `www` resolve to Vercel
- **SSL** is provisioned by Vercel after DNS is correct; no manual certificate upload needed on VentraIP for standard Vercel hosting
- If validation stays pending, double-check typos in A/CNAME values and remove stale records

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Domain stuck “Pending” in Vercel | Re-copy DNS from Vercel; confirm A/CNAME in VIPControl |
| SSL error | Wait for Vercel certificate; ensure DNS points to Vercel only |
| www works but root does not | Check `@` A record |
| Root works but www does not | Check `www` CNAME |

## Related docs

- [vercel-deployment.md](./vercel-deployment.md) — project setup and env vars
- [production-deployment-checklist.md](./production-deployment-checklist.md) — pre- and post-launch checks
