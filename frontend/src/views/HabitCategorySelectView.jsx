import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllHabitCategories,
  toggleCategorySelection,
  updateHabitCategoryTitle,
  deleteHabitCategory,
} from '../api/habitApi';
import api from '../api/client'; // axios 클라이언트 임포트
import '../styles/HabitCategorySelectView.css';

// 오늘의 날짜를 YYYY-MM-DD 형식으로 가져오는 헬퍼 함수
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitsView = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString()); // 오늘 날짜 기본값

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

  useEffect(() => {
    fetchCategories();
  }, []);

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

  // --- 1. 카테고리 선택 로직 (핵심) ---
  const handleCategorySelect = async (categoryId) => {
    const currentId = selectedCategoryId;

    // 1. 이미 선택된 카테고리인 경우 (동일 카테고리 재선택)
    if (currentId === categoryId) {
      alert('이미 오늘 선택된 카테고리입니다.');
      return;
    }

    // 2. 기존 선택 카테고리가 있다면, 해당 카테고리에서 오늘 날짜 제거 (선택 해제)
    if (currentId) {
      try {
        // PATCH 요청: 기존 카테고리에서 날짜 제거
        await toggleCategorySelection(currentId, 'remove', selectedDate);
        // **[데이터 초기화 로직 필요]**
        // API 명세에는 없지만, 여기서 기존 카테고리의 모든 Habit 데이터를 초기화/삭제하는 로직이 필요합니다.
        // 이는 백엔드에 `/habits/reset?categoryId={id}` 같은 API가 필요합니다.
      } catch (e) {
        console.error('기존 카테고리 해제 실패');
      }
    }

    // 3. 새 카테고리에 오늘 날짜 추가 (선택)
    try {
      // PATCH 요청: 새 카테고리에 날짜 추가
      await toggleCategorySelection(categoryId, 'add', selectedDate);
      fetchCategories(); // 목록 갱신
      alert(`카테고리가 ${selectedDate}에 선택되었습니다.`);
    } catch (error) {
      alert('카테고리 선택 실패');
    }
  };

  // --- 2. 수정/삭제/추가 로직 (Placeholder) ---

  // [TODO] 카테고리 수정 페이지로 이동
  const handleEdit = (category) => {
    // 실제로는 별도의 EditView로 이동시키거나 모달을 띄웁니다.
    const newTitle = prompt(`"${category.title}"의 새 이름을 입력하세요:`);
    if (newTitle && newTitle !== category.title) {
      // updateHabitCategoryTitle(category._id, newTitle).then(fetchCategories);
      alert(`"${category.title}" 수정 기능 (구현 예정)`);
    }
  };

  // [TODO] 카테고리 추가 페이지로 이동
  const handleAdd = () => {
    const newTitle = prompt('새 카테고리 이름을 입력하세요:');
    if (newTitle) {
      createHabitCategory(newTitle).then(fetchCategories);
    }
  };

  if (loading) return <div>로딩 중...</div>;

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
        <h2 className='list-title'>카테고리 선택</h2>
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
                onClick={() => handleCategorySelect(category._id)}
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

export default HabitsView;
