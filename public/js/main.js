// SABJIWALA - Main JavaScript

document.addEventListener('DOMContentLoaded', function () {
  // Auto-dismiss flash messages
  setTimeout(() => {
    document.querySelectorAll('.flash-msg').forEach(el => {
      el.style.transition = 'all 0.4s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      setTimeout(() => el.remove(), 400);
    });
  }, 4000);

  // Add to cart (product listing page)
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const productId = this.dataset.id;
      const qtyInput = document.getElementById(`qty-${productId}`);
      const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

      try {
        const res = await fetch('/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity })
        });

        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          updateCartCount(data.cartCount);

          // ✅ FIX START
          this.classList.add("added");

          this.innerHTML = `
            <i class="bi bi-check"></i>
            <span class="btn-text">Added</span>
          `;
          // ✅ FIX END

          this.style.background = 'var(--primary-dark)';

          setTimeout(() => {
            this.classList.remove("added");

            this.innerHTML = `
              <i class="bi bi-cart-plus"></i>
              <span class="btn-text">Add</span>
            `;

            this.style.background = '';
            this.disabled = false;
          }, 1800);

        } else {
          showToast(data.message || 'Failed to add.', 'error');

          this.innerHTML = `
            <i class="bi bi-cart-plus"></i>
            <span class="btn-text">Add</span>
          `;

          this.disabled = false;
        }

      } catch (e) {
        showToast('Network error!', 'error');

        this.innerHTML = `
          <i class="bi bi-cart-plus"></i>
          <span class="btn-text">Add</span>
        `;

        this.disabled = false;
      }
    });
  });

  // Quantity buttons on product listing
  document.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.dataset.id;
      const input = document.getElementById(`qty-${id}`);
      if (input && parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
      }
    });
  });

  document.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.dataset.id;
      const input = document.getElementById(`qty-${id}`);
      if (input) {
        input.value = parseInt(input.value) + 1;
      }
    });
  });

  // Cart page - quantity update
  document.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', function () {
      const pid = this.dataset.pid;
      const display = document.getElementById(`cart-qty-${pid}`);
      const current = parseInt(display.textContent);
      updateCartItem(pid, current - 1);
    });
  });

  document.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', function () {
      const pid = this.dataset.pid;
      const display = document.getElementById(`cart-qty-${pid}`);
      const current = parseInt(display.textContent);
      updateCartItem(pid, current + 1);
    });
  });

  // Remove item from cart
  document.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const pid = this.dataset.pid;
      if (!confirm('Remove this item from cart?')) return;

      const res = await fetch('/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: pid })
      });

      const data = await res.json();

      if (data.success) {
        document.getElementById(`cart-row-${pid}`).remove();
        refreshCartSummary(data);
        updateCartCount(data.cartCount);
        showToast('Item removed from cart!', 'info');

        if (data.cart.length === 0) {
          document.querySelector('.cart-items-container').innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added anything yet!</p>
              <a href="/products" class="btn-primary-green">Shop Now</a>
            </div>`;
          document.querySelector('.cart-summary-section').style.display = 'none';
        }
      }
    });
  });

  // Dashboard tabs
  document.querySelectorAll('.sidebar-nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', function () {
      const tab = this.dataset.tab;

      document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));

      document.getElementById(`tab-${tab}`).classList.add('active');
      this.classList.add('active');
    });
  });

  // Search form
  const heroSearchForm = document.getElementById('hero-search-form');
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = document.getElementById('hero-search-input').value.trim();
      if (q) {
        window.location.href = `/products?search=${encodeURIComponent(q)}`;
      }
    });
  }
});

// =============================
// Helper Functions
// =============================

async function updateCartItem(productId, quantity) {
  const res = await fetch('/cart/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity })
  });

  const data = await res.json();

  if (data.success) {
    const display = document.getElementById(`cart-qty-${productId}`);
    const row = document.getElementById(`cart-row-${productId}`);

    if (quantity <= 0) {
      if (row) row.remove();
    } else {
      if (display) display.textContent = quantity;

      const item = data.cart.find(i => i.productId === productId);
      if (item) {
        const itemTotal = document.getElementById(`cart-item-total-${productId}`);
        if (itemTotal) {
          itemTotal.textContent = '₹' + (item.price * item.quantity).toFixed(0);
        }
      }
    }

    refreshCartSummary(data);
    updateCartCount(data.cartCount);
  }
}

function refreshCartSummary(data) {
  const subtotalEl = document.getElementById('cart-subtotal');
  const deliveryEl = document.getElementById('cart-delivery');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.textContent = '₹' + data.subtotal.toFixed(0);
  if (deliveryEl) deliveryEl.textContent = data.deliveryCharge === 0 ? 'FREE' : '₹' + data.deliveryCharge;
  if (totalEl) totalEl.textContent = '₹' + data.total.toFixed(0);
}

function updateCartCount(count) {
  const badges = document.querySelectorAll('.cart-count-badge');
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline' : 'none';
  });
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.flash-container');

  if (!container) {
    container = document.createElement('div');
    container.className = 'flash-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  toast.className = `flash-msg flash-${type}`;
  toast.innerHTML = `${icon} ${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}