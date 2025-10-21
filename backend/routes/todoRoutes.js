const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

// /api/v1/todos 경로에 대한 라우팅
router
  .route('/')
  .get(todoController.getAllTodos) // GET /api/v1/todos?date=...
  .post(todoController.createTodo); // POST /api/v1/todos

// /api/v1/todos/:id 경로에 대한 라우팅
router
  .route('/:id')
  .get(todoController.getTodo) // GET /api/v1/todos/:id
  .patch(todoController.updateTodoPartial) // PATCH /api/v1/todos/:id (예: isCompleted 토글)
  .put(todoController.updateTodoFull) // PUT /api/v1/todos/:id (전체 교체)
  .delete(todoController.deleteTodo); // DELETE /api/v1/todos/:id

module.exports = router;
