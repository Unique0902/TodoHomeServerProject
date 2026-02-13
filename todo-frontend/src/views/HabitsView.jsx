import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHabitsByCategoryId,
  getTodayHabitCategory,
  toggleHabitCompletion,
  reorderHabits,
} from '../api/habitApi';
import {
  getStartOfWeek,
  getWeekDays,
  getMonthLabel,
  formatDateString,
} from '../utils/calendarUtils';
import HabitItem from '../components/HabitItem';
import '../styles/TodosView.css'; // 캘린더, 섹션 스타일 재사용
import '../styles/HabitsView.css';

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const HabitsView = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek());
  
  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);

  // 이 뷰에서 날짜를 선택하므로, 선택된 날짜 상태를 관리
  const [selectedDate, setSelectedDate] = useState(
    formatDateString(new Date())
  );
  const [selectedCategory, setSelectedCategory] = useState(null); // 선택된 날짜의 카테고리 정보
  const [showCongrats, setShowCongrats] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const todayString = formatDateString(new Date());

  // --- 캘린더 로직 (TodosView와 동일) ---
  const weekDays = getWeekDays(currentWeekStart);
  const monthLabel = getMonthLabel(weekDays);

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

  // --- 오늘의 습관 올클리어 축하 모달 ---
  useEffect(() => {
    // "오늘의 습관 카테고리" 조건: 선택된 날짜가 오늘
    if (selectedDate !== todayString) return;
    if (!selectedCategory) return;
    if (!habits || habits.length === 0) return;

    const allCompleted = habits.every((h) => isHabitCompletedOnSelectedDate(h));
    if (!allCompleted) return;

    const storageKey = `habitCongratsShown:${selectedCategory._id}:${selectedDate}`;
    if (localStorage.getItem(storageKey) === 'true') return;

    setShowCongrats(true);
    localStorage.setItem(storageKey, 'true');
  }, [habits, selectedCategory, selectedDate, todayString]);

  // --- 습관 토글 로직 ---
  const handleToggle = async (habit, isCurrentlyCompleted) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
    try {
      await toggleHabitCompletion(
        habit._id,
        !isCurrentlyCompleted,
        selectedDate
      );
      
      // 데이터 갱신
      await fetchHabits();
      
      // 스크롤 위치 복원
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
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

  // 연필 버튼 클릭 시 카테고리 선택 뷰로 이동 (선택된 날짜 전달)
  const handleCategoryEditClick = () => {
    navigate(`/habit-categories?date=${selectedDate}`);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    
    // 드래그 핸들에서 시작된 경우, 부모 habit-item을 찾아서 드래그 이미지로 설정
    const dragHandle = e.target.closest('.drag-handle');
    const habitItem = dragHandle ? dragHandle.closest('.habit-item') : e.currentTarget.closest('.habit-item');
    
    if (habitItem) {
      // 원본 요소를 복제하여 드래그 이미지로 사용
      const dragImage = habitItem.cloneNode(true);
      dragImage.style.width = habitItem.offsetWidth + 'px';
      dragImage.style.opacity = '0.9';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.left = '-1000px';
      dragImage.style.pointerEvents = 'none';
      dragImage.style.backgroundColor = '#fff';
      dragImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      dragImage.style.borderRadius = '4px';
      document.body.appendChild(dragImage);
      
      // 드래그 이미지 설정 (마우스 오프셋 조정)
      const itemRect = habitItem.getBoundingClientRect();
      const handleRect = dragHandle?.getBoundingClientRect();
      const offsetX = handleRect ? e.clientX - itemRect.left : 20;
      const offsetY = handleRect ? e.clientY - itemRect.top : itemRect.height / 2;
      
      e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
      
      // 드래그 종료 후 복제본 제거를 위해 setTimeout 사용
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    }
    
    // 드래그 중인 요소는 반투명하게
    if (habitItem) {
      habitItem.classList.add('dragging');
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 같은 인덱스면 무시
    if (draggedIndex === index) {
      // 같은 인덱스에서도 스타일 초기화
      const targetElement = e.currentTarget;
      targetElement.style.borderTop = '';
      targetElement.style.borderBottom = '';
      targetElement.style.paddingTop = '';
      targetElement.style.paddingBottom = '';
      return;
    }
    
    // 모든 습관 아이템의 스타일을 먼저 초기화
    const allItems = document.querySelectorAll('.habit-item');
    allItems.forEach((item) => {
      item.style.borderTop = '';
      item.style.borderBottom = '';
      item.style.paddingTop = '';
      item.style.paddingBottom = '';
    });
    
    setDragOverIndex(index);
    
    // 드롭 위치에 시각적 피드백 추가
    const targetElement = e.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const mouseY = e.clientY;
    const elementMiddle = rect.top + rect.height / 2;
    
    if (draggedIndex !== null && draggedIndex < index) {
      // 아래로 드래그하는 경우 - 마우스가 요소의 중간보다 아래에 있으면 아래쪽에 선 표시
      if (mouseY > elementMiddle) {
        targetElement.style.borderBottom = '2px solid #007bff';
        targetElement.style.borderTop = 'none';
        targetElement.style.paddingBottom = '20px';
        targetElement.style.paddingTop = '';
      } else {
        targetElement.style.borderTop = '2px solid #007bff';
        targetElement.style.borderBottom = 'none';
        targetElement.style.paddingTop = '20px';
        targetElement.style.paddingBottom = '';
      }
    } else if (draggedIndex !== null && draggedIndex > index) {
      // 위로 드래그하는 경우 - 마우스가 요소의 중간보다 위에 있으면 위쪽에 선 표시
      if (mouseY < elementMiddle) {
        targetElement.style.borderTop = '2px solid #007bff';
        targetElement.style.borderBottom = 'none';
        targetElement.style.paddingTop = '20px';
        targetElement.style.paddingBottom = '';
      } else {
        targetElement.style.borderBottom = '2px solid #007bff';
        targetElement.style.borderTop = 'none';
        targetElement.style.paddingBottom = '20px';
        targetElement.style.paddingTop = '';
      }
    }
  };

  const handleDragLeave = (e) => {
    // 다른 요소로 이동할 때 스타일 초기화
    const targetElement = e.currentTarget;
    // relatedTarget이 자식 요소인지 확인 (실제로 떠나는 경우만)
    if (!targetElement.contains(e.relatedTarget)) {
      targetElement.style.borderTop = '';
      targetElement.style.borderBottom = '';
      targetElement.style.paddingTop = '';
      targetElement.style.paddingBottom = '';
    }
  };

  const handleDragEnd = (e) => {
    // 모든 습관 아이템의 스타일 초기화
    const allItems = document.querySelectorAll('.habit-item');
    allItems.forEach((item) => {
      item.style.borderTop = '';
      item.style.borderBottom = '';
      item.style.paddingTop = '';
      item.style.paddingBottom = '';
      item.classList.remove('dragging');
    });
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    // 모든 습관 아이템의 스타일 초기화
    const allItems = document.querySelectorAll('.habit-item');
    allItems.forEach((item) => {
      item.style.borderTop = '';
      item.style.borderBottom = '';
      item.style.paddingTop = '';
      item.style.paddingBottom = '';
      item.classList.remove('dragging');
    });
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const targetElement = e.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const mouseY = e.clientY;
    const elementMiddle = rect.top + rect.height / 2;
    
    // 실제 드롭 위치 계산 - 파란색 선이 표시된 위치에 맞춰서
    let actualDropIndex = dropIndex;
    
    if (draggedIndex < dropIndex) {
      // 아래로 드래그하는 경우
      if (mouseY > elementMiddle) {
        // 마우스가 요소 중간보다 아래에 있으면 그 다음 위치
        actualDropIndex = dropIndex + 1;
      } else {
        // 마우스가 요소 중간보다 위에 있으면 그 위치
        actualDropIndex = dropIndex;
      }
    } else if (draggedIndex > dropIndex) {
      // 위로 드래그하는 경우
      if (mouseY < elementMiddle) {
        // 마우스가 요소 중간보다 위에 있으면 그 위치
        actualDropIndex = dropIndex;
      } else {
        // 마우스가 요소 중간보다 아래에 있으면 그 다음 위치
        actualDropIndex = dropIndex + 1;
      }
    }
    
    // 배열 범위 체크
    if (actualDropIndex > habits.length) {
      actualDropIndex = habits.length;
    }
    if (actualDropIndex < 0) {
      actualDropIndex = 0;
    }
    
    // 같은 위치면 변경 없음
    if (draggedIndex === actualDropIndex || (draggedIndex < actualDropIndex && actualDropIndex === draggedIndex + 1)) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newHabits = [...habits];
    const draggedHabit = newHabits[draggedIndex];
    
    // 배열에서 제거하고 새 위치에 삽입
    newHabits.splice(draggedIndex, 1);
    
    // 실제 드롭 인덱스 조정 (제거 후 인덱스가 변경될 수 있음)
    let insertIndex = actualDropIndex;
    if (draggedIndex < actualDropIndex) {
      insertIndex = actualDropIndex - 1;
    }
    
    newHabits.splice(insertIndex, 0, draggedHabit);

    // 순서 업데이트된 습관 ID 배열
    const habitIds = newHabits.map(h => h._id);

    try {
      // API 호출로 순서 업데이트
      await reorderHabits(habitIds);
      // 로컬 상태 업데이트
      setHabits(newHabits);
    } catch (error) {
      console.error('순서 변경 실패:', error);
      alert('순서 변경에 실패했습니다.');
      // 실패 시 원래 상태로 복구
      fetchHabits();
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
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

          {habits.map((habit, index) => (
            <HabitItem
              key={habit._id}
              index={index}
              habit={habit}
              onDetailClick={() => navigate(`/habits/${habit._id}`)}
              onToggle={(h) =>
                handleToggle(h, isHabitCompletedOnSelectedDate(h))
              }
              isCompletedToday={isHabitCompletedOnSelectedDate(habit)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
              dragOverIndex={dragOverIndex === index ? index : null}
            />
          ))}
        </div>
      </section>

      {/* 4. 습관 추가 버튼 */}
      <button
        className='add-habit-button'
        onClick={() => {
          // 선택된 카테고리가 있으면 쿼리 파라미터로 전달
          const url = selectedCategory
            ? `/habits/add?categoryId=${selectedCategory._id}`
            : '/habits/add';
          navigate(url);
        }}
      >
        +
      </button>

      {/* 축하 모달 */}
      {showCongrats && (
        <div
          className='congrats-overlay'
          onClick={() => setShowCongrats(false)}
          role='dialog'
          aria-modal='true'
        >
          <div className='congrats-modal' onClick={(e) => e.stopPropagation()}>
            <div className='congrats-confetti' />
            <div className='congrats-title'>축하합니다!</div>
            <div className='congrats-message'>오늘도 레벨업하셨습니다!</div>
            <button
              type='button'
              className='congrats-close-button'
              onClick={() => setShowCongrats(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsView;
