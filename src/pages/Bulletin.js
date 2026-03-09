import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import './Bulletin.css';
import bibleData from '../data/bible.json';

const bibleBooks = [...(bibleData['구약'] || []), ...(bibleData['신약'] || [])];

const defaultScriptureRef = {
  book: '창세기',
  startChapter: '1',
  startVerse: '1',
  endChapter: '1',
  endVerse: '1',
};

const getBookByName = (name) => bibleBooks.find((book) => book.name === name) || bibleBooks[0];
const getChapters = (book) => Object.keys((book && book.chapters) || {});
const getVerses = (book, chapter) => Object.keys((book && book.chapters && book.chapters[chapter]) || {});

const parseScriptureRef = (text) => {
  if (!text) return { ...defaultScriptureRef };
  const trimmed = text.trim();
  const matchedBook = bibleBooks.find((book) => trimmed.startsWith(book.name));
  if (!matchedBook) return { ...defaultScriptureRef };
  const rest = trimmed.slice(matchedBook.name.length).trim();
  const match = rest.match(/(\d+)\s*:\s*(\d+)\s*-\s*(\d+)\s*:\s*(\d+)/);
  if (!match) return { ...defaultScriptureRef, book: matchedBook.name };

  return {
    book: matchedBook.name,
    startChapter: match[1],
    startVerse: match[2],
    endChapter: match[3],
    endVerse: match[4],
  };
};

const comparePosition = (aChapter, aVerse, bChapter, bVerse) => {
  const aC = Number(aChapter);
  const aV = Number(aVerse);
  const bC = Number(bChapter);
  const bV = Number(bVerse);
  if (aC !== bC) return aC - bC;
  return aV - bV;
};

const collectPassage = (ref) => {
  if (!ref || !ref.book) return [];
  const book = getBookByName(ref.book);
  if (!book) return [];

  const chapters = getChapters(book).map(Number).sort((a, b) => a - b);
  const startC = Number(ref.startChapter);
  const endC = Number(ref.endChapter);
  const startV = Number(ref.startVerse);
  const endV = Number(ref.endVerse);
  const lines = [];

  for (const chapter of chapters) {
    if (chapter < startC || chapter > endC) continue;
    const chapterKey = String(chapter);
    const verseKeys = getVerses(book, chapterKey).map(Number).sort((a, b) => a - b);

    for (const verse of verseKeys) {
      const isBeforeStart = comparePosition(chapter, verse, startC, startV) < 0;
      const isAfterEnd = comparePosition(chapter, verse, endC, endV) > 0;
      if (isBeforeStart || isAfterEnd) continue;
      lines.push(`${chapter}:${verse} ${book.chapters[chapterKey][String(verse)]}`);
    }
  }

  return lines;
};

const defaultData = {
  churchName: '중앙교회',
  date: '2026년 2월 15일 주일',
  worshipTitle: '주일 예배',
  sermonTitle: '믿음으로 걸어가는 길',
  scripture: '히브리서 11:1-6',
  scriptureRef: { ...defaultScriptureRef },
  pastor: '김목사',
  orderOfWorship: [
    { order: 1, item: '예배로 부름', detail: '사회자' },
    { order: 2, item: '찬송', detail: '찬송가 21장' },
    { order: 3, item: '기도', detail: '대표기도 집사' },
    { order: 4, item: '성경봉독', detail: '히브리서 11:1-6' },
    { order: 5, item: '찬양', detail: '찬양대' },
    { order: 6, item: '설교', detail: '믿음으로 걸어가는 길 - 김목사' },
    { order: 7, item: '봉헌', detail: '찬송가 50장' },
    { order: 8, item: '광고', detail: '사회자' },
    { order: 9, item: '축도', detail: '김목사' },
  ],
  announcements: [
    '수요 예배: 매주 수요일 오후 7시 30분',
    '금요 기도회: 매주 금요일 오후 8시',
    '새가족 환영회: 2월 22일 예배 후',
    '청년부 수련회: 3월 6일-8일',
    '교회 대청소: 3월 14일 오전 10시',
  ],
  weeklySchedule: [
    { day: '월요일', event: '구역 모임', time: '오후 7:30' },
    { day: '수요일', event: '수요 예배', time: '오후 7:30' },
    { day: '금요일', event: '금요 기도회', time: '오후 8:00' },
    { day: '토요일', event: '새벽 기도회', time: '오전 6:00' },
    { day: '주일', event: '주일 예배', time: '오전 11:00' },
  ],
  footerAddress: '중앙교회 | 서울시 강남구 OO로 123',
  footerContact: 'TEL: 02-123-4567 | FAX: 02-123-4568',
};

