const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const verifyOwner = require('../middleware/verifyOwner.js');
// const authorize = require('../middleware/authorize.js');
const ToDo = require('../models/ToDo');

module.exports = Router()
  .get('/:id', [authenticate], async (req, res, next) => {
    try {
      const todo = await ToDo.getById(req.params.id);
      res.json(todo);
    } catch (e) {
      next(e);
    }
  })
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
  })
  .put('/:id', [authenticate, verifyOwner], async (req, res, next) => {
    try {
      const data = await ToDo.updateById(req.params.id, req.body);
      res.json(data);
    } catch (e) {
      next(e);
    }
  })
  .delete('/:id', [authenticate, verifyOwner], async (req, res, next) => {
    try {
      const id = req.params.id;
      const todo = await ToDo.delete(id);
      res.json(todo);
    } catch (e) {
      next(e);
    }
  });
