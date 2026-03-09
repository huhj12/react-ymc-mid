import React, { useState, useEffect } from 'react';
import './Bulletin.css';
import bibleData from '../data/bible.json';

const bibleBooks = [
  ...(bibleData['구약'] || []),
  ...(bibleData['신약'] || []),
];

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
  const matchedBook = bibleBooks.find((b) => trimmed.startsWith(b.name));
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
  const chapters = getChapters(book).map((c) => Number(c)).sort((a, b) => a - b);
  const startC = Number(ref.startChapter);
  const endC = Number(ref.endChapter);
  const startV = Number(ref.startVerse);
  const endV = Number(ref.endVerse);
  const lines = [];

  for (const c of chapters) {
    if (c < startC || c > endC) continue;
    const chapterKey = String(c);
    const verseKeys = getVerses(book, chapterKey).map((v) => Number(v)).sort((a, b) => a - b);
    for (const v of verseKeys) {
      const isBeforeStart = comparePosition(c, v, startC, startV) < 0;
      const isAfterEnd = comparePosition(c, v, endC, endV) > 0;
      if (isBeforeStart || isAfterEnd) continue;
      const text = book.chapters[chapterKey][String(v)];
      lines.push(`${c}:${v} ${text}`);
    }
  }
  return lines;
};

const defaultData = {
  churchName: '사랑의 교회',
  date: '2026년 2월 15일 주일',
  worshipTitle: '주일 예배',
  sermonTitle: '믿음으로 걷는 길',
  scripture: '히브리서 11:1-6',
  scriptureRef: { ...defaultScriptureRef },
  pastor: '김목사',
  orderOfWorship: [
    { order: 1, item: '예배의 부름', detail: '사회자' },
    { order: 2, item: '찬송', detail: '찬송가 21장' },
    { order: 3, item: '기도', detail: '대표기도: 이OO 집사' },
    { order: 4, item: '성경봉독', detail: '히브리서 11:1-6' },
    { order: 5, item: '찬양', detail: '찬양팀' },
    { order: 6, item: '설교', detail: '믿음으로 걷는 길 - 김목사' },
    { order: 7, item: '봉헌', detail: '찬송가 50장' },
    { order: 8, item: '광고', detail: '사회자' },
    { order: 9, item: '축도', detail: '김목사' },
  ],
  announcements: [
    '수요 예배: 매주 수요일 저녁 7시 30분',
    '금요 기도회: 매주 금요일 저녁 8시',
    '새가족 환영회: 2월 22일(일) 예배 후',
    '청년부 수련회: 3월 6일~8일 (신청 마감: 2월 28일)',
    '교회 봄맞이 대청소: 3월 14일(토) 오전 10시',
  ],
  weeklySchedule: [
    { day: '화요일', event: '구역 모임', time: '오후 7:30' },
    { day: '수요일', event: '수요 예배', time: '오후 7:30' },
    { day: '금요일', event: '금요 기도회', time: '오후 8:00' },
    { day: '토요일', event: '새벽 기도회', time: '오전 6:00' },
    { day: '주일', event: '주일 예배', time: '오전 11:00' },
  ],
  footerAddress: '사랑의 교회 | 서울시 강남구 OO로 123',
  footerContact: 'TEL: 02-123-4567 | FAX: 02-123-4568',
};

