const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const ToDo = require('../models/ToDo');

module.exports = Router().get('/', [authenticate], async (req, res, next) => {
  try {
    const todos = await ToDo.getAll();
    res.json(todos);
  } catch (e) {
    next(e);
  }
});
