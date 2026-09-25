# Deploying OmiFilter to Namecheap (cPanel)

This app is deployed to Namecheap shared hosting via cPanel's **Setup Node.js
App** (CloudLinux Node Selector + Passenger), *not* a static export. It's a
real Next.js server process: API routes, a SQLite database on disk, and a
password-gated admin page all depend on this.

If you're a new session picking this up: read this whole file before running
any deploy commands. The server environment has several quirks that aren't
obvious and will silently break the build if skipped.

## Access

- **SSH**: `ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53`
  - The private key lives at `~/.ssh/omifilter_cpanel` on whichever machine
    runs these deploys (chmod 600, no passphrase — deploys are non-interactive).
    It is **not** in this repo and never should be.
  - Domain: `omifilter.com`. cPanel username: `omifkplq`.
- **Live site**: https://omifilter.com
- **Admin page**: https://omifilter.com/admin — password is `ADMIN_PASSWORD`
  in the local `.env` (gitignored, ask the user or check their password
  manager if you don't have it in context).

## Server layout

```
~/omifilter-app/     ← app code (rsync target — NOT a git clone on the server)
~/omifilter-data/    ← orders.db lives here, OUTSIDE the app dir so redeploys
                        (which replace omifilter-app's contents) never touch it
~/nodevenv/omifilter-app/22/   ← CloudLinux's Node 22 virtualenv for this app
~/public_html/.htaccess        ← Passenger config, auto-written by cPanel;
                                  do not hand-edit
```

`~/omifilter-app/node_modules` is a **symlink** into
`~/nodevenv/omifilter-app/22/lib/node_modules`. Do not `rm -rf node_modules`
directly inside `omifilter-app` — that deletes the symlink itself, and a
subsequent `mkdir node_modules` silently creates a real (wrong) directory in
its place, breaking Passenger's environment isolation. If you need a clean
install, `rm -rf` the *target* directory's contents instead, or delete/relink
the symlink deliberately:
```sh
rm -f ~/omifilter-app/node_modules   # removes the symlink itself, not the target
ln -s /home/omifkplq/nodevenv/omifilter-app/22/lib/node_modules ~/omifilter-app/node_modules
```

## Environment variables (production)

Set via cPanel's Node.js App manager, **not** a file on the server — a
`.env` in `omifilter-app` is never read at runtime. To set/update them from
the CLI:

```sh
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
/usr/sbin/cloudlinux-selector set --json --interpreter nodejs \
  --user omifkplq \
  --app-root omifilter-app \
  --env-vars "{\"DATABASE_PATH\":\"/home/omifkplq/omifilter-data/orders.db\",\"PAYSTACK_SECRET_KEY\":\"sk_live_...\",\"ADMIN_PASSWORD\":\"...\",\"ADMIN_SESSION_SECRET\":\"...\",\"NODE_ENV\":\"production\",\"TURNSTILE_SECRET_KEY\":\"...\"}" \
  --skip-web-check
'
```

This `set --env-vars` call **replaces the whole env-var set**, not a merge —
always pass every variable, not just the one changing. Current required set:
`DATABASE_PATH`, `PAYSTACK_SECRET_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`,
`NODE_ENV`, `TURNSTILE_SECRET_KEY`. Live values for these come from the
local, gitignored `.env` — if you don't have them in context, read that file
first (never invent placeholder secrets for a live deploy).

The Paystack **public** key and Turnstile **site** key are hardcoded directly
in the client components (`app/checkout/CheckoutClient.tsx`,
`app/TurnstileWidget.tsx`) rather than read from `NEXT_PUBLIC_*` env vars,
because this deploy pipeline's manual `next build` doesn't reliably inline
`NEXT_PUBLIC_*` at build time (the build is run over SSH without cPanel's
env vars exported into that shell). If you change the live/test mode, you
must edit those two hardcoded constants directly and redeploy — an env var
change alone won't do anything client-side. The **secret** keys (Paystack,
Turnstile) are genuinely read from `process.env` at runtime and only need
the cPanel env var updated.

**Paystack test/live mode**: `PAYSTACK_SECRET_KEY` (server) and the
hardcoded public key in `CheckoutClient.tsx` (client) **must be the same
mode** (both `sk_test_`/`pk_test_`, or both `sk_live_`/`pk_live_`) — a
mismatch makes Paystack reject every checkout with a 400 on
`request_inline`. Change them together.

