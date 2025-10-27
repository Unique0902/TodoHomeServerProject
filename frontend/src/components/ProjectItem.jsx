import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectItem.css'; // 스타일 파일 임포트 (아래에 정의)

const ProjectItem = ({ project, onToggle }) => {
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

  return (
    <div
      className={`project-item ${project.isCompleted ? 'completed' : ''}`}
      onClick={handleDetailClick}
    >
      {/* 체크박스 영역 */}
      <div className='project-checkbox' onClick={() => onToggle(project)}>
        <input
          type='checkbox'
          checked={project.isCompleted}
          readOnly
          className='checkbox-input'
        />
      </div>

      {/* 프로젝트 제목 영역 */}
      <div className='project-title'>{project.title}</div>
    </div>
  );
};

export default ProjectItem;
