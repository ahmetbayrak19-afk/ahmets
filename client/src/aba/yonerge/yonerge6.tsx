import React, { useState } from 'react';

interface InstructionDef {
  text: string;
}

const INSTRUCTION_POOL: InstructionDef[] = [
  { text: "Sınıfa git" },
  { text: "Öğretmen masasına git" },
  { text: "Kapıya git" },
  { text: "Pencere kenarına git" },
  { text: "Kitap rafına git" },
  { text: "Oyuncak köşesine git" },
  { text: "Tahtanın yanına git" },
  { text: "Koridora git" },
  { text: "Lavaboya git" },
  { text: "Bahçe kapısına git" },
  { text: "Sandalyeye git" },
  { text: "Dolaba git" },
  { text: "Kitap köşesine git" },
  { text: "Oyuncak rafına git" },
  { text: "Pencere önüne git" },
  { text: "Kapı kenarına git" },
  { text: "Koridor ortasına git" },
  { text: "Lavabo yanına git" },
  { text: "Sınıf ortasına git" },
  { text: "Öğretmen masası yanına git" },
  { text: "Tahta önüne git" },
  { text: "Sandalyenin yanına git" },
  { text: "Dolap önüne git" },
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
