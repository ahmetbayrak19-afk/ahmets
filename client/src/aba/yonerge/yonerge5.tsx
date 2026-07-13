import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
}

const Yonerge5: React.FC = () => {
  const navigate = useNavigate();

  // === YENİ YÖNERGELER (25 tane) ===
  const allQuestions: Question[] = [
    { id: 1, text: "Oyun oynarken birden 'Işığı kapat' dendi" },
    { id: 2, text: "Kitap okurken 'Kapıyı aç' dendi" },
    { id: 3, text: "Yemek yerken 'Kalemi masaya koy' dendi" },
    { id: 4, text: "Oyuncakla oynarken 'Bebeği yatağa yatır' dendi" },
    { id: 5, text: "Resim çizerken 'Topu rafa koy' dendi" },
    { id: 6, text: "Arabayla oynarken 'Işığı aç' dendi" },
    { id: 7, text: "Kitap karıştırırken 'Çantayı kapat' dendi" },
    { id: 8, text: "Top oynarken 'Kalemi al' dendi" },
    { id: 9, text: "Bebekle oynarken 'Masayı sil' dendi" },
    { id: 10, text: "Arabayla oynarken 'Kitabı yerine koy' dendi" },
    { id: 11, text: "Resim yaparken 'Oyuncağı kutuya koy' dendi" },
    { id: 12, text: "Yemek yerken 'Kapıyı kapat' dendi" },
    { id: 13, text: "Kitap okurken 'Işığı kapat' dendi" },
    { id: 14, text: "Oyuncakla oynarken 'Kalemi masaya bırak' dendi" },
    { id: 15, text: "Top oynarken 'Bebeği giydir' dendi" },
    { id: 16, text: "Resim çizerken 'Çantayı aç' dendi" },
    { id: 17, text: "Arabayla oynarken 'Kitabı al' dendi" },
    { id: 18, text: "Yemek yerken 'Işığı aç' dendi" },
    { id: 19, text: "Kitap karıştırırken 'Topu yere koy' dendi" },
    { id: 20, text: "Bebekle oynarken 'Masayı kur' dendi" },
    { id: 21, text: "Oyuncakla oynarken 'Kalemi ver' dendi" },
    { id: 22, text: "Top oynarken 'Kitabı rafa koy' dendi" },
    { id: 23, text: "Resim yaparken 'Oyuncağı al' dendi" },
    { id: 24, text: "Yemek yerken 'Kapıyı aç' dendi" },
    { id: 25, text: "Kitap okurken 'Işığı kapat' dendi" },
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
        <h2>Yönerge 5 Tamamlandı</h2>
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
      <h2>Yönerge 5 - Değerlendirme</h2>
      <p style={{ fontSize: '18px' }}>
        Geçerli Cevap: <strong>{validCount} / 10</strong>
      </p>

      <div style={{ 
        margin: '40px 0', 
        padding: '35px', 
        border: '3px solid #ddd', 
        borderRadius: '16px',
        backgroundColor: '#f9fafb',
        minHeight: '100px'
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

export default Yonerge5;
