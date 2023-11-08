const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const User = require('../models/user')

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).lean()
    .then(user => {
        done(null, user);
    });
});

passport.use(new LocalStrategy( async (username, password, done) => {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return done(null, false, { message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        }
        
        user.comparePassword(password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) return done(null, user);
            return done(null, false, { message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        });
    } catch (error) {
        done(error);
    }
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    const newUser = {
        googleId: profile.id,
        username: profile.id,
        full_name: profile.displayName,
        email: profile.emails[0].value
    };
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // Nếu người dùng đã tồn tại, trả về người dùng
            done(null, user);
        } else {
            // Nếu người dùng chưa tồn tại, tạo người dùng mới
            user = await User.create(newUser);
            done(null, user);
        }
    } catch (error) {
        done(error);
    }
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'email']
},
async (accessToken, refreshToken, profile, done) => {
    const newUser = {
        facebookId: profile.id,
        username: profile.id,
        full_name: profile.displayName,
        email: profile.emails[0].value
    };
    try {
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
            // Nếu người dùng đã tồn tại, trả về người dùng
            done(null, user);
        } else {
            // Nếu người dùng chưa tồn tại, tạo người dùng mới
            user = await User.create(newUser);
            done(null, user);
        }
    } catch (error) {
        done(error);
    }
}));