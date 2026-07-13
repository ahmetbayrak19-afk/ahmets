import React, { useState } from 'react';

interface InstructionDef {
  text: string;
}

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

const Yonerge6: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(() => getRandomQuestion());
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<InstructionDef[]>([]);
  const [validCount, setValidCount] = useState(0); // Yeni: Sadece Biliyor + Bilmiyor sayılıyor
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  function getRandomQuestion(): InstructionDef {
    const randomIndex = Math.floor(Math.random() * INSTRUCTION_POOL.length);
    return INSTRUCTION_POOL[randomIndex];
  }

  const handleAnswer = (correct: boolean) => {
    setIsCorrect(correct);
    setAnsweredQuestions(prev => [...prev, currentQuestion]);

    if (correct) {
      setScore(prev => prev + 1);
    }

    const newValidCount = validCount + 1;
    setValidCount(newValidCount);

    if (newValidCount >= 10) {
      setTimeout(() => {
        setShowResult(true);
      }, 800);
    } else {
      setTimeout(() => {
        setCurrentQuestion(getRandomQuestion());
        setIsCorrect(null);
      }, 800);
    }
  };

  // === DÜZELTİLMİŞ GEÇ BUTONU ===
  const handlePass = () => {
    // Geç butonuna basıldığında hiçbir şey saymıyoruz
    // Sadece yeni soru getiriyoruz
    if (validCount < 10) {
      setCurrentQuestion(getRandomQuestion());
      setIsCorrect(null);
    } else {
      setShowResult(true);
    }
  };

  const finishTest = () => {
    setShowResult(true);
  };

  if (showResult) {
    const successRate = validCount > 0 ? score / validCount : 0;
    const isPassed = successRate >= 0.8;

    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Yönerge 6 Tamamlandı</h2>
        <p>Doğru Cevap: <strong>{score}</strong></p>
        <p>Geçerli Cevap Sayısı: <strong>{validCount}</strong></p>
        <p>Başarı Oranı: <strong>{(successRate * 100).toFixed(1)}%</strong></p>
        <p style={{ color: isPassed ? 'green' : 'red', fontWeight: 'bold' }}>
          {isPassed ? 'BAŞARILI' : 'BAŞARISIZ'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Yönerge 6 - Belirli Alana Gitme</h2>
      <p>Geçerli Cevap: <strong>{validCount} / 10</strong></p>

      <div style={{ 
        margin: '40px 0', 
        padding: '40px', 
        border: '2px solid #ddd', 
        borderRadius: '12px',
        fontSize: '28px',
        textAlign: 'center'
      }}>
        {currentQuestion.text}
      </div>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => handleAnswer(true)}
          style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#4ade80' }}
        >
          Biliyor
        </button>

        <button 
          onClick={() => handleAnswer(false)}
          style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#f87171' }}
        >
          Bilmiyor / Yanlış
        </button>

        <button 
          onClick={handlePass}
          style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#94a3b8' }}
        >
          Geç
        </button>
      </div>
    </div>
  );
};

export default Yonerge6;

      
