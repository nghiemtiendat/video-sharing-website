const mongoose = require('mongoose')
const Schema = mongoose.Schema

const commentSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    video_id: Schema.Types.ObjectId,
    content: String
}, { timestamps: true })

module.exports = mongoose.model('Comment', commentSchema)