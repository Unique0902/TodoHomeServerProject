import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTodos,
  updateTodoStatus,
  getTodosWithoutDate,
  getOverdueTodos,
  updateTodo,
} from '../api/todoApi';
import { getProjects } from '../api/projectApi';
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
  const [todosWithoutDate, setTodosWithoutDate] = useState([]); // 수행일 없는 할일
  const [overdueTodos, setOverdueTodos] = useState([]); // 실행일이 지난 미완료 할일
  const [projects, setProjects] = useState([]); // 프로젝트 목록
  const [loading, setLoading] = useState(false);
  const [loadingWithoutDate, setLoadingWithoutDate] = useState(false);
  const [loadingOverdue, setLoadingOverdue] = useState(false);

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
    
    // 현재 선택된 날짜의 요일을 유지
    const currentSelectedDate = new Date(selectedDate);
    const dayOfWeek = currentSelectedDate.getDay(); // 0(일) ~ 6(토)
    
    // 새로운 주의 시작일(일요일)에서 해당 요일만큼 더한 날짜
    const newSelectedDate = new Date(newStart);
    newSelectedDate.setDate(newStart.getDate() + dayOfWeek);
    setSelectedDate(formatDateString(newSelectedDate));
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    
    // 현재 선택된 날짜의 요일을 유지
    const currentSelectedDate = new Date(selectedDate);
    const dayOfWeek = currentSelectedDate.getDay(); // 0(일) ~ 6(토)
    
    // 새로운 주의 시작일(일요일)에서 해당 요일만큼 더한 날짜
    const newSelectedDate = new Date(newStart);
    newSelectedDate.setDate(newStart.getDate() + dayOfWeek);
    setSelectedDate(formatDateString(newSelectedDate));
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

  // 수행일 없는 할일 로딩
  const fetchTodosWithoutDate = useCallback(async () => {
    setLoadingWithoutDate(true);
    try {
      const data = await getTodosWithoutDate();
      setTodosWithoutDate(data);
    } catch (err) {
      console.error('수행일 없는 Todo 로드 실패:', err);
      setTodosWithoutDate([]);
    } finally {
      setLoadingWithoutDate(false);
    }
  }, []);

  // 실행일이 지난 미완료 할일 로딩
  const fetchOverdueTodos = useCallback(async () => {
    setLoadingOverdue(true);
    try {
      const data = await getOverdueTodos();
      setOverdueTodos(data);
    } catch (err) {
      console.error('지난 할일 로드 실패:', err);
      setOverdueTodos([]);
    } finally {
      setLoadingOverdue(false);
    }
  }, []);

  // 프로젝트 목록 로딩 (모든 프로젝트, 하위 프로젝트 포함)
  // 할일 페이지에서는 모든 프로젝트를 로드해야 projectMap에 포함시킬 수 있음
  const fetchProjects = useCallback(async () => {
    try {
      // 옵션 없이 호출하면 모든 프로젝트 반환 (하위 프로젝트 포함)
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
      setProjects([]);
    }
  }, []);

  const handleToggle = async (todo) => {
    try {
      await updateTodoStatus(todo._id, !todo.isCompleted);
      fetchTodos(); // 날짜별 목록 갱신
      fetchTodosWithoutDate(); // 수행일 없는 목록 갱신
      fetchOverdueTodos(); // 지난 할일 목록 갱신
    } catch (error) {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // 오늘 날짜로 설정 핸들러 (기한 없는 할일을 오늘 날짜로 설정)
  const handleSetToday = async (todo) => {
    try {
      // 오늘 날짜를 UTC 00:00:00으로 설정 (시간 없이 날짜만)
      const today = new Date();
      const todayString = formatDateString(today);
      const todayUTC = new Date(todayString + 'T00:00:00.000Z');
      
      await updateTodo(todo._id, {
        dueDate: todayUTC,
      });
      
      // 목록 갱신
      fetchTodos(); // 날짜별 목록 갱신
      fetchTodosWithoutDate(); // 수행일 없는 목록 갱신
      fetchOverdueTodos(); // 지난 할일 목록 갱신
    } catch (error) {
      alert('날짜 설정에 실패했습니다.');
    }
  };

  useEffect(() => {
    // 주가 바뀔 때, 선택된 날짜가 그 주에 포함되도록 조정 (선택된 날짜를 유지하거나 주의 첫날로 변경 가능)
    // 여기서는 선택된 날짜를 유지하며 그 날짜의 데이터만 불러옵니다.
    fetchTodos();
    fetchTodosWithoutDate();
    fetchOverdueTodos();
    fetchProjects();
  }, [
    currentWeekStart,
    selectedDate,
    fetchTodos,
    fetchTodosWithoutDate,
    fetchOverdueTodos,
    fetchProjects,
  ]);

  // 할일 목록 분리
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  // 프로젝트 Map 생성 (ID를 키로 사용)
  const projectMap = new Map(projects.map((project) => [project._id, project]));

  // 수행일 없는 할일 목록 (완료되지 않은 것만, 진행중인 프로젝트의 할일만)
  const activeTodosWithoutDate = todosWithoutDate.filter((todo) => {
    // 완료되지 않은 할일만
    if (todo.isCompleted) return false;
    
    // 프로젝트가 없는 할일은 표시
    if (!todo.projectId) return true;
    
    // 프로젝트가 있는 경우, 진행중(active) 상태인 프로젝트의 할일만 표시
    const project = projectMap.get(todo.projectId);
    if (!project) return true; // 프로젝트를 찾을 수 없으면 표시
    
    // status가 없으면 isCompleted로 판단 (기존 데이터 호환성)
    const projectStatus = project.status || (project.isCompleted ? 'completed' : 'active');
    return projectStatus === 'active';
  });

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

      {/* 2. 할일 목록 섹션 (선택된 날짜의 할일) */}
      <section className='todo-list-section'>
        <h2 className='section-title'>할일</h2>

        {loading && <p className='loading-message'>할일 불러오는 중...</p>}

        <div className='todo-list active-list'>
          {activeTodos.length === 0 && !loading && (
            <p className='empty-message'>선택된 날짜에 할일이 없습니다!</p>
          )}
          {activeTodos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handleToggle}
              projectMap={projectMap}
            />
          ))}
        </div>
      </section>

      {/* 3. 해야할리스트 섹션 (수행일이 없는 할일) */}
      {activeTodosWithoutDate.length > 0 && (
        <section className='todo-list-section'>
          <h2 className='section-title'>해야할리스트</h2>
          <div className='todo-list active-list'>
            {activeTodosWithoutDate.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleToggle}
                projectMap={projectMap}
                onSetToday={handleSetToday}
                showTodayButton={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. 지난 할일 섹션 (실행일이 지난 미완료 할일) */}
      {overdueTodos.length > 0 && (
        <section className='todo-list-section'>
          <h2 className='section-title'>지난 할일</h2>
          <div className='todo-list active-list'>
            {overdueTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleToggle}
                projectMap={projectMap}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. 완료 목록 섹션 */}
      <section className='completed-section'>
        <h2 className='section-title completed-label'>완료</h2>
        <div className='todo-list completed-list'>
          {completedTodos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handleToggle}
              projectMap={projectMap}
            />
          ))}
        </div>
      </section>

      {/* 5. 할일 추가 버튼 */}
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
