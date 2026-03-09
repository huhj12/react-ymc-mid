import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './Board.css';

const LOADING_MS = 420;

const panelVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

const buttonTransition = { type: 'spring', stiffness: 420, damping: 22, mass: 0.7 };

function MotionButton({ className, children, ...props }) {
  return (
    <motion.button
      className={className}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ y: 0, scale: 0.97 }}
      transition={buttonTransition}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function Board({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('list');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', author: '', content: '' });
  const [editPost, setEditPost] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [newTouched, setNewTouched] = useState({ title: false, author: false, content: false });
  const [editTouched, setEditTouched] = useState({ title: false, content: false });
  const loadingTimerRef = useRef(null);

  const startLoading = () => {
    setIsLoading(true);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      loadingTimerRef.current = null;
    }, LOADING_MS);
  };

  useEffect(() => {
    startLoading();
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  const newErrors = useMemo(
    () => ({
      title: newPost.title.trim().length === 0,
      author: newPost.author.trim().length === 0,
      content: newPost.content.trim().length === 0,
    }),
    [newPost]
  );

  const editErrors = useMemo(
    () => ({
      title: editPost.title.trim().length === 0,
      content: editPost.content.trim().length === 0,
    }),
    [editPost]
  );

  const handlePostClick = (post) => {
    const updated = { ...post, views: post.views + 1 };
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    setSelectedPost(updated);
    setView('detail');
    startLoading();
  };

  const handleWrite = () => {
    setNewPost({ title: '', author: '', content: '' });
    setNewTouched({ title: false, author: false, content: false });
    setView('write');
    startLoading();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newErrors.title || newErrors.author || newErrors.content) {
      setNewTouched({ title: true, author: true, content: true });
      alert('모든 항목을 입력해 주세요.');
      return;
    }

    const post = {
      id: Date.now(),
      ...newPost,
      views: 0,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [post, ...prev]);
    setView('list');
    setSelectedPost(null);
    startLoading();
  };

  const handleDelete = (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setView('list');
    setSelectedPost(null);
    startLoading();
  };

  const handleEdit = () => {
    if (!selectedPost) return;
    setEditPost({ title: selectedPost.title, content: selectedPost.content });
    setEditTouched({ title: false, content: false });
    setView('edit');
    startLoading();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editErrors.title || editErrors.content) {
      setEditTouched({ title: true, content: true });
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    const updated = { ...selectedPost, ...editPost };
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPost(updated);
    setView('detail');
    startLoading();
  };

  const handleBack = () => {
    setView('list');
    setSelectedPost(null);
    startLoading();
  };

  const formatDate = (dateStr) => (dateStr ? dateStr.substring(0, 10) : '');

  const renderListSkeleton = () =>
    Array.from({ length: 5 }, (_, index) => (
      <tr key={`skeleton-${index}`} className="skeleton-row">
        <td className="col-no">
          <span className="board-skeleton skeleton-pill" />
        </td>
        <td className="col-title">
          <span className="board-skeleton skeleton-line long" />
        </td>
        <td className="col-author">
          <span className="board-skeleton skeleton-line short" />
        </td>
        <td className="col-date">
          <span className="board-skeleton skeleton-line short" />
        </td>
        <td className="col-views">
          <span className="board-skeleton skeleton-pill" />
        </td>
      </tr>
    ));

  const renderDetailSkeleton = () => (
    <>
      <div className="detail-header">
        <div className="board-skeleton skeleton-line long" style={{ height: 28, marginBottom: 14 }} />
        <div className="board-skeleton skeleton-line medium" style={{ height: 14 }} />
      </div>
      <div className="detail-content">
        <div className="board-skeleton skeleton-line long" />
        <div className="board-skeleton skeleton-line long" />
        <div className="board-skeleton skeleton-line medium" />
      </div>
    </>
  );

  const renderFormSkeleton = () => (
    <div className="write-form">
      <div className="form-group">
        <span className="board-skeleton skeleton-line short" style={{ height: 14, marginBottom: 10 }} />
        <span className="board-skeleton skeleton-line long" style={{ height: 40 }} />
      </div>
      <div className="form-group">
        <span className="board-skeleton skeleton-line short" style={{ height: 14, marginBottom: 10 }} />
        <span className="board-skeleton skeleton-line long" style={{ height: 40 }} />
      </div>
      <div className="form-group">
        <span className="board-skeleton skeleton-line short" style={{ height: 14, marginBottom: 10 }} />
        <span className="board-skeleton skeleton-line long" style={{ height: 220 }} />
      </div>
    </div>
  );

  const listView = (
    <>
      <div className="board-header">
        <h2 className="board-title">게시판</h2>
        {isAdmin && (
          <MotionButton className="btn-write" onClick={handleWrite}>
            글쓰기
          </MotionButton>
        )}
      </div>

      <div className="board-stats">
        전체 게시글: <strong>{posts.length}</strong>건
      </div>

      <table className="board-table">
        <thead>
          <tr>
            <th className="col-no">번호</th>
            <th className="col-title">제목</th>
            <th className="col-author">작성자</th>
            <th className="col-date">작성일</th>
            <th className="col-views">조회</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            renderListSkeleton()
          ) : posts.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-message">
                게시글이 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((post, index) => (
              <tr key={post.id} onClick={() => handlePostClick(post)} className="post-row">
                <td className="col-no">{posts.length - index}</td>
                <td className="col-title">{post.title}</td>
                <td className="col-author">{post.author}</td>
                <td className="col-date">{formatDate(post.createdAt)}</td>
                <td className="col-views">{post.views}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );

  const detailView = selectedPost ? (
    <>
      {isLoading ? (
        renderDetailSkeleton()
      ) : (
        <>
          <div className="detail-header">
            <h2 className="detail-title">{selectedPost.title}</h2>
            <div className="detail-meta">
              <span>작성자: {selectedPost.author}</span>
              <span>작성일: {formatDate(selectedPost.createdAt)}</span>
              <span>조회: {selectedPost.views}</span>
            </div>
          </div>
          <div className="detail-content">
            {selectedPost.content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        </>
      )}
      <div className="detail-actions">
        <MotionButton className="btn-back" onClick={handleBack}>
          목록으로
        </MotionButton>
        {isAdmin && (
          <MotionButton className="btn-edit" onClick={handleEdit}>
            수정
          </MotionButton>
        )}
        {isAdmin && (
          <MotionButton className="btn-delete" onClick={() => handleDelete(selectedPost.id)}>
            삭제
          </MotionButton>
        )}
      </div>
    </>
  ) : null;

  const editView = selectedPost ? (
    <>
      <h2 className="write-title">글 수정</h2>
      {isLoading ? (
        renderFormSkeleton()
      ) : (
        <form className="write-form" onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label htmlFor="edit-title">제목</label>
            <input
              id="edit-title"
              type="text"
              className={editTouched.title ? (editErrors.title ? 'input-error' : 'input-success') : ''}
              value={editPost.title}
              onBlur={() => setEditTouched((prev) => ({ ...prev, title: true }))}
              onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
              placeholder="제목을 입력하세요"
            />
            {editTouched.title && (
              <p className={`form-feedback ${editErrors.title ? 'error' : 'success'}`}>
                {editErrors.title ? '제목은 필수 입력 항목입니다.' : '좋아요, 제목이 입력되었습니다.'}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="edit-content">내용</label>
            <textarea
              id="edit-content"
              className={editTouched.content ? (editErrors.content ? 'input-error' : 'input-success') : ''}
              value={editPost.content}
              onBlur={() => setEditTouched((prev) => ({ ...prev, content: true }))}
              onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
              placeholder="내용을 입력하세요"
              rows={10}
            />
            <div className="form-meta-row">
              {editTouched.content && (
                <p className={`form-feedback ${editErrors.content ? 'error' : 'success'}`}>
                  {editErrors.content ? '내용은 비워둘 수 없습니다.' : '내용이 준비되었습니다.'}
                </p>
              )}
              <span className="char-count">{editPost.content.length}자</span>
            </div>
          </div>
          <div className="form-actions">
            <MotionButton type="button" className="btn-cancel" onClick={() => setView('detail')}>
              취소
            </MotionButton>
            <MotionButton type="submit" className="btn-submit">
              저장
            </MotionButton>
          </div>
        </form>
      )}
    </>
  ) : null;

  const writeView = (
    <>
      <h2 className="write-title">글쓰기</h2>
      {isLoading ? (
        renderFormSkeleton()
      ) : (
        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="author">작성자</label>
            <input
              id="author"
              type="text"
              className={newTouched.author ? (newErrors.author ? 'input-error' : 'input-success') : ''}
              value={newPost.author}
              onBlur={() => setNewTouched((prev) => ({ ...prev, author: true }))}
              onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
              placeholder="이름을 입력하세요"
            />
            {newTouched.author && (
              <p className={`form-feedback ${newErrors.author ? 'error' : 'success'}`}>
                {newErrors.author ? '작성자 이름을 입력해 주세요.' : '좋아요, 작성자 정보가 입력되었습니다.'}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              id="title"
              type="text"
              className={newTouched.title ? (newErrors.title ? 'input-error' : 'input-success') : ''}
              value={newPost.title}
              onBlur={() => setNewTouched((prev) => ({ ...prev, title: true }))}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="제목을 입력하세요"
            />
            {newTouched.title && (
              <p className={`form-feedback ${newErrors.title ? 'error' : 'success'}`}>
                {newErrors.title ? '제목을 입력해 주세요.' : '제목이 적절합니다.'}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              className={newTouched.content ? (newErrors.content ? 'input-error' : 'input-success') : ''}
              value={newPost.content}
              onBlur={() => setNewTouched((prev) => ({ ...prev, content: true }))}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="내용을 입력하세요"
              rows={10}
            />
            <div className="form-meta-row">
              {newTouched.content && (
                <p className={`form-feedback ${newErrors.content ? 'error' : 'success'}`}>
                  {newErrors.content ? '내용은 필수입니다.' : '내용이 준비되었습니다.'}
                </p>
              )}
              <span className="char-count">{newPost.content.length}자</span>
            </div>
          </div>
          <div className="form-actions">
            <MotionButton type="button" className="btn-cancel" onClick={handleBack}>
              취소
            </MotionButton>
            <MotionButton type="submit" className="btn-submit">
              등록
            </MotionButton>
          </div>
        </form>
      )}
    </>
  );

  const viewContent = {
    list: listView,
    detail: detailView,
    edit: editView,
    write: writeView,
  }[view] || null;

  return (
    <div className="board-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {viewContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Board;
