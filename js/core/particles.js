/* ═══════════════════════════════════════════════════════════════════════════
   particles.js — Ambient gold particle system
   Enterprise AI Playbook — sunilprakash.com/enterprise-ai
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Base Configuration (Level B: Rich Atmosphere) ─────────────────────────

  const BASE_CONFIG = {
    count: 45,
    maxSize: 2.2,
    minSize: 0.5,
    maxOpacity: 0.35,
    speed: 0.2,
    drift: 0.4,
    cursorInteraction: true,
    cursorRadius: 120,
    sparkle: true,
    sparkleSpeed: [0.02, 0.08],
    colors: [
      [200, 180, 140],  // warm gold (50%)
      [220, 200, 160],  // light gold (30%)
      [180, 160, 130],  // deep gold (20%)
    ],
    glow: true,
    glowMultiplier: 3,
    glowOpacity: 0.08,
  };

  // Color weight table: index repeated proportional to weight
  const COLOR_WEIGHTS = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2];

  // ─── Engagement Scaling ────────────────────────────────────────────────────

  function applyEngagementScaling(cfg) {
    try {
      const raw = localStorage.getItem('obsidian_engagement');
      if (!raw) return cfg;
      const data = JSON.parse(raw);
      const visited = Array.isArray(data.pagesVisited) ? data.pagesVisited.length : 0;
      if (visited >= 16) {
        return Object.assign({}, cfg, { count: 55, maxOpacity: 0.40 });
      } else if (visited >= 6) {
        return Object.assign({}, cfg, { count: 50, maxOpacity: 0.38 });
      }
    } catch (e) {
      // localStorage unavailable or malformed — use defaults
    }
    return cfg;
  }

  // ─── Particle Class ────────────────────────────────────────────────────────

  function Particle(canvasW, canvasH, cfg) {
    this.cfg = cfg;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.init(true);
  }

  Particle.prototype.init = function (randomY) {
    const cfg = this.cfg;

    // Position: random X, random Y if first init, otherwise start at bottom
    this.x = Math.random() * this.canvasW;
    this.y = randomY
      ? Math.random() * this.canvasH
      : this.canvasH + Math.random() * 20;

    // Size
    this.size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);

    // Base opacity
    this.baseOpacity = Math.random() * cfg.maxOpacity;

    // Upward speed: random around config.speed
    this.vy = -(cfg.speed * (0.6 + Math.random() * 0.8));

    // Horizontal drift: applied via sinusoidal wobble
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.005 + Math.random() * 0.015;
    this.wobbleAmplitude = cfg.drift * (0.5 + Math.random() * 1.0);

    // Sparkle
    this.sparklePhase = Math.random() * Math.PI * 2;
    this.sparkleSpeed = cfg.sparkleSpeed[0] +
      Math.random() * (cfg.sparkleSpeed[1] - cfg.sparkleSpeed[0]);

    // Color from weighted table
    const colorIdx = cfg.colors[COLOR_WEIGHTS[Math.floor(Math.random() * COLOR_WEIGHTS.length)]];
    this.color = colorIdx;

    // Current opacity (for fade in/out)
    this.opacity = this.baseOpacity;

    // Velocity accumulator for cursor repulsion
    this.vx = 0;
  };

  Particle.prototype.update = function (mouseX, mouseY, cfg) {
    // Wobble drift (sinusoidal horizontal)
    this.wobblePhase += this.wobbleSpeed;
    const driftX = Math.sin(this.wobblePhase) * this.wobbleAmplitude;

    // Cursor repulsion
    let pushX = 0;
    let opacityBoost = 1.0;

    if (cfg.cursorInteraction && mouseX !== null && mouseY !== null) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < cfg.cursorRadius && dist > 0) {
        // Linear falloff: strongest at center, zero at radius edge
        const force = (1 - dist / cfg.cursorRadius) * 0.8;
        pushX = (dx / dist) * force;
        const pushY = (dy / dist) * force;

        this.vx += pushX;
        // Apply push to vertical position too (gentle, not violent)
        this.y += pushY * 0.4;

        // Brightness boost near cursor
        opacityBoost = 1.5;
      }
    }

    // Decay cursor velocity
    this.vx *= 0.85;

    // Apply movement
    this.x += driftX + this.vx;
    this.y += this.vy;

    // Sparkle: sinusoidal opacity modulation
    let displayOpacity = this.baseOpacity;
    if (cfg.sparkle) {
      this.sparklePhase += this.sparkleSpeed;
      const sparkMod = 0.7 + 0.3 * Math.sin(this.sparklePhase);
      displayOpacity = this.baseOpacity * sparkMod;
    }

    // Apply cursor brightness boost, capped at maxOpacity
    this.opacity = Math.min(displayOpacity * opacityBoost, cfg.maxOpacity);

    // Respawn if out of bounds (top or sides)
    if (this.y < -10 || this.x < -20 || this.x > this.canvasW + 20) {
      this.init(false);
    }
  };

  Particle.prototype.draw = function (ctx, cfg) {
    const [r, g, b] = this.color;

    // Glow pass: larger, very faint circle for particles above 1.2px
    if (cfg.glow && this.size > 1.2) {
      const glowRadius = this.size * cfg.glowMultiplier;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${cfg.glowOpacity})`;
      ctx.fill();
    }

    // Core particle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity.toFixed(3)})`;
    ctx.fill();
  };

  // ─── Canvas Setup ──────────────────────────────────────────────────────────

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    resize();
    window.addEventListener('resize', resize);

    return {
      getLogicalWidth: function () { return window.innerWidth; },
      getLogicalHeight: function () { return window.innerHeight; },
      dpr: dpr,
      resize: resize,
    };
  }

  // ─── Focus Mode Integration ────────────────────────────────────────────────

  function setupFocusMode(canvas, getParticles) {
    let fadeInterval = null;

    function clearFade() {
      if (fadeInterval !== null) {
        clearInterval(fadeInterval);
        fadeInterval = null;
      }
    }

    function fadeOut() {
      clearFade();
      const particles = getParticles();
      const steps = 30;
      const stepMs = 1000 / steps;
      let step = 0;

      // Capture original base opacities
      const origOpacities = particles.map(function (p) { return p.baseOpacity; });

      fadeInterval = setInterval(function () {
        step++;
        const t = step / steps;
        particles.forEach(function (p, i) {
          p.baseOpacity = origOpacities[i] * (1 - t);
          p.opacity = p.baseOpacity;
        });
        if (step >= steps) {
          clearFade();
          canvas.style.display = 'none';
        }
      }, stepMs);
    }

    function fadeIn() {
      clearFade();
      canvas.style.display = 'block';
      const particles = getParticles();
      const steps = 30;
      const stepMs = 1000 / steps;
      let step = 0;

      // Assign target opacities fresh
      const cfg = particles.length > 0 ? particles[0].cfg : null;
      const targetOpacities = particles.map(function () {
        return cfg ? Math.random() * cfg.maxOpacity : 0.2;
      });

      fadeInterval = setInterval(function () {
        step++;
        const t = step / steps;
        particles.forEach(function (p, i) {
          p.baseOpacity = targetOpacities[i] * t;
          p.opacity = p.baseOpacity;
        });
        if (step >= steps) {
          clearFade();
          // Lock in final values
          particles.forEach(function (p, i) {
            p.baseOpacity = targetOpacities[i];
          });
        }
      }, stepMs);
    }

    function checkBodyClass() {
      const body = document.body;
      if (body.classList.contains('focus')) {
        fadeOut();
      } else if (body.classList.contains('atmosphere')) {
        fadeIn();
      }
    }

    const observer = new MutationObserver(function () {
      checkBodyClass();
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Check initial state
    checkBodyClass();
  }

  // ─── Main initParticles ────────────────────────────────────────────────────

  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reduced motion: static, no animation
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile detection
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Build config with engagement scaling
    let cfg = Object.assign({}, BASE_CONFIG);
    cfg = applyEngagementScaling(cfg);

    // Mobile: reduce particle count
    if (isMobile) {
      cfg = Object.assign({}, cfg, { count: 20 });
    }

    // Canvas setup
    const canvasInfo = setupCanvas(canvas);
    const dpr = canvasInfo.dpr;

    // Mouse tracking
    let mouseX = null;
    let mouseY = null;

    if (cfg.cursorInteraction && !reducedMotion) {
      window.addEventListener('mousemove', function (e) {
        // Convert to logical pixels (canvas coords without DPR)
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      window.addEventListener('mouseleave', function () {
        mouseX = null;
        mouseY = null;
      });
    }

    // Create particles
    var particles = [];

    function createParticles() {
      particles = [];
      const w = canvasInfo.getLogicalWidth();
      const h = canvasInfo.getLogicalHeight();

      // Update particle dimensions on resize
      for (var i = 0; i < cfg.count; i++) {
        var p = new Particle(w, h, cfg);
        particles.push(p);
      }
    }

    // Recreate particles on resize so they stay within bounds
    window.addEventListener('resize', function () {
      createParticles();
    });

    createParticles();

    // ── Reduced motion: draw once, static ──────────────────────────────────
    if (reducedMotion) {
      ctx.save();
      ctx.scale(dpr, dpr);
      particles.forEach(function (p) {
        p.opacity = 0.15;
        p.baseOpacity = 0.15;
        p.draw(ctx, cfg);
      });
      ctx.restore();
      return;
    }

    // ── Focus mode integration ──────────────────────────────────────────────
    setupFocusMode(canvas, function () { return particles; });

    // ── Animation loop ──────────────────────────────────────────────────────
    var lastTimestamp = 0;
    const mobileThrottle = 1000 / 30; // 30fps on mobile

    function loop(timestamp) {
      // Mobile throttle: skip frame if too soon
      if (isMobile && timestamp - lastTimestamp < mobileThrottle) {
        requestAnimationFrame(loop);
        return;
      }
      lastTimestamp = timestamp;

      const w = canvasInfo.getLogicalWidth();
      const h = canvasInfo.getLogicalHeight();

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scale to DPR once per frame
      ctx.save();
      ctx.scale(dpr, dpr);

      // Update and draw each particle
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        // Keep particle aware of current canvas dimensions
        p.canvasW = w;
        p.canvasH = h;
        p.update(mouseX, mouseY, cfg);
        p.draw(ctx, cfg);
      }

      ctx.restore();

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // Expose globally
  window.initParticles = initParticles;

}());
