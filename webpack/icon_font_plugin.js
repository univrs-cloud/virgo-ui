const fs = require('fs');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');
const webpack = require('webpack');
const subsetFont = require('subset-font');

const sourcePath = path.resolve(__dirname, '../src');
const scssPath = path.join(sourcePath, 'assets/scss/webfonts');
const variables = path.join(scssPath, '_variables.scss');
const fontPath = path.join(sourcePath, 'assets/webfonts');
const scheme = 'fontawesome';
const outputPath = 'assets/webfonts';
const prefix = 'icons-';
const fonts = new Set();
const cache = new Map();

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

const readUsedIcons = () => {
	const codepoints = new Map(Array.from(fs.readFileSync(variables, 'utf8').matchAll(/^\$var-([a-z0-9-]+):\s*\\([0-9a-f]+);/gm), ([, name, hex]) => { return [name, parseInt(hex, 16)]; }));
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
	return {
		icons: new Map(Array.from(used).sort().filter((name) => { return codepoints.has(name); }).map((name) => { return [name, codepoints.get(name)]; })),
		unresolved
	};
};

const filterIcons = (content) => {
	const { icons: used } = readUsedIcons();
	return content.replace(/^(\$(?:icons|brand-icons):\s*\()([\s\S]*?)(^\);)/gm, (match, start, entries, end) => {
		return start + entries.split('\n').filter((line) => {
			const [, name] = line.match(/^\s*"([^"]+)":/) || [];
			return !name || used.has(name);
		}).join('\n') + end;
	});
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
					return { contents: filterIcons(content), syntax: 'scss' };
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
						const buffer = await subsetFont(fs.readFileSync(path.join(fontPath, file)), text, { targetFormat: 'woff2' });
						const hash = webpack.util.createHash(hashFunction).update(buffer).digest(hashDigest).slice(0, hashDigestLength);
						cache.set(key, { buffer, name: `${prefix}${path.basename(file, '.woff2').replace(/^[^-]+-/, '')}.${hash}.woff2` });
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
