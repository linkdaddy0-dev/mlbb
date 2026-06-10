import fs from 'fs';
import path from 'path';
import DraftEngine from '../src/services/DraftEngine.js';

// Load compiled roster and draft matrix
const heroes = JSON.parse(fs.readFileSync('src/data/fallback_roster.json', 'utf8'));
const matrix = JSON.parse(fs.readFileSync('public/data/patches/1.8.84/en/draft_matrix.json', 'utf8'));

const engine = new DraftEngine(heroes, matrix);

const testEnemies = ['Miya', 'Fanny', 'Ling', 'Moskov'];

let allPassed = true;
console.log('=== RUNNING OFFICIAL GMS DATASET-DRIVEN VALIDATION SUITE ===\n');

// 1. Hardcoding Audit Scan
console.log('--- Run: Automated Hardcoding Audit Scan ---');
let auditPassed = true;
const filenamesToAudit = ['scratch/verify_draft_engine.js', 'scratch/verify_draft_engine.py'];

// Dynamically construct banned names to prevent the scanner from self-matching
const kh = 'Khu' + 'fra';
const mi = 'Minsit' + 'thar';
const lo = 'Loli' + 'ta';
const be = 'Bele' + 'rick';

const bannedPatterns = [
  new RegExp('Expect\\s+' + kh, 'i'),
  new RegExp('Expect\\s+' + mi, 'i'),
  new RegExp('Expect\\s+' + be, 'i'),
  new RegExp('Expect\\s+' + lo, 'i'),
  new RegExp("'" + kh + "'", 'i'),
  new RegExp("'" + mi + "'", 'i'),
  new RegExp("'" + lo + "'", 'i'),
  /target:\s*\[/i // Banned hardcoded expectation arrays
];

filenamesToAudit.forEach(filepath => {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Strip out comments to avoid false positives in annotations
  const lines = content.split('\n');
  const codeLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('//') && !trimmed.startsWith('*');
  }).join('\n');

  bannedPatterns.forEach(pattern => {
    if (pattern.test(codeLines)) {
      console.log(`[AUDIT FAIL] Banned hardcoded pattern ${pattern} found in ${filepath}!`);
      auditPassed = false;
      allPassed = false;
    }
  });
});

if (auditPassed) {
  console.log('✓ No hardcoded hero assumptions exist.');
  console.log('✓ All expected heroes are derived directly from draft_matrix.json.\n');
} else {
  console.log('❌ Hardcoding Audit Failed!\n');
}

// 2. Scenario Validations
testEnemies.forEach((enemyName) => {
  console.log(`Enemy:\n${enemyName}\n`);
  
  const enemyHero = heroes.find(h => h.name.toLowerCase() === enemyName.toLowerCase());
  if (!enemyHero) {
    console.log(`[FAIL] Enemy hero ${enemyName} not found in roster!\n`);
    allPassed = false;
    return;
  }

  const enemyNode = matrix[String(enemyHero.id)] || {};
  
  // Extract top 3 negative matchups (strongest counters to enemy, sorted descending by score)
  const datasetNegative = [...(enemyNode.strong_against || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Extract top 3 positive matchups (enemy is strong against them, sorted descending by score)
  const datasetPositive = [...(enemyNode.weak_against || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (datasetNegative.length < 3 || datasetPositive.length < 3) {
    console.log(`[FAIL] Not enough matchup data in dataset for ${enemyName}!\n`);
    allPassed = false;
    return;
  }

  // Print Dataset Negative Matchups
  console.log('Dataset Negative Matchups:');
  datasetNegative.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name} (-${item.score.toFixed(2)})`);
  });
  console.log();

  // Print Dataset Positive Matchups
  console.log('Dataset Positive Matchups:');
  datasetPositive.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name} (+${item.score.toFixed(2)})`);
  });
  console.log();

  // Run DraftEngine recommendations
  const recs = engine.getRecommendations([], [enemyHero], 'overall');

  // Fetch engine counter scores
  const negScores = datasetNegative.map(item => {
    const rec = recs.find(r => Number(r.hero.id) === Number(item.id));
    return { name: item.name, score: rec ? rec.counterScore : 0 };
  });

  const posScores = datasetPositive.map(item => {
    const rec = recs.find(r => Number(r.hero.id) === Number(item.id));
    return { name: item.name, score: rec ? rec.counterScore : 0 };
  });

  // Print Engine Counter Scores
  console.log('Engine Counter Scores:');
  negScores.forEach(item => {
    console.log(`${item.name} = ${item.score}`);
  });
  console.log();
  posScores.forEach(item => {
    console.log(`${item.name} = ${item.score}`);
  });
  console.log();

  // Validation Asserts
  let negRankedCorrectly = true;
  let posPenalizedCorrectly = true;
  let scoreScalingValid = true;

  // 1. Negative matchups ranked correctly (stronger negative matchup -> higher or equal counterScore)
  if (!(negScores[0].score >= negScores[1].score && negScores[1].score >= negScores[2].score)) {
    negRankedCorrectly = false;
  }

  // 2. Positive matchups penalized correctly (counterScore must be negative)
  posScores.forEach(item => {
    if (item.score >= 0) {
      posPenalizedCorrectly = false;
    }
  });

  // 3. Score scaling / matchup direction valid (negative matchups score higher than positive matchups)
  for (let i = 0; i < 3; i++) {
    if (negScores[i].score <= posScores[i].score) {
      scoreScalingValid = false;
    }
  }

  console.log('Validation Result:');
  if (negRankedCorrectly) {
    console.log('✓ Negative matchups ranked correctly');
  } else {
    console.log('❌ Negative matchups ranking contradiction!');
  }

  if (posPenalizedCorrectly) {
    console.log('✓ Positive matchups penalized correctly');
  } else {
    console.log('❌ Positive matchups not penalized (scores must be negative)!');
  }

  if (scoreScalingValid) {
    console.log('✓ Score scaling valid');
  } else {
    console.log('❌ Score scaling / matchup direction invalid!');
  }
  console.log();

  const testPassed = negRankedCorrectly && posPenalizedCorrectly && scoreScalingValid;
  if (testPassed) {
    console.log('PASS\n');
  } else {
    console.log('FAIL\n');
    allPassed = false;
  }
  console.log('======================================\n');
});

if (allPassed && auditPassed) {
  console.log('SYSTEM DIAGNOSTICS: ALL DYNAMIC SCENARIOS VERIFIED SUCCESSFULLY AGAINST OFFICIAL GMS DATASET!');
  process.exit(0);
} else {
  console.log('SYSTEM DIAGNOSTICS: DYNAMIC SCENARIO VALIDATION FAILED.');
  process.exit(1);
}
