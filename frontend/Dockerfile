# todo-frontend/Dockerfile

# 1. 빌드 스테이지: React 앱 빌드
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
# 프로덕션 빌드 실행 (Vite 환경 변수 사용)
RUN npm run build  

# 2. 프로덕션 스테이지: Nginx 웹 서버 환경
FROM nginx:alpine

# 빌드된 정적 파일들을 Nginx의 기본 웹 루트로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 기본 Nginx 설정 파일 교체 (나중에 리버스 프록시 설정을 위해 사용)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]