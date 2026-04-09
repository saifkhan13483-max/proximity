document.addEventListener('DOMContentLoaded', () => {
  if (!window.authUtils) return;
  window.authUtils.redirectIfNotAuth();

  const user = window.authUtils.getUser();
  if (!user) return;

  const greetingEl = document.querySelector('.user-greeting');
  if (greetingEl) greetingEl.textContent = `Welcome back, ${user.name}`;

  const avatarEl = document.querySelector('.avatar-badge');
  if (avatarEl) {
    const parts = user.name.split(' ');
    const initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    avatarEl.textContent = initials;
  }

  const panels = document.querySelectorAll('.tab-panel');
  const navItems = document.querySelectorAll('.sidebar-nav-item');

  function showTab(tabId) {
    panels.forEach(p => p.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    const panel = document.getElementById('tab-' + tabId);
    if (panel) panel.classList.add('active');
    navItems.forEach(n => { if (n.dataset.tab === tabId) n.classList.add('active'); });
    sessionStorage.setItem('activeTab', tabId);
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tab));
  });

  const savedTab = sessionStorage.getItem('activeTab') || 'overview';
  showTab(savedTab);

  async function fetchDisputes() {
    try {
      const res = await window.authUtils.authFetch('/disputes');
      const data = await window.authUtils.handleResponse(res);
      return data ? data.disputes : [];
    } catch (e) { return []; }
  }

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

  function renderDisputeTable(disputes) {
    const tbody = document.getElementById('disputes-table-body');
    if (!tbody) return;
    if (disputes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><h3>No disputes yet</h3><p>Submit your first dispute to get started!</p><button class="btn-primary" onclick="document.querySelector('[data-tab=submit]').click()">Submit a Dispute</button></div></td></tr>`;
      return;
    }
    tbody.innerHTML = disputes.map(d => `
      <tr>
        <td>${d.bureau}</td>
        <td>${d.accountName}</td>
        <td><span class="badge ${getBadgeClass(d.status)}" role="status">${d.status}</span></td>
        <td>${formatDate(d.createdAt)}</td>
      </tr>
    `).join('');
  }

  function renderOverviewStats(disputes) {
    const open = disputes.filter(d => d.status !== 'Resolved').length;
    const resolved = disputes.filter(d => d.status === 'Resolved').length;
    const daysActive = Math.floor((Date.now() - new Date(user.createdAt)) / 86400000);
    const statOpen = document.getElementById('stat-open');
    const statResolved = document.getElementById('stat-resolved');
    const statDays = document.getElementById('stat-days');
    if (statOpen) statOpen.textContent = open;
    if (statResolved) statResolved.textContent = resolved;
    if (statDays) statDays.textContent = daysActive;
  }

  let chartInstance = null;
  function renderDisputeChart(disputes) {
    const ctx = document.getElementById('dispute-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (chartInstance) chartInstance.destroy();

    const now = new Date();
    const labels = [];
    const counts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      const c = disputes.filter(dis => {
        const cd = new Date(dis.createdAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      counts.push(c);
    }

    chartInstance = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Disputes Filed',
          data: counts,
          borderColor: '#B8924A',
          backgroundColor: 'rgba(184,146,74,0.1)',
          pointBackgroundColor: '#B8924A',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9A9A9A' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9A9A9A', stepSize: 1 }, beginAtZero: true }
        }
      }
    });
  }

  const disputeForm = document.getElementById('dispute-form');
  if (disputeForm) {
    disputeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bureau = disputeForm.querySelector('#bureau').value;
      const accountName = disputeForm.querySelector('#accountName').value.trim();
      const accountNumber = disputeForm.querySelector('#accountNumber').value.trim();
      const reason = disputeForm.querySelector('#reason').value.trim();

      document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
      let valid = true;
      if (!bureau) { document.getElementById('bureau-error').textContent = 'Please select a bureau'; valid = false; }
      if (!accountName) { document.getElementById('accountName-error').textContent = 'Account name is required'; valid = false; }
      if (reason.length < 10) { document.getElementById('reason-error').textContent = 'Reason must be at least 10 characters'; valid = false; }
      if (!valid) return;

      const btn = disputeForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Submitting...';
      try {
        const res = await window.authUtils.authFetch('/disputes', {
          method: 'POST',
          body: JSON.stringify({ bureau, accountName, accountNumber, reason })
        });
        const data = await window.authUtils.handleResponse(res);
        if (data) {
          window.showToast('Dispute submitted successfully!', 'success');
          disputeForm.reset();
          const disputes = await fetchDisputes();
          renderOverviewStats(disputes);
          renderDisputeTable(disputes);
          renderDisputeChart(disputes);
          showTab('disputes');
        }
      } catch (err) {
        window.showToast(err.message || 'Failed to submit dispute', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Dispute';
      }
    });
  }

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const emailInput = document.getElementById('profile-email');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const btn = profileForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        const res = await window.authUtils.authFetch('/auth/me', {
          method: 'PUT',
          body: JSON.stringify({ name, phone })
        });
        const data = await window.authUtils.handleResponse(res);
        if (data) {
          window.authUtils.setUser(data.user);
          window.showToast('Profile updated successfully!', 'success');
          if (greetingEl) greetingEl.textContent = `Welcome back, ${data.user.name}`;
        }
      } catch (err) {
        window.showToast(err.message || 'Failed to update profile', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      }
    });
  }

  fetchDisputes().then(disputes => {
    renderOverviewStats(disputes);
    renderDisputeTable(disputes);
    renderDisputeChart(disputes);
    const progressFill = document.querySelector('.progress-bar-fill');
    if (progressFill) {
      setTimeout(() => { progressFill.style.width = '35%'; }, 500);
    }
  });
});
