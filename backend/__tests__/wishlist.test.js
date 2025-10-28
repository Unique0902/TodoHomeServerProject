const request = require('supertest');
const app = require('../server');
const { clearDatabase } = require('./setup');
const Wishlist = require('../models/Wishlist');

describe('Wishlist API Integration Tests', () => {
  let testWishlistId;
  const API_URL = '/api/v1/wishlists';

  // 각 테스트 전에 데이터 생성
  beforeEach(async () => {
    const wishlist = await Wishlist.create({
      title: '4K Monitor',
      description: 'Buy next year',
    });
    testWishlistId = wishlist._id.toString();
  });

  // 각 테스트 후 데이터 정리
  afterEach(async () => {
    return clearDatabase();
  });

  it('should create a new Wishlist item (POST /wishlists)', async () => {
    const newWish = { title: 'New Keyboard', description: 'Mechanical' };

    const response = await request(app).post(API_URL).send(newWish).expect(201); // 201 Created

    expect(response.body.title).toBe(newWish.title);
  });

  it('should fetch a single Wishlist item (GET /wishlists/:id)', async () => {
    const response = await request(app)
      .get(`${API_URL}/${testWishlistId}`)
      .expect(200);

    expect(response.body.title).toBe('4K Monitor');
  });

  it('should update a Wishlist title (PATCH /wishlists/:id)', async () => {
    const newTitle = '5K Monitor';

    const response = await request(app)
      .patch(`${API_URL}/${testWishlistId}`)
      .send({ title: newTitle })
      .expect(200);

    expect(response.body.title).toBe(newTitle);
  });

  it('should delete a Wishlist item (DELETE /wishlists/:id)', async () => {
    await request(app).delete(`${API_URL}/${testWishlistId}`).expect(204); // 204 No Content

    const dbWish = await Wishlist.findById(testWishlistId);
    expect(dbWish).toBeNull();
  });
});
