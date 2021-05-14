/*jshint esversion: 8 */
var express = require('express');
var tools = require('../../CMX-Tools/tools.js');
var RETURNCODE = require('../../CMX-Tools/common').RETURNCODE;
var moment = require('moment');
var Redis = require("ioredis");
var mongoose = require('mongoose');
const pathHandle = require('path');
var config = require('../config/index.js');
var axios = require('axios');
var fsHandler = require('fs');
var router = express.Router();
var RedisCluster, RedisClient;
var nodejieba;
try {
  nodejieba = require("nodejieba");
  nodejieba.load();
  console.log(nodejieba.cut('分词是否正常'));
  console.log(nodejieba.extract('关键词提取是否正常', 4));
} catch (jiabaErr) { }
const { Wechaty, FileBox, UrlLink, Contact } = require('wechaty');
const { PuppetPadlocal } = require("wechaty-puppet-padlocal"); // padlocal协议包
// const { QRCodeTerminal } = require('wechaty-plugin-contrib');
var _LANG = 'ch';
const BOTCONFIG = {
  autoregistHello: 'hello bot',
  botWechatMap: {
    porbello: 'https://u.wechat.com/MG3oDlaSML_iJ3AN6me3Uv4'//不是随意的微信扫码都有效，这里配置了白名单
  },
  language: {
    ch: {
      hello: '您好，我是您的专属助手',
      nonickname: '我还没有名字哦，麻烦您先给我起一个名字吧~',
      waitusername: '您好，我还不知道您是谁，麻烦告诉一下您的账号吧~',
      nousername: '额，没有匹配到您的账号，请输入正确的账号',
      usernamelink: '好的，我记录下来了。',
      nicknamelink: '收到。',
      error: '额，服务器有点问题，麻烦您再重复一下...',
      mywork: `支持如下功能：
      1.您可以把我拉进群，我会帮助您记录群里面的文字、图片、文件，并自动将文件存储到云盘，文字经过过滤后形成纪要；
      2.您可以在群里面@我或者私聊我，要求查看当日信息“日报”、“纪要”、并支持将“纪要发送邮箱”；
      3.模拟一个工作任务，看看我如何提醒您的，https://testapi.ccmapp.cn/handle?sign=apply&appid=600ffa60b7cda241a600cd5b`,
      default: '只回答固定的问题，就算大家认为我固执也比认为我傻好',
      newuser: '喵？变身完成！',
      unbind: '已恢复人身',
      emailnoemail: '您还没有配置邮箱，请先前往平台补充邮箱地址',
      emailsuccess: '纪要已发送邮件至',
      emailerror: '邮件发送失败',
      emailnoroom: '请问是哪一个群，您可以这么说：约饭群纪要发送邮箱',
      dailynoroom: '请问是哪一个群，您可以这么说：约饭群日报',
    }
  }
};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
if (config.redisClusterConfig.length <= 1) {
  RedisCluster = new Redis(config.redisClusterConfig[0]);
  RedisClient = new Redis(config.redisClusterConfig[0]);
} else {
  RedisCluster = new Redis.Cluster(config.redisClusterConfig);
  RedisClient = RedisCluster;
}

