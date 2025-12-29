import api from './client';

// 1. 가계부 조회
export const getAccountBook = async () => {
  const response = await api.get('/accountbook');
  return response.data;
};

// 2. 총 재산 업데이트
export const updateTotalAsset = async (totalAsset) => {
  const response = await api.patch('/accountbook', { totalAsset });
  return response.data;
};

// 3. 사고 싶은 것 추가
export const addWishItem = async (itemData) => {
  const response = await api.post('/accountbook/items', itemData);
  return response.data;
};

// 4. 사고 싶은 것 수정
export const updateWishItem = async (itemId, itemData) => {
  const response = await api.patch(`/accountbook/items/${itemId}`, itemData);
  return response.data;
};

// 5. 사고 싶은 것 삭제
export const deleteWishItem = async (itemId) => {
  const response = await api.delete(`/accountbook/items/${itemId}`);
  return response.data;
};

