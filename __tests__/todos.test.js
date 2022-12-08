const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');
const ToDo = require('../lib/models/ToDo');

// Dummy user for testing
const mockUser = {
  email: 'test@example.com',
  password: '12345',
};

const mockUser2 = {
  email: 'test2@example.com',
  password: '123456',
};

const mockTodo = {
  description: 'Go on a walk',
};

const mockTodo2 = {
  description: 'Swim in a pool',
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
    await ToDo.insert({ ...mockTodo, user_id: user.id });
    await ToDo.insert({ ...mockTodo2, user_id: user2.id });
    const resp = await agent.get('/api/v1/todos');
    expect(resp.status).toEqual(200);
    expect(resp.body[0]).toEqual({
      id: expect.any(String),
      description: mockTodo.description,
      user_id: user.id,
      complete: false,
      created_at: expect.any(String),
    });
  });

  it('GET /api/v1/todos should return a 401 if not authenticated', async () => {
    const resp = await request(app).get('/api/v1/todos');
    expect(resp.status).toEqual(401);
  });

  it('GET /api/v1/items/:id should get a single todo', async () => {
    // create a user
    const [agent, user] = await registerAndLogin();
    const todo = await ToDo.insert({ ...mockTodo, user_id: user.id });
    const resp = await agent.get(`/api/v1/todos/${todo.id}`);
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual({
      id: expect.any(String),
      description: mockTodo.description,
      user_id: user.id,
      complete: false,
      created_at: expect.any(String),
    });
  });

  it('POST /api/v1/todos creates a new todo with the current user', async () => {
    const [agent, user] = await registerAndLogin();
    const resp = await agent.post('/api/v1/todos').send(mockTodo);
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual({
      id: expect.any(String),
      description: mockTodo.description,
      user_id: user.id,
      complete: false,
      created_at: expect.any(String),
    });
  });

  it('UPDATE /api/v1/todos/:id should update an todo', async () => {
    // create a user
    const [agent, user] = await registerAndLogin();
    const todo = await ToDo.insert({ ...mockTodo, user_id: user.id });
    const updateTodo = { ...todo, description: 'oranges', complete: true };
    const resp = await agent.put(`/api/v1/todos/${todo.id}`).send(updateTodo);
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      id: updateTodo.id,
      description: updateTodo.description,
      user_id: updateTodo.id,
      complete: updateTodo.complete,
      created_at: expect.any(String),
    });
  });

  it('UPDATE /api/v1/todos/:id should return a 403 if not authorized', async () => {
    // create a user
    const [user] = await registerAndLogin();
    // create a todo with user_id of current user
    const todo = await ToDo.insert({ ...mockTodo, user_id: user.id });
    // create and login as a new user
    const [agent] = await registerAndLogin(mockUser2);
    // create an updated version of the todo as the new user
    const updateTodo = { ...todo, description: 'oranges', complete: true };
    // send the updated version to the api
    const resp = await agent.put(`/api/v1/todos/${todo.id}`).send(updateTodo);
    expect(resp.status).toBe(403);
    expect(resp.body.message).toEqual(
      'You are not authorized to access this item!'
    );
  });

  it('DELETE /api/v1/todos/:id should delete a todo for valid user', async () => {
    const [agent, user] = await registerAndLogin();
    const todo = await ToDo.insert({ ...mockTodo, user_id: user.id });
    const resp = await agent.delete(`/api/v1/todos/${todo.id}`);
    expect(resp.status).toBe(200);

    const check = await ToDo.getById(todo.id);
    expect(check).toBeNull();
  });

  it('DELETE /api/v1/todos/:id should return a 403 if not authorized', async () => {
    // create a user
    const [user] = await registerAndLogin();
    // create a todo with user_id of current user
    const todo = await ToDo.insert({ ...mockTodo, user_id: user.id });
    // create and login as a new user
    const [agent] = await registerAndLogin(mockUser2);
    // send a delete request to the api
    const resp = await agent.delete(`/api/v1/todos/${todo.id}`);
    expect(resp.status).toBe(403);
    expect(resp.body.message).toEqual(
      'You are not authorized to access this item!'
    );
  });
});
