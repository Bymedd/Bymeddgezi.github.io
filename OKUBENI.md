# YUKLE — GitHub'a yüklenecek tek klasör

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

Kökteki gezi sayfaları (`turkey.html`, `Ankara.html`, `assets/`, `dist/` ...)
bu klasörde yoktur, yani bu yüklemeyle bozulmaz.
