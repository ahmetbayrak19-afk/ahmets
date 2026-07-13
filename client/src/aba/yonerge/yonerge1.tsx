import React, { useState } from 'react';

interface InstructionDef {
  text: string;
}

  const allQuestions: Question[] = [
    { id: 1, text: "Ayağa kalk" },
    { id: 2, text: "Zıpla" },
    { id: 3, text: "Etrafında dön" },
    { id: 4, text: "Yere yat" },
    { id: 5, text: "Otur / Yere otur" },
    { id: 6, text: "Ayaklarını yere vur" },
    { id: 7, text: "Kollarını kaldır" },
    { id: 8, text: "Bay bay yap" },
    { id: 9, text: "Ellerini çırp / Alkışla" },
    { id: 10, text: "Kollarını bağla" },
    { id: 11, text: "Gözlerini kapat" },
    { id: 12, text: "Ağzını aç" },
    { id: 13, text: "Karnını ovala" },
    { id: 14, text: "Burnuna dokun" },
    { id: 15, text: "Kafanı salla" },
    { id: 16, text: "Elini kaldır" },
    { id: 17, text: "Parmaklarını aç" },
    { id: 18, text: "Başını sağa sola çevir" },
    { id: 19, text: "Omuzlarını silk" },
    { id: 20, text: "Dizlerini bük" },
    { id: 21, text: "Eliyle selam ver" },
    { id: 22, text: "Ayağını yere vur" },
    { id: 23, text: "Ellerinle çember yap" },
    { id: 24, text: "Eliyle işaret et" },
    { id: 25, text: "Başını eğ" },
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




    
