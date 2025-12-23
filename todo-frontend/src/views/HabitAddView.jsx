import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAllHabitCategories,
  getHabitById,
  createHabit,
  updateHabit,
} from '../api/habitApi';
import '../styles/TodoAddView.css'; // 스타일 재사용

const HabitAddView = () => {
  const { id } = useParams(); // URL에서 ID를 가져옴 (수정 모드 시 사용)
  const navigate = useNavigate();

  // 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]); // 선택 가능한 카테고리 목록
  const [selectedCategoryId, setSelectedCategoryId] = useState(''); // 현재 선택된 카테고리 ID
  const [loading, setLoading] = useState(true);

  const isEditMode = !!id; // ID가 있으면 수정 모드

  // 1. 카테고리 목록 로드 및 수정 데이터 불러오기
  const fetchInitialData = useCallback(async () => {
    try {
      // 카테고리 목록 로드
      const categoryList = await getAllHabitCategories();
      setCategories(categoryList);

      if (categoryList.length > 0 && !isEditMode) {
        // 추가 모드일 경우, 기본 카테고리를 첫 번째 항목으로 설정
        setSelectedCategoryId(categoryList[0]._id);
      }

      if (isEditMode) {
        // 수정 모드: 기존 데이터 로드
        const habitData = await getHabitById(id);
        setTitle(habitData.title);
        setDescription(habitData.description || '');
        setSelectedCategoryId(habitData.habitCategoryId); // 기존 카테고리 ID 설정
      }
    } catch (err) {
      console.error('초기 데이터 로드 실패:', err);
      alert('데이터 로드 실패: 카테고리 또는 습관 정보를 불러올 수 없습니다.');
      if (isEditMode) navigate('/habits');
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 2. 저장 버튼 (체크 버튼) 핸들러
  const handleSave = async () => {
    if (!title.trim() || !selectedCategoryId) {
      alert('제목과 카테고리는 필수로 선택해야 합니다.');
      return;
    }

    const habitData = {
      title: title.trim(),
      description: description.trim(),
      habitCategoryId: selectedCategoryId,
    };

    try {
      if (isEditMode) {
        // 수정 API 호출
        await updateHabit(id, habitData);
        alert('습관이 성공적으로 수정되었습니다!');
        navigate(`/habits/${id}`, { replace: true }); // 상세 페이지로 이동 (히스토리에서 EditView 제거)
      } else {
        // 생성 API 호출
        await createHabit(habitData);
        alert('습관이 성공적으로 추가되었습니다!');
        navigate('/habits', { replace: true }); // 목록 페이지로 이동 (히스토리에서 AddView 제거)
      }
    } catch (error) {
      console.error(isEditMode ? '습관 수정 실패:' : '습관 추가 실패:', error);
      alert('습관 처리 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;

  // 카테고리가 하나도 없을 때
  if (categories.length === 0) {
    return (
      <div className='todo-add-view'>
        <p className='empty-message'>
          습관 카테고리가 없습니다. 먼저 카테고리를 생성해주세요. ({' '}
          <span
            className='link-text'
            onClick={() => navigate('/habit-categories')}
          >
            카테고리 관리
          </span>
          )
        </p>
      </div>
    );
  }

  return (
    <div className='todo-add-view'>
      {' '}
      {/* 스타일 재사용 */}
      <header className='header-bar'>
        {/* 뒤로가기 버튼 */}
        <button className='back-button' onClick={() => navigate(-1)}>
          &lt;
        </button>
        <h1 className='title'>{isEditMode ? '습관 수정' : '습관 추가'}</h1>
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

        {/* 2. 습관 카테고리 선택 (새로 추가된 부분) */}
        <div className='input-group'>
          <label>카테고리</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className='select-input'
          >
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        {/* 3. 설명 입력 */}
        <div className='input-group'>
          <label>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='상세 내용을 입력하세요 (선택)'
            className='textarea-input'
          />
        </div>

        {/* *주의: 습관에는 dueDate/Time 필드가 없으므로, TodoAddView의 기한 관련 필드는 제거합니다. */}
      </main>
    </div>
  );
};

export default HabitAddView;
