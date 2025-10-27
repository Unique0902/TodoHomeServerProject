import React from 'react';

// TodoItem 컴포넌트
// todo: 할일 데이터 객체
// onToggle: 완료 상태 토글 핸들러 함수
const TodoItem = ({ todo, onToggle }) => {
  // 시간 정보를 포맷하는 함수 (dueDate가 있으면 HH:MM, 없으면 '오늘')
  const formatTime = (dueDate) => {
    if (!dueDate) return '오늘';

    try {
      const date = new Date(dueDate);
      // 한국 시간대 기준으로 시:분 포맷 (예: 오후 10:00)
      return date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return '시간 오류';
    }
  };

  const timeString = formatTime(todo.dueDate);
  const itemClasses = `todo-item ${todo.isCompleted ? 'completed' : ''}`;

  return (
    <div className={itemClasses}>
      {/* 체크박스 영역 */}
      <div className='todo-checkbox' onClick={() => onToggle(todo)}>
        <input
          type='checkbox'
          checked={todo.isCompleted}
          readOnly
          className='checkbox-input'
        />
      </div>

      {/* 할일 제목 영역 */}
      <div className='todo-title'>{todo.title}</div>

      {/* 시간 정보 영역 */}
      <div className='todo-time'>{timeString}</div>
    </div>
  );
};

export default TodoItem;
