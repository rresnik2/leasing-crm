#!/usr/bin/env node
// Backs up the leasing CRM's Firestore and replaces its data with a fresh demo
// dataset dated relative to the moment the script runs.
//
//   node scripts/seed-demo-data.js                      dry run: counts, summary, writes nothing
//   node scripts/seed-demo-data.js --write              back up, wipe, write the demo dataset
//   node scripts/seed-demo-data.js --restore <file>     back up, wipe, write a backup back
//
// Backups go to backups/firestore-backup-<timestamp>.json (git-ignored).

import fs from 'node:fs';
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  terminate,
  writeBatch,
} from 'firebase/firestore';

const BATCH_LIMIT = 450;
const BACKUP_VERSION = 1;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP_DIR = path.join(ROOT, 'backups');

// src/** imports omit file extensions; teach Node to resolve them, then load
// the app modules dynamically (static imports would run before the hook exists).
register('./resolveExtensions.js', import.meta.url);
const { db } = await import('../src/firebase.js');
const { buildDemoData } = await import('./demoData.js');
const { groupFollowUps } = await import('../src/utils/followUp.js');

const USAGE = `Usage:
  node scripts/seed-demo-data.js                    Dry run: show counts and a summary, write nothing
  node scripts/seed-demo-data.js --write            Back up everything, then replace it with the demo dataset
  node scripts/seed-demo-data.js --restore <file>   Back up everything, then restore documents from a backup file`;

class UsageError extends Error {}

function parseArgs(argv) {
  const args = { mode: 'dry-run', file: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') {
      if (args.mode !== 'dry-run') throw new UsageError('Use only one of --write and --restore.');
      args.mode = 'write';
    } else if (arg === '--restore') {
      if (args.mode !== 'dry-run') throw new UsageError('Use only one of --write and --restore.');
      args.mode = 'restore';
      args.file = argv[i + 1];
      if (!args.file || args.file.startsWith('--')) throw new UsageError('--restore needs a backup file path.');
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.mode = 'help';
    } else {
      throw new UsageError(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Reading and backing up

// Firestore values -> JSON. Timestamps are kept exact; anything else exotic
// (references, geo points, bytes) is refused so a backup is never lossy.
function encodeValue(value, where) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map((item, i) => encodeValue(item, `${where}[${i}]`));
  if (value instanceof Timestamp) return { __type: 'timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
  if (Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item, `${where}.${key}`)]));
  }
  throw new Error(`Cannot back up unsupported value at ${where}`);
}

function decodeValue(value) {
  if (Array.isArray(value)) return value.map(decodeValue);
  if (value && typeof value === 'object') {
    if (value.__type === 'timestamp') return new Timestamp(value.seconds, value.nanoseconds);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decodeValue(item)]));
  }
  return value;
}

const readDocs = async (ref, where) =>
  (await getDocs(ref)).docs.map((d) => ({ id: d.id, data: encodeValue(d.data(), `${where}/${d.id}`) }));

// Every lead (with activities and tasks) and every tour, ids preserved.
async function readEverything() {
  const leadDocs = await readDocs(collection(db, 'leads'), 'leads');
  const leads = [];
  for (const lead of leadDocs) {
    leads.push({
      ...lead,
      activities: await readDocs(collection(db, 'leads', lead.id, 'activities'), `leads/${lead.id}/activities`),
      tasks: await readDocs(collection(db, 'leads', lead.id, 'tasks'), `leads/${lead.id}/tasks`),
    });
  }
  const tours = await readDocs(collection(db, 'tours'), 'tours');
  return { leads, tours };
}

const countsOf = ({ leads, tours }) => ({
  leads: leads.length,
  activities: leads.reduce((sum, l) => sum + l.activities.length, 0),
  tasks: leads.reduce((sum, l) => sum + l.tasks.length, 0),
  tours: tours.length,
});

const formatCounts = (c) => `${c.leads} leads, ${c.activities} activities, ${c.tasks} tasks, ${c.tours} tours`;

// Writes the backup and re-reads it from disk to make sure it is complete.
function writeBackup(snapshot, now) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const file = path.join(BACKUP_DIR, `firestore-backup-${stamp}.json`);
  const counts = countsOf(snapshot);
  const contents = { version: BACKUP_VERSION, createdAt: now.toISOString(), counts, ...snapshot };
  fs.writeFileSync(file, JSON.stringify(contents, null, 2), { flag: 'wx' });

  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (JSON.stringify(countsOf(saved)) !== JSON.stringify(counts)) {
    throw new Error(`Backup verification failed for ${file}`);
  }
  return file;
}

