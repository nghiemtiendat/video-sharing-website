require('../middlewares/authentication')
const passport = require('passport')
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user')


exports.showLogin = (req, res) => {
    const username = req.cookies.username || '';
    const password = req.cookies.password || '';
    const rememberMe = req.cookies.rememberMe || false;

    res.render('login', { layout: '', error: req.flash('error'), username, password, rememberMe })
}


exports.login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error', 'Tên đăng nhập hoặc mật khẩu không chính xác.');
            return res.redirect('/login');
        }
        
        req.logIn(user, (err) => {
            if (err) return next(err);

            // Lưu thông tin đăng nhập vào session nếu người dùng chọn "Nhớ mật khẩu"
            if (req.body.rememberMe) {
                res.cookie('username', req.body.username);
                res.cookie('password', req.body.password);
                res.cookie('rememberMe', true)
            } else {
                res.clearCookie('username');
                res.clearCookie('password');
                res.clearCookie('rememberMe');
            }
            
            // Kiểm tra nếu đăng nhập với tài khoản admin
            if (user.is_admin) {
                return res.redirect('/admin');
            }
            return res.redirect('/user');
        });
    })(req, res, next);
};

exports.showRegister = (req, res) => {
    res.render('register', { layout: '', error: req.flash('error') });
};


exports.register = async (req, res, next) => {
    try {
        
        const existingUser = await User.findOne({ username: req.body.username });

        if (existingUser) {
            req.flash('error', 'Tên đăng nhập bạn nhập bị trùng, vui lòng kiểm tra và nhập cái khác.');
            return res.redirect('/register');
        }

        if (req.body.password !== req.body.repeatPassword) {
            req.flash('error', 'Mật khẩu nhập lại không khớp.');
            return res.redirect('/register');
        }


        // Tạo người dùng mới từ dữ liệu gửi lên
        const newUser = new User({
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            full_name: req.body.full_name,
            age: req.body.age,
            gender: req.body.gender,
            phone_number: req.body.phone_number,
            address: req.body.address,
        })
        // Lưu người dùng mới vào cơ sở dữ liệu
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        next(err)
    }
};
// Show forgot password page
exports.showForgotPassword = (req, res) => {
    res.render('forgot-password', { layout: '', error: req.flash('error'), success: req.flash('success') });
};

// Handle forgot password
// Chỉnh sửa hàm forgotPassword
exports.forgotPassword = async (req, res, next) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });

        if (!user) {
            req.flash('error', 'Không tìm thấy tài khoản với email này.');
            return res.redirect('/forgot-password');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.reset_password_token = resetToken;
        user.reset_password_expires = Date.now() + 86400000; // Expires in 1 hour
        await user.save();
        console.log("User after saving token and expiration:", user);
        //a
        console.log("Saved token:", resetToken);
        console.log("Expiration time:", user.reset_password_expires);
        //a

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL,
            subject: 'Đặt lại mật khẩu',
            text: `Bạn đã yêu cầu đặt lại mật khẩu của bạn.\n\n` +
                `Để đặt lại mật khẩu mới, vui lòng nhấp vào liên kết sau hoặc dán liên kết này vào trình duyệt của bạn:\n\n` +
                `http://${req.headers.host}/reset-password/${resetToken}\n\n` +
                `Nếu bạn không yêu cầu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.\n`,
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'Một email đã được gửi đến bạn với mật khẩu hiện tại và hướng dẫn cách đặt lại mật khẩu.');
            res.redirect('/forgot-password');
        });
    } catch (error) {
        next(error);
    }
};
// Show reset password page
exports.showResetPassword = async (req, res) => {
    try {
        // Tìm kiếm người dùng theo token
        const user = await User.findOne({ reset_password_token: req.params.token });

        // Kiểm tra thời gian hết hạn của token
        if (!user || user.reset_password_expires < Date.now()) {
            req.flash('error', 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
            return res.redirect('/forgot-password');
        }

        res.render('reset-password', { layout: '', error: req.flash('error'), success: req.flash('success'), token: req.params.token });
    } catch (error) {
        console.error("Error in showResetPassword:", error);
        req.flash('error', 'Có lỗi xảy ra. Vui lòng thử lại sau.');
        res.redirect('/forgot-password');
    }
};


// Handle reset password
exports.resetPassword = async (req, res, next) => {
    try {
        console.log("Token from form:", req.params.token); // Thêm dòng này

        const user = await User.findOne({ reset_password_token: req.params.token, reset_password_expires: { $gt: Date.now() } });


        if (!user) {
            req.flash('error', 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
            return res.redirect('/forgot-password');
        }

        if (req.body.new_password !== req.body.confirm_password) {
            req.flash('error', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
            return res.redirect(`/reset-password/${req.params.token}`);
        }
        
        // Update the user's password, and clear the reset token and expiration
        user.password = req.body.new_password;
        user.reset_password_token = undefined;
        user.reset_password_expires = undefined;
        await user.save();
        
        req.flash('error', 'Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập.');
        res.redirect('/login');
        
    } catch (error) {
        next(error);
    }
};
