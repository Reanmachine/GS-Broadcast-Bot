/**
 * GS-Broadcaster Bot
 * ==================
 *
 * Module: Frontend.Bootstrapper
 *
 * The final script to be added to the user_script environment designed to kick it all off!
 */

if (!GSBot) {
    throw "GS-Broadcaster Bot cannot bootstrapp, GSBot object is missing.";
}

GSBot.environment = 'page';

// Signal we want the extension id, as we're going to be
// using the messaging API
GSBot.Utils.signalRequiresExtensionId();

// Wait for the GS Object, then continue
GSBot.Utils.spinWait(
    1000,
    function() {
        return window.GS &&
               window.GS.ready;
    },
    function() {
        window.GS.ready.done(function() {

            debugger;

            var plugin = GSBot.pluginInstance = new GSBot.Plugin();
            plugin.init();

        });
    }
);
