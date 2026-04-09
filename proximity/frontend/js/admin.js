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

  function planBadge(plan) {
    const p = plan || 'none';
    return `<span class="plan-badge ${p}">${p}</span>`;
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

  let allUsersCache = [];

  function renderUsers(users) {
    allUsersCache = users;
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:32px">No users found</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td style="color:var(--color-text-muted)">${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-resolved' : 'badge-pending'}">${u.role}</span></td>
        <td>${planBadge(u.plan)}</td>
        <td style="color:var(--color-text-muted)">${formatDate(u.createdAt)}</td>
        <td><button class="btn-primary" style="padding:6px 14px;font-size:0.8rem" onclick="openUserModal('${u._id}')">Manage</button></td>
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
        renderKPICards(users, disputes, null);
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
        ${m.subject ? `<div style="color:var(--color-gold);font-size:0.85rem;font-weight:600;margin:4px 0">Subject: ${m.subject}</div>` : ''}
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
    const kpiPremium = document.getElementById('kpi-premium');
    if (kpiUsers) kpiUsers.textContent = users.length;
    if (kpiTotal) kpiTotal.textContent = disputes.length;
    if (kpiOpen) kpiOpen.textContent = disputes.filter(d => d.status !== 'Resolved').length;
    if (messages && kpiUnread) kpiUnread.textContent = messages.filter(m => !m.read).length;
    if (kpiPremium) kpiPremium.textContent = users.filter(u => u.plan === 'premium').length;
  }

  let currentModalUserId = null;

  window.openUserModal = async function(userId) {
    currentModalUserId = userId;
    const user = allUsersCache.find(u => u._id === userId);
    if (!user) return;

    const modalName = document.getElementById('modal-user-name');
    if (modalName) modalName.textContent = `Manage: ${user.name}`;

    const planEl = document.getElementById('modal-plan');
    if (planEl) planEl.value = user.plan || 'none';

    const advName = document.getElementById('modal-advisor-name');
    const advEmail = document.getElementById('modal-advisor-email');
    const advPhone = document.getElementById('modal-advisor-phone');
    if (advName) advName.value = user.advisorName || '';
    if (advEmail) advEmail.value = user.advisorEmail || '';
    if (advPhone) advPhone.value = user.advisorPhone || '';

    renderModalScores(user.creditScores || []);
    renderModalAlerts(user.identityAlerts || [], userId);
    renderModalCoaching(user.coachingSessions || [], userId);

    document.getElementById('user-modal').classList.add('open');
  };

  window.closeUserModal = function() {
    document.getElementById('user-modal').classList.remove('open');
    currentModalUserId = null;
  };

  document.getElementById('user-modal').addEventListener('click', function(e) {
    if (e.target === this) closeUserModal();
  });

  function renderModalScores(scores) {
    const list = document.getElementById('modal-score-list');
    if (!list) return;
    if (!scores || scores.length === 0) {
      list.innerHTML = '<div style="color:var(--color-text-muted);font-size:0.8rem;margin-top:8px">No scores yet.</div>';
      return;
    }
    const sorted = [...scores].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
    list.innerHTML = sorted.map(s => `
      <div class="score-mini-item">
        <span class="sv">${s.score}</span>
        <span>${s.bureau}</span>
        <span>${formatDate(s.recordedAt)}</span>
        ${s.note ? `<span style="color:var(--color-text-muted)">${s.note}</span>` : ''}
      </div>
    `).join('');
  }

  function renderModalAlerts(alerts, userId) {
    const list = document.getElementById('modal-alert-list');
    if (!list) return;
    if (!alerts || alerts.length === 0) {
      list.innerHTML = '<div style="color:var(--color-text-muted);font-size:0.8rem">No alerts.</div>';
      return;
    }
    list.innerHTML = alerts.map(a => `
      <div class="alert-mini-item">
        <div>
          <strong style="color:#fff;font-size:0.8rem">${a.type}</strong>
          <span style="color:var(--color-text-muted);font-size:0.75rem;margin-left:6px">(${a.severity})</span>
          <div style="color:var(--color-text-muted);font-size:0.75rem">${a.description}</div>
        </div>
        ${!a.resolved ? `<button class="btn-mini btn-mini-outline" style="font-size:0.75rem;padding:4px 10px" onclick="resolveAlert('${userId}','${a._id}')">Resolve</button>` : '<span style="color:#4ade80;font-size:0.75rem">Resolved</span>'}
      </div>
    `).join('');
  }

  function renderModalCoaching(sessions, userId) {
    const list = document.getElementById('modal-coaching-list');
    if (!list) return;
    if (!sessions || sessions.length === 0) {
      list.innerHTML = '<div style="color:var(--color-text-muted);font-size:0.8rem">No sessions.</div>';
      return;
    }
    const sorted = [...sessions].sort((a, b) => new Date(b.scheduledDate || b.createdAt) - new Date(a.scheduledDate || a.createdAt));
    list.innerHTML = sorted.map(s => `
      <div class="coaching-mini-item">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong style="color:#fff">${s.title}</strong>
          ${!s.completed ? `<button class="btn-mini btn-mini-outline" style="font-size:0.75rem;padding:4px 10px" onclick="completeSession('${userId}','${s._id}')">Complete</button>` : '<span style="color:#4ade80;font-size:0.75rem">Done</span>'}
        </div>
        ${s.scheduledDate ? `<div style="color:var(--color-gold);font-size:0.75rem">${formatDate(s.scheduledDate)}</div>` : ''}
        ${s.notes ? `<div>${s.notes}</div>` : ''}
      </div>
    `).join('');
  }

  window.savePlan = async function() {
    if (!currentModalUserId) return;
    const plan = document.getElementById('modal-plan').value;
    try {
      const res = await window.authUtils.authFetch(`/subscription/assign/${currentModalUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ plan })
      });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Plan updated successfully', 'success');
        const userIdx = allUsersCache.findIndex(u => u._id === currentModalUserId);
        if (userIdx >= 0) {
          allUsersCache[userIdx].plan = plan;
          renderUsers(allUsersCache);
        }
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to update plan', 'error');
    }
  };

  window.saveAdvisor = async function() {
    if (!currentModalUserId) return;
    const advisorName = document.getElementById('modal-advisor-name').value.trim();
    const advisorEmail = document.getElementById('modal-advisor-email').value.trim();
    const advisorPhone = document.getElementById('modal-advisor-phone').value.trim();
    try {
      const res = await window.authUtils.authFetch(`/subscription/assign/${currentModalUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ advisorName, advisorEmail, advisorPhone })
      });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Advisor assigned successfully', 'success');
        const userIdx = allUsersCache.findIndex(u => u._id === currentModalUserId);
        if (userIdx >= 0) {
          allUsersCache[userIdx].advisorName = advisorName;
          allUsersCache[userIdx].advisorEmail = advisorEmail;
          allUsersCache[userIdx].advisorPhone = advisorPhone;
        }
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to assign advisor', 'error');
    }
  };

  window.addScore = async function() {
    if (!currentModalUserId) return;
    const score = parseInt(document.getElementById('modal-score').value);
    const bureau = document.getElementById('modal-score-bureau').value;
    const note = document.getElementById('modal-score-note').value.trim();
    if (!score || score < 300 || score > 850) {
      window.showToast('Score must be between 300 and 850', 'error');
      return;
    }
    try {
      const res = await window.authUtils.authFetch(`/subscription/scores/${currentModalUserId}`, {
        method: 'POST',
        body: JSON.stringify({ score, bureau, note })
      });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Credit score added', 'success');
        document.getElementById('modal-score').value = '';
        document.getElementById('modal-score-note').value = '';
        renderModalScores(data.creditScores);
        const userIdx = allUsersCache.findIndex(u => u._id === currentModalUserId);
        if (userIdx >= 0) allUsersCache[userIdx].creditScores = data.creditScores;
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to add score', 'error');
    }
  };

  window.addAlert = async function() {
    if (!currentModalUserId) return;
    const type = document.getElementById('modal-alert-type').value.trim();
    const description = document.getElementById('modal-alert-desc').value.trim();
    const severity = document.getElementById('modal-alert-severity').value;
    if (!type || !description) {
      window.showToast('Type and description are required', 'error');
      return;
    }
    try {
      const res = await window.authUtils.authFetch(`/subscription/alerts/${currentModalUserId}`, {
        method: 'POST',
        body: JSON.stringify({ type, description, severity })
      });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Alert added', 'success');
        document.getElementById('modal-alert-type').value = '';
        document.getElementById('modal-alert-desc').value = '';
        renderModalAlerts(data.identityAlerts, currentModalUserId);
        const userIdx = allUsersCache.findIndex(u => u._id === currentModalUserId);
        if (userIdx >= 0) allUsersCache[userIdx].identityAlerts = data.identityAlerts;
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to add alert', 'error');
    }
  };

  window.resolveAlert = async function(userId, alertId) {
    try {
      const res = await window.authUtils.authFetch(`/subscription/alerts/${userId}/${alertId}/resolve`, { method: 'PUT' });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Alert resolved', 'success');
        renderModalAlerts(data.identityAlerts, userId);
        const userIdx = allUsersCache.findIndex(u => u._id === userId);
        if (userIdx >= 0) allUsersCache[userIdx].identityAlerts = data.identityAlerts;
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to resolve alert', 'error');
    }
  };

  window.addCoaching = async function() {
    if (!currentModalUserId) return;
    const title = document.getElementById('modal-coaching-title').value.trim();
    const scheduledDate = document.getElementById('modal-coaching-date').value;
    const notes = document.getElementById('modal-coaching-notes').value.trim();
    if (!title) {
      window.showToast('Session title is required', 'error');
      return;
    }
    try {
      const res = await window.authUtils.authFetch(`/subscription/coaching/${currentModalUserId}`, {
        method: 'POST',
        body: JSON.stringify({ title, scheduledDate: scheduledDate || undefined, notes })
      });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Session scheduled', 'success');
        document.getElementById('modal-coaching-title').value = '';
        document.getElementById('modal-coaching-date').value = '';
        document.getElementById('modal-coaching-notes').value = '';
        renderModalCoaching(data.coachingSessions, currentModalUserId);
        const userIdx = allUsersCache.findIndex(u => u._id === currentModalUserId);
        if (userIdx >= 0) allUsersCache[userIdx].coachingSessions = data.coachingSessions;
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to schedule session', 'error');
    }
  };

  window.completeSession = async function(userId, sessionId) {
    try {
      const res = await window.authUtils.authFetch(`/subscription/coaching/${userId}/${sessionId}/complete`, { method: 'PUT' });
      const data = await window.authUtils.handleResponse(res);
      if (data) {
        window.showToast('Session marked complete', 'success');
        renderModalCoaching(data.coachingSessions, userId);
        const userIdx = allUsersCache.findIndex(u => u._id === userId);
        if (userIdx >= 0) allUsersCache[userIdx].coachingSessions = data.coachingSessions;
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to complete session', 'error');
    }
  };

  Promise.all([fetchAllUsers(), fetchAllDisputes(), fetchAllMessages()]).then(([users, disputes, messages]) => {
    renderKPICards(users, disputes, messages);
    renderAdminChart(disputes);
    renderUsers(users);
    renderDisputes(disputes);
    renderMessages(messages);
  });
});
