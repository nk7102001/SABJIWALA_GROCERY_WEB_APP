// Admin sidebar toggle for mobile
const toggleBtn = document.getElementById('adminSidebarToggle');
const sidebar = document.getElementById('adminSidebar');
const overlay = document.getElementById('adminOverlay');

function openSidebar() {
  sidebar.classList.add('admin-sidebar-open');
  overlay.style.display = 'block';
}

function closeSidebar() {
  sidebar.classList.remove('admin-sidebar-open');
  overlay.style.display = 'none';
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', function () {
    if (sidebar.classList.contains('admin-sidebar-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}

if (overlay) {
  overlay.addEventListener('click', closeSidebar);
}

// Highlight active nav item
document.querySelectorAll('.admin-nav-item').forEach(item => {
  if (item.href && window.location.pathname === new URL(item.href).pathname) {
    item.classList.add('active');
  }
});
