document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. Custom cursor =====
    const cursorDot = document.createElement('div');
    cursorDot.id = 'cursor-dot';
    document.body.appendChild(cursorDot);

    const cursorRing = document.createElement('div');
    cursorRing.id = 'cursor-ring';
    document.body.appendChild(cursorRing);

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX - 4 + 'px';
        cursorDot.style.top = mouseY - 4 + 'px';
    });

    // Smooth ring follow
    function animateCursorRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        cursorRing.style.left = ringX - 16 + 'px';
        cursorRing.style.top = ringY - 16 + 'px';
        requestAnimationFrame(animateCursorRing);
    }
    animateCursorRing();

    // Cursor hover effects on interactive elements
    const hoverTargets = document.querySelectorAll('a, .product-node, .btn-minimal');
    hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorRing.style.width = '48px';
            cursorRing.style.height = '48px';
            cursorRing.style.borderColor = 'rgba(0, 212, 255, 0.6)';
            cursorDot.style.transform = 'scale(1.5)';
        });
        el.addEventListener('mouseleave', () => {
            cursorRing.style.width = '32px';
            cursorRing.style.height = '32px';
            cursorRing.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            cursorDot.style.transform = 'scale(1)';
        });
    });

    // ===== 2. Signal bar (scroll progress) =====
    const signalBar = document.getElementById('signal-bar');

    function updateSignalBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        signalBar.style.width = percent + '%';
    }

    // ===== 3. Section activation + stagger reveals =====
    const sections = document.querySelectorAll('.flow-node');
    const navLinks = document.querySelectorAll('.nav-links a');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');

                // Update active nav link
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });

                // Stagger children
                const staggers = entry.target.querySelectorAll('.stagger');
                staggers.forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 120);
                });
            }
        });
    }, {
        threshold: 0.25,
        rootMargin: '0px 0px -15% 0px'
    });

    sections.forEach(section => sectionObserver.observe(section));

    // ===== 4. Build continuous circuit SVG =====
    const svg = document.getElementById('main-circuit');
    const ns = 'http://www.w3.org/2000/svg';

    function buildCircuit() {
        svg.innerHTML = '';

        const docHeight = document.documentElement.scrollHeight;
        const docWidth = document.documentElement.clientWidth;
        svg.setAttribute('viewBox', `0 0 ${docWidth} ${docHeight}`);
        svg.style.height = docHeight + 'px';

        // Find marker positions
        const markers = document.querySelectorAll('.node-marker');
        const points = [];

        markers.forEach(marker => {
            const rect = marker.getBoundingClientRect();
            const x = rect.left + rect.width / 2 + window.scrollX;
            const y = rect.top + rect.height / 2 + window.scrollY;
            points.push({ x, y });
        });

        if (points.length < 2) return;

        const startY = Math.max(0, points[0].y - 250);
        const endY = Math.min(docHeight, points[points.length - 1].y + 300);
        const circuitX = points[0].x;

        // Build path with small horizontal jogs between nodes
        let pathD = `M ${circuitX} ${startY}`;

        points.forEach((pt, i) => {
            pathD += ` L ${circuitX} ${pt.y}`;

            if (i < points.length - 1) {
                const jogDir = (i % 2 === 0) ? -1 : 1;
                const jogAmount = 18;
                const jogX = circuitX + (jogDir * jogAmount);
                const midY = pt.y + (points[i + 1].y - pt.y) * 0.5;

                pathD += ` L ${jogX} ${pt.y + 50}`;
                pathD += ` L ${jogX} ${midY - 20}`;
                pathD += ` L ${circuitX} ${midY + 30}`;
            }
        });

        pathD += ` L ${circuitX} ${endY}`;

        // Background path (dim)
        const bgPath = document.createElementNS(ns, 'path');
        bgPath.setAttribute('d', pathD);
        bgPath.setAttribute('class', 'circuit-backbone');
        svg.appendChild(bgPath);

        // Foreground path (lit, scroll-driven)
        const glowPath = document.createElementNS(ns, 'path');
        glowPath.setAttribute('d', pathD);
        glowPath.setAttribute('class', 'circuit-backbone-glow');
        svg.appendChild(glowPath);

        const totalLength = glowPath.getTotalLength();
        glowPath.style.strokeDasharray = totalLength;
        glowPath.style.strokeDashoffset = totalLength;

        svg._glowPath = glowPath;
        svg._totalLength = totalLength;

        // Dots at each node
        points.forEach((pt, i) => {
            const pulse = document.createElementNS(ns, 'circle');
            pulse.setAttribute('cx', pt.x);
            pulse.setAttribute('cy', pt.y);
            pulse.setAttribute('r', '6');
            pulse.setAttribute('class', 'circuit-pulse');
            pulse.dataset.index = i;
            svg.appendChild(pulse);

            const dot = document.createElementNS(ns, 'circle');
            dot.setAttribute('cx', pt.x);
            dot.setAttribute('cy', pt.y);
            dot.setAttribute('r', '5');
            dot.setAttribute('class', 'circuit-dot');
            dot.dataset.index = i;
            svg.appendChild(dot);
        });

        // Electron particle that rides the path
        const electron = document.createElementNS(ns, 'circle');
        electron.setAttribute('r', '3');
        electron.setAttribute('class', 'circuit-electron');
        svg.appendChild(electron);
        svg._electron = electron;

        // Horizontal branches to product nodes
        const productNodes = document.querySelectorAll('.product-node');
        productNodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            const nodeLeft = rect.left + window.scrollX;
            const nodeMidY = rect.top + rect.height / 2 + window.scrollY;

            const branch = document.createElementNS(ns, 'path');
            branch.setAttribute('d', `M ${circuitX} ${nodeMidY} L ${nodeLeft} ${nodeMidY}`);
            branch.setAttribute('class', 'circuit-backbone');
            branch.style.opacity = '0.06';
            svg.appendChild(branch);

            // Small dot at junction
            const jDot = document.createElementNS(ns, 'circle');
            jDot.setAttribute('cx', circuitX);
            jDot.setAttribute('cy', nodeMidY);
            jDot.setAttribute('r', '2');
            jDot.setAttribute('class', 'circuit-dot');
            svg.appendChild(jDot);
        });

        updateCircuitScroll();
    }

    function updateCircuitScroll() {
        if (!svg._glowPath) return;

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollFraction = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

        // Draw glow path based on scroll
        const offset = svg._totalLength * (1 - scrollFraction);
        svg._glowPath.style.strokeDashoffset = offset;

        // Move electron along the drawn portion
        if (svg._electron && svg._glowPath) {
            const drawnLength = svg._totalLength * scrollFraction;
            if (drawnLength > 0) {
                const point = svg._glowPath.getPointAtLength(drawnLength);
                svg._electron.setAttribute('cx', point.x);
                svg._electron.setAttribute('cy', point.y);
                svg._electron.style.opacity = '1';
            } else {
                svg._electron.style.opacity = '0';
            }
        }

        // Light up dots when scrolled past
        const dots = svg.querySelectorAll('.circuit-dot');
        const pulses = svg.querySelectorAll('.circuit-pulse');
        const markers = document.querySelectorAll('.node-marker');

        markers.forEach((marker, i) => {
            const rect = marker.getBoundingClientRect();
            const threshold = window.innerHeight * 0.6;

            if (rect.top < threshold) {
                dots[i]?.classList.add('lit');
                pulses[i]?.classList.add('active');
            } else {
                dots[i]?.classList.remove('lit');
                pulses[i]?.classList.remove('active');
            }
        });

        updateSignalBar();
    }

    // ===== 5. Events =====
    window.addEventListener('scroll', updateCircuitScroll, { passive: true });

    buildCircuit();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildCircuit, 200);
    });

    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
});
