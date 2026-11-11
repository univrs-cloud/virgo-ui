const fs = require('fs');
const path = require('path');

const S = 8;
const C = 0.8660254;
const OX = 160;
const OY = 132;

const r = (n) => Math.round(n * 10) / 10;
let K = 1;
const P = (x, y, z) => [OX + (x - y) * C * S * K, OY + ((x + y) * 0.5 * S - z * S) * K];
const pts = (list) => list.map((p) => P(...p).map(r).join(',')).join(' ');
const poly = (cls, list, extra = '') => `<polygon class="${cls}" points="${pts(list)}"${extra}/>`;
const vec = (dx, dy, dz) => { const a = P(0, 0, 0); const b = P(dx, dy, dz); return [r(b[0] - a[0]), r(b[1] - a[1])]; };

const faces = (x, y, z, w, d, h) => ({
	top: [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]],
	left: [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]],
	right: [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]
});

const box = (x, y, z, w, d, h, kind = '', topKind) => {
	const f = faces(x, y, z, w, d, h);
	const k = kind;
	const tk = (topKind === undefined ? k : topKind);
	return poly(`es-${tk}t`, f.top) + poly(`es-${k}l`, f.left) + poly(`es-${k}r`, f.right);
};

const ghost = (x, y, z, w, d, h, cls = 'es-g') => {
	const outline = [[x, y, z + h], [x + w, y, z + h], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y + d, z + h]];
	const inner = [[x, y + d, z + h], [x + w, y + d, z + h], [x + w, y, z + h]];
	const down = [[x + w, y + d, z + h], [x + w, y + d, z]];
	return `<g class="${cls}">${poly('', outline)}<polyline points="${pts(inner)}"/><polyline points="${pts(down)}"/></g>`;
};

const diamond = (x, y, z, w, d, cls, extra = '') => poly(cls, [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], extra);

const ellipse = (cx, cy, z, radius, cls, extra = '') => {
	const [X, Y] = P(cx, cy, z);
	return `<ellipse class="${cls}" cx="${r(X)}" cy="${r(Y)}" rx="${r(Math.SQRT2 * radius * C * S * K)}" ry="${r(Math.SQRT2 * 0.5 * radius * S * K)}"${extra}/>`;
};

