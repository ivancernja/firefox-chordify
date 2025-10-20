var inited = false;
function init(){
	if( inited ){
		return;
	}

	const isPremium = document.querySelector('body.user-premium') !== null;
	const isYouTube = document.querySelector('#youtube') !== null;
	console.log(isYouTube);

	// The popup asks if the user or song is Premium, the response is also sent
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		console.log('event', request, sender);
		if (request.type === 'GET_CONTENT_PROPS') {
			sendResponse({ isPremium: isPremium, playerType: isYouTube ? 'youtube' : 'howler' });
		}  
	});

	if( !isPremium ){	
		chrome.runtime.sendMessage({ type: 'IS_PREMIUM', data: false });
		// only enable things when premium
		return;
	}

	window.addEventListener('transposeChanged', (e) => {
		console.log('content.js transposeChanged', e.detail);
		chrome.runtime.sendMessage({ type: 'TRANSPOSE_CHANGED', message: e.detail });
	});

	const script = document.createElement('script');
	script.src = chrome.runtime.getURL('inject-songpage.js');
	script.onload = function () { this.remove(); };
	(document.head || document.documentElement).appendChild(script);
	
	inited = true;
}
document.addEventListener("DOMContentLoaded", () => {
	init();
});
init();
setTimeout(init, 2000);
