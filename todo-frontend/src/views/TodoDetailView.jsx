import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTodoById, deleteTodo } from '../api/todoApi';
import { getProjectById } from '../api/projectApi';
import '../styles/TodoDetailView.css';

const TodoDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 날짜 및 시간 포맷팅 헬퍼
  const formatDateTime = (dateString) => {
    if (!dateString) return '미정';

    const date = new Date(dateString);

    // 날짜 포맷 (예: 2025년 10월 27일)
    const datePart = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 시간 포맷 (시간 정보가 00:00:00 UTC가 아닐 경우만 표시)
    const isTimeZero = date.getUTCHours() === 0 && date.getUTCMinutes() === 0;

    if (isTimeZero) {
      // 시간 정보가 없으면 날짜만 반환
      return datePart;
    } else {
      // 시간 정보가 있으면 시간까지 포맷하여 반환 (예: 오전 9:00)
      const timePart = date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart} ${timePart}`;
    }
  };

  // 수행 날짜 및 시간 포맷팅 헬퍼 (항상 날짜와 시간 모두 표시)
  const formatCompletedDateTime = (dateString) => {
    if (!dateString) return '미정';

    const date = new Date(dateString);

    // 날짜 포맷
    const datePart = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 시간 포맷 (항상 표시, 초 포함)
    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return `${datePart} ${timePart}`;
  };

  // 데이터 로드
  const fetchTodo = useCallback(async () => {
    try {
      const data = await getTodoById(id);
      setTodo(data);

      // 프로젝트 정보가 있으면 프로젝트 정보도 로드
      if (data.projectId) {
        try {
          const projectData = await getProjectById(data.projectId);
          setProject(projectData);
        } catch (projectErr) {
          console.error('프로젝트 정보 로드 실패:', projectErr);
          // 프로젝트 정보 로드 실패해도 할일 정보는 표시
        }
      }
    } catch (err) {
      setError('할일 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTodo();
  }, [fetchTodo]);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (window.confirm(`정말로 할일 "${todo.title}"을 삭제하시겠습니까?`)) {
      try {
        await deleteTodo(id);
        alert('할일이 삭제되었습니다.');
        navigate('/todos'); // 목록 페이지로 이동
      } catch (err) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;
  if (!todo) return <div className='empty-state'>할일을 찾을 수 없습니다.</div>;

  return (
    <div className='todo-detail-view'>
      <header className='header-bar'>
        {/* 뒤로가기 버튼 */}
        <button className='back-button' onClick={() => navigate(-1)}>
          &lt;
        </button>
        {/* 할일 제목 */}
        <h1 className='title'>{todo.title}</h1>
      </header>

      <main className='detail-content'>
        <div className='info-group'>
          <span className='label'>설명</span>
          <p className='value description'>{todo.description || '설명 없음'}</p>
        </div>

        {project && (
          <div className='info-group'>
            <span className='label'>프로젝트</span>
            <span className='value project-name'>{project.title}</span>
          </div>
        )}

        <div className='info-group'>
          <span className='label'>완료 상태</span>
          <span
            className={`value status ${
              todo.isCompleted ? 'completed' : 'active'
            }`}
          >
            {todo.isCompleted ? '✅ 완료됨' : '🔲 미완료'}
          </span>
        </div>

        {todo.isCompleted && todo.completedDate && (
          <div className='info-group'>
            <span className='label'>수행 날짜 및 시간</span>
            <span className='value completed-date'>
              {formatCompletedDateTime(todo.completedDate)}
            </span>
          </div>
        )}

        <div className='info-group'>
          <span className='label'>기한</span>
          <span className='value due-date'>{formatDateTime(todo.dueDate)}</span>
        </div>

        <div className='info-group'>
          <span className='label'>생성일</span>
          <span className='value create-date'>
            {formatDateTime(todo.createdAt)}
          </span>
        </div>
      </main>

      {/* 하단 버튼 섹션 (연필, 쓰레기통) */}
      <footer className='action-bar'>
        {/* 수정 버튼 */}
        <button
          className='edit-button'
          onClick={() => navigate(`/todos/${id}/edit`)}
        >
          <span role='img' aria-label='edit'>
            ✏️
          </span>
        </button>
        {/* 삭제 버튼 */}
        <button className='delete-button' onClick={handleDelete}>
          <span role='img' aria-label='delete'>
            🗑️
          </span>
        </button>
      </footer>
    </div>
  );
};

export default TodoDetailView;
