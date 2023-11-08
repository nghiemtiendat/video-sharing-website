const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    name: String,
    content: String
}, { timestamps: true })

module.exports = mongoose.model('Category', CategorySchema)