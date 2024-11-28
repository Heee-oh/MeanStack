const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(new LocalStrategy(
  {
      usernameField: 'email', // 'email' 필드를 사용자 이름으로 사용
  },
  async (username, password, done) => {
      try {
          // Mongoose의 findOne 메서드에 async/await 적용
          const user = await User.findOne({ email: username });
          if (!user) {
              return done(null, false, { message: 'Incorrect username.' });
          }

          // 비밀번호 검증
          const isValid = await user.validPassword(password);
          if (!isValid) {
              return done(null, false, { message: 'Incorrect password.' });
          }

          // 인증 성공
          return done(null, user);
      } catch (err) {
          // 에러 처리
          return done(err);
      }
  }
));
