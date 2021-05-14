var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var botlistsScheMa = new Schema({
    nickname: String,//昵称
    owner: String,//所属人
    expires: { type: Date },//过期时间
    state: { type: Number, default: 1 },//状态
    birthday: { type: Date, default: Date.now },//生日
    desc: String,//个人简介
    worldranking: Number,//排名
    level: Number,//等级
    wechatid: String,//关联微信号
    hello: String//自定义触发语
});

module.exports = exports = function (cosmixCore) {
    return cosmixCore.model('botlists', botlistsScheMa, 'botlists');
};