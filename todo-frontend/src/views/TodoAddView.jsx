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

  // 폼 상태 관리 (기존 상태 유지)
  const [title, setTitle] = useState(projectName ? `${projectName} - ` : ''); // 프로젝트 이름으로 제목 기본값 설정
  // ... (나머지 상태 유지) ...
  const [description, setDescription] = useState('');
  const [isDueDateActive, setIsDueDateActive] = useState(false);
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [time, setTime] = useState('');

  // 저장 버튼 (체크 버튼) 핸들러
  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목은 필수로 입력해야 합니다.');
      return;
    }

    // 1. dueDate 필드 구성
    let finalDueDate = null;
    if (isDueDateActive) {
      // --- [핵심 수정 부분] ---
      // 2025-10-27T10:00과 같은 문자열을 생성하여 로컬 시간으로 Date 객체를 만듭니다.
      const dateTimeString = `${dueDate}T${time || '00:00'}`;
      finalDueDate = new Date(dateTimeString);

      // 중요: 만약 Node.js에서 이 로컬 시간을 UTC로 저장할 경우,
      // KST 시간인 finalDueDate를 DB에 저장할 때 Mongoose가 자동으로 UTC로 변환하여 저장합니다.
      // 예를 들어, KST 20시 00분 -> UTC 11시 00분으로 저장됨. (이게 정상)

      // 시간 정보가 없을 경우 (time이 빈 문자열일 경우)
      if (!time) {
        finalDueDate.setHours(0, 0, 0, 0); // 해당 날짜 0시 KST로 설정
      }
    }

    const todoData = {
      title,
      description: description.trim(),
      dueDate: finalDueDate,
      projectId: projectId || null, // 👈 projectId가 있다면 추가
    };

    try {
      await createTodo(todoData);
      alert('할일이 성공적으로 추가되었습니다!');

      // --- [핵심 수정: 이동 경로] ---
      if (projectId) {
        // 프로젝트 ID가 있다면, 해당 프로젝트 상세 페이지로 이동
        navigate(`/projects/${projectId}`);
      } else {
        // 없다면, 일반 할일 목록 페이지로 이동
        navigate('/todos');
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

        {/* 5. 실행일/기한 활성화 토글 */}
        <div className='input-group toggle-group'>
          <label>실행일/기한</label>
          <button
            className={`toggle-button ${isDueDateActive ? 'active' : ''}`}
            onClick={() => setIsDueDateActive(!isDueDateActive)}
          >
            {isDueDateActive ? '기한 설정됨' : '기한 설정'}
          </button>
        </div>

        {/* 6. 기한 입력 (활성화 시 표시되는 영역) */}
        {isDueDateActive && (
          <>
            <div className='input-group date-input-group'>
              <label>날짜</label>
              <input
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className='date-input'
              />
            </div>

            {/* 7. 시간 입력 */}
            <div className='input-group time-input-group'>
              <label>시간</label>
              <input
                type='time'
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className='time-input'
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TodoAddView;
