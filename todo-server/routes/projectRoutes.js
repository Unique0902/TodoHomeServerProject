const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// /api/v1/projects 경로에 대한 라우팅
router
  .route('/')
  .get(projectController.getAllProjects) // GET /api/v1/projects (목록 조회)
  .post(projectController.createProject); // POST /api/v1/projects (프로젝트 생성)

// 준비물 관련 라우팅 (프로젝트 ID 하위 경로) - :id 라우트보다 먼저 정의
router.post('/:id/items', projectController.addProjectItem); // POST /api/v1/projects/:id/items (준비물 추가)
router.patch('/:id/items/:itemId', projectController.updateProjectItem); // PATCH /api/v1/projects/:id/items/:itemId (준비물 수정)
router.delete('/:id/items/:itemId', projectController.deleteProjectItem); // DELETE /api/v1/projects/:id/items/:itemId (준비물 삭제)

// /api/v1/projects/:id 경로에 대한 라우팅
router
  .route('/:id')
  .get(projectController.getProject) // GET /api/v1/projects/:id (단일 조회)
  .patch(projectController.updateProjectPartial) // PATCH /api/v1/projects/:id (부분 수정, 예: status)
  .put(projectController.updateProjectFull) // PUT /api/v1/projects/:id (전체 교체)
  .delete(projectController.deleteProject); // DELETE /api/v1/projects/:id (삭제)

module.exports = router;
