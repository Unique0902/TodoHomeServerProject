import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWishlistById, deleteWishlist } from '../api/wishlistApi';
import { createProject } from '../api/projectApi';
import '../styles/TodoDetailView.css'; // 상세 뷰 스타일 재사용

const WishlistDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(null);
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
  const fetchWishlist = useCallback(async () => {
    try {
      const data = await getWishlistById(id);
      setWishlist(data);
    } catch (err) {
      setError('위시리스트 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (
      window.confirm(
        `정말로 위시리스트 "${wishlist.title}"을 삭제하시겠습니까?`
      )
    ) {
      try {
        await deleteWishlist(id);
        alert('위시리스트가 삭제되었습니다.');
        navigate('/wishlists'); // 목록 페이지로 이동
      } catch (err) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  // 프로젝트로 변환 핸들러
  const handleConvertToProject = async () => {
    if (
      window.confirm(
        `위시리스트 "${wishlist.title}"을 프로젝트로 변환하시겠습니까? 변환 후 위시리스트는 삭제됩니다.`
      )
    ) {
      try {
        // 1. 위시리스트의 제목과 설명으로 프로젝트 생성
        const projectData = {
          title: wishlist.title,
          description: wishlist.description || '',
        };
        const newProject = await createProject(projectData);

        // 2. 위시리스트 삭제
        await deleteWishlist(id);

        alert('프로젝트로 변환되었습니다.');
        // 3. 생성된 프로젝트 상세 페이지로 이동
        navigate(`/projects/${newProject._id}`, { replace: true });
      } catch (err) {
        console.error('프로젝트 변환 실패:', err);
        alert('프로젝트 변환에 실패했습니다.');
      }
    }
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;
  if (!wishlist)
    return <div className='empty-state'>위시리스트를 찾을 수 없습니다.</div>;

  return (
    <div className='todo-detail-view'>
      {' '}
      {/* 스타일 재활용 */}
      <header className='header-bar'>
        {/* 뒤로가기 버튼 */}
        <button className='back-button' onClick={() => navigate('/wishlists')}>
          &lt;
        </button>
        <h1 className='title'>{wishlist.title}</h1>
      </header>
      <main className='detail-content'>
        <div className='info-group'>
          <span className='label'>설명</span>
          <p className='value description'>
            {wishlist.description || '설명 없음'}
          </p>
        </div>

        <div className='info-group'>
          <span className='label'>달성 상태</span>
          <span
            className={`value status ${
              wishlist.isCompleted ? 'completed' : 'active'
            }`}
          >
            {wishlist.isCompleted ? '✅ 달성 완료' : '🔲 목표 진행 중'}
          </span>
        </div>

        <div className='info-group'>
          <span className='label'>생성일</span>
          <span className='value create-date'>
            {formatDate(wishlist.createdAt)}
          </span>
        </div>
      </main>
      {/* 하단 버튼 섹션 (연필, 프로젝트 변환, 쓰레기통) */}
      <footer className='action-bar'>
        {/* 수정 버튼 */}
        <button
          className='edit-button'
          onClick={() => navigate(`/wishlists/${id}/edit`)}
        >
          <span role='img' aria-label='edit'>
            ✏️
          </span>
        </button>
        {/* 프로젝트로 변환 버튼 */}
        <button
          className='convert-button'
          onClick={handleConvertToProject}
          title='프로젝트로 변환'
        >
          <span role='img' aria-label='convert'>
            💡
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

export default WishlistDetailView;