var bots = [];
if (config.bot && config.bot.enable) {
  for (let i = 0; i < config.bot.tokens.length; i++) {//如果有多个token，则循环运行实例
    const bot = new Wechaty({
      puppet: new PuppetPadlocal({
        token: config.bot.tokens[i]
      }),
      name: 'BotBay'
    });
    bot.cmx = bot.cmx || {};
    bot.cmx.use = false;
    bots.push(bot);
    bot
      .on('scan', (qrcode, status) => {
        bot.cmx.qrcode = qrcode;
      })
      .on('login', async (user) => {
        console.log(`User ${user} logged in`);
        const contact = bot.userSelf();
        if (BOTCONFIG.botWechatMap[contact.id]) {
          console.log(`check pass`);
          bot.cmx.use = true;
          bot.cmx.qrcode = '';
          bot.cmx.wechatqr = BOTCONFIG.botWechatMap[contact.id];
        } else {
          console.log(`check fail`);
          await bot.logout();
          setTimeout(async () => {
            await bot.stop();
            await bot.start();
          }, 2000);
        }

      })
      .on('logout', user => {
        console.log(`User ${user} log out`);
        bot.cmx.use = false;
      })
      .on('error', e => console.info('Bot', 'error: %s', e))
      .on('message', message => onMessage(message, bot))
      .on('friendship', friendship => onFriendship(friendship, bot))
      .on('room-join', (room, inviteeList, inviter) => onRoomJoin(room, inviteeList, inviter, bot))
      .start();
  }

}
function onRoomJoin(room, inviteeList, inviter, bot) {
  console.log(`Roomjoin:`, room, inviteeList, inviter);
}
async function getMyBot(wechatid) {
  return new Promise((resolve, reject) => {
    Models.Botlists.findOne({
      wechatid: wechatid
    }).lean().exec((err, data) => {
      if (err || !data) resolve(false);
      else {
        if (data.owner) {
          Models.Userworkspacelinks.findOne({
            user: data.owner
          }).lean().exec((dmErr, dmData) => {
            if (dmErr || !dmData) resolve(false);
            else resolve(Object.assign(data, {
              workspace: dmData.workspace
            }));
          });
        } else {
          resolve(false);
        }
      }
    });
  });
}
async function getfullfilepath(wechatid) {
  let physicaldir = pathHandle.join(__UPLOADS__, '/big/' + moment().format('YYYY') + '/' + moment().format('MMDD') + '/' + moment().format('HH') + '/' + wechatid);
  await tools.mkdirsSync(physicaldir);
  return physicaldir;
}
const botDoProcess = {
  WAITUSERNAME: async (bot, contact, msg, reply) => {
    if (reply) {
      if (msg.type() === bot.Message.Type.Text) {
        let username = msg.text();
        let hasuserinfo = await (() => {
          return new Promise((resolve, reject) => {
            Models.Users.findOne({
              $or: [{ username: username }, { realname: username }]
            }).lean().exec((err, data) => {
              if (err) resolve(false);
              else resolve(data || false);
            });
          });
        })();
        if (!hasuserinfo) {
          await contact.say(BOTCONFIG.language[_LANG].nousername);
        } else {
          let hasbotinfo = await (() => {
            return new Promise((resolve, reject) => {
              Models.Botlists.findOne({
                $or: [{ wechatid: contact.id }, { owner: hasuserinfo._id.toString() }]
              }).lean().exec((err, data) => {
                if (err) resolve(false);
                else resolve(data || false);
              });
            });
          })();
          if (!hasbotinfo) {
            //创建新bot
            hasbotinfo = await (() => {
              return new Promise((resolve, reject) => {
                Models.Botlists({
                  nickname: '',
                  owner: hasuserinfo._id.toString(),
                  expires: moment('2022-12-31 23:59:59').format('YYYY-MM-DD HH:mm:ss'),//给一个长点的过期时间
                  state: 1,
                  desc: '',
                  worldranking: -1,
                  level: 1,
                  wechatid: contact.id,
                  hello: tools.randomWord(false, 10)
                }).save((err, data) => {
                  if (err) {
                    resolve(false);
                  } else {
                    resolve(data);
                  }
                });
              });
            })();
          } else {
            //更新bot信息
            await ((_query, _updatedata) => {
              return new Promise((resolve, reject) => {
                Models.Botlists.updateOne(_query, _updatedata, (err, data) => {
                  if (err) {
                    console.error(err);
                    resolve(false);
                  } else resolve(data);
                });
              });
            })({
              _id: hasbotinfo._id.toString()
            }, {
              owner: hasuserinfo._id.toString(),
              wechatid: contact.id
            });
          }
          if (isEmpty(hasbotinfo.nickname)) {
            RedisClient.set('BOT-' + contact.id, 'WAITNICKNAME');
            await fsmJob(bot, contact);
          } else {
            await contact.say(BOTCONFIG.language[_LANG].usernamelink);
            RedisClient.set('BOT-' + contact.id, 'FREE');
            await fsmJob(bot, contact);
          }
        }
      } else {
        await fsmJob(bot, contact);
      }
    } else
      await contact.say(BOTCONFIG.language[_LANG].waitusername);
  },
  WAITNICKNAME: async (bot, contact, msg, reply) => {
    if (reply) {
      if (msg.type() === bot.Message.Type.Text) {
        let nickname = msg.text();
        let result = await ((_query, _updatedata) => {
          return new Promise((resolve, reject) => {
            Models.Botlists.updateOne(_query, _updatedata, (err, data) => {
              if (err) {
                console.error(err);
                resolve(false);
              } else resolve(data);
            });
          });
        })({
          wechatid: contact.id
        }, {
          nickname: nickname
        });
        if (result) {
          await contact.say(nickname + BOTCONFIG.language[_LANG].nicknamelink);
          RedisClient.set('BOT-' + contact.id, 'FREE');
          await fsmJob(bot, contact);
        } else
          await contact.say(BOTCONFIG.language[_LANG].error);
      } else {
        await fsmJob(bot, contact);
      }
    } else
      await contact.say(BOTCONFIG.language[_LANG].nonickname);
  },
  FREE: async (bot, contact, msg, reply) => {
    if (reply) {
      const text = msg.text();
      let room = msg.room();
      const to = msg.to() ? msg.to().self() : false;
      const mentionSelf = await msg.mentionSelf();
      if (msg.type() === bot.Message.Type.Text) {
        if ((room && mentionSelf) || (!room && to)) {
          let mybot = await getMyBot(contact.id);
          if (text.indexOf('变回人形') >= 0) {
            RedisClient.del('BOT-' + contact.id);
            await (room || contact).say(BOTCONFIG.language[_LANG].unbind);
          } else if (text.indexOf('修改名字') >= 0 || text.indexOf('修改姓名') >= 0 || text.indexOf('修改昵称') >= 0) {
            RedisClient.set('BOT-' + contact.id, 'WAITNICKNAME');//状态机记录等待昵称
            await fsmJob(bot, contact);
          } else if (text.indexOf('日报') >= 0) {
            if (mybot) {
              if (!room) {
                let trimRoomTopic = text.replace('日报', '');
                room = await bot.Room.find({ topic: trimRoomTopic });
              }
              if (!room) {
                await (room || contact).say(BOTCONFIG.language[_LANG].dailynoroom);
                return;
              }
              let roomname = await room.topic();
              let roomid = room.id;
              const urlLink = new UrlLink({
                description: '请您查看' + roomname + '-' + moment().format('YYYY-MM-DD') + '信息统计归档情况',
                thumbnailUrl: config.serverProtocol + '//' + config.serverHost + '/images/filemanage/daily.jpg',
                title: '信息归档日报',
                url: config.serverProtocol + '//' + config.serverHost + '/zh-CN/information-archiving?roomid=' + roomid,
              });
              await (room || contact).say(urlLink);
            } else {
              await (room || contact).say(BOTCONFIG.language[_LANG].error);
            }
          } else if (text.indexOf('纪要') >= 0) {
            if (mybot) {
              if (!room) {
                let trimRoomTopic = text.replace('纪要', '').replace('发送邮箱', '');
                room = await bot.Room.find({ topic: trimRoomTopic });
              }
              if (!room) {
                await (room || contact).say(BOTCONFIG.language[_LANG].emailnoroom);
                return;
              }
              let roomname = await room.topic();
              let roomid = room.id;
              let chatlogsArray = await (() => {
                return new Promise((resolve, reject) => {
                  Models.Chatlogs.find({
                    roomid: roomid,
                    type: 'Text',
                    createtime: {
                      $gte: moment(moment().hour(0).minute(0).second(0)),
                      $lte: moment(moment().hour(23).minute(59).second(59))
                    }
                  }).lean().sort({
                    createtime: -1
                  }).exec((err, data) => {
                    if (err) resolve([]);
                    else resolve(data || []);
                  });
                });
              })();
              if (text.indexOf('发送邮箱') >= 0) {
                let botowerinfo = await (() => {
                  return new Promise((resolve, reject) => {
                    Models.Users.findOne({
                      _id: mybot.owner
                    }).lean().exec((err, data) => {
                      if (err) resolve(false);
                      else resolve(data || false);
                    });
                  });
                })();
                if (!botowerinfo || !botowerinfo.email) {
                  await (room || contact).say(BOTCONFIG.language[_LANG].emailnoemail);
                  return;
                }

                axios
                  .post(config.custom.apiServer + "/msgnotice/sendMsg", {
                    token: '5faa53e4f75d1cefaed07067',
                    recUserId: [mybot.owner],
                    content: chatlogsArray.map((v, index) => {
                      return `${index + 1}.${v.content}  -${v.fromnickname} 发送于 ${moment(v.createtime).format('HH:mm')}`;
                    }).join('\r\n'),
                    title: roomname + "纪要",
                    channel: ['email'],
                    sendDate: '',
                    msgType: "sys",
                    appKey: ''
                  })
                  .then(async (response) => {
                    await (room || contact).say(roomname + BOTCONFIG.language[_LANG].emailsuccess + botowerinfo.email);
                  }).catch(err => {
                    await(room || contact).say(BOTCONFIG.language[_LANG].emailerror);
                  });
              } else {
                await (room || contact).say(chatlogsArray.map((v, index) => {
                  return `${index + 1}.${v.content}  -${v.fromnickname} 发送于 ${moment(v.createtime).format('HH:mm')}`;
                }).join('\r\n'));
              }
            } else {
              await (room || contact).say(BOTCONFIG.language[_LANG].error);
            }
          } else if (text.indexOf('帮助') >= 0 || text.indexOf('能做什么') >= 0) {
            if (mybot)
              await (room || contact).say(mybot.nickname + BOTCONFIG.language[_LANG].mywork, room ? contact : undefined);
            else
              await (room || contact).say(BOTCONFIG.language[_LANG].error);
          } else {
            if (mybot)
              await (room || contact).say(mybot.nickname + BOTCONFIG.language[_LANG].default, room ? contact : undefined);
            else
              await (room || contact).say(BOTCONFIG.language[_LANG].error);
          }
        } else if (room) {
          console.log('in room', contact, text)
          await addChatLogs(room, contact, text, 'Text', (await msg.mentionList()) || []);
        } else {
          console.log('not room', contact, text)
        }
      } else if (msg.type() === bot.Message.Type.Attachment) {
        const fileBox = await msg.toFileBox();
        const fileName = fileBox.name;
        let fullpath = pathHandle.join((await getfullfilepath(contact.id)), fileName);
        fileBox.toFile(fullpath, true);
        let mybot = await getMyBot(contact.id);
        if (mybot) {
          let result = await tools.pathAutoArchive({ id: mybot.owner, workspace: mybot.workspace }, 'private', fileName, fullpath, '/微信自动归档文件/' + moment().format('YYYY/MMDD') + '/文件');
          console.info(result);
        }
        if (room) {
          await addChatLogs(room, contact, fileName, 'Attachment', (fsHandler.statSync(fullpath).size));
        }
      } else if (msg.type() === bot.Message.Type.Audio) {
        await addChatstatistics(room, 'Audio', false);
      } else if (msg.type() === bot.Message.Type.Image) {
        const image = msg.toImage();
        const fileBox = await image.hd();
        const fileName = fileBox.name;
        let fullpath = pathHandle.join((await getfullfilepath(contact.id)), fileName);
        fileBox.toFile(fullpath, true);
        let mybot = await getMyBot(contact.id);
        if (mybot) {
          let result = await tools.pathAutoArchive({ id: mybot.owner, workspace: mybot.workspace }, 'private', fileName, fullpath, '/微信自动归档文件/' + moment().format('YYYY/MMDD') + '/图片');
          console.info(result);
        }
        if (room) {
          await addChatLogs(room, contact, fileName, 'Image');
        }
      } else if (msg.type() === bot.Message.Type.Video) {
        const fileBox = await msg.toFileBox();
        const fileName = fileBox.name;
        let fullpath = pathHandle.join((await getfullfilepath(contact.id)), fileName);
        fileBox.toFile(fullpath, true);
        let mybot = await getMyBot(contact.id);
        if (mybot) {
          let result = await tools.pathAutoArchive({ id: mybot.owner, workspace: mybot.workspace }, 'private', fileName, fullpath, '/微信自动归档文件/' + moment().format('YYYY/MMDD') + '/视频');
          console.info(result);
        }
        if (room) {
          await addChatLogs(room, contact, fileName, 'Video');
        }
      }
    } else {
      let mybot = await getMyBot(contact.id);
      if (mybot)
        await contact.say(mybot.nickname + BOTCONFIG.language[_LANG].mywork);
      else
        await contact.say(BOTCONFIG.language[_LANG].error);
    }
  },
  HELLO: async (bot, contact, nickname) => {
    await contact.say(BOTCONFIG.language[_LANG].hello + nickname);
    RedisClient.set('BOT-' + contact.id, 'FREE');//空闲
    await fsmJob(bot, contact);
  }
};
async function addChatLogs(room, contact, content, type, params) {
  let roomid = room.id;
  const _date = moment().format('YYYY-MM-DD'), _hour = parseInt(moment().format('HH'));
  const fromAlias = (await contact.alias()) || contact.name();
  if (type == 'Text' && content.indexOf('@') == 0) {
    content = content.substr(content.indexOf(' ') + 1);//注意，这个空格不是普通空格，是微信的空格
  }
  let extract = nodejieba ? nodejieba.extract(content, 4) : [];
  console.log(content, extract);
  if (type == 'Attachment' || (type == 'Text' && extract.length > 3 && content.length > 10)) {
    await ((_savedata) => {
      return new Promise((resolve, reject) => {
        Models.Chatlogs(_savedata).save((err, data) => {
          if (err) {
            console.error(err);
            resolve(false);
          } else resolve(data);
        });
      });
    })({
      type: type,
      content: content,
      roomid: roomid,
      fromnickname: fromAlias,
      extract: extract.map(v => {
        return v.word;
      }),
      cut: nodejieba ? nodejieba.cut(content) : []
    });
  }
  if (type == 'Text')
    for (let i = 0; i < extract.length; i++) {
      if (extract[i].word.length <= 2) {
        continue;
      }
      Models.Hotwordsstatistics.updateOne(
        { date: _date, roomid: roomid, word: extract[i].word },
        { date: _date, roomid: roomid, word: extract[i].word, $inc: { total: 1 } },
        { upsert: true }, (err, data) => { if (err) console.error(err) }
      );
    }
  Models.Roomstatistics.updateOne(
    { date: _date, roomid: roomid, type: 'hour', hour: _hour },
    { date: _date, roomid: roomid, type: 'hour', hour: _hour, $inc: { total: 1 } },
    { upsert: true }, (err, data) => { }
  );
  Models.Roomstatistics.updateOne(
    { date: _date, roomid: roomid, type: 'contact', contact: fromAlias },
    { date: _date, roomid: roomid, type: 'contact', contact: fromAlias, $inc: { total: 1 } },
    { upsert: true }, (err, data) => { }
  );
  if (type == 'Text' && params.length > 0) {
    for (let i = 0; i < params.length; i++) {
      let toAlias = (await params[i].alias()) || params[i].name();
      Models.Relationstatistics({
        date: _date,
        from: fromAlias,
        to: toAlias,
        roomid: roomid,
      }).save((err, data) => { });
    }
  }
  await addChatstatistics(room, type, (type == 'Text' && (extract.length <= 3 || content.length <= 10)), params);
}
async function addChatstatistics(room, type, isfilter, size) {
  console.log('isfilter', isfilter)
  let roomid = room.id;
  let incObj = { total: 1 };
  if (isfilter)
    incObj.filter = 1;
  switch (type) {
    case 'Text':
      incObj.text = 1;
      break;
    case 'Audio':
      incObj.audio = 1;
      break;
    case 'Video':
      incObj.video = 1;
      break;
    case 'Image':
      incObj.image = 1;
      break;
    case 'Attachment':
      incObj.attachment = 1;
      incObj.storageSpaces = size;
      break;
  }
  Models.Chatstatistics.updateOne(
    { date: moment().format('YYYY-MM-DD'), roomid: roomid },
    { date: moment().format('YYYY-MM-DD'), roomid: roomid, $inc: incObj },
    { upsert: true }, (err, data) => { }
  );
}
async function fsmJob(bot, contact, msg, reply) {
  let FSM = await (() => {
    return new Promise((resolve, reject) => {
      RedisClient.get('BOT-' + contact.id, function (err, result) {
        if (err) {
          resolve(false);
        } else {
          resolve(result || '');
        }
      });
    });
  })();
  if (FSM)
    await botDoProcess[FSM](bot, contact, msg, reply);
  else {
    if (reply && msg) {
      if (msg.type() === bot.Message.Type.Text) {
        const room = msg.room();
        const to = msg.to() ? msg.to().self() : false;
        const mentionSelf = await msg.mentionSelf();
        if (msg.text().indexOf('变身机器人') >= 0 && ((room && mentionSelf) || (!room && to))) {
          await (room || contact).say(BOTCONFIG.language[_LANG].newuser);
          let hasbotinfo = await ((wechatid) => {
            return new Promise((resolve, reject) => {
              Models.Botlists.findOne({
                wechatid: wechatid
              }).lean().exec((err, data) => {
                if (err) resolve(false);
                else resolve(data || false);
              });
            });
          })(contact.id);
          if (hasbotinfo !== false) {
            if (!isEmpty(hasbotinfo.nickname)) {
              RedisClient.set('BOT-' + contact.id, 'HELLO');//打招呼
              await fsmJob(bot, contact, hasbotinfo.nickname);
            } else {
              RedisClient.set('BOT-' + contact.id, 'WAITNICKNAME');//状态机记录等待昵称
              await fsmJob(bot, contact);
            }
          } else {
            RedisClient.set('BOT-' + contact.id, 'WAITUSERNAME');//状态机记录等待username
            await fsmJob(bot, contact);
          }
        } else {
          await botDoProcess['FREE'](bot, contact, msg, reply);
        }
      }
    }
  }
}
async function onFriendship(friendship, bot) {
  const contact = friendship.contact();
  if (friendship.type() === bot.Friendship.Type.Receive) { // 1. receive new friendship request from new contact
    let hasbotinfo = await ((key, wechatid) => {
      return new Promise((resolve, reject) => {
        Models.Botlists.findOne({
          $or: [{ hello: key }, { wechatid: wechatid }]//根据触发语或微信号检查是否已有机器人
        }).lean().exec((err, data) => {
          if (err) resolve(false);
          else resolve(data || false);
        });
      });
    })(friendship.hello(), contact.id);
    if (hasbotinfo === false && friendship.hello() == BOTCONFIG.autoregistHello) {//autoregistHello是默认通用的触发语
      hasbotinfo = 'new wechat user';
    }
    if (hasbotinfo !== false) {
      await friendship.accept();//接收好友申请
      console.log(`Request from ${contact.name()} is accept succesfully!`);
      if (hasbotinfo == 'new wechat user') {
        RedisClient.set('BOT-' + contact.id, 'WAITUSERNAME');//状态机记录等待账户名
        await fsmJob(bot, contact);
      } else {
        if (!isEmpty(hasbotinfo.nickname)) {
          RedisClient.set('BOT-' + contact.id, 'HELLO');//状态机置为打招呼
          await fsmJob(bot, contact, hasbotinfo.nickname);
        } else {
          RedisClient.set('BOT-' + contact.id, 'WAITNICKNAME');//状态机记录等待昵称
          await fsmJob(bot, contact);
        }
        await ((_query, _updatedata) => {
          return new Promise((resolve, reject) => {
            Models.Botlists.updateOne(_query, _updatedata, (err, data) => {
              if (err) {
                console.error(err);
                resolve(false);
              } else resolve(data);
            });
          });
        })({
          _id: hasbotinfo._id
        }, {
          wechatid: contact.id
        });
      }
    } else {
      RedisClient.del('BOT-' + contact.id);
      console.log(`no exist botinfo from ${friendship.hello()}`);
    }
  } else if (friendship.type() === bot.Friendship.Type.Confirm) { // 2. confirm friendship
    console.log(`New friendship confirmed with ${contact.name()}`);
  }
}
async function onMessage(msg, bot) {
  const contact = msg.talker();
  if (contact.id == 'wexin' || msg.self()) {
    return;
  }
  await fsmJob(bot, contact, msg, true);
}

