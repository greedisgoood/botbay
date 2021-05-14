
<template>
  <div class="information-archiving-page" :class="{'dark-theme-main': themecolor == 'dark'}">
    <div class="archiving-main">
     <header>
      <h1>信息归档日报</h1>
      <p>报告生成时间：{{currentDate}}</p>
     </header>
      <a-row :gutter="!isMobile ? 18 : 10">
        <a-col :span="12">
          <div class="source-statistics-item border-size dark-bg1">
            <img src="~assets/img/information-archiving/source-icon@2x.png" alt="">
            <div>
              <span>平台来源信息总数统计</span>
              <span>{{total}}<span>个</span></span>
            </div>
          </div>
        </a-col>
         <a-col :span="12">
          <div class="source-statistics-item border-size dark-bg2">
            <img src="~assets/img/information-archiving/space-icon@2x.png" alt="">
            <div>
              <span>已节省空间</span>
              <span>{{$pubMethod.formatFileSize(storageSpaces)}}</span>
            </div>
          </div>
        </a-col>
      </a-row>
      <div class="hot-word-item block-size margin-t border-size p-size dark-bg3">
        <p class="item-title"><img src="~assets/img/information-archiving/icon@2x.png" alt="">词云</p>
        <word-cloud :height="isMobile ? 197 : 192" :data="hotwordsstatisticsBot" :isMobile="isMobile"></word-cloud>
      </div>
      <a-row :gutter="isMobile ? 0 : 18" class="margin-t">
        <a-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" >
          <div class="message-type-item block-size border-size p-size dark-bg4">
            <p class="item-title"><img  src="~assets/img/information-archiving/icon@2x.png" alt="">消息类型数量比例</p>
            <pie-chart id="chart2"
             ref="pieChart"
             :isMobile="isMobile"
             :themecolor="themecolor"
            :height="isMobile ? 155 : 185"
            :data="messageTypeData"
            ></pie-chart>
          </div>
        </a-col>
         <a-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" :class="{'margin-t': isMobile}">
          <div class="automatic-filtering-item block-size border-size p-size dark-bg5">
          <p class="item-title"><img  src="~assets/img/information-archiving/icon@2x.png" alt="">自动过滤消息占比</p>
           <circular-pie-chart id="chart3"
              :isMobile="isMobile"
              :themecolor="themecolor"
              :height="isMobile ? 155 : 185"
              :data="automaticFilteringData"
              ></circular-pie-chart>
          </div>
        </a-col>
      </a-row>
      <div class="line-chart margin-t border-size p-size dark-bg6">
        <p class="item-title" :class="!isMobile ? 'float-left' : ''"><img  src="~assets/img/information-archiving/icon@2x.png" alt="">群聊趋势</p>
        <line-chart id="chart4"
          :isMobile="isMobile"
          :themecolor="themecolor"
          :height="isMobile ? 191: 214"
          :xAxis="lineChartxAxis"
          :data="lineChartData"
          ref="lineChart"
          ></line-chart>
      </div>
      <a-row :gutter="18" class="margin-t">
        <a-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
          <div class="contacts-item border-size p-size dark-bg7">
            <p class="item-title"><img  src="~assets/img/information-archiving/icon@2x.png" alt="">活跃用户</p>
            <spiral-chart id="chart5"
              :isMobile="isMobile"
              :themecolor="themecolor"
              :height="isMobile ? 300 : 275"
              :data="chatLogBot"
              ></spiral-chart>
          </div>
        </a-col>
         <a-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12"  :class="{'margin-t': isMobile}">
          <div class="keywords-item border-size p-size dark-bg8">
            <p class="item-title"><img  src="~assets/img/information-archiving/icon@2x.png" alt="">人物关系</p>
            <graph-chart id="chart6"
              :isMobile="isMobile"
              :themecolor="themecolor"
              :height="isMobile ? 300 : 275"
              :data="relationstatisticsBot"
              :categories="relationCategories"
              :links="relationLinks"
              ></graph-chart>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="18" class="margin-t">
        <a-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
          <div class="duplicate-file-item border-size p-size dark-bg9">
            <p class="item-title"><img  src="~assets/img/information-archiving/icon@2x.png" alt="">群聊文件</p>
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
         <a-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" :class="{'margin-t': isMobile}">
          <div class="duplicate-file-item border-size p-size dark-bg10">
            <p class="item-title"><img  src="~assets/img/information-archiving/icon@2x.png" alt="">群聊日志</p>
            <group-chat-log v-if="summaryBot.length"  :data="summaryBot"></group-chat-log>
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
      </a-row>
    </div>
  </div>
