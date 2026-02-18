import React, { useState, useEffect, useCallback } from 'react';
import './Board.css';

const API_URL = 'http://localhost:5000/api/posts';

function Board({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', author: '', content: '' });
  const [editPost, setEditPost] = useState({ title: '', content: '' });

  // 게시글 목록 불러오기
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.log('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 게시글 클릭 (상세 조회 + 조회수 증가)
  const handlePostClick = async (post) => {
    try {
      const res = await fetch(`${API_URL}/${post._id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPost(data);
        setView('detail');
        // 목록의 조회수도 갱신
        setPosts(posts.map(p => p._id === data._id ? data : p));
      }
    } catch (err) {
      console.log('게시글 조회 실패');
    }
  };

  const handleWrite = () => {
    setNewPost({ title: '', author: '', content: '' });
    setView('write');
  };

  // 게시글 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.author.trim() || !newPost.content.trim()) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        await fetchPosts();
        setView('list');
      } else {
        alert('등록에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 게시글 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPosts();
        setView('list');
        setSelectedPost(null);
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  const handleEdit = () => {
    setEditPost({ title: selectedPost.title, content: selectedPost.content });
    setView('edit');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPost.title.trim() || !editPost.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/${selectedPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPost),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedPost(updated);
        setPosts(posts.map(p => p._id === updated._id ? updated : p));
        setView('detail');
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  const handleBack = () => {
    setView('list');
    setSelectedPost(null);
  };

  const formatDate = (dateStr) => {
    return dateStr ? dateStr.substring(0, 10) : '';
  };

  if (loading) {
    return <div className="board-loading">게시판을 불러오는 중...</div>;
  }

  // 글 목록 화면
  if (view === 'list') {
    return (
      <div className="board-container">
        <div className="board-header">
          <h2 className="board-title">게시판</h2>
          {isAdmin && <button className="btn-write" onClick={handleWrite}>글쓰기</button>}
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
            {posts.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-message">
                  게시글이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <tr key={post._id} onClick={() => handlePostClick(post)} className="post-row">
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
      </div>
    );
  }

  // 글 상세 화면
  if (view === 'detail' && selectedPost) {
    return (
      <div className="board-container">
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
        <div className="detail-actions">
          <button className="btn-back" onClick={handleBack}>목록으로</button>
          {isAdmin && <button className="btn-edit" onClick={handleEdit}>수정</button>}
          {isAdmin && <button className="btn-delete" onClick={() => handleDelete(selectedPost._id)}>삭제</button>}
        </div>
      </div>
    );
  }

  // 글 수정 화면
  if (view === 'edit' && selectedPost) {
    return (
      <div className="board-container">
        <h2 className="write-title">글 수정</h2>
        <form className="write-form" onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label htmlFor="edit-title">제목</label>
            <input
              id="edit-title"
              type="text"
              value={editPost.title}
              onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-content">내용</label>
            <textarea
              id="edit-content"
              value={editPost.content}
              onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
              placeholder="내용을 입력하세요"
              rows={10}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => setView('detail')}>취소</button>
            <button type="submit" className="btn-submit">저장</button>
          </div>
        </form>
      </div>
    );
  }

  // 글쓰기 화면
  if (view === 'write') {
    return (
      <div className="board-container">
        <h2 className="write-title">글쓰기</h2>
        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="author">작성자</label>
            <input
              id="author"
              type="text"
              value={newPost.author}
              onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
              placeholder="이름을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              id="title"
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="내용을 입력하세요"
              rows={10}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleBack}>취소</button>
            <button type="submit" className="btn-submit">등록</button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}

export default Board;