router.get('/getAllBot', async function (req, res, next) {//获取全部机器人状态
  let token = req.headers.token || req.query.token;
  var tokenObj = await tools.decryptToken(token, req);
  if (tokenObj === false) {
    res.send({
      code: RETURNCODE.NOAUTH,
      msg: '用户身份无效，请重新登录',
      data: undefined
    });
    return;
  }

  try {
    res.send({
      code: RETURNCODE.SUCCESSCODE,
      msg: '获取成功',
      data: bots.map(v => {
        return v.cmx;
      })
    });
  } catch (allException) {
    res.send({
      code: RETURNCODE.SERVERERRORCODE,
      msg: allException.message,
      data: null
    });
  }
});
/**
 * 创建新机器人
 */
router.post('/bot/create', async (req, res) => {
  const tokenObj = await tools.decryptToken(req.body.token, req);
  if (tokenObj === false) {
    res.send({
      code: RETURNCODE.NOAUTH,
      msg: '用户身份无效'
    });
    return;
  }
  Models.Botlists({
    nickname: req.body.nickname || '',
    owner: tokenObj.id,
    expires: moment('2022-12-31 23:59:59').format('YYYY-MM-DD HH:mm:ss'),
    state: 1,
    desc: '',
    worldranking: -1,
    level: 1,
    wechatid: req.body.wechatid || '',
    hello: tools.randomWord(false, 10)
  }).save((err, data) => {
    if (err) {
      res.send({
        code: RETURNCODE.SERVERERRORCODE,
        msg: '创建失败',
        data: null
      });
    } else {
      res.send({
        code: RETURNCODE.SUCCESSCODE,
        msg: '创建成功',
        data: null
      });
    }
  });
});
/**
 * 读取群聊纪要情况
 */
