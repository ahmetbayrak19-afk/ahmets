import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
}

const Yonerge4: React.FC = () => {
  const navigate = useNavigate();

  // === YENİ YÖNERGELER (25 tane - Çok basamaklı) ===
  const allQuestions: Question[] = [
    { id: 1, text: "Bebek markete gitmek için hazırlanmalı. Hadi elbisesini bul ve bana ver giydirelim." },
    { id: 2, text: "Ayıcığı uyutmak istiyoruz. Yatağını hazırla, ayıcığı yatır ve üstünü ört." },
    { id: 3, text: "Arabayı yıkayalım. Kovayı doldur, arabayı ıslat ve sabunla." },
    { id: 4, text: "Masayı kur. Tabağı koy, kaşığı yanına koy ve bardağı doldur." },
    { id: 5, text: "Bebeği banyo yapalım. Suyu hazırla, bebeği soy ve sabunla." },
    { id: 6, text: "Oyuncakları toplayalım. Arabayı kutuya koy, topu rafa kaldır ve kitabı yerine koy." },
    { id: 7, text: "Pikniğe gideceğiz. Sepeti hazırla, meyveyi koy ve battaniyeyi katla." },
    { id: 8, text: "Bebeği giydirelim. Çorabını giydir, ayakkabısını tak ve hırkasını giydir." },
    { id: 9, text: "Yemeği hazırlayalım. Tabağı doldur, kaşığı ver ve suyu getir." },
    { id: 10, text: "Kitap okuyalım. Kitabı aç, resmi göster ve hikayeyi anlat." },
    { id: 11, text: "Aracı tamir edelim. Tekerleği tak, kapıyı kapat ve boyasını yap." },
    { id: 12, text: "Bebeği doktora götürelim. Çantasını al, bebeği kucağına al ve kapıyı aç." },
    { id: 13, text: "Yatağı yapalım. Çarşafı düzelt, yastığı koy ve battaniyeyi ser." },
    { id: 14, text: "Çiçekleri sulayalım. Kovayı doldur, çiçeğe git ve suyu dök." },
    { id: 15, text: "Oyuncağı tamir edelim. Parçayı bul, yerine tak ve boyasını yap." },
    { id: 16, text: "Bebeği besleyelim. Mama tabağını doldur, kaşığı al ve bebeğe ver." },
    { id: 17, text: "Aracı park edelim. Arabayı sür, park yerine getir ve motoru kapat." },
    { id: 18, text: "Kitapları yerleştir. Kitabı al, rafa koy ve sırayı düzelt." },
    { id: 19, text: "Bebeği gezmeye çıkaralım. Arabasını hazırla, bebeği oturt ve kapıyı aç." },
    { id: 20, text: "Yemeği bitirelim. Tabağı kaldır, bardağı koy ve masayı sil." },
    { id: 21, text: "Oyuncakları yerleştirelim. Topu kutuya koy, arabayı rafa kaldır ve bebeği yatağa yatır." },
    { id: 22, text: "Bebeği giydirelim. Elbisesini bul, giydir ve düğmelerini ilikle." },
    { id: 23, text: "Masayı toplayalım. Tabağı kaldır, kaşığı koy ve masayı sil." },
    { id: 24, text: "Aracı yıkayalım. Kovayı doldur, arabayı ıslat ve kurulayın." },
    { id: 25, text: "Bebeği uyutalım. Yatağını hazırla, bebeği yatır ve lambayı kapat." },
  ];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<'correct' | 'wrong' | 'unknown' | 'passed'>>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState<any>(null);

  // Rastgele 10 soru seç
  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 10));
  }, []);

  const currentQuestion = questions[currentIndex];

  // === GEÇ BUTONU ===
  const handlePass = () => {
    if (validCount < 10) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishTest();
    }
  };

  // === BİLİYOR / BİLMİYOR / YANLIŞ YAPTI BUTONLARI ===
  const handleAnswer = (type: 'correct' | 'wrong' | 'unknown') => {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);

    let newValidCount = validCount;
    let newCorrectCount = correctCount;

    if (type === 'correct' || type === 'unknown') {
      newValidCount = validCount + 1;
      setValidCount(newValidCount);

      if (type === 'correct') {
        newCorrectCount = correctCount + 1;
        setCorrectCount(newCorrectCount);
      }
    }

    if (newValidCount >= 10) {
      finishTest(newCorrectCount, newValidCount);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const finishTest = (finalCorrect?: number, finalValid?: number) => {
    const correct = finalCorrect ?? correctCount;
    const valid = finalValid ?? validCount;

    const successRate = valid > 0 ? correct / valid : 0;
    const isPassed = successRate >= 0.8;

    const scoreData = {
      correct,
      total: valid,
      successRate,
      isPassed,
    };

    setFinalScore(scoreData);
    setShowResult(true);

    // Firebase kaydetme (kendi fonksiyonunu buraya ekle)
    // handleSessionSave(correct, valid, isPassed);
  };

  if (questions.length === 0) {
    return <div>Yükleniyor...</div>;
  }

  // === SONUÇ EKRANI ===
  if (showResult && finalScore) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Yönerge 4 Tamamlandı</h2>
        <div style={{ margin: '30px 0', fontSize: '20px' }}>
          <p><strong>Doğru:</strong> {finalScore.correct}</p>
          <p><strong>Geçerli Cevap:</strong> {finalScore.total} / 10</p>
          <p><strong>Başarı Oranı:</strong> {(finalScore.successRate * 100).toFixed(1)}%</p>
          <p style={{ color: finalScore.isPassed ? 'green' : 'red', fontWeight: 'bold' }}>
            {finalScore.isPassed ? 'BAŞARILI ✓' : 'BAŞARISIZ ✗'}
          </p>
        </div>

        <button 
          onClick={() => navigate('/yonerge-takip')}
          style={{ padding: '12px 30px', fontSize: '18px', marginTop: '20px' }}
        >
          Yönerge Takip Sayfasına Dön
        </button>
      </div>
    );
  }

  // === TEST EKRANI ===
  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Yönerge 4 - Değerlendirme</h2>
      <p style={{ fontSize: '18px' }}>
        Geçerli Cevap: <strong>{validCount} / 10</strong>
      </p>

      <div style={{ 
        margin: '40px 0', 
        padding: '35px', 
        border: '3px solid #ddd', 
        borderRadius: '16px',
        backgroundColor: '#f9fafb',
        minHeight: '120px'
      }}>
        <h1 style={{ fontSize: '24px', margin: 0, lineHeight: '1.4' }}>{currentQuestion.text}</h1>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => handleAnswer('correct')}
          style={{ padding: '18px 35px', fontSize: '20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '10px' }}
        >
          Biliyor
        </button>

        <button 
          onClick={() => handleAnswer('unknown')}
          style={{ padding: '18px 35px', fontSize: '20px', backgroundColor: '#eab308', color: 'white', border: 'none', borderRadius: '10px' }}
        >
          Bilmiyor
        </button>

        <button 
          onClick={() => handleAnswer('wrong')}
          style={{ padding: '18px 35px', fontSize: '20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px' }}
        >
          Yanlış Yaptı
        </button>

        <button 
          onClick={handlePass}
          style={{ padding: '18px 35px', fontSize: '20px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '10px' }}
        >
          Geç
        </button>
      </div>

      <p style={{ marginTop: '30px', color: '#666', textAlign: 'center' }}>
        Soru {currentIndex + 1} — Toplam geçerli cevap: {validCount}/10
      </p>
    </div>
  );
};

export default Yonerge4;
