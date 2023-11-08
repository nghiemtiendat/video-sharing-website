const { check } = require('express-validator')

module.exports = [
    check('name')
    .exists().withMessage('Vui lòng cung cấp tên chuyên mục')
    .notEmpty().withMessage('Tên chuyên mục không được để trống'),

    check('content')
    .exists().withMessage('Vui lòng cung cấp nội dung chuyên mục')
    .notEmpty().withMessage('Nội dung chuyên mục không được để trống'),
]