router.get('/bot/chatlogs/summary', async (req, res) => {
  let roomid = req.query.roomid;
  if (isEmpty(req.query.roomid)) {
    res.send({
      code: RETURNCODE.MISSPARAM,
      msg: '参数不全',
      data: undefined
    });
    return;
  }
  Models.Chatlogs.aggregate([
    {
      $match: {
        roomid: req.query.roomid,
        type: 'Text',
        createtime: {
          $gte: moment(moment().hour(0).minute(0).second(0)).toDate(),
          $lte: moment(moment().hour(23).minute(59).second(59)).toDate()
        }
      }
    }, {
      $project: {
        "content": 1,
        "fromnickname": 1,
        "createtime": 1,
        "length": { "$size": "$extract" }
      }
    }, {
      $sort: { length: -1 }
    }, {
      $limit: 10
    }]).exec((err, data) => {
      if (err) {
        res.send({
          code: RETURNCODE.SERVERERRORCODE,
          msg: '获取失败',
          data: null
        });
      } else {
        res.send({
          code: RETURNCODE.SUCCESSCODE,
          msg: '获取成功',
          data: data.map(v => {
            v.createtime = moment(v.createtime).format('YYYY-MM-DD HH:mm:ss');
            return v;
          })
        });
      }
    });
});
/**
 * 读取群聊文件情况
 */
