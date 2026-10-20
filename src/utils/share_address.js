const getShareAddress = (system) => {
	const networkInterface = system?.networkInterfaces?.find((entry) => { return entry.default; });
	return system?.virtualIp?.address || networkInterface?.addrInfo?.find((entry) => { return entry.family === 'inet'; })?.local;
};

export { getShareAddress };
