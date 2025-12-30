import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getHabitById,
  deleteHabit,
  getHabitCategoryById,
} from '../api/habitApi';
import { getProjectById } from '../api/projectApi';
import '../styles/TodoDetailView.css'; // 스타일 재활용

const HabitDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState(null);
  const [categoryTitle, setCategoryTitle] = useState('로딩 중...');
  const [project, setProject] = useState(null);
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
  const fetchHabitData = useCallback(async () => {
    try {
      const habitData = await getHabitById(id);
      setHabit(habitData);

      // 습관 카테고리 이름 조회
      const categoryData = await getHabitCategoryById(
        habitData.habitCategoryId
      );
      setCategoryTitle(categoryData.title || '카테고리 없음');

      // 관련 프로젝트가 있으면 프로젝트 정보 조회
      if (habitData.projectId) {
        try {
          const projectData = await getProjectById(habitData.projectId);
          setProject(projectData);
        } catch (projectErr) {
          console.error('프로젝트 정보 로드 실패:', projectErr);
          // 프로젝트 로드 실패해도 습관 정보는 표시
        }
      }
    } catch (err) {
      setError('습관 정보를 불러오지 못했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHabitData();
  }, [fetchHabitData]);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (window.confirm(`정말로 습관 "${habit.title}"을 삭제하시겠습니까?`)) {
      try {
        await deleteHabit(id);
        alert('습관이 삭제되었습니다.');
        navigate('/habits'); // 습관 목록 페이지로 이동
      } catch (err) {
        alert('삭제에 실패했습니다.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;
  if (!habit)
    return <div className='empty-state'>습관을 찾을 수 없습니다.</div>;

  return (
    <div className='todo-detail-view'>
      {' '}
      {/* 스타일 재활용 */}
      <header className='header-bar'>
        {/* 뒤로가기 버튼 */}
        <button className='back-button' onClick={() => navigate('/habits')}>
          &lt;
        </button>
        {/* 습관 제목 */}
        <h1 className='title'>{habit.title}</h1>
      </header>
      <main className='detail-content'>
        {/* 카테고리 정보 */}
        <div className='info-group'>
          <span className='label'>카테고리</span>
          <span className='value'>{categoryTitle}</span>
        </div>

        {/* 관련 프로젝트 정보 */}
        {project && (
          <div
            className='info-group'
            onClick={() => navigate(`/projects/${project._id}`)}
            style={{ cursor: 'pointer' }}
          >
            <span className='label'>관련 프로젝트</span>
            <span className='value' style={{ textDecoration: 'underline' }}>
              {project.title}
            </span>
          </div>
        )}

        {/* 설명 */}
        <div className='info-group'>
          <span className='label'>설명</span>
          <p className='value description'>
            {habit.description || '설명 없음'}
          </p>
        </div>

        {/* 완료 횟수 (부가 정보) */}
        <div className='info-group'>
          <span className='label'>총 실천 횟수</span>
          <span className='value'>
            {habit.completedDates ? habit.completedDates.length : 0}회
          </span>
        </div>

        {/* 생성일 */}
        <div className='info-group'>
          <span className='label'>생성일</span>
          <span className='value'>{formatDate(habit.createdAt)}</span>
        </div>
      </main>
      {/* 하단 버튼 섹션 (연필, 쓰레기통) */}
      <footer className='action-bar'>
        {/* 수정 버튼 */}
        <button
          className='edit-button'
          onClick={() => navigate(`/habits/${id}/edit`)}
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

export default HabitDetailView;
