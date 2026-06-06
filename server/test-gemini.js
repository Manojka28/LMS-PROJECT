/**
 * ============================================================
 *  Gemini API – Standalone Diagnostic Test Script
 * ============================================================
 *  Tests multiple models and reports results in a table.
 *
 *  Usage:  node server/test-gemini.js
 * ============================================================
 */

import dotenv from 'dotenv';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';

dotenv.config();          // loads .env from project root

// ── helpers ─────────────────────────────────────────────────
const DIVIDER  = '─'.repeat(72);
const OK       = '✅';
const FAIL     = '❌';
const WARN     = '⚠️';

// ── models to test ──────────────────────────────────────────
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const TEST_PROMPT = 'Say "Hello" in one word.';

// ── 1.  Pre-flight checks ──────────────────────────────────
function preflight() {
  console.log('\n' + DIVIDER);
  console.log('  GEMINI API – DIAGNOSTIC TEST');
  console.log(DIVIDER + '\n');

  const apiKey = process.env.GEMINI_API_KEY;

  // Check key exists
  if (!apiKey) {
    console.log(`${FAIL}  GEMINI_API_KEY is NOT set in .env`);
    process.exit(1);
  }
  console.log(`${OK}  GEMINI_API_KEY is set  (length: ${apiKey.length})`);

  // Check key format
  const masked = apiKey.slice(0, 6) + '...' + apiKey.slice(-4);
  console.log(`   Key preview : ${masked}`);

  if (apiKey.startsWith('AIza')) {
    console.log(`${OK}  Key format looks like a standard Google AI Studio key (AIza...)`);
  } else if (apiKey.startsWith('AQ.') || apiKey.startsWith('AQ')) {
    console.log(`${WARN}  Key starts with "AQ." – this may be an OAuth token or Cloud IAM credential,`);
    console.log(`      NOT a Google AI Studio API key.`);
    console.log(`      Standard Gemini API keys begin with "AIza".`);
    console.log(`      → Go to https://aistudio.google.com/apikey to generate a proper key.`);
  } else {
    console.log(`${WARN}  Key format is unrecognised. Standard keys start with "AIza".`);
    console.log(`      → Verify at https://aistudio.google.com/apikey`);
  }

  // Check SDK version
  try {
    const req = createRequire(import.meta.url);
    const pkg = req('@google/genai/package.json');
    console.log(`${OK}  @google/genai SDK version: ${pkg.version}`);
  } catch {
    console.log(`   @google/genai SDK installed (version check skipped)`);
  }

  console.log('');
  return apiKey;
}

// ── 2.  Test a single model ─────────────────────────────────
async function testModel(ai, modelName) {
  const start = Date.now();
  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: TEST_PROMPT,
    });
    const elapsed = Date.now() - start;
    const text = result.text?.trim() ?? '(empty)';
    return { model: modelName, status: 'SUCCESS', response: text, error: null, ms: elapsed };
  } catch (err) {
    const elapsed = Date.now() - start;
    const code    = err.status ?? err.code ?? '???';
    const msg     = err.message ?? String(err);

    // Extract key details from error
    let shortError = `${code}: `;
    if (msg.includes('RESOURCE_EXHAUSTED'))       shortError += 'RESOURCE_EXHAUSTED (quota)';
    else if (msg.includes('PERMISSION_DENIED'))   shortError += 'PERMISSION_DENIED';
    else if (msg.includes('NOT_FOUND'))           shortError += 'MODEL NOT FOUND';
    else if (msg.includes('INVALID_ARGUMENT'))    shortError += 'INVALID_ARGUMENT';
    else if (msg.includes('UNAUTHENTICATED'))     shortError += 'UNAUTHENTICATED (bad key)';
    else                                          shortError += msg.slice(0, 80);

    return { model: modelName, status: 'FAILED', response: null, error: shortError, ms: elapsed };
  }
}

