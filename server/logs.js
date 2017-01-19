'use strict'

module.exports = require('express').Router()
  .post('/', (req, res, next) => {
      console.log(req.body);
      res.end();
    })

