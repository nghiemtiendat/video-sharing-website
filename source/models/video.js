const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VideoSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,
    title: String,
    description: String,
    url: String,
    thumbnail: String,
    is_private: {
        type: Boolean,
        default: false
    },
    is_feature: {
        type: Boolean,
        default: false,
    },
    is_checked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('Video', VideoSchema)