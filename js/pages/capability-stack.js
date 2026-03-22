/* ═══════════════════════════════════════════════════════════════════════════
   capability-stack.js — Interactive 7-layer capability stack diagram
   Enterprise AI Playbook — sunilprakash.com/enterprise-ai
   ═══════════════════════════════════════════════════════════════════════════ */

const LAYERS = [
  {
    num: 1,
    name: 'Infrastructure',
    desc: 'Compute, networking, cost management',
    buildPct: 20,
    detail: {
      does: 'Provides compute, networking, storage, and cost management for AI workloads. Includes GPU clusters, model serving infrastructure, and development environments.',
      owns: 'Platform team (or cloud provider for managed services)',
      without: 'Teams provision ad-hoc compute, costs spiral without visibility, and production workloads compete with experiments for resources.',
    },
  },
  {
    num: 2,
    name: 'Governance & Control Plane',
    desc: 'Policy enforcement, audit, identity, entitlements, observability',
    buildPct: 70,
    crossCutting: true,
    detail: {
      does: 'Enforces policy, manages identity and access, maintains audit trails, monitors drift, and provides observability across all AI systems.',
      owns: 'Governance function and platform team (shared)',
      without: 'No visibility into what AI systems are running, no incident response capability, and regulatory exposure accumulates silently.',
    },
  },
  {
    num: 3,
    name: 'Data Foundation',
    desc: 'Data products, quality, lineage, cataloging',
    buildPct: 50,
    detail: {
      does: 'Manages data products, quality pipelines, lineage tracking, cataloging, and access controls. Makes data AI-ready.',
      owns: 'CDO organization and domain data teams (shared)',
      without: 'Models train on inconsistent data, quality issues propagate through AI outputs, and no one can trace which data influenced which decisions.',
    },
  },
  {
    num: 4,
    name: 'Knowledge Layer',
    desc: 'RAG, knowledge graphs, enterprise context, retrieval',
    buildPct: 60,
    detail: {
      does: 'Provides retrieval-augmented generation, knowledge graphs, and enterprise context to AI systems. Turns institutional knowledge into a queryable asset.',
      owns: 'Platform team builds infrastructure, domain teams curate content',
      without: 'AI systems operate without organizational context, producing generic outputs that lack institutional relevance.',
    },
  },
  {
    num: 5,
    name: 'Model Services',
    desc: 'Model access, fine-tuning, evaluation, versioning',
    buildPct: 30,
    detail: {
      does: 'Provides unified access to models (internal and vendor), evaluation frameworks, versioning, and fine-tuning infrastructure.',
      owns: 'Platform team',
      without: 'Each team selects and integrates models independently, creating vendor lock-in, inconsistent evaluation, and no ability to compare or swap models.',
    },
  },
  {
    num: 6,
    name: 'Orchestration & Agents',
    desc: 'Workflow coordination, agent frameworks, human-in-loop',
    buildPct: 50,
    detail: {
      does: 'Coordinates multi-step AI workflows, manages agent lifecycles, handles human-in-loop patterns, and routes tasks to appropriate models.',
      owns: 'Platform team builds framework, domain teams build workflows',
      without: 'Complex AI tasks require custom integration code per use case, agents operate without coordination, and human oversight has no systematic entry point.',
    },
  },
  {
    num: 7,
    name: 'Applications & Use Cases',
    desc: 'Where business value is realized',
    buildPct: 80,
    detail: {
      does: 'Delivers business value through AI-powered products, internal tools, and process automation built on the layers below.',
      owns: 'Domain AI teams and business units',
      without: 'The entire stack exists without purpose. Value is only realized when capability reaches users and changes how work is done.',
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') node.className = v;
      else if (k === 'textContent') node.textContent = v;
      else if (k === 'innerHTML') node.innerHTML = v;
      else if (k.startsWith('data-')) node.setAttribute(k, v);
      else node.setAttribute(k, v);
    }
  }
  if (children) {
    for (const c of children) {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    }
  }
  return node;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobile() {
  return window.innerWidth < 768;
}

// ─── SVG Connection Lines ─────────────────────────────────────────────────────

function createConnectionsSvg(container, layerEls) {
  if (isMobile()) return null;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'stack-connections');
  svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';

  // Will be positioned after layout
  container.style.position = 'relative';
  container.insertBefore(svg, container.firstChild);

  return svg;
}

