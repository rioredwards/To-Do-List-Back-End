const ToDo = require('../models/ToDo.js');

module.exports = async (req, res, next) => {
  try {
    const todo = await ToDo.getById(req.params.id);
    if (todo.user_id !== req.user.id)
      throw new Error('You are not authorized to access this item!');

    next();
  } catch (err) {
    err.status = 403;
    next(err);
  }
};
