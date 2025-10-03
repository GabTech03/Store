/* =========================================================
   script.js — La Biglietteria (FULL UPDATED)
   ========================================================= */

(() => {
  "use strict";

  /* =========================
     CONFIG
     ========================= */
  const API_BASE = "http://localhost:8000"; // <— cambia se serve
  const IMG_BASE = API_BASE;
  const DEFAULT_IMG = "immagini/default.jpg";

  /* =========================
     STATE & HELPERS
     ========================= */
  let userData = { name: "", surname: "", email: "" };
  let allEvents = [];
  let cart = [];
  let purchasedTickets = [];
  let reviews = [];
  let currentReviewIndex = 0;
  let reviewInterval = null;
  const reviewRotationMs = 8000;

  const CART_KEY = "lb_cart_v1";
  const TICKETS_KEY = "lb_tickets_v1";
  const USER_KEY = "lb_user_v1";

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmtEuro = (n) => `€${Number(n || 0).toFixed(2)}`;

  const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
  const loadCart = () => {
    try {
      cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      cart = [];
    }
  };

  const saveTickets = () => localStorage.setItem(TICKETS_KEY, JSON.stringify(purchasedTickets));
  const loadTickets = () => {
    try {
      purchasedTickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]");
    } catch {
      purchasedTickets = [];
    }
  };

  const saveUser = () => localStorage.setItem(USER_KEY, JSON.stringify(userData));
  const loadUser = () => {
    try {
      userData = JSON.parse(
        localStorage.getItem(USER_KEY) || '{"name":"","surname":"","email":""}'
      );
    } catch {
      userData = { name: "", surname: "", email: "" };
    }
  };

  function toast(msg) {
    let el = q("#lb-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "lb-toast";
      el.style.cssText = `
        position:fixed;left:50%;bottom:24px;transform:translateX(-50%);
        background:#10151a;color:#fff;padding:10px 16px;border-radius:8px;
        box-shadow:0 6px 18px rgba(0,0,0,.25);z-index:9999;opacity:0;transition:opacity .25s`;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(() => (el.style.opacity = "0"), 1800);
  }

  function buildImgSrc(immagine_url) {
    if (!immagine_url) return DEFAULT_IMG;
    if (immagine_url.startsWith("http")) return immagine_url;
    return `${IMG_BASE}${immagine_url}`;
  }

  function getRandomFaceImage() {
    const id = Math.floor(Math.random() * 1000);
    return `https://source.unsplash.com/random/400x400/?face&sig=${id}`;
  }

  /* =========================
     DOM REFS
     ========================= */
  const refs = {
    // nav / header
    loginLink: q("#login-link"),
    userProfile: q("#user-profile"),
    userInitial: q("#user-initial"),
    userMenu: q(".user-menu"),
    logoutLink: q("#logout-link"),
    infoLink: q("#info-link"),
    createEventLink: q("#create-event-link"),

    // search
    searchContainer: q(".search-container"),
    searchInput: q("#search-bar"),
    searchButton: q("#search-button"),

    // main pages
    mainContainer: q(".container"),
    eventsGrid: q(".events-grid"),
    eventDetailsPage: q("#event-details-page"),
    backToHomeBtn: q("#back-to-home"),

    // details
    detailsImg: q("#details-event-img"),
    detailsTitle: q("#details-event-title"),
    detailsDates: q("#details-event-dates"),
    detailsTime: q("#details-event-time"),
    detailsLocation: q("#details-event-location"),
    detailsPriceContainer: q("#details-price-container"),
    detailsBuyBtn: q("#details-buy-btn"),

    // create-event
    createEventPage: q("#create-event-page"),
    backToHomeFromCreate: q("#back-to-home-from-create"),
    createEventForm: q("#create-event-form"),

    // modals
    loginModal: q("#login-modal"),
    registerModal: q("#register-modal"),
    infoModal: q("#info-modal"),
    personalInfoModal: q("#personal-info-modal"),
    cartModal: q("#cart-modal"),
    addToCartModal: q("#add-to-cart-modal"),
    checkoutDetailsModal: q("#checkout-details-modal"),
    paymentModal: q("#payment-modal"),
    myTicketsModal: q("#my-tickets-modal"),

    // forms
    loginForm: q("#login-form"),
    registerForm: q("#register-form"),
    addToCartForm: q("#add-to-cart-form"),
    paymentForm: q("#payment-form"),

    // links interno modali
    openRegisterLink: q("#open-register"),
    openLoginLink: q("#open-login"),

    // add-to-cart modal content
    eventTitleDisplay: q("#event-title-display"),
    ticketPriceDisplay: q("#ticket-price"),
    ticketNameInput: q("#ticket-name"),
    ticketSurnameInput: q("#ticket-surname"),

    // personal info
    infoName: q("#info-name"),
    infoSurname: q("#info-surname"),
    infoEmail: q("#info-email"),

    // cart
    cartIcon: q("#cart-icon"),
    cartCount: q("#cart-count"),
    cartItemsList: q("#cart-items"),
    emptyCartMessage: q("#empty-cart-message"),
    cartTotal: q("#cart-total"),
    checkoutButton: q("#checkout-button"),
    clearCartButton: q("#clear-cart-button"),

    // checkout modal
    checkoutList: q("#checkout-list"),
    checkoutTotal: q("#checkout-total"),
    proceedToPayment: q("#proceed-to-payment"),

    // tickets
    myTicketsLink: q("#my-tickets-link"),
    ticketsList: q("#tickets-list"),
    noTicketsMsg: q("#no-tickets-message"),

    // reviews
    reviewForm: q("#review-form"),
    reviewsList: q("#reviews-list"),

    // filters
    filterButtons: qa(".filter-btn"),

    // chat
    chatBubble: q("#chat-bubble"),
    chatModal: q("#chat-modal"),
    chatCloseBtn: q(".chat-close-button"),
    chatInput: q("#chat-input"),
    chatSendBtn: q("#chat-send-btn"),
    chatBody: q(".chat-body"),

    // misc
    closeButtons: qa(".close-button"),
    modals: qa(".modal"),
  };

  /* =========================
     LOGIN / LOGOUT
     ========================= */
  function updateUserUI() {
    if (userData && userData.email) {
      refs.userInitial.textContent = (
        userData.name ||
        userData.email ||
        "U"
      ).charAt(0).toUpperCase();
      refs.loginLink && (refs.loginLink.style.display = "none");
      refs.userProfile && refs.userProfile.classList.remove("hidden");
      refs.createEventLink && refs.createEventLink.classList.remove("hidden");
    } else {
      refs.userProfile && refs.userProfile.classList.add("hidden");
      refs.loginLink && (refs.loginLink.style.display = "block");
      refs.createEventLink && refs.createEventLink.classList.add("hidden");
    }
  }

  function login(name, email) {
    userData.name = name || "";
    userData.email = email || "";
    saveUser();
    updateUserUI();
    if (refs.loginModal) refs.loginModal.style.display = "none";
  }

  function logout() {
    userData = { name: "", surname: "", email: "" };
    saveUser();
    refs.userMenu && refs.userMenu.classList.remove("active");
    cart = [];
    saveCart();
    purchasedTickets = [];
    saveTickets();
    updateCartUI();
    updateUserUI();
  }

  /* =========================
     CART
     ========================= */
  function updateCartUI() {
    const list = refs.cartItemsList;
    if (!list) return;

    list.innerHTML = "";

    if (!cart || cart.length === 0) {
      refs.emptyCartMessage && (refs.emptyCartMessage.style.display = "block");
      refs.cartCount && (refs.cartCount.style.display = "none");
      refs.cartTotal && (refs.cartTotal.textContent = fmtEuro(0));
      refs.checkoutButton && (refs.checkoutButton.style.display = "none");
      refs.clearCartButton && (refs.clearCartButton.style.display = "none");
      return;
    }

    refs.emptyCartMessage && (refs.emptyCartMessage.style.display = "none");
    refs.cartCount && (refs.cartCount.textContent = String(cart.length));
    refs.cartCount && (refs.cartCount.style.display = "block");
    refs.checkoutButton && (refs.checkoutButton.style.display = "block");
    refs.clearCartButton && (refs.clearCartButton.style.display = "block");

    cart.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="item-info">
          <h4>${item.title}</h4>
          <p>Fascia: ${item.fascia || "-"}</p>
          <p>${item.name || ""} ${item.surname || ""}</p>
          <p>Prezzo: ${fmtEuro(item.price)}</p>
        </div>
      `;
      list.appendChild(li);
    });

    const tot = cart.reduce((s, it) => s + Number(it.price || 0), 0);
    refs.cartTotal && (refs.cartTotal.textContent = fmtEuro(tot));
  }

  function addToCartFromDetails() {
    const eventTitle = refs.detailsTitle ? refs.detailsTitle.textContent : "";
    const priceSelect = document.getElementById("ticket-price-select");
    let price = 0;
    let fascia = "Non specificato";
    if (priceSelect) {
      price = parseFloat(priceSelect.value) || 0;
      const txt = priceSelect.options[priceSelect.selectedIndex]?.text || "";
      fascia = txt.includes(":") ? txt.split(":")[0] : txt;
    }

    const name = refs.ticketNameInput?.value || userData.name || "";
    const surname = refs.ticketSurnameInput?.value || userData.surname || "";

    const item = { title: eventTitle, name, surname, price, fascia };
    cart.push(item);
    saveCart();
    updateCartUI();
    toast(`Biglietto per "${eventTitle}" aggiunto al carrello.`);
    refs.addToCartModal && (refs.addToCartModal.style.display = "none");
  }

  /* =========================
     REVIEWS
     ========================= */
  function starHtml(rating) {
    let out = "";
    for (let i = 0; i < 5; i++) {
      out += i < rating ?
        '<i class="fa-solid fa-star shining"></i>' :
        '<i class="fa-regular fa-star"></i>';
    }
    return out;
  }

  function initReviews() {
    if (!refs.reviewsList) return;
    reviews = qa(".review-card", refs.reviewsList);
    reviews.forEach((card) => {
      const rating = parseInt(
        card.querySelector(".review-rating")?.getAttribute("data-rating") || "0",
        10
      );
      const cont = card.querySelector(".review-rating");
      if (cont) cont.innerHTML = starHtml(rating);
    });
    if (reviews.length > 0) {
      reviews[0].classList.add("active");
      startReviewRotation();
    }
  }

  function rotateReviews() {
    if (reviews.length === 0) return;
    reviews[currentReviewIndex].classList.remove("active");
    currentReviewIndex = (currentReviewIndex + 1) % reviews.length;
    setTimeout(() => reviews[currentReviewIndex].classList.add("active"), 1500);
  }

  function startReviewRotation() {
    stopReviewRotation();
    if (reviews.length > 1) {
      reviewInterval = setInterval(rotateReviews, reviewRotationMs);
    }
  }

  function stopReviewRotation() {
    if (reviewInterval) clearInterval(reviewInterval);
    reviewInterval = null;
  }

  /* =========================
     PAGES
     ========================= */
  function showPage(which) {
    refs.mainContainer && refs.mainContainer.classList.add("hidden");
    refs.eventDetailsPage && refs.eventDetailsPage.classList.add("hidden");
    refs.createEventPage && refs.createEventPage.classList.add("hidden");

    if (which === "home") {
      refs.mainContainer && refs.mainContainer.classList.remove("hidden");
    } else if (which === "details") {
      refs.eventDetailsPage && refs.eventDetailsPage.classList.remove("hidden");
    } else if (which === "create-event") {
      refs.createEventPage && refs.createEventPage.classList.remove("hidden");
    }
  }

  /* =========================
     EVENTS RENDERING
     ========================= */
  function attachCardHandlers() {
    qa(".event-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-event-id");
        const selected = allEvents.find((ev) => String(ev.id) === String(id));
        if (!selected) return;

        showPage("details");
        refs.detailsImg && (refs.detailsImg.src = buildImgSrc(selected.immagine_url));
        refs.detailsTitle && (refs.detailsTitle.textContent = selected.nome || "");
        refs.detailsDates && (refs.detailsDates.textContent = selected.data || "");
        refs.detailsTime && (refs.detailsTime.textContent = selected.ora || "");
        refs.detailsLocation && (refs.detailsLocation.textContent = selected.luogo || "");

        const cont = refs.detailsPriceContainer;
        if (cont) {
          cont.innerHTML = "";
          const label = document.createElement("p");
          label.textContent = "Scegli la fascia di prezzo:";
          const sel = document.createElement("select");
          sel.id = "ticket-price-select";

          if (selected.fasce_prezzo && selected.fasce_prezzo.length) {
            selected.fasce_prezzo.forEach((fp) => {
              const opt = document.createElement("option");
              opt.value = String(fp.prezzo);
              opt.textContent = `${fp.fascia}: ${fmtEuro(fp.prezzo)}`;
              sel.appendChild(opt);
            });
          } else {
            const opt = document.createElement("option");
            opt.value = "0";
            opt.textContent = "Prezzo non disponibile";
            sel.appendChild(opt);
          }
          cont.appendChild(label);
          cont.appendChild(sel);
        }
      });
    });
  }

  function renderEvents(list, limit3 = false) {
    const grid = refs.eventsGrid;
    if (!grid) return;

    grid.innerHTML = "";
    if (!list || list.length === 0) {
      grid.innerHTML = `<p>Nessun evento trovato.</p>`;
      return;
    }

    const toRender = limit3 ? list.slice(0, 3) : list;

    toRender.forEach((ev) => {
      let minPrice = 0;
      if (ev.fasce_prezzo?.length) {
        minPrice = Math.min(...ev.fasce_prezzo.map((f) => Number(f.prezzo || 0)));
      }
      const card = document.createElement("div");
      card.className = "event-card";
      card.innerHTML = `
        <img src="${buildImgSrc(ev.immagine_url)}" alt="${ev.nome}">
        <div class="card-content">
          <h3>${ev.nome}</h3>
          <p>${ev.luogo} - ${ev.data} ${ev.ora}</p>
          <p class="event-price">Prezzo da: <span>${fmtEuro(minPrice)}</span></p>
          <a href="#" class="event-btn" data-event-id="${ev.id}">Acquista Biglietto</a>
        </div>
      `;
      grid.appendChild(card);
    });

    attachCardHandlers();
  }

  /* =========================
     API CALLS
     ========================= */
  async function apiJson(url, opts = {}) {
    const res = await fetch(url, opts);
    if (!res.ok) {
      let detail = "";
      try {
        const e = await res.json();
        detail = e.detail || JSON.stringify(e);
      } catch {
        detail = res.statusText;
      }
      throw new Error(detail || `HTTP ${res.status}`);
    }
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function loadEvents(filter = null) {
    try {
      let url = `${API_BASE}/eventi`;
      if (filter && filter !== "mostra tutto") {
        const map = {
          "oggi": "oggi",
          "domani": "domani",
          "fine settimana": "fine settimana"
        };
        const f = map[filter] || null;
        if (f) url += `?filtro=${encodeURIComponent(f)}`;
      }
      const data = await apiJson(url);
      allEvents = data.eventi || [];
      renderEvents(allEvents, filter !== "mostra tutto");
    } catch (e) {
      console.error("Errore nel caricamento eventi:", e);
      refs.eventsGrid && (refs.eventsGrid.innerHTML = `<p>Errore nel caricamento eventi</p>`);
    }
  }

  async function searchEventsByName(query) {
    try {
      const data = await apiJson(
        `${API_BASE}/eventi/ricerca?nome=${encodeURIComponent(query)}`
      );
      const found = data.eventi || [];
      allEvents = found;
      renderEvents(found, false);
    } catch (e) {
      console.error("Errore nella ricerca:", e);
      refs.eventsGrid && (refs.eventsGrid.innerHTML = `<p>Errore nella ricerca</p>`);
    }
  }

  /* =========================
     MODALS helpers
     ========================= */
  function openModal(modal) {
    modal && (modal.style.display = "block");
  }

  function closeModal(modal) {
    modal && (modal.style.display = "none");
  }

  /* =========================
     EVENT LISTENERS
     ========================= */
  function attachListeners() {
    if (refs.searchButton) {
      refs.searchButton.addEventListener("click", async (e) => {
        e.preventDefault();
        const qStr = refs.searchInput?.value.trim() || "";
        if (!qStr) {
          refs.searchContainer && refs.searchContainer.classList.toggle("expanded");
          return;
        }
        await searchEventsByName(qStr);
      });
    }

    if (refs.searchInput) {
      refs.searchInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const qStr = refs.searchInput.value.trim();
          if (qStr) await searchEventsByName(qStr);
        }
      });
    }

    if (refs.loginLink && refs.loginModal) {
      refs.loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(refs.loginModal);
      });
    }
    if (refs.openRegisterLink) {
      refs.openRegisterLink.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal(refs.loginModal);
        openModal(refs.registerModal);
      });
    }
    if (refs.openLoginLink) {
      refs.openLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal(refs.registerModal);
        openModal(refs.loginModal);
      });
    }

    if (refs.createEventLink) {
      refs.createEventLink.addEventListener("click", (e) => {
        e.preventDefault();
        showPage("create-event");
      });
    }
    if (refs.backToHomeFromCreate) {
      refs.backToHomeFromCreate.addEventListener("click", () => showPage("home"));
    }

    if (refs.cartIcon) {
      refs.cartIcon.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(refs.cartModal);
      });
    }

    if (refs.infoLink) {
      refs.infoLink.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(refs.infoModal);
      });
    }

    const userCircle = q(".user-circle");
    if (userCircle) {
      userCircle.addEventListener("click", () =>
        refs.userMenu && refs.userMenu.classList.toggle("active")
      );
    }

    const personalInfoLink = q("#personal-info-link");
    if (personalInfoLink) {
      personalInfoLink.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          if (!userData.email) throw new Error("Non loggato");
          const data = await apiJson(
            `${API_BASE}/user/${encodeURIComponent(userData.email)}`
          );
          refs.infoName && (refs.infoName.textContent = data.nome || "-");
          refs.infoSurname && (refs.infoSurname.textContent = data.cognome || "-");
          refs.infoEmail && (refs.infoEmail.textContent = data.email || "-");
        } catch {
          refs.infoName && (refs.infoName.textContent = "Errore");
          refs.infoSurname && (refs.infoSurname.textContent = "-");
          refs.infoEmail && (refs.infoEmail.textContent = "-");
        }
        openModal(refs.personalInfoModal);
        refs.userMenu && refs.userMenu.classList.remove("active");
      });
    }

    if (refs.logoutLink) {
      refs.logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }

    if (refs.backToHomeBtn) {
      refs.backToHomeBtn.addEventListener("click", () => showPage("home"));
    }

    if (refs.detailsBuyBtn) {
      refs.detailsBuyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const priceSelect = document.getElementById("ticket-price-select");
        const price = parseFloat(priceSelect?.value || "0") || 0;
        const title = refs.detailsTitle?.textContent || "";

        let fascia = "Non specificato";
        if (priceSelect) {
          const tx = priceSelect.options[priceSelect.selectedIndex]?.text || "";
          fascia = tx.includes(":") ? tx.split(":")[0] : tx;
        }

        if (refs.eventTitleDisplay) refs.eventTitleDisplay.textContent = `Evento: ${title}`;
        if (refs.ticketPriceDisplay) refs.ticketPriceDisplay.textContent = fmtEuro(price);
        if (refs.ticketNameInput) refs.ticketNameInput.value = userData.name || "";
        if (refs.ticketSurnameInput) refs.ticketSurnameInput.value = userData.surname || "";

        openModal(refs.addToCartModal);
      });
    }

    if (refs.addToCartForm) {
      refs.addToCartForm.addEventListener("submit", (e) => {
        e.preventDefault();
        addToCartFromDetails();
      });
    }

    if (refs.clearCartButton) {
      refs.clearCartButton.addEventListener("click", () => {
        cart = [];
        saveCart();
        updateCartUI();
        toast("Carrello svuotato.");
      });
    }

    if (refs.checkoutButton) {
      refs.checkoutButton.addEventListener("click", () => {
        if (!cart.length) return toast("Il carrello è vuoto!");

        closeModal(refs.cartModal);
        if (refs.checkoutList) refs.checkoutList.innerHTML = "";
        cart.forEach((it) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <h4>${it.title}</h4>
            <p>Fascia: ${it.fascia}</p>
            <p>Nome: ${it.name}</p>
            <p>Cognome: ${it.surname}</p>
            <p>Prezzo: ${fmtEuro(it.price)}</p>
          `;
          refs.checkoutList.appendChild(li);
        });
        const tot = cart.reduce((s, it) => s + Number(it.price || 0), 0);
        refs.checkoutTotal && (refs.checkoutTotal.textContent = fmtEuro(tot));
        openModal(refs.checkoutDetailsModal);
      });
    }

    if (refs.proceedToPayment) {
      refs.proceedToPayment.addEventListener("click", () => {
        closeModal(refs.checkoutDetailsModal);
        openModal(refs.paymentModal);
      });
    }

    // MODIFICA QUI
    if (refs.paymentForm) {
      refs.paymentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        purchasedTickets = [...purchasedTickets, ...cart];
        saveTickets();
        cart = [];
        saveCart();
        updateCartUI();
        toast("Pagamento completato!");
        // Ritarda la chiusura della modale per mostrare il toast
        setTimeout(() => {
          closeModal(refs.paymentModal);
        }, 1500); // 1.5 secondi
      });
    }

    if (refs.myTicketsLink) {
      refs.myTicketsLink.addEventListener("click", (e) => {
        e.preventDefault();
        refs.userMenu && refs.userMenu.classList.remove("active");
        if (refs.ticketsList) refs.ticketsList.innerHTML = "";

        if (purchasedTickets.length) {
          refs.noTicketsMsg && (refs.noTicketsMsg.style.display = "none");
          purchasedTickets.forEach((t) => {
            const li = document.createElement("li");
            li.innerHTML = `
              <h4>${t.title}</h4>
              <p>Fascia: ${t.fascia}</p>
              <p>Nome: ${t.name} ${t.surname}</p>
              <p>Prezzo pagato: ${fmtEuro(t.price)}</p>
            `;
            refs.ticketsList.appendChild(li);
          });
        } else {
          refs.noTicketsMsg && (refs.noTicketsMsg.style.display = "block");
        }
        openModal(refs.myTicketsModal);
      });
    }

    if (refs.loginForm) {
      refs.loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = q("#email")?.value || "";
        const password = q("#password")?.value || "";
        try {
          const data = await apiJson(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          toast(data.message || "Login riuscito");
          login(email.split("@")[0], email);
        } catch (err) {
          alert(`Errore login: ${err.message || "Credenziali non valide"}`);
        }
      });
    }

    if (refs.registerForm) {
      refs.registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = q("#reg-name")?.value || "";
        const cognome = q("#reg-surname")?.value || "";
        const email = q("#reg-email")?.value || "";
        const password = q("#reg-password")?.value || "";
        try {
          await apiJson(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, cognome, email, password }),
          });
          alert("Registrazione completata! Ora effettua il login.");
          closeModal(refs.registerModal);
          openModal(refs.loginModal);
        } catch (err) {
          alert(`Errore registrazione: ${err.message || "Dati non validi"}`);
        }
      });
    }

    if (refs.createEventForm) {
      refs.createEventForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(refs.createEventForm);
        try {
          const data = await apiJson(`${API_BASE}/eventi`, {
            method: "POST",
            body: fd,
          });
          alert(`Evento creato con successo! ID: ${data.evento_id}`);
          refs.createEventForm.reset();
          showPage("home");
          loadEvents();
        } catch (err) {
          alert(`Errore nella creazione dell'evento: ${err.message}`);
        }
      });
    }

    if (refs.filterButtons?.length) {
      refs.filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          refs.filterButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const label = btn.querySelector("span")?.textContent?.toLowerCase() || "";
          const map = {
            "oggi": "oggi",
            "domani": "domani",
            "questo fine settimana": "fine settimana",
            "mostra tutto": "mostra tutto",
          };
          loadEvents(map[label] || null);
        });
      });
    }

    if (refs.chatBubble) {
      refs.chatBubble.addEventListener("click", () => openModal(refs.chatModal));
    }
    if (refs.chatCloseBtn) {
      refs.chatCloseBtn.addEventListener("click", () => closeModal(refs.chatModal));
    }
    if (refs.chatSendBtn && refs.chatInput && refs.chatBody) {
      function addMsg(text, who) {
        const d = document.createElement("div");
        d.className = `message-bubble ${who}`;
        d.textContent = text;
        refs.chatBody.appendChild(d);
        refs.chatBody.scrollTop = refs.chatBody.scrollHeight;
      }
      refs.chatSendBtn.addEventListener("click", async () => {
        const msg = refs.chatInput.value.trim();
        if (!msg) return;
        addMsg(msg, "sent");
        refs.chatInput.value = "";
        try {
          const data = await apiJson(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: msg }),
          });
          addMsg(
            data.response ||
            "Mi dispiace, c'è stato un problema. Assicurati che il server sia attivo.",
            "received"
          );
        } catch (err) {
          addMsg("Mi dispiace, c'è stato un problema. Assicurati che il server sia attivo.", "received");
        }
      });
      refs.chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          refs.chatSendBtn.click();
        }
      });
    }

    if (refs.closeButtons?.length) {
      refs.closeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const m = btn.closest(".modal");
          if (m) closeModal(m);
        });
      });
    }

    window.addEventListener("click", (e) => {
      refs.modals.forEach((m) => {
        if (e.target === m) closeModal(m);
      });
    });

    document.addEventListener("click", (e) => {
      if (
        refs.userProfile &&
        !refs.userProfile.contains(e.target) &&
        refs.userMenu?.classList.contains("active")
      ) {
        refs.userMenu.classList.remove("active");
      }
    });

    const homeLogo = q("#home-logo");
    if (homeLogo) {
      homeLogo.addEventListener("click", (e) => {
        e.preventDefault();
        showPage("home");
      });
    }
  }

  /* =========================
     REVIEWS FORM
     ========================= */
  function attachReviewForm() {
    if (!refs.reviewForm) return;
    refs.reviewForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const author = refs.reviewName?.value?.trim() || "Anonimo";
      const rating = parseInt(refs.reviewRating?.value || "5", 10);
      const text = refs.reviewText?.value?.trim() || "";
      const img = getRandomFaceImage();

      const card = document.createElement("div");
      card.className = "review-card";
      card.innerHTML = `
        <img src="${img}" alt="Foto di ${author}" class="reviewer-img">
        <div class="review-content">
          <span class="review-author">${author}</span>
          <div class="review-rating" data-rating="${rating}">${starHtml(rating)}</div>
          <p class="review-text">${text}</p>
        </div>`;
      stopReviewRotation();
      refs.reviewsList?.prepend(card);

      reviews = qa(".review-card", refs.reviewsList);
      reviews.forEach((c) => c.classList.remove("active"));
      currentReviewIndex = 0;
      reviews[0]?.classList.add("active");
      startReviewRotation();

      refs.reviewForm.reset();
    });
  }

  /* =========================
     INIT
     ========================= */
  function init() {
    loadUser();
    loadCart();
    loadTickets();
    updateUserUI();
    updateCartUI();
    attachListeners();
    attachReviewForm();
    initReviews();
    showPage("home");
    loadEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
