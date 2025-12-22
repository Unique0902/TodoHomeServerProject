import api from './client';

// 1. 위시리스트 목록 조회
export const getWishlists = async () => {
  const response = await api.get('/wishlists');
  return response.data;
};

// 2. 위시리스트 ID로 상세 조회
export const getWishlistById = async (id) => {
  const response = await api.get(`/wishlists/${id}`);
  return response.data;
};

// 3. 위시리스트 생성
export const createWishlist = async (wishlistData) => {
  const response = await api.post('/wishlists', wishlistData);
  return response.data;
};

// 4. 위시리스트 완료 상태 토글 및 부분 수정
export const updateWishlistStatus = async (id, isCompleted) => {
  const response = await api.patch(`/wishlists/${id}`, { isCompleted });
  return response.data;
};

// 5. 위시리스트 삭제
export const deleteWishlist = async (id) => {
  await api.delete(`/wishlists/${id}`);
};

// 6. 위시리스트 수정 (일반 필드)
export const updateWishlist = async (id, wishlistData) => {
  const response = await api.patch(`/wishlists/${id}`, wishlistData);
  return response.data;
};
