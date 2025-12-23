import React from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 useNavigate 임포트

// TodoItem 컴포넌트
// todo: 할일 데이터 객체
// onToggle: 완료 상태 토글 핸들러 함수
const TodoItem = ({ todo, onToggle }) => {
  const navigate = useNavigate(); // 👈 useNavigate 훅 사용
  // 시간 정보를 포맷하는 함수 (dueDate가 있으면 날짜/시간, 없으면 '기한없음')
  const formatTime = (dueDate) => {
    // 1. dueDate 필드가 아예 없거나 null일 경우 (기한이 설정되지 않은 경우)
    if (!dueDate) return '기한없음';

    try {
      const date = new Date(dueDate);
      const today = new Date();
      
      // 오늘인지 확인 (날짜만 비교)
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      // UTC로 저장된 날짜만 있는 경우 확인 (UTC 00:00:00.000Z)
      // 원본 문자열이 "YYYY-MM-DDT00:00:00.000Z" 형태인지 확인
      const dueDateStr = typeof dueDate === 'string' ? dueDate : date.toISOString();
      const isUTCOnly = dueDateStr.endsWith('Z') && 
                        (dueDateStr.includes('T00:00:00.000Z') || dueDateStr.includes('T00:00:00Z'));
      
      // 시간이 있는지 확인
      // UTC로만 저장된 경우(time이 없었던 경우)는 시간이 없는 것으로 간주
      const hasTime = !isUTCOnly;

      if (isToday) {
        // 오늘인 경우
        if (hasTime) {
          // 시간이 있으면: "오늘 오후 10:00"
          const timeStr = date.toLocaleTimeString('ko-KR', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return `오늘 ${timeStr}`;
        } else {
          // 시간이 없으면: "오늘"
          return '오늘';
        }
      } else {
        // 오늘이 아닌 경우
        if (hasTime) {
          // 시간이 있으면: "2025년 1월 15일 오후 10:00"
          const dateStr = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const timeStr = date.toLocaleTimeString('ko-KR', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return `${dateStr} ${timeStr}`;
        } else {
          // 시간이 없으면: "2025년 1월 15일"
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      }
    } catch (e) {
      console.error('날짜 포맷 오류:', e);
      return '시간 오류';
    }
  };

  // todo.dueDate를 사용하도록 수정
  const timeString = formatTime(todo.dueDate);
  const itemClasses = `todo-item ${todo.isCompleted ? 'completed' : ''}`;
  // 상세 페이지 이동 핸들러
  const handleDetailClick = (e) => {
    // 이벤트 버블링 방지: 체크박스 클릭 이벤트가 상세 이동을 트리거하지 않도록 합니다.
    if (
      e.target.className.includes('todo-checkbox') ||
      e.target.className.includes('checkbox-input')
    ) {
      return;
    }
    navigate(`/todos/${todo._id}`);
  };
  return (
    <div className={itemClasses} onClick={handleDetailClick}>
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
