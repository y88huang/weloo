var uwapi = require('../../../utils/uwapi');
var utils = require('../../../utils/utils');

module.exports = function(webot) {
  // Exam Command Rule
  webot.waitRule('wait_course', function(info, next) {
    var invalid_format_reply = utils.localizedText(webot, 
        {
          'en_us' : 'Invalid format, please enter in this format: cs116 math115 econ101',
          'zh_cn' : '格式不正确，请仿造以下例子：cs116 math115 econ101'
        })
    var subjects = info.text.match(/\D+/g);
    var catalogNums = info.text.match(/\d+/g); 
    console.info("Subjects: " + subjects);
    console.info("Course Numbers: " + catalogNums);
    
    if (subjects.length == 0 || catalogNums.length == 0 || (subjects.length != catalogNums.length)) {
      next(null, invalid_format_reply);
    } else {
      var requestCounter = subjects.length;
      var titles = new Array();
      var descriptions = new Array();
      for (var i = 0; i < subjects.length; i++) {
        (function(i) {
          var subject = subjects[i].trim();
          var catalogNum = catalogNums[i].trim();
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
              result.push(course+":");
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
              titles.push(course+'\n'+date+' '+day+'\n'+start+' - '+end);
              descriptions.push(result.join('\n'));

              requestCounter--;
              if (requestCounter == 0) {
                var finalDesc = descriptions.join('\n') + 
                utils.localizedText(webot, 
                {
                  'en_us' : '\nWant Calendar View: Click "Read All" below',
                  'zh_cn' : '\n想查看完整日历，点击下面的“阅读全文”'
                });
                var url = 'http://www.uwexam.com';
                var reply = {
                title: titles.join('\n\n'),
                description: finalDesc,
                url: url
                };
                next(null, reply);
              };
            };
          });
        })(i);

      };
    }
  });

  webot.set('exam schedule', {
    description: 'Use \'exam\' command to get the final exam schedule of a course',
    pattern: /^(exam)$/i,
    handler: function(info) {
      info.wait('wait_course');
      return utils.localizedText(webot, 
        {
          'en_us' : 'Please enter your courses, e.g. cs116 math115 econ101',
          'zh_cn' : '请输入你的Courses, 比如 cs116 math115 econ101：'
        }
      );
    }
  });
};