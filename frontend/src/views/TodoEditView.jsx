import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTodoById, updateTodo } from '../api/todoApi';
import '../styles/TodoAddView.css'; // Add/Edit View 스타일 재사용

// 날짜 및 시간 포맷팅 헬퍼 함수
const formatToLocalISO = (dateString) => {
  if (!dateString) return { date: '', time: '' };
  const date = new Date(dateString);

  // UTC 시간을 KST 로컬 시간으로 변환 (KST = UTC + 9)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  const datePart = localDate.toISOString().substring(0, 10);
  const timePart = localDate.toISOString().substring(11, 16);

  // 시간 정보가 00:00이면 시간이 없다고 간주하고 timePart를 비웁니다.
  // 이는 TodoAddView에서 시간 없이 날짜만 저장했을 때의 형태를 복구하기 위함입니다.
  if (timePart === '00:00') {
    return { date: datePart, time: '' };
  }

  return { date: datePart, time: timePart };
};

const TodoEditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDueDateActive, setIsDueDateActive] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);

  // 데이터 로드 및 폼 초기화
  const fetchAndPopulateTodo = useCallback(async () => {
    try {
      const data = await getTodoById(id);
      setTitle(data.title);
      setDescription(data.description || '');

      if (data.dueDate) {
        const { date, time } = formatToLocalISO(data.dueDate);
        setDueDate(date);
        setTime(time);
        // dueDate가 있으면 기한 활성화
        setIsDueDateActive(true);
      }
    } catch (err) {
      alert('수정할 할일을 불러오지 못했습니다.');
      navigate('/todos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAndPopulateTodo();
  }, [fetchAndPopulateTodo]);

  // 저장 버튼 (체크 버튼) 핸들러 (AddView 로직 재사용 + updateTodo API 사용)
  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목은 필수로 입력해야 합니다.');
      return;
    }

    let finalDueDate = null;
    if (isDueDateActive) {
      // 로컬 시간 기준으로 Date 객체 생성 (TodoAddView와 동일)
      const dateTimeString = `${dueDate}T${time || '00:00'}`;
      finalDueDate = new Date(dateTimeString);

      // 시간 정보가 없을 경우 (time이 빈 문자열일 경우)
      if (!time) {
        finalDueDate.setHours(0, 0, 0, 0);
      }
    }

    const todoData = {
      title,
      description: description.trim(),
      dueDate: finalDueDate,
    };

    try {
      await updateTodo(id, todoData); // 👈 수정 API 호출
      alert('할일이 성공적으로 수정되었습니다!');
      navigate(`/todos/${id}`); // 상세 페이지로 이동
    } catch (error) {
      console.error('할일 수정 실패:', error);
      alert('할일 수정 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;

  return (
    <div className='todo-add-view'>
      {' '}
      {/* 스타일 재사용 */}
      <header className='header-bar'>
        {/* 뒤로가기 버튼 */}
        <button className='back-button' onClick={() => navigate(-1)}>
          &lt;
        </button>
        <h1 className='title'>할일 수정</h1>
        {/* 저장(체크) 버튼 */}
        <button className='save-button' onClick={handleSave}>
          <span role='img' aria-label='save'>
            ✔️
          </span>
        </button>
      </header>
      {/* 나머지 폼 구조는 TodoAddView와 동일 */}
      <main className='form-section'>
        {/* 제목 입력 */}
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

        {/* 설명 입력 */}
        <div className='input-group'>
          <label>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='상세 내용을 입력하세요 (선택)'
            className='textarea-input'
          />
        </div>

        {/* 실행일/기한 활성화 토글 */}
        <div className='input-group toggle-group'>
          <label>실행일/기한</label>
          <button
            className={`toggle-button ${isDueDateActive ? 'active' : ''}`}
            onClick={() => setIsDueDateActive(!isDueDateActive)}
          >
            {isDueDateActive ? '기한 설정됨' : '기한 설정'}
          </button>
        </div>

        {/* 기한 입력 (활성화 시 표시되는 영역) */}
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

            {/* 시간 입력 */}
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

export default TodoEditView;
