const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
// const authorize = require('../middleware/authorize.js');
const ToDo = require('../models/ToDo');

module.exports = Router()
  .get('/', [authenticate], async (req, res, next) => {
    try {
      const user_id = req.user.id;
      const todos = await ToDo.getAll(user_id);
      res.json(todos);
    } catch (e) {
      next(e);
    }
  })
  .post('/', [authenticate], async (req, res, next) => {
    try {
      const todo = await ToDo.insert({
        description: req.body.description,
        user_id: req.user.id,
      });
      res.json(todo);
    } catch (e) {
      next(e);
    }
  });
