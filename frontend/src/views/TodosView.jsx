import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodos, updateTodoStatus } from '../api/todoApi';
import TodoItem from '../components/TodoItem';
import {
  getStartOfWeek,
  getWeekDays,
  getMonthLabel,
  formatDateString,
} from '../utils/calendarUtils';
import '../styles/TodosView.css';

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const TodosView = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  // 현재 주의 시작 날짜 (Date 객체)
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek());
  // 현재 선택된 날짜 (YYYY-MM-DD 문자열)
  const [selectedDate, setSelectedDate] = useState(
    formatDateString(new Date())
  );

  // --- 캘린더 로직 ---
  const weekDays = getWeekDays(currentWeekStart);
  const monthLabel = getMonthLabel(weekDays);
  const todayString = formatDateString(new Date());

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // --- 할일 로딩 및 토글 로직 ---
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      // 선택된 날짜 기준으로 API 호출
      const data = await getTodos(selectedDate);
      setTodos(data);
    } catch (err) {
      console.error('Todo 로드 실패:', err);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const handleToggle = async (todo) => {
    try {
      await updateTodoStatus(todo._id, !todo.isCompleted);
      fetchTodos(); // 목록 갱신
    } catch (error) {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  useEffect(() => {
    // 주가 바뀔 때, 선택된 날짜가 그 주에 포함되도록 조정 (선택된 날짜를 유지하거나 주의 첫날로 변경 가능)
    // 여기서는 선택된 날짜를 유지하며 그 날짜의 데이터만 불러옵니다.
    fetchTodos();
  }, [currentWeekStart, selectedDate, fetchTodos]);

  // 할일 목록 분리
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  return (
    <div className='todos-view'>
      <h1 className='main-title'>할일</h1>

      {/* 1. 캘린더 섹션 */}
      <div className='calendar-container'>
        <div className='month-navigation'>
          {/* 이전 주 버튼 */}
          <button onClick={goToPreviousWeek} className='nav-button'>
            {'<'}
          </button>
          {/* 월 정보 */}
          <span className='month-label'>{monthLabel}</span>
          {/* 다음 주 버튼 */}
          <button onClick={goToNextWeek} className='nav-button'>
            {'>'}
          </button>
        </div>

        <div className='week-days'>
          {weekDays.map((date, index) => {
            const dateString = formatDateString(date);
            const isSelected = dateString === selectedDate;
            const isToday = dateString === todayString;

            return (
              <div
                key={index}
                className={`day-cell ${isSelected ? 'selected' : ''} ${
                  isToday ? 'today' : ''
                }`}
                onClick={() => setSelectedDate(dateString)}
              >
                <div className='day-label'>{dayLabels[index]}</div>
                <div className='date-number'>{date.getDate()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 할일 목록 섹션 */}
      <section className='todo-list-section'>
        <h2 className='section-title'>할일</h2>

        {loading && <p className='loading-message'>할일 불러오는 중...</p>}

        <div className='todo-list active-list'>
          {activeTodos.length === 0 && !loading && (
            <p className='empty-message'>선택된 날짜에 할일이 없습니다!</p>
          )}
          {activeTodos.map((todo) => (
            <TodoItem key={todo._id} todo={todo} onToggle={handleToggle} />
          ))}
        </div>
      </section>

      {/* 3. 완료 목록 섹션 */}
      <section className='completed-section'>
        <h2 className='section-title completed-label'>완료</h2>
        <div className='todo-list completed-list'>
          {completedTodos.map((todo) => (
            <TodoItem key={todo._id} todo={todo} onToggle={handleToggle} />
          ))}
        </div>
      </section>

      {/* 4. 할일 추가 버튼 */}
      <button
        className='add-todo-button'
        onClick={() => navigate('/todos/add')} // 할일 추가 페이지로 이동
      >
        +
      </button>
    </div>
  );
};

export default TodosView;
