# APK Oluşturma Talimatları

Bu belge, Kazanım Takip uygulamasını Android APK olarak paketlemeyi açıklar.

## Gereksinimler

1. **Android Studio** - https://developer.android.com/studio adresinden indirin
2. **Java JDK 17+** - Android Studio ile birlikte gelir
3. **Node.js** - Mevcut proje dosyalarını çalıştırmak için

## Adımlar

### 1. Proje Dosyalarını İndirin

Replit'ten tüm proje dosyalarını ZIP olarak indirin (sol üstteki üç nokta menüsünden "Download as ZIP").

### 2. Bilgisayarınızda Projeyi Hazırlayın

```bash
# ZIP'i açın ve proje klasörüne gidin
cd proje-klasoru

# Bağımlılıkları yükleyin
npm install

# Web uygulamasını derleyin
npm run build

# Android'i senkronize edin
npx cap sync android
```

### 3. Android Studio'da Açın

```bash
# Android projesini Android Studio'da açın
npx cap open android
```

Veya doğrudan Android Studio'yu açıp `android` klasörünü seçin.

### 4. APK Oluşturun

Android Studio'da:

1. **Build** menüsüne tıklayın
2. **Build Bundle(s) / APK(s)** → **Build APK(s)** seçin
3. Derleme tamamlandığında "locate" linkine tıklayarak APK dosyasını bulun

APK dosyası şurada olacak:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. İmzalı APK (Play Store için)

Play Store'a yüklemek için imzalı APK gerekir:

1. **Build** → **Generate Signed Bundle / APK**
2. **APK** seçin
3. Yeni bir keystore oluşturun veya mevcut olanı kullanın
4. **release** seçin
5. Oluştur

## API Adresi Ayarları

Uygulama şu anda localhost'a bağlanıyor. Production için:

1. `client/src/lib/api.ts` dosyasını açın
2. API_BASE sabitini production sunucu adresinizle değiştirin:

```typescript
const API_BASE = 'https://your-production-server.com/api';
```

3. Tekrar derleyin ve sync yapın

## Sorun Giderme

### "SDK not found" hatası
Android Studio'da SDK Manager'dan gerekli SDK'ları indirin.

### Build hataları
`android/app/build.gradle` dosyasındaki compileSdkVersion ve targetSdkVersion değerlerinin güncel olduğundan emin olun.

### Uygulama beyaz ekranda kalıyor
API adresinin doğru olduğundan ve sunucunun çalıştığından emin olun.

## Ek Bilgiler

- **App ID**: com.kazanimtakip.app
- **App Adı**: Kazanım Takip
- **Minimum Android Sürümü**: Android 5.0 (API 21)

Daha fazla bilgi için Capacitor belgelerine bakın: https://capacitorjs.com/docs/android
