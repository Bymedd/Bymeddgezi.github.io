# dist — GitHub'a yüklenecek tek klasör

Bu klasörün içeriği, depo kökünün birebir aynasıdır:

| Burada | GitHub'da |
|---|---|
| `netlify.toml` | `netlify.toml` (kök) |
| `package.json` | `package.json` (kök) |
| `netlify/functions/` | `netlify/functions/` |
| `haber/` | `haber/` |

## Nasıl yüklenir

GitHub'da depo ana sayfasına (kök dizin) gir → **Add file → Upload files** →
bu klasörün içindeki 4 öğeyi (`netlify` klasörü, `haber` klasörü,
`netlify.toml`, `package.json`) birlikte sürükle → **Commit changes**.

Var olan dosyaların üzerine yazar; silmen gereken bir şey yok.

## Neye dokunmaz

Aynı klasördeki gezi sayfaları (`index.html`, `Ankara.html`, `assets/`, `images/` ...)
yükleme listesinde değildir; bu 4 öğe sadece `netlify/`, `netlify.toml`,
`package.json` ve `haber/` yüklenir.
