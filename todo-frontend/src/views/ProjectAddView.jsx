import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProjectById,
  createProject,
  updateProject,
} from '../api/projectApi';
import '../styles/TodoAddView.css'; // Add/Edit View 스타일 재사용

const ProjectAddView = () => {
  const { id } = useParams(); // ID가 있으면 수정 모드
  const navigate = useNavigate();

  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const isEditMode = !!id;

  // 데이터 로드 및 폼 초기화 (수정 모드 시)
  const fetchAndPopulateProject = useCallback(async () => {
    if (isEditMode) {
      try {
        const data = await getProjectById(id);
        setTitle(data.title);
        setDescription(data.description || '');
      } catch (err) {
        alert('수정할 프로젝트를 불러오지 못했습니다.');
        navigate('/projects');
      }
    }
    setLoading(false);
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    fetchAndPopulateProject();
  }, [fetchAndPopulateProject]);

  // 저장 버튼 (체크 버튼) 핸들러
  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목은 필수로 입력해야 합니다.');
      return;
    }

    const projectData = {
      title: title.trim(),
      description: description.trim(),
    };

    try {
      if (isEditMode) {
        // 수정 API 호출
        await updateProject(id, projectData);
        alert('프로젝트가 성공적으로 수정되었습니다!');
        navigate(`/projects/${id}`, { replace: true }); // 상세 페이지로 이동 (히스토리에서 EditView 제거)
      } else {
        // 생성 API 호출
        await createProject(projectData);
        alert('프로젝트가 성공적으로 추가되었습니다!');
        navigate('/projects', { replace: true }); // 목록 페이지로 이동 (히스토리에서 AddView 제거)
      }
    } catch (error) {
      console.error(
        isEditMode ? '프로젝트 수정 실패:' : '프로젝트 추가 실패:',
        error
      );
      alert('프로젝트 처리 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;

  return (
    <div className='todo-add-view'>
      {' '}
      {/* 스타일 재사용 */}
      <header className='header-bar'>
        {/* 뒤로가기 버튼 */}
        <button className='back-button' onClick={() => navigate(-1)}>
          &lt;
        </button>
        <h1 className='title'>
          {isEditMode ? '프로젝트 수정' : '프로젝트 추가'}
        </h1>
        {/* 저장(체크) 버튼 */}
        <button className='save-button' onClick={handleSave}>
          <span role='img' aria-label='save'>
            ✔️
          </span>
        </button>
      </header>
      <main className='form-section'>
        {/* 1. 제목 입력 */}
        <div className='input-group'>
          <label>제목</label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='필수 입력'
            className='text-input'
          />
        </div>

        {/* 2. 설명 입력 */}
        <div className='input-group'>
          <label>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='상세 내용을 입력하세요 (선택)'
            className='textarea-input'
          />
        </div>
      </main>
    </div>
  );
};

export default ProjectAddView;
