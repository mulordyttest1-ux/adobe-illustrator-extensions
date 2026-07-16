#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`GATE CHECK FAILED: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`GATE CHECK PASSED: ${message}`);
}

function parseArgs(argv) {
  let file = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') {
      file = argv[i + 1] || null;
      i += 1;
    }
  }

  return { file };
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n');
}

function parseSections(text) {
  const sections = [];
  const lines = normalizeLineEndings(text).split('\n');
  let current = null;

  for (const line of lines) {
    const headingMatch = /^##\s+(.+?)\s*$/.exec(line);
    if (headingMatch) {
      current = { name: headingMatch[1].trim(), lines: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  return sections;
}

function parseKeyValueLines(lines) {
  const values = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const match = /^([^:]+):\s*(.+?)\s*$/.exec(line);
    if (match) {
      values[match[1].trim()] = match[2].trim();
    }
  }

  return values;
}

function getSection(sections, name) {
  return sections.find((section) => section.name.toLowerCase() === name.toLowerCase()) || null;
}

function requireNonEmptyField(values, fieldName, sectionName) {
  if (!Object.prototype.hasOwnProperty.call(values, fieldName) || !values[fieldName]) {
    fail(`missing or empty field "${fieldName}" in section "${sectionName}"`);
  }
}

function parseYesNo(value, fieldName) {
  const normalized = value.toLowerCase();
  if (normalized !== 'yes' && normalized !== 'no') {
    fail(`field "${fieldName}" must be "yes" or "no", got "${value}"`);
  }
  return normalized === 'yes';
}

function parseTaskTier(value) {
  const match = /^D1-(1|2|3)$/.exec(value);
  if (!match) {
    fail(`field "Task Tier" must be D1-1, D1-2, or D1-3, got "${value}"`);
  }
  return Number(match[1]);
}

function validateReviewGate(section) {
  const values = parseKeyValueLines(section.lines);
  requireNonEmptyField(values, 'Scope Reviewed', 'Review Gate');
  requireNonEmptyField(values, 'Top Risks', 'Review Gate');
  requireNonEmptyField(values, 'Validation Rerun Needed', 'Review Gate');

  const hasRequiredFixes = Object.prototype.hasOwnProperty.call(values, 'Required Fixes') && values['Required Fixes'];
  const hasNoBlocking = Object.prototype.hasOwnProperty.call(values, 'No Blocking Findings') && values['No Blocking Findings'];

  if (!hasRequiredFixes && !hasNoBlocking) {
    fail('section "Review Gate" must contain either "Required Fixes" or "No Blocking Findings"');
  }
}

function validateVerificationGate(section) {
  const values = parseKeyValueLines(section.lines);
  requireNonEmptyField(values, 'Claims Verified', 'Verification Gate');
  requireNonEmptyField(values, 'Evidence Run', 'Verification Gate');
  requireNonEmptyField(values, 'Remaining Limits', 'Verification Gate');
  requireNonEmptyField(values, 'Unverified But Suspected', 'Verification Gate');
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    fail('missing required argument --file <path-to-c2>');
  }

  const repoRoot = process.cwd();
  const targetPath = path.resolve(repoRoot, args.file);

  if (!fs.existsSync(targetPath)) {
    fail(`file not found: ${args.file}`);
  }

  let text;
  try {
    text = fs.readFileSync(targetPath, 'utf8');
  } catch (error) {
    fail(`unable to read file as UTF-8: ${args.file}`);
  }

  const sections = parseSections(text);
  if (!sections.length) {
    fail('file does not contain any level-2 sections');
  }

  if (sections[0].name.toLowerCase() !== 'gate policy') {
    fail('first level-2 section must be "Gate Policy"');
  }

  const policySection = sections[0];
  const policy = parseKeyValueLines(policySection.lines);

  requireNonEmptyField(policy, 'Workflow', 'Gate Policy');
  requireNonEmptyField(policy, 'Task Tier', 'Gate Policy');
  requireNonEmptyField(policy, 'Code Change', 'Gate Policy');
  requireNonEmptyField(policy, 'Shared Change', 'Gate Policy');
  requireNonEmptyField(policy, 'Cross-App Impact', 'Gate Policy');

  const workflow = policy.Workflow.toLowerCase();
  if (workflow !== 'build' && workflow !== 'fix') {
    fail(`field "Workflow" must be "build" or "fix", got "${policy.Workflow}"`);
  }

  const taskTier = parseTaskTier(policy['Task Tier']);
  const codeChange = parseYesNo(policy['Code Change'], 'Code Change');
  const sharedChange = parseYesNo(policy['Shared Change'], 'Shared Change');
  const crossAppImpact = parseYesNo(policy['Cross-App Impact'], 'Cross-App Impact');

  const reviewRequired = taskTier >= 2 || sharedChange || crossAppImpact;
  const verificationRequired = codeChange;

  const reviewSection = getSection(sections, 'Review Gate');
  const verificationSection = getSection(sections, 'Verification Gate');

  if (reviewRequired && !reviewSection) {
    fail('Review Gate is required by Gate Policy but section "Review Gate" is missing');
  }
  if (!reviewRequired && reviewSection) {
    console.warn('GATE CHECK NOTE: "Review Gate" is present even though Gate Policy does not require it.');
  }
  if (reviewSection) {
    validateReviewGate(reviewSection);
  }

  if (verificationRequired && !verificationSection) {
    fail('Verification Gate is required by Gate Policy but section "Verification Gate" is missing');
  }
  if (!verificationRequired && verificationSection) {
    console.warn('GATE CHECK NOTE: "Verification Gate" is present even though Gate Policy does not require it.');
  }
  if (verificationSection) {
    validateVerificationGate(verificationSection);
  }

  ok(`${args.file} satisfies required gate sections for workflow=${workflow}, taskTier=D1-${taskTier}, codeChange=${codeChange ? 'yes' : 'no'}, sharedChange=${sharedChange ? 'yes' : 'no'}, crossAppImpact=${crossAppImpact ? 'yes' : 'no'}`);
}

main();
