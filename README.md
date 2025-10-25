# TRMNL Daily Poster
![Example image of use](https://github.com/user-attachments/assets/f686c3ff-aa9a-45f2-9cd3-4351694a1003 "Example image of use")

Generates a daily poster from the provided data. Fetches events from Google Calendar and weather data from Open-Meteo and holidays from date.nager.at.
Uses OpenAI gpt-image-1 to generate the poster.
The created poster image is intended to be used with the [https://usetrmnl.com/](TRMNL OG) e-ink display device.

For now, the generated poster will be in Finnish.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy env.example to .env.local and replace it's values.

A thorough walkthrough on how to get Google calendar related values to the enviroment file, you can checkout [https://javascript.plainenglish.io/nextjs-application-to-manage-your-google-calendar-and-your-invites-28dce1707b24](https://javascript.plainenglish.io/nextjs-application-to-manage-your-google-calendar-and-your-invites-28dce1707b24)

OpenAI API Key is available at https://platform.openai.com/settings/organization/api-keys

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
You can add this image url to TRMNL with the [Alias plugin](https://usetrmnl.com/plugin_settings?keyname=alias).
