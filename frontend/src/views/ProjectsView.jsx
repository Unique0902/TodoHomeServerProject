import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, updateProjectStatus } from '../api/projectApi';
import ProjectItem from '../components/ProjectItem';
import '../styles/ProjectsView.css';

const ProjectsView = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
      setError('프로젝트 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 완료 상태 토글 핸들러
  const handleToggle = async (project) => {
    try {
      await updateProjectStatus(project._id, !project.isCompleted);
      fetchProjects(); // 목록 갱신
    } catch (error) {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // 프로젝트 목록 분리
  const activeProjects = projects.filter((p) => !p.isCompleted);
  const completedProjects = projects.filter((p) => p.isCompleted);

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;

  return (
    <div className='projects-view'>
      <h1 className='main-title'>프로젝트</h1>

      {/* 1. 미완료 프로젝트 목록 */}
      <section className='project-list-section'>
        <h2 className='section-title'>프로젝트</h2>

        <div className='project-list active-list'>
          {activeProjects.length === 0 && (
            <p className='empty-message'>진행 중인 프로젝트가 없습니다.</p>
          )}
          {activeProjects.map((project) => (
            <ProjectItem
              key={project._id}
              project={project}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </section>

      {/* 2. 완료 프로젝트 목록 */}
      <section className='completed-section'>
        <h2 className='section-title completed-label'>완료</h2>
        <div className='project-list completed-list'>
          {completedProjects.map((project) => (
            <ProjectItem
              key={project._id}
              project={project}
              onToggle={handleToggle}
            />
          ))}
        </div>
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