function drawConnections(svg, layerEls) {
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  // Clear existing
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const containerRect = svg.getBoundingClientRect();
  const svgW = containerRect.width;
  const svgH = containerRect.height;
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);

  // Get midpoints of each layer
  const midpoints = layerEls.map(layerEl => {
    const rect = layerEl.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
      top: rect.top - containerRect.top,
      bottom: rect.top - containerRect.top + rect.height,
    };
  });

  const lines = [];

  // Adjacent layer connections (vertical lines between sequential layers)
  for (let i = 0; i < midpoints.length - 1; i++) {
    const from = midpoints[i];
    const to = midpoints[i + 1];
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.bottom);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.top);
    line.setAttribute('stroke', '#c8b48c');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0.15');
    line.setAttribute('data-from', i);
    line.setAttribute('data-to', i + 1);
    line.classList.add('conn-line');
    svg.appendChild(line);
    lines.push(line);
  }

  // Governance (index 1) connects to ALL other layers
  const govIdx = 1;
  const govMid = midpoints[govIdx];
  for (let i = 0; i < midpoints.length; i++) {
    if (i === govIdx) continue;
    // Skip adjacent connections already drawn (index 0 and 2)
    if (i === govIdx - 1 || i === govIdx + 1) continue;

    const other = midpoints[i];
    const line = document.createElementNS(ns, 'line');
    // Offset the x slightly for governance lines to distinguish them
    const offsetX = 24;
    line.setAttribute('x1', govMid.x - offsetX);
    line.setAttribute('y1', i < govIdx ? govMid.top : govMid.bottom);
    line.setAttribute('x2', other.x - offsetX);
    line.setAttribute('y2', i < govIdx ? other.bottom : other.top);
    line.setAttribute('stroke', '#c8b48c');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0.15');
    line.setAttribute('data-from', govIdx);
    line.setAttribute('data-to', i);
    line.classList.add('conn-line', 'conn-gov');
    svg.appendChild(line);
    lines.push(line);
  }

  return lines;
}

function highlightConnections(lines, layerIndex) {
  if (!lines) return;
  for (const line of lines) {
    const from = parseInt(line.getAttribute('data-from'), 10);
    const to = parseInt(line.getAttribute('data-to'), 10);
    if (from === layerIndex || to === layerIndex) {
      line.setAttribute('opacity', '0.5');
    } else {
      line.setAttribute('opacity', '0.05');
    }
  }
}

function resetConnections(lines) {
  if (!lines) return;
  for (const line of lines) {
    line.setAttribute('opacity', '0.15');
  }
}

// ─── Build / Buy Bar ──────────────────────────────────────────────────────────

function createBuildBuyBar(buildPct) {
  const bar = el('div', { className: 'build-buy-bar' });
  bar.style.cssText = 'display:flex;height:2px;width:100%;margin-top:6px;border-radius:1px;overflow:hidden;';

  const buildPart = el('div');
  buildPart.style.cssText = `width:${buildPct}%;height:100%;background:var(--gold);opacity:0.5;`;

  const buyPart = el('div');
  buyPart.style.cssText = `width:${100 - buildPct}%;height:100%;background:var(--label);opacity:0.2;`;

  bar.appendChild(buildPart);
  bar.appendChild(buyPart);
  return bar;
}

// ─── Layer Detail Content ─────────────────────────────────────────────────────

function createDetailContent(layer) {
  const inner = el('div', { className: 'layer-detail-inner' });

  const doesP = el('p');
  const doesLabel = el('strong', { textContent: 'What it does: ' });
  doesP.appendChild(doesLabel);
  doesP.appendChild(document.createTextNode(layer.detail.does));
  inner.appendChild(doesP);

  const ownsP = el('p');
  const ownsLabel = el('strong', { textContent: 'Who owns it: ' });
  ownsP.appendChild(ownsLabel);
  ownsP.appendChild(document.createTextNode(layer.detail.owns));
  inner.appendChild(ownsP);

  const withoutP = el('p');
  const withoutLabel = el('strong', { textContent: 'What goes wrong without it: ' });
  withoutP.appendChild(withoutLabel);
  withoutP.appendChild(document.createTextNode(layer.detail.without));
  inner.appendChild(withoutP);

  const detail = el('div', { className: 'layer-detail' });
  detail.appendChild(inner);
  return detail;
}

// ─── Build Layer Item ─────────────────────────────────────────────────────────

function createLayerItem(layer) {
  const item = el('div', {
    className: 'layer-item',
    'data-layer': String(layer.num),
    role: 'button',
    tabindex: '0',
    'aria-expanded': 'false',
  });

  const num = el('span', { className: 'layer-num', textContent: String(layer.num) });
  const nameWrap = el('div', { className: 'layer-name-wrap' });
  nameWrap.style.cssText = 'flex:1;min-width:0;';
  const name = el('span', { className: 'layer-name', textContent: layer.name });
  nameWrap.appendChild(name);
  nameWrap.appendChild(createBuildBuyBar(layer.buildPct));

  const desc = el('span', { className: 'layer-desc', textContent: layer.desc });
  const detail = createDetailContent(layer);

  item.appendChild(num);
  item.appendChild(nameWrap);
  item.appendChild(desc);
  item.appendChild(detail);

  return item;
}

// ─── Build-Up Animation ───────────────────────────────────────────────────────

