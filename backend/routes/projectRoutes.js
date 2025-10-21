const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// /api/v1/projects 경로에 대한 라우팅
router
  .route('/')
  .get(projectController.getAllProjects) // GET /api/v1/projects (목록 조회)
  .post(projectController.createProject); // POST /api/v1/projects (프로젝트 생성)

// /api/v1/projects/:id 경로에 대한 라우팅
router
  .route('/:id')
  .get(projectController.getProject) // GET /api/v1/projects/:id (단일 조회)
  .patch(projectController.updateProjectPartial) // PATCH /api/v1/projects/:id (부분 수정, 예: isCompleted)
  .put(projectController.updateProjectFull) // PUT /api/v1/projects/:id (전체 교체)
  .delete(projectController.deleteProject); // DELETE /api/v1/projects/:id (삭제)

module.exports = router;