router.get('/bot/chatlogs/file', async (req, res) => {
  let roomid = req.query.roomid;
  if (isEmpty(req.query.roomid)) {
    res.send({
      code: RETURNCODE.MISSPARAM,
      msg: '参数不全',
      data: undefined
    });
    return;
  }
  Models.Chatlogs.find({
    roomid: roomid,
    type: 'Attachment',
    createtime: {
      $gte: moment(moment().hour(0).minute(0).second(0)),
      $lte: moment(moment().hour(23).minute(59).second(59))
    }
  })
    .select('-cut -extract -roomid')
    .lean().limit(10).sort({
      createtime: -1
    }).exec((err, data) => {
      if (err) {
        res.send({
          code: RETURNCODE.SERVERERRORCODE,
          msg: '获取失败',
          data: null
        });
      } else {
        res.send({
          code: RETURNCODE.SUCCESSCODE,
          msg: '获取成功',
          data: data.map(v => {
            v.createtime = moment(v.createtime).format('YYYY-MM-DD HH:mm:ss');
            return v;
          })
        });
      }
    });
});
/**
 * 读取群聊基本统计信息
 */
router.get('/bot/chatstatistics', async (req, res) => {
  let roomid = req.query.roomid;
  if (isEmpty(req.query.roomid)) {
    res.send({
      code: RETURNCODE.MISSPARAM,
      msg: '参数不全',
      data: undefined
    });
    return;
  }
  Models.Chatstatistics.findOne({
    roomid: roomid,
    date: moment().format('YYYY-MM-DD')
  }).lean().exec((err, data) => {
    if (err) {
      res.send({
        code: RETURNCODE.SERVERERRORCODE,
        msg: '获取失败',
        data: null
      });
    } else {
      data = data || {};
      data.text = data.text || 0;
      data.image = data.image || 0;
      data.audio = data.text || 0;
      data.video = data.video || 0;
      data.attachment = data.attachment || 0;
      data.filter = data.filter || 0;
      data.total = data.total || 0;
      data.storageSpaces = data.storageSpaces || 0;
      res.send({
        code: RETURNCODE.SUCCESSCODE,
        msg: '获取成功',
        data: data
      });
    }
  });
});
/**
 * 读取群聊趋势
 */