function Bulletin({ isAdmin }) {
  const [data, setData] = useState(defaultData);
  const [bulletinId, setBulletinId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scriptureRef, setScriptureRef] = useState(() => parseScriptureRef(defaultData.scripture));
  const [showScriptureModal, setShowScriptureModal] = useState(false);

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
        alert('저장 실패: ' + (result.message || res.status));
        return;
      }
      if (!bulletinId) setBulletinId(result._id);
      alert('DB에 저장되었습니다.');
    } catch (err) {
      alert('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.\n(' + err.message + ')');
    }
  };

  // 기본 필드 변경
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

  // 예배 순서 변경
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
    const updated = data.orderOfWorship.filter((_, i) => i !== index);
    const reordered = updated.map((item, i) => ({ ...item, order: i + 1 }));
    setData({ ...data, orderOfWorship: reordered });
  };

  // 공지사항 변경
  const updateAnnouncement = (index, value) => {
    const updated = [...data.announcements];
    updated[index] = value;
    setData({ ...data, announcements: updated });
  };

  const addAnnouncement = () => {
    setData({ ...data, announcements: [...data.announcements, ''] });
  };

  const removeAnnouncement = (index) => {
    setData({ ...data, announcements: data.announcements.filter((_, i) => i !== index) });
  };

  // 주간 일정 변경
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
    setData({ ...data, weeklySchedule: data.weeklySchedule.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="bulletin-loading">주보를 불러오는 중...</div>;

  return (
    <div className="bulletin-container">
      {/* 관리자: 편집 모드 표시 */}
      {isAdmin && (
        <div className="admin-save-bar">
          <span className="admin-badge">편집 모드</span>
          <button className="btn-admin-save" onClick={handleSaveToDb}>DB 저장</button>
        </div>
      )}

      {/* 주보 헤더 */}
      <div className="bulletin-header">
        <div className="church-symbol"></div>
        {isAdmin ? (
          <>
            <input className="edit-input edit-header-lg" value={data.churchName} onChange={(e) => updateField('churchName', e.target.value)} />
            <input className="edit-input edit-header-sm" value={data.date} onChange={(e) => updateField('date', e.target.value)} />
            <input className="edit-input edit-header-md" value={data.worshipTitle} onChange={(e) => updateField('worshipTitle', e.target.value)} />
          </>
        ) : (
          <>
            <h1 className="church-name">{data.churchName}</h1>
            <p className="bulletin-date">{data.date}</p>
            <h2 className="worship-title">{data.worshipTitle}</h2>
          </>
        )}
      </div>

      {/* 설교 정보 */}
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
                      {bibleBooks.map((b) => (
                        <option key={b.name} value={b.name}>{b.name}</option>
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
                        <option key={chapter} value={chapter}>{chapter}장</option>
                      ))}
                    </select>
                    <select
                      className="bible-select"
                      value={safeStartVerse}
                      onChange={(e) => updateScriptureRef({ startVerse: e.target.value })}
                    >
                      {startVerses.map((verse) => (
                        <option key={verse} value={verse}>{verse}절</option>
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
                        <option key={chapter} value={chapter}>{chapter}장</option>
                      ))}
                    </select>
                    <select
                      className="bible-select"
                      value={safeEndVerse}
                      onChange={(e) => updateScriptureRef({ endVerse: e.target.value })}
                    >
                      {endVerses.map((verse) => (
                        <option key={verse} value={verse}>{verse}절</option>
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

      {/* 예배 순서 */}
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
                  ) : item.item}
                </td>
                <td className="order-detail">
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.detail} onChange={(e) => updateWorship(index, 'detail', e.target.value)} />
                  ) : item.detail}
                </td>
                {isAdmin && (
                  <td className="col-action">
                    <button className="btn-remove" onClick={() => removeWorship(index)}>-</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && <button className="btn-add" onClick={addWorship}>+ 순서 추가</button>}
      </div>

      {/* 광고 / 공지사항 */}
      <div className="bulletin-section">
        <h3 className="section-title">광고 및 공지사항</h3>
        {isAdmin ? (
          <div className="edit-list">
            {data.announcements.map((item, index) => (
              <div key={index} className="edit-list-item">
                <input className="edit-input" value={item} onChange={(e) => updateAnnouncement(index, e.target.value)} />
                <button className="btn-remove" onClick={() => removeAnnouncement(index)}>-</button>
              </div>
            ))}
            <button className="btn-add" onClick={addAnnouncement}>+ 공지 추가</button>
          </div>
        ) : (
          <ul className="announcement-list">
            {data.announcements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 주간 일정 */}
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
                  ) : item.day}
                </td>
                <td>
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.event} onChange={(e) => updateSchedule(index, 'event', e.target.value)} />
                  ) : item.event}
                </td>
                <td>
                  {isAdmin ? (
                    <input className="edit-input-inline" value={item.time} onChange={(e) => updateSchedule(index, 'time', e.target.value)} />
                  ) : item.time}
                </td>
                {isAdmin && (
                  <td className="col-action">
                    <button className="btn-remove" onClick={() => removeSchedule(index)}>-</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && <button className="btn-add" onClick={addSchedule}>+ 일정 추가</button>}
      </div>

      {/* 하단 정보 */}
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
              {collectPassage(scriptureRef).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="modal-actions">
              <button className="modal-btn-confirm" onClick={() => setShowScriptureModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bulletin;
