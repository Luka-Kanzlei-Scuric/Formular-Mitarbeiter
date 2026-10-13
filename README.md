# Employee insolvency intake form

React frontend and Express/MongoDB backend for the Kanzlei Scuric employee intake workflow.
The application uses its own database and Make.com integrations, separate from the InsoCore portal.

Use Node 24 (`.nvmrc`). Install dependencies with `npm ci` in the root and `backend/`.
Copy each `.env.example` to `.env`, supply new local-only secrets, then start the backend with
`npm run dev` in `backend/` and the frontend with `npm run dev` in the root. The Vite `/api` proxy
points to `127.0.0.1:5001`. The backend requires a dedicated local Mongo database and starts only
after connecting. External Mongo hosts and live Make webhooks are rejected outside production.

The frontend uses same-origin API calls by default. `VITE_BACKEND_URL` is a public build-time
override for a separately hosted frontend; never put secrets in frontend variables.

For deployment, data transfer, backup and cutover instructions see
[the Hetzner runbook](deploy/hetzner/README.md). Changes go through a feature branch and staging
before production. Existing legacy reset/check scripts are excluded from the runtime image and
must not be used as migration tools.
