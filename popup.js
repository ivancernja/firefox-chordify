document.addEventListener('DOMContentLoaded', () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		console.log(tabs);
		const url = tabs[0].url;
		if( url === undefined ){
			document.body.classList.add('is-unsupported');
			return;
		}

		// Detect Youtube, supporting youtube.com and music.youtube.com
		if( url.indexOf('youtube.com/watch') > 0 ){
			const ytHandle = (new URL(url)).searchParams.get('v');
			document.body.classList.add('is-youtube');
			document.getElementById('ytLink')
				.setAttribute('href', 'https://chordify.net/chords/youtube:' + ytHandle);

			const transposeVal = document.getElementById('transposeVal');

			function updateTransposeValue(transpose){
				transposeVal.innerText = transpose;
	
				chrome.action.setBadgeText({text: transpose == 0 ? '' : transpose.toString(), tabId: tabs[0].id});
			
				// Chordify's light-blue
				chrome.action.setBadgeBackgroundColor({color: '#329dff', tabId: tabs[0].id});
				chrome.action.setBadgeTextColor({color: 'white', tabId: tabs[0].id});

			}

			document.getElementById('transposeUp').addEventListener('click', () => {	
				chrome.tabs.sendMessage(tabs[0].id, { type: "TRANSPOSE_UP" }, (response) => {
					updateTransposeValue(response.newPitch);
				});
			});
			document.getElementById('transposeDown').addEventListener('click', () => {	
				chrome.tabs.sendMessage(tabs[0].id, { type: "TRANSPOSE_DOWN" }, (response) => {
					updateTransposeValue(response.newPitch);
				});
			});
			document.getElementById('transposeVal').addEventListener('click', () => {	
				updateTransposeValue(0);
				chrome.tabs.sendMessage(tabs[0].id, { type: "SET_TRANSPOSE", message: 0 });
			});

			return;
		}

		if( url.indexOf('https://chordify.net') === -1 ){
			document.body.classList.add('is-unsupported');
			return;
		}

		if( url.indexOf('https://chordify.net/chords/') === -1 ){
			document.body.classList.add('is-nosongpage');
			return;
		}

		// We're probably looking at a Chordify songpage, request is-premium
		chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CONTENT_PROPS' }, (response) => {	
			if( chrome.runtime.lastError ){
				console.log('No content script found:', chrome.runtime.lastError.message);
				document.body.classList.add('is-unsupported');
				return;
			}
			console.log(response);
			if( response.playerType == 'youtube' ){
				document.body.classList.add('is-player-supported');
			}
			if( response.isPremium ){
				document.body.classList.add('is-premium');
			} else {
				document.body.classList.add('is-free');
			}
		});
	});
});
