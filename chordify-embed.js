// This file is injected in the YouTube embed on Chordify, or on the YouTube video page itself

console.log('Embed loaded');

let video;
let pitchShift; // Reference to the pitch shift node to adjust dynamically
let stretchNode, source, audioContext;
let transpose = 0;
let pitchShiftBypass = true;

// These are the default values and used to be passed to a previous version of SignalstretchSmith, but after a chat with Geraint, I figured out this:
// see info.txt for more on this
const blockMs = 120;
const intervalMs = 30;

const config = {
	numberOfInputs: 1,
	numberOfOutputs: 1,
	outputChannelCount: [2]
};

function setTranspose(stretchNode, transpose){
	transpose = parseInt(transpose, 10);
	
	// Tell inject.js about transpose and delay values
	window.postMessage({ type: 'UPDATE_TRANSPOSE_PARMS', delayMs: (transpose == 0 ? 0 : blockMs + intervalMs)}, '*');

	if( !stretchNode ){
		// nothing has been played and initiated yet
		return;
	}

	console.log('Applying pitch shift:', transpose);

	stretchNode.schedule({
		active: true,
		semitones: transpose,
	});
}

function initSignalsmith(){
	if( stretchNode ){
		// already inited my friend
		return;
	}
		
	audioContext = new (window.AudioContext || window.webkitAudioContext)();
	source = audioContext.createMediaElementSource(video);

	SignalsmithStretch(audioContext, config).then(node => {
		console.log('Signalsmitch stretch hooked into vid')
		stretchNode = node;
			 		
		if( transpose == 0 ){
			// no transpose setting, just play back to speakers
			source.connect(audioContext.destination);					
		} else {
			// otherwise do connecting magic
			source.connect(stretchNode);
			stretchNode.connect(audioContext.destination);	
			setTranspose(stretchNode, transpose);	
		}
	});
}

(async function() {
	video = document.querySelector("video");

	if (!video) {
		console.log('No video found');
		return;
	}

	const isPlaying = !video.paused && !video.ended && video.readyState >= 3;

	if( isPlaying ){
		// when this is loaded on YT the vid is already playing
		console.log('already playing, initSignalsmith');
		initSignalsmith();
	}

	video.addEventListener('play', async () => {
		initSignalsmith();
	});

	if( window.location.href.indexOf('/embed/') > 0 ){
		// this inject script fixes synchronization with Chordify, and only loads if this is an embed
		const script = document.createElement('script');
		script.src = chrome.runtime.getURL('inject.js');
		script.onload = function () { this.remove(); };
		(document.head || document.documentElement).appendChild(script);
	}

	console.log('send YT_EMBED_LOADED');
	chrome.runtime.sendMessage({ type: 'YT_EMBED_LOADED' });
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

	console.log('msg received', request, sender);

	if( request.type == 'TRANSPOSE_UP' ){
		transpose++;
		if( transpose > 6 ){
			transpose = -5;
		}
	} else if( request.type == 'TRANSPOSE_DOWN' ){
		transpose--;
		if( transpose < -5 ){
			transpose = 6;
		}
	} else if (request.type == 'SET_TRANSPOSE') {
		transpose = request.message; 
	} else {
		return;
	}

	if( !video ){
		// in case the video wasn't initiated yet
		video = document.querySelector("video");
		initSignalsmith();
	}

	console.log('sendResponse');

	sendResponse({ status: 'success', newPitch: transpose });

	console.log('msg in embed from background or popup', request, sender);

	if( !stretchNode ){
		initSignalsmith();
		return;
	}

	setTranspose(stretchNode, transpose);		

	if( transpose === 0 ){
		if( !pitchShiftBypass ){
			// make sure to bypass pitch shift for speeding up
			stretchNode.disconnect(audioContext.destination);
			source.disconnect(stretchNode);
			source.connect(audioContext.destination)
			pitchShiftBypass = true;
		}
	} else {
		if( pitchShiftBypass ){
			// enable pitch shifting again
			source.disconnect(audioContext.destination)
			stretchNode.connect(audioContext.destination);
			source.connect(stretchNode);

			pitchShiftBypass = false;
		}
	}
	
});

