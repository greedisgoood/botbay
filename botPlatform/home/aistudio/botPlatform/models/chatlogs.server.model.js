var mongoose = require('mongoose');
var Schema = mongoose.Schema;   //创建模型
var chatlogsScheMa = new Schema({
    type: String,
    content: String,
    roomid: String,
    createtime: { type: Date, default: Date.now },
    fromnickname: String,
    extract: [],
    cut: []
});

module.exports = exports = function (cosmixFile) {
    return cosmixFile.model('chatlogs', chatlogsScheMa, 'chatlogs');
};