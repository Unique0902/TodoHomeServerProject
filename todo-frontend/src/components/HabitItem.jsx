import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HabitItem = ({ 
  habit, 
  todayString, 
  onToggle, 
  isCompletedToday,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  dragOverIndex,
  index
}) => {
  const navigate = useNavigate();
  const isChecked = isCompletedToday;
  const itemRef = useRef(null);
  const dragHandleRef = useRef(null);

  const formatTime = (time) => {
    return '매일';
  };

  const categoryTitle = '평일';

  const handleDetailClick = (e) => {
    if (
      e.target.closest('.habit-checkbox') ||
      e.target.closest('.drag-handle') ||
      e.target.className.includes('checkbox-input')
    ) {
      return;
    }
    navigate(`/habits/${habit._id}`);
  };

  // 햄버거 아이콘에서만 드래그 시작
  const handleDragHandleDragStart = (e) => {
    e.stopPropagation();
    // 드래그 핸들에서 드래그 시작 시 전체 아이템 정보를 전달
    onDragStart(e, index);
  };

  return (
    <div
      ref={itemRef}
      className={`habit-item ${isChecked ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={handleDetailClick}
      draggable={false}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* 드래그 핸들 (햄버거 아이콘) */}
      <div
        ref={dragHandleRef}
        className='drag-handle'
        onClick={(e) => e.stopPropagation()}
        draggable={true}
        onDragStart={handleDragHandleDragStart}
      >
        <span className='hamburger-icon'>☰</span>
      </div>

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
