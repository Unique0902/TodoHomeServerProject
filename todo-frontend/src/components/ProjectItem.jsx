import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectItem.css'; // 스타일 파일 임포트 (아래에 정의)

const ProjectItem = ({ project, onToggle, todoStats }) => {
  const navigate = useNavigate();

  // 상세 페이지 이동 핸들러
  const handleDetailClick = (e) => {
    // 체크박스 클릭 이벤트 방지
    if (
      e.target.closest('.project-checkbox') ||
      e.target.className.includes('checkbox-input')
    ) {
      return;
    }
    navigate(`/projects/${project._id}`); // 상세 페이지로 이동
  };

  // status가 없거나 isCompleted가 있는 경우(기존 데이터) 호환성 처리
  const projectStatus = project.status || (project.isCompleted ? 'completed' : 'active');
  const isCompleted = projectStatus === 'completed';

  return (
    <div
      className={`project-item ${projectStatus === 'completed' ? 'completed' : projectStatus === 'paused' ? 'paused' : projectStatus === 'wish' ? 'wish' : ''}`}
      onClick={handleDetailClick}
    >
      {/* 체크박스 영역 */}
      <div className='project-checkbox' onClick={() => onToggle(project)}>
        <input
          type='checkbox'
          checked={isCompleted}
          readOnly
          className='checkbox-input'
        />
      </div>

      {/* 프로젝트 제목 및 통계 영역 */}
      <div className='project-content'>
        <div className='project-title'>{project.title}</div>
        {todoStats && todoStats.totalCount > 0 && (
          <div className='project-todo-stats'>
            할일 {todoStats.completedCount}/{todoStats.totalCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectItem;
