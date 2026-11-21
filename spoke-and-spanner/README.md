# Spoke & Spanner

A single-page bike repair booking website for a fictional shop. The same React page shows prices, opening hours and the booking form. Express supplies repair prices and available times, saves bookings and rejects a slot that has already been booked.

## Run locally

Use Node.js 22.12 or later. Open this folder in VS Code, open its terminal and run:

```sh
npm ci
npm run build
npm start
```

Open http://localhost:3000 in your browser. Rebuild after changing the React files. Stop the server with Ctrl+C.

Bookings are stored in a local JSON file by a single Express process. Use a fictional name when testing. Slots are listed in UK local time for the next ten days, excluding Sundays and Mondays. Refreshing the page keeps the slot reserved. The site uses sample prices and opening hours.
