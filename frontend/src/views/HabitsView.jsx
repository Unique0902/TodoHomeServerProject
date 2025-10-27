import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHabitsByCategoryId,
  getTodayHabitCategory,
  toggleHabitCompletion,
} from '../api/habitApi';
import {
  getStartOfWeek,
  getWeekDays,
  getMonthLabel,
  formatDateString,
} from '../utils/calendarUtils';
import HabitItem from '../components/HabitItem';
import '../styles/TodosView.css'; // 캘린더, 섹션 스타일 재사용

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const HabitsView = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek());

  // 이 뷰에서 날짜를 선택하므로, 선택된 날짜 상태를 관리
  const [selectedDate, setSelectedDate] = useState(
    formatDateString(new Date())
  );
  const [selectedCategory, setSelectedCategory] = useState(null); // 선택된 날짜의 카테고리 정보

  const todayString = formatDateString(new Date());

  // --- 캘린더 로직 (TodosView와 동일) ---
  const weekDays = getWeekDays(currentWeekStart);
  const monthLabel = getMonthLabel(weekDays);

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    // 새로운 주를 로드할 때 해당 주의 첫날로 선택 날짜를 이동 (선택 사항)
    setSelectedDate(formatDateString(newStart));
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    setSelectedDate(formatDateString(newStart));
  };

  // --- 습관 데이터 로드 로직 ---
  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 모든 카테고리를 불러와 선택된 날짜에 해당하는 카테고리를 찾습니다.
      const allCategories = await getTodayHabitCategory(); // (getTodayHabitCategory는 모든 카테고리를 가져오는 API로 가정)
      const currentCategory = allCategories.find((cat) =>
        cat.selectedDates.some(
          (dateStr) =>
            new Date(dateStr).toDateString() ===
            new Date(selectedDate).toDateString()
        )
      );

      setSelectedCategory(currentCategory);

      if (currentCategory) {
        // 2. 해당 카테고리 ID로 습관 리스트를 로드합니다.
        const habitData = await getHabitsByCategoryId(currentCategory._id);
        setHabits(habitData);
      } else {
        setHabits([]);
      }
    } catch (err) {
      console.error('습관 데이터 로드 실패:', err);
      setError('습관 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchHabits();
  }, [selectedDate, fetchHabits]);

  // --- 습관 토글 로직 ---
  const handleToggle = async (habit, isCurrentlyCompleted) => {
    try {
      await toggleHabitCompletion(
        habit._id,
        !isCurrentlyCompleted,
        selectedDate
      );
      fetchHabits(); // 목록 갱신
    } catch (error) {
      alert('습관 완료 상태 업데이트 실패!');
    }
  };

  // 습관이 선택된 날짜에 완료되었는지 확인
  const isHabitCompletedOnSelectedDate = (habit) => {
    if (!habit.completedDates) return false;
    const selectedDayString = new Date(selectedDate).toDateString();
    return habit.completedDates.some(
      (dateStr) => new Date(dateStr).toDateString() === selectedDayString
    );
  };

  // 연필 버튼 클릭 시 카테고리 선택 뷰로 이동
  const handleCategoryEditClick = () => {
    navigate('/habit-categories');
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;

  return (
    <div className='habits-view'>
      <h1 className='main-title'>습관</h1>

      {/* 1. 캘린더 섹션 (TodosView 스타일 재사용) */}
      <div className='calendar-container'>
        <div className='month-navigation'>
          <button onClick={goToPreviousWeek} className='nav-button'>
            {'<'}
          </button>
          <span className='month-label'>{monthLabel}</span>
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

      {/* 2. 습관 카테고리 정보 및 연필 버튼 */}
      <section className='habit-list-section'>
        <div className='habit-header'>
          {/* 선택된 카테고리 이름 */}
          <span className='category-title'>
            {selectedCategory
              ? selectedCategory.title
              : '카테고리를 선택하세요'}
          </span>
          {/* 연필 버튼: 카테고리 선택/수정 페이지로 이동 */}
          <button
            className='category-edit-button'
            onClick={handleCategoryEditClick}
          >
            <span role='img' aria-label='edit'>
              ✏️
            </span>
          </button>
        </div>

        {/* 3. 습관 목록 */}
        <div className='habit-list'>
          {habits.length === 0 && selectedCategory && (
            <p className='empty-message'>선택된 카테고리에 습관이 없습니다!</p>
          )}
          {!selectedCategory && (
            <p className='empty-message'>
              상단 연필 버튼을 눌러 먼저 카테고리를 선택하세요.
            </p>
          )}

          {habits.map((habit) => (
            <HabitItem
              key={habit._id}
              habit={habit}
              // 체크박스 제외한 부분 클릭 시 상세 페이지로 이동
              onDetailClick={() => navigate(`/habits/${habit._id}`)}
              onToggle={(h) =>
                handleToggle(h, isHabitCompletedOnSelectedDate(h))
              }
              isCompletedToday={isHabitCompletedOnSelectedDate(habit)}
            />
          ))}
        </div>
      </section>

      {/* 4. 습관 추가 버튼 */}
      <button
        className='add-habit-button'
        onClick={() => navigate('/habits/add')}
      >
        +
      </button>
    </div>
  );
};

export default HabitsView;
