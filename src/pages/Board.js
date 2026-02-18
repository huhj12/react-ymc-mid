import React, { useState } from 'react';
import './Board.css';

function Board({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('list');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', author: '', content: '' });
  const [editPost, setEditPost] = useState({ title: '', content: '' });

  // 게시글 클릭 (조회수 증가)
  const handlePostClick = (post) => {
    const updated = { ...post, views: post.views + 1 };
    setPosts(posts.map(p => p.id === post.id ? updated : p));
    setSelectedPost(updated);
    setView('detail');
  };

  const handleWrite = () => {
    setNewPost({ title: '', author: '', content: '' });
    setView('write');
  };

  // 게시글 등록
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.author.trim() || !newPost.content.trim()) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    const post = {
      id: Date.now(),
      ...newPost,
      views: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts([post, ...posts]);
    setView('list');
  };

  // 게시글 삭제
  const handleDelete = (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setPosts(posts.filter(p => p.id !== id));
    setView('list');
    setSelectedPost(null);
  };

  const handleEdit = () => {
    setEditPost({ title: selectedPost.title, content: selectedPost.content });
    setView('edit');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editPost.title.trim() || !editPost.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    const updated = { ...selectedPost, ...editPost };
    setPosts(posts.map(p => p.id === updated.id ? updated : p));
    setSelectedPost(updated);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedPost(null);
  };

  const formatDate = (dateStr) => {
    return dateStr ? dateStr.substring(0, 10) : '';
  };

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
          {isAdmin && <button className="btn-delete" onClick={() => handleDelete(selectedPost.id)}>삭제</button>}
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
