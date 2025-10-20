(function () {
	let delayMs = 0;
	window.addEventListener('message', (event) => {
		if (event.source !== window || !event.data || event.data.type !== 'UPDATE_TRANSPOSE_PARMS') return;

		delayMs = event.data.delayMs;

		console.log('Updated parms, delayMs:', delayMs);
	});

	const originalGetCurrentTime = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime').get;
	const originalSetCurrentTime = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime').set;

	// Override the original currentTime getter to apply a delay to fix sync issues
	Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
		get: function () {
			if( delayMs == 0 ){
				return originalGetCurrentTime.call(this);
			}
			return originalGetCurrentTime.call(this) - (delayMs / 1000);
		},
		set: function (value) {
			originalSetCurrentTime.call(this, value);
		},
		configurable: true
	});
})();

