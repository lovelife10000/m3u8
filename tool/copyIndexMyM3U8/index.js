const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 视频根目录：index.my.m3u8 所在树（videos/目录1/目录2/index.my.m3u8），按需自己改
// const VIDEOS_ROOT = path.join(__dirname, 'videos');
const VIDEOS_ROOT = '/Volumes/macpan/get_m3u8/videos2';
// m3u8 拷贝输出根目录：按需自己改
const M3U8_ROOT = path.join(__dirname, '../../m3u8');

async function ss() {
	// 目录2 名称格式化：仅去掉第一个字"第"和最后一个字"集"，再去掉前导 0（第01集 -> 1，第10集 -> 10，第001集 -> 1）
	function formatEpisode(name) {
		let s = name;
		// 第 是第一个字才去掉
		if (s.startsWith('第')) s = s.slice(1);
		// 集 是最后一个字才去掉
		if (s.endsWith('集')) s = s.slice(0, -1);
		// 去掉前导 0
		s = s.replace(/^0+/, '');
		return s === '' ? name : s;
	}

	// 目录1 名称 -> md5
	function md5(str) {
		return crypto.createHash('md5').update(str, 'utf8').digest('hex');
	}

	// 遍历 videos 下的 目录1（非递归，循环遍历）
	const level1 = fs.readdirSync(VIDEOS_ROOT, { withFileTypes: true });

	for (const d1 of level1) {
		if (!d1.isDirectory()) continue;
		const dir1Path = path.join(VIDEOS_ROOT, d1.name);

		// 遍历每个 目录1 下的 目录2
		const level2 = fs.readdirSync(dir1Path, { withFileTypes: true });
		for (const d2 of level2) {
			if (!d2.isDirectory()) continue;

			const srcFile = path.join(dir1Path, d2.name, 'index.my.m3u8');
			if (!fs.existsSync(srcFile)) continue;

			// 目标：m3u8/<md5(目录1)>/<集数>/index.my.m3u8
			const targetDir = path.join(M3U8_ROOT, md5(d1.name), formatEpisode(d2.name));
			fs.mkdirSync(targetDir, { recursive: true });

			const targetFile = path.join(targetDir, 'index.my.m3u8');
			fs.copyFileSync(srcFile, targetFile);
			console.log('[拷贝] ' + srcFile + ' -> ' + targetFile);
		}
	}
}

module.exports = ss;
