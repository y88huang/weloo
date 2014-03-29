//All dependencies goes here
var crypto = require('crypto');
var debug = require('debug');
var log = debug('webot-example:log');
var verbose = debug('webot-example:verbose');
var error = debug('webot-example:error');
var _ = require('underscore')._;
var search = require('../lib/support').search;
var geo2loc = require('../lib/support').geo2loc;
var package_info = require('../package.json');
var mongo = require('mongodb');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL||
            'mongodb://y88huang:123456@oceanic.mongohq.com:10087/app23211056';
var collecions = ["language"];

//A blocking library enable us to wait for API response
var httpsync = require('httpsync');
var moment = require('moment');
var moment_timezone =  require('moment-timezone');

var utils = require('../utils/utils.js');
// var redis = require('../utils/redis.js').initialize();

/**
 * 初始化路由规则
 */

module.exports = exports = function(webot){
  webot.loads('./uwaterloo/terms/exam_schedule');

  var reg_help = /^(help|\?)$/i
  webot.set({
    // name 和 description 都不是必须的
    name: 'hello help',
    description: '获取使用帮助，发送 help',
    pattern: function(info) {
      //首次关注时,会收到subscri event
      return info.is('event') && info.param.event === 'subscribe' || reg_help.test(info.text);
    },
    handler: function(info,next){

  //   {
      var userName = info.uid;
      var reply;
      var database = mongo.connect(mongoUri,collecions,function(err, db) {
  if(!err) {
      db.collection("language",function(err,collection){
        var obj2 = {};
        obj2[userName] = {$exists:true};
      collection.find(obj2).toArray(function(err,results){
        if(results.length==0){
         reply = "请选择语言 Please choose your language\n1.中文 2.English";
         info.wait("language");
         next(null,reply);
        }
        else{
          reply = {
        title: '感谢你关注WeLoo公众平台',
        pic: 'http://i.imgur.com/ySk4ojW.jpg',
        url: 'https://github.com/node-webot',
        description: [
          '你可以试试以下指令:',
            // 'game : 玩玩猜数字的游戏吧',
            'exam : 查看exam schedule',
            'tim : 查询SLC的timmis营业时间',
            'w(weather):查询当前天气,温度等情况',
             'game : 玩玩猜数字的游戏吧',
             'browsers: 查询dp的browsers caf营业时间',
             'bon: 查询dc的bon app营业时间',
             'coffee: 查询ml的coffee shop营业时间',
             'bru(brubakers): 查询slc的brubakers营业时间',
             'Language: 重新选择语言',
            // 's+空格+关键词 : 我会帮你百度搜索喔',
            // 's+空格+nde : 可以试试我的纠错能力',
            // '使用「位置」发送你的经纬度',
            '重看本指令请回复help或问号',
            '更多指令请回复more',
            '平台还在测试中,欢迎大家多提意见',
            'PS: 点击下面的「查看全文」将跳转到github源代码页'
        ].join('\n')
      };
      next(null,reply);
        }
      })})
    }});

     
      // 返回值如果是list，则回复图文消息列表
      return reply;
    }
  });

//To do.
 webot.waitRule('language', function(info, next) {
    var language = Number(info.text);
    var lanInfo = '';
    if(language==1){
        lanInfo='CH';
    }
    else if(language==2){
        lanInfo='EN';
    }
    var database = mongo.connect(mongoUri,collecions,function(err, db) {
      db.collection("language",function(err,collection){
        if(!err) {
        var userName = info.uid;
        var obj = {};
        obj[userName] = lanInfo;
         collection.insert(obj,function(err,cb){});
         // info.wait("language");
         if(language==1){
         next(null,"欢迎使用微信公众平台,输入Help获取帮助");
       }
       else {
        next(null,"Welcome WeLoo! use 'help' to get more information")
       }
        }
      });
    });
  });









  // 更简单地设置一条规则
  webot.set(/^more$/i, function(info){
    var reply = _.chain(webot.gets()).filter(function(rule){
      return rule.description;
    }).map(function(rule){
      //console.log(rule.name)
      return '> ' + rule.description;
    }).join('\n').value();

    return ['我的主人还没教我太多东西,你可以考虑帮我加下.\n可用的指令:\n'+ reply,
      '没有更多啦！当前可用指令：\n' + reply];
  });

  webot.set('who_are_you', {
    description: '想知道我是谁吗? 发送: who?',
    // pattern 既可以是函数，也可以是 regexp 或 字符串(模糊匹配)
    pattern: /who|你是[谁\?]+/i,
    // 回复handler也可以直接是字符串或数组，如果是数组则随机返回一个子元素
    handler: ['我是神马机器人', '微信机器人']
  });

  // 正则匹配后的匹配组存在 info.query 中
  webot.set('your_name', {
    description: '自我介绍下吧, 发送: I am [enter_your_name]',
    pattern: /^(?:my name is|i am|我(?:的名字)?(?:是|叫)?)\s*(.*)$/i,

    // handler: function(info, action){
    //   return '你好,' + info.param[1]
    // }
    // 或者更简单一点
    handler: '你好,{1}'
  });

  // Simple conversation 
  // 简单的纯文本对话，可以用单独的 yaml 文件来定义
  require('js-yaml');
  webot.dialog(__dirname + '/dialog.yaml');

  // 支持一次性加多个（方便后台数据库存储规则）
  webot.set([{
    name: 'morning',
    description: '打个招呼吧, 发送: good morning',
    pattern: /^(早上?好?|(good )?moring)[啊\!！\.。]*$/i,
    handler: function(info){
      var d = new Date();
      var h = d.getHours();
      if (h < 3) return '[嘘] 我这边还是深夜呢，别吵着大家了';
      if (h < 5) return '这才几点钟啊，您就醒了？';
      if (h < 7) return '早啊官人！您可起得真早呐~ 给你请安了！\n 今天想参加点什么活动呢？';
      if (h < 9) return 'Morning, sir! 新的一天又开始了！您今天心情怎么样？';
      if (h < 12) return '这都几点了，还早啊...';
      if (h < 14) return '人家中午饭都吃过了，还早呐？';
      if (h < 17) return '如此美好的下午，是很适合出门逛逛的';
      if (h < 21) return '早，什么早？找碴的找？';
      if (h >= 21) return '您还是早点睡吧...';
    }
  }, {
    name: 'time',
    description: '想知道几点吗? 发送: time',
    pattern: /^(几点了|time)\??$/i,
    handler: function(info) {
      var now = moment_timezone().tz('America/Toronto');
      h = now.hours();
      var t = '现在是滑铁卢本地时间' + h + '点' + now.minutes() + '分';
      if (h < 4 || h > 22) return t + '，夜深了，早点睡吧 [月亮]';
      if (h < 6) return t + '，您还是再多睡会儿吧';
      if (h < 9) return t + '，又是一个美好的清晨呢，今天准备去哪里玩呢？';
      if (h < 12) return t + '，一日之计在于晨，今天要做的事情安排好了吗？';
      if (h < 15) return t + '，午后的冬日是否特别动人？';
      if (h < 19) return t + '，又是一个充满活力的下午！今天你的任务完成了吗？';
      if (h <= 22) return t + '，这样一个美好的夜晚，有没有去看什么演出？';
      return t;
    }
  }]);

  // 等待下一次回复
  webot.set('guess my sex', {
    pattern: /是男.还是女.|你.*男的女的/,
    handler: '你猜猜看呐',
    replies: {
      '/女|girl/i': '人家才不是女人呢',
      '/男|boy/i': '是的，我就是翩翩公子一枚',
      'both|不男不女': '你丫才不男不女呢',
      '不猜': '好的，再见',
      // 请谨慎使用通配符
      '/.*/': function reguess(info) {
        if (info.rewaitCount < 2) {
          info.rewait();
          return '你到底还猜不猜嘛！';
        }
        return '看来你真的不想猜啊';
      },
    }

    // 也可以用一个函数搞定:
    // replies: function(info){
    //   return 'haha, I wont tell you'
    // }

    // 也可以是数组格式，每个元素为一条rule
    // replies: [{
    //   pattern: '/^g(irl)?\\??$/i',
    //   handler: '猜错'
    // },{
    //   pattern: '/^b(oy)?\\??$/i',
    //   handler: '猜对了'
    // },{
    //   pattern: 'both',
    //   handler: '对你无语...'
    // }]
  });



  webot.waitRule('wait_ji', function(info) {
    var text = info.text;
    if (text == '不玩了') {
      info.resolve();
      return '88~';
    }
    var url = "http://xjjapi.duapp.com/api/show.action?m=chat&msg="+info.text;
    var req = httpsync.get(url);
    var response= req.end();
    var data = response['data'].toString('utf-8');
    info.rewait();
    return data;
  });

  webot.set('little yellow chicken', {
    pattern: /小黄鸡/,
    handler: function(info) {
      info.wait('wait_ji');
      return '我已变身鸡器人！';
    }
  }

  );

  // 定义一个 wait rule
  webot.waitRule('wait_guess', function(info) {
    var r = Number(info.text);

    // 用户不想玩了...
    if (isNaN(r)) {
      info.resolve();
      return null;
    }

    var num = info.session.guess_answer;

    if (r === num) {
      return '你真聪明!';
    }

    var rewaitCount = info.session.rewait_count || 0;
    if (rewaitCount >= 2) {
      return '怎么这样都猜不出来！答案是 ' + num + ' 啊！';
    }

    //重试
    info.rewait();
    return (r > num ? '大了': '小了') +',还有' + (2 - rewaitCount) + '次机会,再猜.';
  });

  webot.set('guess number', {
    description: '发送: game , 玩玩猜数字的游戏吧',
    pattern: /(?:game|玩?游戏)\s*(\d*)/,
    handler: function(info){
      //等待下一次回复
      var num = Number(info.param[1]) || _.random(1,9);

      verbose('answer is: ' + num);

      info.session.guess_answer = num;

      info.wait('wait_guess');
      return '玩玩猜数字的游戏吧, 1~9,选一个';
    }
  });
  

  webot.set('set language',{
    description: '发送: 重新设置语言',
    pattern: /^(l|L)anguage/,
    handler: function(info,next){
       var database = mongo.connect(mongoUri,collecions,function(err, db) {
      db.collection("language",function(err,collection){
        if(!err) {
        var userName = info.uid;
        var obj = {};
          obj[userName] = {$exists:true};
         // info.wait("language");
      collection.find(obj).toArray(function(err,results){
        if(results.length==0){
          next(null,"咦？发生了奇怪的事情");
        }
        else{
          next(null,"Mission Complete!");
        }
    });
    }
    });}
     )}});
  webot.waitRule('wait_class', function(info) {
    var courseName = info.text;
    console.log(courseName);
    var subject = courseName.match(/[^0-9]*/)[0];
    var courseNumber = courseName.match(/\d+/)[0];
    // console.log(subject);
    // console.log(courseNumber);
    var url = "http://api.uwaterloo.ca/v2/courses/"+subject+"/"+courseNumber+"/"+"examschedule.json?key=b15ec88836fc09518c7407bb3951193c"
    // console.log(url);
     var req = httpsync.get(url);
    var response= req.end();
    var data = JSON.parse(response['data'].toString('utf-8'))['data'];
    // console.log(data);
    var output = '';


    if(!utils.isEmptyObject(data)){
    var course = data['course'];
    data = data['sections'][0];

    var section = data['section'];
    var day = data['day'];
    var date = data['date'];
    var start = data['start_time'];
    var end = data['end_time'];
    var location = data['location'];
    var notes = data['notes'];
    output = output+ "你的科目 "+course + " section:"+section+" 将于 " + day +" " + date+" 在 "+location+" 进行, 开始时间 "+ start+ " 结束时间 "+end ;
    // while(tmp){
    // }
    // var req = httpsync.get({
    //   url:"http://api.uwaterloo.ca/v2/courses/CS/486/examschedule.json?key=b15ec88836fc09518c7407bb3951193c"
    // });
    // var res = req.end();
    // // var data = JSON.parse(res);
    // var couseName = res['data'];
    // console.log(response);
    // req.end();
    // console.log(res);
    // console.log("i am finshed");
  }
  else{
    output = "查无此课, 我的朋友";
  }

     return output;
  });

  webot.set('exam schedule',{
    description:'发送: exam, 查询你的考试时间地点',
    pattern: /(?:exam|考？试|Exam)\s*(\d*)/, //exam|
    handler: function(info){
      var num = 3;
      info.session.course = num;
      // console.log(info.raw['FromUserName']);
      info.wait('wait_class');
      return "请输入课号 eg.cs115";
    }
  });
  // webot.set(,{
  //   description:'tim : 查询SLC的timmis营业时间',
  //   pattern:
  //   handler:function(info){
  //     var url = "https://api.uwaterloo.ca/v2/foodservices/locations.json?key=b15ec88836fc09518c7407bb3951193c"
  //     var req = httpsync.get(url);
  //     var response=req.end();
  //     var data = JSON.parse(response['data'].toString('utf-8'))['data'];
  //     var output='';
  //     console.log(data);
  //      if(!utils.isEmptyObject(data)){
  //       var day = getDay();
  //       console.log(day);
  //       output='lolol';
  //      }
  //      return output;
  //   }
  // });


 webot.set('Brubakers slc',{
    description:'Brubakers : 查询slc的Brubakers营业时间',
    pattern: /^(B|b)(ru)|^(B|b)(rubakers)/,//wtf is that
    handler: function(info){
      var url="http://api.uwaterloo.ca/v2/foodservices/locations.json?key=b15ec88836fc09518c7407bb3951193c";
        var req = httpsync.get(url);
    var response= req.end();
    var data = JSON.parse(response['data'].toString('utf-8'))['data'];
    var output = '';
    // console.log(data);
    if(!utils.isEmptyObject(data)){
      var browsers;
      for (var i = data.length - 1; i >= 0; i--) {
        if(data[i]['outlet_id']=="20"){
        browsers = data[i];
        break;
      }
    };
      // console.log(timmis);
      var d = new Date();
      var day = d.getDay();
      console.log(day);
      // output = 'lol'+day;
      var today='';
      switch(day){
        case 1:
        today="monday";
        break;
        case 2:
        today = "tuesday";
        break;
        case 3:
        today = "wednesday";
        break;
        case 4:
        today = "thursday";
        break;
        case 5:
        today = "friday";
        break;
        case 6:
        today = "saturday";
        break;
        case 0:
        today = "sunday";
        break;
      }
      var hours = browsers['opening_hours'][today];
      var specialhours = browsers['special_hours'];
      var open_hour = hours['opening_hour'];
      var closing_hour = hours['closing_hour'];
      var closed = hours['is_closed'];
      console.log(today);
      console.log(hours);
      // console.log(browsers);


      //Handling special hours case here.
      if((!utils.isEmptyObject(specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = specialhours.length - 1; i >= 0; i--) {
             if(specialhours[i]['date']==now){
              console.log(specialhours[i]);
              open_hour = specialhours[i]['opening_hour'];

              closing_hour = specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output="SLC的Brubakers 今天"+open_hour+"开门, "+closing_hour+"关门 ";
      }
      else{
        output="SLC的Brubakers 今天不开门！";
      }
  }
  else{
    output = "营业时间不明,我的朋友";
  }
      return output;
    }
  });

webot.set('map',{
    description:'map test',
    pattern: /^(map)/,//wtf is that
    handler: function(info){
      var gm = require('googlemaps');
      var util = require('util');
      var data;
       gm.reverseGeocode('43.464258,-80.520410', function(err, data){
        console.log(data);
        });

        // gm.reverseGeocode(gm.checkAndConvertPoint([41.850033, -87.6500523]), function(err, data){
        // util.puts(JSON.stringify(data));
        // });
        output = "看你妈！"
        return output;
    }
  });



 webot.set('coffee shop ml',{
    description:'Coffee Shop : 查询ml的coffee shop营业时间',
    pattern: /^(c|C)(offee)/,//wtf is that
    handler: function(info){
      var url="http://api.uwaterloo.ca/v2/foodservices/locations.json?key=b15ec88836fc09518c7407bb3951193c";
        var req = httpsync.get(url);
    var response= req.end();
    var data = JSON.parse(response['data'].toString('utf-8'))['data'];
    var output = '';
    // console.log(data);
    if(!utils.isEmptyObject(data)){
      var browsers;
      for (var i = data.length - 1; i >= 0; i--) {
        if(data[i]['outlet_id']=="20"){
        browsers = data[i];
        break;
      }
    };
      // console.log(timmis);
      var d = new Date();
      var day = d.getDay();
      console.log(day);
      // output = 'lol'+day;
      var today='';
      switch(day){
        case 1:
        today="monday";
        break;
        case 2:
        today = "tuesday";
        break;
        case 3:
        today = "wednesday";
        break;
        case 4:
        today = "thursday";
        break;
        case 5:
        today = "friday";
        break;
        case 6:
        today = "saturday";
        break;
        case 0:
        today = "sunday";
        break;
      }
      var hours = browsers['opening_hours'][today];
      var specialhours = browsers['special_hours'];
      var open_hour = hours['opening_hour'];
      var closing_hour = hours['closing_hour'];
      var closed = hours['is_closed'];
      console.log(today);
      console.log(hours);
      // console.log(browsers);


      //Handling special hours case here.
      if((!utils.isEmptyObject(specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = specialhours.length - 1; i >= 0; i--) {
             if(specialhours[i]['date']==now){
              console.log(specialhours[i]);
              open_hour = specialhours[i]['opening_hour'];

              closing_hour = specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output="ML的Coffee Shop 今天"+open_hour+"开门, "+closing_hour+"关门 ";
      }
      else{
        output="ML的Coffee Shop 今天不开门 T_T";
      }
  }
  else{
    output = "营业时间不明,我的朋友";
  }
      return output;
    }
  });




 webot.set('bon app dc',{
    description:'Bon app : 查询dc的Bon app营业时间',
    pattern: /^(B|b)(on)/,//wtf is that
    handler: function(info){
      var url="http://api.uwaterloo.ca/v2/foodservices/locations.json?key=b15ec88836fc09518c7407bb3951193c";
        var req = httpsync.get(url);
    var response= req.end();
    var data = JSON.parse(response['data'].toString('utf-8'))['data'];
    var output = '';
    // console.log(data);

    if(!utils.isEmptyObject(data)){
      var browsers;
      for (var i = data.length - 1; i >= 0; i--) {
        if(data[i]['outlet_id']=="3"){
        browsers = data[i];
        break;
      }
    };
      // console.log(timmis);
      var d = new Date();
      var day = d.getDay();
      console.log(day);
      // output = 'lol'+day;
      var today='';
      switch(day){
        case 1:
        today="monday";
        break;
        case 2:
        today = "tuesday";
        break;
        case 3:
        today = "wednesday";
        break;
        case 4:
        today = "thursday";
        break;
        case 5:
        today = "friday";
        break;
        case 6:
        today = "saturday";
        break;
        case 0:
        today = "sunday";
        break;
      }
      var hours = browsers['opening_hours'][today];
      var specialhours = browsers['special_hours'];
      var open_hour = hours['opening_hour'];
      var closing_hour = hours['closing_hour'];
      var closed = hours['is_closed'];
      console.log(today);
      console.log(hours);
      // console.log(browsers);


      //Handling special hours case here.
      if((!utils.isEmptyObject(specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = specialhours.length - 1; i >= 0; i--) {
             if(specialhours[i]['date']==now){
              console.log(specialhours[i]);
              open_hour = specialhours[i]['opening_hour'];

              closing_hour = specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output="DC的Bon App 今天"+open_hour+"开门, "+closing_hour+"关门 ";
      }
      else{
        output="DC的Bon App 今天不开门";
      }
  }
  else{
    output = "营业时间不明,我的朋友";
  }
      return output;
    }
  });
 


 webot.set('browsers caf dp',{
    description:'browsers caf : 查询dp的browsers caf营业时间',
    pattern: /^(B|b)(r|R)(o|O)(w|W)(s|S)(e|E)(r|R)(s|S)/,//wtf is that
    handler: function(info){
      var url="http://api.uwaterloo.ca/v2/foodservices/locations.json?key=b15ec88836fc09518c7407bb3951193c";
        var req = httpsync.get(url);
    var response= req.end();
    var data = JSON.parse(response['data'].toString('utf-8'))['data'];
    var output = '';
    // console.log(data);
    if(!utils.isEmptyObject(data)){
      var browsers;
      for (var i = data.length - 1; i >= 0; i--) {
        if(data[i]['outlet_id']=="20"){
        browsers = data[i];
        break;
      }
    };
      // console.log(timmis);
      var d = new Date();
      var day = d.getDay();
      console.log(day);
      // output = 'lol'+day;
      var today='';
      switch(day){
        case 1:
        today="monday";
        break;
        case 2:
        today = "tuesday";
        break;
        case 3:
        today = "wednesday";
        break;
        case 4:
        today = "thursday";
        break;
        case 5:
        today = "friday";
        break;
        case 6:
        today = "saturday";
        break;
        case 0:
        today = "sunday";
        break;
      }
      var hours = browsers['opening_hours'][today];
      var specialhours = browsers['special_hours'];
      var open_hour = hours['opening_hour'];
      var closing_hour = hours['closing_hour'];
      var closed = hours['is_closed'];
      console.log(today);
      console.log(hours);
      // console.log(browsers);


      //Handling special hours case here.
      if((!utils.isEmptyObject(specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = specialhours.length - 1; i >= 0; i--) {
             if(specialhours[i]['date']==now){
              console.log(specialhours[i]);
              open_hour = specialhours[i]['opening_hour'];

              closing_hour = specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output="DP的Browsers caf 今天"+open_hour+"开门, "+closing_hour+"关门 ";
      }else{
        output="DP的Browsers caf 今天不开门 :P";
      }
  }
  else{
    output = "营业时间不明,我的朋友";
  }
      return output;
    }
  });


 webot.set('timmis',{
    description:'tim hortons : 查询所有的timmis营业时间',
    pattern: /^(t|T)(i|I)(m|M)/,
    handler: function(info){
      var url="http://api.uwaterloo.ca/v2/foodservices/locations.json?key=b15ec88836fc09518c7407bb3951193c";
        var req = httpsync.get(url);
    var response= req.end();
    var data = JSON.parse(response['data'].toString('utf-8'))['data'];
    var output = '';
    // console.log(data);
    if(!utils.isEmptyObject(data)){
      var timmis_dcl;
      var timmis_sch;
      var timmis_dc;
      var timmis_ml;
      var timmis_slc;
      for (var i = data.length - 1; i >= 0; i--) {
         if(data[i]['outlet_id']=="303"){
           timmis_dcl = data[i];
         }
         else if(data[i]['outlet_id']=="146"){
            timmis_sch = data[i];
         }
         else if(data[i]['outlet_id']=="145"){
            timmis_dc = data[i];
         }
         else if(data[i]['outlet_id']=="144"){
            timmis_ml = data[i];
         }
         else if(data[i]['outlet_id']=="123"){
           timmis_slc = data[i];
           //break;
        }
    };
      // console.log(timmis);
      var d = new Date();
      var day = d.getDay();
      console.log(day);
      // output = 'lol'+day;
      var today='';
      switch(day){
        case 1:
        today="monday";
        break;
        case 2:
        today = "tuesday";
        break;
        case 3:
        today = "wednesday";
        break;
        case 4:
        today = "thursday";
        break;
        case 5:
        today = "friday";
        break;
        case 6:
        today = "saturday";
        break;
        case 0:
        today = "sunday";
        break;
      }
      var slc_hours = timmis_slc['opening_hours'][today];
      var slc_specialhours = timmis_slc['special_hours'];
      var slc_open_hour = slc_hours['opening_hour'];
      var slc_closing_hour = slc_hours['closing_hour'];
      var closed = slc_hours['is_closed'];
      console.log(today);
      console.log(slc_hours);
       //console.log(timmis_slc);


      //Handling special hours case here.
      if((!utils.isEmptyObject(slc_specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = slc_specialhours.length - 1; i >= 0; i--) {
             if(slc_specialhours[i]['date']==now){
              console.log(slc_specialhours[i]);
              slc_open_hour = slc_specialhours[i]['opening_hour'];

              slc_closing_hour = slc_specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output+="SLC的Tim horton's 今天"+slc_open_hour+"开门, "+slc_closing_hour+"关门 \n";
      }
      else{
        output+="SLC的Tim horton's 今天不开门哦 \n";
      }

      //Dc library
      var dcl_hours = timmis_dcl['opening_hours'][today];
      var dcl_specialhours = timmis_dcl['special_hours'];
      var dcl_open_hour = dcl_hours['opening_hour'];
      var dcl_closing_hour = dcl_hours['closing_hour'];
      closed = dcl_hours['is_closed'];
      //Handling special hours case here.
      if((!utils.isEmptyObject(dcl_specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = dcl_specialhours.length - 1; i >= 0; i--) {
             if(dcl_specialhours[i]['date']==now){
              console.log(dcl_specialhours[i]);
              dcl_open_hour = dcl_specialhours[i]['opening_hour'];

              dcl_closing_hour = dcl_specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output+="    DC library的Tim horton's 今天"+dcl_open_hour+"开门, "+dcl_closing_hour+"关门 \n";
      }
      else{
        output+="    DC library的Tim horton's 今天不开门哦 \n";
      }

      //SCH
      var sch_hours = timmis_sch['opening_hours'][today];
      var sch_specialhours = timmis_sch['special_hours'];
      var sch_open_hour = sch_hours['opening_hour'];
      var sch_closing_hour = sch_hours['closing_hour'];
      closed = sch_hours['is_closed'];
      //Handling special hours case here.
      if((!utils.isEmptyObject(sch_specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = sch_specialhours.length - 1; i >= 0; i--) {
             if(sch_specialhours[i]['date']==now){
              console.log(sch_specialhours[i]);
              sch_open_hour = sch_specialhours[i]['opening_hour'];
              sch_closing_hour = sch_specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output+="    SCH的Tim horton's 今天"+sch_open_hour+"开门, "+sch_closing_hour+"关门 \n";
      }
      else{
        output+="    SCH的Tim horton's 今天不开门哦 \n";
      }

      var dc_hours = timmis_dc['opening_hours'][today];
      var dc_specialhours = timmis_dc['special_hours'];
      var dc_open_hour = dc_hours['opening_hour'];
      var dc_closing_hour = dc_hours['closing_hour'];
      closed = dc_hours['is_closed'];
      //Handling special hours case here.
      if((!utils.isEmptyObject(dc_specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = dc_specialhours.length - 1; i >= 0; i--) {
             if(dc_specialhours[i]['date']==now){
              console.log(dc_specialhours[i]);
              dc_open_hour = dc_specialhours[i]['opening_hour'];
              dc_closing_hour = dc_specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output+="    DC的Tim horton's 今天"+dc_open_hour+"开门, "+dc_closing_hour+"关门 \n";
      }
      else{
        output+="    DC的Tim horton's 今天不开门哦 \n";
      }

      var ml_hours = timmis_ml['opening_hours'][today];
      var ml_specialhours = timmis_ml['special_hours'];
      var ml_open_hour = ml_hours['opening_hour'];
      var ml_closing_hour = ml_hours['closing_hour'];
      closed = ml_hours['is_closed'];
      //Handling special hours case here.
      if((!utils.isEmptyObject(ml_specialhours))){
        // console.log(specialhours);
        var now = moment().format('YYYY-MM-DD');
        for (var i = ml_specialhours.length - 1; i >= 0; i--) {
             if(ml_specialhours[i]['date']==now){
              console.log(ml_specialhours[i]);
              ml_open_hour = ml_specialhours[i]['opening_hour'];
              ml_closing_hour = ml_specialhours[i]['closing_hour'];
              break;
             }
        };
      }
      if(!closed){
        output+="    ML的Tim horton's 今天"+ml_open_hour+"开门, "+ml_closing_hour+"关门 \n";
      }
      else{
        output+="    ML的Tim horton's 今天不开门哦 \n";
      }



  }
  else{
    output = "营业时间不明,我的朋友";
  }
      return output;
    }
  });

  webot.set('current weather',{
    description:'w(weather):查询当前天气,温度等情况',
    pattern: /(?:w|W|Weather|weather|天气)\s*(\d*)/,
    handler: function(info){
      // console.log(info);
    var url="api.uwaterloo.ca/v2/weather/current.json";
    var req = httpsync.get(url);
    var response= req.end();
    var data = JSON.parse(response['data'].toString('utf-8'))['data'];
    var output = '';
    // console.log(data);
    if(!utils.isEmptyObject(data)){
    var max = data['temperature_24hr_max_c'];
    var min = data['temperature_24hr_min_c'];
    var hum = data['relative_humidity_percent'];
    var temperature = data['temperature_current_c'];
    output = output+ "当前温度: "+temperature+"度, 今天最高温度: "+max+ "度 今天最低温度: "+min+ "度 当前湿度: "+hum+"%";
  }
  else{
    output = "当前温度不明,我的朋友";
  }
      return output;
    }
  });

  webot.set('speech recognition', {
    description: '微信语音识别',
    pattern: function(info) {
      return info.is('voice') || info.type == 'voice';
    },
    handler: function(info, next) {
      next(null, info.param.recognition);
    }

  });


  webot.waitRule('wait_suggest_keyword', function(info, next){
    if (!info.text) {
      return next();
    }

    // 按照定义规则的 name 获取其他 handler
    var rule_search = webot.get('search');

    // 用户回复回来的消息
    if (info.text.match(/^(好|要|y)$/i)) {
      // 修改回复消息的匹配文本，传入搜索命令执行
      info.param[0] = 's nodejs';
      info.param[1] = 'nodejs';

      // 执行某条规则
      webot.exec(info, rule_search, next);
      // 也可以调用 rule 的 exec 方法
      // rule_search.exec(info, next);
    } else {
      info.param[1] = info.session.last_search_word;
      // 或者直接调用 handler :
      rule_search.handler(info, next);
      // 甚至直接用命名好的 function name 来调用：
      // do_search(info, next);
    }
    // remember to clean your session object.
    delete info.session.last_search_word;
  });

  // 调用已有的action
  webot.set('suggest keyword', {
    description: '发送: s nde ,然后再回复Y或其他',
    pattern: /^(?:搜索?|search|s\b)\s*(.+)/i,
    handler: function(info){
      var q = info.param[1];
      if (q === 'nde') {
        info.session.last_search_word = q;
        info.wait('wait_suggest_keyword');
        return '你输入了:' + q + '，似乎拼写错误。要我帮你更改为「nodejs」并搜索吗?';
      }
    }
  });

  function do_search(info, next){
    // pattern的解析结果将放在param里
    var q = info.param[1];
    log('searching: ', q);
    // 从某个地方搜索到数据...
    return search(q , next);
  }

  // 可以通过回调返回结果
  webot.set('search', {
    description: '发送: s 关键词 ',
    pattern: /^(?:搜索?|search|百度|s\b)\s*(.+)/i,
    //handler也可以是异步的
    handler: do_search
  });


  webot.waitRule('wait_timeout', function(info) {
    if (new Date().getTime() - info.session.wait_begin > 5000) {
      delete info.session.wait_begin;
      return '你的操作超时了,请重新输入';
    } else {
      return '你在规定时限里面输入了: ' + info.text;
    }
  });

  // 超时处理
  webot.set('timeout', {
    description: '输入timeout, 等待5秒后回复,会提示超时',
    pattern: 'timeout',
    handler: function(info) {
      info.session.wait_begin = new Date().getTime();
      info.wait('wait_timeout');
      return '请等待5秒后回复';
    }
  });

  /**
   * Wait rules as lists
   *
   * 实现类似电话客服的自动应答流程
   *
   */
  webot.set(/^ok webot$/i, function(info) {
    info.wait('list');
    return '可用指令：\n' +
           '1 - 查看程序信息\n' +
           '2 - 进入名字选择';
  });
  webot.waitRule('list', {
    '1': 'webot ' + package_info.version,
    '2': function(info) {
      info.wait('list-2');
      return '请选择人名:\n' +
             '1 - Marry\n' +
             '2 - Jane\n' +
             '3 - 自定义'
    }
  });
  webot.waitRule('list-2', {
    '1': '你选择了 Marry',
    '2': '你选择了 Jane',
    '3': function(info) {
      info.wait('list-2-3');
      return '请输入你想要的人';
    }
  });
  webot.waitRule('list-2-3', function(info) {
    if (info.text) {
      return '你输入了 ' + info.text;
    }
  });

//calculate distance between two locations
function distance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var radlon1 = Math.PI * lon1/180
    var radlon2 = Math.PI * lon2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    if (unit=="meter") { dist = dist * 1.609344*1000 }
    return dist
}

  //支持location消息 此examples使用的是高德地图的API
  //http://restapi.amap.com/rgeocode/simple?resType=json&encode=utf-8&range=3000&roadnum=0&crossnum=0&poinum=0&retvalue=1&sid=7001&region=113.24%2C23.08
  webot.set('check_location', {
    description: '发送你的经纬度,我会查询你和SLC Tim Hortons之间的距离',
    pattern: function(info){
      return info.is('location');
    },
    handler: function(info, next){
      console.log("location checking");

      console.log("lat: " + info.raw.Location_X);
      console.log("long: " + info.raw.Location_Y);
      var dis = distance(info.raw.Location_X,info.raw.Location_Y,43.471324,-80.545186,"meter");
      var gm = require('googlemaps');
      var util = require('util');
      var data;
      var output = "";
      var address = "";
      var s = info.raw.Location_X.toString();
      var distance_to_slc_tim = Math.ceil(dis);
      s +=",";
      s += info.raw.Location_Y.toString();
       gm.reverseGeocode(s, function(err, data){
        if(data.results.length<1){
          output = "no such address. I am sorry buddy!";
        }
        else{
          address = data.results[0].formatted_address;
          // log("address: %s", output);
          output = "your current location is: "+address+"\n";
          output += "    distance between you and SLC Tim Hortons is: "+ distance_to_slc_tim+" m";
        }
          next(null, output);
        });
      // geo2loc(info.param, function(err, location, data) {
      //   location = location || info.label;
      //   next(null, location ? '你正在' + location : '我不知道你在什么地方。');
      // });
    }
  });

  //图片
  webot.set('check_image', {
    description: '发送图片,我将返回其hash值',
    pattern: function(info){
      return info.is('image');
    },
    handler: function(info, next){
      verbose('image url: %s', info.param.picUrl);
      try{
        var shasum = crypto.createHash('md5');

        var req = require('request')(info.param.picUrl);

        req.on('data', function(data) {
          shasum.update(data);
        });
        req.on('end', function() {
          return next(null, '你的图片hash: ' + shasum.digest('hex'));
        });
      }catch(e){
        error('Failed hashing image: %s', e)
        return '生成图片hash失败: ' + e;
      }
    }
  });

  // 回复图文消息
  webot.set('reply_news', {
    description: '发送news,我将回复图文消息你',
    pattern: /^news\s*(\d*)$/,
    handler: function(info){
      var reply = [
        {title: '微信机器人', description: '微信机器人测试帐号：webot', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'https://github.com/node-webot/webot-example'},
        {title: '豆瓣同城微信帐号', description: '豆瓣同城微信帐号二维码：douban-event', pic: 'http://i.imgur.com/ijE19.jpg', url: 'https://github.com/node-webot/weixin-robot'},
        {title: '图文消息3', description: '图文消息描述3', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'http://www.baidu.com'}
      ];
      // 发送 "news 1" 时只回复一条图文消息
      return Number(info.param[1]) == 1 ? reply[0] : reply;
    }
  });

  // 可以指定图文消息的映射关系
  webot.config.mapping = function(item, index, info){
    //item.title = (index+1) + '> ' + item.title;
    return item;
  };

  //所有消息都无法匹配时的fallback
  webot.set(/.*/, function(info){
    // 利用 error log 收集听不懂的消息，以利于接下来完善规则
    // 你也可以将这些 message 存入数据库
    console.log('unhandled message: %s', info.raw.Recognition);
    info.flag = true;
    return '你发送了「' + info.text + '」,可惜我太笨了,听不懂. 发送: help 查看可用的指令';
  });
};
