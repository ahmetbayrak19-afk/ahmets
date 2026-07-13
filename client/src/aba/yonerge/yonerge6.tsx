import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
}

const Yonerge6: React.FC = () => {
  const navigate = useNavigate();

  // === YENİ YÖNERGELER (23 tane) ===
  const allQuestions: Question[] = [
    { id: 1, text: "Sınıfa git" },
    { id: 2, text: "Öğretmen masasına git" },
    { id: 3, text: "Kapıya git" },
    { id: 4, text: "Pencere kenarına git" },
    { id: 5, text: "Kitap rafına git" },
    { id: 6, text: "Oyuncak köşesine git" },
    { id: 7, text: "Tahtanın yanına git" },
    { id: 8, text: "Koridora git" },
    { id: 9, text: "Lavaboya git" },
    { id: 10, text: "Bahçe kapısına git" },
    { id: 11, text: "Sandalyeye git" },
    { id: 12, text: "Dolaba git" },
    { id: 13, text: "Kitap köşesine git" },
    { id: 14, text: "Oyuncak rafına git" },
    { id: 15, text: "Pencere önüne git" },
    { id: 16, text: "Kapı kenarına git" },
    { id: 17, text: "Koridor ortasına git" },
    { id: 18, text: "Lavabo yanına git" },
    { id: 19, text: "Sınıf ortasına git" },
    { id: 20, text: "Öğretmen masası yanına git" },
    { id: 21, text: "Tahta önüne git" },
    { id: 22, text: "Sandalyenin yanına git" },
    { id: 23, text: "Dolap önüne git" },
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
        <h2>Yönerge 6 Tamamlandı</h2>
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
      <h2>Yönerge 6 - Değerlendirme</h2>
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

export default Yonerge6;
