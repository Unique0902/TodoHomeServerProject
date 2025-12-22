import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWishlists, updateWishlistStatus } from '../api/wishlistApi';
import WishlistItem from '../components/WishlistItem';
import '../styles/WishlistView.css';

const WishlistView = () => {
  const navigate = useNavigate();
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlists();
      setWishlists(data);
    } catch (err) {
      console.error('위시리스트 로드 실패:', err);
      setError('위시리스트 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

  // 완료 상태 토글 핸들러
  const handleToggle = async (wishlist) => {
    try {
      await updateWishlistStatus(wishlist._id, !wishlist.isCompleted);
      fetchWishlists(); // 목록 갱신
    } catch (error) {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // 위시리스트 목록 분리 (완료/미완료)
  const activeWishlists = wishlists.filter((w) => !w.isCompleted);
  const completedWishlists = wishlists.filter((w) => w.isCompleted);

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;

  return (
    <div className='wishlists-view'>
      <h1 className='main-title'>위시리스트</h1>

      {/* 1. 미완료 위시리스트 목록 */}
      <section className='wishlist-list-section'>
        <h2 className='section-title'>위시리스트</h2>

        <div className='wishlist-list active-list'>
          {activeWishlists.length === 0 && (
            <p className='empty-message'>아직 위시가 없습니다.</p>
          )}
          {activeWishlists.map((wishlist) => (
            <WishlistItem
              key={wishlist._id}
              wishlist={wishlist}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </section>

      {/* 2. 완료 위시리스트 목록 (와이어프레임에는 없으나 편의상 추가) */}
      <section className='completed-section'>
        <h2 className='section-title completed-label'>달성 완료</h2>
        <div className='wishlist-list completed-list'>
          {completedWishlists.map((wishlist) => (
            <WishlistItem
              key={wishlist._id}
              wishlist={wishlist}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </section>

      {/* 3. 위시리스트 추가 버튼 */}
      <button
        className='add-wishlist-button'
        onClick={() => navigate('/wishlists/add')}
      >
        +
      </button>
    </div>
  );
};

export default WishlistView;
