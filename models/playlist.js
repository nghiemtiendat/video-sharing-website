const mongoose = require('mongoose')
const Schema = mongoose.Schema

const playlistSchema = new Schema({
    title: String,
    description: String,
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }]
}, { timestamps: true })

module.exports = mongoose.model('Playlist', playlistSchema)