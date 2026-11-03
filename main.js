(() => {
  const canvas = document.querySelector('.spark-canvas');
  const ctx = canvas?.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: -1000, y: -1000, active: false };
  let particles = [], width = 0, height = 0, frame = 0;

  const resize = () => {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(230, Math.floor(width * height / 3100));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
      size: Math.random() * 1.7 + .5, tint: Math.random(), phase: Math.random() * 8
    }));
  };

  const paint = (time = 0) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const radius = 112;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      const dx = pointer.x - p.x, dy = pointer.y - p.y;
      const distance = Math.hypot(dx, dy);
      if (pointer.active && distance < radius && distance > 0) {
        const push = (1 - distance / radius) * .018;
        p.vx -= dx * push; p.vy -= dy * push;
      }
      p.vx *= .997; p.vy *= .997;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > .72) { p.vx *= .72 / speed; p.vy *= .72 / speed; }
      const shimmer = .64 + Math.sin(time * .001 + p.phase) * .2;
      ctx.fillStyle = p.tint > .53 ? `rgba(212,242,100,${shimmer})` : `rgba(49,84,232,${shimmer * .57})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j], lx = p.x - q.x, ly = p.y - q.y, ld = Math.hypot(lx, ly);
        if (ld < 74) {
          ctx.strokeStyle = `rgba(49,84,232,${(1 - ld / 74) * .14})`;
          ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    if (!reduceMotion) frame = requestAnimationFrame(paint);
  };
  resize(); paint();
  addEventListener('resize', () => { cancelAnimationFrame(frame); resize(); paint(); });
  const hero = document.querySelector('.hero');
  hero?.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.active = true;
    const content = hero.querySelector('.hero-content');
    if (content && !reduceMotion && matchMedia('(pointer:fine)').matches) {
      const x = (event.clientX / innerWidth - .5) * -7;
      const y = (event.clientY / innerHeight - .5) * -5;
      content.style.setProperty('--pointer-x', `${x}px`);
      content.style.setProperty('--pointer-y', `${y}px`);
    }
  });
  hero?.addEventListener('pointerleave', () => { pointer.active = false; });

  const progress = document.querySelector('.scroll-progress');
  let ticking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; } }, { passive: true });
  updateProgress();

  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
    reveal.observe(element);
  });

  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--tilt-x', `${-y * 2.6}deg`);
        card.style.setProperty('--tilt-y', `${x * 3.4}deg`);
        card.classList.add('is-pointed');
      });
      card.addEventListener('pointerleave', () => card.classList.remove('is-pointed'));
    });
  }

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); toggle?.setAttribute('aria-label', 'Open navigation');
  }));
})();

