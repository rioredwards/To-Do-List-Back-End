const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');
const ToDo = require('../lib/models/Todo');

// Dummy user for testing
const mockUser = {
  email: 'test@example.com',
  password: '12345',
};

const mockUser2 = {
  email: 'test2@example.com',
  password: '123456',
};

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;

  // Create an "agent" that gives us the ability
  // to store cookies between requests in a test
  const agent = request.agent(app);

  // Create a user to sign in with
  const user = await UserService.create({ ...mockUser, ...userProps });

  // ...then sign in
  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
};

describe('todo routes', () => {
  beforeEach(() => {
    return setup(pool);
  });
  afterAll(() => {
    pool.end();
  });

  it('GET /api/v1/todos returns all todos associated with the authenticated User', async () => {
    // create a user
    const [agent, user] = await registerAndLogin();
    // add a second user with todos
    const user2 = await UserService.create(mockUser2);
    await ToDo.insert({
      description: 'Go on a walk',
      user_id: user.id,
    });
    await ToDo.insert({
      description: 'Swim in a pool',
      user_id: user2.id,
    });
    const resp = await agent.get('/api/v1/todos');
    expect(resp.status).toEqual(200);
    resp.body[0].created_at = null;
    expect(resp.body[0]).toMatchInlineSnapshot(`
      Object {
        "complete": false,
        "created_at": null,
        "description": "Go on a walk",
        "id": "1",
        "user_id": "1",
      }
    `);
  });

  it('GET /api/v1/todos should return a 401 if not authenticated', async () => {
    const resp = await request(app).get('/api/v1/todos');
    expect(resp.status).toEqual(401);
  });
});
