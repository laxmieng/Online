const products = window.LAXMI_PRODUCTS || [];
const contact = window.LAXMI_CONTACT || {};

function whatsappLink(message) {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

function initHeader() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const page = document.body.dataset.page;
  document.querySelectorAll(".site-nav a[data-page]").forEach((link) => {
    if (link.dataset.page === page) link.classList.add("active");
  });
}

function productCard(product) {
  const firstImage = product.images[0];
  const prevIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5 9 12l6.5 6.5"/></svg>';
  const nextIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 5.5 6.5 6.5-6.5 6.5"/></svg>';
  const zoomIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
  return `
    <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-label="Open details for ${product.name}">
      <div class="product-slider" data-slider data-images="${product.images.join("|")}">
        <button class="slide-btn prev" type="button" aria-label="Previous image">${prevIcon}</button>
        <img src="${firstImage}" alt="${product.name}" loading="lazy">
        <button class="slide-btn next" type="button" aria-label="Next image">${nextIcon}</button>
        <div class="viewer-count" aria-live="polite"><span data-current>1</span>/<span>${product.images.length}</span></div>
        <div class="viewer-dots" aria-hidden="true">${product.images.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("")}</div>
        <button class="zoom-btn" type="button" data-zoom="${firstImage}" data-zoom-images="${product.images.join("|")}" data-zoom-index="0" aria-label="View and zoom product images">${zoomIcon}<span>View</span></button>
      </div>
      <div class="product-copy">
        <span>${product.category}</span>
        <h3>${product.name}</h3>
        <div class="card-actions">
          <a class="btn small" href="product-detail.html?product=${product.id}">View Details</a>
          <a class="btn small ghost" target="_blank" rel="noreferrer" href="${whatsappLink(`I want to inquire about ${product.name}`)}">WhatsApp Inquiry</a>
        </div>
      </div>
    </article>
  `;
}
function renderProducts(targetSelector, limit) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  target.innerHTML = products.slice(0, limit || products.length).map(productCard).join("");
  initSliders(target);
}

function initProductFilters() {
  const grid = document.querySelector("#allProducts");
  const search = document.querySelector("#productSearch");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const empty = document.querySelector("#productEmpty");
  if (!grid || (!search && !filterButtons.length)) return;

  let activeFilter = "all";

  const productGroup = (product) => {
    const text = `${product.name} ${product.shortName} ${product.type} ${product.category}`.toLowerCase();
    return text.includes("spare") || text.includes("parts") ? "spare-parts" : "machines";
  };

  const renderFiltered = () => {
    const query = (search?.value || "").trim().toLowerCase();
    const filtered = products.filter((product) => {
      const searchable = [
        product.name,
        product.shortName,
        product.type,
        product.category,
        product.system,
        ...Object.values(product.specs || {})
      ].join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesFilter = activeFilter === "all" || productGroup(product) === activeFilter;
      return matchesSearch && matchesFilter;
    });

    grid.innerHTML = filtered.map(productCard).join("");
    if (empty) empty.hidden = filtered.length > 0;
    initSliders(grid);
  };

  search?.addEventListener("input", renderFiltered);
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderFiltered();
    });
  });
}

