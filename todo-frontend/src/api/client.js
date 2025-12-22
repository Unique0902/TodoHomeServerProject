// src/api/client.js
import axios from 'axios';

// baseURL을 상대 경로인 /api/v1로 설정
const api = axios.create({
  // 로컬 개발 환경에서는 VITE_API_URL이 http://localhost:3000/api/v1로 사용됨
  // Docker 환경에서 Nginx가 서빙할 때는 상대 경로 /api/v1로 요청이 전달되어 Nginx 프록시가 잡음
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
