# todo-server/Dockerfile

# 1. 빌드 스테이지: 의존성 설치 및 앱 빌드
FROM node:20-alpine AS builder

WORKDIR /app

# package.json과 package-lock.json을 복사하여 의존성 캐싱
COPY package*.json ./
RUN npm install --omit=dev  # 개발 의존성 제외하고 설치

# 소스 코드 복사
COPY . .

# 2. 프로덕션 스테이지: 최종 실행 환경
FROM node:20-alpine

WORKDIR /app

# 빌드 스테이지에서 설치된 의존성 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Node.js 서버는 5000번 포트를 사용하도록 설정했으므로 노출
EXPOSE 5000

# PM2로 서버를 실행 (PM2는 Docker Compose에서 별도로 정의하여 사용 예정)
CMD ["node", "server.js"]