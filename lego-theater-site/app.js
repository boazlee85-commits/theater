(function () {
  "use strict";
  var C = window.THEATER_CONFIG || {};
  var T = C.theater || {};
  var movies = C.movies || [];
  var ticketTypes = C.ticketTypes || [];
  var POSTER_COLORS = ["#e3000b", "#006db7", "#00a850", "#8a2be2", "#f57c00", "#00838f"];

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    var v = Number(n) || 0;
    return (T.currency || "$") + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function timeLabel(t) {
    var p = String(t).split(":"), h = parseInt(p[0], 10), m = p[1] || "00";
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return h + ":" + m + " " + ap;
  }
  function youtubeId(url) {
    if (!url) return "";
    var m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  }
  function findMovie(id) {
    for (var i = 0; i < movies.length; i++) if (movies[i].id === id) return movies[i];
    return null;
  }
  function priceFor(movie, type) {
    if (movie.prices && movie.prices[type.id] != null && movie.prices[type.id] !== "") return Number(movie.prices[type.id]);
    return Number(type.price) || 0;
  }

  /* ---------- Theme & static text ---------- */
  function applyTheme() {
    var th = C.theme || {}, root = document.documentElement.style;
    ["red", "blue", "yellow", "green", "dark", "background"].forEach(function (k) {
      if (th[k]) root.setProperty("--" + k, th[k]);
    });
    document.title = (T.name || "Theater") + (T.tagline ? " – " + T.tagline : "");
    $("#brandName").textContent = T.name || "Theater";
    $("#logo").textContent = T.logoEmoji || "🧱";
    if (T.promoBar) { var pb = $("#promoBar"); pb.textContent = T.promoBar; pb.hidden = false; }
    $("#aboutText").textContent = T.about || "";
    var items = [];
    if (T.address) items.push("📍 " + esc(T.address));
    if (T.hours) items.push("🕒 " + esc(T.hours));
    if (T.phone) items.push("📞 " + esc(T.phone));
    if (T.email) items.push('✉️ <a href="mailto:' + esc(T.email) + '">' + esc(T.email) + "</a>");
    $("#visitList").innerHTML = items.map(function (i) { return "<li>" + i + "</li>"; }).join("");
    $("#footerText").innerHTML = "© " + new Date().getFullYear() + " " + esc(T.name || "") +
      (T.tagline ? " · " + esc(T.tagline) : "");
  }

  /* ---------- Adverts carousel ---------- */
  var adIndex = 0, adTimer = null;
  function renderAdverts() {
    var ads = C.adverts || [];
    var hero = $(".hero");
    if (!ads.length) { hero.style.display = "none"; return; }
    $("#carousel").innerHTML = ads.map(function (a, i) {
      var bg = a.image
        ? "background-image:url('" + esc(a.image) + "');background-color:" + esc(a.color || "#e3000b")
        : "background-color:" + esc(a.color || "#e3000b");
      var btn = "";
      if (a.buttonText) {
        if (a.movieId) btn = '<button class="btn yellow" data-ad-movie="' + esc(a.movieId) + '">' + esc(a.buttonText) + "</button>";
        else if (a.link) btn = '<a class="btn yellow" href="' + esc(a.link) + '"' + (/^https?:/.test(a.link) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(a.buttonText) + "</a>";
      }
      return '<div class="slide' + (a.image ? "" : " nostuds") + (i === 0 ? " active" : "") + '" style="' + bg + '">' +
        '<div class="slide-inner"><h2>' + esc(a.headline) + "</h2><p>" + esc(a.text) + "</p>" + btn + "</div></div>";
    }).join("");
    $("#dots").innerHTML = ads.length > 1 ? ads.map(function (a, i) {
      return '<button class="dot' + (i === 0 ? " active" : "") + '" data-dot="' + i + '" aria-label="Advert ' + (i + 1) + '"></button>';
    }).join("") : "";
    function show(i) {
      adIndex = (i + ads.length) % ads.length;
      var slides = document.querySelectorAll(".slide"), dots = document.querySelectorAll(".dot");
      slides.forEach(function (s, k) { s.classList.toggle("active", k === adIndex); });
      dots.forEach(function (d, k) { d.classList.toggle("active", k === adIndex); });
    }
    function start() {
      clearInterval(adTimer);
      if (ads.length > 1) adTimer = setInterval(function () { show(adIndex + 1); }, (C.advertSeconds || 6) * 1000);
    }
    $("#dots").addEventListener("click", function (e) {
      var d = e.target.closest("[data-dot]");
      if (d) { show(parseInt(d.getAttribute("data-dot"), 10)); start(); }
    });
    $("#carousel").addEventListener("click", function (e) {
      var b = e.target.closest("[data-ad-movie]");
      if (!b) return;
      var m = findMovie(b.getAttribute("data-ad-movie"));
      if (!m) return;
      if (m.status === "soon" || !(m.showtimes || []).length) openTrailer(m); else openBooking(m);
    });
    start();
  }

  /* ---------- Movie grids ---------- */
  function posterHTML(m, i) {
    var color = POSTER_COLORS[i % POSTER_COLORS.length];
    return '<div class="poster" style="background-color:' + color + '">' +
      (m.rating ? '<span class="badge">' + esc(m.rating) + "</span>" : "") +
      "<span>" + esc(m.title) + "</span>" +
      (m.poster ? '<img src="' + esc(m.poster) + '" alt="' + esc(m.title) + ' poster" loading="lazy" onerror="this.remove()">' : "") +
      "</div>";
  }
  function cardHTML(m, i) {
    var soon = m.status === "soon" || !(m.showtimes || []).length;
    var minPrice = ticketTypes.length ? Math.min.apply(null, ticketTypes.map(function (t) { return priceFor(m, t); })) : null;
    var meta = [m.duration, m.genre].filter(Boolean).map(esc).join(" · ");
    var buttons = "";
    if (youtubeId(m.trailer)) buttons += '<button class="btn blue small" data-trailer="' + esc(m.id) + '">▶ Trailer</button>';
    if (!soon) buttons += '<button class="btn small" data-book="' + esc(m.id) + '">🎟 Tickets</button>';
    buttons += '<button class="btn ghost small" data-info="' + esc(m.id) + '">Info</button>';
    return '<article class="card" id="movie-' + esc(m.id) + '">' + posterHTML(m, i) +
      '<div class="card-body"><h3>' + esc(m.title) + '</h3><div class="meta">' + meta + "</div>" +
      (soon && m.releaseDate ? '<div class="meta"><strong>' + esc(m.releaseDate) + "</strong></div>" : "") +
      (!soon && minPrice != null ? '<div class="meta">From <strong>' + money(minPrice) + "</strong></div>" : "") +
      '<div class="card-actions">' + buttons + "</div></div></article>";
  }
  function renderMovies() {
    var now = [], soon = [];
    movies.forEach(function (m, i) {
      var isSoon = m.status === "soon" || !(m.showtimes || []).length;
      (isSoon ? soon : now).push(cardHTML(m, i));
    });
    $("#nowGrid").innerHTML = now.length ? now.join("") : '<p class="empty">No movies showing right now. Check back soon!</p>';
    $("#soonGrid").innerHTML = soon.length ? soon.join("") : '<p class="empty">Nothing announced yet.</p>';
    document.addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-book]"))) openBooking(findMovie(b.getAttribute("data-book")));
      else if ((b = e.target.closest("[data-trailer]"))) openTrailer(findMovie(b.getAttribute("data-trailer")));
      else if ((b = e.target.closest("[data-info]"))) openInfo(findMovie(b.getAttribute("data-info")));
    });
  }

  /* ---------- Modal ---------- */
  var modal = $("#modal"), modalBody = $("#modalBody");
  function openModal(html) {
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.scrollTop = 0;
  }
  function closeModal() {
    modal.hidden = true; modalBody.innerHTML = "";
    document.body.style.overflow = "";
    document.body.classList.remove("printing-ticket");
    if (location.hash.indexOf("#movie=") === 0) history.replaceState(null, "", location.pathname);
  }
  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  function openTrailer(m) {
    if (!m) return;
    var id = youtubeId(m.trailer);
    openModal("<h2>" + esc(m.title) + "</h2>" +
      (id ? '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Trailer"></iframe></div>'
          : '<p class="hint">No trailer has been added for this movie yet.</p>') +
      "<p>" + esc(m.description) + "</p>" +
      ((m.status !== "soon" && (m.showtimes || []).length) ? '<button class="btn" id="trailerBook">🎟 Get tickets</button>' : ""));
    var tb = $("#trailerBook");
    if (tb) tb.addEventListener("click", function () { openBooking(m); });
  }
  function openInfo(m) {
    if (!m) return;
    var soon = m.status === "soon" || !(m.showtimes || []).length;
    var id = youtubeId(m.trailer);
    openModal("<h2>" + esc(m.title) + "</h2>" +
      '<p class="meta">' + [m.rating, m.duration, m.genre].filter(Boolean).map(esc).join(" · ") + "</p>" +
      "<p>" + esc(m.description) + "</p>" +
      (soon && m.releaseDate ? "<p><strong>" + esc(m.releaseDate) + "</strong></p>" : "") +
      '<div class="card-actions">' +
      (id ? '<button class="btn blue" id="infoTrailer">▶ Trailer</button>' : "") +
      (!soon ? '<button class="btn" id="infoBook">🎟 Get tickets</button>' : "") + "</div>");
    var a = $("#infoTrailer"), b = $("#infoBook");
    if (a) a.addEventListener("click", function () { openTrailer(m); });
    if (b) b.addEventListener("click", function () { openBooking(m); });
  }

  /* ---------- Booking ---------- */
  function showDates(m) {
    var out = [], days = (m.days && m.days.length) ? m.days.map(Number) : null;
    var n = (C.schedule && C.schedule.daysAhead) || 7;
    var now = new Date();
    for (var i = 0; i < n; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (days && days.indexOf(d.getDay()) === -1) continue;
      var times = (m.showtimes || []).filter(function (t) {
        if (i !== 0) return true;
        var p = t.split(":");
        var at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1] || 0);
        return at > now;
      });
      if (!times.length) continue;
      var label = i === 0 ? "Today" : i === 1 ? "Tomorrow" :
        d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      out.push({ key: dateKey(d), label: label, times: times, full: d });
    }
    return out;
  }

  function openBooking(m) {
    if (!m) return;
    var dates = showDates(m);
    var st = { date: "", time: "", qty: {}, seats: [] };
    var seating = C.seating || {};
    var seatsOn = !!seating.enabled;

    openModal(
      "<h2>🎟 " + esc(m.title) + "</h2>" +
      '<p class="meta">' + [m.rating, m.duration].filter(Boolean).map(esc).join(" · ") + "</p>" +
      (dates.length ? "" : '<p class="notice">No upcoming showtimes right now. Please check back soon!</p>') +
      '<div id="bk"' + (dates.length ? "" : " hidden") + ">" +
      '<div class="step"><h4>1. Pick a day</h4><div class="chips" id="bkDates"></div></div>' +
      '<div class="step"><h4>2. Pick a time</h4><div class="chips" id="bkTimes"><span class="hint">Choose a day first</span></div></div>' +
      '<div class="step"><h4>3. Tickets</h4><div id="bkTickets"></div></div>' +
      (seatsOn ? '<div class="step"><h4>4. Pick seats</h4><div id="bkSeats"></div></div>' : "") +
      '<div class="step"><h4>' + (seatsOn ? "5" : "4") + '. Your details</h4>' +
      '<div class="field"><label for="bkName">Name</label><input id="bkName" autocomplete="name" placeholder="Your name"></div>' +
      '<div class="field"><label for="bkEmail">Email</label><input id="bkEmail" type="email" autocomplete="email" placeholder="you@example.com"></div></div>' +
      '<div class="total"><span>Total</span><span id="bkTotal">' + money(0) + "</span></div>" +
      '<button class="btn green" id="bkGo" disabled style="width:100%">Get my tickets</button>' +
      '<p class="hint" id="bkHint" style="margin-top:.6rem"></p></div>');

    var elDates = $("#bkDates"), elTimes = $("#bkTimes"), elTickets = $("#bkTickets");
    if (!dates.length) return;

    function renderDates() {
      elDates.innerHTML = dates.map(function (d) {
        return '<button class="chip' + (st.date === d.key ? " active" : "") + '" data-d="' + d.key + '">' + esc(d.label) + "</button>";
      }).join("");
    }
    function renderTimes() {
      var d = dates.filter(function (x) { return x.key === st.date; })[0];
      if (!d) { elTimes.innerHTML = '<span class="hint">Choose a day first</span>'; return; }
      elTimes.innerHTML = d.times.map(function (t) {
        return '<button class="chip' + (st.time === t ? " active" : "") + '" data-t="' + t + '">' + timeLabel(t) + "</button>";
      }).join("");
    }
    function renderTickets() {
      elTickets.innerHTML = ticketTypes.map(function (t) {
        return '<div class="ticket-row"><div><strong>' + esc(t.name) + "</strong> – " + money(priceFor(m, t)) +
          (t.note ? '<div class="hint">' + esc(t.note) + "</div>" : "") + "</div>" +
          '<div class="qty"><button data-q="' + esc(t.id) + '" data-delta="-1" aria-label="Fewer">−</button><span>' +
          (st.qty[t.id] || 0) + '</span><button data-q="' + esc(t.id) + '" data-delta="1" aria-label="More">+</button></div></div>';
      }).join("");
    }
    function admitCount() {
      var n = 0;
      ticketTypes.forEach(function (t) { n += (st.qty[t.id] || 0) * (Number(t.admits) || 1); });
      return n;
    }
    function total() {
      var s = 0;
      ticketTypes.forEach(function (t) { s += (st.qty[t.id] || 0) * priceFor(m, t); });
      return s;
    }
    function soldList() {
      var key = st.date + " " + st.time;
      return (m.soldSeats && m.soldSeats[key]) || [];
    }
    function renderSeats() {
      if (!seatsOn) return;
      var el = $("#bkSeats");
      if (!st.date || !st.time) { el.innerHTML = '<span class="hint">Choose a day and time first</span>'; return; }
      var rows = seating.rows || 5, per = seating.seatsPerRow || 8, sold = soldList(), html = "";
      for (var r = 0; r < rows; r++) {
        for (var c = 1; c <= per; c++) {
          var id = String.fromCharCode(65 + r) + c;
          var cls = "seat" + (sold.indexOf(id) > -1 ? " sold" : "") + (st.seats.indexOf(id) > -1 ? " sel" : "");
          html += '<button class="' + cls + '" data-s="' + id + '"' + (cls.indexOf("sold") > -1 ? " disabled" : "") + ">" + id + "</button>";
        }
      }
      el.innerHTML = '<div class="screen">SCREEN</div><div class="seats" style="grid-template-columns:repeat(' + per + ',auto)">' + html + "</div>" +
        '<div class="legend"><span>🟩 Free</span><span>🟨 Yours</span><span>⬜ Taken</span></div>';
    }
    function validate() {
      var need = admitCount(), name = $("#bkName").value.trim(), email = $("#bkEmail").value.trim();
      var okEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      var hint = "";
      if (!st.date || !st.time) hint = "Pick a day and time.";
      else if (need === 0) hint = "Add at least one ticket.";
      else if (seatsOn && st.seats.length !== need) hint = "Pick " + need + " seat" + (need > 1 ? "s" : "") + " (" + st.seats.length + " chosen).";
      else if (!name) hint = "Enter your name.";
      else if (!okEmail) hint = "Enter a valid email.";
      $("#bkHint").textContent = hint;
      $("#bkGo").disabled = !!hint;
      $("#bkTotal").textContent = money(total());
    }

    $("#bk").addEventListener("click", function (e) {
      var b;
      if ((b = e.target.closest("[data-d]"))) { st.date = b.getAttribute("data-d"); st.time = ""; st.seats = []; renderDates(); renderTimes(); renderSeats(); }
      else if ((b = e.target.closest("[data-t]"))) { st.time = b.getAttribute("data-t"); st.seats = []; renderTimes(); renderSeats(); }
      else if ((b = e.target.closest("[data-q]"))) {
        var id = b.getAttribute("data-q"), d = parseInt(b.getAttribute("data-delta"), 10);
        st.qty[id] = Math.max(0, Math.min(20, (st.qty[id] || 0) + d));
        var need = admitCount();
        if (seatsOn && st.seats.length > need) st.seats = st.seats.slice(0, need);
        renderTickets(); renderSeats();
      } else if ((b = e.target.closest("[data-s]"))) {
        var s = b.getAttribute("data-s"), i = st.seats.indexOf(s), need2 = admitCount();
        if (i > -1) st.seats.splice(i, 1);
        else if (st.seats.length < need2) st.seats.push(s);
        else { $("#bkHint").textContent = need2 ? "You've already picked all your seats." : "Add tickets first."; return; }
        renderSeats();
      }
      validate();
    });
    $("#bkName").addEventListener("input", validate);
    $("#bkEmail").addEventListener("input", validate);

    $("#bkGo").addEventListener("click", function () {
      var parts = [];
      ticketTypes.forEach(function (t) { if (st.qty[t.id]) parts.push(st.qty[t.id] + " × " + t.name); });
      var d = dates.filter(function (x) { return x.key === st.date; })[0];
      var booking = {
        code: "LT-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        movie: m.title,
        date: st.date,
        dateLabel: d ? d.full.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : st.date,
        time: timeLabel(st.time),
        tickets: parts.join(", "),
        seats: st.seats.slice().sort(),
        total: money(total()),
        name: $("#bkName").value.trim(),
        email: $("#bkEmail").value.trim()
      };
      checkout(m, booking);
    });

    renderDates(); renderTickets(); renderSeats(); validate();
  }

  /* ---------- Checkout ---------- */
  function checkout(m, b) {
    var co = C.checkout || {}, mode = co.mode || "none";
    var status = "";
    if (mode === "paymentLink") {
      var link = m.paymentLink || co.paymentLink;
      if (link) {
        var url = link;
        if (/stripe\.com/.test(link)) {
          url += (link.indexOf("?") > -1 ? "&" : "?") + "prefilled_email=" + encodeURIComponent(b.email) + "&client_reference_id=" + encodeURIComponent(b.code);
        }
        window.open(url, "_blank", "noopener");
        status = "Payment page opened in a new tab. Your ticket is confirmed once payment is complete.";
      } else {
        status = "Payment link is not set up yet – please pay at the door.";
      }
      showTicket(b, status);
    } else if (mode === "form" && co.formEndpoint) {
      var btn = $("#bkGo"); btn.disabled = true; btn.textContent = "Sending…";
      fetch(co.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          code: b.code, movie: b.movie, date: b.dateLabel, time: b.time, tickets: b.tickets,
          seats: b.seats.join(", "), total: b.total, name: b.name, email: b.email
        })
      }).then(function (r) {
        if (!r.ok) throw new Error("bad response");
        showTicket(b, "Your booking was sent to the theater.");
      }).catch(function () {
        btn.disabled = false; btn.textContent = "Get my tickets";
        alert("Sorry, we couldn't send your booking. Please try again.");
      });
    } else if (mode === "email" && co.email) {
      var subject = "Ticket booking " + b.code + " – " + b.movie;
      var body = "Hi! I'd like to book tickets:\n\nMovie: " + b.movie + "\nDay: " + b.dateLabel + "\nTime: " + b.time +
        "\nTickets: " + b.tickets + (b.seats.length ? "\nSeats: " + b.seats.join(", ") : "") +
        "\nTotal: " + b.total + "\nName: " + b.name + "\nEmail: " + b.email + "\nBooking code: " + b.code;
      window.location.href = "mailto:" + co.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      showTicket(b, "Your email app should open – send the email to finish your booking.");
    } else {
      showTicket(b, "");
    }
  }

  function barsHTML(code) {
    var out = "";
    for (var i = 0; i < 38; i++) {
      var ch = code.charCodeAt(i % code.length) + i * 7;
      out += '<i style="width:' + (1 + (ch % 4)) + 'px"></i>';
    }
    return out;
  }
  function showTicket(b, status) {
    var co = C.checkout || {};
    openModal(
      "<h2>🎉 You're all set, " + esc(b.name.split(" ")[0]) + "!</h2>" +
      (status ? '<p class="notice no-print">' + esc(status) + "</p>" : "") +
      '<div class="ticket"><div class="ticket-top"><div><div style="font-weight:900;font-size:1.3rem">' + esc(T.name || "Theater") +
      '</div><div>' + esc(T.tagline || "") + '</div></div><div style="font-size:2rem">' + esc(T.logoEmoji || "🧱") + "</div></div>" +
      '<div class="ticket-main"><div class="big">' + esc(b.movie) + "</div>" +
      "<div>📅 " + esc(b.dateLabel) + " · " + esc(b.time) + "</div>" +
      "<div>🎟 " + esc(b.tickets) + "</div>" +
      (b.seats.length ? "<div>💺 Seats: " + esc(b.seats.join(", ")) + "</div>" : "") +
      "<div>💰 Total: " + esc(b.total) + "</div><div>👤 " + esc(b.name) + "</div></div>" +
      '<hr class="ticket-cut"><div class="ticket-code"><div class="bars">' + barsHTML(b.code) + '</div><div class="code">' + esc(b.code) + "</div></div></div>" +
      '<p class="hint no-print">' + esc(co.confirmText || "") + "</p>" +
      '<div class="card-actions no-print"><button class="btn blue" id="tkPrint">🖨 Print / Save ticket</button>' +
      '<button class="btn ghost" id="tkClose">Done</button></div>');
    $("#tkPrint").addEventListener("click", function () {
      document.body.classList.add("printing-ticket");
      window.print();
      setTimeout(function () { document.body.classList.remove("printing-ticket"); }, 500);
    });
    $("#tkClose").addEventListener("click", closeModal);
  }

  /* ---------- Init ---------- */
  applyTheme();
  renderAdverts();
  renderMovies();
  var h = location.hash.match(/^#movie=(.+)$/);
  if (h) { var mv = findMovie(decodeURIComponent(h[1])); if (mv) openInfo(mv); }
})();
