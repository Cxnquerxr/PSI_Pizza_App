import { useState } from 'react';
import { Kiosk } from './Kiosk';
import { Kds } from './Kds';
import './App.css';

function App() {
  const [view, setView] = useState<'kiosk' | 'kds'>('kiosk');

  return (
    <>
      {/* Simple View Switcher for demonstration purposes */}
      <div style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999 }}>
        <button 
          onClick={() => setView(view === 'kiosk' ? 'kds' : 'kiosk')}
          style={{ padding: '10px 20px', borderRadius: '20px', background: '#333', color: 'white', border: '2px solid white', cursor: 'pointer' }}
        >
          Switch to {view === 'kiosk' ? 'Kitchen Display' : 'Kiosk'}
        </button>
      </div>

      {view === 'kiosk' ? <Kiosk /> : <Kds />}
    </>
  );
}

export default App;


