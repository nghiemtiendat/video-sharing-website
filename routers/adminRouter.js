const express = require('express')
const adminController = require('../controllers/adminController')
const categoryValidator = require('../middlewares/categoryValidator')
const configValidator = require('../middlewares/configValidator')

const router = express.Router()

// admin home
router.get('/', adminController.adminHome)

// user management
router.get('/user-management', adminController.userManagement)
router.get('/user-management/:user_id', adminController.viewUser)
router.put('/user-management/:user_id', adminController.activeUser)
router.delete('/user-management/:user_id', adminController.deleteUser)

// category management
router.get('/category-management', adminController.categoryManagement)
router.post('/category-management', categoryValidator, adminController.addCategory)
router.put('/category-management/:category_id', categoryValidator, adminController.updateCategory)
router.delete('/category-management/:category_id', adminController.deleteCategory)

// video management
router.get('/video-management', adminController.videoManagement)
router.get('/video-management/:video_id', adminController.viewVideo)
router.put('/video-management/:video_id', adminController.featureVideo)
router.delete('/video-management/:video_id', adminController.deleteVideo)

// check video
router.get('/check-video', adminController.checkVideo)
router.get('/check-video/:video_id', adminController.viewVideo)
router.put('/check-video/:video_id', adminController.acceptVideo)
router.delete('/check-video/:video_id', adminController.deleteVideo)

// system config
router.get('/system-config', adminController.systemConfig)
router.post('/system-config', configValidator, adminController.updateConfig)

module.exports = router