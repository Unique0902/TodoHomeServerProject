import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectItem from './ProjectItem';
import '../styles/ProjectItemWithChildren.css';

const ProjectItemWithChildren = ({
  project,
  allProjects,
  onToggle,
  todoStats,
  getProjectTodoStats, // 통계 계산 함수 전달
  level = 0, // 들여쓰기 레벨 (0이 최상위)
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // 직접 하위 프로젝트 찾기
  const subProjects = allProjects.filter(
    (p) => p.parentProjectId === project._id
  );

  // 토글 버튼 클릭 핸들러
  const handleToggleClick = (e) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setIsExpanded(!isExpanded);
  };

  // 상세 페이지 이동 핸들러
  const handleDetailClick = (e) => {
    // 체크박스나 토글 버튼 클릭 시 상세 페이지로 이동하지 않음
    if (
      e.target.closest('.project-checkbox') ||
      e.target.className.includes('checkbox-input') ||
      e.target.closest('.project-toggle-button') ||
      e.target.closest('.project-item-container')?.querySelector('.project-checkbox')?.contains(e.target)
    ) {
      return;
    }
    navigate(`/projects/${project._id}`);
  };

  return (
    <div className='project-item-with-children'>
      {/* 프로젝트 아이템 */}
      <div
        className={`project-item-wrapper level-${level}`}
        onClick={handleDetailClick}
      >
        {/* 들여쓰기 공간 */}
        {level > 0 && (
          <div className='indent-space' style={{ width: `${level * 20}px` }} />
        )}

        {/* 프로젝트 아이템 */}
        <div className='project-item-container' onClick={handleDetailClick}>
          <ProjectItem
            project={project}
            onToggle={onToggle}
            todoStats={todoStats}
            disableNavigation={true}
          />
        </div>

        {/* 토글 버튼 (하위 프로젝트가 있는 경우만, 오른쪽 끝에 배치) */}
        {subProjects.length > 0 && (
          <button
            className={`project-toggle-button ${isExpanded ? 'expanded' : ''}`}
            onClick={handleToggleClick}
            type='button'
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      {/* 하위 프로젝트 리스트 (토글이 펼쳐진 경우만) */}
      {isExpanded && subProjects.length > 0 && (
        <div className='sub-projects-list'>
          {subProjects.map((subProject) => {
            // 하위 프로젝트의 통계 계산
            const subStats = getProjectTodoStats
              ? getProjectTodoStats(subProject._id)
              : todoStats;
            return (
              <ProjectItemWithChildren
                key={subProject._id}
                project={subProject}
                allProjects={allProjects}
                onToggle={onToggle}
                todoStats={subStats}
                getProjectTodoStats={getProjectTodoStats}
                level={level + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectItemWithChildren;

