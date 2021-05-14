var mongoose = require('mongoose');
var Schema = mongoose.Schema;   //创建模型
var relationstatisticsScheMa = new Schema({
    date: String,
    from: String,
    to: String,
    roomid: String,
    createtime: { type: Date, default: Date.now }
});

module.exports = exports = function (cosmixFile) {
    return cosmixFile.model('relationstatistics', relationstatisticsScheMa, 'relationstatistics');
};