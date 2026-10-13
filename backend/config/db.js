const mongoose = require('mongoose');
async function connectDB(config) {
    mongoose.set('strictQuery', true);
    return mongoose.connect(config.mongoUri, { dbName: config.mongoDb, autoIndex: false, serverSelectionTimeoutMS: 5000 });
}
module.exports = connectDB;
