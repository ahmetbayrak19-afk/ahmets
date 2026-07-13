import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
}

const Yonerge3: React.FC = () => {
  const navigate = useNavigate();

  // === YENİ YÖNERGELER (25 tane) ===
  const allQuestions: Question[] = [
    { id: 1, text: "Topu al ve masaya koy" },
    { id: 2, text: "Kitabı al ve rafa koy" },
    { id: 3, text: "Kalemi al ve çekmeceye koy" },
    { id: 4, text: "Oyuncağı al ve kutuya koy" },
    { id: 5, text: "Çantayı al ve masaya koy" },
    { id: 6, text: "Topu al ve sandalyeye koy" },
    { id: 7, text: "Kitabı al ve dolaba koy" },
    { id: 8, text: "Kalemi al ve masaya bırak" },
    { id: 9, text: "Oyuncağı al ve rafa koy" },
    { id: 10, text: "Çantayı aç ve kitabı içine koy" },
    { id: 11, text: "Topu al ve duvara at" },
    { id: 12, text: "Kitabı al ve masaya koy" },
    { id: 13, text: "Kalemi al ve çekmeceye bırak" },
    { id: 14, text: "Oyuncağı al ve kutuya bırak" },
    { id: 15, text: "Çantayı al ve rafa koy" },
    { id: 16, text: "Kalemi al ve kağıda yaz" },
    { id: 17, text: "Topu al ve yerine at" },
    { id: 18, text: "Kitabı al ve sayfayı çevir" },
    { id: 19, text: "Oyuncağı al ve rafa bırak" },
    { id: 20, text: "Çantayı aç ve kalemi içine koy" },
    { id: 21, text: "Aracı al ve it" },
    { id: 22, text: "Su bardağını al ve masaya koy" },
    { id: 23, text: "Kitabı al ve yerine koy" },
    { id: 24, text: "Topu al ve sandalyeye bırak" },
    { id: 25, text: "Kalemi al ve çekmeceye koy" },
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
        <h2>Yönerge 3 Tamamlandı</h2>
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
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Yönerge 3 - Değerlendirme</h2>
      <p style={{ fontSize: '18px' }}>
        Geçerli Cevap: <strong>{validCount} / 10</strong>
      </p>

      <div style={{ 
        margin: '40px 0', 
        padding: '40px', 
        border: '3px solid #ddd', 
        borderRadius: '16px',
        backgroundColor: '#f9fafb'
      }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>{currentQuestion.text}</h1>
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

export default Yonerge3;
