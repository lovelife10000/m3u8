const fs = require('fs');
const path = require('path');

// 配置 videos 根目录
const dirPath = '/Volumes/macpan/get_m3u8/videos2';

async function ss() {
	try {
		const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

		// 用于记录当前目录下的子文件夹
		const subDirs = [];
		let hasTxt = false;
		let hasM3u8 = false;

		// 1. 检查当前目录是否包含目标文件，并收集子文件夹
		for (const entry of entries) {
			if (entry.isDirectory()) {
				subDirs.push(path.join(dirPath, entry.name));
			} else if (entry.name === '_index.txt') {
				hasTxt = true;
			} else if (entry.name === '_index.m3u8') {
				hasM3u8 = true;
			}
		}

		// 2. 如果当前目录同时包含这两个文件，则进行处理
		if (hasTxt && hasM3u8) {
			const txtFilePath = path.join(dirPath, '_index.txt');
			const m3u8FilePath = path.join(dirPath, '_index.m3u8');
			const outputFilePath = path.join(dirPath, 'index.my.m3u8');

			// 读取文件内容
			const txtContent = await fs.promises.readFile(txtFilePath, 'utf8');
			const m3u8Content = await fs.promises.readFile(m3u8FilePath, 'utf8');

			// 将第二行替换为 txt 的内容
			const lines = m3u8Content.split(/\r?\n/);
			if (lines.length >= 2) {
				lines[1] = txtContent.trim();
				const newContent = lines.join('\n');

				// 写入新文件
				await fs.promises.writeFile(outputFilePath, newContent, 'utf8');
				console.log(`✅ 成功生成: ${outputFilePath}`);
			} else {
				console.log(`⚠️ 跳过处理: ${m3u8FilePath} (行数不足)`);
			}
		}

		// 3. 递归遍历当前目录下的所有子文件夹
		for (const subDir of subDirs) {
			await ss(subDir);
		}

	} catch (err) {
		console.error(`❌ 读取目录失败: ${dirPath}`, err.message);
	}
}

module.exports = ss;