require('dotenv').config();

const makeIndexMyM3U8 = require('./tool/makeIndexMyM3U8');
const copyIndexMyM3U8 = require('./tool/copyIndexMyM3U8');
const uploadToFTP = require('./tool/uploadToFTP');

async function initApp() {

	try {

		// await makeIndexMyM3U8();
		// await copyIndexMyM3U8();
		await uploadToFTP();

	} catch (e) {
		console.log('catch in app.js error', e);
		process.exit(1);
	}

}

initApp();