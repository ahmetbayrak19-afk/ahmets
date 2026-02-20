import React from 'react';

export default function EslemeGame() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'blue', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 9999 
    }}>
      <h1 style={{ fontSize: '24px' }}>BEYAZ EKRAN ÇÖZÜLDÜ!</h1>
      <p style={{ opacity: 0.7 }}>React ve Vite şu an düzgün çalışıyor.</p>
      <div style={{ marginTop: '20px', fontSize: '12px' }}>
         Dizin: client/src/aba/esle/game/
      </div>
    </div>
  );
}