function initSliders(scope = document) {
  scope.querySelectorAll("[data-slider]").forEach((slider) => {
    window.clearInterval(slider._autoSlideTimer);
    const images = slider.dataset.images.split("|");
    images.forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });
    const img = slider.querySelector("img");
    const zoom = slider.querySelector(".zoom-btn");
    const current = slider.querySelector("[data-current]");
    const dots = [...slider.querySelectorAll(".viewer-dots span")];
    let index = 0;

    const show = (nextIndex) => {
      index = (nextIndex + images.length) % images.length;
      img.classList.add("is-changing");
      window.setTimeout(() => {
        img.src = images[index];
        img.addEventListener("load", () => img.classList.remove("is-changing"), { once: true });
        window.setTimeout(() => img.classList.remove("is-changing"), 260);
      }, 120);
      if (zoom) {
        zoom.dataset.zoom = images[index];
        zoom.dataset.zoomIndex = String(index);
      }
      if (current) current.textContent = String(index + 1);
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    };

    const restartAutoSlide = () => {
      window.clearInterval(slider._autoSlideTimer);
      slider._autoSlideTimer = window.setInterval(() => show(index + 1), 3600);
    };

    slider.querySelector(".prev")?.addEventListener("click", () => {
      show(index - 1);
      restartAutoSlide();
    });
    slider.querySelector(".next")?.addEventListener("click", () => {
      show(index + 1);
      restartAutoSlide();
    });
    slider.addEventListener("mouseenter", () => window.clearInterval(slider._autoSlideTimer));
    slider.addEventListener("mouseleave", restartAutoSlide);
    restartAutoSlide();
  });
}
function renderDetailPage() {
  const target = document.querySelector("#productDetail");
  if (!target) return;

  const id = new URLSearchParams(location.search).get("product") || products[0]?.id;
  const product = products.find((item) => item.id === id) || products[0];
  if (!product) return;

  document.title = `${product.name} | Laxmi Engineering`;
  const specRows = Object.entries({
    "Name of the Product": product.name,
    Type: product.type,
    System: product.system,
    ...product.specs
  }).map(([key, value]) => `<tr><th>${key}</th><td>${value}</td></tr>`).join("");

  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .map(productCard)
    .join("");

  target.innerHTML = `
    <div class="page-title"><p class="eyebrow">Product Detail</p><h1>${product.shortName}</h1></div>
    <section class="detail-layout section amazon-detail">
      <div class="gallery-panel">
        <div class="main-gallery" data-detail-gallery>
          <button class="slide-btn prev" type="button" aria-label="Previous image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5 9 12l6.5 6.5"/></svg></button>
          <img src="${product.images[0]}" alt="${product.name}">
          <button class="slide-btn next" type="button" aria-label="Next image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 5.5 6.5 6.5-6.5 6.5"/></svg></button>
          <button class="zoom-btn" type="button" data-zoom="${product.images[0]}" data-zoom-images="${product.images.join("|")}" data-zoom-index="0" aria-label="View and zoom product images"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><span>View</span></button>
        </div>
        <div class="thumb-row">
          ${product.images.map((image, i) => `<button type="button" class="${i === 0 ? "active" : ""}" data-thumb="${image}"><img src="${image}" alt="${product.shortName} image ${i + 1}"></button>`).join("")}
        </div>
      </div>
      <div class="detail-info-panel">
        <p class="eyebrow">${product.category}</p>
        <h2>${product.name}</h2>
        <div class="detail-actions-inline">
          <a class="btn" target="_blank" rel="noreferrer" href="${whatsappLink(`Please send details for ${product.name}`)}">Product Inquiry</a>
          <button class="btn ghost" type="button" data-share="${product.name}">Share Product</button>
        </div>
        <h3>Machine Specifications</h3>
        <table class="spec-table"><tbody>${specRows}</tbody></table>
      </div>
    </section>
    <section class="section related-products-section">
      <div class="section-head"><div><p class="eyebrow">Other Products</p><h2>More Machines</h2></div></div>
      <div class="product-grid">${relatedProducts}</div>
    </section>
  `;

  initDetailGallery(product);
  initSliders(target.querySelector(".related-products-section"));
}
function initDetailGallery(product) {
  const gallery = document.querySelector("[data-detail-gallery]");
  if (!gallery) return;
  product.images.forEach((src) => {
    const preload = new Image();
    preload.src = src;
  });
  const image = gallery.querySelector("img");
  const zoom = gallery.querySelector(".zoom-btn");
  const thumbs = [...document.querySelectorAll("[data-thumb]")];
  let index = 0;

  const show = (next) => {
    index = (next + product.images.length) % product.images.length;
    image.src = product.images[index];
    zoom.dataset.zoom = product.images[index];
    zoom.dataset.zoomIndex = String(index);
    thumbs.forEach((thumb, i) => thumb.classList.toggle("active", i === index));
  };

  gallery.querySelector(".prev").addEventListener("click", () => show(index - 1));
  gallery.querySelector(".next").addEventListener("click", () => show(index + 1));
  thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => show(i)));
}

