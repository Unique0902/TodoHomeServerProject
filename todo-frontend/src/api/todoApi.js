// src/api/todoApi.js
import api from './client';

// 1. 할일 목록 조회
export const getTodos = async (date) => {
  try {
    const response = await api.get('/todos', {
      params: date ? { date } : {},
    });
    return response.data;
  } catch (error) {
    console.error('할일 조회 실패:', error);
    throw error;
  }
};

// 2. 할일 생성
export const createTodo = async (todoData) => {
  const response = await api.post('/todos', todoData);
  return response.data;
};

// 3. 할일 상태 토글 및 부분 수정
export const updateTodoStatus = async (id, isCompleted) => {
  const response = await api.patch(`/todos/${id}`, { isCompleted });
  return response.data;
};

// 4. 할일 ID로 상세 조회
export const getTodoById = async (id) => {
  const response = await api.get(`/todos/${id}`);
  return response.data;
};

// 5. 할일 수정 (PATCH)
export const updateTodo = async (id, todoData) => {
  const response = await api.patch(`/todos/${id}`, todoData);
  return response.data;
};

// 6. 할일 삭제
export const deleteTodo = async (id) => {
  const response = await api.delete(`/todos/${id}`);
  return response.data;
};

// 7. 프로젝트 ID로 할일 목록 조회 (추가)
export const getTodosByProjectId = async (projectId) => {
  // 백엔드에는 아직 이 필터링 기능이 없지만, 쿼리 파라미터로 처리한다고 가정합니다.
  const response = await api.get('/todos', {
    params: { projectId },
  });
  return response.data;
};

// 8. 수행일이 지정되지 않은 할일 목록 조회
export const getTodosWithoutDate = async () => {
  try {
    const response = await api.get('/todos', {
      params: { noDueDate: 'true' },
    });
    return response.data;
  } catch (error) {
    console.error('수행일 없는 할일 조회 실패:', error);
    throw error;
  }
};

// 9. 실행일이 지난 미완료 할일 목록 조회
export const getOverdueTodos = async () => {
  try {
    const response = await api.get('/todos', {
      params: { overdue: 'true' },
    });
    return response.data;
  } catch (error) {
    console.error('지난 할일 조회 실패:', error);
    throw error;
  }
};
