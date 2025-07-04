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
        check_op: function(player) { // wrap the operator check, to make things easier
            if (player.commandPermissionLevel >= 2) return true;
            return false
        }
    },
    minigames: {

    },
    debug: {
        run_thru: function(v) {
            return eval(v);
        }
    },
    command_prefix: '!',
    commands: [
        {
            name: 'help',
            desc: 'Shows all of the available commands.',
            requires_op: false,
            func: function(a, player) {
                let
                    b = a[0]?.trim()?.toLowerCase(),
                    c = a[1]?.trim()?.toLowerCase()
                if (c) {
                    let cmd = hg.commands.find(cmd => `!${cmd.name}` === b);
                } else {
                    let msg = '\xa7bCommands\xa7f:'
                    let msgop = '\xa7bOperator Commands\xa7f:'
                    for (let command of hg.commands) {
                        if (command.requires_op && !hg.methods.check_op(player)) continue; // skip commands that require op
                        msg += `\n    \xa7f!\xa7b${command.name} \xa7i- \xa7i\xa7o${command.desc}\xa7r`;
                    }
                    for (let command of hg.commands.filter(cmd => cmd.requires_op)) {
                        msgop += `\n    \xa7f!\xa7b${command.name} \xa7i- \xa7i\xa7o${command.desc}\xa7r`;
                    }
                    player.sendMessage(`${msg}${hg.methods.check_op(player) ? '\n' + msgop : ''}`);
                }
            }
        },
        {
            name: 'clear_chat',
            desc: 'Clears the chat.',
            requires_op: true,
            func: function(a, player) {
                let
                    b = a[0]?.trim()?.toLowerCase(),
                    c = a[1]?.trim()?.toLowerCase()

                for (let i = 0; i < 256; i++) { // clear the chat by sending a bunch of empty messages
                    s.world.sendMessage('');
                }
                s.world.sendMessage(`\xa7i\xa7o${player.name} has cleared the chat.`);
            }
        },
        {
            name: 'debug',
            desc: 'Debug options.',
            requires_op: true,
            func: function(a, player) {
                let
                    b = a[0]?.trim()?.toLowerCase(),
                    c = a[1]?.trim()?.toLowerCase(),
                    input = a.slice(2).join(' ')
                
                switch (c) {
                    case 'eval':
                        try {
                            let out = hg.debug.run_thru(input);
                            let res = (function(o) {
                                if (o === undefined || o === null)
                                    return '\xa7iundefined\xa7r';

                                if (typeof o === 'object')
                                    return JSON.stringify(o, null, 4);

                                if (typeof o === 'function')
                                    return o.toString();

                                if (typeof o === 'string')
                                    return o;

                                if (typeof o === 'number')
                                    return o.toString();

                                if (typeof o === 'boolean')
                                    return o ? 'true' : 'false';

                                return o.toString();
                            })(out)
                            player.sendMessage('» ' + res)
                        } catch (e) {
                            player.sendMessage(`\xa7cerror: \xa7f${e}`);
                        }
                        break;
                    default:
                        player.sendMessage(`\xa7cNo such debug command \xa7f\'!\xa7c${b.replace(hg.command_prefix, '')} ${c}\xa7f\'\xa7f!`);
                        return;
                }
            }
        }
    ],
    listeners: {
        before_events: {
            chatSend: function(e) {
                e.cancel = true; // cancel the chat message
                if (e.message.startsWith(hg.command_prefix)) {
                    let a = e.message.split(' '),
                        b = a[0]?.trim()?.toLowerCase(),
                        c = a[1]?.trim()?.toLowerCase();

                    let cmd = hg.commands.find(cmd => `!${cmd.name}` === b) // stupid way of doing this, but it works
                    if (cmd) {
                        cmd.func(a, e.sender) // run the command
                    } else
                        e.sender.sendMessage(`\xa7cNo such command \xa7f\'!\xa7c${b.replace(hg.command_prefix, '')}\xa7f\'\xa7f!`); // send a message to the player that the command doesn't exist
                } else
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