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
     * Constant values
     */
    var Constants = GSBot.Constants = {
        Ports: {
            'PAGE': 'Port:GSBot.Page',
            'PAGE_ACTION': 'Port:GSBot.PageAction'
        },

        Events: {
            'EXTENSION_ID': 'EXTENSION_ID',
            'GET_EXTENSION_ID': 'GET_EXTENSION_ID'
        },

        Messages: {
            Plugin: {
                'REGISTER': 'Plugin.REGISTER',
                'STATUS': 'Plugin.STATUS',
                'REQUEST_STATUS': 'Plugin.REQUEST_STATUS',
                'REQUEST_CHANGE_STATUS': 'Plugin.REQUEST_CHANGE_STATUS'
            }
        }
    };

    /**
     * Utilities Namespace
     */
    GSBot.Utils = {};

    /**
     * Log a message with an environment specific prefix optionally only under debug circumstances.
     * @param message
     * @param debugOnly
     */
    GSBot.Utils.log = function(message, debugOnly) {
        if (debugOnly && !GSBot.debug) return;

        console.log('GSBot/' + GSBot.environment + ': ' + message);
    };

    /**
     * Signals to anything sharing the window instance that the extension
     * id should be broadcast.
     */
    GSBot.Utils.signalRequiresExtensionId = function() {

        GSBot.Utils.oneTimeHandleSignal(Constants.Events.EXTENSION_ID, function(message) {

            GSBot.extensionId = message.data.extensionId
            GSBot.Utils.log('Got Extension ID: ' + GSBot.extensionId, true);
        });

        GSBot.Utils.log('Requesting Extension ID', true);

        window.postMessage({
            event: Constants.Events.GET_EXTENSION_ID
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

            var conditionResult = false;
            try {
                conditionResult = condition();
            } catch (e) {
                console.warn('Caught Exception while spin-waiting: ' + e);

                setTimeout(check, interval);
                return;
            }

            if (conditionResult) {
                onComplete();
            } else {
                setTimeout(check, interval);
            }
        };

        check();

    };

    /*/////////////////////////////////////////////*/

    /**
     * A message factory, marks the object with an identifier and ensures consistency
     * of the message object.
     * @returns {GSBot.Message.fn}
     * @constructor
     */
    GSBot.Message = function() {

        var isObjectInput = arguments[0] && _.isPlainObject(arguments[0]),
            type = isObjectInput ? arguments[0].type : arguments[0],
            data = isObjectInput ? arguments[0].data : arguments[1];

        var message = Object.create(GSBot.Message.fn);
        message.type = type;
        message.data = data;
        message.isGSBotMessage = true;

        return message;
    };

    /**
     * Prototype for the message object
     *    Note: Not sure if this is really required.
     * @type {{is: Function}}
     */
    GSBot.Message.fn = {
        is: function(type) {
            return this.type == type;
        }
    };

    /**
     * Check if an object meets the basic requirements to be treated as
     * a message.
     * @param message
     * @returns {*|data|string|CanvasPixelArray|Object[]|Object}
     */
    GSBot.Message.isMessage = function(message) {
        return message &&
               message.type &&
               message.data &&
               message.isGSBotMessage;
    };

    /**
     * Mimics a chrome-style listener, and allows an eventing/listener pattern to be used.
     * @constructor
     */
    GSBot.EventDispatcher = function() {
        this._listeners = [];
    };

    GSBot.EventDispatcher.prototype = {

        /**
         * Add a listener callback to the dispatcher
         * @param listener
         */
        addListener: function(listener) {
            if (_.contains(this._listeners, listener))
                return;

            this._listeners.push(listener);
        },

        /**
         * Remove a listener callback to the dispatcher
         * @param listener
         */
        removeListener: function(listener) {
            if (!_.contains(this._listeners, listener))
                return;

            this._listeners = _.filter(this._listeners, function(el) {
                return el != listener;
            });
        },

        /**
         * Invoke all the listeners, the calling arguments are passed to the
         * listeners.
         */
        invoke: function() {
            this._listeners.forEach(function(el) {
                el.apply(null, arguments);
            });
        },

        /**
         * Is the listener list empty?
         * @returns {boolean}
         */
        isEmpty: function() {
            return this._listeners.length == 0;
        }
    };

    /**
     * A wrapper around a chrome Port for simplified interactions
     * @param port (Optional) the port to wrap, this can be specified later if needed.
     * @constructor
     */
    GSBot.PortHandler = function (/* arguments */) {

        var port = arguments[0];

        // Initialization
        this._listenerMap = {};
        this._onMessageListener = _.bind(this._onMessage, this);
        this._onDisconnectListener = _.bind(this._onDisconnect, this);
        this._isConnected = false;

        Object.defineProperty(this, 'isConnected', {
            get: function() { return this._isConnected; }
        });

        if (port) {
            this.updatePort(port);
        }

        // Events
        this.onDisconnect = new GSBot.EventDispatcher();
    };

    GSBot.PortHandler.prototype = {

        /**
         * Add A collection of listeners to the port handler
         * @param listeners An array of arrays: [messageType, listener]
         */
        addListeners: function(listeners) {

            if (!_.isArray(listeners))
                return;

            _.forEach(
                listeners,
                function(el) {
                    var messageType = el[0];
                    var listener = el[1];

                    if (messageType && listener) {
                        this.addListener(messageType, listener);
                    }
                },
                this
            );

        },

        /**
         * Add a listener to a specific message type
         * @param messageType
         * @param listener
         */
        addListener: function(messageType, listener) {
            if (!this._listenerMap[messageType]) {
                this._listenerMap[messageType] = new GSBot.EventDispatcher();
            }

            this._listenerMap[messageType].addListener(listener);
        },

        /**
         * Remove a listener from a specific message type
         * @param messageType
         * @param listener
         */
        removeListener: function(messageType, listener) {
            if (!this._listenerMap[messageType]) {
                return;
            }

            this._listenerMap[messageType].removeListener(listener);

            if (this._listenerMap[messageType].isEmpty()) {
                delete this._listenerMap[messageType];
            }
        },

        /**
         * Send a message to the other end of this port.
         * @param messageType
         * @param messageData
         */
        send: function(messageType, messageData) {
            var message = GSBot.Message(messageType, messageData);

            this._port.postMessage(message);
        },

        /**
         * Update the underlying port
         * @param chrome.runtime.Port Port to wrap
         */
        updatePort: function(port) {

            if (this._port) {
                this._detachPort();
            }

            this._port = port;

            if (this._port) {
                this._attachPort();
            }

        },

        _attachPort: function() {
            this._isConnected = true;

            this._port
                .onMessage
                .addListener(this._onMessageListener);

            this._port
                .onDisconnect
                .addListener(this._onDisconnectListener);
        },

        _detachPort: function() {
            this._port
                .onMessage
                .removeListener(this._onMessageListener);

            this._port
                .onDisconnect
                .removeListener(this._onDisconnectListener);

            this._isConnected = false;
        },

        _onMessage: function(msg) {
            if (!msg || !GSBot.Message.isMessage(msg))
                return;

            var message = GSBot.Message(msg);
            var dispatcher = this._listenerMap[message.type];
            if (dispatcher) {
                dispatcher.invoke(message.data);
            }
        },

        _onDisconnect: function() {

            // Detach the port
            this.updatePort(null);

            // Signal to anything listening
            this.onDisconnect.invoke();
        }

    };

})(window.lodash, chrome, GSBot);
