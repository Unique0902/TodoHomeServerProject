import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, updateProjectStatus } from '../api/projectApi';
import { getTodos } from '../api/todoApi';
import ProjectItemWithChildren from '../components/ProjectItemWithChildren';
import '../styles/ProjectsView.css';

const ProjectsView = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]); // 최상위 프로젝트만
  const [allProjects, setAllProjects] = useState([]); // 모든 프로젝트 (하위 포함)
  const [todos, setTodos] = useState([]); // 모든 할일 목록
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);
  
  // 섹션 토글 상태
  const [isActiveExpanded, setIsActiveExpanded] = useState(true);
  const [isPausedExpanded, setIsPausedExpanded] = useState(true);
  const [isWishExpanded, setIsWishExpanded] = useState(true);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 최상위 프로젝트만 조회 (하위 프로젝트 제외)
      const topLevelData = await getProjects({ topLevelOnly: true });
      setProjects(topLevelData);
      
      // 모든 프로젝트 조회 (하위 프로젝트 포함) - 통계 계산용
      const allData = await getProjects();
      setAllProjects(allData);
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
      setError('프로젝트 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 모든 할일 목록 로드 (프로젝트별 통계 계산을 위해)
  const fetchAllTodos = useCallback(async () => {
    try {
      // date 파라미터 없이 호출하면 모든 할일을 가져옵니다
      const data = await getTodos();
      setTodos(data);
    } catch (err) {
      console.error('할일 로드 실패:', err);
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchAllTodos();
  }, [fetchProjects, fetchAllTodos]);

  // 특정 프로젝트의 모든 하위 프로젝트 ID를 재귀적으로 찾는 함수
  const getAllSubProjectIds = (projectId) => {
    const subProjectIds = new Set([projectId]); // 자기 자신 포함 (Set으로 중복 방지)
    
    // 직접 하위 프로젝트 찾기
    const directSubProjects = allProjects.filter(
      (p) => p.parentProjectId === projectId
    );
    
    // 각 하위 프로젝트에 대해 재귀적으로 하위 프로젝트 찾기
    directSubProjects.forEach((subProject) => {
      const subSubProjectIds = getAllSubProjectIds(subProject._id);
      subSubProjectIds.forEach((id) => subProjectIds.add(id));
    });
    
    return Array.from(subProjectIds);
  };

  // 프로젝트별 할일 통계 계산 (하위 프로젝트 포함)
  const getProjectTodoStats = (projectId) => {
    // 해당 프로젝트와 모든 하위 프로젝트의 ID 목록
    const allRelatedProjectIds = getAllSubProjectIds(projectId, allProjects);
    
    // 관련된 모든 프로젝트의 할일 합산
    const allRelatedTodos = todos.filter((todo) =>
      allRelatedProjectIds.includes(todo.projectId)
    );
    
    const totalCount = allRelatedTodos.length;
    const completedCount = allRelatedTodos.filter((todo) => todo.isCompleted).length;
    
    return { totalCount, completedCount };
  };

  // 상태 변경 핸들러 (체크박스 클릭 시 토글)
  const handleToggle = async (project) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
    try {
      // status가 없으면 isCompleted 기반으로 변환
      const currentStatus = project.status || (project.isCompleted ? 'completed' : 'active');
      
      // 체크박스 토글: completed ↔ active (다른 상태는 그대로 유지)
      let newStatus;
      if (currentStatus === 'completed') {
        newStatus = 'active';
      } else if (currentStatus === 'active') {
        newStatus = 'completed';
      } else {
        // paused나 wish 상태는 active로 변경
        newStatus = 'active';
      }
      
      await updateProjectStatus(project._id, newStatus);
      
      // 데이터 갱신
      await Promise.all([
        fetchProjects(),
        fetchAllTodos()
      ]);
      
      // 스크롤 위치 복원
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    } catch (error) {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // 프로젝트 목록을 상태별로 분리 (기존 isCompleted도 호환성 처리)
  const activeProjects = projects.filter((p) => {
    const status = p.status || (p.isCompleted ? 'completed' : 'active');
    return status === 'active';
  });
  const pausedProjects = projects.filter((p) => p.status === 'paused');
  const completedProjects = projects.filter((p) => {
    const status = p.status || (p.isCompleted ? 'completed' : 'active');
    return status === 'completed';
  });
  const wishProjects = projects.filter((p) => p.status === 'wish');

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;

  return (
    <div className='projects-view'>
      <h1 className='main-title'>프로젝트</h1>

      {/* 1. 진행중 프로젝트 목록 */}
      <section className='project-list-section'>
        <div className='section-header' onClick={() => setIsActiveExpanded(!isActiveExpanded)}>
          <h2 className='section-title'>진행중</h2>
          <button className='section-toggle-button' type='button'>
            {isActiveExpanded ? '▼' : '▶'}
          </button>
        </div>
        {isActiveExpanded && (
          <div className='project-list active-list'>
            {activeProjects.length === 0 && (
              <p className='empty-message'>진행 중인 프로젝트가 없습니다.</p>
            )}
            {activeProjects.map((project) => {
              const stats = getProjectTodoStats(project._id);
              return (
                <ProjectItemWithChildren
                  key={project._id}
                  project={project}
                  allProjects={allProjects}
                  onToggle={handleToggle}
                  todoStats={stats}
                  getProjectTodoStats={getProjectTodoStats}
                  level={0}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 2. 정지됨 프로젝트 목록 */}
      {pausedProjects.length > 0 && (
        <section className='project-list-section'>
          <div className='section-header' onClick={() => setIsPausedExpanded(!isPausedExpanded)}>
            <h2 className='section-title'>정지됨</h2>
            <button className='section-toggle-button' type='button'>
              {isPausedExpanded ? '▼' : '▶'}
            </button>
          </div>
          {isPausedExpanded && (
            <div className='project-list'>
              {pausedProjects.map((project) => {
                const stats = getProjectTodoStats(project._id);
                return (
                  <ProjectItemWithChildren
                    key={project._id}
                    project={project}
                    allProjects={allProjects}
                    onToggle={handleToggle}
                    todoStats={stats}
                    getProjectTodoStats={getProjectTodoStats}
                    level={0}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. 위시 프로젝트 목록 */}
      {wishProjects.length > 0 && (
        <section className='project-list-section'>
          <div className='section-header' onClick={() => setIsWishExpanded(!isWishExpanded)}>
            <h2 className='section-title'>위시</h2>
            <button className='section-toggle-button' type='button'>
              {isWishExpanded ? '▼' : '▶'}
            </button>
          </div>
          {isWishExpanded && (
            <div className='project-list'>
              {wishProjects.map((project) => {
                const stats = getProjectTodoStats(project._id);
                return (
                  <ProjectItemWithChildren
                    key={project._id}
                    project={project}
                    allProjects={allProjects}
                    onToggle={handleToggle}
                    todoStats={stats}
                    getProjectTodoStats={getProjectTodoStats}
                    level={0}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. 완료 프로젝트 목록 */}
      <section className='completed-section'>
        <div className='section-header' onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}>
          <h2 className='section-title completed-label'>완료</h2>
          <button className='section-toggle-button' type='button'>
            {isCompletedExpanded ? '▼' : '▶'}
          </button>
        </div>
        {isCompletedExpanded && (
          <div className='project-list completed-list'>
            {completedProjects.length === 0 && (
              <p className='empty-message'>완료된 프로젝트가 없습니다.</p>
            )}
            {completedProjects.map((project) => {
              const stats = getProjectTodoStats(project._id);
              return (
                <ProjectItemWithChildren
                  key={project._id}
                  project={project}
                  allProjects={allProjects}
                  onToggle={handleToggle}
                  todoStats={stats}
                  getProjectTodoStats={getProjectTodoStats}
                  level={0}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 3. 프로젝트 추가 버튼 */}
      <button
        className='add-project-button'
        onClick={() => navigate('/projects/add')}
      >
        +
      </button>
    </div>
  );
};

export default ProjectsView;
