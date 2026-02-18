import { useState } from 'react';
import Bulletin from './pages/Bulletin';
import Board from './pages/Board';
import './App.css';

const ADMIN_PASSWORD = 'church1234'; // 나중에 서버 인증으로 교체

function App() {
  const [activeTab, setActiveTab] = useState('bulletin');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminClick = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowLoginModal(true);
      setPassword('');
      setLoginError('');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleModalClose = () => {
    setShowLoginModal(false);
    setPassword('');
    setLoginError('');
  };

  return (
    <div className="App">
      {/* 상단 네비게이션 */}
      <nav className="tab-nav">
        <div className="tab-nav-inner">
          <span className="app-logo">✝ 교회 웹앱</span>
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
            </div>
            <button
              className={`btn-admin-nav ${isAdmin ? 'active' : ''}`}
              onClick={handleAdminClick}
            >
              {isAdmin ? '관리자 ON' : '관리자'}
            </button>
          </div>
        </div>
      </nav>

      {/* 관리자 로그인 모달 */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">관리자 인증</h3>
            <p className="modal-desc">관리자 비밀번호를 입력하세요.</p>
            <form onSubmit={handleLogin}>
              <input
                className="modal-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                autoFocus
              />
              {loginError && <p className="modal-error">{loginError}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={handleModalClose}>
                  취소
                </button>
                <button type="submit" className="modal-btn-confirm">
                  로그인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 탭 콘텐츠 */}
      <main className="tab-content">
        {activeTab === 'bulletin' && <Bulletin isAdmin={isAdmin} />}
        {activeTab === 'board' && <Board />}
      </main>
    </div>
  );
}

export default App;