</template>
<script>
import moment from "moment";
import "moment/locale/zh-cn";
import isMobile from "ismobilejs";
import wordCloud from "~/components/information-archiving/word-cloud.vue";
import circularPieChart from "~/components/information-archiving/circular-pie-chart.vue";
import lineChart from "~/components/information-archiving/line-chart.vue";
import pieChart from "~/components/information-archiving/pie-chart.vue";
import spiralChart from "~/components/information-archiving/spiral-chart.vue";
import graphChart from "~/components/information-archiving/graph-chart.vue";
import duplicateFile from "~/components/information-archiving/duplicate-file.vue";
import groupChatLog from "~/components/information-archiving/group-chat-log.vue";

export default {
  components: {
    'circular-pie-chart': circularPieChart,
    'line-chart': lineChart,
    'word-cloud': wordCloud,
    'pie-chart': pieChart,
    'graph-chart': graphChart,
    'spiral-chart': spiralChart,
    'duplicate-file': duplicateFile,
    'group-chat-log': groupChatLog
  },
  computed: {
    roomid() {
      return this.$route.query.roomid
    }
  },
  data() {
    return {
      isMobile: false,
      currentDate: moment().format('YYYY年MM月DD日'),
      hotwordsstatisticsBot: [],
      fileBot: [],
      messageTypeData: [],
      automaticFilteringData: [],
      chatLogBot: [],
      lineChartxAxis: ['0:00', '1:00','2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00','14:00', '15:00','16:00', '17:00','18:00', '19:00','20:00', '21:00','22:00', '23:00', '24:00'],
      lineChartData: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      summaryBot: [],
      themecolor: 'default',
      total: null , //平台来源信息总数统计
      storageSpaces: null, //已省空间
      relationstatisticsBot: [],// 人物关系
      relationCategories: [],
      relationLinks: []
    }
  },
  created() {
    this.getHotwordsstatisticsBot()
    this.getFileBot()
    this.getSummaryBot()
    this.getLineBot()
    this.getChatstatistics()
    this.getContactBot()
    this.getRelationstatisticsBot()
    this.getLineBot()
    this.themecolor = this.$pubMethod.getData("themecolor")
    const ua = navigator.userAgent.toLowerCase();
    if(/ipad/i.test(ua)){
      this.isMobile = false
    } else{
      this.isMobile = isMobile(window.navigator).any;
    } 
  },
  methods: {
    // 左下角文件
     getFileBot() {
      this.$request
        .get(this.$api.fileBot, {
          params: { roomid: this.roomid }
        })
        .then(res => {
          this.fileBot = res.data.data;
        })
        .catch(error => {
          console.log(error);
        });
    },
    // 群聊日志
    getSummaryBot() {
      this.$request
        .get(this.$api.summaryBot, {
          params: { roomid: this.roomid }
        })
        .then(res => {
          this.summaryBot = res.data.data;
        })
        .catch(error => {
          console.log(error);
        });
    },
    // 基本信息
    getChatstatistics() {
      // total是平台来源信息总数统计
      // storageSpaces是已省空间
      // text、audio、video、attachment、image是5种类型消息的数量
      // filter是过滤消息总数
       this.$request
        .get(this.$api.chatstatistics, {
          params: { roomid: this.roomid }
        })
        .then(res => {
          let {total, storageSpaces, text, audio, video, attachment, image, filter} = res.data.data
          this.total = total
          this.storageSpaces= storageSpaces
          let count = text+audio+video+attachment+image
          this.messageTypeData = [
             {
              name: '文本',
              value:  text,
              percent: count!= 0 ? parseInt(text/count*100)+'%' : '0%',
            }, {
              name: '图片',
              value:  image,
              percent: count!= 0 ? parseInt(image/count*100)+'%': '0%',
            }, {
              name: '附件',
              value: attachment,
              percent: count!= 0 ? parseInt(attachment/count*100)+'%': '0%',
            },
            {
              name: '视频',
              value: video,
              percent: count!= 0 ? parseInt(video/count*100)+'%': '0%',
            },
            {
              name: '语音',
              value: audio,
              percent: count!= 0 ? parseInt(audio/count*100)+'%': '0%',
            }
          ]
          this.automaticFilteringData = [
            {
              name: '全部消息',
              value: total,
              percent: '100%',
            },
            {
              name: '过滤消息',
              value: filter,
              percent: total != 0 ? parseInt(filter/total*100)+'%' : '0%',
            }
          ]
         
        })
        .catch(error => {
          console.log(error);
        });
      },
    // 活跃用户
    getContactBot() {
      this.$request
        .get(this.$api.contactBot, {
          params: { roomid: this.roomid }
        })
        .then(res => {
           this.chatLogBot = res.data.data.map((item,index)=>{
	          return {name:item.contact,value:item.total}
          }).sort(function (a, b) {
            return a.value - b.value;
          })
        })
        .catch(error => {
          console.log(error);
        });
    },
    // 人物关系
    getRelationstatisticsBot() {
      this.relationCategories = []
      // 返回值为数组，每一个item里面有发送者接收者
      this.$request
        .get(this.$api.relationstatisticsBot, {
          params: { roomid: this.roomid }
        })
        .then(res => {
         let name = []
         res.data.data.forEach((item,index)=>{
            if (name.indexOf(item.from) == -1) {
              name.push(item.from)
            }
            if (name.indexOf(item.to) == -1) {
              name.push(item.to)
            }
         })
        this.relationstatisticsBot = name.map((item,index)=>{
          this.relationCategories.push({name: index})
          return {name:item, category: index, value: index}
         })
         this.relationLinks = res.data.data.map((item,index)=>{
          return {source:item.from,target: item.to}
         })
         
        })
        .catch(error => {
          console.log(error);
        });
    },
   // 群聊趋势 折线图
    getLineBot() {
      // 返回值为数组，每小时有一个item
      this.$request
        .get(this.$api.lineBot, {
          params: { roomid: this.roomid }
        })
        .then(res => {
          res.data.data.forEach((item,index)=>{
	          this.lineChartData[item.hour] = item.total
          })
          this.$refs.lineChart.initEcharts()
        })
        .catch(error => {
          console.log(error);
        });
    },
    // 词云
    getHotwordsstatisticsBot() {
      this.$request
        .get(this.$api.hotwordsstatisticsBot, {
          params: { roomid: this.roomid }
        })
        .then(res => {
          this.hotwordsstatisticsBot = res.data.data.map((item,index)=>{
	          return {name:item.word,value:item.total}
          })
        })
        .catch(error => {
          console.log(error);
        });
    },
  },
  mounted() {
  }
};
</script>
<style lang="scss" scoped>
@import "~/assets/css/_handle.scss";
.information-archiving-page {
   box-sizing: border-box;
   h1, p {
    margin: 0;
    padding: 0;
  }
  .item-title {
    font-size: 16px;
    font-weight: 500;
    @include font_color("main_font_color");
    line-height: 17px;
    letter-spacing: 1px;
    margin-bottom: 10px;
    img {
      width: 20px;
      vertical-align: middle;
      margin-right: 6px;
    }
  }
  .margin-t {
   margin-top: 18px;
  }
  .block-size {
    height: 260px;
  }
  .border-size {
    border-radius: 3px;
    border: 1px solid #F0F0F0;
    background: #fff;
  }
  .p-size {
    padding: 18px 21px;
  }
  .archiving-main {
    min-height: 100vh;
    max-width: 880px;
    margin: 0 auto;
    background: url("~assets/img/information-archiving/default_bg@2x.png");
    background-size: cover;
    background-repeat: no-repeat;
    padding: 45px 49px;
    header {
      text-align: center;
      margin-bottom: 23px;
      h1 {
        font-family: AlibabaPuHuiTiM;
        font-size: 42px;
        @include font_color("main_font_color");
        line-height: 55px;
        letter-spacing: 2px;
        margin-bottom: 4px;
        font-weight: 600;
      }
      p {
        font-size: 16px;
        @include font_color("desc_font_color");
        line-height: 19px;
      }
    }
    .source-statistics-item {
      height: 93px;
      padding: 0 46px;
      display: flex;
      align-items: center;
      img {
        width: 46px;
        height: 46px;
        margin-right: 15px;
      }
      div {
        display: flex;
        flex-direction: column;
        >span {
         &:first-child {
            font-size: 14px;
           @include font_color("desc_font_color");
            line-height: 15px;
         }
         &:last-child {
          margin-top: 10px;
          font-size: 24px;
          font-weight: 500;
           @include font_color("main_font_color");
          line-height: 18px;
          span {
            font-size: 12px;
          }
         }
        }
      }
    }
    .hot-word-item {
     
    }
    .message-type-item {
    
    }
    .automatic-filtering-item {

    }
    .line-chart {
      height: 259px;
    }
    .contacts-item {
      height: 343px;

    }
    .keywords-item {
      height: 343px;
    }
    .duplicate-file-item {
      min-height: 260px;
      position: relative;
      .item-title {
        margin-bottom: 20px;
      }
      .ant-empty {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }

  }

  @media (max-width: 414px) {
    .item-title {
      font-size: 16px;
      line-height: 17px;
      letter-spacing: 1px;
      margin-bottom: 15px;
      img {
        width: 17px;
        margin-right: 6px;
      }
    }
    .margin-t {
      margin-top: 10px;
    }
    .block-size {
      height: 210px;
    }
    .border-size {
      border-radius: 2px;
    }
    .p-size {
      padding: 15px 10px;
    }
    .archiving-main {
      padding: 30px 12px;
      header {
        margin-bottom: 15px;
        h1 {
          font-size: 22px;
          line-height: 30px;
          letter-spacing: 1px;
          margin-bottom: 2px;
        }
        p {
          font-size: 9px;
          line-height: 13px;
        }
      }
      .source-statistics-item {
        height: 70px;
        padding: 0 12px;
        img {
          width: 30px;
          height: 30px;
          margin-right: 6px;
        }
        div {
          >span {
            display: inline-block;
          &:first-child {
            font-size: 10px;
            line-height: 14px;
          }
          &:last-child {
            margin-top: 8px;
            font-size: 19px;
            line-height: 12px;
            span {
              font-size: 10px;
            }
          }
          }
        }
      }
      .hot-word-item {
        height: 261px;
      }
      .message-type-item {
        .item-title { 
          margin-bottom: 4px;
        }
      }
      .automatic-filtering-item {
        .item-title { 
          margin-bottom: 4px;
        }
      }
      .line-chart {
        height: 253px;
      }
      .contacts-item {
        height: 360px;

      }
      .keywords-item {
        height: 360px;
      }
      .duplicate-file-item {
      
      }
    }
   
  }
}

.dark-theme-main {
  .border-size {
    border: 0;
  }
  .archiving-main {
    background: url("~assets/img/information-archiving/dark-bg@2x.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .dark-bg1, .dark-bg2 {
    background: url("~assets/img/information-archiving/source_bg@2x.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .dark-bg3 {
     background: url("~assets/img/information-archiving/category_bg@2x.png");
     background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .dark-bg4, .dark-bg5 {
    background: url("~assets/img/information-archiving/message_bg@2x.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .dark-bg6 {
     background: url("~assets/img/information-archiving/line_bg@2x.png");
     background-size: 100% 100%;
     background-repeat: no-repeat;
  }
  .dark-bg7, .dark-bg8 {
    background: url("~assets/img/information-archiving/user_bg@2x.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .dark-bg9, .dark-bg10 {
    background: url("~assets/img/information-archiving/file_bg@2x.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

}
</style>
