// This code is injected into the chordify songpage
(function(){
	const originalTransposeMethod = window.Chordify.premium.changeTranspose;

	// Send an event from the songpage to the plugin that transpose is already on
	if( window.Chordify.transposeSetting !== 0 ){
		window.dispatchEvent(
			new CustomEvent('transposeChanged', { detail: Chordify.transposeSetting })
		);
	}

	// If the transpose buttons are clicked in the UI, pass the transpose setting to the plugin
	Chordify.premium.changeTranspose = function(semitones){
		originalTransposeMethod(semitones);
		window.dispatchEvent(new CustomEvent('transposeChanged', { detail: semitones }));
	};

	// Allow the Chordify songpage to figure out if this extension is enabled 
	// by responding to this event
	window.addEventListener('detectTransposeExtension', () => {
		console.log('detectTransposeExtension received');
		window.dispatchEvent(new CustomEvent('transposeExtensionDetected', { detail: true }));
	});

})();
