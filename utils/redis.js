module.exports = function() {


	var _initialize = function() {

		// fine for both Dev and Prod stage
		if (process.env.REDISTOGO_URL) {
		    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
			var redis = require("redis").createClient(rtg.port, rtg.hostname);
			redis.auth(rtg.auth.split(":")[1]);
		} else {
		    var redis = require("redis").createClient();
		}
		return redis;
	};

	return {
		initialize: _initialize
	};
}()