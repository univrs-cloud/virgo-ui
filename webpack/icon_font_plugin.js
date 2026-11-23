const fs = require('fs');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');
const webpack = require('webpack');
const subsetFont = require('subset-font');

const sourcePath = path.resolve(__dirname, '../src');
const scssPath = path.join(sourcePath, 'assets/scss/webfonts');
const variables = path.join(scssPath, '_variables.scss');
const fontPath = path.resolve(__dirname, '../node_modules/lucide-static');
const scheme = 'lucide';
const outputPath = 'assets/webfonts';
const prefix = 'icons-';
const unusedTables = ['GSUB'];
const fonts = new Set();
const cache = new Map();

const dropTables = (font, tags) => {
	const tables = Array.from({ length: font.readUInt16BE(4) }, (_, index) => {
		const entry = 12 + index * 16;
		return { tag: font.toString('latin1', entry, entry + 4), checksum: font.readUInt32BE(entry + 4), start: font.readUInt32BE(entry + 8), length: font.readUInt32BE(entry + 12) };
	}).filter(({ tag }) => { return !tags.includes(tag); });
	const power = 2 ** Math.floor(Math.log2(tables.length));
	const header = Buffer.alloc(12 + tables.length * 16);
	font.copy(header, 0, 0, 4);
	header.writeUInt16BE(tables.length, 4);
	header.writeUInt16BE(power * 16, 6);
	header.writeUInt16BE(Math.log2(power), 8);
	header.writeUInt16BE((tables.length - power) * 16, 10);
	let position = header.length;
	const data = tables.map(({ tag, checksum, start, length }, index) => {
		const entry = 12 + index * 16;
		const padding = (4 - (length % 4)) % 4;
		header.write(tag, entry, 'latin1');
		header.writeUInt32BE(checksum, entry + 4);
		header.writeUInt32BE(position, entry + 8);
		header.writeUInt32BE(length, entry + 12);
		position += length + padding;
		return Buffer.concat([font.subarray(start, start + length), Buffer.alloc(padding)]);
	});
	return Buffer.concat([header, ...data]);
};

const listSourceFiles = (directory) => {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			return (entryPath === scssPath ? [] : listSourceFiles(entryPath));
		}

		return (/\.(html|js|scss)$/.test(entry.name) ? [entryPath] : []);
	});
};

