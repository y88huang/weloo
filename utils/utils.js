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

exports.dynamicReplyArray = ["难道你就不想试试看","奉天承运，皇帝诏曰，今天就吃","今天你必须吃","屁话少说，先来一发"
							  ,"我猜你就想吃"];
