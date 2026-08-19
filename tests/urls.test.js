const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DIST = path.join(__dirname, '..', 'dist');
const OLD_URLS = ['', 'framework', 'reading-paths', 'glossary', 'sources', 'architecture/index',
  'agentic-strategy/finops','agentic-strategy/human-agent-collaboration','agentic-strategy/protocol-landscape','agentic-strategy/the-shift',
  'architecture/capability-stack','architecture/control-architecture','architecture/operating-architecture','architecture/reference-patterns','architecture/systems-model',
  'assessment/ai-readiness','assessment/data-readiness','assessment/maturity-model','assessment/process-talent','assessment/tool',
  'governance/agent-governance','governance/architecture','governance/genai-model-risk','governance/regulatory-readiness','governance/shadow-ai',
  'measurement/board-reporting','measurement/design','measurement/financial-linkage',
  'operating-model/caio-mandate','operating-model/coordination','operating-model/decision-rights','operating-model/structural-models',
  'portfolio/pilot-to-production','portfolio/prioritization','portfolio/value-concentration',
  'position/failure-modes','position/the-problem','position/what-transformation-means',
  'proof/case-studies','proof/checklists','proof/decision-artifacts','proof/decision-records',
  'transformation/phase-gates','transformation/roadmap',
  'workforce/knowledge-architecture','workforce/middle-management','workforce/role-evolution'];
const HUBS = ['diagnose','prepare','govern','design','operate','organize','sustain'];

test('build succeeds and every old URL plus every hub exists', () => {
  execSync('node build.js', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  for (const u of [...OLD_URLS, ...HUBS]) {
    const f = path.join(DIST, u, 'index.html');
    assert.ok(fs.existsSync(f), `missing ${u}`);
  }
});

test('every content page is on the spine', () => {
  const nav = JSON.parse(fs.readFileSync(path.join(DIST, 'nav.json'), 'utf-8'));
  const onSpine = nav.disciplines.reduce((a, d) => a + d.pages.length, 0) + nav.groups.reduce((a, g) => a + g.pages.length, 0);
  assert.equal(onSpine, 45, 'expected 45 pages on the spine (47 files minus the cover minus architecture/index)');
});