function loadBackupFile(file) {
  const resolved = path.resolve(file);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read backup ${resolved}: ${error.message}`);
  }
  const isDoc = (d) => d && typeof d.id === 'string' && d.id && d.data && typeof d.data === 'object';
  const valid =
    parsed.version === BACKUP_VERSION &&
    Array.isArray(parsed.leads) &&
    Array.isArray(parsed.tours) &&
    parsed.tours.every(isDoc) &&
    parsed.leads.every((l) => isDoc(l) && Array.isArray(l.activities) && Array.isArray(l.tasks) && l.activities.every(isDoc) && l.tasks.every(isDoc));
  if (!valid) throw new Error(`${resolved} is not a backup written by this script`);
  return { resolved, snapshot: { leads: parsed.leads, tours: parsed.tours } };
}

// ---------------------------------------------------------------------------
// Writing

// operations: [{ type: 'set' | 'delete', ref, data? }], committed in batches of at most 450.
async function commit(operations, label) {
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    operations.slice(i, i + BATCH_LIMIT).forEach((op) => {
      if (op.type === 'delete') batch.delete(op.ref);
      else batch.set(op.ref, op.data);
    });
    await batch.commit();
  }
  console.log(`  ${label}: ${operations.length} operations`);
}

// every document in the snapshot, as operations
function documentOps(snapshot, makeOp) {
  const tours = snapshot.tours.map((t) => makeOp(doc(db, 'tours', t.id), t.data));
  const activities = snapshot.leads.flatMap((l) =>
    l.activities.map((a) => makeOp(doc(db, 'leads', l.id, 'activities', a.id), a.data))
  );
  const tasks = snapshot.leads.flatMap((l) => l.tasks.map((t) => makeOp(doc(db, 'leads', l.id, 'tasks', t.id), t.data)));
  const leads = snapshot.leads.map((l) => makeOp(doc(db, 'leads', l.id), l.data));
  return { tours, activities, tasks, leads };
}

// Deletes tours, then every lead's activities and tasks, then the leads (the ones in `snapshot`).
async function wipe(snapshot) {
  const ops = documentOps(snapshot, (ref) => ({ type: 'delete', ref }));
  console.log('Deleting existing data:');
  await commit(ops.tours, 'tours');
  await commit([...ops.activities, ...ops.tasks], 'activities and tasks');
  await commit(ops.leads, 'leads');
}

// Writes leads (with activities and tasks) and tours; every `data` is passed through `convert`.
async function writeSnapshot(snapshot, convert) {
  const ops = documentOps(snapshot, (ref, data) => ({ type: 'set', ref, data: convert(data) }));
  console.log('Writing new data:');
  await commit(ops.leads, 'leads');
  await commit([...ops.activities, ...ops.tasks], 'activities and tasks');
  await commit(ops.tours, 'tours');
}

// ---------------------------------------------------------------------------
// Summaries

const dayLabel = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

function printSummary(dataset, now) {
  console.log(`\nDemo dataset dated relative to ${now.toString()}`);
  const toCounts = (data) => ({
    leads: data.leads.length,
    activities: data.leads.reduce((sum, l) => sum + l.activities.length, 0),
    tasks: data.leads.reduce((sum, l) => sum + l.tasks.length, 0),
    tours: data.tours.length,
  });
  console.log(`  ${formatCounts(toCounts(dataset))}`);

  console.log('\nLeads per status:');
  const byStatus = {};
  dataset.leads.forEach((l) => {
    byStatus[l.data.status] = (byStatus[l.data.status] ?? 0) + 1;
  });
  Object.entries(byStatus).forEach(([status, n]) => console.log(`  ${status.padEnd(22)} ${n}`));

  console.log('\nTours per day:');
  const days = new Map();
  [...dataset.tours]
    .sort((a, b) => a.data.start.localeCompare(b.data.start))
    .forEach((t) => {
      const [date, time] = t.data.start.split('T');
      if (!days.has(date)) days.set(date, []);
      days.get(date).push(`${time} ${t.data.leadName} (${t.data.status})`);
    });
  days.forEach((tours, date) => {
    const [y, m, d] = date.split('-').map(Number);
    console.log(`  ${dayLabel(new Date(y, m - 1, d))}: ${tours.join('; ')}`);
  });

  console.log('\nFollow-ups on the Today page:');
  const groups = groupFollowUps(dataset.leads.map((l) => ({ id: l.id, ...l.data })), now);
  console.log(`  due now or overdue: ${groups.dueNow.length}`);
  console.log(`  later today:        ${groups.laterToday.length}`);
  console.log(`  upcoming:           ${groups.upcoming.length}`);
}

// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === 'help') {
    console.log(USAGE);
    return;
  }

  const now = new Date();
  // Firestore auto-ids, generated locally without a network call
  const makeId = () => doc(collection(db, 'leads')).id;

  // validate inputs before reading or touching anything
  const restoreFrom = args.mode === 'restore' ? loadBackupFile(args.file) : null;
  const dataset = args.mode === 'restore' ? null : buildDemoData(now, makeId);

  console.log('Reading current Firestore data...');
  const current = await readEverything();
  console.log(`Current data: ${formatCounts(countsOf(current))}`);

  if (args.mode === 'dry-run') {
    printSummary(dataset, now);
    console.log('\nDry run only: nothing was written. Run with --write to back up and replace the data.');
    return;
  }

  // 1. back up everything; abort before touching anything if that fails
  const backupPath = writeBackup(current, now);
  console.log(`Backup written: ${backupPath}`);

  // 2. wipe, 3. write
  try {
    await wipe(current);
    if (restoreFrom) {
      console.log(`Restoring ${restoreFrom.resolved}: ${formatCounts(countsOf(restoreFrom.snapshot))}`);
      await writeSnapshot(restoreFrom.snapshot, decodeValue);
    } else {
      await writeSnapshot(dataset, (data) => data);
    }
  } catch (error) {
    console.error(`\nFailed part way through. Firestore may be partly wiped or written.`);
    console.error(`Your data is in ${backupPath}; restore it with:`);
    console.error(`  node scripts/seed-demo-data.js --restore "${backupPath}"`);
    throw error;
  }

  // 4. report
  const after = countsOf(await readEverything());
  console.log(`\nDone. Firestore now has: ${formatCounts(after)}`);
  if (dataset) printSummary(dataset, now);
  console.log(`\nBackup of the previous data: ${backupPath}`);
}

try {
  await main();
} catch (error) {
  console.error(`\nError: ${error.message}`);
  if (error instanceof UsageError) console.error(`\n${USAGE}`);
  process.exitCode = 1;
} finally {
  await terminate(db);
}
