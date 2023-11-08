require('dotenv').config();
const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const flash = require('connect-flash');

const database = require('./utils/database');
const accountRouter = require('./routers/accountRouter');
const userRouter = require('./routers/userRouter');
const adminRouter = require('./routers/adminRouter');
const checkLogin = require('./middlewares/checkLogin');

const app = express();
const PORT = process.env.PORT;

// connect to database
database.connect();

// set up view engine
app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultLayout: 'main',
    helpers: {
        DateFormat: function (date) {
            return date.toLocaleDateString('en-Gb');
        },
        BoolCheck: function (bool) {
            if (bool) {
                return '<i class="bi bi-check-lg"></i>';
            }
            return '';
        },
        VideoTitle: function(title) {
            if (title.length > 25) {
                return title.slice(0, 25) + ' ...'
            }
            return title
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true, // Thêm dòng này
    },
}));
app.set('view engine', 'hbs');

// set up middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60 * 1000 },
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/img/thumbnail', express.static(path.join(__dirname, '/img/thumbnail')));
app.use('/img/avatar', express.static(path.join(__dirname, '/img/avatar')));

// set up routers
app.use('/', accountRouter);
app.use('/admin', checkLogin.isAdmin, adminRouter);
app.use('/user', checkLogin.isUser, userRouter);

// 404 error
app.use((req, res) => {
    res.status(404).send('Trang không tồn tại');
});

// 500 error
app.use((err, req, res) => {
    res.status(500).send('Đã có lỗi xảy ra, vui lòng thử lại sau');
});

app.listen(PORT, () => console.log('Server is running on http://localhost:' + PORT));