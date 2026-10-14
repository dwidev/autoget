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

// Ambil value dari key, baik object tunggal maupun array of objects.
function extractValues(data, key) {
  const items = Array.isArray(data) ? data : [data];
  const values = [];

  items.forEach((item) => {
    if (item && typeof item === "object" && key in item) {
      values.push(item[key]);
    }
  });

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