## Server platform quirks

This host runs an old OS: **glibc 2.28, GCC 8.5, system Python 3.6**. This
breaks several defaults:

1. **Turbopack doesn't work here** — its native bindings need a newer glibc.
   Always build with `next build --webpack`, never plain `next build`.
2. **`better-sqlite3` is pinned to `9.6.0`** in `package.json` (not a newer
   major) because v11+ requires C++20, which GCC 8.5 can't compile — you'll
   get `g++: error: unrecognized command line option '-std=c++20'`. v9.6.0
   uses C++17, which builds fine. Don't bump this dependency without
   confirming the new version still targets C++17, or the server build will
   break even though it works fine locally on a modern machine.
3. **node-gyp needs a newer Python** than the system default. Always export
   `npm_config_python=/opt/alt/python311/bin/python3.11` before any `npm
   install` that might compile native modules on the server (system
   `python3` is 3.6.8, too old for node-gyp's `gyp_main.py`, which uses
   syntax requiring 3.8+).
4. **`omit=dev` is the npm default** in this environment, which silently
   skips `devDependencies` — including `@tailwindcss/postcss`, which the
   build needs (it's a devDependency, but required at *build* time, not just
   for local dev). Always run `npm install --include=dev` on the server, not
   plain `npm install`, or the build fails with `Cannot find module
   '@tailwindcss/postcss'`.

## Deploy steps

Run all of this from the **local repo root**. This assumes only source files
changed — see "When you also need to reinstall dependencies" below if
`package.json` changed.

```sh
# 1. Build and verify locally first — catch errors before touching the server.
npm run build

# 2. Back up the live database (SQLite's online backup — safe while the site runs).
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
  source /home/omifkplq/nodevenv/omifilter-app/22/bin/activate
  cd ~/omifilter-app && mkdir -p ~/omifilter-backups
  node -e "require(\"better-sqlite3\")(\"/home/omifkplq/omifilter-data/orders.db\", { readonly: true }).backup(process.argv[1]).then(() => console.log(\"backed up\"))" \
    ~/omifilter-backups/orders-$(date +%Y%m%d-%H%M%S).db
'

# 3. Sync source to the server (excludes secrets, build output, the live DB,
#    and Passenger's stderr.log / tmp/restart.txt). The running site serves from
#    .next, which this doesn't touch, so it keeps working.
rsync -avz --delete \
  -e "ssh -i ~/.ssh/omifilter_cpanel -p 21098" \
  --exclude node_modules \
  --exclude '.next*' \
  --exclude .git \
  --exclude data \
  --exclude .env \
  --exclude .env.local \
  --exclude .DS_Store \
  --exclude stderr.log \
  --exclude tmp \
  ./ omifkplq@162.254.39.53:~/omifilter-app/

# 4. Build on the server into .next-new (must use the venv's Node + webpack).
#    NEXT_DIST_DIR is read by next.config.ts. The live .next is untouched, so if
#    this fails the site stays up on the previous build — just fix and rerun.
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
  source /home/omifkplq/nodevenv/omifilter-app/22/bin/activate
  cd ~/omifilter-app
  rm -rf .next-new
  NEXT_DIST_DIR=.next-new npx next build --webpack
'

# 5. Only after step 4 succeeded: swap the new build in and restart. The
#    previous build is kept as .next-prev for rollback.
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
  cd ~/omifilter-app
  test -f .next-new/BUILD_ID || { echo "no finished build in .next-new"; exit 1; }
  rm -rf .next-prev && mv .next .next-prev && mv .next-new .next
  /usr/sbin/cloudlinux-selector restart --json --interpreter nodejs --user omifkplq --app-root omifilter-app
'

# 6. Verify.
curl -s -o /dev/null -w "%{http_code}\n" https://omifilter.com/
curl -s -o /dev/null -w "%{http_code}\n" https://omifilter.com/checkout/single
curl -s -o /dev/null -w "%{http_code}\n" -L https://omifilter.com/admin   # should redirect to /admin/login
```

