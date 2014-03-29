var PI = Math.PI;

exports.isEmptyObject = function (obj) {
	return !Object.keys(obj).length;
};

exports.localizedText = function (webot, keyValuePair) {
	if (webot.config.lang === 'zh_cn') {
	 	return keyValuePair.zh_cn;
	} else if (webot.config.lang === 'en_us') {
		return keyValuePair.en_us;
	} else {
		return keyValuePair.en_us; //default fallback
	}
}