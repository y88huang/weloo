var uwapi = require('../../../utils/uwapi');
var utils = require('../../../utils/utils');

module.exports = function(webot) {
  // Exam Command Rule
  webot.waitRule('wait_course', function(info, next) {
    try {
      var subject = info.text.match(/\D+/)[0];
      var catalogNum = info.text.match(/\d+/)[0];  
    } catch(err) {
      //input format is wrong
      next(null, utils.localizedText(webot, 
        {
          'en_us' : 'Invalid format, please enter in this format: cs486',
          'zh_cn' : "格式不正确，请仿造以下例子：cs488"
        });
    }
    uwapi.getjson('courses/'+subject+'/'+catalogNum+'/examschedule', function(data) {
      //No Course found
      if (data['meta']['message'] == 'No data returned') {
        info.rewait();
        next(null, 'Oops! No match!\nPlease try again.');
      } else {
        data = data['data'];
        var course = data['course'];
        var descrip = data['sections'];
        var result = new Array();
        for (var i = 0; i < descrip.length; i++) {
          var section = descrip[i]['section'];
          var day = descrip[i]['day'];
          var date = descrip[i]['date'];
          var start = descrip[i]['start_time'];
          var end = descrip[i]['end_time'];
          var location = descrip[i]['location'];
          var exam = 'Section: '+section+', Location: '+location;
          result.push(exam);
        }
        var reply = {
          title: course+'\t'+date+' '+day+'\n'+start+' - '+end, 
          description: result.join('\n')
        };
        next(null, reply);
      };
    });
  });

  webot.set('exam schedule', {
    description: 'Use \'exam\' command to get the final exam schedule of a course',
    pattern: /^(exam)$/i,
    handler: function(info) {
      info.wait('wait_course');
      return utils.localizedText(webot, 
        {
          'en_us' : 'Please enter your course subject and number. (e.g. CS486)',
          'zh_cn' : "请输入你的Course Number, 比如 cs116："
        }
      );
    }
  });
};