# Yonerge8 Tutorial Entegrasyonu

`Yonerge8Tutorial.tsx` zaten push edildi (Atla + adım adım 4 etkileşim).

## yonerge8.tsx — 3 satırlık entegrasyon

### 1. Import (confetti satırından hemen sonra)
```tsx
import Yonerge8Tutorial from './Yonerge8Tutorial';
```

### 2. State (component içinde, ilk useState’lerden önce)
```tsx
const [showTut, setShowTut] = useState(true);
```

### 3. Early return (displayImg fonksiyonundan sonra, ana `return (` öncesi)
```tsx
if (showTut) {
  return (
    <Yonerge8Tutorial
      onDone={() => setShowTut(false)}
      onClose={onClose}
    />
  );
}
```

## Tutorial akışı
1. **Salla** — sadece marakas, büyük, `nesneyisalla.mp3`
2. **Sürükle** — top → sepet, `nesneyisurukle.mp3`
3. **Dokun** — elma, `nesneyedokun.mp3`
4. **Birkaç kez dokun** — yumurta 3 kez, kırılma sesleri

- **Atla**: mevcut adımı atlar (son adımda hazırlığa geçer)
- **X**: tamamen kapatır (`onClose`)
- 4 adım bitince veya son Atla → `onDone` → hazırlık ekranı
