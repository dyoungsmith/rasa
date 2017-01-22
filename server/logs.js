'use strict'

module.exports = require('express').Router()
  .post('/', (req, res, next) => {
      console.log("THIS IS COMING FROM THE BROWSER", req.body);
      res.end();
    })

