import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import Bulletin from './pages/Bulletin';
import Board from './pages/Board';
import BibleSearch from './pages/BibleSearch';
import './App.css';

function App() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [activeTab, setActiveTab] = useState('bulletin');
  const [adminMode, setAdminMode] = useState(() => {
    return localStorage.getItem('adminMode') === 'true';
  });

  // 로그인 상태 변경 시 adminMode 동기화
  useEffect(() => {
    if (!isSignedIn) {
      setAdminMode(false);
      localStorage.setItem('adminMode', 'false');
    }
  }, [isSignedIn]);

  const handleAdminClick = () => {
    if (!isSignedIn) {
      openSignIn();
    } else {
      const next = !adminMode;
      setAdminMode(next);
      localStorage.setItem('adminMode', String(next));
    }
  };

  const isAdmin = isSignedIn && adminMode;

  return (
    <div className="App">
      {/* 상단 네비게이션 */}
      <nav className="tab-nav">
        <div className="tab-nav-inner">
          <span className="app-logo">용인중앙교회 쁄라 학생회</span>
          <div className="tab-nav-right">
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'bulletin' ? 'active' : ''}`}
                onClick={() => setActiveTab('bulletin')}
              >
                주보
              </button>
              <button
                className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
                onClick={() => setActiveTab('board')}
              >
                게시판
              </button>
              <button
                className={`tab-btn ${activeTab === 'bible' ? 'active' : ''}`}
                onClick={() => setActiveTab('bible')}
              >
                성경 검색
              </button>
            </div>
            <button
              className={`btn-admin-nav ${isAdmin ? 'active' : isSignedIn ? 'off' : ''}`}
              onClick={handleAdminClick}
            >
              {!isSignedIn ? '관리자' : isAdmin ? '관리자 ON' : '관리자 OFF'}
            </button>
          </div>
        </div>
      </nav>

      {/* 탭 콘텐츠 */}
      <main className="tab-content">
        <div style={{ display: activeTab === 'bulletin' ? 'block' : 'none' }}>
          <Bulletin isAdmin={isAdmin} />
        </div>
        <div style={{ display: activeTab === 'board' ? 'block' : 'none' }}>
          <Board isAdmin={isAdmin} />
        </div>
        <div style={{ display: activeTab === 'bible' ? 'block' : 'none' }}>
          <BibleSearch />
        </div>
      </main>
    </div>
  );
}

export default App;
