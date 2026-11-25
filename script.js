/* Peihang Li · Films — small enhancements. The page still works without this file. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Footer year */
  document.querySelectorAll("[data-this-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Header: background after scrolling; name appears once the opening screen is passed.
     The floating "All films" button stays hidden on the opening screen. */
  var header = document.querySelector(".site-header");
  var fab = document.querySelector(".fab");
  function onScroll() {
    var y = window.scrollY;
    var vh = Math.max(window.innerHeight, 480);
    header.classList.toggle("is-scrolled", y > 24);
    header.classList.toggle("show-mark", y > vh * 0.6);
    if (fab) fab.classList.toggle("is-hidden", y < vh * 0.55);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", function () {
    /* Some browsers land at the top when a shared link has #film-name; jump there once images are laid out */
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && window.scrollY < 10) target.scrollIntoView();
    onScroll();
  });
  onScroll();

  /* Ambient background + accent colour follow the section in the middle of the screen */
  var layers = document.querySelectorAll(".ambient__layer");
  var currentBg = "none";
  var front = 0;
  function setAmbient(src) {
    if (!src || src === currentBg || layers.length < 2) return;
    currentBg = src;
    if (src === "none") {
      layers.forEach(function (l) { l.classList.remove("is-on"); });
      return;
    }
    var next = layers[1 - front];
    next.style.backgroundImage = "url('" + src + "')";
    next.classList.add("is-on");
    layers[front].classList.remove("is-on");
    front = 1 - front;
  }

  var navLinks = document.querySelectorAll("[data-nav]");
  function setNav(id) {
    var key = id === "about" ? "about" : id === "contact" ? "contact" : id === "hero" ? "" : "films";
    navLinks.forEach(function (a) { a.classList.toggle("is-active", a.dataset.nav === key); });
  }

  var hero = document.querySelector(".hero");
  var heroAccent = hero ? hero.dataset.accent : null;

  var sections = document.querySelectorAll("[data-ambient]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setAmbient(el.dataset.ambient);
        var accent = el === hero ? heroAccent : el.dataset.accent;
        if (accent) root.style.setProperty("--accent", accent);
        setNav(el === hero ? "hero" : el.id);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach(function (s) { io.observe(s); });

    /* Gentle reveal for blocks and cards */
    if (!reduceMotion) {
      var revealables = document.querySelectorAll(".block, .card, .cv > div, .section-head, .lineup__item");
      revealables.forEach(function (el) { el.classList.add("reveal"); });
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            rio.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      revealables.forEach(function (el) { rio.observe(el); });
    }
  }

  /* Opening screen: frames from each film fade in turn, with a slow push-in */
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero__slide"));
    var segs = Array.prototype.slice.call(hero.querySelectorAll(".hero__progress button"));
    var cap = hero.querySelector(".hero__caption");
    var SLIDE_MS = 7000;
    var cur = 0;
    var timer = null;
    var autoplay = !reduceMotion;
    var heroVisible = true;
    hero.style.setProperty("--slide-ms", SLIDE_MS + "ms");

    var updateCaption = function (s) {
      cap.href = "#" + s.dataset.film;
      cap.querySelector(".hero__count").textContent = s.dataset.no;
      var filmEl = cap.querySelector(".hero__film");
      filmEl.textContent = s.dataset.title + " ";
      var zh = document.createElement("span");
      zh.lang = "zh";
      zh.textContent = s.dataset.zh;
      filmEl.appendChild(zh);
      cap.querySelector(".hero__year").textContent = s.dataset.year;
      heroAccent = s.dataset.accent;
      hero.style.setProperty("--accent", heroAccent);
      if (window.scrollY < window.innerHeight * 0.5) root.style.setProperty("--accent", heroAccent);
    };

    var updateProgress = function () {
      segs.forEach(function (b, k) {
        b.classList.remove("is-on", "is-still");
        b.classList.toggle("is-done", k < cur);
        if (k === cur) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      var seg = segs[cur];
      if (!seg) return;
      void seg.offsetWidth; /* restart the fill animation */
      seg.classList.add(autoplay ? "is-on" : "is-still");
    };

    var schedule = function () {
      clearTimeout(timer);
      if (autoplay && heroVisible && !document.hidden) {
        timer = setTimeout(function () { show(cur + 1); }, SLIDE_MS);
      }
    };

    var show = function (n) {
      var prev = slides[cur];
      cur = (n + slides.length) % slides.length;
      var next = slides[cur];
      if (prev !== next) {
        prev.classList.remove("is-on");
        prev.classList.add("is-leaving");
        setTimeout(function () { prev.classList.remove("is-leaving"); }, 1700);
        next.classList.remove("is-leaving");
        void next.offsetWidth;
        next.classList.add("is-on");
      }
      updateCaption(next);
      updateProgress();
      schedule();
    };

    segs.forEach(function (b, k) {
      b.addEventListener("click", function () { show(k); });
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) updateProgress();
      schedule();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var was = heroVisible;
        heroVisible = entries[0].isIntersecting;
        if (heroVisible && !was) updateProgress();
        schedule();
      }).observe(hero);
    }
    updateCaption(slides[0]);
    updateProgress();
    schedule();
  }

  /* Vimeo players load only when someone presses play */
  function play(player) {
    if (!player || player.querySelector("iframe")) return;
    var id = player.dataset.vimeo;
    var iframe = document.createElement("iframe");
    iframe.src = "https://player.vimeo.com/video/" + id + "?autoplay=1&dnt=1&title=0&byline=0&portrait=0";
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.title = player.dataset.title || "Film";
    player.innerHTML = "";
    player.appendChild(iframe);
  }
  document.querySelectorAll(".player").forEach(function (player) {
    var btn = player.querySelector(".player__btn");
    if (btn) btn.addEventListener("click", function () { play(player); });
  });

  /* "Watch the film" buttons scroll to the player and start it */
  document.querySelectorAll("[data-watch]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var player = document.getElementById(btn.dataset.watch);
      if (!player) return;
      player.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      play(player);
    });
  });

  /* Lightbox for stills */
  var lightbox = document.querySelector(".lightbox");
  var lbImg = lightbox && lightbox.querySelector("img");
  var lbCap = lightbox && lightbox.querySelector(".lightbox__caption");
  var group = [];
  var index = 0;
  var filmTitle = "";

  function showStill(i) {
    index = (i + group.length) % group.length;
    var img = group[index];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = filmTitle + " · " + (index + 1) + " / " + group.length;
  }
  if (lightbox && typeof lightbox.showModal === "function") {
    document.querySelectorAll(".stills").forEach(function (grid) {
      var imgs = Array.prototype.slice.call(grid.querySelectorAll("img"));
      var film = grid.closest(".film");
      var title = film ? film.querySelector(".film__title").firstChild.textContent.trim() : "";
      grid.querySelectorAll(".still").forEach(function (btn, i) {
        btn.setAttribute("aria-label", "Open still " + (i + 1) + ": " + imgs[i].alt);
        btn.addEventListener("click", function () {
          group = imgs;
          filmTitle = title;
          showStill(i);
          lightbox.showModal();
        });
      });
    });
    lightbox.querySelectorAll("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () { showStill(index + Number(b.dataset.step)); });
    });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") showStill(index + 1);
      if (e.key === "ArrowLeft") showStill(index - 1);
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.close();
    });
  }

  /* All-films index */
  var indexDialog = document.querySelector(".index");
  if (indexDialog && typeof indexDialog.showModal === "function") {
    document.querySelectorAll("[data-open-index]").forEach(function (b) {
      b.addEventListener("click", function () { indexDialog.showModal(); });
    });
    indexDialog.addEventListener("click", function (e) {
      if (e.target === indexDialog) indexDialog.close();
    });
    indexDialog.querySelectorAll("a[href^='#']").forEach(function (a) {
      a.addEventListener("click", function () { indexDialog.close(); });
    });
  }

  /* Close buttons inside dialogs */
  document.querySelectorAll("dialog [data-close]").forEach(function (b) {
    b.addEventListener("click", function () { b.closest("dialog").close(); });
  });

  /* Copy email */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.dataset.copy;
      var label = b.textContent;
      function done() {
        b.textContent = "Copied";
        setTimeout(function () { b.textContent = label; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { window.location.href = "mailto:" + text; });
      } else {
        window.location.href = "mailto:" + text;
      }
    });
  });
})();
