const processM3u8Files = require('./tool/processM3u8Files');
const copyIndexMyM3U8 = require('./tool/copyIndexMyM3U8');
require('dotenv').config();

async function initApp() {

	try {

		// await processM3u8Files();
		await copyIndexMyM3U8();

	} catch (e) {
		console.log('catch in app.js error', e);
		process.exit(1);
	}

}

initApp();