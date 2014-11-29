(function(_, chrome, GSBot) {

    var Constants = GSBot.Constants;

    /**
     * Background API Namespace
     */
    GSBot.BackgroundAPI = {

        enablePageAction: function(tabId) {
            chrome.pageAction.show(tabId);
        },

        disablePageAction: function(tabId) {
            chrome.pageAction.hide(tabId);
        }

    };

    GSBot.Background = Object.create(GSBot.BackgroundAPI);


})(window.lodash, chrome, GSBot);