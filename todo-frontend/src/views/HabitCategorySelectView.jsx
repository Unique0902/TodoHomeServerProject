import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/HabitCategorySelectView.css';
import {
  getAllHabitCategories,
  createHabitCategory,
  updateHabitCategoryTitle,
  // 🌟 사용자님의 habitApi.js에 맞춰 'toggleCategorySelection'으로 임포트합니다.
  toggleCategorySelection,
  resetHabitCompletions,
  deleteHabitCategory,
} from '../api/habitApi';

// 오늘 날짜를 YYYY-MM-DD 형식으로 가져오는 헬퍼 함수
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitCategorySelectView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL 쿼리 파라미터에서 날짜를 가져오고, 없으면 오늘 날짜 사용
  const initialDate = searchParams.get('date') || getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // 카테고리 목록 불러오기
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

  // 현재 날짜에 선택된 카테고리 ID를 계산
  const selectedCategoryId = useMemo(() => {
    const selectedDay = new Date(selectedDate).toDateString();
    const found = categories.find((cat) =>
      // 선택된 날짜 문자열이 카테고리의 selectedDates 배열에 포함되어 있는지 확인
      cat.selectedDates.some(
        (dateStr) => new Date(dateStr).toDateString() === selectedDay
      )
    );
    return found ? found._id : null;
  }, [categories, selectedDate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- 2. 수정/추가 로직 ---

  // 카테고리 추가 핸들러 (플러스 버튼)
  const handleAdd = () => {
    const newTitle = prompt('새 카테고리 이름을 입력하세요:');
    if (newTitle) {
      // 생성 후 전체 목록을 다시 불러와 상태를 갱신합니다.
      createHabitCategory(newTitle)
        .then(() => {
          return fetchCategories();
        })
        .catch((err) => {
          alert('카테고리 추가에 실패했습니다.');
          console.error(err);
        });
    }
  };

  // 카테고리 수정 핸들러 (연필 버튼)
  const handleEdit = (category) => {
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

  // 카테고리 삭제 핸들러 (휴지통 버튼)
  const handleDelete = (category) => {
    if (
      !window.confirm(
        `"${category.title}" 카테고리를 삭제하시겠습니까?\n이 카테고리에 속한 모든 습관도 함께 삭제됩니다.`
      )
    ) {
      return;
    }

    deleteHabitCategory(category._id)
      .then(() => {
        alert('카테고리가 성공적으로 삭제되었습니다.');
        return fetchCategories();
      })
      .catch((err) => {
        alert('카테고리 삭제에 실패했습니다.');
        console.error(err);
      });
  };

  // --- 1. 카테고리 선택 로직 ---
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
      // 2. [기존 카테고리 변경 시 로직]
      if (
        !window.confirm(
          `카테고리를 변경하면 기존 습관 기록(${selectedDate})이 초기화됩니다. 변경하시겠습니까?`
        )
      ) {
        return;
      }

      try {
        // A. 기존 카테고리에서 날짜 제거 (OLD ID, 'remove')
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
    // else: currentId가 null인 경우 (즉, 첫 카테고리 선택인 경우), 이 블록을 건너뜁니다.

    // 3. 새 카테고리에 오늘 날짜 추가 (선택)
    // 이 블록은 currentId가 null이든 아니든 실행되어 새 카테고리를 선택합니다.
    try {
      // 새 카테고리에 'add' 액션으로 날짜 추가 (NEW ID, 'add')
      await toggleCategorySelection(categoryId, 'add', selectedDate);
      fetchCategories(); // 목록 갱신
      alert(
        `"${categoryTitle}"이(가) ${selectedDate}의 습관 카테고리로 설정되었습니다.`
      );
    } catch (error) {
      console.error('새 카테고리 선택 실패:', error);
      alert('새 카테고리 설정 중 오류가 발생했습니다.');
    }
  };
  // ------------------------------------------

  if (loading) return <div className='loading-state'>로딩 중...</div>;

  return (
    <div className='habits-view'>
      <header className='header-bar'>
        <h1 className='main-title'>카테고리 선택</h1>
        <div className='empty-spacer' />
      </header>

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
          {categories.length === 0 ? (
            <p className='empty-message'>카테고리를 추가해주세요.</p>
          ) : (
            categories.map((category) => (
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
                  {/* 선택 상태 아이콘 */}
                  {selectedCategoryId === category._id ? '✅ ' : '🔲 '}
                  {category.title}
                </span>

                {/* 연필 수정 버튼 */}
                <button
                  className='edit-button'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(category);
                  }}
                >
                  ✏️
                </button>

                {/* 휴지통 삭제 버튼 */}
                <button
                  className='delete-button'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(category);
                  }}
                >
                  🗑️
                </button>
              </li>
            ))
          )}
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
