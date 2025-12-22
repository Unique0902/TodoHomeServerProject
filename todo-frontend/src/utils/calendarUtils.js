// src/utils/calendarUtils.js

// 주의 시작일 (일요일)을 기준으로 해당 주의 날짜들을 배열로 반환
export const getWeekDays = (startDate) => {
  const start = new Date(startDate);
  // start가 이미 주의 시작일(일요일, 0)이 아닐 경우, 이전 일요일로 이동
  start.setDate(start.getDate() - start.getDay());

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(date);
  }
  return days;
};

// YYYY-MM-DD 형식의 문자열로 변환
export const formatDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 주의 월 정보 반환 (와이어프레임: 작은 월 기준으로 표시)
export const getMonthLabel = (weekDays) => {
  const firstMonth = weekDays[0].getMonth() + 1;
  const lastMonth = weekDays[6].getMonth() + 1;

  if (firstMonth === lastMonth) {
    return `${firstMonth}월`;
  } else {
    // 작은 월 기준으로 표시 (예: 10월)
    const smallerMonth = Math.min(firstMonth, lastMonth);
    return `${smallerMonth}월`;
  }
};

// 오늘 날짜를 기준으로 주의 시작일(일요일)을 반환
export const getStartOfWeek = (date = new Date()) => {
  const start = new Date(date);
  // 현재 요일 (0:일, 6:토) 만큼 거꾸로 이동
  start.setDate(start.getDate() - start.getDay());
  return start;
};
