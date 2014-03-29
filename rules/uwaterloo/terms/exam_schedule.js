var httpsync = require('httpsync');

module.exports = function(webot) {
  // Exam Command Rule
  webot.waitRule('wait_course', function(info) {
    try {
      var subject = info.text.match(/\D+/)[0];
      var catalogNum = info.text.match(/\d+/)[0];  
    } catch(err) {
      return null;
    }
    var url = 'http://api.uwaterloo.ca/v2/courses/'+subject+'/'+catalogNum+'/examschedule.json?key=3b959fae56b87fa8e0c5d416525d3b4e';
    req = httpsync.get(url);
    var res = req.end();
    var data = JSON.parse(res['data'].toString('utf-8'));
    if (data['meta']['message'] == 'No data returned') {
      info.rewait();
      return 'Oops! No match!\nPlease try again.';
    }
    else {
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
      return reply;
    }
  });

  webot.set('exam schedule', {
    description: 'Use \'exam\' command to get the final exam schedule of a course',
    pattern: /^(exam)$/i,
    handler: function(info) {
      info.wait('wait_course');
      if (webot.config.lang === 'en_us') {
      	return 'Please enter your course subject and number. (e.g. CS486)';
  	  } else {
  	  	return "请输入你的Course Number, 比如 cs116：";
  	  }
    }
  });
};