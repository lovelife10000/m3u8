const fs = require('fs');
const path = require('path');

// 配置根目录
const rootDir = path.join(__dirname, 'videos', '目录1');

// 主处理函数
async function ss() {

	// 1. 读取 "目录1" 下的所有子文件夹（即 "目录2"）
	const dir2Entries = await fs.promises.readdir(rootDir, {withFileTypes: true});
	const dir2Paths = dir2Entries
		.filter(entry => entry.isDirectory())
		.map(entry => path.join(rootDir, entry.name));

	// 2. 遍历每个 "目录2"
	for (const dir2Path of dir2Paths) {
		const txtFilePath = path.join(dir2Path, '_index.txt');
		const m3u8FilePath = path.join(dir2Path, '_index.m3u8');
		const outputFilePath = path.join(dir2Path, 'index.my.m3u8');

		// 检查必要的文件是否存在
		if (!fs.existsSync(txtFilePath) || !fs.existsSync(m3u8FilePath)) {
			console.log(`跳过目录: ${dir2Path} (缺少 _index.txt 或 _index.m3u8)`);
			continue;
		}

		// 3. 读取文件内容
		const txtContent = await fs.promises.readFile(txtFilePath, 'utf8');
		const m3u8Content = await fs.promises.readFile(m3u8FilePath, 'utf8');

		// 4. 内容重组：将第二行替换为 _index.txt 的内容
		// 使用正则分割以兼容 Windows (\r\n) 和 Linux/Mac (\n) 的换行符
		const lines = m3u8Content.split(/\r?\n/);

		// 确保文件至少有2行，防止越界报错
		if (lines.length >= 2) {
			lines[1] = txtContent.trim(); // 替换第二行（索引为1），并去除txt内容可能带来的多余换行
		} else {
			console.log(`跳过目录: ${dir2Path} (_index.m3u8 行数不足)`);
			continue;
		}

		const newContent = lines.join('\n');

		// 5. 写入新文件 index.my.m3u8
		await fs.promises.writeFile(outputFilePath, newContent, 'utf8');
		console.log(`成功生成: ${outputFilePath}`);
	}

}

module.exports = ss;