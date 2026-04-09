document.addEventListener('DOMContentLoaded', () => {
  if (!window.authUtils) return;
  window.authUtils.redirectIfNotAuth();
  window.authUtils.redirectIfNotAdmin();

  const panels = document.querySelectorAll('.tab-panel');
  const navItems = document.querySelectorAll('.sidebar-nav-item');

  function showTab(tabId) {
    panels.forEach(p => p.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    const panel = document.getElementById('tab-' + tabId);
    if (panel) panel.classList.add('active');
    navItems.forEach(n => { if (n.dataset.tab === tabId) n.classList.add('active'); });
    sessionStorage.setItem('adminActiveTab', tabId);
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tab));
  });

  const savedTab = sessionStorage.getItem('adminActiveTab') || 'overview';
  showTab(savedTab);

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getBadgeClass(status) {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'In Progress') return 'badge-progress';
    if (status === 'Resolved') return 'badge-resolved';
    return '';
  }

  async function fetchAllUsers() {
    try {
      const res = await window.authUtils.authFetch('/users');
      const data = await window.authUtils.handleResponse(res);
      return data ? data.users : [];
    } catch (e) { return []; }
  }

  async function fetchAllDisputes() {
    try {
      const res = await window.authUtils.authFetch('/disputes/all');
      const data = await window.authUtils.handleResponse(res);
      return data ? data.disputes : [];
    } catch (e) { return []; }
  }

  async function fetchAllMessages() {
    try {
      const res = await window.authUtils.authFetch('/contact');
      const data = await window.authUtils.handleResponse(res);
      return data ? data.messages : [];
    } catch (e) { return []; }
  }

  function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:32px">No users found</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td style="color:var(--color-text-muted)">${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-resolved' : 'badge-pending'}">${u.role}</span></td>
        <td style="color:var(--color-text-muted)">${formatDate(u.createdAt)}</td>
        <td><button class="btn-delete" onclick="deleteUser('${u._id}')">Delete</button></td>
      </tr>
    `).join('');
  }

  window.deleteUser = async function(userId) {
    if (!confirm('Delete this user and all their disputes?')) return;
    try {
      const res = await window.authUtils.authFetch(`/users/${userId}`, { method: 'DELETE' });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('User deleted successfully', 'success');
        const [users, disputes] = await Promise.all([fetchAllUsers(), fetchAllDisputes()]);
        renderUsers(users);
        renderDisputes(disputes);
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const userSearch = document.getElementById('user-search');
  if (userSearch) {
    userSearch.addEventListener('keyup', () => {
      const q = userSearch.value.toLowerCase();
      const rows = document.querySelectorAll('#users-table-body tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  function renderDisputes(disputes) {
    const tbody = document.getElementById('disputes-table-body');
    if (!tbody) return;
    if (disputes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);padding:32px">No disputes found</td></tr>';
      return;
    }
    tbody.innerHTML = disputes.map(d => `
      <tr>
        <td>
          <div>${d.userId ? d.userId.name : 'Unknown'}</div>
          <div style="color:var(--color-text-muted);font-size:0.8rem">${d.userId ? d.userId.email : ''}</div>
        </td>
        <td>${d.bureau}</td>
        <td>${d.accountName}</td>
        <td>
          <select class="status-select" data-id="${d._id}">
            <option value="Pending" ${d.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${d.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${d.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </td>
        <td><input type="text" class="notes-input" data-id="${d._id}" value="${d.notes || ''}" placeholder="Add notes..."></td>
        <td><button class="btn-primary" style="padding:8px 16px;font-size:0.85rem" onclick="updateDispute('${d._id}', this)">Save</button></td>
      </tr>
    `).join('');
  }

  window.updateDispute = async function(disputeId, btn) {
    const statusEl = document.querySelector(`.status-select[data-id="${disputeId}"]`);
    const notesEl = document.querySelector(`.notes-input[data-id="${disputeId}"]`);
    const status = statusEl ? statusEl.value : '';
    const notes = notesEl ? notesEl.value : '';
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
      const res = await window.authUtils.authFetch(`/disputes/${disputeId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Dispute updated successfully', 'success');
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to update dispute', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save';
    }
  };

  function renderMessages(messages) {
    const list = document.getElementById('messages-list');
    if (!list) return;
    if (messages.length === 0) {
      list.innerHTML = '<div class="empty-state"><h3>No messages</h3><p>No contact messages yet.</p></div>';
      return;
    }
    list.innerHTML = messages.map(m => `
      <div class="message-card ${m.read ? '' : 'unread'}" id="msg-${m._id}">
        <div class="message-sender">${m.name}</div>
        <div class="message-email">${m.email}${m.phone ? ' · ' + m.phone : ''}</div>
        <div class="message-preview">${m.message.substring(0, 150)}${m.message.length > 150 ? '...' : ''}</div>
        <div class="message-footer">
          <span class="message-date">${formatDate(m.createdAt)}</span>
          ${!m.read ? `<button class="btn-mark-read" onclick="markMessageRead('${m._id}', this)">Mark as Read</button>` : '<span style="color:var(--color-text-muted);font-size:0.8rem">Read</span>'}
        </div>
      </div>
    `).join('');
  }

  window.markMessageRead = async function(messageId, btn) {
    try {
      const res = await window.authUtils.authFetch(`/contact/${messageId}/read`, { method: 'PUT' });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        const card = document.getElementById(`msg-${messageId}`);
        if (card) {
          card.classList.remove('unread');
          btn.style.display = 'none';
          const footer = card.querySelector('.message-footer');
          if (footer) footer.insertAdjacentHTML('beforeend', '<span style="color:var(--color-text-muted);font-size:0.8rem">Read</span>');
        }
        const kpiUnread = document.getElementById('kpi-unread');
        if (kpiUnread) {
          const curr = parseInt(kpiUnread.textContent) || 0;
          kpiUnread.textContent = Math.max(0, curr - 1);
        }
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to mark message as read', 'error');
    }
  };

  let adminChartInstance = null;
  function renderAdminChart(disputes) {
    const ctx = document.getElementById('admin-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (adminChartInstance) adminChartInstance.destroy();
    const equifaxCount = disputes.filter(d => d.bureau === 'Equifax').length;
    const experianCount = disputes.filter(d => d.bureau === 'Experian').length;
    const transunionCount = disputes.filter(d => d.bureau === 'TransUnion').length;

    adminChartInstance = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Equifax', 'Experian', 'TransUnion'],
        datasets: [{
          label: 'Disputes',
          data: [equifaxCount, experianCount, transunionCount],
          backgroundColor: ['rgba(184,146,74,0.8)', 'rgba(184,146,74,0.6)', 'rgba(184,146,74,0.4)'],
          borderColor: '#B8924A',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#9A9A9A', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { color: '#9A9A9A' }, grid: { display: false } }
        }
      }
    });
  }

  function renderKPICards(users, disputes, messages) {
    const kpiUsers = document.getElementById('kpi-users');
    const kpiTotal = document.getElementById('kpi-total-disputes');
    const kpiOpen = document.getElementById('kpi-open');
    const kpiUnread = document.getElementById('kpi-unread');
    if (kpiUsers) kpiUsers.textContent = users.length;
    if (kpiTotal) kpiTotal.textContent = disputes.length;
    if (kpiOpen) kpiOpen.textContent = disputes.filter(d => d.status !== 'Resolved').length;
    if (kpiUnread) kpiUnread.textContent = messages.filter(m => !m.read).length;
  }

  Promise.all([fetchAllUsers(), fetchAllDisputes(), fetchAllMessages()]).then(([users, disputes, messages]) => {
    renderKPICards(users, disputes, messages);
    renderAdminChart(disputes);
    renderUsers(users);
    renderDisputes(disputes);
    renderMessages(messages);
  });
});
