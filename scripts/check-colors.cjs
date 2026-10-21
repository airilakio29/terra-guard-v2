#!/usr/bin/env node
/**
 * Terra Guard V2 — Automated Color Token Enforcement Script (Step 6)
 *
 * Scans all TSX, TS, and CSS source files to ensure no hardcoded hex, rgb, rgba,
 * or hsl colors exist outside of the authorized token definition files.
 *
 * Authorized token definition files / blocks:
 * 1. src/data/themes.ts (official theme registry)
 * 2. :root and [data-theme="..."] token declaration blocks in src/index.css
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_REGEX = /rgba?\([^)]+\)/g;
const HSL_REGEX = /hsla?\([^)]+\)/g;

function walk(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        files = files.concat(walk(fullPath));
      }
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  
  // Authorized: Theme registry definition file
  if (relativePath.replace(/\\/g, '/') === 'src/data/themes.ts') {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  const isIndexCss = relativePath.replace(/\\/g, '/') === 'src/index.css';
  let inTokenBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (isIndexCss) {
      if (trimmed.startsWith(':root') || trimmed.startsWith('[data-theme=')) {
        inTokenBlock = true;
      }
      if (inTokenBlock) {
        if (trimmed === '}') {
          inTokenBlock = false;
        }
        return; // Authorized token block in index.css
      }
    }

    // Check for hardcoded color occurrences
    const hexMatches = line.match(HEX_REGEX) || [];
    const rgbMatches = line.match(RGB_REGEX) || [];
    const hslMatches = line.match(HSL_REGEX) || [];

    const totalMatches = [...hexMatches, ...rgbMatches, ...hslMatches];
    if (totalMatches.length > 0) {
      violations.push({
        line: index + 1,
        text: trimmed,
        matches: totalMatches
      });
    }
  });

  return violations;
}

console.log('🔍 Running Terra Guard V2 Color Token Enforcement Check...');
const allFiles = walk(SRC_DIR);
let totalViolations = 0;
const failureReport = [];

for (const file of allFiles) {
  const fileViolations = checkFile(file);
  if (fileViolations.length > 0) {
    totalViolations += fileViolations.length;
    failureReport.push({
      file: path.relative(ROOT_DIR, file),
      violations: fileViolations
    });
  }
}

if (totalViolations > 0) {
  console.error(`\n❌ FAILED: Found ${totalViolations} hardcoded color(s) outside token definitions:\n`);
  for (const report of failureReport) {
    console.error(`📄 ${report.file}:`);
    for (const v of report.violations) {
      console.error(`   Line ${v.line}: ${v.text} (matched: ${v.matches.join(', ')})`);
    }
    console.error('');
  }
  process.exit(1);
} else {
  console.log(`\n✅ PASSED: All visible UI colors are strictly tokenized! (0 hardcoded color violations across ${allFiles.length} files)\n`);
  process.exit(0);
}
