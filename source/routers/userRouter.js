const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.showHomePage);
router.get('/profile', userController.showUserProfile);
router.get('/video', userController.showUserVideo);
router.get('/introduction', userController.showUserIntroduction);
router.get('/management', userController.manageVideo);
router.get('/watchvideo', userController.watchVideo);
router.get('/upload', userController.videoManager);
router.post('/upload', userController.uploadFile);
router.post('/comment', userController.comment);
router.get('/search', userController.search);
router.get('/watchuser', userController.watchUser);

module.exports = router;    