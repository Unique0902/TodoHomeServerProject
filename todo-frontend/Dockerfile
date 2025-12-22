# todo-frontend/Dockerfile

# 1. 빌드 스테이지: React 앱 빌드
FROM node:20-alpine AS build

WORKDIR /app

# package.json과 package-lock.json을 복사하여 의존성 캐싱
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# [핵심 수정] vite 실행 파일에 실행 권한 부여 (Permission Denied 해결)
RUN chmod +x node_modules/.bin/vite 

# 프로덕션 빌드 실행
RUN npm run build  

# 2. 프로덕션 스테이지: Nginx 웹 서버 환경
FROM nginx:alpine

# 빌드된 정적 파일들을 Nginx의 기본 웹 루트로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# [핵심 수정] Nginx 설정 파일 경로 수정
# assumption: nginx.conf 파일은 todo-frontend 폴더 안에 있습니다.
# Dockerfile이 todo-frontend 폴더 안에 있으므로, todo-frontend 경로를 제거해야 합니다.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
