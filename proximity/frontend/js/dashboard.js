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

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async function fetchDisputes() {
    try {
      const res = await window.authUtils.authFetch('/disputes');
      const data = await window.authUtils.handleResponse(res);
      return data ? data.disputes : [];
    } catch (e) { return []; }
  }

  async function fetchSubscription() {
    try {
      const res = await window.authUtils.authFetch('/subscription/me');
      const data = await window.authUtils.handleResponse(res);
      return data ? data.subscription : null;
    } catch (e) { return null; }
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

  function renderOverviewStats(disputes, subscription) {
    const open = disputes.filter(d => d.status !== 'Resolved').length;
    const resolved = disputes.filter(d => d.status === 'Resolved').length;
    const daysActive = Math.floor((Date.now() - new Date(user.createdAt)) / 86400000);

    const statOpen = document.getElementById('stat-open');
    const statResolved = document.getElementById('stat-resolved');
    const statDays = document.getElementById('stat-days');
    const statScore = document.getElementById('stat-latest-score');

    if (statOpen) statOpen.textContent = open;
    if (statResolved) statResolved.textContent = resolved;
    if (statDays) statDays.textContent = daysActive;

    if (subscription && subscription.creditScores && subscription.creditScores.length > 0) {
      const sorted = [...subscription.creditScores].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
      if (statScore) statScore.textContent = sorted[0].score;

      const progressFill = document.getElementById('score-progress-fill');
      const progressLabel = document.getElementById('score-progress-label');
      const progressPct = document.getElementById('score-progress-pct');
      if (progressFill && sorted.length >= 2) {
        const first = sorted[sorted.length - 1].score;
        const latest = sorted[0].score;
        const change = latest - first;
        const pct = Math.min(100, Math.max(0, ((latest - 300) / 550) * 100));
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressLabel) progressLabel.textContent = `Your score has ${change >= 0 ? 'improved' : 'changed'} by ${change >= 0 ? '+' : ''}${change} points since tracking began.`;
        if (progressPct) progressPct.textContent = `Current Score: ${latest} / 850`;
      } else if (progressFill) {
        const pct = Math.min(100, Math.max(0, ((sorted[0].score - 300) / 550) * 100));
        progressFill.style.width = pct + '%';
        if (progressPct) progressPct.textContent = `Current Score: ${sorted[0].score} / 850`;
      }
    } else {
      if (statScore) statScore.textContent = 'N/A';
      const progressFill = document.getElementById('score-progress-fill');
      const progressPct = document.getElementById('score-progress-pct');
      if (progressFill) progressFill.style.width = '0%';
      if (progressPct) progressPct.textContent = 'No score entries yet.';
    }
  }

  function renderAdvisorOverview(subscription) {
    const container = document.getElementById('advisor-overview-card');
    if (!container) return;
    if (!subscription || !subscription.advisorName) {
      container.style.display = 'none';
      return;
    }
    const initials = subscription.advisorName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    container.style.display = 'block';
    container.innerHTML = `
      <div class="advisor-card">
        <div class="advisor-avatar">${initials}</div>
        <div class="advisor-info">
          <h4>Your Dedicated Advisor</h4>
          <p style="color:#fff;font-weight:600;font-size:1rem">${subscription.advisorName}</p>
          ${subscription.advisorEmail ? `<p><i data-lucide="mail" style="width:13px;height:13px;display:inline;vertical-align:middle;margin-right:4px"></i>${subscription.advisorEmail}</p>` : ''}
          ${subscription.advisorPhone ? `<p><i data-lucide="phone" style="width:13px;height:13px;display:inline;vertical-align:middle;margin-right:4px"></i>${subscription.advisorPhone}</p>` : ''}
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderDisputeLimitInfo(disputes, subscription) {
    const infoEl = document.getElementById('dispute-limit-info');
    if (!infoEl || !subscription) return;

    if (subscription.plan === 'basic') {
      infoEl.style.display = 'block';
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyCount = disputes.filter(d => new Date(d.createdAt) >= startOfMonth).length;
      const pct = (monthlyCount / 5) * 100;
      const fillEl = document.getElementById('dispute-limit-fill');
      const textEl = document.getElementById('dispute-limit-text');
      if (fillEl) {
        fillEl.style.width = Math.min(100, pct) + '%';
        if (pct >= 100) fillEl.classList.add('danger');
      }
      if (textEl) textEl.textContent = `${monthlyCount} / 5 this month`;

      if (monthlyCount >= 5) {
        const warning = document.getElementById('submit-limit-warning');
        if (warning) warning.style.display = 'block';
      }
    }

    if (subscription.plan === 'none') {
      const warning = document.getElementById('submit-plan-warning');
      if (warning) warning.style.display = 'block';
    }
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

  let scoreChartInstance = null;
  function renderScoreTab(subscription) {
    const listEl = document.getElementById('score-entries-list');
    const ctx = document.getElementById('score-chart');

    if (!subscription || !subscription.creditScores || subscription.creditScores.length === 0) {
      if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--color-text-muted)">No credit score entries yet. Your advisor will add scores as your credit improves.</div>';
      if (ctx && typeof Chart !== 'undefined') {
        if (scoreChartInstance) scoreChartInstance.destroy();
        if (ctx.getContext) {
          scoreChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Credit Score', data: [], borderColor: '#B8924A', backgroundColor: 'rgba(184,146,74,0.1)', tension: 0.4, fill: true }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 300, max: 850, ticks: { color: '#9A9A9A' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#9A9A9A' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
          });
        }
      }
      return;
    }

    const sorted = [...subscription.creditScores].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

    if (ctx && typeof Chart !== 'undefined') {
      if (scoreChartInstance) scoreChartInstance.destroy();
      scoreChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
          labels: sorted.map(s => formatDate(s.recordedAt)),
          datasets: [{
            label: 'Credit Score',
            data: sorted.map(s => s.score),
            borderColor: '#B8924A',
            backgroundColor: 'rgba(184,146,74,0.1)',
            pointBackgroundColor: '#B8924A',
            pointRadius: 5,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Score: ${ctx.parsed.y}` } } },
          scales: {
            y: { min: 300, max: 850, ticks: { color: '#9A9A9A', stepSize: 50 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#9A9A9A' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    if (listEl) {
      const reversed = [...sorted].reverse();
      listEl.innerHTML = reversed.map(s => `
        <div class="score-entry">
          <div>
            <div class="score-val">${s.score}</div>
            <div class="score-meta">${formatDate(s.recordedAt)}${s.note ? ' — ' + s.note : ''}</div>
          </div>
          <span class="score-bureau">${s.bureau}</span>
        </div>
      `).join('');
    }
  }

  function renderPlanTab(subscription) {
    const container = document.getElementById('plan-details-container');
    if (!container) return;

    const plan = subscription ? subscription.plan || 'none' : 'none';
    const planStart = subscription && subscription.planStartDate ? formatDate(subscription.planStartDate) : null;

    const planFeatures = {
      none: [],
      basic: [
        { text: 'Access to all 3 bureaus (Equifax, Experian, TransUnion)', active: true },
        { text: 'Up to 5 disputes per month', active: true },
        { text: 'Client portal access', active: true },
        { text: 'Email support', active: true },
        { text: 'Unlimited disputes', active: false },
        { text: 'Priority support', active: false },
        { text: 'Credit monitoring & score tracking', active: false },
        { text: 'Dedicated advisor', active: false },
        { text: 'Legal letter templates', active: false },
        { text: 'Identity theft protection', active: false },
        { text: 'Financial coaching sessions', active: false },
      ],
      standard: [
        { text: 'Access to all 3 bureaus (Equifax, Experian, TransUnion)', active: true },
        { text: 'Unlimited disputes', active: true },
        { text: 'Priority support', active: true },
        { text: 'Credit monitoring & score tracking', active: true },
        { text: 'Client portal access', active: true },
        { text: 'Dedicated advisor', active: false },
        { text: 'Legal letter templates', active: false },
        { text: 'Identity theft protection', active: false },
        { text: 'Financial coaching sessions', active: false },
      ],
      premium: [
        { text: 'Access to all 3 bureaus (Equifax, Experian, TransUnion)', active: true },
        { text: 'Unlimited disputes', active: true },
        { text: 'Priority support', active: true },
        { text: 'Credit monitoring & score tracking', active: true },
        { text: 'Dedicated advisor', active: true },
        { text: 'Monthly advisor calls', active: true },
        { text: 'Legal letter templates', active: true },
        { text: 'Identity theft protection', active: true },
        { text: 'Financial coaching sessions', active: true },
        { text: 'Credit score guarantee', active: true },
        { text: 'White-glove concierge service', active: true },
      ]
    };

    const planPrices = { none: 'No Plan', basic: '$79/mo', standard: '$149/mo', premium: '$299/mo' };
    const planColors = { none: '#9A9A9A', basic: '#B8924A', standard: '#60a5fa', premium: '#a78bfa' };
    const features = planFeatures[plan] || [];

    if (plan === 'none') {
      container.innerHTML = `
        <div class="plan-card">
          <div style="text-align:center;padding:20px 0">
            <span class="plan-badge none">No Active Plan</span>
            <h2 style="color:#fff;margin:20px 0 8px">Get Started with Proximity</h2>
            <p style="color:var(--color-text-muted);max-width:400px;margin:0 auto 24px">Choose a plan to unlock dispute filing and premium credit repair features.</p>
            <a href="../pricing.html" class="btn-primary" style="display:inline-block;text-decoration:none">View Plans &amp; Pricing</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="plan-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <span class="plan-badge ${plan}">${capitalize(plan)} Plan</span>
            <div style="margin-top:10px;font-size:1.8rem;font-weight:700;color:${planColors[plan]}">${planPrices[plan]}</div>
          </div>
          ${planStart ? `<div style="text-align:right"><div style="color:var(--color-text-muted);font-size:0.8rem">Member Since</div><div style="color:#fff;font-size:0.9rem;font-weight:600">${planStart}</div></div>` : ''}
        </div>
        <ul class="feature-list">
          ${features.map(f => `
            <li>
              <i data-lucide="${f.active ? 'check-circle' : 'x-circle'}" class="feat-icon ${f.active ? '' : 'locked'}" style="width:16px;height:16px"></i>
              <span style="${!f.active ? 'text-decoration:line-through;opacity:0.5' : ''}">${f.text}</span>
            </li>
          `).join('')}
        </ul>
        ${plan !== 'premium' ? `
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
            <p style="color:var(--color-text-muted);font-size:0.85rem;margin:0 0 12px">Unlock more features by upgrading your plan.</p>
            <a href="../pricing.html" class="btn-primary" style="display:inline-block;text-decoration:none;padding:10px 24px;font-size:0.9rem">Upgrade Plan</a>
          </div>
        ` : ''}
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderDocumentsTab(subscription) {
    const container = document.getElementById('documents-container');
    if (!container) return;

    const plan = subscription ? subscription.plan || 'none' : 'none';

    if (plan !== 'premium') {
      container.innerHTML = `
        <div class="premium-lock">
          <div class="lock-icon"><i data-lucide="lock" style="width:48px;height:48px"></i></div>
          <h3>Premium Feature</h3>
          <p>Legal letter templates are available exclusively on the <strong style="color:#a78bfa">Premium Plan</strong>. Upgrade to access professionally crafted dispute letters, goodwill letters, and debt validation requests.</p>
          <a href="../pricing.html" class="btn-primary" style="display:inline-block;text-decoration:none;margin-top:20px">Upgrade to Premium</a>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const templates = [
      { name: 'Credit Bureau Dispute Letter', desc: 'Dispute inaccurate items with Equifax, Experian, or TransUnion', icon: 'file-text', file: 'credit_bureau_dispute.txt' },
      { name: 'Debt Validation Letter', desc: 'Request validation from debt collectors under the FDCPA', icon: 'shield', file: 'debt_validation.txt' },
      { name: 'Goodwill Deletion Letter', desc: 'Request removal of negative items from creditors as a goodwill gesture', icon: 'heart', file: 'goodwill_deletion.txt' },
      { name: 'Pay-for-Delete Agreement', desc: 'Negotiate removal of collection accounts in exchange for payment', icon: 'dollar-sign', file: 'pay_for_delete.txt' },
      { name: 'Identity Theft Dispute Letter', desc: 'Dispute fraudulent accounts resulting from identity theft', icon: 'alert-triangle', file: 'identity_theft_dispute.txt' },
      { name: 'FCRA Section 609 Letter', desc: 'Request verification of account information under FCRA Section 609', icon: 'book-open', file: 'fcra_609.txt' },
    ];

    container.innerHTML = templates.map(t => `
      <div class="doc-card">
        <div class="doc-card-info">
          <div class="doc-icon"><i data-lucide="${t.icon}" style="width:28px;height:28px"></i></div>
          <div>
            <h4>${t.name}</h4>
            <p>${t.desc}</p>
          </div>
        </div>
        <button class="btn-download" onclick="downloadTemplate('${t.file}', '${t.name}')">Download</button>
      </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderProtectionTab(subscription) {
    const container = document.getElementById('protection-container');
    if (!container) return;

    const plan = subscription ? subscription.plan || 'none' : 'none';

    if (plan !== 'premium') {
      container.innerHTML = `
        <div class="premium-lock">
          <div class="lock-icon"><i data-lucide="shield-off" style="width:48px;height:48px"></i></div>
          <h3>Premium Feature</h3>
          <p>Identity theft protection monitoring is available on the <strong style="color:#a78bfa">Premium Plan</strong>. Get real-time alerts when suspicious activity is detected on your credit file.</p>
          <a href="../pricing.html" class="btn-primary" style="display:inline-block;text-decoration:none;margin-top:20px">Upgrade to Premium</a>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const alerts = subscription.identityAlerts || [];

    const activeAlerts = alerts.filter(a => !a.resolved);
    const resolvedAlerts = alerts.filter(a => a.resolved);

    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="plan-card" style="text-align:center;padding:32px">
          <div style="color:#4ade80;margin-bottom:12px"><i data-lucide="shield-check" style="width:48px;height:48px"></i></div>
          <h3 style="color:#fff;margin-bottom:8px">All Clear</h3>
          <p style="color:var(--color-text-muted)">No identity alerts detected. Your credit file is being actively monitored by our team.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <p style="color:var(--color-text-muted);margin-bottom:16px">${activeAlerts.length} active alert${activeAlerts.length !== 1 ? 's' : ''}</p>
        ${alerts.map(a => `
          <div class="alert-item ${a.severity} ${a.resolved ? 'resolved' : ''}">
            <i data-lucide="${a.resolved ? 'check-circle' : 'alert-triangle'}" style="width:18px;height:18px;flex-shrink:0;margin-top:2px;color:${a.resolved ? '#4ade80' : a.severity === 'high' ? '#f87171' : a.severity === 'medium' ? '#fbbf24' : '#9A9A9A'}"></i>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <strong style="color:#fff;font-size:0.9rem">${a.type}</strong>
                <span class="alert-sev ${a.severity}">${a.severity}</span>
                ${a.resolved ? '<span class="completed-badge">Resolved</span>' : ''}
              </div>
              <p style="margin:0;color:var(--color-text-muted);font-size:0.85rem">${a.description}</p>
              <p style="margin:4px 0 0;color:var(--color-text-muted);font-size:0.75rem">${formatDate(a.createdAt)}</p>
            </div>
          </div>
        `).join('')}
      `;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderCoachingTab(subscription) {
    const container = document.getElementById('coaching-container');
    if (!container) return;

    const plan = subscription ? subscription.plan || 'none' : 'none';

    if (plan !== 'premium') {
      container.innerHTML = `
        <div class="premium-lock">
          <div class="lock-icon"><i data-lucide="book-open" style="width:48px;height:48px"></i></div>
          <h3>Premium Feature</h3>
          <p>Financial coaching sessions are available on the <strong style="color:#a78bfa">Premium Plan</strong>. Get personalized one-on-one guidance from our certified financial coaches.</p>
          <a href="../pricing.html" class="btn-primary" style="display:inline-block;text-decoration:none;margin-top:20px">Upgrade to Premium</a>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const sessions = subscription.coachingSessions || [];

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="plan-card" style="text-align:center;padding:32px">
          <div style="color:var(--color-gold);margin-bottom:12px"><i data-lucide="calendar" style="width:48px;height:48px"></i></div>
          <h3 style="color:#fff;margin-bottom:8px">No Sessions Yet</h3>
          <p style="color:var(--color-text-muted)">Your advisor will schedule financial coaching sessions for you. Check back soon or contact us to arrange your first session.</p>
          <a href="../contact.html" class="btn-primary" style="display:inline-block;text-decoration:none;margin-top:16px">Contact Us</a>
        </div>
      `;
    } else {
      const sorted = [...sessions].sort((a, b) => new Date(b.scheduledDate || b.createdAt) - new Date(a.scheduledDate || a.createdAt));
      container.innerHTML = `
        <p style="color:var(--color-text-muted);margin-bottom:16px">${sessions.filter(s => !s.completed).length} upcoming session${sessions.filter(s => !s.completed).length !== 1 ? 's' : ''}</p>
        ${sorted.map(s => `
          <div class="coaching-item">
            <i data-lucide="${s.completed ? 'check-circle' : 'calendar'}" style="width:20px;height:20px;flex-shrink:0;margin-top:2px;color:${s.completed ? '#4ade80' : 'var(--color-gold)'}"></i>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <h4>${s.title}</h4>
                ${s.completed ? '<span class="completed-badge">Completed</span>' : ''}
              </div>
              ${s.scheduledDate ? `<div class="coaching-date">${formatDate(s.scheduledDate)}</div>` : ''}
              ${s.notes ? `<p>${s.notes}</p>` : ''}
            </div>
          </div>
        `).join('')}
      `;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.downloadTemplate = function(filename, name) {
    const templates = {
      'credit_bureau_dispute.txt': `[Your Name]
[Your Address]
[City, State, ZIP]
[Date]

[Credit Bureau Name]
[Bureau Address]

Re: Dispute of Inaccurate Information

Dear Sir or Madam,

I am writing to dispute the following information in my file. The item I dispute is:

Account Name: [Account Name]
Account Number: [Account Number]
Reason: [Reason for Dispute]

This information is inaccurate because [explain reason]. I am requesting that the item be removed/corrected to ensure my file is accurate.

Enclosed are copies of [supporting documents].

Please investigate this matter and correct the information as soon as possible.

Sincerely,
[Your Name]
[Your SSN - last 4 digits for verification]`,

      'debt_validation.txt': `[Your Name]
[Your Address]
[City, State, ZIP]
[Date]

[Collection Agency Name]
[Collection Agency Address]

Re: Request for Debt Validation — Account #[Account Number]

Dear Sir or Madam,

I am writing to request validation of a debt your company claims I owe. Under the Fair Debt Collection Practices Act (FDCPA), I have the right to request verification of this debt.

Please provide:
1. Proof that your company is licensed to collect debts in my state
2. The amount of the debt and how it was calculated
3. The name and address of the original creditor
4. Proof that the statute of limitations has not expired
5. A copy of any judgment (if applicable)

Until you validate this debt, please cease all collection activities.

Sincerely,
[Your Name]`,

      'goodwill_deletion.txt': `[Your Name]
[Your Address]
[City, State, ZIP]
[Date]

[Creditor Name]
[Creditor Address]

Re: Goodwill Deletion Request — Account #[Account Number]

Dear [Creditor Name] Customer Service Team,

I am writing to request a goodwill deletion of the late payment(s) reported on my credit report for account #[Account Number].

The late payment(s) occurred on [date(s)] due to [brief explanation]. Since then, I have [describe positive payment history]. This negative mark does not reflect my overall commitment to fulfilling my financial obligations.

I respectfully request that you consider removing this negative item from my credit report as a goodwill gesture. This would greatly assist me in [reason, e.g., qualifying for a mortgage].

I truly appreciate your time and consideration.

Sincerely,
[Your Name]`,

      'pay_for_delete.txt': `[Your Name]
[Your Address]
[City, State, ZIP]
[Date]

[Collection Agency Name]
[Collection Agency Address]

Re: Pay-for-Delete Agreement — Account #[Account Number]

Dear Sir or Madam,

I am writing regarding account #[Account Number] with an outstanding balance of $[Amount].

I am prepared to pay $[Settlement Amount] in full settlement of this account, provided your company agrees in writing to:

1. Remove all references to this account from all three credit bureaus (Equifax, Experian, TransUnion)
2. Mark the account as "Deleted" rather than "Paid" or "Settled"

This offer is contingent on receiving written confirmation of this agreement before payment is made. Upon receipt of written confirmation, I will submit payment within [X] business days.

Please respond in writing to the address above.

Sincerely,
[Your Name]`,

      'identity_theft_dispute.txt': `[Your Name]
[Your Address]
[City, State, ZIP]
[Date]

[Credit Bureau Name]
[Bureau Address]

Re: Identity Theft — Fraudulent Account Dispute

Dear Fraud Department,

I am a victim of identity theft and am writing to dispute fraudulent accounts and/or charges on my credit report.

The following accounts were opened without my knowledge or consent:

Account Name: [Account Name]
Account Number: [Account Number]
Date Opened: [Date]

I did not open, authorize, or benefit from this account. I have filed a police report (copy enclosed) and an identity theft report with the FTC at IdentityTheft.gov.

Under the Fair Credit Reporting Act, I request that you:
1. Block and remove this fraudulent information from my credit report
2. Flag my account for identity theft

Please send written confirmation of the removal.

Sincerely,
[Your Name]
Enclosures: FTC Identity Theft Report, Police Report`,

      'fcra_609.txt': `[Your Name]
[Your Address]
[City, State, ZIP]
[Date]

[Credit Bureau Name]
[Bureau Address]

Re: Section 609 Request for Account Verification

Dear Sir or Madam,

Pursuant to the Fair Credit Reporting Act, Section 609, I am requesting verification of the following items appearing on my credit report:

Account Name: [Account Name]
Account Number: [Account Number]

Under Section 609, you are required to provide copies of original documents verifying the accuracy of this information. Please provide:

1. The original signed contract or agreement
2. Proof that this debt belongs to me
3. The full chain of ownership for this account

If you are unable to provide this documentation, you are required by law to remove this item from my credit report within 30 days.

Sincerely,
[Your Name]`
    };

    const content = templates[filename] || 'Template not available.';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name.replace(/\s+/g, '_') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    window.showToast('Template downloaded!', 'success');
  };

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
          const [disputes, subscription] = await Promise.all([fetchDisputes(), fetchSubscription()]);
          renderOverviewStats(disputes, subscription);
          renderDisputeTable(disputes);
          renderDisputeChart(disputes);
          renderDisputeLimitInfo(disputes, subscription);
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

  Promise.all([fetchDisputes(), fetchSubscription()]).then(([disputes, subscription]) => {
    renderOverviewStats(disputes, subscription);
    renderDisputeTable(disputes);
    renderDisputeChart(disputes);
    renderDisputeLimitInfo(disputes, subscription);
    renderAdvisorOverview(subscription);
    renderScoreTab(subscription);
    renderPlanTab(subscription);
    renderDocumentsTab(subscription);
    renderProtectionTab(subscription);
    renderCoachingTab(subscription);
  });
});