const readQuoted = (expression) => {
	return Array.from(expression.matchAll(/['"`]([a-z0-9-]+)['"`]/g), ([, value]) => { return value; });
};

const resolveExpression = (expression, source) => {
	const literals = readQuoted(expression);
	if (literals.length > 0) {
		return literals;
	}

	const [identifier] = expression.trim().match(/[A-Za-z_$][\w$]*$/) || [];
	if (!identifier) {
		return [];
	}

	return Array.from(source.matchAll(new RegExp(`(?<![\\w$])${identifier}\\s*[:=](?!=)\\s*([^,;}\\n]*)`, 'g')), ([, value]) => { return readQuoted(value); }).flat();
};

const readCodepoints = () => {
	return new Map(Object.entries(JSON.parse(fs.readFileSync(path.join(fontPath, 'font/codepoints.json'), 'utf8'))));
};

const readUsedIcons = () => {
	const codepoints = readCodepoints();
	const files = listSourceFiles(sourcePath).map((file) => { return { file, content: fs.readFileSync(file, 'utf8') }; });
	const source = files.map(({ content }) => { return content; }).join('\n');
	const used = new Set();
	const unresolved = [];
	files.forEach(({ file, content }) => {
		for (const { index } of content.matchAll(/(?<![\w-])icon-/g)) {
			const rest = content.slice(index + 'icon-'.length);
			const [literal] = rest.match(/^[a-z0-9-]*/);
			const [, template, lodash] = rest.slice(literal.length).match(/^(?:\$\{([^}]*)\}|<%[=-]([\s\S]*?)%>)/) || [];
			const expression = template ?? lodash;
			if (expression === undefined) {
				if (literal) {
					used.add(literal);
				} else {
					unresolved.push(`${path.relative(sourcePath, file)}:${content.slice(0, index).split('\n').length}`);
				}
				continue;
			}

			const values = resolveExpression(expression, source);
			if (values.length === 0) {
				unresolved.push(`${path.relative(sourcePath, file)}:${content.slice(0, index).split('\n').length}`);
			}
			values.forEach((value) => { used.add(`${literal}${value.replace(/^icon-/, '')}`); });
		}
	});
	const names = Array.from(used).sort().filter((name) => { return codepoints.has(name); });
	return {
		icons: new Map(names.map((name) => { return [name, codepoints.get(name)]; })),
		unresolved
	};
};

const writeMap = (icons) => {
	return Array.from(icons, ([name, codepoint]) => { return `\n\t"${name}": \\${codepoint.toString(16)},`; }).join('');
};

const fillIcons = (content) => {
	const { icons } = readUsedIcons();
	return content.replace(/^\$icons: \(\);$/m, `$icons: (${writeMap(icons)}\n);`);
};

const resolveScss = (file) => {
	return [file, path.join(path.dirname(file), `_${path.basename(file)}.scss`), `${file}.scss`].find((candidate) => { return /\.scss$/.test(candidate) && fs.existsSync(candidate); });
};

class IconFontPlugin {
	static sassOptions(loaderContext) {
		return {
			importers: [{
				canonicalize(url) {
					const target = (url.startsWith(`${scheme}:`) ? path.join(scssPath, new URL(url).pathname) : (url.startsWith('file:') ? fileURLToPath(url) : null));
					if (!target?.startsWith(`${scssPath}${path.sep}`)) {
						return null;
					}

					const file = resolveScss(target);
					return (file ? pathToFileURL(file) : null);
				},
				load(canonicalUrl) {
					const file = fileURLToPath(canonicalUrl);
					loaderContext.addDependency(file);
					const content = fs.readFileSync(file, 'utf8');
					for (const [, font] of content.matchAll(/url\(['"]#\{v\.\$font-path\}\/([^'"]+)['"]\)/g)) {
						fonts.add(font);
					}
					if (file !== variables) {
						return { contents: content, syntax: 'scss' };
					}

					loaderContext.addContextDependency(sourcePath);
					return { contents: fillIcons(content), syntax: 'scss' };
				}
			}]
		};
	}

	apply(compiler) {
		compiler.hooks.thisCompilation.tap('IconFontPlugin', (compilation) => {
			compilation.hooks.processAssets.tapPromise({ name: 'IconFontPlugin', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, async () => {
				compilation.contextDependencies.add(sourcePath);
				const { icons, unresolved } = readUsedIcons();
				unresolved.forEach((location) => { compilation.warnings.push(new webpack.WebpackError(`IconFontPlugin: cannot work out the icon name at src/${location}`)); });
				const text = String.fromCodePoint(...icons.values());
				const { hashFunction, hashDigest, hashDigestLength } = compilation.outputOptions;
				const renames = await Promise.all(Array.from(fonts).map(async (file) => {
					const key = `${file}:${text}`;
					if (!cache.has(key)) {
						const buffer = await subsetFont(dropTables(fs.readFileSync(path.join(fontPath, file)), unusedTables), text, { targetFormat: 'woff2' });
						const hash = webpack.util.createHash(hashFunction).update(buffer).digest(hashDigest).slice(0, hashDigestLength);
						cache.set(key, { buffer, name: `${prefix}${path.dirname(file)}.${hash}.woff2` });
					}
					const { buffer, name } = cache.get(key);
					compilation.emitAsset(`${outputPath}/${name}`, new webpack.sources.RawSource(buffer));
					return { from: `/${file}`, to: `/${name}` };
				}));
				compilation.getAssets().filter(({ name }) => { return /\.(css|js)$/.test(name); }).forEach(({ name, source }) => {
					const content = source.source().toString();
					const replaced = new webpack.sources.ReplaceSource(source);
					let changed = false;
					renames.forEach(({ from, to }) => {
						for (let index = content.indexOf(from); index !== -1; index = content.indexOf(from, index + from.length)) {
							replaced.replace(index, index + from.length - 1, to);
							changed = true;
						}
					});
					if (changed) {
						compilation.updateAsset(name, replaced);
					}
				});
			});
		});
	}
}

module.exports = IconFontPlugin;
