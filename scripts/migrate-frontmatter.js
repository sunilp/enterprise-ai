#!/usr/bin/env node
// One-off: put every content page on the seven-discipline spine (frontmatter only; bodies untouched).
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const ROOT = path.join(__dirname, '..');
const C = p => path.join(ROOT, 'content', p + '.md');

const MAP = {
  'position/the-problem': ['diagnose', 1], 'position/failure-modes': ['diagnose', 2], 'position/what-transformation-means': ['diagnose', 3],
  'assessment/ai-readiness': ['prepare', 1], 'assessment/data-readiness': ['prepare', 2], 'assessment/process-talent': ['prepare', 3], 'assessment/maturity-model': ['prepare', 4],
  'portfolio/prioritization': ['prepare', 5], 'portfolio/value-concentration': ['prepare', 6], 'portfolio/pilot-to-production': ['prepare', 7], 'assessment/tool': ['prepare', 8],
  'governance/architecture': ['govern', 1], 'governance/genai-model-risk': ['govern', 2], 'governance/agent-governance': ['govern', 3], 'governance/shadow-ai': ['govern', 4], 'governance/regulatory-readiness': ['govern', 5],
  'architecture/capability-stack': ['design', 1], 'architecture/systems-model': ['design', 2], 'architecture/control-architecture': ['design', 3], 'architecture/operating-architecture': ['design', 4], 'architecture/reference-patterns': ['design', 5], 'agentic-strategy/the-shift': ['design', 6], 'agentic-strategy/protocol-landscape': ['design', 7],
  'measurement/design': ['operate', 1], 'measurement/financial-linkage': ['operate', 2], 'measurement/board-reporting': ['operate', 3], 'agentic-strategy/finops': ['operate', 4],
  'operating-model/caio-mandate': ['organize', 1], 'operating-model/structural-models': ['organize', 2], 'operating-model/decision-rights': ['organize', 3], 'operating-model/coordination': ['organize', 4], 'workforce/role-evolution': ['organize', 5], 'workforce/middle-management': ['organize', 6], 'workforce/knowledge-architecture': ['organize', 7], 'agentic-strategy/human-agent-collaboration': ['organize', 8],
  'transformation/roadmap': ['sustain', 1], 'transformation/phase-gates': ['sustain', 2],
};
const GROUP_MAP = { 'framework': ['start', 1], 'reading-paths': ['start', 2], 'proof/case-studies': ['proof', 1], 'proof/decision-records': ['proof', 2], 'proof/decision-artifacts': ['proof', 3], 'proof/checklists': ['proof', 4], 'glossary': ['reference', 1], 'sources': ['reference', 2] };

function rewrite(file, fn) {
  const raw = fs.readFileSync(file, 'utf-8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter: ' + file);
  const meta = YAML.parse(m[1]) || {};
  delete meta.section;
  fn(meta);
  const fm = YAML.stringify(meta, { lineWidth: 0 }).trimEnd();
  fs.writeFileSync(file, `---\n${fm}\n---\n${m[2]}`, 'utf-8');
}

for (const [p, [d, o]] of Object.entries(MAP)) rewrite(C(p), meta => {
  meta.discipline = d; meta.order = o;
  if (p === 'assessment/tool') { meta.layout = 'tool'; meta.tool = true; meta.tool_script = 'readiness'; }
});
for (const [p, [g, o]] of Object.entries(GROUP_MAP)) rewrite(C(p), meta => { meta.group = g; meta.order = o; if (p === 'reading-paths') meta.layout = 'standard'; });
rewrite(C('index'), meta => { meta.layout = 'cover'; });
console.log('migrated', Object.keys(MAP).length + Object.keys(GROUP_MAP).length + 1, 'files');
