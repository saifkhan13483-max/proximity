document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === currentPage) link.classList.add('active');
  });

  const hamburger = document.querySelector('.hamburger');
  const navOverlay = document.querySelector('.nav-overlay');
  if (hamburger && navOverlay) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navOverlay.classList.toggle('open');
      document.body.style.overflow = navOverlay.classList.contains('open') ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', navOverlay.classList.contains('open').toString());
    });
    navOverlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navOverlay.classList.remove('open');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        hamburger.classList.remove('open');
        navOverlay.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const animatedEls = document.querySelectorAll('.animate-fade-up, .animate-fade-left, .animate-fade-right, .animate-scale-in');
  if (animatedEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    animatedEls.forEach(el => observer.observe(el));
  }

  function animateCounter(el, target, duration, prefix, suffix) {
    if (el.dataset.animated) return;
    el.dataset.animated = 'true';
    const start = performance.now();
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const count = Math.floor(easeOutCubic(progress) * target);
      el.textContent = prefix + count.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const statsSection = document.querySelector('.stats-bar');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        document.querySelectorAll('[data-count]').forEach(el => {
          animateCounter(el, parseInt(el.dataset.count), 2000, el.dataset.prefix || '', el.dataset.suffix || '');
        });
        statsObserver.disconnect();
      }
    }, { threshold: 0.5 });
    statsObserver.observe(statsSection);
  }

  window.showToast = function(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    if (container.children.length > 4) container.removeChild(container.firstChild);
    setTimeout(() => {
      toast.classList.add('dismiss');
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
  };

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  const carousel = document.querySelector('.testimonials-carousel');
  if (carousel) {
    const track = carousel.querySelector('.testimonials-track');
    const slides = carousel.querySelectorAll('.testimonial-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    let current = 0;
    let autoInterval;
    let touchStartX = 0;

    function goTo(idx) {
      current = (idx + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function startAuto() {
      autoInterval = setInterval(() => goTo(current + 1), 5000);
    }

    function stopAuto() { clearInterval(autoInterval); }

    if (slides.length > 0) {
      goTo(0);
      startAuto();
      if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
      if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
      dots.forEach((dot, i) => dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); }));
      carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
      carousel.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { stopAuto(); goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
      });
    }
  }

  document.querySelectorAll('.faq-item').forEach((item, idx) => {
    const btn = item.querySelector('.faq-question');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', `faq-answer-${idx}`);
      const answer = item.querySelector('.faq-answer');
      if (answer) answer.id = `faq-answer-${idx}`;
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('open');
          const q = i.querySelector('.faq-question');
          if (q) q.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