function TrexRunnerMiniGame({ onClose }) {
  const arenaRef = useRef(null);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const [arenaWidth, setArenaWidth] = useState(760);
  const [phase, setPhase] = useState('idle');
  const [game, setGame] = useState({
    y: 0,
    velocity: 0,
    score: 0,
    speed: 320,
    spawnTimer: 0.9,
    obstacles: [],
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [leaderboardError, setLeaderboardError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [didSaveCurrentScore, setDidSaveCurrentScore] = useState(false);

  const currentScore = Math.floor(game.score);

  const loadLeaderboard = async (openAfterLoad = false) => {
    try {
      setLeaderboardError('');
      const res = await fetch('/api/scores');
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || '점수판을 불러오지 못했습니다.');
      }
      setLeaderboard(result);
      if (openAfterLoad) setShowLeaderboard(true);
    } catch (err) {
      setLeaderboardError(err.message);
      if (openAfterLoad) setShowLeaderboard(true);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (arenaRef.current) setArenaWidth(arenaRef.current.offsetWidth);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (phase !== 'running') {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return undefined;
    }

    const step = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;

      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.032);
      lastTimeRef.current = time;

      setGame((prev) => {
        let velocity = prev.velocity - 1800 * delta;
        let y = prev.y + velocity * delta;

        if (y < 0) {
          y = 0;
          velocity = 0;
        }

        const speed = prev.speed + delta * 10;
        let spawnTimer = prev.spawnTimer - delta;
        let obstacles = prev.obstacles
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - speed * delta }))
          .filter((obstacle) => obstacle.x + obstacle.width > -40);

        if (spawnTimer <= 0) {
          obstacleIdRef.current += 1;
          obstacles = [
            ...obstacles,
            {
              id: obstacleIdRef.current,
              x: arenaWidth + 40,
              width: 18 + Math.random() * 18,
              height: 28 + Math.random() * 30,
            },
          ];
          spawnTimer = 0.9 + Math.random() * 0.7;
        }

        const hit = obstacles.some(
          (obstacle) => obstacle.x < 108 && obstacle.x + obstacle.width > 64 && y < obstacle.height
        );

        if (hit) {
          setPhase('gameover');
          return { ...prev, y, velocity, speed, spawnTimer, obstacles };
        }

        return {
          y,
          velocity,
          speed,
          spawnTimer,
          obstacles,
          score: prev.score + delta * 12,
        };
      });

      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = 0;
    };
  }, [arenaWidth, phase]);

  const startGame = () => {
    lastTimeRef.current = 0;
    setDidSaveCurrentScore(false);
    setSaveMessage('');
    setShowSaveModal(false);
    setGame({
      y: 0,
      velocity: 0,
      score: 0,
      speed: 320,
      spawnTimer: 0.9,
      obstacles: [],
    });
    setPhase('running');
  };

  const jump = () => {
    setGame((prev) => {
      if (prev.y > 2) return prev;
      return { ...prev, velocity: 700 };
    });
  };

  useEffect(() => {
    const handleJump = (event) => {
      if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
      event.preventDefault();
      if (phase === 'idle') startGame();
      else if (phase === 'gameover') startGame();
      else jump();
    };

    window.addEventListener('keydown', handleJump);
    return () => window.removeEventListener('keydown', handleJump);
  }, [phase]);

  const handleAction = () => {
    if (phase === 'idle' || phase === 'gameover') {
      startGame();
      return;
    }
    jump();
  };

  const handleOpenSaveModal = () => {
    setPlayerName('');
    setSaveMessage('');
    setShowSaveModal(true);
  };

  const handleSaveScore = async () => {
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setSaveMessage('이름을 입력하세요.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage('');
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, score: currentScore }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || '점수를 저장하지 못했습니다.');
      }

      setLeaderboard(result.leaderboard || []);
      setDidSaveCurrentScore(true);
      setShowSaveModal(false);
      setShowLeaderboard(true);
      setSaveMessage(result.isTopTen ? '점수판이 업데이트되었습니다.' : '저장되었습니다.');
    } catch (err) {
      setSaveMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArenaButtonClick = (event, action) => {
    event.stopPropagation();
    action();
  };

  return (
    <>
      <div className="trex-shell">
        <div className="trex-topbar">
          <div>
            <p className="trex-label">Bulletin Header</p>
            <h3>T-Rex Runner Mode</h3>
          </div>
        <button className="trex-close-btn" type="button" onClick={onClose}>
          닫기
        </button>
        </div>
        <div className="trex-arena" ref={arenaRef} onClick={handleAction} role="button" tabIndex={0}>
          <div className="trex-score">score {currentScore}</div>
          <div className="trex-status">
            {phase === 'idle' && '시작 버튼 또는 스페이스바'}
            {phase === 'running' && '점프: 클릭 또는 스페이스바'}
            {phase === 'gameover' && '충돌했습니다. 다시 시작하거나 점수를 저장하세요.'}
          </div>
          {saveMessage && <div className="trex-flash-message">{saveMessage}</div>}
          <div className="trex-ground" />
          <div className="trex-dino" style={{ transform: `translate3d(0, ${-game.y}px, 0)` }}>
            <span className="trex-dino-body" />
            <span className="trex-dino-eye" />
            <span className="trex-dino-leg front" />
            <span className="trex-dino-leg back" />
          </div>
          {game.obstacles.map((obstacle) => (
            <div
              key={obstacle.id}
              className="trex-obstacle"
              style={{
                transform: `translate3d(${obstacle.x}px, 0, 0)`,
                width: obstacle.width,
                height: obstacle.height,
              }}
            />
          ))}
          <div className="trex-actions">
            {phase === 'gameover' && (
              <button
                className="trex-secondary-btn"
                type="button"
                onClick={(event) => handleArenaButtonClick(event, handleOpenSaveModal)}
                disabled={didSaveCurrentScore}
              >
                {didSaveCurrentScore ? '저장됨' : '저장'}
              </button>
            )}
            <button
              className="trex-secondary-btn"
              type="button"
              onClick={(event) => handleArenaButtonClick(event, () => loadLeaderboard(true))}
            >
              점수판
            </button>
            <button className="trex-start-btn" type="button" onClick={(event) => handleArenaButtonClick(event, handleAction)}>
              {phase === 'idle' ? '게임 시작' : phase === 'gameover' ? '다시 시작' : '점프'}
            </button>
          </div>
        </div>
      </div>

      {showLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="modal-content trex-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="trex-modal-title">Top 10 Scores</h4>
            {leaderboardError ? (
              <p className="trex-modal-error">{leaderboardError}</p>
            ) : (
              <ol className="leaderboard-list">
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 10).map((entry, index) => (
                    <li key={entry._id || `${entry.name}-${entry.score}-${index}`} className="leaderboard-item">
                      <span className="leaderboard-rank">{index + 1}</span>
                      <span className="leaderboard-name">{entry.name}</span>
                      <strong className="leaderboard-score">{entry.score}</strong>
                    </li>
                  ))
                ) : (
                  <li className="leaderboard-empty">아직 저장된 점수가 없습니다.</li>
                )}
              </ol>
            )}
            <div className="modal-actions">
              <button className="modal-btn-confirm" type="button" onClick={() => setShowLeaderboard(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content trex-modal trex-save-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="trex-modal-title">점수 저장</h4>
            <p className="trex-save-score">현재 점수 {currentScore}</p>
            <input
              className="modal-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              placeholder="이름 입력"
            />
            {saveMessage && <p className="trex-modal-error">{saveMessage}</p>}
            <div className="modal-actions">
              <button className="modal-btn-cancel" type="button" onClick={() => setShowSaveModal(false)}>
                취소
              </button>
              <button className="modal-btn-confirm" type="button" onClick={handleSaveScore} disabled={isSaving}>
                {isSaving ? '저장 중' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Bulletin({ isAdmin }) {
  const [data, setData] = useState(defaultData);
  const [bulletinId, setBulletinId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scriptureRef, setScriptureRef] = useState(() => parseScriptureRef(defaultData.scripture));
  const [showScriptureModal, setShowScriptureModal] = useState(false);
  const [showHeaderGame, setShowHeaderGame] = useState(false);
  const headerX = useMotionValue(0);
  const headerShift = useTransform(headerX, [-120, 0, 180], ['-2%', '0%', '5%']);
  const headerGlow = useTransform(
    headerX,
    [-120, 0, 180],
    [
      'linear-gradient(135deg, rgba(31, 32, 45, 0.14), transparent 48%)',
      'linear-gradient(135deg, rgba(178, 74, 47, 0), transparent 48%)',
      'linear-gradient(135deg, rgba(178, 74, 47, 0.26), transparent 54%)',
    ]
  );

  useEffect(() => {
    fetch('/api/bulletin')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((saved) => {
        if (saved && saved._id) {
          const { _id, __v, createdAt, updatedAt, ...fields } = saved;
          const nextScriptureRef = fields.scriptureRef
            ? { ...defaultScriptureRef, ...fields.scriptureRef }
            : parseScriptureRef(fields.scripture);

          setData({
            ...defaultData,
            ...fields,
            scriptureRef: nextScriptureRef,
          });
          setScriptureRef(nextScriptureRef);
          setBulletinId(_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveToDb = async () => {
    try {
      let res;
      if (bulletinId) {
        res = await fetch(`/api/bulletin/${bulletinId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch('/api/bulletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      const result = await res.json();
      if (!res.ok) {
        alert(`저장 실패: ${result.message || res.status}`);
        return;
      }

      if (!bulletinId) setBulletinId(result._id);
      alert('DB에 저장되었습니다.');
    } catch (err) {
      alert(`서버 연결에 실패했습니다.\n(${err.message})`);
    }
  };

  const updateField = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const updateScriptureRef = (patch) => {
    const next = { ...scriptureRef, ...patch };
    if (comparePosition(next.startChapter, next.startVerse, next.endChapter, next.endVerse) > 0) {
      next.endChapter = next.startChapter;
      next.endVerse = next.startVerse;
    }
    setScriptureRef(next);
    setData({ ...data, scriptureRef: next });
  };

  const updateWorship = (index, field, value) => {
    const updated = [...data.orderOfWorship];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, orderOfWorship: updated });
  };

  const addWorship = () => {
    const nextOrder = data.orderOfWorship.length + 1;
    setData({
      ...data,
      orderOfWorship: [...data.orderOfWorship, { order: nextOrder, item: '', detail: '' }],
    });
  };

  const removeWorship = (index) => {
    const updated = data.orderOfWorship.filter((_, itemIndex) => itemIndex !== index);
    const reordered = updated.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 }));
    setData({ ...data, orderOfWorship: reordered });
  };

  const updateAnnouncement = (index, value) => {
    const updated = [...data.announcements];
    updated[index] = value;
    setData({ ...data, announcements: updated });
  };

  const addAnnouncement = () => {
    setData({ ...data, announcements: [...data.announcements, ''] });
  };

  const removeAnnouncement = (index) => {
    setData({ ...data, announcements: data.announcements.filter((_, itemIndex) => itemIndex !== index) });
  };

  const updateSchedule = (index, field, value) => {
    const updated = [...data.weeklySchedule];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, weeklySchedule: updated });
  };

  const addSchedule = () => {
    setData({
      ...data,
      weeklySchedule: [...data.weeklySchedule, { day: '', event: '', time: '' }],
    });
  };

  const removeSchedule = (index) => {
    setData({ ...data, weeklySchedule: data.weeklySchedule.filter((_, itemIndex) => itemIndex !== index) });
  };

  const handleHeaderDragEnd = (_, info) => {
    if (info.offset.x > 150) {
      setShowHeaderGame(true);
    }
    animate(headerX, 0, { type: 'spring', stiffness: 360, damping: 30 });
  };

  if (loading) return <div className="bulletin-loading">주보를 불러오는 중...</div>;

  return (
    <div className="bulletin-container">
      {isAdmin && (
        <div className="admin-save-bar">
          <span className="admin-badge">편집 모드</span>
          <button className="btn-admin-save" onClick={handleSaveToDb} type="button">
            DB 저장
          </button>
        </div>
      )}

      <motion.div
        className={`bulletin-header ${showHeaderGame ? 'game-mode' : ''} ${!isAdmin && !showHeaderGame ? 'is-draggable' : ''}`}
        drag={!isAdmin && !showHeaderGame ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={handleHeaderDragEnd}
        style={!isAdmin && !showHeaderGame ? { x: headerX } : undefined}
      >
        {!isAdmin && !showHeaderGame && (
          <>
            <motion.div className="bulletin-header-drag-glow" style={{ backgroundImage: headerGlow }} />
          </>
        )}

        <div className="church-symbol" />
        {isAdmin ? (
          <>
            <input className="edit-input edit-header-lg" value={data.churchName} onChange={(e) => updateField('churchName', e.target.value)} />
            <input className="edit-input edit-header-sm" value={data.date} onChange={(e) => updateField('date', e.target.value)} />
            <input className="edit-input edit-header-md" value={data.worshipTitle} onChange={(e) => updateField('worshipTitle', e.target.value)} />
          </>
        ) : showHeaderGame ? (
          <TrexRunnerMiniGame onClose={() => setShowHeaderGame(false)} />
        ) : (
          <>
            <motion.h1 className="church-name" style={{ x: headerShift }}>
              {data.churchName}
            </motion.h1>
            <p className="bulletin-date">{data.date}</p>
            <h2 className="worship-title">{data.worshipTitle}</h2>
          </>
        )}
      </motion.div>

      <div className="bulletin-section sermon-info">
        <h3 className="section-title">설교</h3>
        {isAdmin ? (
          <div className="edit-group">
            <label>설교 제목</label>
            <input className="edit-input" value={data.sermonTitle} onChange={(e) => updateField('sermonTitle', e.target.value)} />
            <label>성경 본문</label>
            <div className="scripture-input-row">
              <input className="edit-input" value={data.scripture} onChange={(e) => updateField('scripture', e.target.value)} />
            </div>
            <div className="scripture-selects">
              {(() => {
                const book = getBookByName(scriptureRef.book);
                const chapters = getChapters(book);
                const safeStartChapter = chapters.includes(scriptureRef.startChapter) ? scriptureRef.startChapter : chapters[0];
                const startVerses = getVerses(book, safeStartChapter);
                const safeStartVerse = startVerses.includes(scriptureRef.startVerse) ? scriptureRef.startVerse : startVerses[0];
                const safeEndChapter = chapters.includes(scriptureRef.endChapter) ? scriptureRef.endChapter : safeStartChapter;
                const endVerses = getVerses(book, safeEndChapter);
                const safeEndVerse = endVerses.includes(scriptureRef.endVerse) ? scriptureRef.endVerse : endVerses[0];

                return (
                  <>
                    <select
                      className="bible-select"
                      value={book.name}
                      onChange={(e) => {
                        const nextBook = e.target.value;
                        const nextBookData = getBookByName(nextBook);
                        const nextChapters = getChapters(nextBookData);
                        const nextStartChapter = nextChapters[0] || '1';
                        const nextStartVerses = getVerses(nextBookData, nextStartChapter);
                        const nextStartVerse = nextStartVerses[0] || '1';
                        updateScriptureRef({
                          book: nextBook,
                          startChapter: nextStartChapter,
                          startVerse: nextStartVerse,
                          endChapter: nextStartChapter,
                          endVerse: nextStartVerse,
                        });
                      }}
                    >
                      {bibleBooks.map((bookItem) => (
                        <option key={bookItem.name} value={bookItem.name}>
                          {bookItem.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="bible-select"
                      value={safeStartChapter}
                      onChange={(e) => {
                        const nextChapter = e.target.value;
                        const nextVerses = getVerses(book, nextChapter);
                        const nextVerse = nextVerses[0] || '1';
                        updateScriptureRef({ startChapter: nextChapter, startVerse: nextVerse });
                      }}
                    >
                      {chapters.map((chapter) => (
                        <option key={chapter} value={chapter}>
                          {chapter}장
                        </option>
                      ))}
                    </select>
                    <select className="bible-select" value={safeStartVerse} onChange={(e) => updateScriptureRef({ startVerse: e.target.value })}>
                      {startVerses.map((verse) => (
                        <option key={verse} value={verse}>
                          {verse}절
                        </option>
                      ))}
                    </select>
                    <span className="scripture-range-sep">~</span>
                    <select
                      className="bible-select"
                      value={safeEndChapter}
                      onChange={(e) => {
                        const nextChapter = e.target.value;
                        const nextVerses = getVerses(book, nextChapter);
                        const nextVerse = nextVerses[0] || '1';
                        updateScriptureRef({ endChapter: nextChapter, endVerse: nextVerse });
                      }}
                    >
                      {chapters.map((chapter) => (
                        <option key={chapter} value={chapter}>
                          {chapter}장
                        </option>
                      ))}
                    </select>
                    <select className="bible-select" value={safeEndVerse} onChange={(e) => updateScriptureRef({ endVerse: e.target.value })}>
                      {endVerses.map((verse) => (
                        <option key={verse} value={verse}>
                          {verse}절
                        </option>
                      ))}
                    </select>
                  </>
                );
              })()}
            </div>
            <label>설교자</label>
            <input className="edit-input" value={data.pastor} onChange={(e) => updateField('pastor', e.target.value)} />
          </div>
        ) : (
          <div className="sermon-detail">
            <p className="sermon-title">"{data.sermonTitle}"</p>
            <p className="sermon-scripture">
              본문: {data.scripture}
              <button className="btn-scripture-view inline" onClick={() => setShowScriptureModal(true)} type="button" aria-label="본문 보기">
                <svg viewBox="0 0 24 24" className="icon-eye" aria-hidden="true">
                  <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                </svg>
              </button>
            </p>
            <p className="sermon-pastor">설교: {data.pastor}</p>
          </div>
        )}
      </div>

      <div className="bulletin-section">
        <h3 className="section-title">예배 순서</h3>
        <table className="worship-order-table">
          <thead>
            <tr>
              <th>순서</th>
              <th>내용</th>
              <th>비고</th>
              {isAdmin && <th className="col-action">삭제</th>}
            </tr>
          </thead>
          <tbody>
            {data.orderOfWorship.map((item, index) => (
              <tr key={item.order}>
                <td className="order-number">{item.order}</td>
                <td>
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.item} onChange={(e) => updateWorship(index, 'item', e.target.value)} />
                  ) : (
                    item.item
                  )}
                </td>
                <td className="order-detail">
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.detail} onChange={(e) => updateWorship(index, 'detail', e.target.value)} />
                  ) : (
                    item.detail
                  )}
                </td>
                {isAdmin && (
                  <td className="col-action">
                    <button className="btn-remove" onClick={() => removeWorship(index)} type="button">
                      -
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && (
          <button className="btn-add" onClick={addWorship} type="button">
            + 순서 추가
          </button>
        )}
      </div>

      <div className="bulletin-section">
        <h3 className="section-title">광고 및 공지사항</h3>
        {isAdmin ? (
          <div className="edit-list">
            {data.announcements.map((item, index) => (
              <div key={index} className="edit-list-item">
                <input className="edit-input" value={item} onChange={(e) => updateAnnouncement(index, e.target.value)} />
                <button className="btn-remove" onClick={() => removeAnnouncement(index)} type="button">
                  -
                </button>
              </div>
            ))}
            <button className="btn-add" onClick={addAnnouncement} type="button">
              + 공지 추가
            </button>
          </div>
        ) : (
          <ul className="announcement-list">
            {data.announcements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="bulletin-section">
        <h3 className="section-title">주간 일정</h3>
        <table className="weekly-schedule-table">
          <thead>
            <tr>
              <th>요일</th>
              <th>행사</th>
              <th>시간</th>
              {isAdmin && <th className="col-action">삭제</th>}
            </tr>
          </thead>
          <tbody>
            {data.weeklySchedule.map((item, index) => (
              <tr key={index}>
                <td>
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.day} onChange={(e) => updateSchedule(index, 'day', e.target.value)} />
                  ) : (
                    item.day
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.event} onChange={(e) => updateSchedule(index, 'event', e.target.value)} />
                  ) : (
                    item.event
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.time} onChange={(e) => updateSchedule(index, 'time', e.target.value)} />
                  ) : (
                    item.time
                  )}
                </td>
                {isAdmin && (
                  <td className="col-action">
                    <button className="btn-remove" onClick={() => removeSchedule(index)} type="button">
                      -
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && (
          <button className="btn-add" onClick={addSchedule} type="button">
            + 일정 추가
          </button>
        )}
      </div>

      <div className="bulletin-footer">
        {isAdmin ? (
          <>
            <input className="edit-input edit-footer" value={data.footerAddress} onChange={(e) => updateField('footerAddress', e.target.value)} />
            <input className="edit-input edit-footer" value={data.footerContact} onChange={(e) => updateField('footerContact', e.target.value)} />
          </>
        ) : (
          <>
            <p>{data.footerAddress}</p>
            <p>{data.footerContact}</p>
          </>
        )}
      </div>

      {showScriptureModal && (
        <div className="modal-overlay" onClick={() => setShowScriptureModal(false)}>
          <div className="modal-content scripture-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="scripture-modal-title">{data.scripture}</h4>
            <div className="scripture-modal-body">
              {collectPassage(scriptureRef).map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <div className="modal-actions">
              <button className="modal-btn-confirm" onClick={() => setShowScriptureModal(false)} type="button">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bulletin;
