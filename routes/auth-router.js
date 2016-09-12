'use strict';

const Router = require('express').Router;
const jsonParser = require('body-parser').json();
const createError = require('http-errors');
// const ErrorHandler = require('../lib/error-handler');
const User = require('../model/user');
const BasicHttp = require('../lib/basic-http');
const jwtAuth = require('../lib/jwt-auth');
const authorization = require('../lib/authorization');

let authRouter = module.exports = exports = Router();

authRouter.post('/signup', jsonParser, (req, res, next) => {
  let newUser = new User();
  newUser.generateHash(req.body.password).then((tokenData) => {
    newUser.save().then(() => {

      res.json(tokenData);
    }, next(createError(400, 'Bad Request')));
  }, next(createError(500, 'Server Error')));
});

authRouter.get('/signin', BasicHttp, (req, res, next) => {
  User.findOne({'username': req.auth.username})
    .then((user) => {
      if (!user) return next(createError(401, 'Bad authentication'));
      user.comparePassword(req.auth.password).then(res.json.bind(res), next(createError(401, 'Invalid Login Info')));
    });
});

// Authorization/role edit route, currently not in our mvp I believe
authRouter.put('/editrole/:userid', jsonParser, jwtAuth, authorization(), (req, res, next) => {
  User.update({_id: req.params.userid}, {$set: {role: req.body.role}}).then(res.json.bind(res), createError(500, 'Server Error'));
});

// For admin to see all users
authRouter.get('/users', jsonParser, jwtAuth, authorization(), (req, res, next) => {
  User.find().then(res.json.bind(res), createError(500, 'Server Error'));
});
