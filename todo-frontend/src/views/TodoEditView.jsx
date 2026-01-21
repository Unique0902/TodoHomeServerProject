import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTodoById, updateTodo } from '../api/todoApi';
import '../styles/TodoAddView.css'; // Add/Edit View 스타일 재사용

// 날짜 및 시간 포맷팅 헬퍼 함수
const formatToLocalISO = (dateString) => {
  if (!dateString) return { date: '', time: '' };
  const date = new Date(dateString);

  // UTC로 저장된 날짜만 있는 경우 확인 (UTC 00:00:00)
  // 예: 2025-01-15T00:00:00.000Z
  const isUTCOnly = dateString.endsWith('Z') && 
                    dateString.includes('T00:00:00');

  if (isUTCOnly) {
    // UTC 날짜만 있는 경우: 날짜 부분만 추출 (YYYY-MM-DD)
    const datePart = dateString.substring(0, 10);
    return { date: datePart, time: '' };
  }

  // 시간이 있는 경우: 로컬 시간으로 변환하여 표시
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
};

const TodoEditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // 실행일/기한 타입 선택: 'none', 'dueDate', 'period'
  const [dateType, setDateType] = useState('none');
  // 실행일 관련
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  // 기한 관련
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);

  // 데이터 로드 및 폼 초기화
  const fetchAndPopulateTodo = useCallback(async () => {
    try {
      const data = await getTodoById(id);
      setTitle(data.title);
      setDescription(data.description || '');

      // 실행일/기한 타입 확인
      if (data.dueDate) {
        // 실행일이 있는 경우
        const { date, time } = formatToLocalISO(data.dueDate);
        setDueDate(date);
        setDueTime(time);
        setDateType('dueDate');
      } else if (data.startDate || data.endDate) {
        // 기한이 있는 경우
        if (data.startDate) {
          const { date, time } = formatToLocalISO(data.startDate);
          setStartDate(date);
          setStartTime(time);
        }
        if (data.endDate) {
          const { date, time } = formatToLocalISO(data.endDate);
          setEndDate(date);
          setEndTime(time);
        }
        setDateType('period');
      } else {
        // 둘 다 없는 경우
        setDateType('none');
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

    const todoData = {
      title,
      description: description.trim(),
    };

    // 실행일/기한 필드 구성
    if (dateType === 'dueDate') {
      // 실행일 설정
      if (dueTime) {
        const dateTimeString = `${dueDate}T${dueTime}`;
        todoData.dueDate = new Date(dateTimeString);
      } else {
        todoData.dueDate = new Date(dueDate + 'T00:00:00.000Z');
      }
      // 기존 기한 필드 제거
      todoData.startDate = null;
      todoData.endDate = null;
    } else if (dateType === 'period') {
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
      // 기존 실행일 필드 제거
      todoData.dueDate = null;
    } else {
      // 둘 다 없음
      todoData.dueDate = null;
      todoData.startDate = null;
      todoData.endDate = null;
    }

    try {
      await updateTodo(id, todoData); // 👈 수정 API 호출
      alert('할일이 성공적으로 수정되었습니다!');
      // 수정 페이지와 원래 상세 페이지를 모두 건너뛰고 그 이전 페이지로 이동
      navigate(-2); // 프로젝트 상세 페이지나 할일 목록 페이지로 이동
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

        {/* 실행일/기한 타입 선택 */}
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

        {/* 실행일 입력 (실행일 선택 시 표시) */}
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
              <input
                type='time'
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className='time-input'
              />
            </div>
          </>
        )}

        {/* 기한 입력 (기한 선택 시 표시) */}
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
              <input
                type='time'
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className='time-input'
              />
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
              <input
                type='time'
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
