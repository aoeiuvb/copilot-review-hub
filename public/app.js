/* global state */
let reviews = [];
let settings = { autoApprove: false, autoApproveDelay: 0, notificationsEnabled: true };
let activeFilter = 'all';
let openReviewId = null;
let ws = null;

/* ===== WebSocket ===== */
function connectWs() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);

  ws.addEventListener('open', () => {
    document.getElementById('ws-status').classList.add('connected');
    document.getElementById('ws-status').title = 'Connected';
  });

  ws.addEventListener('close', () => {
    document.getElementById('ws-status').classList.remove('connected');
    document.getElementById('ws-status').title = 'Disconnected – reconnecting…';
    setTimeout(connectWs, 3000);
  });

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'init') {
      reviews = msg.payload;
      renderList();
    } else if (msg.type === 'review_created') {
      reviews.unshift(msg.payload);
      renderList();
      notifyNew(msg.payload);
      showToast(`New review: ${msg.payload.title}`, 'info');
    } else if (msg.type === 'review_updated') {
      const idx = reviews.findIndex(r => r.id === msg.payload.id);
      if (idx >= 0) reviews[idx] = msg.payload;
      else reviews.unshift(msg.payload);
      renderList();
      if (openReviewId === msg.payload.id) openModal(msg.payload.id);
    } else if (msg.type === 'settings_updated') {
      settings = msg.payload;
      applySettingsToForm();
    }
  });
}

/* ===== Notifications ===== */
function notifyNew(review) {
  if (!settings.notificationsEnabled) return;
  if (Notification.permission === 'granted') {
    new Notification('Copilot Review Hub', {
      body: `New review: ${review.title}`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="20" font-size="20">🔍</text></svg>',
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') notifyNew(review);
    });
  }
}

/* ===== Render ===== */
function statusClass(status) {
  return `status-${status}`;
}

function statusLabel(status) {
  return { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', auto_approved: 'Auto-Approved' }[status] ?? status;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function renderList() {
  const list = document.getElementById('review-list');
  const empty = document.getElementById('empty-state');
  const filtered = activeFilter === 'all' ? reviews : reviews.filter(r => r.status === activeFilter);

  // Update badge
  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const badge = document.getElementById('pending-badge');
  badge.textContent = pendingCount;
  badge.classList.toggle('visible', pendingCount > 0);

  // Remove old cards (keep empty state element)
  [...list.querySelectorAll('.review-card')].forEach(el => el.remove());

  empty.style.display = filtered.length === 0 ? 'flex' : 'none';

  filtered.forEach(review => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="card-body">
        <div class="card-title">${escHtml(review.title)}</div>
        <div class="card-meta">
          <span class="status-badge ${statusClass(review.status)}">${statusLabel(review.status)}</span>
          ${review.language ? `<span class="lang-tag">${escHtml(review.language)}</span>` : ''}
          <span>${formatDate(review.createdAt)}</span>
        </div>
        <div class="card-preview">${escHtml(review.content.slice(0, 120))}</div>
      </div>`;
    card.addEventListener('click', () => openModal(review.id));
    list.appendChild(card);
  });
}

/* ===== Modal ===== */
function openModal(id) {
  const review = reviews.find(r => r.id === id);
  if (!review) return;
  openReviewId = id;

  document.getElementById('modal-title').textContent = review.title;
  const sb = document.getElementById('modal-status');
  sb.className = `status-badge ${statusClass(review.status)}`;
  sb.textContent = statusLabel(review.status);

  const meta = [];
  meta.push(`ID: ${review.id}`);
  meta.push(`Created: ${formatDate(review.createdAt)}`);
  if (review.language) meta.push(`Language: ${review.language}`);
  if (review.resolvedAt) meta.push(`Resolved: ${formatDate(review.resolvedAt)}`);
  document.getElementById('modal-meta').textContent = meta.join('  ·  ');
  document.getElementById('modal-content').textContent = review.content;

  const commentsSection = document.getElementById('modal-comments-section');
  const commentsEl = document.getElementById('modal-comments');
  if (review.comments) {
    commentsSection.style.display = 'block';
    commentsEl.textContent = review.comments;
  } else {
    commentsSection.style.display = 'none';
  }

  const actions = document.getElementById('modal-actions');
  actions.style.display = review.status === 'pending' ? 'flex' : 'none';
  document.getElementById('action-comments').value = '';

  document.getElementById('modal-overlay').hidden = false;
}

function closeModal() {
  document.getElementById('modal-overlay').hidden = true;
  openReviewId = null;
}

/* ===== API calls ===== */
async function approveReview(id) {
  const comments = document.getElementById('action-comments').value.trim();
  const res = await fetch(`/api/reviews/${id}/approve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments }),
  });
  if (!res.ok) { showToast('Failed to approve', 'danger'); return; }
  showToast('Review approved ✓', 'success');
  closeModal();
}

async function rejectReview(id) {
  const comments = document.getElementById('action-comments').value.trim();
  const res = await fetch(`/api/reviews/${id}/reject`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments }),
  });
  if (!res.ok) { showToast('Failed to reject', 'danger'); return; }
  showToast('Review rejected', 'danger');
  closeModal();
}

async function saveSettings() {
  const body = {
    autoApprove: document.getElementById('auto-approve-toggle').checked,
    autoApproveDelay: parseInt(document.getElementById('auto-approve-delay').value, 10) || 0,
    notificationsEnabled: document.getElementById('notifications-toggle').checked,
  };
  const res = await fetch('/api/settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    settings = await res.json();
    showToast('Settings saved', 'success');
    if (settings.notificationsEnabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } else {
    showToast('Failed to save settings', 'danger');
  }
}

function applySettingsToForm() {
  document.getElementById('auto-approve-toggle').checked = settings.autoApprove;
  document.getElementById('auto-approve-delay').value = settings.autoApproveDelay;
  document.getElementById('notifications-toggle').checked = settings.notificationsEnabled;
  document.getElementById('auto-approve-delay-row').style.display = settings.autoApprove ? 'flex' : 'none';
}

/* ===== Toast ===== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

/* ===== Utility ===== */
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ===== Event wiring ===== */
document.addEventListener('DOMContentLoaded', async () => {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    });
  });

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderList();
    });
  });

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('btn-approve').addEventListener('click', () => approveReview(openReviewId));
  document.getElementById('btn-reject').addEventListener('click', () => rejectReview(openReviewId));

  // Settings
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('auto-approve-toggle').addEventListener('change', (e) => {
    document.getElementById('auto-approve-delay-row').style.display = e.target.checked ? 'flex' : 'none';
  });

  // Load initial settings
  try {
    const res = await fetch('/api/settings');
    settings = await res.json();
    applySettingsToForm();
  } catch (_) {}

  // Request notification permission proactively if enabled
  if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  connectWs();
});
