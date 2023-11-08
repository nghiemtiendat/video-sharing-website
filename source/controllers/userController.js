const mongoose = require('mongoose');
const fs = require('fs')
const path = require('path');
const formidable = require('formidable');
const User = require('../models/user');
const Category = require('../models/category');
const Video = require('../models/video');
const PlayLists = require('../models/playlist');
const Comment = require('../models/comment');

exports.showHomePage = async (req, res, next) => {
    try {
        let featureVideo = await Video.aggregate([
            // define condition
            { $match: { 'is_feature': true } },
            // limit 4 videos
            { $limit: 4 },
            // join with users collection
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
            { $unwind: '$user_info' },
            // define needed fields
            { $project:{ url: 1, thumbnail: 1, title: 1, user_name: '$user_info.full_name' } },
        ])
        let otherVideo = await Video.aggregate([
            // define condition
            { $match: {
                'is_checked': true,
                'is_private': false
            } },
            // select 40 videos randomly
            { $sample: { size: 40 } },
            // join with users collection
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
            { $unwind: '$user_info' },
            // define needed fields
            { $project:{ thumbnail: 1, title: 1, user_name: '$user_info.full_name' } },
        ])
        res.render('userHome', { layout: 'user', userOnline: req.user, featureVideo, otherVideo })
    } catch (err) {
        next(err)
    }
}

exports.showUserProfile = async (req, res) => {
    let userVideo = await Video.findOne( { user_id: req.user._id })
    res.render('userProfile', { layout: 'user', userOnline: req.user, userVideo });
}

exports.showUserVideo = async (req, res) => {
    if (req.user) {
        let userVideo = await Video.aggregate([
            // define condition
            { $match: {
                'user_id': req.user._id,
                'is_checked': true
            } },
            // join with users collection
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
            { $unwind: '$user_info' },
            // define needed fields
            { $project:{ url: 1, thumbnail: 1, title: 1, user_name: '$user_info.full_name' } },
        ]).exec()
        res.render('userVideoUpload', { layout: 'user', userOnline: req.user, userVideo });
    }
    else {
        res.redirect("/login")
    }
}

exports.showUserIntroduction = (req, res) => {
    if (req.user) {
        res.render('userIntroduction', { layout: 'user', userOnline: req.user });
    }
    else {
        res.redirect("/login")
    }
}
function checkAndReplaceYouTubeUrl(ytUrl) {
    // Regular expression pattern to match YouTube watch URLs
    const pattern = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/;
    const match = pattern.exec(ytUrl);
  
    if (match) {
      const embedUrl = ytUrl.replace('/watch?v=', '/embed/');
      return embedUrl;
    } else {
      return ytUrl;
    }
  }
