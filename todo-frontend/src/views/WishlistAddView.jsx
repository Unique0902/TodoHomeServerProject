import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getWishlistById,
  createWishlist,
  updateWishlist,
} from '../api/wishlistApi';
import '../styles/TodoAddView.css'; // Add/Edit View 스타일 재활용

const WishlistAddView = () => {
  const { id } = useParams(); // ID가 있으면 수정 모드
  const navigate = useNavigate();

  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const isEditMode = !!id;

  // 데이터 로드 및 폼 초기화 (수정 모드 시)
  const fetchAndPopulateWishlist = useCallback(async () => {
    if (isEditMode) {
      try {
        const data = await getWishlistById(id);
        setTitle(data.title);
        setDescription(data.description || '');
      } catch (err) {
        alert('수정할 위시리스트를 불러오지 못했습니다.');
        navigate('/wishlists');
      }
    }
    setLoading(false);
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    fetchAndPopulateWishlist();
  }, [fetchAndPopulateWishlist]);

  // 저장 버튼 (체크 버튼) 핸들러
  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목은 필수로 입력해야 합니다.');
      return;
    }

    const wishlistData = {
      title: title.trim(),
      description: description.trim(),
    };

    try {
      if (isEditMode) {
        // 수정 API 호출
        await updateWishlist(id, wishlistData);
        alert('위시리스트가 성공적으로 수정되었습니다!');
        navigate(`/wishlists/${id}`, { replace: true }); // 상세 페이지로 이동 (히스토리에서 EditView 제거)
      } else {
        // 생성 API 호출
        const newWishlist = await createWishlist(wishlistData);
        alert('위시리스트가 성공적으로 추가되었습니다!');
        navigate(`/wishlists/${newWishlist._id}`, { replace: true }); // 상세 페이지로 이동 (히스토리에서 AddView 제거)
      }
    } catch (error) {
      console.error(
        isEditMode ? '위시리스트 수정 실패:' : '위시리스트 추가 실패:',
        error
      );
      alert('위시리스트 처리 중 오류가 발생했습니다.');
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
        <h1 className='title'>{isEditMode ? '위시 수정' : '위시 추가'}</h1>
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

export default WishlistAddView;
