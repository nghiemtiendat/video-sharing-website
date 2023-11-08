const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const User = require('../models/user')
const Category = require('../models/category')
const Video = require('../models/video')
const Config = require('../models/config')

// admin home
exports.adminHome = (req, res) => {
    res.render('adminHome', { layout: 'admin', title: 'Admin Home', username: req.user.username })
}

// user management
exports.userManagement = (req, res, next) => {
    User.find({ is_admin: false }).lean()
    .then(users => {
        res.render('userManagement', { layout: 'admin', title: 'User Management', username: req.user.username, users })
    })
    .catch(err => {
        next(err)
    })
}

exports.viewUser = (req, res) => {
    User.findById(req.params.user_id)
    .then(user => {
        if (!user) {
            throw new Error('Người dùng không tồn tại')
        }
        res.json({ success: true, message: 'Tìm kiếm thành công', data: user })
    })
    .catch(err => {
        res.json({ success: false, message: 'Tìm kiếm thất bại: ' + err.message })
    })
}

exports.activeUser = (req, res) => {
    // active user
    if (req.body.is_active == 'true') {
        User.findByIdAndUpdate(req.params.user_id, { is_active: true })
        .then(user => {
            if (!user) {
                throw new Error('Người dùng không tồn tại')
            }
            res.json({ success: true, message: 'Mở khóa người dùng thành công' })
        })
        .catch(err => {
            res.json({ success: false, message: 'Mở khóa người dùng thất bại: ' + err.message })
        })
    }
    // inactive user
    else {
        User.findByIdAndUpdate(req.params.user_id, { is_active: false })
        .then(user => {
            if (!user) {
                throw new Error('Người dùng không tồn tại')
            }
            res.json({ success: true, message: 'Khóa người dùng thành công' })
        })
        .catch(err => {
            res.json({ success: false, message: 'Khóa người dùng thất bại: ' + err.message })
        })
    }
}

exports.deleteUser = (req, res) => {
    // delete user
    User.findByIdAndDelete(req.params.user_id)
    .then(() => {
        // delete user video
        Video.deleteMany({ user_id: req.params.user_id })
        .then(() => {
            res.json({ success: true, message: 'Xóa người dùng thành công' })
        })
    })
    .catch(err => {
        res.json({ success: false, message: 'Xóa người dùng thất bại: ' + err.message })
    })
}

// category management
exports.categoryManagement = (req, res, next) => {
    Category.find().lean()
    .then(categories => {
        res.render('categoryManagement', { layout: 'admin', title: 'Category Management', username: req.user.username, categories })
    })
    .catch(err => {
        next(err)
    })
}

exports.addCategory = (req, res) => {
    // valid inputs
    let result = validationResult(req)
    if (result.errors.length != 0) {
        return res.json({ success: false, message: 'Thêm chuyên mục thất bại: ' + result.errors[0].msg })
    }
    // add new category
    let category = new Category({ name: req.body.name, content: req.body.content, createdAt: new Date(), updatedAt: new Date() })
    category.save()
    res.json({ success: true, message: 'Thêm chuyên mục thành công', data: category })
}

exports.deleteCategory = (req, res) => {
    // delete category
    Category.findByIdAndDelete(req.params.category_id)
    .then(() => {
        // delete videos of this category
        Video.deleteMany({ category_id: req.params.category_id })
        .then(() => {
            res.json({ success: true, message: 'Xóa chuyên mục thành công' })
        })
    })
    .catch(err => {
        res.json({ success: false, message: 'Xóa chuyên mục thất bại: ' + err.message })
    })
}

exports.updateCategory = (req, res) => {
    // validate inputs
    let result = validationResult(req)
    if (result.errors.length != 0) {
        return res.json({ success: false, message: 'Sửa thông tin chuyên mục thất bại: ' + result.errors[0].msg })
    }
    // update category
    Category.findByIdAndUpdate(req.params.category_id, { name: req.body.name, content: req.body.content }, { returnDocument: 'after' })
    .then(category => {
        if (!category) {
            throw new Error('Chuyên mục không tồn tại')
        }
        res.json({ success: true, message: 'Cập nhật chuyên mục thành công', data: category })
    })
    .catch(err => {
        res.json({ success: false, message: 'Cập nhật chuyên mục thất bại: ' + err.message })
    })
}