router.get('/bot/roomstatistics/hour', async (req, res) => {
  let roomid = req.query.roomid;
  if (isEmpty(req.query.roomid)) {
    res.send({
      code: RETURNCODE.MISSPARAM,
      msg: '参数不全',
      data: undefined
    });
    return;
  }
  Models.Roomstatistics.find({
    roomid: roomid,
    type: 'hour',
    date: moment().format('YYYY-MM-DD')
  }).lean().sort({ hour: 1 }).exec((err, data) => {
    if (err) {
      res.send({
        code: RETURNCODE.SERVERERRORCODE,
        msg: '获取失败',
        data: null
      });
    } else {
      res.send({
        code: RETURNCODE.SUCCESSCODE,
        msg: '获取成功',
        data: data
      });
    }
  });
});
/**
 * 读取群聊最常发言人员
 */
router.get('/bot/roomstatistics/contact', async (req, res) => {
  let roomid = req.query.roomid;
  if (isEmpty(req.query.roomid)) {
    res.send({
      code: RETURNCODE.MISSPARAM,
      msg: '参数不全',
      data: undefined
    });
    return;
  }
  Models.Roomstatistics.find({
    roomid: roomid,
    type: 'contact',
    date: moment().format('YYYY-MM-DD')
  }).lean().limit(20).sort({ total: -1 }).exec((err, data) => {
    if (err) {
      res.send({
        code: RETURNCODE.SERVERERRORCODE,
        msg: '获取失败',
        data: null
      });
    } else {
      res.send({
        code: RETURNCODE.SUCCESSCODE,
        msg: '获取成功',
        data: data
      });
    }
  });
});
/**
 * 读取群聊交流关系
 */
