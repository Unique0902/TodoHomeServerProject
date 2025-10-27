import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllHabitCategories,
  toggleCategorySelection,
  resetHabitCompletions, // 👈 새로 추가된 API 임포트
  // ... 나머지 함수들
} from '../api/habitApi';
import '../styles/HabitCategorySelectView.css';

// ... (getTodayDateString 헬퍼 함수 유지) ...
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitCategorySelectView = () => {
  // 👈 컴포넌트 이름 변경 반영
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  // 현재 날짜에 선택된 카테고리 ID를 계산
  const selectedCategoryId = useMemo(() => {
    const selectedDay = new Date(selectedDate).toDateString();
    const found = categories.find((cat) =>
      cat.selectedDates.some(
        (dateStr) => new Date(dateStr).toDateString() === selectedDay
      )
    );
    return found ? found._id : null;
  }, [categories, selectedDate]);

  // 카테고리 목록 불러오기 (기존 함수 유지)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllHabitCategories();
      setCategories(data);
    } catch (error) {
      alert('카테고리 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- 2. 수정/삭제/추가 로직 (정의 추가) ---

  // 카테고리 추가 핸들러 (플러스 버튼)
  const handleAdd = () => {
    const newTitle = prompt('새 카테고리 이름을 입력하세요:');
    if (newTitle) {
      // [TODO] 실제로는 모달을 사용해 더 나은 UX를 제공해야 합니다.
      createHabitCategory(newTitle)
        .then(fetchCategories)
        .catch((err) => {
          alert('카테고리 추가에 실패했습니다.');
          console.error(err);
        });
    }
  };

  // 카테고리 수정 핸들러 (연필 버튼)
  const handleEdit = (category) => {
    // [TODO] 실제로는 별도의 EditView로 이동시키거나 모달을 띄웁니다.
    const newTitle = prompt(
      `"${category.title}"의 새 이름을 입력하세요:`,
      category.title
    );
    if (newTitle && newTitle.trim() !== category.title.trim()) {
      updateHabitCategoryTitle(category._id, newTitle)
        .then(fetchCategories)
        .catch((err) => {
          alert('카테고리 수정에 실패했습니다.');
          console.error(err);
        });
    }
  };

  // ... (fetchCategories 함수 유지) ...
  // ... (handleEdit, handleAdd 함수 유지) ...

  // --- 1. 카테고리 선택 로직 (핵심 수정) ---
  const handleCategorySelect = async (categoryId, categoryTitle) => {
    const currentId = selectedCategoryId;

    // 1. 이미 선택된 카테고리인 경우 (동일 카테고리 재선택)
    if (currentId === categoryId) {
      alert(
        `"${categoryTitle}"은(는) 이미 ${selectedDate}에 선택되어 있습니다.`
      );
      return;
    }

    if (currentId && currentId !== categoryId) {
      // 2. 기존 카테고리에서 날짜 제거 및 습관 데이터 초기화
      if (
        !window.confirm(
          `카테고리를 변경하면 기존 습관 기록(${selectedDate})이 초기화됩니다. 변경하시겠습니까?`
        )
      ) {
        return;
      }

      try {
        // A. 기존 카테고리에서 날짜 제거 (selectedDates 배열 수정)
        await toggleCategorySelection(currentId, 'remove', selectedDate);

        // B. **핵심: 기존 카테고리의 습관 완료 기록 초기화**
        await resetHabitCompletions(currentId, selectedDate);
      } catch (e) {
        console.error('기존 카테고리 해제 및 초기화 실패:', e);
        alert(
          '기존 카테고리 해제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        );
        return;
      }
    }

    // 3. 새 카테고리에 오늘 날짜 추가 (선택)
    try {
      await toggleCategorySelection(categoryId, 'add', selectedDate);
      fetchCategories(); // 목록 갱신
      alert(
        `"${categoryTitle}"이(가) ${selectedDate}의 습관 카테고리로 설정되었습니다.`
      );
    } catch (error) {
      alert('새 카테고리 선택 실패');
    }
  };
  // ------------------------------------------

  // ... (나머지 렌더링 코드 유지) ...
  return (
    <div className='habits-view'>
      <h1 className='main-title'>카테고리 선택</h1>

      {/* 1. 날짜 선택기 */}
      <input
        type='date'
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className='date-selector'
      />

      {/* 2. 카테고리 리스트 */}
      <section className='category-list-section'>
        <h2 className='list-title'>카테고리 목록</h2>
        <ul className='category-list'>
          {categories.map((category) => (
            <li
              key={category._id}
              className={`category-item ${
                selectedCategoryId === category._id ? 'selected' : ''
              }`}
            >
              {/* 선택 텍스트 */}
              <span
                className='category-text'
                // 카테고리 선택 핸들러 호출
                onClick={() =>
                  handleCategorySelect(category._id, category.title)
                }
              >
                {selectedCategoryId === category._id ? '✅ ' : '🔲 '}
                {category.title}
              </span>

              {/* 연필 수정 버튼 */}
              <button
                className='edit-button'
                onClick={() => handleEdit(category)}
              >
                ✏️
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. 추가 버튼 */}
      <button className='add-button' onClick={handleAdd}>
        +
      </button>
    </div>
  );
};

export default HabitCategorySelectView;
