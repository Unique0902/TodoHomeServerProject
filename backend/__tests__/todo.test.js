const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Express 앱 인스턴스 (server.js에서 export 필요)
const Todo = require('../models/Todo');
const { clearDatabase } = require('./setup');
// --- 주의: server.js 수정 필요 ---
// server.js 파일에서 app을 module.exports 해야 Supertest가 Express 인스턴스에 접근 가능합니다.
// ---------------------------------

beforeAll(async () => {
  /* 데이터 생성 로직만 남김 */
});
afterEach(async () => {
  return clearDatabase();
});

describe('Todo API Integration Tests', () => {
  const API_URL = '/api/v1/todos';

  it('should create a new Todo item (POST /todos)', async () => {
    const newTodo = { title: 'Test Todo', description: 'API Test' };

    const response = await request(app).post(API_URL).send(newTodo).expect(201); // 201 Created 확인

    // 응답 데이터 구조 확인
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe(newTodo.title);
    expect(response.body.isCompleted).toBe(false); // 기본값 확인

    // DB에 실제로 저장되었는지 확인
    const dbTodo = await Todo.findById(response.body._id);
    expect(dbTodo).not.toBeNull();
  });

  it('should fetch all Todos (GET /todos)', async () => {
    // 1. Task 1 생성 (먼저)
    await Todo.create({ title: 'Task 1' });
    // 2. Task 2 생성 (나중)
    await Todo.create({ title: 'Task 2' });

    const response = await request(app).get(API_URL).expect(200); // 200 OK 확인

    expect(response.body.length).toBe(2);

    // --- [수정된 부분] ---
    // 배열에 'Task 1'과 'Task 2'가 모두 포함되어 있는지 확인합니다.
    const titles = response.body.map((todo) => todo.title);
    expect(titles).toContain('Task 1');
    expect(titles).toContain('Task 2');
    // ----------------------
  });

  it('should filter Todos by date (GET /todos?date=YYYY-MM-DD)', async () => {
    const today = new Date('2025-10-28T10:00:00.000Z');
    const yesterday = new Date('2025-10-27T10:00:00.000Z');

    // 1. 오늘 날짜의 할일 생성
    await Todo.create({ title: 'Today Task', dueDate: today });
    // 2. 어제 날짜의 할일 생성
    await Todo.create({ title: 'Yesterday Task', dueDate: yesterday });

    const response = await request(app)
      .get(API_URL)
      .query({ date: '2025-10-28' }) // 2025-10-28로 필터링
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Today Task');
  });

  it('should update a Todo item status (PATCH /todos/:id)', async () => {
    // 더미 데이터 생성
    const todo = await Todo.create({
      title: 'Initial Task',
      isCompleted: false,
    });

    const response = await request(app)
      .patch(`${API_URL}/${todo._id}`)
      .send({ isCompleted: true })
      .expect(200); // 200 OK 확인

    expect(response.body.isCompleted).toBe(true);

    // DB에서도 변경되었는지 확인
    const updatedTodo = await Todo.findById(todo._id);
    expect(updatedTodo.isCompleted).toBe(true);
  });
});
