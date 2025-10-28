const request = require('supertest');
const app = require('../server');
// setup.js에서 DB 정리 함수만 가져옵니다.
const { clearDatabase } = require('./setup');
const Habit = require('../models/Habit');
const HabitCategory = require('../models/HabitCategory');

describe('Habit and HabitCategory API Integration Tests', () => {
  let testCategoryId;
  let testHabitId;
  const API_HABIT = '/api/v1/habits';
  const API_CATEGORY = '/api/v1/habit-categories';
  const TODAY = '2025-10-28';
  const TODAY_DATE = new Date(TODAY);

  // [핵심 수정] beforeEach: 각 테스트 전에 데이터를 새로 생성하여 격리 보장
  beforeEach(async () => {
    // 1. 테스트용 카테고리 생성
    const category = await HabitCategory.create({ title: 'Routine' });
    testCategoryId = category._id.toString();

    // 2. 테스트용 습관 생성
    // 이 습관은 2025-10-27의 완료 기록을 가지고 시작합니다.
    const habit = await Habit.create({
      title: 'Morning Run',
      habitCategoryId: testCategoryId,
      completedDates: [new Date('2025-10-27')],
    });
    testHabitId = habit._id.toString();
  });

  afterEach(async () => {
    // 각 테스트 후 데이터 정리 완료 보장
    return clearDatabase();
  });

  // -----------------------------------------------------------
  // Habit Category (배열 수정 로직) 테스트
  // -----------------------------------------------------------

  it('should add a date to selectedDates array (PATCH category, action: add)', async () => {
    const response = await request(app)
      .patch(`${API_CATEGORY}/${testCategoryId}`)
      .send({ action: 'add', date: TODAY })
      .expect(200);

    const dates = response.body.selectedDates.map((d) =>
      new Date(d).toDateString()
    );
    expect(dates).toContain(TODAY_DATE.toDateString());
  });

  // -----------------------------------------------------------
  // Habit (완료 날짜 배열 수정 로직) 테스트
  // -----------------------------------------------------------

  it('should add a date to completedDates array (PATCH habit, action: add)', async () => {
    const response = await request(app)
      .patch(`${API_HABIT}/${testHabitId}`)
      .send({ action: 'add', date: TODAY })
      .expect(200);

    // beforeAll에서 1개, 여기서 1개가 추가되어 총 2개의 날짜가 있어야 합니다.
    const dates = response.body.completedDates.map((d) =>
      new Date(d).toDateString()
    );
    expect(dates).toContain(TODAY_DATE.toDateString());
    expect(dates.length).toBe(2);
  });

  it('should remove a date from completedDates array (PATCH habit, action: remove)', async () => {
    // beforeAll에서 생성된 기록(2025-10-27)을 제거합니다.
    const response = await request(app)
      .patch(`${API_HABIT}/${testHabitId}`)
      .send({ action: 'remove', date: '2025-10-27' })
      .expect(200);

    // 2025-10-27이 제거되었는지 확인
    const dates = response.body.completedDates.map((d) =>
      new Date(d).toDateString()
    );
    expect(dates).not.toContain(new Date('2025-10-27').toDateString());
    expect(dates.length).toBe(0);
  });

  // __tests__/habit.test.js 파일 내부 (describe 블록 안에 추가)
  // ...

  // -----------------------------------------------------------
  // Habit Category (기본 CRUD 보강) 테스트
  // -----------------------------------------------------------

  it('should create a new Habit Category (POST /habit-categories)', async () => {
    const newCategory = { title: 'New Hobby' };
    const response = await request(app)
      .post(API_CATEGORY)
      .send(newCategory)
      .expect(201);

    expect(response.body.title).toBe('New Hobby');
    expect(response.body.selectedDates.length).toBe(0);
  });

  it('should delete a Habit Category (DELETE /habit-categories/:id)', async () => {
    // beforeEach에서 생성된 testCategoryId 사용
    await request(app).delete(`${API_CATEGORY}/${testCategoryId}`).expect(204);

    const dbCategory = await HabitCategory.findById(testCategoryId);
    expect(dbCategory).toBeNull();
  });

  // ...

  // -----------------------------------------------------------
  // 커스텀 API: 일괄 초기화 로직 테스트
  // -----------------------------------------------------------

  it('should reset completions for all habits in a category (POST /reset-completions)', async () => {
    // [수정] beforeAll에서 생성된 습관 외에 1개를 추가 생성하여 총 2개로 만듭니다.
    const secondHabit = await Habit.create({
      title: 'Second Habit',
      habitCategoryId: testCategoryId,
      completedDates: [TODAY_DATE], // 오늘 날짜 기록 포함
    });

    // 기존 습관에도 오늘 날짜를 추가 (총 2개 습관 모두 오늘 기록 보유)
    await Habit.findByIdAndUpdate(testHabitId, {
      $addToSet: { completedDates: TODAY_DATE },
    });

    // 3. 일괄 초기화 API 호출
    const response = await request(app)
      .post(`${API_HABIT}/reset-completions`)
      .send({ categoryId: testCategoryId, date: TODAY })
      .expect(200);

    // 4. 응답 확인: 2개의 습관이 수정되었는지 확인
    expect(response.body.modifiedCount).toBe(2);

    // 5. DB 검증: 두 습관 모두 오늘 날짜가 제거되었는지 확인
    const habitsAfterReset = await Habit.find({
      habitCategoryId: testCategoryId,
    });

    habitsAfterReset.forEach((habit) => {
      const dates = habit.completedDates.map((d) => d.toDateString());
      expect(dates).not.toContain(TODAY_DATE.toDateString());
    });
  });
});
