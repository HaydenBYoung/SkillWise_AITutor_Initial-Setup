const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/database/connection');
const { clearTestData } = require('../setup');

describe('Auth Endpoints', () => {
    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123'
    };

    beforeAll(async () => {
        // Clean up test data before running tests
        await clearTestData();
    });

    afterAll(async () => {
        // Clean up after tests
        await clearTestData();
        await pool.end();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body).toHaveProperty('accessToken');
        });

        it('should fail to register with existing email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400);


        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Clean DB and register user before each login test
            await clearTestData();
            await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);
        });

        it('should login successfully', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(res.body).toHaveProperty('accessToken');
            expect(res.headers['set-cookie']).toBeDefined();
            const cookie = res.headers['set-cookie'][0];
            expect(cookie).toMatch(/refreshToken=/);
            expect(cookie).toMatch(/HttpOnly/);
        });

        it('should fail with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    describe('GET /api/protected', () => {
        let accessToken;
        beforeEach(async () => {
            // Clean DB and register/login to get a valid token
            await clearTestData();
            await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);
            accessToken = loginRes.body.accessToken;
        });

        it('should access protected route with valid token', async () => {
            const res = await request(app)
                .get('/api/protected')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toBe('Protected content');
            expect(res.body).toHaveProperty('user');
        });

        it('should fail without token', async () => {
            // Clean DB to ensure no user/token
            await pool.query('TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE');
            await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
            const res = await request(app)
                .get('/api/protected')
                .expect(401);

            expect(res.body).toHaveProperty('code');
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('status');
        });
    });
});