router.get('/bot/relationstatistics', async (req, res) => {
  let roomid = req.query.roomid;
  if (isEmpty(req.query.roomid)) {
    res.send({
      code: RETURNCODE.MISSPARAM,
      msg: '参数不全',
      data: undefined
    });
    return;
  }
  Models.Relationstatistics.find({
    roomid: roomid,
    date: moment().format('YYYY-MM-DD')
  }).lean().exec((err, data) => {
    if (err) {
      res.send({
        code: RETURNCODE.SERVERERRORCODE,
        msg: '获取失败',
        data: null
      });
    } else {
      res.send({
        code: RETURNCODE.SUCCESSCODE,
        msg: '获取成功',
        data: data
      });
    }
  });
});
/**
 * 读取群聊热词
 */
router.get('/bot/hotwordsstatistics', async (req, res) => {
  let roomid = req.query.roomid;
  if (isEmpty(req.query.roomid)) {
    res.send({
      code: RETURNCODE.MISSPARAM,
      msg: '参数不全',
      data: undefined
    });
    return;
  }
  Models.Hotwordsstatistics.find({
    roomid: roomid,
    date: moment().format('YYYY-MM-DD')
  })
    .select("-date -roomid")
    .lean().limit(50).sort({ total: -1 }).exec((err, data) => {
      if (err) {
        res.send({
          code: RETURNCODE.SERVERERRORCODE,
          msg: '获取失败',
          data: null
        });
      } else {
        res.send({
          code: RETURNCODE.SUCCESSCODE,
          msg: '获取成功',
          data: data
        });
      }
    });
});
module.exports = function (_Models) {
  Models = _Models;
  tools.init(Models);
  return router;
};
