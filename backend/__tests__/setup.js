const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// [수정] 이 함수는 Jest가 처음 환경을 설정할 때 한 번 호출됩니다.
module.exports.connect = async () => {
  // 1. 메모리 MongoDB 시작
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // 2. Mongoose 연결 시도
  await mongoose.connect(uri);

  // 3. 연결 상태가 'connected'가 될 때까지 명시적으로 기다립니다.
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) {
      // 1: connected
      resolve();
    } else {
      mongoose.connection.on('connected', resolve);
    }
  });
};

/**
 * [유지] 테스트 후에 모든 DB 데이터를 지웁니다.
 */
module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    try {
      await collection.deleteMany(); // 모든 문서 삭제
    } catch (error) {
      // "ns not found" 에러 무시
    }
  }
};

/**
 * [유지] 모든 테스트 실행 후 연결을 해제하고 메모리 서버를 중지합니다.
 */
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Jest의 setupFilesAfterEnv 훅을 위한 전역 연결/해제 설정
// Jest에게 모든 테스트 스위트 시작 전에 연결하고, 완료 후 해제하라고 명시적으로 명령합니다.
beforeAll(async () => await module.exports.connect(), 15000);
afterAll(async () => await module.exports.closeDatabase(), 15000);
