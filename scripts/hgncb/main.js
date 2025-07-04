import * as s  from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import * as gt from '@minecraft/server-gametest';

/*
    hypergames ncb0.1.0
    probably not gonna be finished for a while
*/

let hg = {
    ver: 'ncb0.1.0',
    methods: {

    },
    minigames: {

    },
    debug: {
        run_thru: function(v) {
            eval(v);
        }
    },
    command_prefix: '!',
    commands: [
        {
            name: 'help',
            desc: 'Shows all of the available commands',
            requires_op: false,
            run: function(a) {
                let
                    b = a[0]?.trim().toLowerCase(),
                    c = a[1]?.trim().toLowerCase()

                if (b) {
                    let cmd = hg.commands.find(cmd => cmd.name === b);
                    console.log(cmd)
                }
            }
        }
    ],
    listeners: {
        before_events: {
            chatSend: function(e) {
                e.cancel = true; // cancel the chat message

                s.world.sendMessage(`${e.sender.name} \xa7i»\xa7r ${e.message}`) // put a new one in it's place
            }
        },
        after_events: {

        }
    },
    on_tick: function() {
        // runs every game tick
    },
    on_load: function() {
        // runs when the script is loaded
        s.world.sendMessage(`script reloaded!`);
    }
}

s.world.afterEvents.worldLoad.subscribe(() => {
    for (let key of Object.keys(hg.listeners.before_events)) {
        s.world.beforeEvents[key].subscribe(hg.listeners.before_events[key]);
    }
    for (let key of Object.keys(hg.listeners.after_events)) {
        s.world.afterEvents[key].subscribe(hg.listeners.after_events[key]);
    }
    hg.on_load();
})