// video management
exports.videoManagement = (req, res, next) => {
    Video.aggregate([
        // define condition
        { $match: { 'is_checked': true } },
        // join with users collection
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
        { $unwind: '$user_info' },
        // join with categories collection
        { $lookup: { from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_info' } },
        { $unwind: '$category_info' },
        // define needed fields
        { $project: { user_name: '$user_info.full_name', category_name: '$category_info.name', createdAt: 1, updatedAt: 1, is_feature: 1 } }
    ])
    .then(videos => {
        res.render('videoManagement', { layout: 'admin', title: 'Video Management', username: req.user.username, videos })
    })
    .catch(err => {
        next(err)
    })
}

exports.viewVideo = (req, res) => {
    Video.aggregate([
        // define condition
        { $match: { '_id': new mongoose.Types.ObjectId(req.params.video_id) } },
        // join with users collection
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
        { $unwind: '$user_info' },
        // join with categorise collection
        { $lookup: { from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_info' } },
        { $unwind: '$category_info' },
        // define needed fields
        { $project: { url: 1, user_name: '$user_info.full_name', category_name: '$category_info.name', title: 1, description: 1, is_private: 1, is_feature: 1 } }
    ])
    .then(video => {
        if (!video[0]) {
            throw new Error('Video không tồn tại')
        }
        res.json({ success: true, message: 'Tìm kiếm video thành công', data: video[0] })
    })
    .catch(err => {
        res.json({ success: false, message: 'Tìm kiếm video thất bại: ' + err.message })
    })
}

exports.featureVideo = (req, res) => {
    // choose feature video
    if (req.body.is_feature == 'true') {
        Video.findByIdAndUpdate(req.params.video_id, { is_feature: true })
        .then(video => {
            if (!video) {
                throw new Error('Video không tồn tại')
            }
            res.json({ success: true, message: 'Chọn video làm feature thành công' })
        })
        .catch(err => {
            res.json({ success: false, message: 'Chọn video làm feature thất bại: ' + err.message })
        })
    }
    // cancel feature video
    else {
        Video.findByIdAndUpdate(req.params.video_id, { is_feature: false })
        .then(video => {
            if (!video) {
                throw new Error('Video không tồn tại')
            }
            res.json({ success: true, message: 'Hủy chọn feature thành công' })
        })
        .catch(err => {
            res.json({ success: false, message: 'Hủy chọn feature thất bại: ' + err.message })
        })
    }
}

exports.deleteVideo = (req, res) => {
    Video.findByIdAndDelete(req.params.video_id)
    .then(() => {
        res.json({ success: true, message: 'Xóa video thành công' })
    })
    .catch(err => {
        res.json({ success: false, message: 'Xóa video thất bại: ' + err.message })
    })
}

// Check video
exports.checkVideo = (req, res, next) => {
    Video.aggregate([
        // define condition
        { $match: { 'is_checked': false } },
        // join with users collection
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
        { $unwind: '$user_info' },
        // join with categorise collection
        { $lookup: { from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_info' } },
        { $unwind: '$category_info'}, 
        // define needed fields
        { $project:{ user_name: '$user_info.full_name', category_name : '$category_info.name', createdAt: 1, updatedAt: 1, is_feature: 1 } }
    ])
    .then(videos => {
        res.render('checkVideo', { layout: 'admin', title: 'Check video', username: req.user.username, videos })
    })
    .catch(err => {
        next(err)
    })
}

exports.acceptVideo = (req, res) => {
    Video.findByIdAndUpdate(req.params.video_id, { is_checked: true })
    .then(video => {
        if (!video) {
            throw new Error('Video không tồn tại')
        }
        res.json({ success: true, message: 'Duyệt video thành công' })
    })
    .catch(err => {
        res.json({ success: false, message: 'Duyệt video thất bại: ' + err.message })
    })
}

// system config
exports.systemConfig = (req, res, next) => {
    Config.findOne({})
    .then(config => {
        res.render('systemConfig', { layout: 'admin', title: 'System Configure', username: req.user.username, max_size: config.max_size, max_length: config.max_length, max_quantity: config.max_quantity })
    })
    .catch(err => {
        next(err)
    })
}

exports.updateConfig = (req, res) => {
    // validate inputs
    let result = validationResult(req)
    if (result.errors.length != 0) {
        return res.json({ success: false, message: result.errors[0].msg })
    }
    // update system config
    Config.updateOne({}, {
        max_size: req.body.max_size,
        max_length: req.body.max_length,
        max_quantity: req.body.max_quantity
    })
    .then(() => {
        res.json({ success: true, message: 'Cập nhật hệ thống thành công' })
    })
    .catch(err => {
        res.json({ success: false, message: 'Cập nhật hệ thống thất bại: ' + err.message })
    })
}