const line = (cls, a, b, extra = '') => {
	const [x1, y1] = P(...a).map(r);
	const [x2, y2] = P(...b).map(r);
	return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${extra}/>`;
};

const pathOn = (cls, list, close = false) => `<path class="${cls}" d="M${list.map((p) => P(...p).map(r).join(' ')).join(' L')}${close ? ' Z' : ''}"/>`;

const platform = (grid = true) => {
	const scale = K;
	K = 1;
	const rad = 1.4;
	const outline = [];
	for (const [cx, cy, start] of [[8 - rad, 8 - rad, 0], [-8 + rad, 8 - rad, 90], [-8 + rad, -8 + rad, 180], [8 - rad, -8 + rad, 270]]) {
		for (let k = 0; k <= 6; k++) {
			const a = (start + k * 15) * Math.PI / 180;
			outline.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 0]);
		}
	}
	let out = poly('es-pt', outline);
	if (grid) {
		for (let i = -6; i <= 6; i += 2) {
			out += line('es-grid', [i, -8, 0], [i, 8, 0]) + line('es-grid', [-8, i, 0], [8, i, 0]);
		}
	}
	K = scale;
	return out;
};

const shared = `
.es-pt,.es-t,.es-l,.es-r,.es-at,.es-al,.es-ar,.es-dt,.es-dl,.es-dr{stroke-width:1;stroke-linejoin:round}
.es-pt{fill:light-dark(#f6f8fb,#1c1d20);stroke:light-dark(#dfe5ee,#2e2f34)}
.es-t{fill:light-dark(#ffffff,#3c3d43)}
.es-l{fill:light-dark(#eef1f6,#2e2f34)}
.es-r{fill:light-dark(#dbe1ea,#242529)}
.es-t,.es-l,.es-r{stroke:light-dark(#c7cfdb,#4b4c53)}
.es-ib{fill:#658ffc}
.es-ig{fill:#2fb67c}
.es-io{fill:#f5a524}
.es-ip{fill:#a77bf3}
.es-wt{fill:#ffffff}
.es-wl{fill:#f1f3f7}
.es-wr{fill:#dfe4ec}
.es-wt,.es-wl,.es-wr{stroke:#c7cfdb;stroke-width:1;stroke-linejoin:round}
.es-lnw{fill:none;stroke:#c7cfdb;stroke-width:2;stroke-linecap:round}
.es-at{fill:light-dark(#adc2fe,#8eaafc)}
.es-al{fill:#658ffc}
.es-ar{fill:light-dark(#4870e0,#4566c8)}
.es-at,.es-al,.es-ar{stroke:light-dark(#3a60cc,#a9bffe)}
.es-dt,.es-dl,.es-dr{stroke:light-dark(#b4bdcc,#0d0d0f)}
.es-dt{fill:light-dark(#cdd4df,#18191b)}
.es-dl{fill:light-dark(#c3cbd8,#141517)}
.es-dr{fill:light-dark(#b8c1cf,#101113)}
.es-g{fill:light-dark(rgba(101,143,252,.06),rgba(101,143,252,.07));stroke:light-dark(#90a9ee,#5b79cc);stroke-width:1.2;stroke-dasharray:4 3;stroke-linejoin:round}
.es-g polyline{fill:none}
.es-grid{stroke:light-dark(#e8ecf3,#26272b);stroke-width:1}
.es-sh{fill:light-dark(rgba(30,45,80,.09),rgba(0,0,0,.45))}
.es-ln{fill:none;stroke:light-dark(#c7cfdb,#4b4c53);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.es-lnf{fill:light-dark(#c7cfdb,#4b4c53)}
.es-acc{fill:#658ffc}
.es-accs{fill:none;stroke:#658ffc;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.es-path{fill:none;stroke:light-dark(#9fb4ec,#4f6bb8);stroke-width:1.5;stroke-dasharray:4 4;stroke-linecap:round}
.es-ok{fill:#2fb67c}
.es-err{fill:#f0616d}
.es-errs{fill:none;stroke:#f0616d;stroke-width:2;stroke-linecap:round}
.es-w{fill:#ffffff}
.es-ws{fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.es-c{transform-box:fill-box;transform-origin:center}
.es-ns{stroke:none}
.es-thin{stroke-width:1.6}
.es-d1{animation-delay:.6s}
.es-d2{animation-delay:1.2s}
.es-d3{animation-delay:1.5s}
.es-d4{animation-delay:1.8s}
.es-float{animation:es-float 4s ease-in-out infinite}
.es-shadow{animation:es-shadow 4s ease-in-out infinite}
.es-dash{animation:es-dash 1.2s linear infinite}
.es-blink{animation:es-blink 2s ease-in-out infinite}
.es-pulse{animation:es-pulse 3s ease-out infinite}
@keyframes es-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes es-shadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.82);opacity:.55}}
@keyframes es-dash{to{stroke-dashoffset:-16}}
@keyframes es-blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes es-pulse{0%{transform:scale(.55);opacity:.9}100%{transform:scale(1.5);opacity:0}}
`;

const svg = (css, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 20 320 184" fill="none"><style>${(shared + css).replace(/\n/g, '')}</style>${body}</svg>\n`;

const scenes = {};

const roundedY = (y, x0, x1, z0, z1, rad) => {
	const list = [];
	const corners = [[x1 - rad, z1 - rad, 0], [x0 + rad, z1 - rad, 90], [x0 + rad, z0 + rad, 180], [x1 - rad, z0 + rad, 270]];
	for (const [cx, cz, start] of corners) {
		for (let k = 0; k <= 6; k++) {
			const a = (start + k * 15) * Math.PI / 180;
			list.push([cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad]);
		}
	}
	return list;
};

const glyphs = {
	grid: (m, s) => [[0.2, 0.55], [0.55, 0.55], [0.2, 0.2], [0.55, 0.2]].map(([u, v]) => poly('es-w', roundedY(0, u, u + 0.25, v, v + 0.25, 0.06).map(([a, , c]) => m(a, c)))).join(''),
	play: (m) => poly('es-w', [m(0.38, 0.26), m(0.78, 0.5), m(0.38, 0.74)]),
	ring: (m) => `<polyline class="es-ws es-thin" points="${pts(Array.from({ length: 25 }, (_, k) => { const a = k * Math.PI / 12; return m(0.5 + Math.cos(a) * 0.22, 0.5 + Math.sin(a) * 0.22); }))}"/>`,
	bars: (m) => [[0.22, 0.55], [0.44, 0.75], [0.66, 0.62]].map(([u, top]) => poly('es-w', [m(u, 0.25), m(u + 0.12, 0.25), m(u + 0.12, top), m(u, top)])).join('')
};

const appIcon = (x, y, z, s, tone, glyph) => {
	const m = (u, v) => [x + u * s, y, z + v * s];
	return poly(`es-i${tone}`, roundedY(y, x, x + s, z, z + s, s * 0.24)) + glyphs[glyph](m, s);
};

const appSlot = (x, y, z, s) => `<g class="es-g">${poly('', roundedY(y, x, x + s, z, z + s, s * 0.24))}</g>`;

scenes.apps = () => {
	K = 1.05;
	const fy = -1;
	const s = 2;
	const cells = [[-3.4, 3.7], [-1, 3.7], [1.4, 3.7], [-3.4, 1.4], [-1, 1.4], [1.4, 1.4]];
	const fills = [[0, 'b', 'grid'], [1, 'g', 'play'], [2, 'o', 'bars'], [3, 'p', 'ring']];
	const body = platform()
		+ diamond(-4.9, -1.8, 0, 9.8, 6.6, 'es-sh')
		+ box(-4.5, -1.4, 0, 9, 5.8, 0.5, '')
		+ poly('es-dt', [[-3.8, 0.2, 0.5], [3.8, 0.2, 0.5], [3.8, 2.8, 0.5], [-3.8, 2.8, 0.5]])
		+ poly('es-dt', [[-1.3, 3.2, 0.5], [1.3, 3.2, 0.5], [1.3, 4.1, 0.5], [-1.3, 4.1, 0.5]])
		+ box(-4.5, -1.4, 0.5, 9, 0.4, 6.2, '')
		+ poly('es-dl', [[-4, fy, 1], [4, fy, 1], [4, fy, 6.2], [-4, fy, 6.2]])
		+ cells.map(([x, z]) => appSlot(x, fy, z, s)).join('')
		+ fills.map(([i, tone, glyph], k) => `<g class="es-xl es-xl-${k}">${appIcon(cells[i][0], fy, cells[i][1], s, tone, glyph)}</g>`).join('');
	return svg(`.es-xl{opacity:0;animation:es-xl 6s cubic-bezier(.3,0,.2,1) infinite backwards}.es-xl-1{animation-delay:.45s}.es-xl-2{animation-delay:.9s}.es-xl-3{animation-delay:1.35s}@keyframes es-xl{0%{transform:translate(26px,-34px);opacity:0}10%{transform:translate(0,0);opacity:1}82%{transform:translate(0,0);opacity:1}92%,100%{transform:translate(0,0);opacity:0}}`, body);
};

scenes.folders = () => {
	K = 1.2;
	const [mx, my] = vec(6, -6, 0);
	const [fx, fy] = vec(3, -2.9, 0);
	const packet = (cls) => `<g class="es-fo-k ${cls}">${box(-1.3, 1.3, 1.6, 0.9, 0.9, 0.9, 'a')}</g>`;
	const laptop = diamond(-6.4, -0.4, 0, 5.8, 5.2, 'es-sh')
		+ box(-6, 0, 0, 5, 4.4, 0.5, '')
		+ poly('es-dt', [[-5.4, 1.4, 0.5], [-1.6, 1.4, 0.5], [-1.6, 3.6, 0.5], [-5.4, 3.6, 0.5]])
		+ box(-6, 0, 0.5, 5, 0.4, 3.6, '')
		+ poly('es-dl', [[-5.6, 0.4, 0.9], [-1.4, 0.4, 0.9], [-1.4, 0.4, 3.7], [-5.6, 0.4, 3.7]])
		+ poly('es-acc', [[-4.3, 0.4, 1.8], [-2.7, 0.4, 1.8], [-2.7, 0.4, 2.8], [-4.3, 0.4, 2.8]], ' opacity=".55"');
	const link = pathOn('es-path es-dash', [[-0.4, 2, 0], [3, 2, 0], [3, -2.3, 0]]);
	K = 0.5;
	const x0 = -5;
	const x1 = 5;
	const yb = -0.7;
	const yf = 0.6;
	const base = 0.3;
	const back = faces(x0, yb, base, x1 - x0, 0.3, 7 - base);
	const [px, py] = vec(0, 0, 1.5);
	const paper = (x, y, h, cls) => `<g class="es-fo-p ${cls}">${box(x, y, base, 8, 0.1, h, 'w')}${line('es-lnw', [x + 0.8, y + 0.1, base + h - 0.7], [x + 5.2, y + 0.1, base + h - 0.7])}${line('es-lnw', [x + 0.8, y + 0.1, base + h - 1.5], [x + 6.6, y + 0.1, base + h - 1.5])}</g>`;
	const cover = (deg) => {
		const a = deg * Math.PI / 180;
		const h = 5.6;
		const t = 0.3;
		const u = [0, Math.sin(a) * h, Math.cos(a) * h];
		const n = [0, -Math.cos(a) * t, Math.sin(a) * t];
		const at = (x, ...offsets) => offsets.reduce((p, o) => [p[0] + o[0], p[1] + o[1], p[2] + o[2]], [x, yf, 0]);
		return {
			outer: [at(x0), at(x1), at(x1, u), at(x0, u)],
			top: [at(x0, n, u), at(x1, n, u), at(x1, u), at(x0, u)],
			side: [at(x1, n), at(x1), at(x1, u), at(x1, n, u)]
		};
	};
	const angles = [0, 26, 26, 0, 0];
	const frames = angles.map(cover);
	const timing = 'dur="4.4s" repeatCount="indefinite" keyTimes="0;.3;.62;.9;1" calcMode="spline" keySplines=".5 0 .3 1;0 0 1 1;.5 0 .3 1;0 0 1 1"';
	const tilt = (cls, key) => `<polygon class="${cls}" points="${pts(frames[0][key])}"><animate attributeName="points" values="${frames.map((frame) => pts(frame[key])).join(';')}" ${timing}/></polygon>`;
	const folder = diamond(x0 - 0.5, yb - 0.4, 0, x1 - x0 + 1, 5, 'es-sh')
		+ box(x0, yb, 0, x1 - x0, yf - yb, base, 'a')
		+ poly('es-at', back.top) + poly('es-ar', back.left) + poly('es-ar', back.right)
		+ box(x0, yb, 7, 3.6, 0.3, 0.9, 'a')
		+ paper(-4.4, -0.3, 5.2, '')
		+ paper(-3.6, -0.1, 4.6, 'es-fo-1')
		+ paper(-4, 0.1, 4, 'es-fo-2')
		+ tilt('es-ar', 'side') + tilt('es-at', 'top') + tilt('es-al', 'outer');
	const body = platform()
		+ laptop
		+ link
		+ `<g transform="translate(${fx} ${fy})">${folder}</g>`
		+ packet('') + packet('es-d2');
	return svg(`.es-fo-k{opacity:0;animation:es-fo-k 2.4s ease-in-out infinite}@keyframes es-fo-k{0%{transform:translate(0,0);opacity:0}15%{opacity:1}75%{opacity:1}100%{transform:translate(${r(mx * 0.62)}px,${r(my * 0.62)}px);opacity:0}}.es-fo-p{animation:es-fo-p 4.4s cubic-bezier(.5,0,.3,1) infinite}.es-fo-1{animation-delay:.15s}.es-fo-2{animation-delay:.3s}@keyframes es-fo-p{0%,8%{transform:translate(0,0)}35%,60%{transform:translate(${px}px,${py}px)}88%,100%{transform:translate(0,0)}}`, body);
};

scenes['backup-disks'] = () => {
	K = 1.2;
	const [mx, my] = vec(6, -6, 0);
	const packet = (cls) => `<g class="es-bd-k ${cls}">${box(-1.3, 1.3, 1.6, 0.9, 0.9, 0.9, 'a')}</g>`;
	const x0 = 1.4;
	const x1 = 4.6;
	const y0 = -5;
	const y1 = -0.8;
	const h = 0.9;
	const rad = 0.5;
	const outline = [];
	for (const [cx, cy, start] of [[x1 - rad, y1 - rad, 0], [x0 + rad, y1 - rad, 90], [x0 + rad, y0 + rad, 180], [x1 - rad, y0 + rad, 270]]) {
		for (let k = 0; k <= 6; k++) {
			const a = (start + k * 15) * Math.PI / 180;
			outline.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
		}
	}
	const points = outline.flatMap(([x, y]) => [P(x, y, 0), P(x, y, h)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const half = (source) => { const out = []; for (const p of source) { while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) { out.pop(); } out.push(p); } out.pop(); return out; };
	const hull = [...half(points), ...half([...points].reverse())].map((p) => p.map(r).join(',')).join(' ');
	const mid = [(x0 + x1) / 2, (y0 + y1) / 2];
	let sides = '';
	outline.forEach((a, k) => {
		const b = outline[(k + 1) % outline.length];
		let n = [b[1] - a[1], a[0] - b[0]];
		if (n[0] * ((a[0] + b[0]) / 2 - mid[0]) + n[1] * ((a[1] + b[1]) / 2 - mid[1]) < 0) {
			n = [-n[0], -n[1]];
		}
		if (n[0] + n[1] > 0.0001) {
			sides += poly(`${n[1] >= n[0] ? 'es-l' : 'es-r'} es-ns`, [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], h], [a[0], a[1], h]]);
		}
	});
	const disk = `<polygon class="es-r" points="${hull}"/>` + sides
		+ poly('es-t', outline.map(([x, y]) => [x, y, h]))
		+ ellipse(3, -3.1, h, 1.3, 'es-dt')
		+ ellipse(3, -3.1, h, 0.95, 'es-bd-s', ' pathLength="100"')
		+ ellipse(3, -3.1, h, 0.32, 'es-t')
		+ line('es-ln', [4.05, -1.45, h], [3.35, -2.55, h])
		+ ellipse(4.05, -1.45, h, 0.22, 'es-lnf')
		+ `<g class="es-blink">${poly('es-acc', [[3.4, y1, 0.32], [4, y1, 0.32], [4, y1, 0.56], [3.4, y1, 0.56]])}</g>`;
	const body = platform()
		+ diamond(-6.4, -0.4, 0, 5.8, 5.2, 'es-sh')
		+ box(-6, 0, 0, 5, 4.4, 0.5, '')
		+ poly('es-dt', [[-5.4, 1.4, 0.5], [-1.6, 1.4, 0.5], [-1.6, 3.6, 0.5], [-5.4, 3.6, 0.5]])
		+ box(-6, 0, 0.5, 5, 0.4, 3.6, '')
		+ poly('es-dl', [[-5.6, 0.4, 0.9], [-1.4, 0.4, 0.9], [-1.4, 0.4, 3.7], [-5.6, 0.4, 3.7]])
		+ poly('es-acc', [[-4.3, 0.4, 1.8], [-2.7, 0.4, 1.8], [-2.7, 0.4, 2.8], [-4.3, 0.4, 2.8]], ' opacity=".55"')
		+ pathOn('es-path es-dash', [[-0.4, 2, 0], [3, 2, 0], [3, y1, 0]])
		+ diamond(x0 - 0.3, y0 - 0.3, 0, x1 - x0 + 0.6, y1 - y0 + 0.6, 'es-sh')
		+ disk
		+ packet('') + packet('es-d2');
	return svg(`.es-bd-s{fill:none;stroke:#ffffff;stroke-width:1.6;stroke-linecap:round;stroke-dasharray:22 78;opacity:.75;animation:es-bd-s 1.4s linear infinite}@keyframes es-bd-s{to{stroke-dashoffset:-100}}.es-bd-k{opacity:0;animation:es-bd-k 2.4s ease-in-out infinite}@keyframes es-bd-k{0%{transform:translate(0,0);opacity:0}15%{opacity:1}75%{opacity:1}100%{transform:translate(${r(mx * 0.62)}px,${r(my * 0.62)}px);opacity:0}}`, body);
};

scenes.shortcuts = () => {
	const fy = -0.4;
	const on = (x, z) => [x, fy, z];
	const [ax, ay] = vec(1.6, 0, 1.6);
	const body = platform()
		+ diamond(-5.4, -1.4, 0, 10.8, 2.4, 'es-sh')
		+ box(-5, -1, 0, 10, 0.6, 7, '')
		+ poly('es-dl', [on(-4.4, 0.6), on(4.4, 0.6), on(4.4, 5.6), on(-4.4, 5.6)])
		+ `<circle class="es-err" cx="${r(P(...on(-4, 6.3))[0])}" cy="${r(P(...on(-4, 6.3))[1])}" r="2.2"/>`
		+ `<circle class="es-acc" cx="${r(P(...on(-3.1, 6.3))[0])}" cy="${r(P(...on(-3.1, 6.3))[1])}" r="2.2" opacity=".5"/>`
		+ `<circle class="es-ok" cx="${r(P(...on(-2.2, 6.3))[0])}" cy="${r(P(...on(-2.2, 6.3))[1])}" r="2.2"/>`
		+ poly('es-t', [on(-3.8, 1.2), on(-0.4, 1.2), on(-0.4, 4.9), on(-3.8, 4.9)])
		+ line('es-ln', on(0.4, 4.6), on(3.6, 4.6)) + line('es-ln', on(0.4, 3.6), on(3, 3.6)) + line('es-ln', on(0.4, 2.6), on(3.6, 2.6)) + line('es-ln', on(0.4, 1.6), on(2.2, 1.6))
		+ `<g class="es-sc-a">${pathOn('es-accs', [on(-3, 2), on(-1.2, 3.8)])}${pathOn('es-accs', [on(-2.6, 3.8), on(-1.2, 3.8), on(-1.2, 2.4)])}</g>`;
	return svg(`.es-sc-a{animation:es-sc-a 2.8s ease-in-out infinite}@keyframes es-sc-a{0%{transform:translate(${r(-ax * 0.25)}px,${r(-ay * 0.25)}px);opacity:0}25%,60%{transform:translate(0,0);opacity:1}100%{transform:translate(${r(ax * 0.35)}px,${r(ay * 0.35)}px);opacity:0}}`, body);
};

scenes.storage = () => {
	const fy = 2.5;
	const bayW = 1.8;
	const bayX = (i) => -4.1 + i * 2.2;
	const z0 = 0.6;
	const z1 = 4.6;
	const out = 3;
	const step = 0.35;
	const [dx, dy] = vec(0, out, 0);
	const face = (x, w, a, b) => [[x, fy, a], [x + w, fy, a], [x + w, fy, b], [x, fy, b]];
	const shift = ([x, y, z]) => [x, y + out + 2, z];
	let bays = '';
	let clips = '';
	let drives = '';
	for (let i = 0; i < 4; i++) {
		const x = bayX(i);
		const opening = face(x, bayW, z0, z1);
		const sweep = [0, 1, 2, 3].map((k) => { const a = opening[k]; const b = opening[(k + 1) % 4]; return [a, b, shift(b), shift(a)]; });
		clips += `<clipPath id="es-storage-clip-${i}">${[opening, opening.map(shift), ...sweep].map((list) => `<polygon points="${pts(list)}"/>`).join('')}</clipPath>`;
		bays += poly('es-dl', opening) + poly('es-dr es-ns', face(x + 0.05, bayW - 0.1, z1 - 0.4, z1 - 0.05));
		bays += poly('es-lnf', face(x + 0.65, 0.5, 5.05, 5.35));
		bays += `<g class="es-st-led es-st-${i}">${poly('es-ok', face(x + 0.65, 0.5, 5.05, 5.35))}</g>`;
		const drive = box(x + 0.06, -1.3, z0 + 0.06, bayW - 0.12, 3.8, z1 - z0 - 0.12, 'a')
			+ line('es-ws es-thin', [x + 0.4, fy, 1.2], [x + bayW - 0.4, fy, 1.2])
			+ line('es-ws es-thin', [x + 0.4, fy, 3.9], [x + 0.9, fy, 3.9]);
		drives += `<g clip-path="url(#es-storage-clip-${i})"><g class="es-st-d es-st-${i}">${drive}</g></g>`;
	}
	const delays = [0, 1, 2, 3].map((i) => `.es-st-${i}{animation-delay:${r(-(3 - i) * step)}s}`).join('');
	const body = platform()
		+ `<defs>${clips}</defs>`
		+ diamond(-5, -3.4, 0, 10, 6.3, 'es-sh')
		+ box(-4.6, -3, 0, 9.2, 5.5, 6, '')
		+ bays
		+ drives;
	return svg(`.es-st-d{animation:es-st-d 5s cubic-bezier(.6,0,.3,1) infinite}.es-st-led{opacity:0;animation:es-st-led 5s linear infinite}${delays}@keyframes es-st-d{0%,15%{transform:translate(${dx}px,${dy}px)}45%,85%{transform:translate(0,0)}100%{transform:translate(${dx}px,${dy}px)}}@keyframes es-st-led{0%,46%{opacity:0}50%,84%{opacity:1}86%,100%{opacity:0}}`, body);
};

scenes.snapshots = () => {
	const x0 = -2.2;
	const w = 4.4;
	const y0 = 1;
	const h = 4.4;
	const fy = y0 + w;
	const step = 1.3;
	const plate = 0.35;
	const cx = 0;
	const cz = 2.2;
	const rad = 1.45;
	const onFace = (a, len) => [cx + Math.sin(a) * len, fy, cz + Math.cos(a) * len];
	const dial = Array.from({ length: 33 }, (_, k) => onFace(k * Math.PI / 16, rad));
	const ticks = [0, 1, 2, 3].map((k) => line('es-lnw', onFace(k * Math.PI / 2, rad - 0.25), onFace(k * Math.PI / 2, rad - 0.5))).join('');
	const sweep = Array.from({ length: 13 }, (_, k) => pts([[cx, fy, cz], onFace(k * Math.PI / 6, rad - 0.35)])).join(';');
	const hand = `<polyline class="es-accs es-ck-m" points="${pts([[cx, fy, cz], onFace(0, rad - 0.35)])}"><animate attributeName="points" values="${sweep}" dur="6s" repeatCount="indefinite"/></polyline>`;
	const windows = [[8, 24], [36, 52], [62, 78]];
	const copies = windows.map(([a, b], k) => {
		const i = k + 1;
		const [dx, dy] = vec(0, step * i, 0);
		return `.es-ck-c${i}{opacity:0;animation:es-ck-c${i} 6s cubic-bezier(.4,0,.2,1) infinite}@keyframes es-ck-c${i}{0%,${a}%{transform:translate(${dx}px,${dy}px);opacity:0}${a + 3}%{opacity:1}${b}%,88%{transform:translate(0,0);opacity:1}96%,100%{transform:translate(0,0);opacity:0}}`;
	}).join('');
	const body = platform()
		+ diamond(x0 - 0.4, y0 - step * 3 - 0.4, 0, w + 0.8, w + step * 3 + 0.8, 'es-sh')
		+ [3, 2, 1].map((i) => `<g class="es-ck-c${i}">${box(x0, y0 - step * i, 0, w, plate, h, '')}</g>`).join('')
		+ box(x0, y0, 0, w, w, h, 'a')
		+ poly('es-wt', dial)
		+ ticks
		+ line('es-accs', [cx, fy, cz], onFace(-Math.PI / 2, rad - 0.7))
		+ hand
		+ ellipse(cx, fy, cz, 0.01, 'es-acc');
	return svg(`.es-ck-m{stroke-width:2}${copies}`, body);
};

scenes['up-to-date'] = () => {
	const [cx, cy] = P(0, 0, 9.6);
	const badge = `<g transform="translate(${r(cx)} ${r(cy)})"><circle class="es-ok" r="17"/><path class="es-ws" d="M-7.5 0.5L-2.5 5.5L8 -5"/></g>`;
	const rings = `<g class="es-c es-pulse">${ellipse(0, 0, 0, 6.4, 'es-path')}</g><g class="es-c es-pulse es-d3">${ellipse(0, 0, 0, 6.4, 'es-path')}</g>`;
	K = 0.8;
	const body = nas(() => '');
	K = 1;
	return svg('', platform() + rings + body + `<g class="es-float">${badge}</g>`);
};

scenes['no-results'] = () => {
	K = 1.1;
	const gy = 0;
	const gx0 = -3.6;
	const gx1 = 2;
	const gz0 = 1;
	const gz1 = 7.6;
	const fold = 1.4;
	const page = [[gx0, gy, gz0], [gx1, gy, gz0], [gx1, gy, gz1 - fold], [gx1 - fold, gy, gz1], [gx0, gy, gz1]];
	const rows = [[1.4, 2.4], [2.5, 0.9], [3.6, 1.7], [4.7, 0.9], [5.8, 2.2]];
	const ghostFile = `<g class="es-g">${poly('', page)}<polyline points="${pts([[gx1 - fold, gy, gz1], [gx1 - fold, gy, gz1 - fold], [gx1, gy, gz1 - fold]])}"/>${rows.map(([dz, cut]) => line('es-nr-ln', [gx0 + 0.9, gy, gz1 - dz], [gx1 - cut, gy, gz1 - dz])).join('')}</g>`;
	const [lx, ly] = P(3.8, 2.2, 2.8);
	const lens = `<g transform="translate(${r(lx)} ${r(ly)})"><path class="es-accs es-nr-hd" d="M15 15L29 29"/><circle r="21" class="es-t es-ns" fill-opacity=".35"/><circle r="21" class="es-accs es-nr-rm"/><path class="es-ws" d="M-11 -6A12 12 0 0 1 -4 -12" opacity=".9"/></g>`;
	const body = platform()
		+ `<g class="es-c es-shadow">${diamond(gx0 + 0.4, gy - 0.6, 0, gx1 - gx0 - 0.8, 1.2, 'es-sh')}</g>`
		+ `<g class="es-float"><g class="es-nr-g">${ghostFile}</g></g>`
		+ `<g class="es-float es-nr-f">${lens}</g>`;
	return svg('.es-nr-hd{stroke-width:7}.es-nr-rm{stroke-width:5}.es-nr-g{animation:es-blink 3s ease-in-out infinite}.es-g .es-nr-ln{stroke-dasharray:none;stroke-width:2;stroke-linecap:round;opacity:.5}.es-nr-f{animation-delay:-1.2s}', body);
};

const faceMatrix = (fy) => { const [ox, oy] = P(0, fy, 0); return `matrix(${r(C * K * 1000) / 1000} ${r(0.5 * K * 1000) / 1000} 0 ${r(K * 1000) / 1000} ${r(ox)} ${r(oy)})`; };

const font = 'font-family="system-ui,-apple-system,\'Segoe UI\',Roboto,sans-serif" font-weight="800"';

scenes['not-found'] = () => {
	const fy = -0.4;
	const on = (x, z) => [x, fy, z];
	const dot = (x, cls) => { const [X, Y] = P(...on(x, 6.5)); return `<circle class="${cls}" cx="${r(X)}" cy="${r(Y)}" r="2.2"/>`; };
	const digit = (u, text, cls) => `<text class="es-nf-d ${cls}" x="${u}" y="${r(-2.3 * S)}" text-anchor="middle" font-size="24" ${font} fill="#658ffc">${text}</text>`;
	const body = platform()
		+ diamond(-5.9, -1.4, 0, 11.8, 2.4, 'es-sh')
		+ box(-5.5, -1, 0, 11, 0.6, 7.2, '')
		+ poly('es-dl', [on(-4.9, 0.6), on(4.9, 0.6), on(4.9, 5.8), on(-4.9, 5.8)])
		+ dot(-4.5, 'es-err') + `<g opacity=".5">${dot(-3.6, 'es-acc')}</g>` + dot(-2.7, 'es-ok')
		+ line('es-ln', on(-2.4, 1.3), on(2.4, 1.3))
		+ `<g transform="${faceMatrix(fy)}">${digit(-17, '4', '')}${digit(0, '0', 'es-nf-1')}${digit(17, '4', 'es-nf-2')}</g>`;
	return svg(`.es-nf-d{animation:es-nf-d 2.4s ease-in-out infinite}.es-nf-1{animation-delay:.2s}.es-nf-2{animation-delay:.4s}@keyframes es-nf-d{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`, body);
};

scenes.error = () => {
	K = 1.2;
	const [nx, ny] = vec(3.6, -3.6, 0);
	const sparkAt = P(3.45, 1.45, 0.6);
	const sparks = [[0, -14], [10, -9], [-10, -9], [12, 2], [-12, 2]].map(([dx, dy]) => `<line class="es-errs" x1="${r(sparkAt[0] + dx * 0.35 * K)}" y1="${r(sparkAt[1] + dy * 0.35 * K)}" x2="${r(sparkAt[0] + dx * K)}" y2="${r(sparkAt[1] + dy * K)}"/>`).join('');
	const [jx, jy] = vec(0.25, 0, 0);
	const [kx, ky] = vec(0, 0.25, 0);
	const laptop = diamond(-6.4, -0.4, 0, 5.8, 5.2, 'es-sh')
		+ box(-6, 0, 0, 5, 4.4, 0.5, '')
		+ poly('es-dt', [[-5.4, 1.4, 0.5], [-1.6, 1.4, 0.5], [-1.6, 3.6, 0.5], [-5.4, 3.6, 0.5]])
		+ box(-6, 0, 0.5, 5, 0.4, 3.6, '')
		+ poly('es-dl', [[-5.6, 0.4, 0.9], [-1.4, 0.4, 0.9], [-1.4, 0.4, 3.7], [-5.6, 0.4, 3.7]])
		+ poly('es-acc', [[-4.3, 0.4, 1.8], [-2.7, 0.4, 1.8], [-2.7, 0.4, 2.8], [-4.3, 0.4, 2.8]], ' opacity=".55"');
	const cables = pathOn('es-ln', [[-1, 2, 0.4], [2.3, 2, 0.4]])
		+ pathOn('es-ln', [[3.6, 0.4, 0.4], [3.6, -2.2, 0.4]]);
	K = 0.66;
	const fy = 2.5;
	let bays = '';
	for (let i = 0; i < 4; i++) {
		const x = -4.1 + i * 2.2;
		bays += poly('es-dl', [[x, fy, 0.6], [x + 1.8, fy, 0.6], [x + 1.8, fy, 4.6], [x, fy, 4.6]])
			+ poly('es-al', [[x + 0.06, fy, 0.66], [x + 1.74, fy, 0.66], [x + 1.74, fy, 4.54], [x + 0.06, fy, 4.54]])
			+ line('es-ws es-thin', [x + 0.4, fy, 1.2], [x + 1.4, fy, 1.2])
			+ poly('es-ok', [[x + 0.65, fy, 5.05], [x + 1.15, fy, 5.05], [x + 1.15, fy, 5.35], [x + 0.65, fy, 5.35]]);
	}
	const nas = diamond(-5, -3.4, 0, 10, 6.3, 'es-sh')
		+ box(-4.6, -3, 0, 9.2, 5.5, 6, '')
		+ bays
		+ `<g class="es-blink">${poly('es-err', [[4.6, 1.3, 5], [4.6, 2, 5], [4.6, 2, 5.35], [4.6, 1.3, 5.35]])}</g>`;
	K = 1.2;
	const body = platform()
		+ `<g transform="translate(${nx} ${ny})">${nas}</g>`
		+ laptop
		+ cables
		+ `<g class="es-er-r">${box(3.2, 0.4, 0, 0.8, 0.8, 0.8, '')}</g>`
		+ `<g class="es-er-l">${box(2.3, 1.6, 0, 0.8, 0.8, 0.8, '')}</g>`
		+ `<g class="es-er-k">${sparks}</g>`;
	return svg(`.es-er-l{animation:es-er-l 2s ease-in-out infinite}.es-er-r{animation:es-er-r 2s ease-in-out infinite}.es-er-k{opacity:0;animation:es-er-k 2s ease-out infinite}@keyframes es-er-l{0%,100%{transform:translate(0,0)}45%{transform:translate(${jx}px,${jy}px)}}@keyframes es-er-r{0%,100%{transform:translate(0,0)}45%{transform:translate(${kx}px,${ky}px)}}@keyframes es-er-k{0%,40%{opacity:0}50%{opacity:1}70%,100%{opacity:0}}`, body);
};

scenes.sites = () => {
	const spots = [[-7.2, -7.2], [3.6, -7.2], [-7.2, 3.6], [3.6, 3.6]];
	const links = spots.map(([x, y]) => pathOn('es-path es-dash', [[0, 0, 0], [x + 1.8, y + 1.8, 0]])).join('');
	const g = (i, cls) => `<g class="es-si-g ${cls}">${ghost(spots[i][0], spots[i][1], 0, 3.6, 3.6, 3)}</g>`;
	const [bx, by] = P(0, 0, 7.6);
	const body = platform()
		+ links
		+ g(0, '') + g(1, 'es-d1') + g(2, 'es-d2')
		+ `<g class="es-c es-pulse">${ellipse(0, 0, 0, 4, 'es-path')}</g>`
		+ diamond(-2.6, -2.6, 0, 5.2, 5.2, 'es-sh')
		+ box(-2.2, -2.2, 0, 4.4, 4.4, 6.4, 'a')
		+ line('es-ws es-thin', [-1.5, 2.2, 5.3], [0.8, 2.2, 5.3], ' opacity=".8"')
		+ line('es-ws es-thin', [-1.5, 2.2, 4.4], [0.8, 2.2, 4.4], ' opacity=".8"')
		+ `<circle class="es-acc es-blink" cx="${r(bx)}" cy="${r(by - 4)}" r="3"/>`
		+ g(3, 'es-d4');
	return svg(`.es-si-g{animation:es-si-g 2.4s ease-in-out infinite}@keyframes es-si-g{0%,100%{opacity:1}50%{opacity:.3}}`, body);
};

const nas = (led, empty = -1) => {
	const fy = 2.5;
	let bays = '';
	for (let i = 0; i < 4; i++) {
		const x = -4.1 + i * 2.2;
		bays += poly('es-dl', [[x, fy, 0.6], [x + 1.8, fy, 0.6], [x + 1.8, fy, 4.6], [x, fy, 4.6]])
			+ (i === empty ? poly('es-dr es-ns', [[x + 0.05, fy, 4.25], [x + 1.75, fy, 4.25], [x + 1.75, fy, 4.55], [x + 0.05, fy, 4.55]]) : poly('es-al', [[x + 0.06, fy, 0.66], [x + 1.74, fy, 0.66], [x + 1.74, fy, 4.54], [x + 0.06, fy, 4.54]])
			+ line('es-ws es-thin', [x + 0.4, fy, 1.2], [x + 1.4, fy, 1.2]))
			+ poly('es-lnf', [[x + 0.65, fy, 5.05], [x + 1.15, fy, 5.05], [x + 1.15, fy, 5.35], [x + 0.65, fy, 5.35]])
			+ `<g class="${led(i)}">${poly('es-ok', [[x + 0.65, fy, 5.05], [x + 1.15, fy, 5.05], [x + 1.15, fy, 5.35], [x + 0.65, fy, 5.35]])}</g>`;
	}
	return diamond(-5, -3.4, 0, 10, 6.3, 'es-sh') + box(-4.6, -3, 0, 9.2, 5.5, 6, '') + bays;
};

const at = (x, y, z, inner, cls = '') => { const [X, Y] = P(x, y, z); return `<g class="${cls}"><g transform="translate(${r(X)} ${r(Y)})">${inner}</g></g>`; };

scenes.maintenance = () => {
	K = 0.8;
	const body = nas((i) => (i === 2 ? 'es-mt-warn' : ''), 2);
	const drive = diamond(5.4, 1.2, 0, 4.28, 4.2, 'es-sh')
		+ box(5.6, 1.4, 0, 3.88, 3.8, 1.68, 'a')
		+ line('es-ws es-thin', [6.14, 5.2, 0.34], [6.14, 5.2, 1.34]);
	K = 1;
	return svg('.es-mt-warn polygon{animation:es-mt-warn 1.2s steps(1) infinite}@keyframes es-mt-warn{0%{fill:#f5a524}50%{fill:#f0616d}}', platform() + body + drive);
};

scenes.reboot = () => {
	const ring = (cls, extra = '') => ellipse(0, 0, 0, 5.6, cls, ` pathLength="100"${extra}`);
	K = 0.8;
	const body = nas((i) => `es-rb-led es-rb-led${i}`);
	K = 1;
	return svg('.es-rb-track{fill:none;stroke:light-dark(#dfe5ee,#2e2f34);stroke-width:3}.es-rb-fill{fill:none;stroke:#658ffc;stroke-width:3;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100;animation:es-rb-fill 4s ease-in-out infinite}@keyframes es-rb-fill{0%{stroke-dashoffset:100;opacity:1}80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}.es-rb-led{opacity:0;animation:es-rb-led 4s ease-in-out infinite}.es-rb-led1{animation-delay:.25s}.es-rb-led2{animation-delay:.5s}.es-rb-led3{animation-delay:.75s}@keyframes es-rb-led{0%,35%{opacity:0}50%,85%{opacity:1}95%,100%{opacity:0}}', platform() + ring('es-rb-track') + ring('es-rb-fill') + body);
};

scenes.shutdown = () => {
	K = 0.8;
	const body = nas(() => 'es-sd-dark');
	K = 1;
	const moon = '<path class="es-sd-moon" d="M4 -14A14 14 0 1 0 15 3A11 11 0 0 1 4 -14Z"/><text x="16" y="-12" class="es-lnf" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="11">z</text><text x="24" y="-21" class="es-lnf" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="8">z</text>';
	return svg('.es-sd-moon{fill:#8eaafc}.es-sd-dark{opacity:0}', platform() + body + at(0, 0, 9.2, moon, 'es-float'));
};

const labels = {
	apps: ['Apps', 'No apps installed'],
	folders: ['Folders', 'No folders created'],
	'backup-disks': ['Time capsule', 'No backup disks created'],
	shortcuts: ['Shortcuts', 'No shortcuts added'],
	storage: ['Storage', 'No storage pool'],
	snapshots: ['Snapshots', 'No snapshots yet'],
	'up-to-date': ['System updates', 'Up to date'],
	'no-results': ['Any searchable list', 'Nothing matches the search'],
	'not-found': ['Not found', 'Page not found'],
	error: ['Any page', 'Error fetching data'],
	sites: ['Fleet: Sites', 'No sites yet'],
	maintenance: ['Maintenance', 'Maintenance in progress'],
	reboot: ['Reboot', 'Restarting'],
	shutdown: ['Shutdown', 'Shutting down']
};

const overview = (rendered) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Empty states | virgoOS</title>
<style>
:root{color-scheme:light}
:root[data-mode="dark"]{color-scheme:dark}
body{margin:0;padding:32px 24px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:light-dark(#ffffff,#111111);color:light-dark(#1d1d1f,#f2f2f2)}
header{display:flex;align-items:center;gap:16px;flex-wrap:wrap;max-width:1320px;margin:0 auto 28px}
h1{font-size:20px;font-weight:600;margin:0 auto 0 0}
.modes{display:flex;gap:4px;padding:3px;border-radius:10px;background:light-dark(rgba(0,0,0,.06),rgba(255,255,255,.07))}
.modes button{font:inherit;font-size:13px;border:0;border-radius:8px;padding:5px 12px;cursor:pointer;background:transparent;color:inherit}
.modes button.active{background:light-dark(#ffffff,rgba(255,255,255,.14));box-shadow:0 1px 2px rgba(0,0,0,.12)}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;max-width:1320px;margin:0 auto}
figure{margin:0;padding:20px 16px 18px;border-radius:16px;border:1px solid light-dark(rgba(0,0,0,.063),rgba(255,255,255,.071));background:light-dark(rgba(0,0,0,.024),rgba(255,255,255,.034));text-align:center}
figure svg{display:block;width:100%;max-width:280px;height:auto;margin:0 auto}
h5{font-size:16px;font-weight:600;margin:14px 0 4px;color:light-dark(#6b6b70,#9a9aa0)}
figcaption{font-size:12px;color:light-dark(#8a8a90,#76767c)}
code{font-size:12px}
</style>
</head>
<body>
<header>
<h1>Empty states</h1>
<div class="modes"><button type="button" data-mode="light" class="active">Light</button><button type="button" data-mode="dark">Dark</button></div>
</header>
<main>
${rendered.map(([name, markup]) => `<figure>${markup.trim()}<h5>${labels[name][1]}</h5><figcaption>${labels[name][0]} · <code>${name}.svg</code></figcaption></figure>`).join('\n')}
</main>
<script>
document.querySelectorAll('.modes button').forEach((button) => {
	button.addEventListener('click', () => {
		document.documentElement.dataset.mode = button.dataset.mode;
		document.querySelectorAll('.modes button').forEach((other) => { other.classList.toggle('active', other === button); });
	});
});
</script>
</body>
</html>
`;

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'src/assets/img/empty');
fs.mkdirSync(outDir, { recursive: true });
const rendered = Object.entries(scenes).map(([name, fn]) => { K = 1; return [name, fn()]; });
for (const [name, markup] of rendered) {
	fs.writeFileSync(path.join(outDir, `${name}.svg`), markup);
}
fs.writeFileSync(path.join(__dirname, 'empty_states.html'), overview(rendered));