exports.watchVideo = async (req, res) => {
    let _id = req.query.id
    try {
        let watchVideo = await Video.aggregate([
            // define condition
            { $match: { '_id': new mongoose.Types.ObjectId(_id) } },
            // limit 
            { $limit: 1 },
            // join with users collection
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
            { $unwind: '$user_info' },
            // join with users collection
            { $lookup: { from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_info' } },
            { $unwind: '$category_info' },
            // define needed fields
            { $project:{ url: 1, title: 1, description: 1, createdAt: 1, category_id: 1, user_id: '$user_info._id', user_name: '$user_info.full_name', category_name: '$category_info.content' } },
        ])
        if (!watchVideo[0]) {
            return res.status(404).send('Video not found');
        }

        let otherVideo = await Video.aggregate([
            // define condition
            { $match: {
                '_id': { $ne: new mongoose.Types.ObjectId(_id) },
                'category_id': watchVideo[0].category_id
            }},
            // select 4 videos randomly
            { $sample: { size: 4 } },
            // join with users collection
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
            { $unwind: '$user_info' },
            // define needed fields
            { $project:{ thumbnail: 1, title: 1, user_name: '$user_info.full_name' } },
        ])

        let comments = await Comment.aggregate([
            // define condition
            { $match: { 'video_id': new mongoose.Types.ObjectId(_id) } },
            // limit top 10 comment
            { $limit: 10 },
            // join with users collection
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
            { $unwind: '$user_info' },
            // define needed fields
            { $project:{ avatar: '$user_info.avatar', user_name: '$user_info.full_name',  content: 1 } },
        ])
        
        res.render('watchVideo', { layout: 'user', userOnline: req.user, watchVideo: watchVideo[0], otherVideo, comments })
    } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while retrieving user videos.');
    }
}

exports.manageVideo = async (req, res) => {
    if (req.user) {
        try {
            const data = await Video.find({ user_id: req.user._id }).exec();
            res.render('userVideoManagement', { layout: 'user', userOnline: req.user, userVideo: data })
        } catch (err) {
            console.log(err);
            res.status(500).send('An error occurred while retrieving user videos.');
        }
    }
    else {
        res.redirect('/login');
    }
}

exports.videoManager = async (req, res) => {
    if (req.user) {
        const _id = req.user._id
        try {
            const data1 = await Video.find({ _id }).exec();
            const videoArray = [];
            data1.forEach(video => {
                videoArray.push(video.toObject());
            });
            const data2 = await PlayLists.find({createdBy: _id}).exec();
            const playList = [];
            data2.forEach(list => {
                playList.push(list.toObject());
            });
            const data3 = await Category.find().exec();
            const category = [];
            data3.forEach(cate => {
                category.push(cate.toObject());
            });
            res.render("management_videos", { layout: "user", user: req.user, playlists: playList, favorite_videos: videoArray[0], videos: videoArray ,category:category})
        } catch (err) {
            console.log(err);
            res.status(500).send('An error occurred while retrieving user videos.');
        }
    }
    else {
        res.redirect('/login');
    }
}

exports.uploadFile = (req, res, next) => {
    const form = formidable({ multiples: true })

    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err)
        }
        let video_url = undefined
        let thumbnail_url = undefined
        if (fields.url) {
            video_url = fields.url
            thumbnail_url = 'https://img.youtube.com/vi/' + fields.url.split('/')[4] + '/0.jpg'
        }
        else {
            let video = files.video
            let thumbnail = files.thumbnail
            // move video to public/video
            let oldPath = video.filepath
            let newPath = path.join(__dirname, '../public/video/') + video.newFilename + '.mp4'
            fs.renameSync(oldPath, newPath)
            // move thumbnail to pulibc/img/thumbnail
            oldPath = thumbnail.filepath
            newPath = path.join(__dirname, '../public/img/thumbnail/') + thumbnail.newFilename + '.jpg'
            fs.renameSync(oldPath, newPath)

            video_url = '/video/' + video.newFilename + '.mp4'
            thumbnail_url = '/img/thumbnail/' + thumbnail.newFilename + '.jpg'
        }
        // save video to database
        new Video({
            user_id: req.user._id,
            category_id: fields.category_id,
            title: fields.title,
            description: fields.description,
            url: video_url,
            thumbnail: thumbnail_url
        }).save()
        .then(() => {
            res.redirect('/user/management')
        })
        .catch(err => {
            next(err)
        })
    })
}

exports.comment = (req, res) => {
    let comment = new Comment({ 
        user_id: req.body.user_id,
        video_id: req.body.video_id,
        content: req.body.content
    })
    comment.save()
    .then(() => {
        res.json({ success: true })
    })
    .catch(err => {
        res.json({ success: false })
    })
}

exports.search = async (req, res) => {
    const query = req.query.q;

    let users = [];
    let videos = [];

    if (query) {
        const regex = new RegExp(query.split('').join('.*'), 'i');

        users = await User.find({
            is_active: true,
            $or: [
                { user_name: { $regex: regex } },
                { full_name: { $regex: regex } },
                { phone_number: { $regex: regex } },
                { email: { $regex: regex } },
            ],
        }).select("avatar user_id username full_name age gender createdAt");

        videos = await Video.find({
            is_checked: true,
            is_private: false,
            $or: [
                { title: { $regex: regex } },
            ],
        }).select("url thumbnail title video_id user_id category_id description createdAt updatedAt"); // Thêm các trường mới

        for (const video of videos) {
            const category = await Category.findOne({ _id: video.category_id });
            video.name = category ? category.name : '';
            const user = await User.findOne({ _id: video.user_id });
            video.user_name = user ? user.full_name : '';
        }
    }
    res.render('search', { q: query, userOnline: req.user, users, videos });
};

exports.watchUser = async (req, res, next) => {
    let _id = req.query.id
    if (!_id) {
        return res.status(500).send('Đã có lỗi xảy ra, vui lòng thử lại sau')
    }
    let user = await User.findOne({ _id })
    if (!user) {
        return res.status(500).send('Không tìm thấy người dùng này')
    }
    let video = await Video.find({ user_id: _id, is_checked: true, is_private: false })
    res.render('watchUser', { layout: '', userOnline: req.user, user, video })
}