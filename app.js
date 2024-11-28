require('dotenv').config(); // 2020700086 허찬욱
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// require('./models/db');
require('./app_api/models/db');
require('./app_api/models/users');

const passport = require('passport');

// var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const apiRouter = require('./app_api/routes/index');
require('./app_api/config/passport');

const app = express();

const cors = require('cors');

const corsOptions = {
  origin : '*',
  optionsSuccessStatus : 200

};
app.use(cors(corsOptions));

app.use('/api', (req,res,next) =>{
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build')));
app.use(passport.initialize());




// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter)


//error handlers 
// Catch unauthorised errors
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') { 
    res
      .status(401)
      .json({"message" : err.name + ": " + err.message});
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get(/(\/about)|(\/location\/[a-z0-9]{24})/, function(req, res, next) {
  res.sendFile(path.join(__dirname, 'app_public', 'build', 'index.html'));
});

module.exports = app;
