/* ============================================
   VIPERMISTICO - App Logic
   ============================================ */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '525573261383';

  // --- DOM refs ---
  const $productGrid = document.getElementById('productGrid');
  const $filtersScroll = document.getElementById('filtersScroll');
  const $catalogTitle = document.getElementById('catalogTitle');
  const $catalogCount = document.getElementById('catalogCount');
  const $cartToggle = document.getElementById('cartToggle');
  const $cartBadge = document.getElementById('cartBadge');
  const $cartPanel = document.getElementById('cartPanel');
  const $cartOverlay = document.getElementById('cartOverlay');
  const $cartItems = document.getElementById('cartItems');
  const $cartFooter = document.getElementById('cartFooter');
  const $cartTotalCount = document.getElementById('cartTotalCount');
  const $cartClose = document.getElementById('cartClose');
  const $shareCartBtn = document.getElementById('shareCartBtn');
  const $clearCartBtn = document.getElementById('clearCartBtn');
  const $shareModalOverlay = document.getElementById('shareModalOverlay');
  const $shareModalClose = document.getElementById('shareModalClose');
  const $shareUrlInput = document.getElementById('shareUrlInput');
  const $copyLinkBtn = document.getElementById('copyLinkBtn');
  const $shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
  const $toast = document.getElementById('toast');
  const $toastMessage = document.getElementById('toastMessage');
  const $sharedCartBanner = document.getElementById('sharedCartBanner');
  const $sharedCartItems = document.getElementById('sharedCartItems');
  const $sharedWhatsappBtn = document.getElementById('sharedWhatsappBtn');
  const $sharedBrowseBtn = document.getElementById('sharedBrowseBtn');
  const $hero = document.getElementById('hero');

  // --- State ---
  let cart = [];
  let activeFilter = 'Todos';
  let toastTimeout = null;

  // --- Helpers ---
  function getProduct(id) {
    return PRODUCTS.find(function (p) { return p.id === id; });
  }

  function getCartCount() {
    return cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
  }

  function getBrands() {
    var brands = {};
    PRODUCTS.forEach(function (p) { brands[p.brand] = true; });
    return ['Todos'].concat(Object.keys(brands).sort());
  }

  // --- localStorage ---
  function saveCart() {
    try {
      localStorage.setItem('vipermistico_cart', JSON.stringify(cart));
    } catch (e) { /* storage full or unavailable */ }
  }

  function loadCart() {
    try {
      var saved = localStorage.getItem('vipermistico_cart');
      cart = saved ? JSON.parse(saved) : [];
    } catch (e) {
      cart = [];
    }
  }

  // --- Toast ---
  function showToast(message) {
    $toastMessage.textContent = message;
    $toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      $toast.classList.remove('show');
    }, 2500);
  }

  // --- Cart Badge ---
  function updateBadge() {
    var count = getCartCount();
    $cartBadge.textContent = count;
    if (count > 0) {
      $cartBadge.classList.add('visible');
    } else {
      $cartBadge.classList.remove('visible');
    }
  }

  // ============================================
  // FILTERS
  // ============================================
  function renderFilters() {
    var brands = getBrands();
    $filtersScroll.innerHTML = brands.map(function (brand) {
      var isActive = brand === activeFilter ? ' active' : '';
      return '<button class="filter-pill' + isActive + '" data-brand="' + brand + '" role="tab" aria-selected="' + (brand === activeFilter) + '">' + brand + '</button>';
    }).join('');
  }

  function handleFilterClick(e) {
    var pill = e.target.closest('.filter-pill');
    if (!pill) return;
    activeFilter = pill.dataset.brand;
    renderFilters();
    renderProducts();

    // Scroll selected pill into view
    pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // ============================================
  // PRODUCTS
  // ============================================
  function renderProducts() {
    var filtered = activeFilter === 'Todos'
      ? PRODUCTS
      : PRODUCTS.filter(function (p) { return p.brand === activeFilter; });

    $catalogTitle.textContent = activeFilter === 'Todos' ? 'TODOS LOS MODELOS' : activeFilter.toUpperCase();
    $catalogCount.textContent = filtered.length + (filtered.length === 1 ? ' producto' : ' productos');

    $productGrid.innerHTML = filtered.map(function (product, index) {
      var inCart = cart.some(function (item) { return item.productId === product.id; });
      return '<article class="product-card" data-id="' + product.id + '" style="animation-delay: ' + (index * 0.05) + 's">' +
        '<div class="product-image">' +
          '<span class="product-brand-tag">' + product.brand + '</span>' +
          '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" width="400" height="400">' +
        '</div>' +
        '<div class="product-info">' +
          '<h3 class="product-name">' + product.name + '</h3>' +
          '<button class="btn-add-cart' + (inCart ? ' added' : '') + '" data-id="' + product.id + '">' +
            '<i class="fa-solid ' + (inCart ? 'fa-check' : 'fa-cart-plus') + '"></i> ' +
            (inCart ? 'En tu carrito' : 'Agregar') +
          '</button>' +
        '</div>' +
      '</article>';
    }).join('');

    // Stagger animation (respects reduced motion)
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      var cards = $productGrid.querySelectorAll('.product-card');
      cards.forEach(function (card, i) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        setTimeout(function () {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 60);
      });
    }
  }

  function handleProductClick(e) {
    var btn = e.target.closest('.btn-add-cart');
    if (!btn) return;

    var id = parseInt(btn.dataset.id, 10);
    addToCart(id);
  }

  // ============================================
  // CART OPERATIONS
  // ============================================
  function addToCart(productId) {
    var existing = cart.find(function (item) { return item.productId === productId; });
    if (existing) {
      if (existing.quantity < 10) {
        existing.quantity++;
      }
    } else {
      cart.push({ productId: productId, quantity: 1 });
    }
    saveCart();
    updateBadge();
    renderProducts();
    renderCartItems();

    var product = getProduct(productId);
    showToast(product ? product.name + ' agregado' : 'Agregado al carrito');
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateBadge();
    renderProducts();
    renderCartItems();
  }

  function updateQuantity(index, delta) {
    var item = cart[index];
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(index);
      return;
    }
    if (item.quantity > 10) item.quantity = 10;
    saveCart();
    updateBadge();
    renderCartItems();
  }

  function clearCart() {
    cart = [];
    saveCart();
    updateBadge();
    renderProducts();
    renderCartItems();
    closeCart();
    showToast('Carrito vaciado');
  }

  // ============================================
  // CART PANEL
  // ============================================
  function openCart() {
    $cartPanel.classList.add('open');
    $cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCartItems();
  }

  function closeCart() {
    $cartPanel.classList.remove('open');
    $cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderCartItems() {
    if (cart.length === 0) {
      $cartItems.innerHTML =
        '<div class="cart-empty">' +
          '<i class="fa-solid fa-bag-shopping"></i>' +
          '<p>Tu carrito est\u00e1 vac\u00edo</p>' +
          '<button class="cart-empty-cta" id="cartEmptyCta">Seguir comprando</button>' +
        '</div>';
      $cartFooter.style.display = 'none';

      var cta = document.getElementById('cartEmptyCta');
      if (cta) {
        cta.addEventListener('click', closeCart);
      }
      return;
    }

    $cartFooter.style.display = 'flex';
    $cartTotalCount.textContent = getCartCount() + (getCartCount() === 1 ? ' art\u00edculo' : ' art\u00edculos');

    $cartItems.innerHTML = cart.map(function (item, index) {
      var product = getProduct(item.productId);
      if (!product) return '';
      return '<div class="cart-item" style="animation-delay: ' + (index * 0.05) + 's">' +
        '<div class="cart-item-image">' +
          '<img src="' + product.image + '" alt="' + product.name + '" width="72" height="72">' +
        '</div>' +
        '<div class="cart-item-details">' +
          '<p class="cart-item-name">' + product.name + '</p>' +
          '<span class="cart-item-brand">' + product.brand + '</span>' +
          '<div class="cart-item-controls">' +
            '<button class="qty-btn" data-action="decrease" data-index="' + index + '" aria-label="Disminuir cantidad">' +
              '<i class="fa-solid fa-minus"></i>' +
            '</button>' +
            '<span class="cart-item-qty">' + item.quantity + '</span>' +
            '<button class="qty-btn" data-action="increase" data-index="' + index + '" aria-label="Aumentar cantidad">' +
              '<i class="fa-solid fa-plus"></i>' +
            '</button>' +
            '<button class="cart-item-remove" data-action="remove" data-index="' + index + '" aria-label="Eliminar del carrito">' +
              '<i class="fa-solid fa-trash-can"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function handleCartItemAction(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    var index = parseInt(btn.dataset.index, 10);

    if (action === 'increase') updateQuantity(index, 1);
    else if (action === 'decrease') updateQuantity(index, -1);
    else if (action === 'remove') removeFromCart(index);
  }

  // ============================================
  // CART SHARING
  // ============================================
  function generateShareLink() {
    var cartData = cart.map(function (item) {
      return [item.productId, item.quantity];
    });
    var json = JSON.stringify(cartData);
    var encoded = btoa(unescape(encodeURIComponent(json)));
    return window.location.origin + window.location.pathname + '#cart=' + encoded;
  }

  function parseSharedCart() {
    var hash = window.location.hash;
    if (!hash || !hash.startsWith('#cart=')) return null;
    try {
      var encoded = hash.substring(6);
      var json = decodeURIComponent(escape(atob(encoded)));
      var data = JSON.parse(json);
      // Validate structure
      if (!Array.isArray(data)) return null;
      return data.map(function (entry) {
        return { productId: entry[0], quantity: entry[1] || 1 };
      });
    } catch (e) {
      return null;
    }
  }

  function buildCartSummaryText(items) {
    var lines = items.map(function (item) {
      var product = getProduct(item.productId);
      if (!product) return null;
      return '- ' + product.name + ' (x' + item.quantity + ')';
    }).filter(Boolean);
    return lines.join('\n');
  }

  function openShareModal() {
    var link = generateShareLink();
    $shareUrlInput.value = link;
    $shareModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Reset copy button
    $copyLinkBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
    $copyLinkBtn.classList.remove('copied');
  }

  function closeShareModal() {
    $shareModalOverlay.classList.remove('open');
    // Only restore scroll if cart panel is also closed
    if (!$cartPanel.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function copyShareLink() {
    var link = $shareUrlInput.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function () {
        $copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
        $copyLinkBtn.classList.add('copied');
        showToast('Enlace copiado');
      });
    } else {
      // Fallback
      $shareUrlInput.select();
      document.execCommand('copy');
      $copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
      $copyLinkBtn.classList.add('copied');
      showToast('Enlace copiado');
    }
  }

  function shareViaWhatsApp() {
    var link = generateShareLink();
    var summary = buildCartSummaryText(cart);
    var totalItems = getCartCount();
    var message = 'Hola! Me interesan estos productos de VIPERMISTICO (' + totalItems + ' art\u00edculos):\n\n' + summary + '\n\n' + link;
    var encoded = encodeURIComponent(message);
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encoded, '_blank');
  }

  // ============================================
  // SHARED CART VIEW
  // ============================================
  function renderSharedCart(items) {
    $sharedCartBanner.classList.add('active');
    $hero.style.display = 'none';

    $sharedCartItems.innerHTML = items.map(function (item) {
      var product = getProduct(item.productId);
      if (!product) return '';
      return '<div class="shared-cart-item">' +
        '<img src="' + product.image + '" alt="' + product.name + '" width="64" height="64">' +
        '<div class="shared-cart-item-info">' +
          '<p class="shared-cart-item-name">' + product.name + '</p>' +
          '<span class="shared-cart-item-brand">' + product.brand + '</span>' +
        '</div>' +
        '<span class="shared-cart-item-qty">x' + item.quantity + '</span>' +
      '</div>';
    }).join('');

    // WhatsApp button for shared cart
    var summary = buildCartSummaryText(items);
    var totalItems = items.reduce(function (s, i) { return s + i.quantity; }, 0);
    var message = 'Hola! Un cliente te compartio su carrito de VIPERMISTICO (' + totalItems + ' art\u00edculos):\n\n' + summary + '\n\n' + window.location.href;
    $sharedWhatsappBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);

    $sharedBrowseBtn.addEventListener('click', function () {
      history.replaceState(null, '', window.location.pathname);
      $sharedCartBanner.classList.remove('active');
      $hero.style.display = '';
    });
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  function init() {
    loadCart();
    renderFilters();
    renderProducts();
    updateBadge();

    // Check for shared cart in URL
    var sharedItems = parseSharedCart();
    if (sharedItems && sharedItems.length > 0) {
      renderSharedCart(sharedItems);
    }

    // Filter clicks
    $filtersScroll.addEventListener('click', handleFilterClick);

    // Product grid clicks (event delegation)
    $productGrid.addEventListener('click', handleProductClick);

    // Cart toggle
    $cartToggle.addEventListener('click', openCart);
    $cartClose.addEventListener('click', closeCart);
    $cartOverlay.addEventListener('click', closeCart);

    // Cart item actions (event delegation)
    $cartItems.addEventListener('click', handleCartItemAction);

    // Cart actions
    $shareCartBtn.addEventListener('click', openShareModal);
    $clearCartBtn.addEventListener('click', function () {
      if (cart.length > 0) {
        clearCart();
      }
    });

    // Share modal
    $shareModalClose.addEventListener('click', closeShareModal);
    $shareModalOverlay.addEventListener('click', function (e) {
      if (e.target === $shareModalOverlay) closeShareModal();
    });
    $copyLinkBtn.addEventListener('click', copyShareLink);
    $shareWhatsappBtn.addEventListener('click', function (e) {
      e.preventDefault();
      shareViaWhatsApp();
    });

    // Keyboard: Escape closes panels
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if ($shareModalOverlay.classList.contains('open')) {
          closeShareModal();
        } else if ($cartPanel.classList.contains('open')) {
          closeCart();
        }
      }
    });
  }

  // --- Start ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
