import api from './client';

// 1. 프로젝트 목록 조회
export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

// 2. 프로젝트 ID로 상세 조회
export const getProjectById = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

// 3. 프로젝트 생성
export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

// 4. 프로젝트 상태 업데이트 및 부분 수정
export const updateProjectStatus = async (id, status) => {
  const response = await api.patch(`/projects/${id}`, { status });
  return response.data;
};

// 5. 프로젝트 삭제
export const deleteProject = async (id) => {
  await api.delete(`/projects/${id}`);
};

// 6. 프로젝트 수정 (일반 필드)
export const updateProject = async (id, projectData) => {
  const response = await api.patch(`/projects/${id}`, projectData);
  return response.data;
};
