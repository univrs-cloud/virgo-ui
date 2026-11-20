const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

const distPath = path.resolve(__dirname, '..', 'dist');
const listPath = path.join(distPath, 'release.json');
const signaturePath = path.join(distPath, 'release.sig');

const listFiles = (folder) => {
	return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
		const filePath = path.join(folder, entry.name);
		return (entry.isDirectory() ? listFiles(filePath) : [filePath]);
	});
};

fs.rmSync(listPath, { force: true });
fs.rmSync(signaturePath, { force: true });

const files = {};
for (const filePath of listFiles(distPath).sort()) {
	const name = path.relative(distPath, filePath).split(path.sep).join('/');
	files[name] = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const release = Buffer.from(JSON.stringify({ version, files }));
fs.writeFileSync(listPath, release);

const signingKey = process.env.RELEASE_SIGNING_KEY;
if (!signingKey) {
	console.warn('RELEASE_SIGNING_KEY is not set, release.json is unsigned and fleet will not open this build.');
	process.exit(0);
}

fs.writeFileSync(signaturePath, crypto.sign(null, release, crypto.createPrivateKey(signingKey)).toString('base64'));
