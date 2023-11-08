exports.isAdmin = (req, res, next) => {
    if (req.user) {
        if (req.user.is_admin) return next()
        return res.redirect('/user')
    }
    res.redirect('/login')
}

exports.isUser = (req, res, next) => {
    if (req.user) {
        if (!req.user.is_admin) return next()
        return res.redirect('/admin')
    }
    res.redirect('/login')
}

exports.isLogin = (req, res, next) => {
    if (!req.user) return next()
    if (req.user.is_admin) return res.redirect('/admin')
    res.redirect('/user')
}