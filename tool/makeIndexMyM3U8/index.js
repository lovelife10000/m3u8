const fs = require('fs');
const path = require('path');

const rootDir = '/Volumes/macpan/get_m3u8/videos2';

async function ss() {

	if (!fs.existsSync(rootDir)) {
		console.error('[错误] 根目录不存在: ' + rootDir);
		process.exit(1);
	}

// 显式栈 + while 循环做深度遍历，不用递归
	const stack = [rootDir];
	let processed = 0;

	while (stack.length > 0) {
		const currentDir = stack.pop();

		let entries;
		try {
			entries = fs.readdirSync(currentDir, {withFileTypes: true});
		} catch (e) {
			console.error('[跳过] 无法读取目录 ' + currentDir + ': ' + e.message);
			continue;
		}

		// 先收集子目录，入栈，下一轮循环继续遍历
		const subDirs = [];
		for (const entry of entries) {
			if (entry.isDirectory()) {
				subDirs.push(path.join(currentDir, entry.name));
			}
		}

		// 处理当前目录中的 *_index.m3u8 文件
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (!entry.name.endsWith('_index.m3u8')) continue;

			const m3u8Path = path.join(currentDir, entry.name);

			// 根据 m3u8 的前缀找对应的 _mixed.txt（如 123_index.m3u8 <-> 123_mixed.txt）
			const base = entry.name.slice(0, -'_index.m3u8'.length);
			const txtPath = path.join(currentDir, base + '_mixed.txt');

			if (!fs.existsSync(txtPath)) {
				console.log('[跳过] 缺少对应的 _mixed.txt: ' + m3u8Path);
				continue;
			}

			// 分别读取两个文件的内容
			const m3u8Text = fs.readFileSync(m3u8Path, 'utf8');
			const txtText = fs.readFileSync(txtPath, 'utf8');

			// 按行拆分（先去掉末尾换行，兼容 \r\n 与 \n），txt 内容去掉末尾多余换行
			const lines = m3u8Text.replace(/\r?\n$/, '').split(/\r?\n/);
			const txtContent = txtText.replace(/\r?\n$/, '');

			// 把最后一行替换为 txt 内容
			lines[lines.length - 1] = txtContent;

			// 组成新内容，写入同级 index.my.m3u8（不改动原文件）
			const newContent = lines.join('\n') + '\n';
			const outPath = path.join(currentDir, 'index.my.m3u8');
			fs.writeFileSync(outPath, newContent, 'utf8');

			processed++;
			console.log('[生成] ' + outPath);
		}

		// 子目录入栈继续循环遍历（深度不限，videos 下多级目录都能覆盖）
		for (const sub of subDirs) {
			stack.push(sub);
		}
	}

	console.log('完成，共生成 ' + processed + ' 个 index.my.m3u8');

}

module.exports = ss;