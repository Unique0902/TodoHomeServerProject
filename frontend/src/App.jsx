// src/App.jsx (핵심 로직 예시)
import React, { useState, useEffect } from 'react';
import {
  getTodos,
  createTodo,
  updateTodoStatus,
  deleteTodo,
} from './api/todoApi';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [currentFilterDate, setCurrentFilterDate] = useState(''); // YYYY-MM-DD 형식

  // 할일 목록 불러오기
  const fetchTodos = async (date) => {
    const data = await getTodos(date);
    setTodos(data);
  };

  useEffect(() => {
    fetchTodos(currentFilterDate);
  }, [currentFilterDate]);

  // 할일 추가 핸들러
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTodo({ title: newTitle });
      setNewTitle('');
      fetchTodos(currentFilterDate); // 목록 갱신
    } catch (error) {
      alert('할일 추가 실패!');
    }
  };

  // 완료 상태 토글 핸들러
  const handleToggle = async (todo) => {
    try {
      // isCompleted 상태 반전하여 PATCH 요청
      await updateTodoStatus(todo._id, !todo.isCompleted);
      fetchTodos(currentFilterDate); // 목록 갱신
    } catch (error) {
      alert('상태 업데이트 실패!');
    }
  };

  return (
    <div className='container'>
      <h1>나만의 할일 관리 앱</h1>

      {/* 1. 할일 추가 폼 */}
      <input
        type='text'
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder='새 할일 추가...'
      />
      <button onClick={handleCreate}>추가</button>

      {/* 2. 날짜 필터링 입력 (옵션) */}
      <input
        type='date'
        onChange={(e) => setCurrentFilterDate(e.target.value)}
      />
      <button onClick={() => setCurrentFilterDate('')}>전체보기</button>

      {/* 3. 할일 목록 표시 */}
      <ul>
        {todos.map((todo) => (
          <li key={todo._id} onClick={() => handleToggle(todo)}>
            <span
              style={{
                textDecoration: todo.isCompleted ? 'line-through' : 'none',
              }}
            >
              {todo.title} ({new Date(todo.dueDate).toLocaleDateString()})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
