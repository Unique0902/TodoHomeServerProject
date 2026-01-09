import api from './client';

// 1. 프로젝트 목록 조회
export const getProjects = async (options = {}) => {
  const params = {};
  if (options.topLevelOnly) {
    params.topLevelOnly = 'true';
  }
  if (options.parentProjectId) {
    params.parentProjectId = options.parentProjectId;
  }
  if (options.status) {
    params.status = options.status;
  }
  const response = await api.get('/projects', { params });
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

// 7. 프로젝트에 준비물 추가
export const addProjectItem = async (projectId, itemData) => {
  const response = await api.post(`/projects/${projectId}/items`, itemData);
  return response.data;
};

// 8. 프로젝트 준비물 수정
export const updateProjectItem = async (projectId, itemId, itemData) => {
  const response = await api.patch(`/projects/${projectId}/items/${itemId}`, itemData);
  return response.data;
};

// 9. 프로젝트 준비물 삭제
export const deleteProjectItem = async (projectId, itemId) => {
  const response = await api.delete(`/projects/${projectId}/items/${itemId}`);
  return response.data;
};

// 10. 프로젝트에 URL 추가
export const addProjectUrl = async (projectId, urlData) => {
  const response = await api.post(`/projects/${projectId}/urls`, urlData);
  return response.data;
};

// 11. 프로젝트 URL 수정
export const updateProjectUrl = async (projectId, urlId, urlData) => {
  const response = await api.patch(`/projects/${projectId}/urls/${urlId}`, urlData);
  return response.data;
};

// 12. 프로젝트 URL 삭제
export const deleteProjectUrl = async (projectId, urlId) => {
  const response = await api.delete(`/projects/${projectId}/urls/${urlId}`);
  return response.data;
};
