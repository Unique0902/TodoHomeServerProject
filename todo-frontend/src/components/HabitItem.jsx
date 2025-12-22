import React from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 useNavigate 임포트

const HabitItem = ({ habit, todayString, onToggle, isCompletedToday }) => {
  const navigate = useNavigate(); // 👈 useNavigate 훅 사용
  // DB의 completedDates 배열에 오늘 날짜가 있는지 확인
  const isChecked = isCompletedToday;

  // 시간 정보를 표시하는 함수 (와이어프레임의 "오전 10:00" 등)
  const formatTime = (time) => {
    // 실제 Habit 모델에는 시간 필드가 없으므로, 현재는 '매일' 등으로 임시 표시
    // 와이어프레임처럼 "오전 10:00" 같은 필드를 원하시면 DB 모델에 time 필드를 추가해야 합니다.
    return '매일';
  };

  // 습관이 어떤 카테고리인지 (와이어프레임의 "평일" 텍스트 역할)
  // 현재는 카테고리 제목을 직접 가져올 수 없어 임시로 표시합니다.
  const categoryTitle = '평일';

  // 상세 페이지 이동 핸들러
  const handleDetailClick = (e) => {
    // 체크박스 클릭 이벤트 방지
    if (
      e.target.closest('.habit-checkbox') ||
      e.target.className.includes('checkbox-input')
    ) {
      return;
    }
    navigate(`/habits/${habit._id}`); // 👈 상세 페이지로 이동
  };

  return (
    <div
      className={`habit-item ${isChecked ? 'completed' : ''}`}
      onClick={handleDetailClick}
    >
      {/* 체크박스 영역 */}
      <div
        className='habit-checkbox'
        onClick={(e) => {
          e.stopPropagation();
          onToggle(habit);
        }}
      >
        <input
          type='checkbox'
          checked={isChecked}
          readOnly
          className='checkbox-input'
        />
      </div>

      {/* 습관 제목 영역 */}
      <div className='habit-title'>
        {habit.title}
        <div className='habit-meta'>{categoryTitle}</div>
      </div>

      {/* 시간 정보 영역 */}
      <div className='habit-time'>{/* ... 시간 정보 표시 로직 유지 ... */}</div>
    </div>
  );
};

export default HabitItem;
