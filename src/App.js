import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import Bulletin from './pages/Bulletin';
import Board from './pages/Board';
import BibleSearch from './pages/BibleSearch';
import './App.css';

const TAB_COPY = {
  bulletin: {
    kicker: 'Weekly Bulletin',
    display: 'BEULAH',
    title: '',
    description:
      '언제나, 어떤 상황에서도 주님께 순종',
  },
  board: {
    kicker: 'Community Board',
    display: 'NOTICE',
    title: '',
    description:
      '',
  },
  bible: {
    kicker: 'Bible Search',
    display: 'BIBLE',
    title: '',
    description:
      '',
  },
};

function App() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [activeTab, setActiveTab] = useState('bulletin');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [adminMode, setAdminMode] = useState(() => localStorage.getItem('adminMode') === 'true');

  useEffect(() => {
    if (!isSignedIn) {
      setAdminMode(false);
      localStorage.setItem('adminMode', 'false');
    }
  }, [isSignedIn]);

  useEffect(() => {
    const updateScrollProgress = () => {
      const maxScroll = Math.max(window.innerHeight * 0.9, 1);
      const next = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(next);
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  const handleAdminClick = () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    const next = !adminMode;
    setAdminMode(next);
    localStorage.setItem('adminMode', String(next));
  };

  const isAdmin = isSignedIn && adminMode;
  const heroCopy = TAB_COPY[activeTab];

  return (
    <div
      className="App"
      style={{
        '--hero-weight': 420 + scrollProgress * 420,
        '--hero-width': 120 - scrollProgress * 28,
        '--hero-slant': scrollProgress * -8,
        '--hero-track': `${0.22 - scrollProgress * 0.16}em`,
        '--hero-shift': `${scrollProgress * 28}px`,
      }}
    >
      <nav className="tab-nav">
        <div className="tab-nav-inner">
          <span className="app-logo">Yong-In Choogang Church</span>
          <div className="tab-nav-right">
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'bulletin' ? 'active' : ''}`}
                onClick={() => setActiveTab('bulletin')}
                type="button"
              >
                주보
              </button>
              <button
                className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
                onClick={() => setActiveTab('board')}
                type="button"
              >
                게시판
              </button>
              <button
                className={`tab-btn ${activeTab === 'bible' ? 'active' : ''}`}
                onClick={() => setActiveTab('bible')}
                type="button"
              >
                성경 검색
              </button>
            </div>
            <button
              className={`btn-admin-nav ${isAdmin ? 'active' : isSignedIn ? 'off' : ''}`}
              onClick={handleAdminClick}
              type="button"
            >
              {!isSignedIn ? '관리자' : isAdmin ? '관리자 ON' : '관리자 OFF'}
            </button>
          </div>
        </div>
      </nav>

      <section className="type-hero">
        <div className="type-hero-inner">
          <p className="type-kicker">{heroCopy.kicker}</p>
          <div className="type-display" aria-hidden="true">
            {heroCopy.display}
          </div>
          <h1 className="type-headline">{heroCopy.title}</h1>
          <p className="type-description">{heroCopy.description}</p>
        </div>
      </section>

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
