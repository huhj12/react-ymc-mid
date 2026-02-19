import React, { useState, useMemo, useCallback } from 'react';
import bibleData from '../data/bible.json';
import Toast from '../components/Toast';
import './BibleSearch.css';

// 전체 구절을 flat 배열로 변환 (키워드 검색용)
const allVerses = [];
['구약', '신약'].forEach((testament) => {
  bibleData[testament].forEach((book) => {
    Object.entries(book.chapters).forEach(([chapter, verses]) => {
      Object.entries(verses).forEach(([verse, text]) => {
        allVerses.push({
          testament,
          book: book.name,
          chapter: Number(chapter),
          verse: Number(verse),
          text,
        });
      });
    });
  });
});

const allBooks = [...bibleData['구약'], ...bibleData['신약']];

function BibleSearch() {
  const [mode, setMode] = useState('verse'); // 기본: 구절 찾기

  // 토스트
  const [toast, setToast] = useState('');
  const showToast = useCallback((msg) => {
    setToast('');
    setTimeout(() => setToast(msg), 10);
  }, []);

  // 구절 찾기 상태
  const [selectedBook, setSelectedBook] = useState(allBooks[0].name);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [checkedVerses, setCheckedVerses] = useState(new Set());
  const [lastChecked, setLastChecked] = useState(null);
  const [rangeInput, setRangeInput] = useState('');

  // 키워드 검색 상태
  const [keyword, setKeyword] = useState('');
  const [searched, setSearched] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // 현재 선택된 책 데이터
  const currentBook = useMemo(
    () => allBooks.find((b) => b.name === selectedBook),
    [selectedBook]
  );

  // 해당 책의 장 번호 목록
  const chapterList = useMemo(
    () => Object.keys(currentBook.chapters).map(Number).sort((a, b) => a - b),
    [currentBook]
  );

  // 현재 장의 구절 목록
  const currentVerses = useMemo(() => {
    const ch = currentBook.chapters[selectedChapter];
    if (!ch) return [];
    return Object.entries(ch)
      .map(([v, t]) => ({ verse: Number(v), text: t }))
      .sort((a, b) => a.verse - b.verse);
  }, [currentBook, selectedChapter]);

  const handleBookChange = (bookName) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setCheckedVerses(new Set());
    setLastChecked(null);
    setRangeInput('');
  };

  const handleChapterChange = (ch) => {
    setSelectedChapter(ch);
    setCheckedVerses(new Set());
    setLastChecked(null);
    setRangeInput('');
  };

  const isAllChecked = currentVerses.length > 0 && checkedVerses.size === currentVerses.length;
  const isAnyChecked = checkedVerses.size > 0;

  const toggleAll = () => {
    if (isAllChecked) {
      setCheckedVerses(new Set());
    } else {
      setCheckedVerses(new Set(currentVerses.map((v) => v.verse)));
    }
  };

  const toggleVerse = (verseNum, e) => {
    if (e.shiftKey && lastChecked !== null) {
      const min = Math.min(lastChecked, verseNum);
      const max = Math.max(lastChecked, verseNum);
      setCheckedVerses((prev) => {
        const next = new Set(prev);
        currentVerses.forEach((v) => {
          if (v.verse >= min && v.verse <= max) next.add(v.verse);
        });
        return next;
      });
    } else {
      setCheckedVerses((prev) => {
        const next = new Set(prev);
        next.has(verseNum) ? next.delete(verseNum) : next.add(verseNum);
        return next;
      });
    }
    setLastChecked(verseNum);
  };

  const handleRangeApply = () => {
    if (!rangeInput.trim()) return;
    const verseNums = new Set(currentVerses.map((v) => v.verse));
    const selected = new Set();
    rangeInput.split(',').forEach((part) => {
      const p = part.trim();
      if (p.includes('-')) {
        const [s, e] = p.split('-').map(Number);
        for (let i = s; i <= e; i++) { if (verseNums.has(i)) selected.add(i); }
      } else {
        const n = Number(p);
        if (verseNums.has(n)) selected.add(n);
      }
    });
    setCheckedVerses(selected);
    setRangeInput('');
    showToast(`${selected.size}개 구절 선택됨`);
  };

  const handleCopySelected = () => {
    const text = currentVerses
      .filter((v) => checkedVerses.has(v.verse))
      .sort((a, b) => a.verse - b.verse)
      .map((v) => `${v.verse} ${v.text}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${checkedVerses.size}개 구절 복사됨`);
    });
  };

  // 키워드 검색 전체 결과
  const searchResults = useMemo(() => {
    if (!searched.trim()) return [];
    const q = searched.trim();
    return allVerses.filter((v) => v.text.includes(q));
  }, [searched]);

  const totalPages = Math.ceil(searchResults.length / PAGE_SIZE);
  const pagedResults = searchResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleKeywordSearch = (e) => {
    e.preventDefault();
    setSearched(keyword);
    setPage(1);
  };

  const handleCopyChapter = () => {
    const text = currentVerses.map((v) => `${v.verse} ${v.text}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${selectedBook} ${selectedChapter}장 복사됨`);
    });
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'g'));
    return parts.map((part, i) =>
      part === query ? <mark key={i} className="highlight">{part}</mark> : part
    );
  };

  return (
    <div className="bible-container">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <h2 className="bible-title">성경 검색</h2>

      {/* 모드 탭 - 구절 찾기 먼저 */}
      <div className="bible-mode-tabs">
        <button
          className={`bible-mode-btn ${mode === 'verse' ? 'active' : ''}`}
          onClick={() => setMode('verse')}
        >
          구절 찾기
        </button>
        <button
          className={`bible-mode-btn ${mode === 'keyword' ? 'active' : ''}`}
          onClick={() => setMode('keyword')}
        >
          키워드 검색
        </button>
      </div>

      {/* 구절 찾기 */}
      {mode === 'verse' && (
        <div className="bible-section">
          {/* 책 선택 */}
          <div className="bible-book-select-row">
            <select
              className="bible-select"
              value={selectedBook}
              onChange={(e) => handleBookChange(e.target.value)}
            >
              <optgroup label="구약">
                {bibleData['구약'].map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </optgroup>
              <optgroup label="신약">
                {bibleData['신약'].map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </optgroup>
            </select>
            <span className="bible-book-info">
              총 {chapterList.length}장
            </span>
          </div>

          {/* 장 버튼 */}
          <div className="bible-chapter-buttons">
            {chapterList.map((ch) => (
              <button
                key={ch}
                className={`bible-chapter-btn ${selectedChapter === ch ? 'active' : ''}`}
                onClick={() => handleChapterChange(ch)}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* 구절 목록 */}
          <div className="bible-verse-result">
            <div className="bible-verse-header">
              <input
                type="checkbox"
                className="bible-check-all"
                checked={isAllChecked}
                onChange={toggleAll}
                title="전체 선택"
              />
              <span>{selectedBook} {selectedChapter}장</span>
              <span className="bible-verse-count">{currentVerses.length}절</span>
              {isAnyChecked && (
                <>
                  <button className="bible-copy-btn bible-copy-selected-btn" onClick={handleCopySelected}>
                    선택 복사 ({checkedVerses.size})
                  </button>
                  <button className="bible-deselect-btn" onClick={() => { setCheckedVerses(new Set()); setLastChecked(null); }}>
                    선택 해제
                  </button>
                </>
              )}
              <button className="bible-copy-btn" onClick={handleCopyChapter}>장 전체 복사하기</button>
            </div>
            {/* 범위 입력 */}
            <div className="bible-range-row">
              <input
                className="bible-range-input"
                type="text"
                placeholder="범위 입력: 1-10 또는 1,3,5"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRangeApply()}
              />
              <button className="bible-range-btn" onClick={handleRangeApply}>적용</button>
              <span className="bible-range-hint">Shift+클릭으로 범위 선택도 가능</span>
            </div>

            <ul className="bible-verse-list">
              {currentVerses.map((v) => (
                <li key={v.verse} className={`bible-verse-item ${checkedVerses.has(v.verse) ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    className="bible-verse-check"
                    checked={checkedVerses.has(v.verse)}
                    onChange={() => {}}
                    onClick={(e) => toggleVerse(v.verse, e)}
                  />
                  <span className="bible-verse-num">{v.verse}</span>
                  <span className="bible-verse-text">{v.text}</span>
                  <button
                    className="bible-verse-copy-btn"
                    onClick={() => navigator.clipboard.writeText(`${v.verse} ${v.text}`).then(() => showToast(`${v.verse}절 복사됨`))}
                  >복사</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 키워드 검색 */}
      {mode === 'keyword' && (
        <div className="bible-section">
          <form className="bible-search-form" onSubmit={handleKeywordSearch}>
            <input
              className="bible-input"
              type="text"
              placeholder="검색어를 입력하세요 (예: 사랑, 믿음)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className="bible-btn-search" type="submit">검색</button>
          </form>

          {searched && (
            <div className="bible-result-header">
              <strong>"{searched}"</strong> 검색 결과 {searchResults.length}건
              {totalPages > 1 && ` (${page} / ${totalPages} 페이지)`}
            </div>
          )}

          {searched && searchResults.length === 0 && (
            <div className="bible-empty">검색 결과가 없습니다.</div>
          )}

          <ul className="bible-result-list">
            {pagedResults.map((v, i) => (
              <li key={i} className="bible-result-item">
                <span className="bible-ref">
                  {v.book} {v.chapter}:{v.verse}
                </span>
                <span className="bible-text">{highlightText(v.text, searched)}</span>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="bible-pagination">
              <button
                className="bible-page-btn"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >이전</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`bible-page-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              ))}
              <button
                className="bible-page-btn"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >다음</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BibleSearch;
