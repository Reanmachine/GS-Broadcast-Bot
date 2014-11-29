/**
 * GS-Broadcaster Bot
 * ==================
 *
 * Module: Frontend.Loader
 *
 * A loader module for loading the scripts into the page-space. We`re using this loader script
 * to make use of the intelligent behavior of the Chrome Plugin`s Content Script framework to
 * automatically call this only once per PHYSICAL load to the target domain.
 */

var GSBot = GSBot || {};

(function(GSBot) {

    var Constants = GSBot.Constants;

    GSBot.environment = 'content_script';

    var filesToLoad = [
        'external/lodash.min.js',
        'shared/common.js',
        'frontend/plugin.js',
        'frontend/bootstrapper.js'
    ];

    function injectFile(file) {

        GSBot.Utils.log('Injecting ' + file, true);

        var newScript = document.createElement('Script');
        newScript.src = file;
        newScript.defer = true;
        newScript.onLoad = function(event) {
            this.remove();
        };

        (document.head||document.documentElement).appendChild(newScript);
    }

    /**
     * Listen for extension id requests and serve the extension id back!
     */
    window.addEventListener('message', function(message) {

        if (!message.data || !message.data.event || message.data.event != Constants.Events.GET_EXTENSION_ID) return;

        GSBot.Utils.log('Got request for Extension ID', true);

        window.postMessage({
            event: Constants.Events.EXTENSION_ID,
            extensionId: chrome.runtime.id
        }, "*")
    }, false);

    /**
     * Loads all the files into the script.
     */
    filesToLoad.forEach(function(el) {
        var srcPath = chrome.runtime.getURL(el);

        injectFile(srcPath);
    });

})(GSBot);