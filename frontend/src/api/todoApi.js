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
