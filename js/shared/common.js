/**
 * GS-Broadcaster Bot
 * ==================
 *
 * Module: Shared.Common
 *
 * The common code to all domains for the plugin (user_script, frontend, background, page_action, etc...)
 */

if (!_) {
    throw "GS-Broadcast bot requires lodash as a dependency.";
} else {
    window.lodash = _.noConflict();
}

/**
 * The Main GroovesharkBot Namespace
 */
var GSBot = window.GSBot = {};

(function(_, chrome, GSBot)  {

    GSBot.debug = true;

    /**
     * The Environment name 'frontend', 'content_script', 'background', or 'page_action'
     * @type {string}
     */
    GSBot.environment = '';

    /**
     * The Extension ID for environments that need it
     * @type {string|null}
     */
    GSBot.extensionId = null;

    /**
     * Events Namespace
     */
    GSBot.Events = {
        'EXTENSION_ID': 'EXTENSION_ID',
        'GET_EXTENSION_ID': 'GET_EXTENSION_ID'
    };

    /**
     * Utilities Namespace
     */
    GSBot.Utils = {};

    GSBot.Utils.log = function(message, debugOnly) {
        if (debugOnly && !GSBot.debug) return;

        console.log('GSBot/' + GSBot.environment + ': ' + message);
    };

    /**
     * Signals to anything sharing the window instance that the extension
     * id should be broadcast.
     */
    GSBot.Utils.signalRequiresExtensionId = function() {

        GSBot.Utils.oneTimeHandleSignal(GSBot.Events.EXTENSION_ID, function(message) {

            GSBot.extensionId = message.data.extensionId
            GSBot.Utils.log('Got Extension ID: ' + GSBot.extensionId, true);
        });

        GSBot.Utils.log('Requesting Extension ID', true);

        window.postMessage({
            event: GSBot.Events.GET_EXTENSION_ID
        }, "*");
    };

    /**
     * Handles a signal through the window instance once, then removes itself.
     * @param eventId The event to handle
     * @param callback The callback to call
     */
    GSBot.Utils.oneTimeHandleSignal = function(eventId, callback) {

        var handler = function(message) {
            if (!message.data || !message.data.event || message.data.event != eventId) return;

            callback(message);
            window.removeEventListener('message', handler);
        };

        window.addEventListener('message', handler, false);
    };

    /**
     * Periodically check a condition, when the condition matches, execute the desired action.
     * @param interval int The milliseconds to wait until the next check.
     * @param condition callback The condition to check (boolean return expected)
     * @param onComplete callback The action to complete.
     */
    GSBot.Utils.spinWait = function(interval, condition, onComplete) {

        var check = function() {

            try {
                if (condition) {
                    onComplete();
                } else {
                    setTimeout(check, interval);
                }
            } catch (e) {
                console.warn('Caught Exception while spin-waiting: ' + e);

                setTimeout(check, interval);
            }

        };

        check();

    };

})(window.lodash, chrome, GSBot);
