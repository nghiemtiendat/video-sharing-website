const express = require('express')
const passport = require('passport')
const accountController = require('../controllers/accountController')
const checkLogin = require('../middlewares/checkLogin')

const router = express.Router()

router.get('/', (req, res) => res.redirect('login'))

// login with local
router.get('/login', checkLogin.isLogin, accountController.showLogin);
router.post('/login', accountController.login);


// login with google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/user');
});

// login with facebook
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/user');
});

// forgot password
router.get('/forgot-password', accountController.showForgotPassword);
router.post('/forgot-password', accountController.forgotPassword);

router.get('/reset-password/:token', accountController.showResetPassword);
router.post('/reset-password/:token', accountController.resetPassword);


// register handle
router.get('/register', checkLogin.isLogin, accountController.showRegister)
router.post('/register', accountController.register)

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) next(err);
        res.redirect('/login');
    });
});

module.exports = router