// ── 3.  Main ────────────────────────────────────────────────
async function main() {
  const apiKey = preflight();

  const ai = new GoogleGenAI({ apiKey });

  console.log(DIVIDER);
  console.log('  TESTING MODELS  (prompt: "' + TEST_PROMPT + '")');
  console.log(DIVIDER + '\n');

  const results = [];

  for (const model of MODELS) {
    process.stdout.write(`  Testing ${model} ... `);
    const result = await testModel(ai, model);
    console.log(result.status === 'SUCCESS' ? OK : FAIL);
    results.push(result);
  }

  // ── Results table ─────────────────────────────────────────
  console.log('\n' + DIVIDER);
  console.log('  RESULTS');
  console.log(DIVIDER + '\n');

  const colW = { model: 24, status: 10, time: 8, detail: 40 };
  const header = [
    'Model'.padEnd(colW.model),
    'Status'.padEnd(colW.status),
    'Time'.padEnd(colW.time),
    'Response / Error',
  ].join(' │ ');

  console.log('  ' + header);
  console.log('  ' + '─'.repeat(header.length));

  for (const r of results) {
    const detail = r.status === 'SUCCESS'
      ? (r.response ?? '').slice(0, colW.detail)
      : (r.error   ?? '').slice(0, colW.detail);
    const row = [
      r.model.padEnd(colW.model),
      (r.status === 'SUCCESS' ? `${OK} OK` : `${FAIL} FAIL`).padEnd(colW.status + 1),
      `${r.ms}ms`.padEnd(colW.time),
      detail,
    ].join(' │ ');
    console.log('  ' + row);
  }

  // ── Recommendation ────────────────────────────────────────
  const successes = results.filter(r => r.status === 'SUCCESS');
  const allFailed = successes.length === 0;

  console.log('\n' + DIVIDER);
  console.log('  RECOMMENDATION');
  console.log(DIVIDER + '\n');

  if (allFailed) {
    const allResourceExhausted = results.every(r => r.error?.includes('RESOURCE_EXHAUSTED') || r.error?.includes('quota'));
    const allUnauthenticated   = results.every(r => r.error?.includes('UNAUTHENTICATED') || r.error?.includes('bad key'));

    if (allUnauthenticated || results.some(r => r.error?.includes('UNAUTHENTICATED'))) {
      console.log(`  ${FAIL}  ALL models failed — likely an INVALID API KEY.\n`);
      console.log('  Action items:');
      console.log('  1. Go to https://aistudio.google.com/apikey');
      console.log('  2. Click "Create API key" → select or create a Google Cloud project.');
      console.log('  3. Copy the key (should start with "AIza...").');
      console.log('  4. Update your .env file:  GEMINI_API_KEY=AIzaSy...');
      console.log('  5. Restart the server and re-run this script.');
    } else if (allResourceExhausted) {
      console.log(`  ${FAIL}  ALL models returned RESOURCE_EXHAUSTED.\n`);
      console.log('  This means your Google Cloud project quota is zero.');
      console.log('  Most common fixes:');
      console.log('  1. Link a billing account to your GCP project (free tier still applies):');
      console.log('     → https://console.cloud.google.com/billing');
      console.log('  2. Generate a NEW API key in a new project:');
      console.log('     → https://aistudio.google.com/apikey');
      console.log('  3. Check your current quota:');
      console.log('     → https://console.cloud.google.com/iam-admin/quotas');
      console.log('     → Filter by: generativelanguage.googleapis.com');
      console.log('  4. If using the free tier, daily limits are very low — wait and retry.');
    } else {
      console.log(`  ${FAIL}  ALL models failed. See errors above.\n`);
      console.log('  Try generating a fresh API key at https://aistudio.google.com/apikey');
    }
  } else {
    const best = successes[0];
    console.log(`  ${OK}  Use model: "${best.model}"\n`);
    console.log(`  This model responded successfully in ${best.ms}ms.`);
    if (successes.length > 1) {
      console.log(`  Other working models: ${successes.slice(1).map(s => s.model).join(', ')}`);
    }
    console.log(`\n  → Update aiController.js to use "${best.model}" and proceed with AI Tutor.`);
  }

  console.log('\n' + DIVIDER + '\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
