# LEGO Theater Website

A static website (plain HTML, CSS and JavaScript). No build step, no server.

## Files

| File | What it does |
|---|---|
| `config.js` | **All your content**: theater info, colors, movies, adverts, ticket prices, checkout |
| `admin.html` | Form editor that creates a new `config.js` for you |
| `index.html`, `style.css`, `app.js` | The site itself (you rarely need to touch these) |
| `render.yaml` | Optional Render settings |

## Customizing

**Easy way:** open `admin.html` in your browser (double-click it), edit, click **Download config.js**, and replace the old `config.js`.

**Manual way:** open `config.js` in any text editor.

### Add a movie
Add an entry to `movies`. Use `"status": "now"` with `showtimes` (24-hour like `"18:30"`) for showing now, or `"status": "soon"` for coming soon. `trailer` takes any YouTube link; `poster` takes an image URL or a file you add to the folder (e.g. `"posters/mymovie.jpg"`).

### Adverts
`adverts` are the sliding banners at the top. Each can open a movie (`movieId`), link somewhere (`link`), and use an image or a plain color.

### Selling tickets
This is a static site, so it has no server of its own. Pick a `checkout.mode` in `config.js`:

- `"email"` – the buyer's email app opens with the booking filled in, sent to `checkout.email`.
- `"form"` – the booking is sent to a form service like [Formspree](https://formspree.io) (paste its URL in `formEndpoint`). You get each booking by email.
- `"paymentLink"` – opens a payment page. Create a Payment Link in Stripe or PayPal and paste it in `paymentLink` (or give a movie its own `paymentLink`).
- `"none"` – just shows a ticket (pay at the door).

Tickets get a booking code and can be printed or saved as PDF.

**Taken seats:** because there is no database, seats sold are listed by hand per movie, e.g.
`"soldSeats": { "2026-11-21 17:00": ["A1", "A2"] }`

## Publish on Render

1. Put these files in a GitHub repository (at the top level, not inside a folder).
2. On [render.com](https://render.com) choose **New → Static Site** and connect the repository.
3. Leave **Build Command** empty and set **Publish Directory** to `.`
4. Click **Create Static Site**. You get a free `onrender.com` address.

To update: replace `config.js` in the repository. Render redeploys automatically.

Tip: `admin.html` can't change the live site and holds no secrets, but you can delete it before publishing if you'd rather visitors not see it.
