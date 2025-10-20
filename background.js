let lastTransposeReceived = 0;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log('Message received in background.js', request, sender);

	chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {

		if( tabs[0] == undefined ){
			console.log("Cannot access tabs", tabs);
			return;
		}

		const currentTabId = tabs[0].id;

		if( request.type === 'YT_EMBED_LOADED' && lastTransposeReceived !== 0 ){
			// The youtube embed and its extension code is done loading, 
			// send any initial transpose setting to content.js
			chrome.tabs.sendMessage(currentTabId, { type: 'SET_TRANSPOSE', message: lastTransposeReceived });

		} else if (request.type === 'TRANSPOSE_CHANGED') {
			lastTransposeReceived = request.message;

			// This is captured by chordify-embed again, to apply the pitch there
			chrome.tabs.sendMessage(currentTabId, { type: 'SET_TRANSPOSE', message: request.message });

			chrome.browserAction.setBadgeText({text: request.message == 0 ? '' : request.message.toString(), tabId: currentTabId});
			
			// Chordify's light-blue
			chrome.browserAction.setBadgeBackgroundColor({color: '#329dff', tabId: currentTabId});
			chrome.browserAction.setBadgeTextColor({color: 'white', tabId: currentTabId});

		} else if( request.type === 'IS_PREMIUM' ){
			if( request.data === false ){
				chrome.browserAction.setBadgeBackgroundColor({color: 'red', tabId: currentTabId});
				chrome.browserAction.setBadgeTextColor({color: 'white', tabId: currentTabId});
				chrome.browserAction.setBadgeText({text: '!', tabId: currentTabId})
			}
		} 

	});
});

