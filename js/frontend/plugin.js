/**
 * GS-Broadcaster Bot
 * ==================
 *
 * Module: Frontend.Bootstrapper
 *
 * The final script to be added to the user_script environment designed to kick it all off!
 */

(function(_, chrome, GSBot) {

    var Constants = GSBot.Constants;

    GSBot.Plugin = function() {
        this._channel = new GSBot.PortHandler();

        var port = chrome.runtime.connect(
            GSBot.extensionId,
            {
                name: Constants.Ports.PAGE
            }
        );

        if (port) {
            this._channel.updatePort(port);
        }

        this._isReady = false;
    };

    GSBot.Plugin.prototype = {
        init: function() {
            if (!window.GS)
                throw "Plugin can't be ready, no GS instance found!";

            this._sendStatus();
        },

        _sendStatus: function() {
            this._channel.send(
                Constants.Messages.Plugin.STATUS,
                {
                    broadcasting: this.broadcasting,
                    attached: this.attached
                }
            );
        }
    };

})(window.lodash, chrome, GSBot);