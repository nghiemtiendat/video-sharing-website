const { check } = require('express-validator')

module.exports = [
    check('max_size')
    .exists().withMessage('Vui lòng cung cấp kích thước tối đa của video')
    .notEmpty().withMessage('Kích thước tối đa không được để trống')
    .isInt({ min: 1 }).withMessage('Kích thước tối đa phải là số nguyên dương'),

    check('max_length')
    .exists().withMessage('Vui lòng cung cấp thời lượng tối đa của video')
    .notEmpty().withMessage('Thời lượng tối đa không được để trống')
    .isInt({ min: 1 }).withMessage('Thời lượng tối đa phải là số nguyên dương'),

    check('max_quantity')
    .exists().withMessage('Vui lòng cung cấp số lượng video tối đa')
    .notEmpty().withMessage('Số lượng video tối đa không được để trống')
    .isInt({ min: 1 }).withMessage('Số lượng video tối đa phải là số nguyên dương'),
]