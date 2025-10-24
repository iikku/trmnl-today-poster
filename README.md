# TRMNL Daily Poster
Generates a daily poster from the provided data. Fetches events from Google Calendar and weather data from Open-Meteo.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy env.example to .env.local and replace it's values.

You need imagemagick installed on the server and runnable as `magick`.

First, install the dependencies (`npm i`), then run the development server:

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

The main page has an image which points to /today.png which is a 2-bit grayscale image at 800x480 resolution.