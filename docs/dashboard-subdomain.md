# Delta server dashboard subdomain

The server settings dashboard is served from **https://dash.delta-bot.online/** by the same Next.js/Vercel project as the main website.

## Vercel / DNS

1. Open the existing Delta website project in Vercel, then Settings → Domains.
2. Add `dash.delta-bot.online` to **the same project** (not a separate application).
3. In the DNS provider for `delta-bot.online`, create a `CNAME` record with host/name `dash` pointing at the CNAME destination Vercel displays. For a typical external DNS setup, this is `cname.vercel-dns.com`; follow Vercel's displayed target if different.
4. Remove conflicting records for the `dash` hostname and allow DNS and TLS provisioning to complete.
5. Deploy the latest `main` commit, then visit `https://dash.delta-bot.online/`.

**Git pushes do not create a DNS record or add domains to Vercel.** These steps must be completed with the domain and Vercel accounts.

## Discord Developer Portal

In the bot's Discord application → OAuth2 → Redirects, register the **single canonical callback**:

- `https://delta-bot.online/api/dashboard/callback` — landing, server dashboard, user dashboard, trial, and admin sign-in

Set `DISCORD_DASHBOARD_REDIRECT_URI` to this URL. The server dashboard sends the user to the main site for Discord authorization, sets an HTTP-only session cookie scoped to `.delta-bot.online`, and returns the user to the dashboard subdomain. Old OAuth callbacks can remain registered temporarily for compatibility but are not used by the new sign-in links.

Leave `WEBSITE_URL=https://delta-bot.online` for the website and other login flows. Do not replace it with the subdomain. Ensure the Vercel deployment has the existing Discord client credentials and MongoDB variables.

## Routing

- `https://dash.delta-bot.online/` → internal rewrite to existing `/dashboard` page.
- `https://dash.delta-bot.online/dashboard` → redirects to subdomain root.
- `https://delta-bot.online/dashboard` (including www) → redirects to the subdomain root.
- Dashboard sign-in is centralized on the main hostname, while server configuration API calls remain same-origin to the dashboard subdomain. Shared secure session cookies provide single sign-on across both hosts.
- `/user-dashboard`, `/trial`, and `/admin` remain on the main website. These features use the same Discord login, while their individual permissions and claim checks remain server-side.
- Existing admin and maintenance proxy protections are preserved.

## Validation after DNS and deployment

1. Open `https://delta-bot.online/dashboard` and confirm the redirect.
2. Open `https://dash.delta-bot.online/` and sign in using Discord.
3. Verify the browser returns to the subdomain after authorization.
4. Select a server, change a reversible setting, save, and confirm it applies.
5. Sign out, and confirm an unauthorized dashboard request is rejected.
6. Test `https://delta-bot.online/user-dashboard` separately to ensure its OAuth cookie and callback still work.

The dashboard server selection is presently client state, not a nested server-specific route.
