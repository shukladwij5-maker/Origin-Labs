(() => {
  const canvas = document.querySelector('.spark-canvas');
  const ctx = canvas?.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let particles = [], width = 0, height = 0, frame = 0;
  const resize = () => {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(600, Math.floor(width * height / 1500));
    particles = Array.from({ length: count }, () => {
      const arm = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), .72) * Math.min(width * .32, 310);
      return { arm, radius, size: Math.random() * 1.5 + .35, phase: Math.random() * 8, speed: .0003 + Math.random() * .0008, alpha: .16 + Math.random() * .72, tint: Math.random() };
    });
  };
  const paint = (time = 0) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2, cy = height * .43;
    for (const p of particles) {
      const angle = p.arm + time * p.speed;
      const r = p.radius + Math.sin(time * .0008 + p.phase) * 2;
      const swirl = (r / Math.min(width * .32, 310)) * 34;
      const x = cx + Math.cos(angle + swirl) * r;
      const y = cy + Math.sin(angle + swirl) * r * .58;
      const warm = p.tint > .18;
      ctx.fillStyle = warm ? `rgba(255,${170 + Math.round(p.tint * 55)},${89 + Math.round(p.tint * 65)},${p.alpha})` : `rgba(169,245,208,${p.alpha * .65})`;
      ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduceMotion) frame = requestAnimationFrame(paint);
  };
  resize(); paint();
  addEventListener('resize', () => { cancelAnimationFrame(frame); resize(); paint(); });

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
