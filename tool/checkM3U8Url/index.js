const fs = require('fs');
const path = require('path');

// m3u8 文件夹（ss 拷贝产物所在目录），按需自己改
const M3U8_ROOT = path.join(__dirname, '../../m3u8');

/**
 * 递归遍历目录，找到所有 index.my.m3u8 文件
 */
function findM3u8Files(dir, results = []) {
	const items = fs.readdirSync(dir, {withFileTypes: true});
	for (const item of items) {
		const fullPath = path.join(dir, item.name);
		if (item.isDirectory()) {
			findM3u8Files(fullPath, results);
		} else if (item.name === 'index.my.m3u8') {
			results.push(fullPath);
		}
	}
	return results;
}

/**
 * 检测 URL 是否可访问（返回 { statusCode, statusText, elapsed, valid }）
 */
function checkUrl(url) {
	return new Promise((resolve) => {
		const startTime = Date.now();
		const parsedUrl = new URL(url);
		const client = parsedUrl.protocol === 'https:' ? require('https') : require('http');

		const req = client.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, (res) => {
			// 只读取头部，不读 body
			res.resume();
			const elapsed = Date.now() - startTime;
			resolve({
				statusCode: res.statusCode,
				statusText: res.statusMessage || '',
				elapsed,
				valid: res.statusCode >= 200 && res.statusCode < 400,
			});
		});

		req.on('error', (err) => {
			const elapsed = Date.now() - startTime;
			resolve({
				statusCode: 0,
				statusText: err.code || err.message,
				elapsed,
				valid: false,
			});
		});

		// 5秒超时
		req.setTimeout(5000, () => {
			req.destroy();
			resolve({
				statusCode: 0,
				statusText: 'Timeout',
				elapsed: Date.now() - startTime,
				valid: false,
			});
		});
	});
}

/**
 * 读取文件最后一行非空内容
 */
function getLastLine(filePath) {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
	return lines.length > 0 ? lines[lines.length - 1].trim() : '';
}

async function ss() {
	console.log('=== m3u8 链接检测工具 ===');
	console.log(`扫描目录: ${M3U8_ROOT}\n`);

	// 检查目录是否存在
	if (!fs.existsSync(M3U8_ROOT)) {
		console.error(`错误: 目录不存在 -> ${M3U8_ROOT}`);
		console.log('请修改 M3U8_ROOT 变量指向正确的目录');
		return;
	}

	// 查找所有 index.my.m3u8
	const files = findM3u8Files(M3U8_ROOT);
	console.log(`共找到 ${files.length} 个 index.my.m3u8 文件\n`);
	if (files.length === 0) {
		console.log('未找到任何 index.my.m3u8 文件，请检查目录结构。');
		return;
	}

	// 逐个检测
	let successCount = 0;
	let failCount = 0;

	for (const filePath of files) {
		const lastLine = getLastLine(filePath);
		console.log(`----------------------------------------`);
		console.log(`文件路径: ${filePath}`);
		console.log(`最后一行URL: ${lastLine}`);

		if (!lastLine || !lastLine.startsWith('http')) {
			console.log(`检测结果: [非URL格式，跳过检测]`);
			continue;
		}

		const result = await checkUrl(lastLine);
		console.log(`检测结果: ${result.valid ? '[可访问]' : '[失效]'}`);
		console.log(`状态码: ${result.statusCode} ${result.statusText}  耗时: ${result.elapsed}ms`);

		if (result.valid) {
			successCount++;
		} else {
			failCount++;
		}
	}

	// 汇总
	console.log(`\n=== 检测汇总 ===`);
	console.log(`总计: ${files.length} 个文件`);
	console.log(`可访问: ${successCount} 个`);
	console.log(`失效: ${failCount} 个`);
}

module.exports = ss;