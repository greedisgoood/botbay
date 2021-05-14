var mongoose = require('mongoose');
var Schema = mongoose.Schema;   //创建模型
var hotwordsstatisticsScheMa = new Schema({
    date: String,
    word: String,
    roomid: String,
    total: { type: Number, default: 0 }
});

module.exports = exports = function (cosmixFile) {
    return cosmixFile.model('hotwordsstatistics', hotwordsstatisticsScheMa, 'hotwordsstatistics');
};