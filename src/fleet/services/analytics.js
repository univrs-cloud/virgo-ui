import * as tracker from '@plausible-analytics/tracker';

tracker.init({
	domain: 'fleet.univrs.cloud',
	endpoint: 'https://analytics.univrs.cloud/api/event',
	autoCapturePageviews: true,
	captureOnLocalhost: false
});
