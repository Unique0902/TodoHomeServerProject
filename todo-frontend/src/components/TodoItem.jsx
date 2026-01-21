import React from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 useNavigate 임포트

// TodoItem 컴포넌트
// todo: 할일 데이터 객체
// onToggle: 완료 상태 토글 핸들러 함수
// projectMap: 프로젝트 ID를 키로 하는 프로젝트 정보 Map (선택사항)
// onClick: 클릭 시 실행할 커스텀 핸들러 (선택사항, 있으면 기본 동작 대신 실행)
// onSetToday: 오늘 날짜로 설정하는 핸들러 (선택사항, 기한 없는 할일인 경우)
// showTodayButton: 오늘 진행하기 버튼 표시 여부 (선택사항)
const TodoItem = ({ todo, onToggle, projectMap, onClick, onSetToday, showTodayButton = false }) => {
  const navigate = useNavigate(); // 👈 useNavigate 훅 사용
  // 날짜/시간 포맷 헬퍼 함수
  const formatDateTime = (dateValue) => {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      const today = new Date();
      
      // 오늘인지 확인 (날짜만 비교)
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      // UTC로 저장된 날짜만 있는 경우 확인
      const dateStr = typeof dateValue === 'string' ? dateValue : date.toISOString();
      const isUTCOnly = dateStr.endsWith('Z') && 
                        (dateStr.includes('T00:00:00.000Z') || dateStr.includes('T00:00:00Z'));
      
      const hasTime = !isUTCOnly;

      if (isToday) {
        if (hasTime) {
          const timeStr = date.toLocaleTimeString('ko-KR', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          return `오늘 ${timeStr}`;
        } else {
          return '오늘';
        }
      } else {
        if (hasTime) {
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
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      }
    } catch (e) {
      console.error('날짜 포맷 오류:', e);
      return '';
    }
  };

  // 할일 시간 표시 함수
  const getTimeString = () => {
    // 완료된 할일이고 실행일/기한이 없으며 완료 날짜가 있는 경우
    if (!todo.dueDate && !todo.startDate && !todo.endDate && todo.isCompleted && todo.completedDate) {
      try {
        const completedDate = new Date(todo.completedDate);
        return completedDate.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (e) {
        console.error('완료 날짜 포맷 오류:', e);
        return '완료됨';
      }
    }
    
    // 실행일이 있는 경우
    if (todo.dueDate) {
      return formatDateTime(todo.dueDate);
    }
    
    // 기한이 있는 경우
    if (todo.startDate || todo.endDate) {
      const startStr = todo.startDate ? formatDateTime(todo.startDate) : '시작일 미정';
      const endStr = todo.endDate ? formatDateTime(todo.endDate) : '마감일 미정';
      return `${startStr} ~ ${endStr}`;
    }
    
    // 둘 다 없는 경우
    return '기한없음';
  };

  const timeString = getTimeString();
  const itemClasses = `todo-item ${todo.isCompleted ? 'completed' : ''}`;
  
  // 프로젝트 정보 가져오기
  const project = todo.projectId && projectMap ? projectMap.get(todo.projectId) : null;
  
  // 기간이 지난 할일인지 확인하는 함수
  const isOverdue = () => {
    if (todo.isCompleted) return false;
    
    // 실행일이 있는 경우
    if (todo.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(todo.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }
    
    // 기한이 있는 경우 (마감일이 지났는지 확인)
    if (todo.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(todo.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    }
    
    return false;
  };
  
  // 오늘 진행하기 버튼 클릭 핸들러
  const handleSetToday = (e) => {
    e.stopPropagation(); // 상세 페이지 이동 방지
    if (onSetToday) {
      onSetToday(todo);
    }
  };

  // 상세 페이지 이동 핸들러
  const handleDetailClick = (e) => {
    // 이벤트 버블링 방지: 체크박스, 오늘 진행하기 버튼 클릭 이벤트가 상세 이동을 트리거하지 않도록 합니다.
    if (
      e.target.closest('.todo-checkbox') ||
      e.target.className.includes('checkbox-input') ||
      e.target.closest('.today-button')
    ) {
      return;
    }
    // 커스텀 onClick 핸들러가 있으면 그것을 사용, 없으면 기본 동작
    if (onClick) {
      onClick(e);
    } else {
      navigate(`/todos/${todo._id}`);
    }
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

      {/* 할일 제목 및 프로젝트명 영역 */}
      <div className='todo-title-section'>
        <div className='todo-title'>{todo.title}</div>
        {project && (
          <div className='todo-project-name'>{project.title}</div>
        )}
      </div>

      {/* 마감 시한 정보 영역 및 오늘 진행하기 버튼 */}
      <div className='todo-time-section'>
        <div className='todo-time'>{timeString}</div>
        {/* 오늘 진행하기 버튼 (실행일/기한 없는 할일 또는 기간이 지난 할일인 경우) */}
        {showTodayButton && !todo.isCompleted && (!todo.dueDate && !todo.startDate && !todo.endDate || isOverdue()) && (
          <button
            className='today-button'
            onClick={handleSetToday}
            title='오늘 날짜로 설정'
          >
            오늘 진행하기
          </button>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
