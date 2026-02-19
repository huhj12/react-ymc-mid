import React, { useState } from 'react';
import './Bulletin.css';

const defaultData = {
  churchName: '사랑의 교회',
  date: '2026년 2월 15일 주일',
  worshipTitle: '주일 예배',
  sermonTitle: '믿음으로 걷는 길',
  scripture: '히브리서 11:1-6',
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

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSaveToDb = async () => {
    try {
      let res;
      if (bulletinId) {
        res = await fetch(`${API_URL}/api/bulletin/${bulletinId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch(`${API_URL}/api/bulletin`, {
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
        <div className="church-symbol">✝</div>
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
            <input className="edit-input" value={data.scripture} onChange={(e) => updateField('scripture', e.target.value)} />
            <label>설교자</label>
            <input className="edit-input" value={data.pastor} onChange={(e) => updateField('pastor', e.target.value)} />
          </div>
        ) : (
          <div className="sermon-detail">
            <p className="sermon-title">"{data.sermonTitle}"</p>
            <p className="sermon-scripture">본문: {data.scripture}</p>
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
    </div>
  );
}

export default Bulletin;
