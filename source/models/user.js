const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
    },
    password: String,
    googleId: String,
    facebookId: String,
    full_name: String,
    age: Number,
    gender: String,
    phone_number: String,
    email: String,
    address: String,
    avatar: {
        type: String,
        default: '/img/avatar/root.jpg',
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
}, { timestamps: true })

UserSchema.methods.comparePassword = function (candidatePassword, callback) {
    const user = this;

    if (!user.password) {
        return callback(new Error('Mật khẩu không tồn tại'));
    }

    if (user.password.startsWith('$2')) {
        bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
            if (err) {
                return callback(err);
            }
            callback(null, isMatch);
        });
    } else {
        const isMatch = candidatePassword === user.password;
        callback(null, isMatch);
    }
};

UserSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

module.exports = mongoose.model('User', UserSchema)