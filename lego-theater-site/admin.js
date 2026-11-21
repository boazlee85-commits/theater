(function () {
  "use strict";
  var state = JSON.parse(JSON.stringify(window.THEATER_CONFIG || {}));
  ["theater", "theme", "schedule", "seating", "checkout"].forEach(function (k) { state[k] = state[k] || {}; });
  ["ticketTypes", "adverts", "movies"].forEach(function (k) { state[k] = state[k] || []; });
  var app = document.getElementById("app");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var ks = path.split("."), o = obj;
    for (var i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] == null) o[ks[i]] = {};
      o = o[ks[i]];
    }
    o[ks[ks.length - 1]] = val;
  }

  /* field(label, path, kind, extra)
     kinds: text, number, color, textarea, bool, list (comma separated), select */
  function field(label, path, kind, extra) {
    kind = kind || "text";
    var v = getPath(state, path);
    var attr = 'data-path="' + esc(path) + '" data-kind="' + kind + '"';
    var input;
    if (kind === "textarea") input = "<textarea rows=\"3\" " + attr + ">" + esc(v) + "</textarea>";
    else if (kind === "bool") input = "<select " + attr + '><option value="true"' + (v ? " selected" : "") + ">Yes</option><option value=\"false\"" + (!v ? " selected" : "") + ">No</option></select>";
    else if (kind === "select") input = "<select " + attr + ">" + extra.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (v === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select>";
    else if (kind === "list") input = '<input ' + attr + ' value="' + esc((v || []).join(", ")) + '">';
    else if (kind === "color") input = '<input type="color" ' + attr + ' value="' + esc(v || "#000000") + '">';
    else input = '<input type="' + (kind === "number" ? "number" : "text") + '" step="any" ' + attr + ' value="' + esc(v) + '">';
    return '<div class="f"><label>' + esc(label) + "</label>" + input + "</div>";
  }
  function itemHead(title, arr, i) {
    return '<div class="item-head"><span>' + esc(title) + '</span><button class="btn small ghost" data-del="' + arr + ":" + i + '">🗑 Remove</button></div>';
  }

  function render() {
    var h = "";
    h += '<div class="panel"><h2>🏠 Theater</h2><div class="row">' +
      field("Name", "theater.name") + field("Tagline", "theater.tagline") + field("Logo emoji", "theater.logoEmoji") +
      field("Currency symbol", "theater.currency") + field("Email", "theater.email") + field("Phone", "theater.phone") +
      field("Address", "theater.address") + field("Opening hours", "theater.hours") + "</div>" +
      field("Top banner message", "theater.promoBar") + field("About text", "theater.about", "textarea") + "</div>";

    h += '<div class="panel"><h2>🎨 Colors</h2><div class="row">' +
      field("Main (red)", "theme.red", "color") + field("Blue", "theme.blue", "color") + field("Yellow", "theme.yellow", "color") +
      field("Green", "theme.green", "color") + field("Dark", "theme.dark", "color") + field("Page background", "theme.background", "color") + "</div></div>";

    h += '<div class="panel"><h2>⚙️ Booking settings</h2><div class="row">' +
      field("Days ahead to show", "schedule.daysAhead", "number") +
      field("Seat picking?", "seating.enabled", "bool") + field("Seat rows", "seating.rows", "number") + field("Seats per row", "seating.seatsPerRow", "number") +
      field("Seconds per advert", "advertSeconds", "number") + "</div></div>";

    h += '<div class="panel"><h2>💳 How people get tickets</h2>' +
      field("Checkout mode", "checkout.mode", "select", [
        ["email", "Email me the booking"],
        ["form", "Send to a form service (Formspree etc.)"],
        ["paymentLink", "Open a payment link (Stripe / PayPal)"],
        ["none", "Just show a ticket (pay at the door)"]]) +
      '<div class="row">' + field("Booking email (email mode)", "checkout.email") +
      field("Form URL (form mode)", "checkout.formEndpoint") +
      field("Payment link (payment mode)", "checkout.paymentLink") + "</div>" +
      field("Message on ticket", "checkout.confirmText") + "</div>";

    h += '<div class="panel"><h2>🎟 Ticket types <button class="btn small green" data-add="ticketTypes">+ Add</button></h2>';
    state.ticketTypes.forEach(function (t, i) {
      h += '<div class="item">' + itemHead(t.name || "Ticket", "ticketTypes", i) + '<div class="row">' +
        field("ID (no spaces)", "ticketTypes." + i + ".id") + field("Name", "ticketTypes." + i + ".name") +
        field("Price", "ticketTypes." + i + ".price", "number") + field("Note", "ticketTypes." + i + ".note") +
        field("Admits (people)", "ticketTypes." + i + ".admits", "number") + "</div></div>";
    });
    h += "</div>";

    h += '<div class="panel"><h2>📣 Adverts <button class="btn small green" data-add="adverts">+ Add</button></h2>';
    state.adverts.forEach(function (a, i) {
      h += '<div class="item">' + itemHead(a.headline || "Advert", "adverts", i) + '<div class="row">' +
        field("Headline", "adverts." + i + ".headline") + field("Text", "adverts." + i + ".text") +
        field("Image URL (optional)", "adverts." + i + ".image") + field("Background color", "adverts." + i + ".color", "color") +
        field("Button text", "adverts." + i + ".buttonText") +
        field("Opens movie", "adverts." + i + ".movieId", "select", [["", "— none —"]].concat(state.movies.map(function (m) { return [m.id, m.title]; }))) +
        field("…or link to", "adverts." + i + ".link") + "</div></div>";
    });
    h += "</div>";

    h += '<div class="panel"><h2>🎬 Movies <button class="btn small green" data-add="movies">+ Add</button></h2>';
    state.movies.forEach(function (m, i) {
      var p = "movies." + i + ".";
      h += '<div class="item">' + itemHead(m.title || "Movie", "movies", i) + '<div class="row">' +
        field("ID (no spaces)", p + "id") + field("Title", p + "title") +
        field("Status", p + "status", "select", [["now", "Now showing"], ["soon", "Coming soon"]]) +
        field("Release note (coming soon)", p + "releaseDate") +
        field("Poster image URL", p + "poster") + field("Trailer (YouTube link)", p + "trailer") +
        field("Rating (G, PG…)", p + "rating") + field("Duration", p + "duration") + field("Genre", p + "genre") +
        field("Showtimes (24h, comma list)", p + "showtimes", "list") +
        field("Only on days (0=Sun … 6=Sat, blank = every day)", p + "days", "list") +
        field("Payment link for this movie", p + "paymentLink") + "</div>" +
        field("Description", p + "description", "textarea") + "</div>";
    });
    h += "</div>";
    app.innerHTML = h;
  }

  function onChange(e) {
    var el = e.target, path = el.getAttribute("data-path");
    if (!path) return;
    var kind = el.getAttribute("data-kind"), v = el.value;
    if (kind === "number") v = v === "" ? "" : Number(v);
    else if (kind === "bool") v = v === "true";
    else if (kind === "list") {
      v = v.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (/\.days$/.test(path)) v = v.map(Number).filter(function (n) { return !isNaN(n); });
    }
    setPath(state, path, v);
    if (/\.(title|id)$/.test(path) || el.tagName === "SELECT" && /status/.test(path)) { /* keep focus; refresh only advert dropdowns on blur */ }
  }
  app.addEventListener("input", onChange);
  app.addEventListener("change", function (e) {
    onChange(e);
    var p = e.target.getAttribute("data-path") || "";
    if (/^movies\.\d+\.(title|id)$/.test(p)) render(); // refresh the advert "Opens movie" lists
  });

  app.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]"), del = e.target.closest("[data-del]");
    if (add) {
      var k = add.getAttribute("data-add"), n = state[k].length + 1;
      if (k === "ticketTypes") state[k].push({ id: "type" + n, name: "New ticket", price: 5, note: "" });
      if (k === "adverts") state[k].push({ headline: "New advert", text: "", image: "", color: "#006db7", buttonText: "", movieId: "", link: "" });
      if (k === "movies") state[k].push({ id: "movie-" + n, title: "New Movie", status: "now", poster: "", rating: "G", duration: "90 min", genre: "", description: "", trailer: "", showtimes: ["14:00", "17:00"], days: [], prices: {}, paymentLink: "", soldSeats: {} });
      render();
    } else if (del) {
      var parts = del.getAttribute("data-del").split(":");
      if (confirm("Remove this?")) { state[parts[0]].splice(parseInt(parts[1], 10), 1); render(); }
    }
  });

  function output() {
    return "/* Generated with admin.html */\nwindow.THEATER_CONFIG = " + JSON.stringify(state, null, 2) + ";\n";
  }
  document.getElementById("dl").addEventListener("click", function () {
    var blob = new Blob([output()], { type: "text/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "config.js";
    document.body.appendChild(a); a.click(); a.remove();
  });
  document.getElementById("copy").addEventListener("click", function () {
    var btn = this;
    navigator.clipboard.writeText(output()).then(function () {
      btn.textContent = "✅ Copied!"; setTimeout(function () { btn.textContent = "📋 Copy config"; }, 1500);
    }, function () { alert("Couldn't copy – use Download instead."); });
  });
  document.getElementById("load").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var txt = String(r.result), i = txt.indexOf("{"), j = txt.lastIndexOf("}");
        state = JSON.parse(txt.slice(i, j + 1));
        ["theater", "theme", "schedule", "seating", "checkout"].forEach(function (k) { state[k] = state[k] || {}; });
        ["ticketTypes", "adverts", "movies"].forEach(function (k) { state[k] = state[k] || []; });
        render();
      } catch (err) { alert("That file doesn't look like a config.js made by this editor."); }
    };
    r.readAsText(f);
  });

  render();
})();
