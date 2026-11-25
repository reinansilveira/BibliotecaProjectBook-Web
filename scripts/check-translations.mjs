import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/app/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const dictionaryFile = join(root, 'core/i18n/pt-br.ts');

const STRING = String.raw`'((?:\\.|[^'\\])*)'`;
const PATTERNS = [
  new RegExp(String.raw`${STRING}\s*\|\s*t\b`, 'g'),
  new RegExp(String.raw`\?\s*${STRING}\s*:\s*${STRING}\s*\)\s*\|\s*t\b`, 'g'),
  new RegExp(String.raw`\.t\(\s*${STRING}`, 'g'),
  new RegExp(String.raw`\.t\(\s*[^'()]*\?\s*${STRING}\s*:\s*${STRING}`, 'g'),
  new RegExp(String.raw`\.plural\([^,]+,\s*${STRING},\s*${STRING}`, 'g'),
  new RegExp(String.raw`\bheadline="([^"]+)"`, 'g'),
];

const SCOPED_PATTERNS = [
  { file: /\.routes\.ts$/, pattern: new RegExp(String.raw`\btitle:\s*${STRING}`, 'g') },
  {
    file: /(admin-shell|account-shell|catalog-page|admin-fines-page)\.ts$/,
    pattern: new RegExp(String.raw`\blabel:\s*${STRING}`, 'g'),
  },
];

const API_MESSAGES = [
  'Invalid email or password.',
  'Too many attempts. Please wait a moment and try again.',
  'A book that is on loan cannot be deleted.',
  'A book with this ISBN already exists.',
  'A member with this email already exists.',
  'Book not found.',
  'Loan not found.',
  'Member not found.',
  'No book was found for this ISBN on Open Library.',
  'No copies are available right now. Join the waiting list.',
  'This book is available right now. Borrow it instead of reserving it.',
  'You already have a reservation for this book.',
  'You are already borrowing this book.',
  'Only members who borrowed this book can review it.',
  'Overdue loans cannot be renewed. Return the book first.',
  'Other members are waiting for this book, so the loan cannot be renewed.',
  'Only active loans can be renewed.',
  'A loan can be renewed only 1 time.',
  'This loan has already been returned.',
  'This e-book is not available anymore.',
  'This e-book loan is no longer active.',
  'The reading link is invalid or has expired.',
  'This link is invalid or has expired.',
  'The current password is not correct.',
  'The new password must be different from the current one.',
  'This fine has already been settled.',
  'Return your overdue books before borrowing again.',
  'Pay your outstanding fines before borrowing again.',
  'You already have 3 active loans.',
  'One or more fields are invalid.',
  'An unexpected error occurred.',
  'Birth date must be in the past.',
  'The ISBN is not valid. Use 10 or 13 digits with a correct check digit.',
];

const GENRES = [
  'Adventure',
  'Epic',
  'Fantasy',
  'Gothic',
  'Historical',
  'Literary Fiction',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Poetry',
  'Drama',
  'Horror',
  'Philosophy',
  'Biography',
  'History',
  'Children',
];

const DYNAMIC_KEYS = [
  ...API_MESSAGES,
  ...GENRES,
  'Active',
  'Overdue',
  'Returned',
  'Expired',
  'Waiting',
  'Ready',
  'Fulfilled',
  'Cancelled',
  'Unpaid',
  'Paid',
  'Waived',
  'Withdrawn',
  'On loan',
  'Available',
  'Member',
  'Admin',
  '—',
  ...['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  '{count} day left',
  '{count} days left',
  '{count} day overdue',
  '{count} days overdue',
  'Due today',
  'Something went wrong. Please try again.',
  'Could not reach the server. Check your connection and try again.',
];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return files(path);
    }

    const isSource = /\.(html|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts');

    return isSource && path !== dictionaryFile ? [path] : [];
  });
}

function unescape(text) {
  return text.replace(/\\(.)/g, '$1');
}

function usedKeys() {
  const keys = new Map();

  for (const file of files(root)) {
    const source = readFileSync(file, 'utf8');

    const scoped = SCOPED_PATTERNS.filter((entry) => entry.file.test(file)).map(
      (entry) => entry.pattern,
    );

    for (const pattern of [...PATTERNS, ...scoped]) {
      for (const match of source.matchAll(pattern)) {
        match
          .slice(1)
          .filter((group) => group !== undefined)
          .forEach((group) => keys.set(unescape(group), file.slice(root.length)));
      }
    }
  }

  DYNAMIC_KEYS.forEach((key) => keys.set(key, 'dynamic'));

  return keys;
}

function dictionary() {
  const source = readFileSync(dictionaryFile, 'utf8');
  const entry =
    /\[\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*,\s*(['"])((?:\\.|(?!\3)[^\\])*)\3\s*,?\s*\]/g;

  return new Map(
    [...source.matchAll(entry)].map((match) => [unescape(match[2]), unescape(match[4])]),
  );
}

function placeholders(text) {
  return [...text.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');
}

const used = usedKeys();
const translations = dictionary();
const problems = [];

for (const [key, file] of used) {
  if (!/[A-Za-z]/.test(key)) {
    continue;
  }

  if (!translations.has(key)) {
    problems.push(`Missing pt-BR translation for "${key}" (${file})`);
    continue;
  }

  if (placeholders(key) !== placeholders(translations.get(key))) {
    problems.push(`Placeholders differ for "${key}"`);
  }
}

for (const key of translations.keys()) {
  if (!used.has(key)) {
    problems.push(`Unused pt-BR translation "${key}"`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} translation problem(s).`);
  process.exit(1);
}

console.log(`All ${used.size} texts have a pt-BR translation.`);
