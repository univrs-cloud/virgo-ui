import inflection from 'lodash-inflection';

const BIT_RATE_UNITS = { b: 'bps', kbit: 'Kbps', Mbit: 'Mbps', Gbit: 'Gbps', Tbit: 'Tbps' };

_.mixin(inflection);
_.mixin({
	prettyBitRate: (bytesPerSecond, options) => {
		const [value, unit] = prettyBytes(bytesPerSecond * 8, { minimumFractionDigits: (bytesPerSecond > 0 ? 1 : 0), maximumFractionDigits: 1, ...options, bits: true }).split(' ');
		return `${value} ${BIT_RATE_UNITS[unit]}`;
	}
});
