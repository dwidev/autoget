# autoget

Tool terminal Node.js untuk mengambil value dari sebuah key di file JSON,
lalu menyimpannya ke file `.txt` — satu value per baris.

## Cara pakai

```bash
node index.js <file.json>
```

Script akan menanyakan key yang mau diambil dan nama file output:

```
Path file JSON: data.json
Key yang mau diambil: name
Simpan ke file (default: result.txt):
✔ 3 value dari key "name" disimpan ke:
   /path/ke/result.txt
```

Path file JSON juga bisa langsung dikasih sebagai argumen:

```bash
node index.js data.json
```

## Contoh

`data.json`:

```json
[
  { "name": "Andi", "age": 22 },
  { "name": "Budi", "age": 30 },
  { "name": "Citra", "age": 25 }
]
```

Hasil `result.txt` saat key = `name`:

```
Andi
Budi
Citra
```

## Catatan

- Mendukung **array of objects** maupun **object tunggal**.
- Key yang tidak ada di sebagian item cukup dilewati (item tanpa key itu diabaikan).
- Value bertipe object/array akan diserialisasi jadi JSON dalam satu baris;
  value `null` menjadi baris kosong.
- Kalau key sama sekali tidak ditemukan, atau JSON invalid, tool berhenti dengan error.

## Struktur

```
index.js       # entry point / CLI
package.json
sample.json    # contoh data
```
