import React from 'react';

// TodoItem 컴포넌트
// todo: 할일 데이터 객체
// onToggle: 완료 상태 토글 핸들러 함수
const TodoItem = ({ todo, onToggle }) => {
  // 시간 정보를 포맷하는 함수 (dueDate가 있으면 HH:MM, 없으면 '오늘')
  const formatTime = (dueDate) => {
    // 1. dueDate 필드가 아예 없거나 null일 경우
    if (!dueDate) return '오늘';

    try {
      const date = new Date(dueDate);

      // 2. dueDate는 있으나 시간 정보가 00:00:00인 경우 (TodoAddView에서 시간 없이 날짜만 저장했을 경우)
      // KST 기준 9시간 차이가 발생하므로, 로컬 시간으로 변환 후 시간이 0인지 체크합니다.
      if (date.getHours() === 0 && date.getMinutes() === 0) {
        return '오늘';
      }

      // 3. 시간 정보가 있을 경우 시:분 포맷 (예: 오후 10:00)
      return date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      console.error('날짜 포맷 오류:', e);
      return '시간 오류';
    }
  };

  // todo.dueDate를 사용하도록 수정
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

      {/* 마감 시한 정보 영역 */}
      <div className='todo-time'>{timeString}</div>
    </div>
  );
};

export default TodoItem;