**Rollback** (the new build misbehaves after the swap):
```sh
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
  cd ~/omifilter-app
  mv .next .next-bad && mv .next-prev .next
  /usr/sbin/cloudlinux-selector restart --json --interpreter nodejs --user omifkplq --app-root omifilter-app
'
```
This restores the previous build only; the source files on the server stay at
the new version until the next deploy. Database changes aren't rolled back —
restore from `~/omifilter-backups/` if needed.

Never `rm -rf .next` and build in place (the old step 3): the running site
loses its build the moment it's deleted, and if the build then fails — as it
once did on a transient Google Fonts error — checkout returns 500 until a
build succeeds.

Step 4's `next build --webpack` invocation prints a lot of harmless
`GLIBC_2.29 not found` warnings (Turbopack's native SWC binary failing to
load, falling back correctly to WASM/webpack) — those are expected noise,
not errors. A real failure ends with `Build error occurred` or
`Build failed because of webpack errors`. A `next/font` error like
`Cannot read properties of null (reading '1')` is a failed Google Fonts
download — rerun step 4.

### When you also need to reinstall dependencies

Only needed if `package.json`/`package-lock.json` changed:

```sh
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
  source /home/omifkplq/nodevenv/omifilter-app/22/bin/activate
  cd ~/omifilter-app
  export npm_config_python=/opt/alt/python311/bin/python3.11
  npm install --include=dev
'
```

If a native module (currently just `better-sqlite3`) fails to load at
runtime/build time with a `GLIBC_2.29` or "Could not locate the bindings
file" error, its prebuilt binary wasn't compatible and needs a real source
build:

```sh
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
  source /home/omifkplq/nodevenv/omifilter-app/22/bin/activate
  cd /home/omifkplq/nodevenv/omifilter-app/22/lib/node_modules/better-sqlite3
  export npm_config_python=/opt/alt/python311/bin/python3.11
  npx node-gyp rebuild --release --force_build=1
'
```

## Database

`orders.db` lives at `/home/omifkplq/omifilter-data/orders.db` (set via
`DATABASE_PATH`), deliberately outside `~/omifilter-app` so the rsync
`--delete` in step 2 never touches it. WAL mode is on, so
`orders.db-wal`/`orders.db-shm` sit alongside it — back up/inspect the whole
directory, not just the `.db` file.

To inspect production data directly:
```sh
ssh -i ~/.ssh/omifilter_cpanel -p 21098 omifkplq@162.254.39.53 '
  source /home/omifkplq/nodevenv/omifilter-app/22/bin/activate
  cd ~/omifilter-app
  node -e "
    const db = require(\"better-sqlite3\")(\"/home/omifkplq/omifilter-data/orders.db\");
    console.log(db.prepare(\"SELECT id, reference, email, paid, created_at FROM orders ORDER BY id DESC LIMIT 20\").all());
  "
'
```

## Known-fixed gotchas (don't reintroduce these)

- **Paystack `callback` must be a plain function, not `async`.** Paystack's
  `inline.js` rejects it with `"Attribute callback must be a valid
  function"` if it's an `AsyncFunction` (its type check is
  `{}.toString.call(fn) === "[object Function]"`, which is false for async
  functions). Do the async verify work in an inner IIFE — see the comment in
  `CheckoutClient.tsx`.
- **The Paystack `inline.js` `<script>` tag must be a real, synchronous DOM
  child of the `<form>`**, not just written inside it in JSX. Both
  `next/script` (any strategy) and a plain `<script async src=... />` get
  relocated: `next/script` injects via its own loader regardless of JSX
  position, and React 19 automatically hoists `async` scripts with a `src`
  into `<head>` as a "resource" optimization. Only a bare, non-async
  `<script src="..." />` renders in place. This is why
  `CheckoutClient.tsx` has an `eslint-disable-next-line
  @next/next/no-sync-scripts` on that line — it's intentional, not an
  oversight.
- **`next.config.ts` has no `output` mode set** (no `export`, no
  `standalone`) — keep it that way. This app needs a real server for API
  routes and SQLite; static export would silently break the admin page,
  checkout verification, and everything else server-side.
- **This project uses `proxy.ts`, not `middleware.ts`.** Next.js 16 renamed
  the file convention (`middleware` → `proxy`); using the old filename here
  gets ignored with just a deprecation warning, not an error, so it fails
  silently rather than loudly if you use the wrong name.
