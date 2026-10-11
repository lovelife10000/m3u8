const fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');

// m3u8 文件夹（ss 拷贝产物所在目录），按需自己改
const M3U8_ROOT = path.join(__dirname, '../../m3u8');

// FTP 配置：从 .env 读取（.env 放在运行命令的目录下）
const FTP_CONFIG = {
	host: process.env.FTP_HOST,
	port: Number(process.env.FTP_PORT) || 21,
	user: process.env.FTP_USER,
	password: process.env.FTP_PASSWORD,
	secure: process.env.FTP_SECURE === 'true' // 是否 FTPS，默认 false
};
console.log('process.env', process.env.FTP_HOST);

// 空间目录：FTP 登录后要把 m3u8 文件夹放进去的目录（常见 /htdocs、/wwwroot、/web）
const FTP_REMOTE_ROOT = process.env.FTP_REMOTE_ROOT || '/htdocs';

// 将 m3u8 文件夹整体上传到虚拟主机空间目录（保持 m3u8/<md5>/<集数>/ 结构）
async function ss() {

	if (!FTP_CONFIG.host || !FTP_CONFIG.user || !FTP_CONFIG.password) {
		console.error('[错误] FTP 配置不完整，请检查运行目录下的 .env 文件（FTP_HOST / FTP_USER / FTP_PASSWORD）');
		return;
	}

	if (!fs.existsSync(M3U8_ROOT)) {
		console.error('[错误] m3u8 目录不存在: ' + M3U8_ROOT);
		return;
	}

	const client = new ftp.Client();
	// client.ftp.verbose = true; // 需要调试时取消注释

	try {
		await client.access({
			host: FTP_CONFIG.host,
			port: FTP_CONFIG.port,
			user: FTP_CONFIG.user,
			password: FTP_CONFIG.password,
			secure: FTP_CONFIG.secure
		});
		console.log('[FTP] 已连接 ' + FTP_CONFIG.host);

		// 远程基础目录：空间目录/m3u8
		const remoteBase = path.posix.join(FTP_REMOTE_ROOT, 'm3u8');

		// 非递归（栈 + while 循环）遍历本地 m3u8 目录
		const stack = [M3U8_ROOT];
		let uploaded = 0;

		while (stack.length > 0) {
			const currentDir = stack.pop();
			const entries = fs.readdirSync(currentDir, {withFileTypes: true});

			const subDirs = [];
			for (const entry of entries) {
				if (entry.isDirectory()) {
					subDirs.push(path.join(currentDir, entry.name));
				}
			}

			for (const entry of entries) {
				if (!entry.isFile()) continue;

				const localPath = path.join(currentDir, entry.name);
				// 相对 M3U8_ROOT 的路径，转成 FTP 的 / 分隔
				const rel = path.relative(M3U8_ROOT, localPath).split(path.sep).join('/');
				const remotePath = path.posix.join(remoteBase, rel);

				await client.ensureDir(path.posix.dirname(remotePath));
				await client.uploadFrom(localPath, remotePath);

				uploaded++;
				console.log('[上传] ' + localPath + ' -> ' + remotePath);
			}

			for (const sub of subDirs) {
				stack.push(sub);
			}
		}

		console.log('上传完成，共 ' + uploaded + ' 个文件');
	} catch (err) {
		console.error('[错误] FTP 上传失败: ' + err.message);
	} finally {
		client.close();
	}
}

module.exports = ss;
