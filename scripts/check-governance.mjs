import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

const requiredFiles = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
  'docs/MASTER_PROJECT_INDEX.md',
  'docs/DEVELOPMENT_PROTOCOL.md',
  'docs/DESIGN_SYSTEM.md',
  'docs/GAME_SHELL_SPEC.md',
  'docs/RESPONSIVE_STANDARD.md',
  'docs/ACCESSIBILITY_STANDARD.md',
  'docs/PERFORMANCE_BUDGET.md',
  'docs/AI_MODEL_ROUTING.md',
  'docs/QA_MATRIX.md',
  'docs/CHANGELOG_DECISIONS.md',
  'docs/architecture/README.md',
  'docs/architecture/ADR-template.md',
  'docs/exec-plans/README.md',
  'docs/exec-plans/active/.gitkeep',
  'docs/exec-plans/completed/2026-09-09-repository-governance-v1.md',
  '.github/pull_request_template.md',
  '.github/workflows/quality.yml',
  'scripts/check-governance.mjs',
];

const contents = new Map();
for (const file of requiredFiles) {
  try {
    contents.set(file, await readFile(resolve(repositoryRoot, file), 'utf8'));
  } catch (error) {
    throw new Error(`Required governance file is missing or unreadable: ${file}`, { cause: error });
  }
}

const agents = contents.get('AGENTS.md');
if (Buffer.byteLength(agents) > 9_000) {
  throw new Error('AGENTS.md must remain a concise constitution and navigation map.');
}

for (const marker of ['source-of-truth', 'protected behavior', 'required workflow', 'AI_MODEL_ROUTING.md', 'QA_MATRIX.md']) {
  if (!agents.toLowerCase().includes(marker.toLowerCase())) {
    throw new Error(`AGENTS.md is missing a core governance topic: ${marker}`);
  }
}

const architectureStatuses = [
  'VERIFIED CURRENT ARCHITECTURE',
  'VERIFIED CURRENT DEFECT',
  'PROPOSED TARGET ARCHITECTURE',
  'NEEDS QA',
];
const architecture = contents.get('ARCHITECTURE.md');
for (const status of architectureStatuses) {
  if (!architecture.includes(status)) throw new Error(`ARCHITECTURE.md is missing status label: ${status}`);
}

const canonicalStatuses = [
  ...architectureStatuses,
  'APPROVED FUTURE WORK',
  'PRODUCTION-VERIFIED IMPLEMENTATION',
  'AUTOMATED VERIFIED',
  'MANUALLY VERIFIED WITH EVIDENCE',
  'MANUAL VERIFICATION REQUIRED',
  'KNOWN DEFECT',
  'PLANNED AUTOMATION',
  'NOT APPLICABLE',
];
const index = contents.get('docs/MASTER_PROJECT_INDEX.md');
const qaMatrix = contents.get('docs/QA_MATRIX.md');
for (const status of canonicalStatuses) {
  if (!index.includes(status)) throw new Error(`The master project index is missing canonical status: ${status}`);
}
for (const status of canonicalStatuses.slice(6)) {
  if (!qaMatrix.includes(status)) throw new Error(`The QA matrix is missing QA status: ${status}`);
}

const documentation = new Map(
  [...contents].filter(([file]) => file.endsWith('.md')),
);
documentation.set('README.md', await readFile(resolve(repositoryRoot, 'README.md'), 'utf8'));

for (const [file, content] of documentation) {
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const rawTarget = match[1].trim();
    const target = rawTarget.split('#')[0].split('?')[0];
    if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    try {
      await stat(resolve(repositoryRoot, dirname(file), target));
    } catch (error) {
      throw new Error(`Broken local documentation link in ${file}: ${rawTarget}`, { cause: error });
    }
  }
}

console.log(`Governance check passed (${requiredFiles.length} required files).`);
