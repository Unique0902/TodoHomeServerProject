import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, deleteProject } from '../api/projectApi';
import { getTodosByProjectId, updateTodoStatus } from '../api/todoApi';
import TodoItem from '../components/TodoItem';
import '../styles/TodoDetailView.css'; // 상세 뷰 스타일 재활용
import '../styles/ProjectDetailView.css'; // 프로젝트 고유 스타일 (4번 섹션 참고)

const ProjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 날짜 포맷팅 헬퍼
  const formatDate = (dateString) => {
    if (!dateString) return '미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 데이터 로드
  const fetchProjectData = useCallback(async () => {
    try {
      // 프로젝트 정보 로드
      const projectData = await getProjectById(id);
      setProject(projectData);

      // 하위 할일 목록 로드 (projectId로 필터링)
      const todoData = await getTodosByProjectId(id);
      setTodos(todoData);
    } catch (err) {
      setError('프로젝트 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // 할일 완료 상태 토글 (하위 목록)
  const handleTodoToggle = async (todo) => {
    try {
      await updateTodoStatus(todo._id, !todo.isCompleted);
      fetchProjectData(); // 목록 갱신
    } catch (error) {
      alert('할일 상태 업데이트 실패!');
    }
  };

  // 프로젝트 삭제 핸들러
  const handleDelete = async () => {
    if (
      window.confirm(`정말로 프로젝트 "${project.title}"을 삭제하시겠습니까?`)
    ) {
      try {
        await deleteProject(id);
        alert('프로젝트가 삭제되었습니다.');
        navigate('/projects'); // 목록 페이지로 이동
      } catch (err) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  // 할일 목록 분리
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  // 프로젝트 Map 생성 (현재 프로젝트만 포함, 다른 프로젝트와 연결된 할일이 있을 수 있으므로)
  const projectMap = project ? new Map([[project._id, project]]) : new Map();

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;
  if (!project)
    return <div className='empty-state'>프로젝트를 찾을 수 없습니다.</div>;

  return (
    <div className='project-detail-view'>
      <header className='header-bar detail-header'>
        {/* 1. 뒤로가기 버튼 */}
        <button className='back-button' onClick={() => navigate('/projects')}>
          &lt;
        </button>
        {/* 2. 프로젝트 제목 */}
        <h1 className='title'>{project.title}</h1>

        {/* 3. 우측 상단 관리 버튼 그룹 (수정 및 삭제) */}
        <div className='top-action-group'>
          {/* 삭제 버튼 (추가) */}
          <button
            className='delete-button-icon'
            onClick={handleDelete}
            title='프로젝트 삭제'
          >
            <span role='img' aria-label='delete'>
              🗑️
            </span>
          </button>

          {/* 수정 버튼 (기존 위치 변경) */}
          <button
            className='edit-button-icon'
            onClick={() => navigate(`/projects/${id}/edit`)}
            title='프로젝트 수정'
          >
            <span role='img' aria-label='edit'>
              ✏️
            </span>
          </button>
        </div>
      </header>

      <main className='detail-content'>
        {/* ... (설명, 상태, 하위 할일 목록 섹션 유지) ... */}

        {/* 설명 정보 */}
        <div className='info-group'>
          <span className='label'>설명</span>
          <p className='value description'>
            {project.description || '설명 없음'}
          </p>
        </div>

        <div className='info-group'>
          <span className='label'>상태</span>
          <span
            className={`value status ${
              (project.status || (project.isCompleted ? 'completed' : 'active')) === 'completed'
                ? 'completed'
                : (project.status || (project.isCompleted ? 'completed' : 'active')) === 'paused'
                ? 'paused'
                : (project.status || (project.isCompleted ? 'completed' : 'active')) === 'wish'
                ? 'wish'
                : 'active'
            }`}
          >
            {(project.status || (project.isCompleted ? 'completed' : 'active')) === 'completed'
              ? '✅ 완료'
              : (project.status || (project.isCompleted ? 'completed' : 'active')) === 'paused'
              ? '⏸️ 정지됨'
              : (project.status || (project.isCompleted ? 'completed' : 'active')) === 'wish'
              ? '💡 위시'
              : '🔲 진행중'}
          </span>
        </div>

        {/* --- 하위 할일 목록 섹션 --- */}
        <h2 className='todo-list-title'>할일 List</h2>

        <section className='todo-list-project'>
          <div className='todo-list active-list'>
            {activeTodos.length === 0 && (
              <p className='empty-message small'>진행할 할일이 없습니다.</p>
            )}
            {activeTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleTodoToggle}
                projectMap={projectMap}
                // 프로젝트 상세 뷰에서는 할일 상세로 바로 이동하지 않도록 클릭 이벤트 막음
                onClick={(e) => e.stopPropagation()}
              />
            ))}
          </div>

          <h3 className='completed-sub-title'>완료</h3>
          <div className='todo-list completed-list'>
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleTodoToggle}
                projectMap={projectMap}
                onClick={(e) => e.stopPropagation()}
              />
            ))}
          </div>
        </section>
      </main>

      {/* 하단 액션 버튼 섹션: 삭제 버튼 제거, 추가 버튼만 남김 */}
      <footer className='action-bar project-action-bar-bottom'>
        {/* 할일 추가 버튼 (우측 하단 배치) */}
        <button
          className='add-todo-button'
          onClick={() =>
            navigate(`/todos/add?projectId=${id}&projectName=${project.title}`)
          }
        >
          +
        </button>
      </footer>
    </div>
  );
};

export default ProjectDetailView;
