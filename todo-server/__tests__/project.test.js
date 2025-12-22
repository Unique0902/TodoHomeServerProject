const request = require('supertest');
const app = require('../server');
const { clearDatabase } = require('./setup');
const Project = require('../models/Project');

describe('Project API Integration Tests', () => {
  let testProjectId;
  const API_URL = '/api/v1/projects';

  // 각 테스트 전에 데이터 생성
  beforeEach(async () => {
    const project = await Project.create({
      title: 'Build Server',
      description: 'N100 deployment',
    });
    testProjectId = project._id.toString();
  });

  // 각 테스트 후 데이터 정리
  afterEach(async () => {
    return clearDatabase();
  });

  it('should create a new Project (POST /projects)', async () => {
    const newProject = { title: 'New App Idea', description: 'Design phase' };

    const response = await request(app)
      .post(API_URL)
      .send(newProject)
      .expect(201); // 201 Created

    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe(newProject.title);
    expect(response.body.isCompleted).toBe(false);
  });

  it('should fetch all Projects (GET /projects)', async () => {
    const response = await request(app).get(API_URL).expect(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Build Server');
  });

  it('should toggle isCompleted status (PATCH /projects/:id)', async () => {
    const response = await request(app)
      .patch(`${API_URL}/${testProjectId}`)
      .send({ isCompleted: true })
      .expect(200);

    expect(response.body.isCompleted).toBe(true);

    const dbProject = await Project.findById(testProjectId);
    expect(dbProject.isCompleted).toBe(true);
  });

  it('should delete a Project (DELETE /projects/:id)', async () => {
    await request(app).delete(`${API_URL}/${testProjectId}`).expect(204); // 204 No Content (삭제 성공)

    const dbProject = await Project.findById(testProjectId);
    expect(dbProject).toBeNull();
  });
});