function initZoom() {
  const modal = document.querySelector("#zoomModal");
  if (!modal) return;
  const img = modal.querySelector("img");
  const tools = modal.querySelector(".zoom-tools");
  const stage = modal.querySelector(".zoom-stage");
  let scale = 1;
  let images = [];
  let index = 0;

  if (tools && !tools.querySelector(".zoom-counter")) {
    tools.insertAdjacentHTML("afterbegin", '<span class="zoom-counter" aria-live="polite"><span data-zoom-current>1</span>/<span data-zoom-total>1</span></span>');
  }

  tools?.querySelectorAll("[data-zoom-prev], [data-zoom-next]").forEach((button) => button.remove());
  if (stage && !stage.querySelector("[data-zoom-prev]")) {
    stage.insertAdjacentHTML("afterbegin", '<button class="zoom-side-btn zoom-prev" data-zoom-prev type="button" aria-label="Previous image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 5.5 9 12l6.5 6.5"/></svg></button><button class="zoom-side-btn zoom-next" data-zoom-next type="button" aria-label="Next image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 5.5 6.5 6.5-6.5 6.5"/></svg></button>');
  }
  const currentCount = modal.querySelector("[data-zoom-current]");
  const totalCount = modal.querySelector("[data-zoom-total]");

  const syncZoomState = () => {
    stage?.classList.toggle("is-zoomed", scale > 1);
  };

  const show = (nextIndex) => {
    if (!images.length) return;
    index = (nextIndex + images.length) % images.length;
    scale = 1;
    img.src = images[index];
    img.style.transform = `scale(${scale})`;
    if (currentCount) currentCount.textContent = String(index + 1);
    if (totalCount) totalCount.textContent = String(images.length);
    syncZoomState();
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-zoom]");
    if (!button) return;
    images = (button.dataset.zoomImages || button.dataset.zoom || "").split("|").filter(Boolean);
    index = Number(button.dataset.zoomIndex || images.indexOf(button.dataset.zoom) || 0);
    show(index);
    modal.showModal();
  });

  modal.querySelector("[data-close]").addEventListener("click", () => modal.close());
  modal.querySelector("[data-plus]").addEventListener("click", () => {
    scale = Math.min(scale + 0.25, 4);
    img.style.transform = `scale(${scale})`;
    syncZoomState();
  });
  modal.querySelector("[data-minus]").addEventListener("click", () => {
    scale = Math.max(scale - 0.25, 0.5);
    img.style.transform = `scale(${scale})`;
    syncZoomState();
  });
  modal.querySelector("[data-zoom-prev]")?.addEventListener("click", () => show(index - 1));
  modal.querySelector("[data-zoom-next]")?.addEventListener("click", () => show(index + 1));
}
function initInquiryForm() {
  const form = document.querySelector("#inquiryForm");
  if (!form) return;
  const productBox = form.querySelector(".product-options");
  const productError = form.querySelector(".field-error");
  productBox.innerHTML = products.map((product) => `
    <label class="product-option"><input type="checkbox" name="products" value="${product.name}"><span>${product.shortName}</span></label>
  `).join("");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const selectedProducts = formData.getAll("products");
    if (selectedProducts.length === 0) {
      productError.hidden = false;
      productBox.classList.add("has-error");
      productBox.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    productError.hidden = true;
    productBox.classList.remove("has-error");
    const selected = selectedProducts.join(", ");
    const message = [
      "Machine Inquiry from Website",
      `Name: ${formData.get("name")}`,
      `Place: ${formData.get("place")}`,
      `Phone: ${formData.get("phone")}`,
      `Email: ${formData.get("email") || "Optional"}`,
      `Products: ${selected}`,
      `Message: ${formData.get("message") || "Optional"}`
    ].join("\n");
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  });

  productBox.addEventListener("change", () => {
    const hasSelection = form.querySelectorAll('input[name="products"]:checked').length > 0;
    productError.hidden = hasSelection;
    productBox.classList.toggle("has-error", !hasSelection);
  });
}

function initProductCardNavigation() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    const card = event.target.closest(".product-card[data-product-id]");
    if (card) window.location.href = `product-detail.html?product=${card.dataset.productId}`;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const card = event.target.closest(".product-card[data-product-id]");
    if (card) window.location.href = `product-detail.html?product=${card.dataset.productId}`;
  });
}
function initShare() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-share]");
    if (!button) return;
    const shareData = { title: button.dataset.share, text: "Laxmi Engineering product details", url: location.href };
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(location.href);
      button.textContent = "Link Copied";
      setTimeout(() => (button.textContent = "Share Product"), 1800);
    } else {
      button.textContent = "Link Ready";
      setTimeout(() => (button.textContent = "Share Product"), 1800);
    }
  });
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}

function initTypingText() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const selector = [
    "main h1",
    "main h2",
    "main h3",
    "main p",
    "main .hero-feature strong",
    "main .hero-feature span",
    "main .product-copy > span"
  ].join(",");

  const items = [...document.querySelectorAll(selector)].filter((item) => {
    const text = item.textContent.trim();
    return text.length > 0 && item.children.length === 0 && !item.dataset.typed;
  });

  const typeElement = (item) => {
    const text = item.textContent.trim();
    item.dataset.typed = "true";
    item.textContent = "";
    item.classList.add("typing-text");

    let index = 0;
    const speed = text.length > 90 ? 8 : 14;
    const tick = () => {
      item.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) {
        window.setTimeout(tick, speed);
      } else {
        item.classList.remove("typing-text");
      }
    };
    tick();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        typeElement(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  items.forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  renderProducts("#featuredProducts", 4);
  renderProducts("#allProducts");
  initProductFilters();
  renderDetailPage();
  initZoom();
  initInquiryForm();
  initShare();
  initProductCardNavigation();
});




