import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createTodo } from '../api/todoApi';
import '../styles/TodoAddView.css';
import { useMemo } from 'react';

// 오늘 날짜를 YYYY-MM-DD 형식의 문자열로 반환
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TodoAddView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // 👈 쿼리 파라미터 훅 사용

  // 쿼리 파라미터에서 projectId와 projectName 가져오기
  const projectId = useMemo(
    () => searchParams.get('projectId'),
    [searchParams]
  );
  const projectName = useMemo(
    () => searchParams.get('projectName'),
    [searchParams]
  );

  // 폼 상태 관리
  const [title, setTitle] = useState(''); // 프로젝트명을 제목에 붙이지 않음
  // ... (나머지 상태 유지) ...
  const [description, setDescription] = useState('');
  // 실행일/기한 타입 선택: 'none', 'dueDate', 'period'
  const [dateType, setDateType] = useState('none');
  // 실행일 관련
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [dueTime, setDueTime] = useState('');
  // 기한 관련
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [endTime, setEndTime] = useState('');

  // 저장 버튼 (체크 버튼) 핸들러
  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목은 필수로 입력해야 합니다.');
      return;
    }

    const todoData = {
      title,
      description: description.trim(),
      projectId: projectId || null,
    };

    // 실행일/기한 필드 구성
    if (dateType === 'dueDate') {
      // 실행일 설정
      if (dueTime) {
        // 시간이 있는 경우: 로컬 시간으로 Date 객체 생성
        const dateTimeString = `${dueDate}T${dueTime}`;
        todoData.dueDate = new Date(dateTimeString);
      } else {
        // 시간이 없는 경우: UTC 기준으로 해당 날짜의 00:00:00으로 저장
        todoData.dueDate = new Date(dueDate + 'T00:00:00.000Z');
      }
    } else if (dateType === 'period') {
      // 기한 검증
      // 1. 마감 날짜가 시작 날짜보다 이후인지 확인
      if (endDate < startDate) {
        alert('마감 날짜는 시작 날짜보다 이후여야 합니다.');
        return;
      }
      
      // 2. 시작 날짜와 마감 날짜가 같을 경우 시간 검증
      if (startDate === endDate) {
        if (!startTime || !endTime) {
          alert('시작 날짜와 마감 날짜가 같을 경우, 시작 시간과 마감 시간을 모두 입력해야 합니다.');
          return;
        }
        
        // 3. 마감 시간이 시작 시간보다 이후여야 함
        if (endTime <= startTime) {
          alert('마감 시간은 시작 시간보다 이후여야 합니다.');
          return;
        }
      }
      
      // 기한 설정
      if (startTime) {
        const dateTimeString = `${startDate}T${startTime}`;
        todoData.startDate = new Date(dateTimeString);
      } else {
        todoData.startDate = new Date(startDate + 'T00:00:00.000Z');
      }
      
      if (endTime) {
        const dateTimeString = `${endDate}T${endTime}`;
        todoData.endDate = new Date(dateTimeString);
      } else {
        todoData.endDate = new Date(endDate + 'T00:00:00.000Z');
      }
    }

    try {
      await createTodo(todoData);
      alert('할일이 성공적으로 추가되었습니다!');

      // --- [핵심 수정: 이동 경로] ---
      if (projectId) {
        // 프로젝트 ID가 있다면, 해당 프로젝트 상세 페이지로 이동
        navigate(`/projects/${projectId}`, { replace: true });
      } else {
        // 없다면, 일반 할일 목록 페이지로 이동
        navigate('/todos', { replace: true });
      }
      // ---------------------------------
    } catch (error) {
      console.error('할일 추가 실패:', error);
      alert('할일 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className='todo-add-view'>
      <header className='header-bar'>
        {/* ... (뒤로가기, 제목, 저장 버튼 유지) ... */}
        <button className='back-button' onClick={() => navigate(-1)}>
          &lt;
        </button>
        <h1 className='title'>할일 추가</h1>
        <button className='save-button' onClick={handleSave}>
          <span role='img' aria-label='save'>
            ✔️
          </span>
        </button>
      </header>

      <main className='form-section'>
        {/* 3. 제목 입력 */}
        <div className='input-group'>
          <label>제목</label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='필수 입력'
            className='text-input'
          />
        </div>

        {/* 4. 설명 입력 */}
        <div className='input-group'>
          <label>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='상세 내용을 입력하세요 (선택)'
            className='textarea-input'
          />
        </div>

        {/* 5. 실행일/기한 타입 선택 */}
        <div className='input-group'>
          <label>실행일/기한</label>
          <div className='radio-group' style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type='radio'
                name='dateType'
                value='none'
                checked={dateType === 'none'}
                onChange={(e) => setDateType(e.target.value)}
              />
              없음
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type='radio'
                name='dateType'
                value='dueDate'
                checked={dateType === 'dueDate'}
                onChange={(e) => setDateType(e.target.value)}
              />
              실행일
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type='radio'
                name='dateType'
                value='period'
                checked={dateType === 'period'}
                onChange={(e) => setDateType(e.target.value)}
              />
              기한
            </label>
          </div>
        </div>

        {/* 6. 실행일 입력 (실행일 선택 시 표시) */}
        {dateType === 'dueDate' && (
          <>
            <div className='input-group date-input-group'>
              <label>실행일</label>
              <input
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className='date-input'
              />
            </div>
            <div className='input-group time-input-group'>
              <label>실행 시간 (선택)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type='time'
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className='time-input'
                  style={{ flex: 1 }}
                />
                {dueTime && (
                  <button
                    type='button'
                    onClick={() => setDueTime('')}
                    style={{
                      background: 'none',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666'
                    }}
                    title='시간 삭제'
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* 7. 기한 입력 (기한 선택 시 표시) */}
        {dateType === 'period' && (
          <>
            <div className='input-group date-input-group'>
              <label>시작 날짜</label>
              <input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className='date-input'
              />
            </div>
            <div className='input-group time-input-group'>
              <label>시작 시간 (선택)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type='time'
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className='time-input'
                  style={{ flex: 1 }}
                />
                {startTime && (
                  <button
                    type='button'
                    onClick={() => setStartTime('')}
                    style={{
                      background: 'none',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666'
                    }}
                    title='시간 삭제'
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className='input-group date-input-group'>
              <label>마감 날짜</label>
              <input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className='date-input'
              />
            </div>
            <div className='input-group time-input-group'>
              <label>마감 시간 (선택)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type='time'
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className='time-input'
                  style={{ flex: 1 }}
                />
                {endTime && (
                  <button
                    type='button'
                    onClick={() => setEndTime('')}
                    style={{
                      background: 'none',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666'
                    }}
                    title='시간 삭제'
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TodoAddView;
