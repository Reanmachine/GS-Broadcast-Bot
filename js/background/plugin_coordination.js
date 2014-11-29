(function(_, chrome, GSBot) {

    var Constants = GSBot.Constants;
    var Background = GSBot.Background;

    var plugins = Background.plugins = {};

    /**
     * Gets a plugin for a certain tab, or creates one if none is available.
     *
     * @param tabId The tabId to make the plugin for.
     * @returns GSBot.PluginClient
     */
    var getPlugin = function(tabId) {
        if (!plugins[tabId]) {
            plugins[tabId] = new GSBot.PluginClient(tabId);
        }

        return plugins[tabId];
    };

    /**
     * Handle a new connection port from an external source.
     * @param port
     */
    var handleNewConnection = function (port) {

        var handlePort =
            port.name === Constants.Ports.PAGE ||
            port.name === Constants.Ports.PAGE_ACTION;

        if (!handlePort)
            return;

        var tabId = port.sender && port.sender.tab ? port.sender.tab.id : null;
        if (tabId === null) {
            GSBot.Utils.log('[Warn] Page/Page Action Port received without sender information!', true);
            return;
        }

        var plugin = getPlugin(tabId);
        if (!plugin) {
            return;
        }

        if (port.name === Constants.Ports.PAGE) {
            plugin.updatePagePort(port);
        }

        if (port.name === Constants.Ports.PAGE_ACTION) {
            plugin.updatePageActionPort(port);
        }

    };

    chrome.runtime.onConnect.addListener(handleNewConnection);
    chrome.runtime.onConnectExternal.addListener(handleNewConnection);


})(window.lodash, chrome, GSBot);