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
        return window.GS !== undefined;
    },
    function() {
        window.GS.ready.done(function() {
            alert('GrooveShark Object is Ready.');
        });
    }
);
