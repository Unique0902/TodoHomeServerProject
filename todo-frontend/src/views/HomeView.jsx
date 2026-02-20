import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // 페이지 이동을 위해 추가
import { getTodos, updateTodoStatus } from '../api/todoApi';
import {
  getHabitsByCategoryId,
  getTodayHabitCategory,
  toggleHabitCompletion,
} from '../api/habitApi'; // Habit API 임포트
import { getProjects } from '../api/projectApi';
import { useDarkMode } from '../contexts/DarkModeContext';
import TodoItem from '../components/TodoItem';
import HabitItem from '../components/HabitItem';
import '../styles/HomeView.css';

// 날짜 포맷팅 함수 (YYYY-MM-DD)
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HomeView = () => {
  const navigate = useNavigate(); // 페이지 이동 훅
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [todos, setTodos] = useState([]);
  const [habits, setHabits] = useState([]);
  const [projects, setProjects] = useState([]); // 프로젝트 목록
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayCategory, setTodayCategory] = useState(null); // 오늘 선택된 습관 카테고리
  
  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);

  const todayString = getTodayDateString();

  // --- 1. 데이터 로딩 로직 ---
  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. TODO 데이터 로드
      const todoData = await getTodos(todayString);
      setTodos(todoData);

      // 1-1. 프로젝트 목록 로드
      const projectData = await getProjects();
      setProjects(projectData);

      // 2. Habit Category 데이터 로드 (클라이언트 로직이 복잡하므로 임시 처리)
      const allCategories = await getTodayHabitCategory();

      // **[핵심 로직] 오늘 날짜에 해당하는 습관 카테고리를 찾는 로직 (임시)**
      const currentCategory = allCategories.find(
        (cat) =>
          cat.selectedDates &&
          cat.selectedDates.some(
            (date) =>
              new Date(date).toDateString() ===
              new Date(todayString).toDateString()
          )
      );

      setTodayCategory(currentCategory);

      // 3. HABIT 데이터 로드 (선택된 카테고리 기반)
      if (currentCategory) {
        const habitData = await getHabitsByCategoryId(currentCategory._id);
        setHabits(habitData);
      } else {
        setHabits([]); // 선택된 카테고리가 없으면 빈 배열
      }
    } catch (err) {
      console.error(err);
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [todayString]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // --- 2. 할일 (Todo) 토글 로직 ---
  const handleTodoToggle = async (todo) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
    try {
      await updateTodoStatus(todo._id, !todo.isCompleted);
      
      // 데이터 갱신
      await fetchHomeData();
      
      // DOM 업데이트가 완료될 때까지 기다린 후 스크롤 위치 복원
      // 여러 번의 requestAnimationFrame을 사용하여 리렌더링 완료 보장
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPositionRef.current);
          });
        });
      });
    } catch (error) {
      alert('할일 상태 업데이트 실패!');
    }
  };

  // --- 3. 습관 (Habit) 토글 로직 ---
  const handleHabitToggle = async (habit, isCurrentlyCompleted) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
    try {
      // isCurrentlyCompleted: DB의 completedDates 배열에 오늘 날짜가 있는지 여부
      await toggleHabitCompletion(
        habit._id,
        !isCurrentlyCompleted,
        todayString
      );
      
      // 데이터 갱신
      await fetchHomeData();
      
      // DOM 업데이트가 완료될 때까지 기다린 후 스크롤 위치 복원
      // 여러 번의 requestAnimationFrame을 사용하여 리렌더링 완료 보장
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPositionRef.current);
          });
        });
      });
    } catch (error) {
      alert('습관 완료 상태 업데이트 실패!');
    }
  };

  // --- 4. 연필 버튼 클릭 핸들러 (수정된 부분) ---
  const handleCategoryEditClick = () => {
    // 와이어프레임의 '카테고리 선택' 페이지로 이동
    navigate('/habit-categories');
  };
  // ------------------------------------------

  // --- 5. 렌더링 로직 ---
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  // 프로젝트 Map 생성 (ID를 키로 사용)
  const projectMap = new Map(projects.map((project) => [project._id, project]));

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;

  // 습관이 오늘 완료되었는지 확인하는 헬퍼 함수
  const isHabitCompletedToday = (habit) => {
    if (!habit.completedDates) return false;
    // completedDates 배열을 순회하며 오늘 날짜와 일치하는 항목이 있는지 확인
    return habit.completedDates.some(
      (dateStr) =>
        new Date(dateStr).toDateString() ===
        new Date(todayString).toDateString()
    );
  };

  return (
    <div className='home-view'>
      <header className='header-section'>
        <h1 className='main-title'>Home</h1>
        <div className='date-info'>
          <span className='date-label'>오늘</span>
          <span className='current-date'>{todayString}</span>
        </div>
      </header>

      {/* 할일 (Todo) 섹션 */}
      <section className='todo-section'>
        <h2 className='section-title'>할일</h2>
        <div className='todo-list active-list'>
          {activeTodos.length === 0 && (
            <p className='empty-message'>오늘 할일이 없습니다!</p>
          )}
          {activeTodos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handleTodoToggle}
              projectMap={projectMap}
            />
          ))}
        </div>
      </section>

      {/* 습관 (Habit) 섹션 */}
      <section className='habit-section'>
        <h2 className='section-title'>습관</h2>
        <div className='habit-header'>
          <div className='habit-category-info'>
            {/* 와이어프레임의 '평일' 텍스트에 해당하는 부분 */}
            <span className='category-title'>
              {todayCategory ? todayCategory.title : '선택된 카테고리 없음'}
            </span>
          </div>
          {/* 평일/연필 아이콘 버튼 */}
          <button
            className='category-edit-button'
            onClick={handleCategoryEditClick} // 수정된 핸들러 사용
          >
            {/* 연필 아이콘 (임시) */}
            <span role='img' aria-label='edit'>
              ✏️
            </span>
          </button>
        </div>

        {/* 습관 목록 */}
        <div className='habit-list'>
          {habits.length === 0 && (
            <p className='empty-message'>오늘의 습관이 없습니다!</p>
          )}
          {habits.map((habit) => (
            <HabitItem
              key={habit._id}
              habit={habit}
              todayString={todayString}
              onToggle={(h) => handleHabitToggle(h, isHabitCompletedToday(h))}
              isCompletedToday={isHabitCompletedToday(habit)}
            />
          ))}
        </div>
      </section>

      {/* 완료 할일 목록 */}
      <section className='completed-section'>
        <h2 className='section-title completed-label'>
          완료 {completedTodos.length > 0 ? `(${completedTodos.length})` : ''}
        </h2>
        <div className='todo-list completed-list'>
          {completedTodos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handleTodoToggle}
              projectMap={projectMap}
            />
          ))}
        </div>
      </section>

      {/* 다크모드 토글 버튼 */}
      <section className='dark-mode-section'>
        <button className='dark-mode-toggle' onClick={toggleDarkMode}>
          {isDarkMode ? '☀️ 라이트 모드' : '🌙 다크 모드'}
        </button>
      </section>
    </div>
  );
};

export default HomeView;
