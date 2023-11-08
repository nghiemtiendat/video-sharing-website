const mongoose = require('mongoose')

module.exports.connect =  () => {
    mongoose.set('strictQuery', false)

    mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => console.log('Connect to database successfully'))
    .catch(err => console.log('Connect to database failed: ' + err.message))
}