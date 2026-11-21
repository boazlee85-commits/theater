/* ==========================================================
   BRICKWAY THEATER – SETTINGS FILE
   Everything on the website comes from this file.
   Edit it by hand, OR open admin.html in your browser,
   change things with forms, and download a new config.js.
   ========================================================== */
window.THEATER_CONFIG = {
  "theater": {
    "name": "Brick Cinema",
    "tagline": "Big stories. Tiny bricks.",
    "logoEmoji": "🧱",
    "currency": "$",
    "address": "123 Brick Street, Studville",
    "hours": "Open every day, 10:00 AM – 9:00 PM",
    "email": "tickets@example.com",
    "phone": "",
    "about": "Welcome to our LEGO movie theater! Pick a movie, choose your seats and grab your tickets. Popcorn is built-in.",
    "promoBar": "🍿 Free popcorn brick with every Family ticket this weekend!"
  },
  "theme": {
    "red": "#e3000b",
    "blue": "#006db7",
    "yellow": "#ffd500",
    "green": "#00a850",
    "dark": "#1b1b1f",
    "background": "#fff8e1"
  },
  "schedule": {
    "daysAhead": 7
  },
  "advertSeconds": 6,
  "ticketTypes": [
    { "id": "adult", "name": "Adult", "price": 8, "note": "Ages 13+" },
    { "id": "kid", "name": "Kid", "price": 5, "note": "Ages 3–12" },
    { "id": "family", "name": "Family Pack (4)", "price": 20, "note": "Admits 4 people", "admits": 4 }
  ],
  "seating": {
    "enabled": true,
    "rows": 5,
    "seatsPerRow": 8
  },
  "checkout": {
    "mode": "email",
    "email": "tickets@example.com",
    "formEndpoint": "",
    "paymentLink": "",
    "confirmText": "Show this ticket at the door. Have fun!"
  },
  "adverts": [
    {
      "headline": "Opening Night: The Great Brick Heist",
      "text": "Tickets are on sale now. Bring your whole crew!",
      "image": "",
      "color": "#e3000b",
      "buttonText": "Get tickets",
      "movieId": "brick-heist",
      "link": ""
    },
    {
      "headline": "Family Pack Deal",
      "text": "4 tickets for just $20 – every weekend.",
      "image": "",
      "color": "#006db7",
      "buttonText": "Browse movies",
      "movieId": "",
      "link": "#now-showing"
    },
    {
      "headline": "Coming Soon: Space Bricks",
      "text": "Blast off this winter. Watch the trailer!",
      "image": "",
      "color": "#00a850",
      "buttonText": "Watch trailer",
      "movieId": "space-bricks",
      "link": ""
    }
  ],
  "movies": [
    {
      "id": "brick-heist",
      "title": "The Great Brick Heist",
      "status": "now",
      "poster": "",
      "rating": "G",
      "duration": "92 min",
      "genre": "Adventure / Comedy",
      "description": "A team of minifigs plans the biggest heist the Brick City has ever seen. What could possibly go wrong?",
      "trailer": "",
      "showtimes": ["14:00", "17:00", "19:30"],
      "days": [],
      "prices": {},
      "paymentLink": "",
      "soldSeats": {}
    },
    {
      "id": "dino-build",
      "title": "Dino Builders",
      "status": "now",
      "poster": "",
      "rating": "G",
      "duration": "85 min",
      "genre": "Family / Animation",
      "description": "When a pile of bricks turns into living dinosaurs, one tiny builder must save the day.",
      "trailer": "",
      "showtimes": ["13:00", "16:00"],
      "days": [],
      "prices": { "adult": 7 },
      "paymentLink": "",
      "soldSeats": {}
    },
    {
      "id": "space-bricks",
      "title": "Space Bricks",
      "status": "soon",
      "releaseDate": "Coming this winter",
      "poster": "",
      "rating": "PG",
      "duration": "100 min",
      "genre": "Sci-Fi / Adventure",
      "description": "A crew of brave minifigs blasts off to build a new home among the stars.",
      "trailer": "",
      "showtimes": [],
      "days": [],
      "prices": {},
      "paymentLink": "",
      "soldSeats": {}
    }
  ]
};