function animateBuildUp(layerEls, callback) {
  if (prefersReducedMotion()) {
    layerEls.forEach(layerEl => {
      layerEl.style.opacity = '1';
      layerEl.style.transform = 'none';
    });
    if (callback) callback();
    return;
  }

  // Initial state: hidden
  layerEls.forEach(layerEl => {
    layerEl.style.opacity = '0';
    layerEl.style.transform = 'translateY(20px)';
    layerEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  // Stagger reveal bottom to top (layers are already ordered bottom-to-top in DOM)
  layerEls.forEach((layerEl, i) => {
    setTimeout(() => {
      layerEl.style.opacity = '1';
      layerEl.style.transform = 'none';
    }, i * 150);
  });

  // Callback after all animations complete
  if (callback) {
    setTimeout(callback, layerEls.length * 150 + 500);
  }
}

// ─── Build-Buy Legend ─────────────────────────────────────────────────────────

function createLegend() {
  const legend = el('div', { className: 'stack-legend' });
  legend.style.cssText = 'display:flex;gap:20px;align-items:center;margin-top:16px;justify-content:flex-end;';

  const buildItem = el('div');
  buildItem.style.cssText = 'display:flex;align-items:center;gap:6px;';
  const buildSwatch = el('div');
  buildSwatch.style.cssText = 'width:20px;height:2px;background:var(--gold);opacity:0.5;border-radius:1px;';
  const buildLabel = el('span');
  buildLabel.style.cssText = 'font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--label);';
  buildLabel.textContent = 'Build';
  buildItem.appendChild(buildSwatch);
  buildItem.appendChild(buildLabel);

  const buyItem = el('div');
  buyItem.style.cssText = 'display:flex;align-items:center;gap:6px;';
  const buySwatch = el('div');
  buySwatch.style.cssText = 'width:20px;height:2px;background:var(--label);opacity:0.2;border-radius:1px;';
  const buyLabel = el('span');
  buyLabel.style.cssText = 'font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--label);';
  buyLabel.textContent = 'Buy';
  buyItem.appendChild(buySwatch);
  buyItem.appendChild(buyLabel);

  legend.appendChild(buildItem);
  legend.appendChild(buyItem);
  return legend;
}

// ─── Main Init ────────────────────────────────────────────────────────────────

function init() {
  const mount = document.getElementById('capability-stack-interactive');
  if (!mount) return;

  // Container for the stack
  const stackContainer = el('div', { className: 'stack-container' });
  stackContainer.style.cssText = 'position:relative;';

  const stack = el('div', { className: 'layer-stack' });

  // Build layers bottom-to-top (Infrastructure first, Applications last)
  const layerEls = [];
  for (const layer of LAYERS) {
    const item = createLayerItem(layer);
    stack.appendChild(item);
    layerEls.push(item);
  }

  stackContainer.appendChild(stack);
  stackContainer.appendChild(createLegend());
  mount.appendChild(stackContainer);

  // ─── SVG connections ────────────────────────────────────────────────────
  let svg = null;
  let connectionLines = null;

  function initConnections() {
    if (isMobile()) return;
    svg = createConnectionsSvg(stackContainer, layerEls);
    // Defer drawing to let layout settle
    requestAnimationFrame(() => {
      connectionLines = drawConnections(svg, layerEls);
    });
  }

  // ─── Expand / Collapse ──────────────────────────────────────────────────

  let expandedIndex = -1;

  function toggleLayer(index) {
    const wasExpanded = expandedIndex === index;

    // Collapse current if any
    if (expandedIndex >= 0) {
      layerEls[expandedIndex].classList.remove('expanded');
      layerEls[expandedIndex].setAttribute('aria-expanded', 'false');
    }

    if (wasExpanded) {
      expandedIndex = -1;
    } else {
      layerEls[index].classList.add('expanded');
      layerEls[index].setAttribute('aria-expanded', 'true');
      expandedIndex = index;
    }

    // Redraw connections after expand/collapse animation settles
    if (svg) {
      setTimeout(() => {
        connectionLines = drawConnections(svg, layerEls);
      }, 450);
    }
  }

  // Click handlers
  layerEls.forEach((item, i) => {
    item.addEventListener('click', () => toggleLayer(i));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleLayer(i);
      }
    });

    // Hover: highlight connections
    item.addEventListener('mouseenter', () => {
      highlightConnections(connectionLines, i);
      item.style.transform = 'translateX(4px)';
    });
    item.addEventListener('mouseleave', () => {
      resetConnections(connectionLines);
      item.style.transform = '';
    });
  });

  // ─── Scroll-triggered build-up animation ────────────────────────────────

  if (!window.IntersectionObserver || prefersReducedMotion()) {
    // No observer or reduced motion: show everything, draw connections
    layerEls.forEach(layerEl => {
      layerEl.style.opacity = '1';
      layerEl.style.transform = 'none';
    });
    initConnections();
  } else {
    // Hide layers initially
    layerEls.forEach(layerEl => {
      layerEl.style.opacity = '0';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(mount);
            animateBuildUp(layerEls, () => {
              initConnections();
            });
            break;
          }
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(mount);
  }

  // ─── Resize handler for connections ─────────────────────────────────────

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (svg) {
        // Remove SVG on mobile
        if (isMobile()) {
          svg.remove();
          svg = null;
          connectionLines = null;
          return;
        }
        connectionLines = drawConnections(svg, layerEls);
      } else if (!isMobile()) {
        // Recreate on desktop
        initConnections();
      }
    }, 200);
  });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
