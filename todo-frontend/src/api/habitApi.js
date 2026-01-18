import api from './client';

// 1. 특정 카테고리 ID로 습관 목록 조회 (GET /habits?categoryId=...)
export const getHabitsByCategoryId = async (categoryId) => {
  const response = await api.get('/habits', {
    params: { categoryId },
  });
  return response.data;
};

// 1-1. 특정 프로젝트 ID로 습관 목록 조회 (GET /habits?projectId=...)
export const getHabitsByProjectId = async (projectId) => {
  const response = await api.get('/habits', {
    params: { projectId },
  });
  return response.data;
};

// 2. 오늘의 Habit Category 정보 조회 (선택된 카테고리 정보와 날짜 배열)
export const getTodayHabitCategory = async () => {
  // 현재는 '오늘' 날짜에 선택된 카테고리를 DB에서 직접 조회하는 API가 없으므로,
  // 일단 모든 카테고리를 가져와서 클라이언트에서 로직을 처리하는 방향으로 구현합니다.
  // **(향후 서버에 '오늘의 카테고리' API 추가를 고려해야 함)**
  const response = await api.get('/habit-categories');
  return response.data;
};

// 3. 습관 완료/미완료 상태 토글 (배열 수정 로직 사용)
// date: YYYY-MM-DD 형식의 문자열 (오늘 날짜)
export const toggleHabitCompletion = async (id, isCompleted, date) => {
  const action = isCompleted ? 'add' : 'remove'; // 완료했으면 'add', 취소했으면 'remove'

  // completedDates 배열에 날짜를 안전하게 추가/제거하는 PATCH 요청
  const response = await api.patch(`/habits/${id}`, { action, date });
  return response.data;
};

// 4. Habit Category의 selectedDateArr 수정 (이동 시)
export const updateHabitCategoryDates = async (id, action, date) => {
  // selectedDates 배열에 날짜를 안전하게 추가/제거하는 PATCH 요청
  const response = await api.patch(`/habit-categories/${id}`, { action, date });
  return response.data;
};

// 5. 카테고리 목록 전체 조회
export const getAllHabitCategories = async () => {
  const response = await api.get('/habit-categories');
  return response.data;
};

// 6. 카테고리 생성
export const createHabitCategory = async (title) => {
  const response = await api.post('/habit-categories', { title });
  return response.data;
};

// 7. 카테고리 제목 수정
export const updateHabitCategoryTitle = async (id, title) => {
  const response = await api.patch(`/habit-categories/${id}`, { title });
  return response.data;
};

// 8. 카테고리 삭제
export const deleteHabitCategory = async (id) => {
  await api.delete(`/habit-categories/${id}`);
};

// 9. 특정 날짜의 카테고리 선택/선택 해제 (selectedDates 배열 수정)
export const toggleCategorySelection = async (id, action, date) => {
  // action: 'add' 또는 'remove'
  const response = await api.patch(`/habit-categories/${id}`, { action, date });
  return response.data;
};

// 10. 습관 완료 기록 일괄 초기화 (카테고리 변경 시 사용)
export const resetHabitCompletions = async (categoryId, date) => {
  const response = await api.post('/habits/reset-completions', {
    categoryId,
    date,
  });
  return response.data;
};

// 11. 습관 ID로 상세 조회
export const getHabitById = async (id) => {
  const response = await api.get(`/habits/${id}`);
  return response.data;
};

// 12. 습관 삭제
export const deleteHabit = async (id) => {
  await api.delete(`/habits/${id}`);
};

// 13. 습관 카테고리 단일 조회 (상세 정보 표시용)
export const getHabitCategoryById = async (id) => {
  const response = await api.get(`/habit-categories/${id}`);
  return response.data;
};

// 14. 습관 생성
export const createHabit = async (habitData) => {
  const response = await api.post('/habits', habitData);
  return response.data;
};

// 15. 습관 수정
export const updateHabit = async (id, habitData) => {
  // Habit의 PATCH는 배열 수정과 일반 필드 수정이 모두 가능하도록 컨트롤러가 구현되어 있습니다.
  // 여기서는 일반 필드만 수정하는 요청을 보냅니다.
  const response = await api.patch(`/habits/${id}`, habitData);
  return response.data;
};

// 16. 습관 URL 추가
export const addHabitUrl = async (habitId, urlData) => {
  const response = await api.post(`/habits/${habitId}/urls`, urlData);
  return response.data;
};

// 17. 습관 URL 수정
export const updateHabitUrl = async (habitId, urlId, urlData) => {
  const response = await api.patch(`/habits/${habitId}/urls/${urlId}`, urlData);
  return response.data;
};

// 18. 습관 URL 삭제
export const deleteHabitUrl = async (habitId, urlId) => {
  const response = await api.delete(`/habits/${habitId}/urls/${urlId}`);
  return response.data;
};
