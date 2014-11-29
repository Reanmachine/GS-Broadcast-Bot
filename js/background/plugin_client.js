(function(_, chrome, GSBot) {

    var Constants = GSBot.Constants;

    GSBot.PluginClient = function (tabId, port) {

        this.tabId = tabId;
        this._status = {
            broadcasting: false,
            attached: false
        };

        // Evaluate: Is this overkill?
        Object.defineProperty(this, 'isBroadcasting', {
            get: function() { return this._status.broadcasting; }
        });

        Object.defineProperty(this, 'isAttached', {
            get: function() { return this._status.attached; }
        });

        this._pagePort = new GSBot.PortHandler();
        this._pagePort.onDisconnect.addListener(_.bind(this._onPageDisconnect, this));
        this._pagePort.addListeners([
            [Constants.Messages.Plugin.STATUS, _.bind(this._onPageStatus, this)]
        ]);

        this._pageActionPort = new GSBot.PortHandler();
        this._pagePort.addListeners([
            [Constants.Messages.Plugin.REQUEST_STATUS, _.bind(this._onPageActionRequestStatus, this)]
        ]);
    };

    GSBot.PluginClient.prototype = {

        updatePagePort: function (port) {
            this._pagePort.updatePort(port);

            if (port) {
                // New port means a new instance
                GSBot.Background.enablePageAction(this.tabId);
            } else {
                // Null/undefined port means forced disconnect?
                GSBot.Background.disablePageAction(this.tabId);
            }
        },

        updatePageActionPort: function (port) {
            this._pageActionPort.updatePort(port);
        },

        _onMessage: function (message) {
            if (!GSBot.Message.isMessage(message))
                return;

            if (message.is(Constants.Messages.Plugin.REGISTER))
                this._onRegister(message)
        },

        _onPageDisconnect: function () {
            this._updateStatus(false, false);

            GSBot.Background.disablePageAction(this.tabId);
            GSBot.Utils.log('Disconnected!');

            // TODO: signal plugin client to die ?
        },

        _updateStatus: function() {
            var isObject = _.isPlainObject(arguments[0]),
                broadcasting = isObject ? arguments[0].broadcasting : arguments[0],
                attached = isObject ? arguments[0].attached : arguments[1];

            // Ensures we're only setting true/false and nothing
            // that ducktypes into true/false
            this._status.broadcasting = !!broadcasting;
            this._status.attached = !!attached;
        },

        /*//// Page Handlers ////*/

        _onPageStatus: function(data) {
            this._updateStatus(data.broadcasting, data.attached);
        },

        /*//// Page Action Handlers ////*/

        _onPageActionRequestStatus: function() {
            this._pageActionPort.send(Constants.Messages.Plugin.STATUS, {
                status: _.extend({}, this._status)
            });
        }
    };

})(window.lodash, chrome, GSBot);