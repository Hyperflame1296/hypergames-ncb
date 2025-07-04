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
    minigames: [
        {
            name: 'Hub',
            id: 'hub',
            desc: 'hgHub',
            on_enter: function(player) {
                player.teleport({
                    x: 0,
                    y: 1,
                    z: 0
                }, {
                    facingLocation: {
                        x: 0,
                        y: 2,
                        z: 100
                    }
                })
            },
            on_tick: function(player) {

            }
        }
    ],
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

                for (let i = 0; i < 100; i++) { // clear the chat by sending a bunch of empty messages
                    s.world.sendMessage(' ');
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
                } else {
                    // 100 max characters
                    if (e.message.length > 100) {
                        e.sender.sendMessage(`\xa7cYou can\'t send a message that long\xa7f! \xa7f(\xa7c${e.message.length} \xa7f>\xa7c 100\xa7f)`)
                        return;
                    } 
                    // makes it so you can't use §k in chat
                    if (e.message.includes('\xa7k')) {
                        e.sender.sendMessage(`\xa7cYou can\'t use that formatting code in chat\xa7f!`)
                        return;
                    }

                    s.world.sendMessage(`${e.sender.name} \xa7i»\xa7r ${e.message}`) // send the message globally
                }
            },
        },
        after_events: {
            playerSpawn: function(e) {
                // runs when a player spawns
                let player = e.player;
                    player.sendMessage(`\xa7bWelcome to HyperGames NCB\xa7f! \xa7i- \xa7f(\xa7b${hg.ver}\xa7f)`);
                let game = hg.minigames.find(g => g.id === 'hub');
                game.on_enter(player); // teleport the player to the hub
            }
        }
    },
    on_tick: function() {
        s.system.runInterval(() => {
            // runs every game tick

            for (let player of s.world.getPlayers()) {
                player.runCommand(`title @a times 0 60 20`); // set a scoreboard value for the player
                player.onScreenDisplay.setActionBar(`hypergames - ${hg.ver}`)
            }

            for (let game of hg.minigames) {
                game.on_tick();
            }
        })
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
    hg.on_tick();
})