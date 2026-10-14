#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

function logOk(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}

function logErr(msg) {
  console.error(`\x1b[31m✖\x1b[0m ${msg}`);
}

function fail(msg) {
  logErr(msg);
  process.exitCode = 1;
  throw new Error(msg);
}

// Baca input user lewat async iterator, aman untuk TTY maupun pipa.
function createPrompter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const lines = [];
  const waiters = [];
  let done = false;

  const iterator = rl[Symbol.asyncIterator]();

  async function pump() {
    while (!done) {
      const { value, done: finished } = await iterator.next();
      if (finished) {
        done = true;
        while (waiters.length) waiters.shift().resolve(null);
        break;
      }
      const line = value.trim();
      if (waiters.length) waiters.shift().resolve(line);
      else lines.push(line);
    }
  }
  pump();

  function nextLine() {
    if (lines.length) return Promise.resolve(lines.shift());
    if (done) return Promise.resolve(null);
    return new Promise((resolve) => waiters.push({ resolve }));
  }

  async function ask(question) {
    process.stdout.write(question);
    const answer = await nextLine();
    if (answer === null) throw new Error("Input berhenti (stdin EOF).");
    return answer;
  }

  return { ask, close: () => rl.close() };
}

// Pisah key jadi bagian-bagian path. Dukung "a.b.c" dan "a/b/c",
// plus indeks array angka ("items.0.name").
function parseKeyParts(key) {
  return key
    .split(/[./]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

// Telusuri satu path ke dalam data. Array di tengah path akan ditelusuri
// ke SEMUA elemennya, kecuali head-nya angka (indeks array eksplisit).
function walk(node, parts) {
  // Path habis — node ini adalah value yang dicari.
  if (parts.length === 0) return [node];

  const [head, ...rest] = parts;

  // Array: kalau head angka, ambil indeks itu; kalau bukan, telusuri semua.
  if (Array.isArray(node)) {
    if (/^\d+$/.test(head)) {
      const index = Number(head);
      return index < node.length ? walk(node[index], rest) : [];
    }
    const results = [];
    node.forEach((item) => results.push(...walk(item, parts)));
    return results;
  }

  if (node === null || typeof node !== "object") return [];

  if (head in node) {
    return walk(node[head], rest);
  }

  return [];
}

// Ambil semua value untuk sebuah key, baik top-level maupun nested.
function extractValues(data, key) {
  const parts = parseKeyParts(key);

  // Coba sebagai path relatif dari tiap item (data array / object tunggal).
  const items = Array.isArray(data) ? data : [data];
  let values = [];
  items.forEach((item) => values.push(...walk(item, parts)));

  return values;
}

// Ubah value jadi teks satu baris (object/array di-serialize ke JSON).
function stringifyValue(value) {
  if (value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function main() {
  const prompter = createPrompter();
  const { ask } = prompter;

  try {
    const jsonPath = process.argv[2] || (await ask("Path file JSON: "));

    const absJsonPath = path.resolve(process.cwd(), jsonPath);

    if (!fs.existsSync(absJsonPath)) {
      fail(`File JSON tidak ditemukan: ${absJsonPath}`);
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(absJsonPath, "utf8"));
    } catch (err) {
      fail(`Gagal parse JSON: ${err.message}`);
    }

    const key = await ask("Key yang mau diambil: ");
    if (!key) {
      fail("Key tidak boleh kosong.");
    }

    const values = extractValues(data, key);
    if (values.length === 0) {
      fail(`Key "${key}" tidak ditemukan di JSON.`);
    }

    const outName = await ask("Simpan ke file (default: result.txt): ");
    const txtPath = path.resolve(process.cwd(), outName || "result.txt");

    fs.writeFileSync(
      txtPath,
      values.map(stringifyValue).join("\n") + "\n",
      "utf8"
    );

    logOk(`${values.length} value dari key "${key}" disimpan ke:`);
    console.log(`   ${txtPath}`);
  } finally {
    prompter.close();
  }
}

main().catch((err) => {
  // Pesan sudah dicetak oleh fail(); sisanya cukup set exit code.
  if (process.exitCode !== 1) logErr(err.message);
  process.exitCode = 1;
});
