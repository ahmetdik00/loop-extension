# YouTube Music Döngü Kontrolü

## Genel Bakış
YouTube Music Döngü Kontrolü, YouTube Music üzerinde belirli aralıkları döngüye almanızı sağlayan, modern tasarıma sahip bir Chrome uzantısıdır. Uzantı; kısayol tuşları, detaylı hata loglama, dinamik bildirimler ve kullanıcı dostu ayarlarla donatılmıştır.

## Özellikler
- **Segment Döngüleme:**  
  Belirlediğiniz başlangıç ve bitiş saniyeleri arasında döngü oluşturur.
- **Önizleme:**  
  Döngüye başlamadan önce seçilen segmenti 5 saniyelik önizleme yapar.
- **Kısayol Tuşları:**  
  - `Ctrl+Shift+L`: Döngüyü aç/kapat  
  - `Ctrl+Shift+P`: Önizleme yap
- **Modern Arayüz:**  
  Popup arayüzü, senkronize input ve slider'lar ile kolay ayar imkanı sunar. Snackbar bildirimleri sayesinde, butonların üzerine binen mesajlar yerine, alt kısımda kayan bildirimler gösterilir.
- **Dinamik Oynatıcı Takibi:**  
  YouTube Music oynatıcı elementindeki dinamik değişikliklere (yeniden yüklenme, yeniden oluşturma vb.) karşı MutationObserver ile sürekli kontrol sağlanır.
- **Detaylı Hata Loglama:**  
  Hem popup hem de içerik script’te meydana gelen hatalar zaman damgalı olarak loglanır.

## Kurulum
1. Bu repoyu klonlayın veya zip olarak indirin.
2. Chrome tarayıcınızda `chrome://extensions/` sayfasını açın.
3. Sağ üstte yer alan "Geliştirici Modu"nu aktif edin.
4. "Paketlenmemiş uzantıyı yükle" butonuna tıklayarak proje klasörünü seçin.
5. Uzantı yüklendikten sonra, YouTube Music üzerinde çalıştırarak test edebilirsiniz.

## Dosya Yapısı
- **manifest.json:**  
  Uzantı için gerekli izinler, arka plan scriptleri, content script'ler ve kısayol tanımlamaları burada bulunur.
- **popup.html & popup.js:**  
  Kullanıcı arayüzünü ve etkileşimleri yönetir. Ayarların kaydedilmesi, input-senkronizasyonu ve mesajlaşma burada ele alınır.
- **content.js:**  
  YouTube Music sayfasına enjekte edilir. Oynatıcıyı bulma, döngü işlevselliği, dinamik DOM değişikliklerine tepki verme ve mesaj alma işlemleri bu dosyada gerçekleştirilir.
- **background.js:**  
  Kısayol tuşlarını dinleyerek aktif sekmeye gerekli mesajları gönderir ve uzantının genel çalışmasını destekler.

## Kullanım
1. YouTube Music’i açın.
2. Uzantı ikonuna tıklayarak popup’ı açın.
3. Başlangıç ve bitiş saniyelerini ayarlayın (input veya slider ile).
4. **Döngüyü Aktif Et** butonuna tıklayarak döngüyü başlatın.
5. **Önizleme Yap** butonuyla 5 saniyelik önizleme gerçekleştirin.
6. **Döngüyü Kapat** butonuyla döngüyü sonlandırın.
7. Alternatif olarak, tanımlı kısayol tuşlarını kullanabilirsiniz:
   - `Ctrl+Shift+L`: Döngüyü aç/kapat
   - `Ctrl+Shift+P`: Önizleme yap

## Katkıda Bulunma
Katkılarınız bizim için değerlidir! Hata bildirimi, özellik talebi veya pull request’leriniz için lütfen [GitHub Issues](https://github.com/ahmetdik00/loop-extension/issues) üzerinden iletişime geçin. Projeye katkıda bulunmadan önce kod standartlarına uymanız rica olunur.

## Lisans
Bu proje MIT Lisansı altında lisanslanmıştır. Daha fazla bilgi için LICENSE dosyasına bakınız.
