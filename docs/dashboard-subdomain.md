# Delta dashboard URL and unified Discord login

## Canonical URLs

- Main website: `https://delta-bot.online/`
- Server dashboard: `https://delta-bot.online/server-dashboard`
- User dashboard: `https://delta-bot.online/user-dashboard`
- No-prefix trial: `https://delta-bot.online/trial`
- Admin: `https://delta-bot.online/admin` (requires allowlisted Discord ID)

The old `/dashboard` route redirects to `/server-dashboard`. The retired `dash.delta-bot.online` root and dashboard paths also redirect to the canonical route, provided the old subdomain remains assigned to this Vercel project. No new subdomain or DNS record is necessary.

## Discord OAuth: one callback

Register this **single URL** in Discord Developer Portal → your application → OAuth2 → Redirects:

`https://delta-bot.online/api/dashboard/callback`

The landing-page account login, server dashboard, user dashboard, admin, and trial all initiate the same OAuth flow at `/api/dashboard/login` (with an optional return destination). The callback requests `identify guilds`, verifies the Discord identity, creates a single shared server-backed dashboard session, and establishes trial and allowlisted-admin cookies when configured. It then returns to the requested page. Visiting those features with an active session does not initiate another Discord authorization.

Admin privileges are never granted to regular users: the Discord user ID must still pass the configured allowlist. Server settings still require live Discord Manage Server / Administrator / owner permissions, and trial claims remain individually checked for eligibility. A successful OAuth sign-in does not bypass any of those checks.

### Required deployment settings

- `WEBSITE_URL=https://delta-bot.online`
- `DISCORD_DASHBOARD_REDIRECT_URI=https://delta-bot.online/api/dashboard/callback`
- `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` must match your Discord application
- `ADMIN_ALLOWED_DISCORD_USER_IDS`, `ADMIN_SESSION_SECRET`, `TRIAL_SESSION_SECRET`, and MongoDB settings remain necessary for their features

Previous `DISCORD_REDIRECT_URI` and `DISCORD_TRIAL_REDIRECT_URI` values only relate to the legacy compatibility callback handlers. They are not used by the unified login entry points and can be retired after checking that nothing external calls them. Keep the legacy callback registrations temporarily if an outside integration still uses them.

## Verification

1. Sign in from the landing page and confirm the profile avatar appears.
2. Open `/server-dashboard`, `/user-dashboard`, and `/trial` without another OAuth consent prompt.
3. Confirm an allowlisted admin can access `/admin` and a regular user cannot.
4. Check the server dashboard only lists manageable servers, and saving a setting still works.
5. Sign out and verify access to protected data is denied.
6. Check `/dashboard` redirects to `/server-dashboard` and optionally verify redirects from the old subdomain.

All app routes and deployment settings must be exercised in production before removing older OAuth callback entries.