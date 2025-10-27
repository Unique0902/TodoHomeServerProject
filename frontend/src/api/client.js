// src/api/client.js
import axios from 'axios';

// 백엔드 서버의 기본 URL 설정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
