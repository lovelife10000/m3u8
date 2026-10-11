const processM3u8Files = require('./tool/processM3u8Files');
require('dotenv').config();

async function initApp() {

	try {

		processM3u8Files().then(() => {
			console.log('🎉 所有目录扫描处理完毕！');
		});

	} catch (e) {
		console.log('catch in app.js error', e);
		// await saveTask(e);

		// 正常退出，状态变为 stopped
		// process.exit(0);

		// 异常退出，状态变为 errored（如果开启了自动重启，PM2 会尝试拉起它）
		process.exit(1);
	}

}

initApp();