# autoget

Tool CLI untuk mengambil value dari sebuah key di file JSON, lalu menyimpannya
ke file `.txt` — **satu value per baris**. Tanpa dependency, cukup Node.js.

## Instalasi

Clone repo ini lalu install command-nya secara global:

```bash
git clone git@github.com:dwidev/autoget.git
cd autoget
npm install -g .
```

Setelah itu command `autoget` bisa dipanggil dari mana saja — tanpa perlu `node`.

> Untuk development, pakai `npm link` agar perubahan kode langsung aktif.

## Cara pakai

```bash
autoget data.json
```

Tool akan menanyakan key yang mau diambil dan nama file output:

```
Key yang mau diambil: name
Simpan ke file (default: result.txt):
✔ 3 value dari key "name" disimpan ke:
   /path/ke/result.txt
```

Kalau path file JSON tidak dikasih, tool akan menanyakannya:

```bash
autoget
```

## Nested key

Key boleh bersarang, pakai notasi **titik** atau **garis miring**:

```bash
autoget data.json
# → user.name
# → user/profile/city
# → user/tags/0/label
```

Aturan penelusuran:

- `a.b.c` dan `a/b/c` sama artinya.
- Kalau di tengah path ada **array**, semua elemennya ditelusuri
  (jadi semua value terdalam ikut terkumpul).
- Kalau bagian path berupa **angka**, itu dianggap indeks array
  (mis. `user.tags.0.label`).
- Item yang tidak punya path tersebut cukup dilewati.

## Contoh

`data.json`:

```json
[
  { "name": "Andi", "age": 22, "user": { "profile": { "city": "Jakarta" } } },
  { "name": "Budi", "age": 30, "user": { "profile": { "city": "Bandung" } } },
  { "name": "Citra", "age": 25, "user": { "profile": { "city": "Surabaya" } } }
]
```

| Key dimasukkan | Isi `result.txt` |
|---|---|
| `name` | `Andi` / `Budi` / `Citra` |
| `age` | `22` / `30` / `25` |
| `user.profile.city` | `Jakarta` / `Bandung` / `Surabaya` |

## Catatan

- Mendukung **array of objects** maupun **object tunggal**.
- Key yang tidak ada di sebagian item cukup dilewati.
- Value bertipe object/array akan diserialisasi jadi JSON dalam satu baris;
  value `null` menjadi baris kosong.
- Kalau key sama sekali tidak ditemukan, atau JSON invalid, tool berhenti dengan error.

## Struktur

```
index.js       # entry point / CLI
package.json
sample.json    # contoh data
```
