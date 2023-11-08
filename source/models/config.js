const mongoose = require('mongoose')

const ConfigSchema = new mongoose.Schema({
    max_size: Number,
    max_length: Number,
    max_quantity: Number
}, { timestamps: true })

module.exports = mongoose.model('Config', ConfigSchema)