This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Exam data

Annual CSV files in `public/` are processed into compact summaries before development and production builds. The overview, year detail, school directory, and county list load these generated files instead of parsing all student CSVs in the browser. The school lookup fetches and parses a year's CSV only after a school and year are selected, retaining only that school's records in browser memory. This supports static hosting such as GitHub Pages; the source CSVs remain publicly accessible.

To convert an official exam workbook, place `YYYY.xlsx` in `public/` and run `python python/convert_exam_xlsx.py YYYY`. Then run the usual development or build command. The statistics generator discovers annual CSV files automatically. Keep `scoli.csv` in `public/` so the school directory and county mappings can be regenerated.

## Authentication setup

Supabase email/password and Google sign-in use the root `.env.local` file with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never put a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

Enable the Email provider in Supabase Auth. Add the local callback URLs (`http://localhost:3000/auth/callback` and `http://127.0.0.1:3000/auth/callback`) to the Auth redirect URL allow list; add the production callback URL when a deployment domain is chosen. For Google sign-in, configure the Google provider in Supabase and use the callback URI shown in its provider settings as the authorized redirect URI in Google Cloud.

Authentication sessions are cookie-backed and refreshed by Next.js middleware. Deploy to a host that runs Next.js middleware and route handlers; static-only hosting does not support the authentication callback. The app does not yet read profile rows.

To store each email/password signup in `public.profiles`, run [`supabase/profile-signup.sql`](./supabase/profile-signup.sql) in the Supabase SQL Editor. It adds a `name` column if needed and installs a database trigger that saves the name and date of birth from signup metadata, initializes `exercises_solved` to `0`, and keeps direct client table access disabled. The `profiles` table must already have `id` (unique), `date_of_birth` (`date`), `exercises_solved` (integer), and `created_at` columns.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
