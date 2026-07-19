# DHV365

Security-first Next.js foundation for **Dedicated High Value & Critical Transport**.

## Local development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

## Hostinger deployment

- Runtime: Node.js 22.x
- Root directory: `/`
- Install command: `npm ci`
- Build command: `npm run build`
- Start command: `npm run start`
- Build output: `.next`
- Environment variable: `NEXT_PUBLIC_SITE_URL=https://dhv365.nl`
- Environment variable: `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
- Environment variable: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

The repository is configured with `output: standalone`, strict TypeScript, security headers, metadata, structured data, sitemap and robots directives.

## Security boundary

The current release is the public marketing and platform foundation. It intentionally does **not** accept uploads or identity documents until authentication, encrypted object storage, audit logging, retention controls and a reviewed privacy basis are implemented.

Never commit a Supabase secret/service-role key or prefix one with `NEXT_PUBLIC_`.

<!-- Production restore deployment trigger: 2026-07-19 -->
