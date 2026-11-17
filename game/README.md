# Oyunu yerelde açma

1. Bir üst klasördeki `OYUNU_BASLAT.cmd` dosyasını çalıştır.
2. İlk çalıştırmada paketler internetten kurulur ve derleme kontrol edilir.
3. Tarayıcı otomatik açılır. Açılmazsa http://localhost:5173 adresine git.
4. Sunucu penceresini açık tut. Durdurmak için Ctrl+C kullan.

`index.html` kaynak dosyasını çift tıklayarak açmak oyunu başlatmaz.
GitHub Pages için kaynak proje yerine `npm run build` ile hazırlanan `dist/` çıktısı yayınlanacak.

## Geliştirici komutları

- `npm install`: bağımlılıkları kur.
- `npm run dev`: yerel geliştirme sunucusu.
- `npm run build`: TypeScript kontrolü ve yayın çıktısı.

## Mevcut doğrulama sınırı

17 Kasım 2026: Paket kurulumu bu çalışma ortamında `registry.npmjs.org` için ENOTFOUND hatasıyla durdu. Çevrim dışı paket önbelleği de yeterli değil. Derleme ve oynanış henüz doğrulanmadı.
