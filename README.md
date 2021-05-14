# 项目背景-BOTBAY机器人港湾

BotBay致力于创建专属的拟人机器人，我们理想中它可以接入不同的平台【微信、5G】，作为每一人完成日常工作生活专属助理，你可以给它起一个名字，这样就可以伴随终身，我们希望无论你今后的工作生活如何变化，它都可以普适的服务能力，目前版本我们赋能BotBay工作消息整理和待办提醒功能，例如：
1.把机器人拉进群，帮助我记录群里面的文字、图片、文件，并自动将文件存储到云盘，文字经过过滤后形成纪要；
2.在群里面@我或者私聊我，要求查看当日信息“日报”、“纪要”、并支持将“纪要发送邮箱”；
3.模拟一个工作任务，看看机器人如何提醒我的。

# 作品演示
## 视频
[B站链接](https://www.bilibili.com/video/BV1q64y127Vd/)

## 部分截图
### 账号绑定和给机器人起名字
> 新用户启动chatbot交互时，由于它还不认识你，所以需要向你确认账户【基于本团队之前开发过的一套用户体系】和机器人它自己的姓名
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/26294f201ccc4a26a27e954653a920190d991798392b47218bc8a4412b363c31"/>

### 停止与启动机器人应答
> 由于我们使用的是本人微信号，考虑到不影响日常收发消息，所以实现了开关
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/99c5993e00314b27a657cce8811a48852d549d16a003444da8a9fd0b4b5ee7b3"/>

### 自动纪要生成
> 根据关键词提取算法，判断群聊消息中那些内容更加有可能属于重要信息，支持纪要发送邮箱【模拟会议纪要的过程】
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/88c174b364254c76992ac6395d87a7ba2d72fcffa02845169936ec2df15d89da"/>

### 群文件、图片、音频、视频自动归档-移动端
> 一个工程向的小机制，帮助归档群聊文件，防止文件过期、手机电脑更换等问题
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/118241d57082479fb446e4559db2add8e46b2d8179d043cf8ebcc5bbbda5cf61"/>

> 当然这个其实是一个正儿八经的网盘系统【基于本团队之前开发过的一套网盘】
<br/>
<img src="https://ai-studio-static-online.cdn.bcebos.com/3bab69230c9e4772ab55362d737f2f628128ef5b8b8c448ba80286c7511ecce1"/>

### 待办提醒与代操作
> 如果BOTBAY接入了业务办公系统的话，那它就可以采用询问的方式协助你处理待办工作，如下图我们模拟了一个申请单提交审批流程
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/07d16b6d0aeb4fb6ba610993f422b10413050d41881d4d3c9dd6153baf3a6b9e"/>
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/7aeae982dc3245cab77befdca611e095c292f869043d4ed087c6d7ff70ef9edf"/>

### 信息归档日报
> 根据收集到的Text/Audio/Video/Attachement/Image，以及Room/Contact/mentionList等信息，进行归类、统计、分析
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/b0400068e3184cb58cd06c00857dffaad874fbc7168542bab1076f076432e94c"/>
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/7b257d289fb34168ad4caa21d0a2aca83fdbd6f37c4944d5994f18cf4b6ed632"/>
<br/>
<img width="300" src="https://ai-studio-static-online.cdn.bcebos.com/a6434c93e2ca4d64be28aef5a48899e746d84c4534714e5ea3e66464bba7ba04"/>

> 当然也有PC端的展现
<br/>
<img src="https://ai-studio-static-online.cdn.bcebos.com/b2c9693c682047aea0d000a70cf97b7426d1995c642745a2b4b5b18a6a9870fd"/>

# 平台架构
本项目采用一入口，一平台，多支撑的模式进行设计与开发，其中：

* 一入口 - 微信入口，采用chatbot模式实现用户与系统的交互与应答。

* 一平台 - botPlatform：托管chatbot，启动wechaty实例，接收消息，按状态机模式处理基础消息响应与逻辑分发。

* 多支撑 - paddleWorkers：使用paddleHub提供的支撑服务，本项目中使用paddle提供的图片OCR解析微信消息中的图片文字，今后可拓展不同的paddle服务，支撑chatbot实现更多功能。

# 核心逻辑
## botPlatform-托管chatbot
> 技术路线为NodeJs+Express+MongoDB，主要关键技术为：状态机、分词与关键词提取
由于整体代码量巨大，因此本次只上传了关键部分代码

| 序号 | 模块名称 | 功能 | 代码 |
| -------- | -------- | -------- | -------- |
| 1 | CMX-CoreHandler | 实现用户认证、用户管理、角色权限等功能 | 无 |
| 1.1 | user.js | 用户相关功能 | 无 |
| 1.2 | bot.js | chatbot相关功能 | **有** |
| 1.3 | application.js | 应用相关功能 | 无 |
| 2 | CMX-FileHandler | 实现文件处理、自动归档，网盘功能 | 无 |
| 3 | CMX-ResourceHandler | 实现流程处理、表单数据处理功能 | 无 |

---
### 配置信息
> 这里主要是botWechatMap变量在后面的login过程限制了可以扫码的微信用户白名单
```
var _LANG = 'ch';//默认中文
const BOTCONFIG = {
  autoregistHello: 'hello bot',
  botWechatMap: {
    porbello: 'https://u.wechat.com/MG3oDlaSML_iJ3AN6me3Uv4'//不是随意的微信扫码都有效，这里配置了白名单
  },
  language: {
    ch: {
      hello: '您好，我是您的专属助手',
      //...等等其它语言
    }
  }
};
```
config/index.js
```
const config = {
	bot: {
      enable: true,//开启机器人服务
      tokens: ['puppet_padlocal_e55XXXXXXXX55906d2']//如果有多个token，可以启动多个实例
  	},
}
```

### 启动wechaty实例
```
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
        bot.cmx.qrcode = qrcode;//有二维码时赋值
      })
      .on('login', async (user) => {
        console.log(`User ${user} logged in`);
        const contact = bot.userSelf();
        if (BOTCONFIG.botWechatMap[contact.id]) {
          console.log(`check pass`);
          bot.cmx.use = true;//本bot状态是否为待机
          bot.cmx.qrcode = '';//把二维码输出到前端管理页面用
          bot.cmx.wechatqr = BOTCONFIG.botWechatMap[contact.id];//给前端管理页面显示本bot对应的微信二维码
        } else {
          console.log(`check fail`);//如果不是白名单微信扫码，则强制登出，这里复现貌似登出后不能立刻回调到scan事件
          await bot.logout();
          //TOOD 不知道是否需要主动重启wechaty
        }

      })
      .on('logout', user => {
        console.log(`User ${user} log out`);
        bot.cmx.use = false;//bot状态置为待机
      })
      .on('error', e => console.info('Bot', 'error: %s', e))
      .on('message', message => onMessage(message, bot))
      .on('friendship', friendship => onFriendship(friendship, bot))
      .on('room-join', (room, inviteeList, inviter) => onRoomJoin(room, inviteeList, inviter, bot))
      .start();
  }
}
```
### 获取我自己的bot
```
async function getMyBot(wechatid) {
  return new Promise((resolve, reject) => {
    Models.Botlists.findOne({//里面存储了每个人bot的信息
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
```
其中bot的字段大致如下
```
const botlistsScheMa = new Schema({
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

```
### 状态机状态枚举
1. HELLO - 初始化状态，新添加机器人为好友或使用“变身机器人”触发
2. WAITUSERNAME - 检查发现不明确用户账户，等待账户信息
3. WAITNICKNAME - 检查用户尚未给本机器人起名，等待昵称信息
4. FREE - 目前基础信息完整，响应交互

在下文中状态机在不同时机发生状态变化

### 添加好友
```
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
        RedisClient.set('BOT-' + contact.id, 'WAITUSERNAME');//状态机置为等待账户名
        await fsmJob(bot, contact);
      } else {
        if (!isEmpty(hasbotinfo.nickname)) {
          RedisClient.set('BOT-' + contact.id, 'HELLO');//状态机置为打招呼
          await fsmJob(bot, contact, hasbotinfo.nickname);
        } else {
          RedisClient.set('BOT-' + contact.id, 'WAITNICKNAME');//状态机置为等待昵称
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
          wechatid: contact.id//更新一下微信号
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
```

### 接收消息
```
async function onMessage(msg, bot) {
  const contact = msg.talker();
  if (contact.id == 'wexin' || msg.self()) {
    return;
  }
  await fsmJob(bot, contact, msg, true);//直接调用状态机动作
}
```

### 状态机动作
```
async function fsmJob(bot, contact, msg, reply) {
  let FSM = await (() => {//查询当前用户状态
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
    await botDoProcess[FSM](bot, contact, msg, reply);//直接执行对应动作
  else {//说明是新用户
    if (reply && msg) {//说明用户主动发消息给bot
      //...有若干代码，主要思想就是根据用户发的消息，进行相应处理
    }
  }
}
```
主要逻辑在botDoProcess变量中实现，
```
const botDoProcess = {
   WAITUSERNAME: async (bot, contact, msg, reply)=>{//接收到的是用户账户名，检查数据库是否存在，存在则与bot绑定},
   WAITNICKNAME: async (bot, contact, msg, reply)=>{//接收到的是bot昵称，更新数据库},
   FREE: async (bot, contact, msg, reply)=>{//处理指令【纪要、纪要发送邮箱、日报、帮助等】，对文本、音频、视频、附件、图片进行处理、归档、统计、分析},
   HELLO: async (bot, contact, nickname)=>{
     await contact.say(BOTCONFIG.language[_LANG].hello + nickname);
     RedisClient.set('BOT-' + contact.id, 'FREE');//空闲
     await fsmJob(bot, contact);
   },
}
```

### 分词与关键词提取
使用CppJieba提供底层分词算法实现

## paddleWorkers-提供chatbot支撑服务
> 本次只使用了图片OCR这一个功能，并且封装为http接口【因为pyton实现的paddleWorker，nodejs实现的botPlatform】，暴露给botPlatform使用，得力于paddlehub的组件成熟度，所以代码量很少，这里给paddlehub点个赞

```
from flask import request, Flask
import json
import paddlehub as hub
import cv2
import requests
import os


app = Flask(__name__)
ocr = None


@app.route('/imageOcr', methods=['GET'])
def image_ocr():
    path = request.args.get('imagePath')
    print(path)
    file_name = os.path.basename(path)
    file_down = requests.get(path)
    with open('/mnt/'+file_name,'wb') as f:
        f.write(file_down.content)
    ocr_res = ocr.recognize_text(images=[cv2.imread('/mnt/'+file_name)])
    data = ocr_res[0]['data']
    res_data = {}
    text = []
    for item in data:
        text.append(item['text'])
    res_data['msg'] = '请求成功'
    res_data['code'] = 200
    res_data['data'] = text
    os.remove('/mnt/'+file_name)
    return json.dumps(res_data,ensure_ascii=False)



def load_model():
    global ocr
    ocr = hub.Module(name="chinese_ocr_db_crnn_server")


if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=9000)

```
## webpages-实现前端页面
> 虽然写前端页面的工作相比于高大上的机器学习、深度学习、人工智能、自然语言处理这些门类，显得不上档次，但是有一个"友好一点点"的界面总还算是件好事。

基本上就是这个样子按组件化编写的页面
```
<a-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
    <div class="duplicate-file-item border-size p-size dark-bg9">
    <p class="item-title">
        <img src="~assets/img/information-archiving/icon@2x.png" alt />群聊文件
    </p>
    <duplicate-file v-if="fileBot.length" :data="fileBot"></duplicate-file>
    <a-empty
        v-else
        :image="require('~/static/images/error/no-data@2x.png')"
        :image-style="{
        height: '95px',
        }"
    >
        <span slot="description">暂无数据~</span>
    </a-empty>
    </div>
</a-col>
```
开发语言为VUE，使用Echarts的图表，这部分就不赘述如何开发的了，按设计稿实现就好了。

# 尚未解决问题
1. 目前版本基于状态机的消息处理逻辑是不能应答非标准化的指令的，可以通过引入自然语言处理和多轮对话技术辅助触发状态变化；
2. 由于wechaty原理基于微信号的消息收发，所以存在添加好友人数上线，目前本方案可支持不添加好友情况下，在微信群中@机器人的方式进行交互，但复杂场景下还是需要添加好友的。考虑到这点，botPlatform在最开始的配置信息中，预留了多个wechaty实例使用的token数组，并且通过循环创建的方式，可以在服务器端启动多个wechaty实例待机，并且根据策略派发实例响应用户交互（ps.不成熟）；
3. 基于wechaty作为消息收发中枢的模式无法满足生产环境下高可用的要求，如果一个实例宕机，其它实例目前没有平滑无缝接管服务的方式，所以只能多拜拜大神了。

