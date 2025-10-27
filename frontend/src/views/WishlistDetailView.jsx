import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWishlistById, deleteWishlist } from '../api/wishlistApi';
import '../styles/TodoDetailView.css'; // 상세 뷰 스타일 재활용

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
        <button className='back-button' onClick={() => navigate(-1)}>
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
      {/* 하단 버튼 섹션 (연필, 쓰레기통) */}
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
