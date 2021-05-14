var mongoose = require('mongoose');
var Schema = mongoose.Schema;   //创建模型
var roomstatisticsScheMa = new Schema({
    date: String,
    type: String,//hour contact
    hour: { type: Number, default: 0 },
    contact: { type: String, default: '' },
    total: { type: Number, default: 0 },
    roomid: String
});

module.exports = exports = function (cosmixFile) {
    return cosmixFile.model('roomstatistics', roomstatisticsScheMa, 'roomstatistics');
};