import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WishlistItem.css'; // 스타일 파일 임포트 (아래에 정의)

const WishlistItem = ({ wishlist, onToggle }) => {
  const navigate = useNavigate();

  // 상세 페이지 이동 핸들러
  const handleDetailClick = (e) => {
    // 체크박스 클릭 이벤트 방지
    if (
      e.target.closest('.wishlist-checkbox') ||
      e.target.className.includes('checkbox-input')
    ) {
      return;
    }
    navigate(`/wishlists/${wishlist._id}`); // 상세 페이지로 이동
  };

  return (
    <div
      className={`wishlist-item ${wishlist.isCompleted ? 'completed' : ''}`}
      onClick={handleDetailClick}
    >
      {/* 체크박스 영역 */}
      <div className='wishlist-checkbox' onClick={() => onToggle(wishlist)}>
        <input
          type='checkbox'
          checked={wishlist.isCompleted}
          readOnly
          className='checkbox-input'
        />
      </div>

      {/* 위시리스트 제목 영역 */}
      <div className='wishlist-title'>{wishlist.title}</div>
    </div>
  );
};

export default WishlistItem;
