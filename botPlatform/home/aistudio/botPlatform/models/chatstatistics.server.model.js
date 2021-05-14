var mongoose = require('mongoose');
var Schema = mongoose.Schema;   //创建模型
var chatstatisticsScheMa = new Schema({
    date: String,
    roomid: String,
    total: { type: Number, default: 0 },
    storageSpaces: { type: Number, default: 0.0 },
    text: { type: Number, default: 0 },
    audio: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
    attachment: { type: Number, default: 0 },
    image: { type: Number, default: 0 },
    filter: { type: Number, default: 0 }
});

module.exports = exports = function (cosmixFile) {
    return cosmixFile.model('chatstatistics', chatstatisticsScheMa, 'chatstatistics');
};