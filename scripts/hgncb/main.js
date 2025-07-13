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
        },
        get_rank_text: function(player) {
            return (hg.ranks[player.name] ?? hg.ranks.default).text.join('\xa7r ') + '\xa7r '
        },
        get_rank_level: function(player) {
            return (hg.ranks[player.name] ?? hg.ranks.default).level
        },
        clog_prevent: function(target) {
            for (let tag of target.getTags()) {
                if (tag.startsWith('hgncb:minigame.')) {
                    let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                    if (game) {
                        switch (game.id) {
                            case 'pvp':
                                let in_combat = (s.system.currentTick - (target?.getDynamicProperty('hgncb:pvp.last_hit') ?? 0) < 300)
                                if (in_combat) {
                                    let attacker = hg.dimensions.overworld.getPlayers().find(p => p.id === (target?.getDynamicProperty('hgncb:pvp.combat_id') ?? 0))

                                    if (attacker && target && attacker.typeId === 'minecraft:player' && target.typeId === 'minecraft:player') {
                                        hg.minigames.find(m => m.id === 'pvp').methods.kill_trade(attacker, target)
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }
    },
    ranks: {
        default: {
            level: 0,
            text: [
                '\xa7i[\xa7eMember\xa7i]'
            ]
        },
        TensiveYT: {
            level: 4,
            text: [
                '\xa7i[\xa76Owner\xa7i]'
            ]
        },
        Sigmacrits:  {
            level: 2,
            text: [
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        Flash86555:  {
            level: 2,
            text: [
                '\xa7i[\xa7bMain Builder\xa7i]',
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        Dragonhunteron:  {
            level: 2,
            text: [
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        Snowy2655677:  {
            level: 2,
            text: [
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        'Frogger Splash5':  {
            level: 2,
            text: [
                '\xa7i[\xa7sOG\xa7i]',
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        RekeneiZsolt:  {
            level: 1,
            text: [
                '\xa7i[\xa7sOG\xa7i]',
                '\xa7i[\xa7bModerator\xa7i]'
            ]
        },
        greengoblin4791:  {
            level: 0,
            text: [
                '\xa7i[\xa7sOG\xa7i]'
            ]
        },
    },
    minigames: [
        {
            name: 'Hub',
            id: 'hub',
            permissions: {
                place_block: false,
                break_block: false,
                interact_with_block: false,
            },
            desc: 'hypergames hub',
            npcs: [
                {
                    text: 'PVP',
                    id: 'npc_pvp',
                    skin: 1,
                    location: {
                        x: 0.5,
                        y: 2.5,
                        z: 5.5
                    },
                    link: 'pvp',
                }
            ],
            methods: {

            },
            effects: [
                {
                    id: 'night_vision',
                    duration: 220,
                    amplifier: 255,
                    particles: false
                }
            ],
            location: {
                x: 0.5,
                y: 1,
                z: 0.5
            },
            on_enter: function(player) {
                hg.methods.clog_prevent(player)
                player.teleport(this.location, {
                    facingLocation: {
                        x: this.location.x,
                        y: this.location.y + 2,
                        z: this.location.z + 100
                    }
                })
                // add & remove tags
                for (let tag of player.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        player.removeTag(tag);
                    }
                }
                player.addTag('hgncb:minigame.hub');
            },
            on_tick: function() {

            },
            for_each_player: function(player) {
                if (!hg.methods.check_op(player)) {
                    player.setGameMode('Survival')
                }

                player.nameTag = hg.methods.get_rank_text(player) + player.name
                player.runCommand('clear @s[m=!c]')
            }
        },
        {
            name: 'PVP',
            id: 'pvp',
            permissions: {
                place_block: false,
                break_block: false,
                interact_with_block: false,
            },
            desc: 'The PVP minigame.',
            npcs: [
                
            ],
            methods: {
                kill_trade: function(attacker, target) {
                    if (attacker?.id !== target?.id && attacker?.getGameMode() !== 'Creative' && target?.getGameMode() !== 'Creative') {
                        let attacker_kills  = attacker?.getDynamicProperty('hgncb:pvp.kills') ?? 0
                        let attacker_deaths = attacker?.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                        let target_kills    = target?.getDynamicProperty('hgncb:pvp.kills') ?? 0
                        let target_deaths   = target?.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                        let attacker_health = attacker?.getComponent('minecraft:health')
                        let target_health = target?.getComponent('minecraft:health')
                        attacker?.setDynamicProperty('hgncb:pvp.kills', attacker_kills + 1)
                        target?.setDynamicProperty('hgncb:pvp.deaths', target_deaths + 1)
                        s.system.run(() => attacker_health.resetToMaxValue())
                        s.system.run(() => hg.dimensions.overworld.runCommand('playsound note.bell @a[tag="hgncb:minigame.pvp"] 1000 108 0 1 1 1'))
                        attacker?.setDynamicProperty('hgncb:pvp.last_hit', undefined)
                        target?.setDynamicProperty('hgncb:pvp.last_hit', undefined)
                        attacker?.setDynamicProperty('hgncb:pvp.combat_id', undefined)
                        target?.setDynamicProperty('hgncb:pvp.combat_id', undefined)
                    } else {
                        let target_kills    = target?.getDynamicProperty('hgncb:pvp.kills') ?? 0
                        let target_deaths   = target?.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                        target?.setDynamicProperty('hgncb:pvp.deaths', target_deaths + 1)
                        s.system.run(() => hg.dimensions.overworld.runCommand('playsound note.bell @a[tag="hgncb:minigame.pvp"] 1000 108 0 1 1 1'))

                        target?.setDynamicProperty('hgncb:pvp.last_hit', undefined)
                        target?.setDynamicProperty('hgncb:pvp.combat_id', undefined)
                    }
                }
            },
            effects: [
                {
                    id: 'night_vision',
                    duration: 220,
                    amplifier: 255,
                    particles: false
                },
                {
                    id: 'saturation',
                    duration: 220,
                    amplifier: 255,
                    particles: false
                }
            ],
            location: {
                x: 1000.5,
                y: 101,
                z: 0.5
            },
            on_enter: function(player) {
                player.teleport(this.location, {
                    facingLocation: {
                        x: this.location.x,
                        y: this.location.y + 2,
                        z: this.location.z + 100
                    }
                })
                // add & remove tags
                for (let tag of player.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        player.removeTag(tag);
                    }
                }
                player.addTag('hgncb:minigame.pvp');
            },
            on_tick: function() {
                
            },
            for_each_player: function(player) {
                if (!hg.methods.check_op(player)) {
                    player.setGameMode('Survival')
                }
                let health = player.getComponent('minecraft:health')
                let health_percentage = (health.currentValue / health.effectiveMax) * 100
                let health_color = (() => {
                    if (health_percentage >= 100 || (health_percentage < 100 && health_percentage >= 75))
                        return '\xa7a'
                    else if (health_percentage < 75 && health_percentage >= 50)
                        return '\xa7e'
                    else if (health_percentage < 50 && health_percentage >= 25)
                        return '\xa76'
                    else if (health_percentage < 25 && health_percentage >= 0)
                        return '\xa7c'
                    else
                        return '\xa7c'
                })();
                player.nameTag = hg.methods.get_rank_text(player) + player.name + `\n${player.getGameMode() === 'Creative' ? '\xa7i\xa7oIn creative mode' : `${health_color}${health_percentage.toFixed(2)}\xa7r%`}`
                let kills  = player.getDynamicProperty('hgncb:pvp.kills') ?? 0
                let deaths = player.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                let kdr_a = deaths === 0 ? kills : (kills ?? 0) / (deaths ?? 0)
                let kdr_b = isNaN(kdr_a) ? 0 : kdr_a
                let combat = Math.max((300 - (s.system.currentTick - (player.getDynamicProperty('hgncb:pvp.last_hit') ?? 0))) / 20, 0)
                player.onScreenDisplay.setActionBar([
                    `\xa7aKills\xa7f: ${kills}\n`,
                    `\xa7cDeaths\xa7f: ${deaths}\n`,
                    `\xa7bKDR\xa7f: ${kdr_b.toFixed(3)}\n`,
                    combat > 0 ? `\xa7iCombat\xa7f: ${combat.toFixed(2)}\n` : `\xa7i\xa7oYou are not in combat.`,
                ])

                if (player.getGameMode() !== 'Creative') {
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_sword     }] run give @s[tag="hgncb:minigame.pvp"] iron_sword    1 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_axe       }] run give @s[tag="hgncb:minigame.pvp"] iron_axe      1 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=bow            }] run give @s[tag="hgncb:minigame.pvp"] bow           1 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=cooked_beef    }] run give @s[tag="hgncb:minigame.pvp"] cooked_beef  64 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=golden_apple   }] run give @s[tag="hgncb:minigame.pvp"] golden_apple 64 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_helmet    }] run replaceitem entity @s[tag="hgncb:minigame.pvp"] slot.armor.head      0 iron_helmet     1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_chestplate}] run replaceitem entity @s[tag="hgncb:minigame.pvp"] slot.armor.chest     0 iron_chestplate 1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_leggings  }] run replaceitem entity @s[tag="hgncb:minigame.pvp"] slot.armor.legs      0 iron_leggings   1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_boots     }] run replaceitem entity @s[tag="hgncb:minigame.pvp"] slot.armor.feet      0 iron_boots      1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=shield         }] run replaceitem entity @s[tag="hgncb:minigame.pvp"] slot.weapon.offhand  0 shield          1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                    player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=arrow          }] run replaceitem entity @s[tag="hgncb:minigame.pvp"] slot.inventory       0 arrow          64 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                }
            }
        }
    ],
    debug: {
        run_thru: function(v) {
            return eval(v);
        }
    },
    command_prefix: '!',
    listeners: {
        before_events: {
            chatSend: function(e) {
                e.cancel = true; // cancel the chat message
                if (e.message.startsWith(hg.command_prefix)) {
                    let a = e.message.split(' '),
                        b = a[0]?.trim()?.toLowerCase(),
                        c = a[1]?.trim()?.toLowerCase();

                    let cmd = hg.commands.find(cmd => `${hg.command_prefix}${cmd.name}` === b) // stupid way of doing this, but it works
                    if (cmd) {
                        s.system.run(() => {
                            if (cmd.requires_op && !hg.methods.check_op(e.sender)) { // check if the command requires op and if the player is op
                                e.sender.sendMessage(`\xa7cYou don\'t have permission to use this command\xa7f!`);
                                return;
                            }
                            cmd.func(a, e.sender) // run the command
                        })
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

                    s.world.sendMessage(`${hg.methods.get_rank_text(e.sender)}${e.sender.name} \xa7i»\xa7r ${e.message}`) // send the message globally
                }
            },
            playerLeave: function(e) {
                let target = e.player
                hg.methods.clog_prevent(target)
            },
            playerBreakBlock: function(e) {
                // runs when a player breaks a block
                let player = e.player;
                for (let tag of player.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                        if (game && !game.permissions.break_block && player.getGameMode() !== 'Creative') {
                            e.cancel = true; // cancel the event
                            s.system.currentTick - player.getDynamicProperty('hgncb:info.last_perm_info') > 10 ? player.sendMessage(`\xa7bInfo \xa7i»\xa7r \xa7fYou can\'t break blocks in this area\xa7i.`) : void 0;
                            s.system.currentTick - player.getDynamicProperty('hgncb:info.last_perm_info') > 10 ? player.setDynamicProperty('hgncb:info.last_perm_info', s.system.currentTick) : void 0;
                            return;
                        }
                    }
                }
            },
            playerPlaceBlock: function(e) {
                // runs when a player places a block
                let player = e.player;
                for (let tag of player.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                        if (game && !game.permissions.place_block && player.getGameMode() !== 'Creative') {
                            e.cancel = true; // cancel the event
                            s.system.currentTick - player.getDynamicProperty('hgncb:info.last_perm_info') > 10 ? player.sendMessage(`\xa7bInfo \xa7i»\xa7r \xa7fYou can\'t place blocks in this area\xa7i.`) : void 0;
                            s.system.currentTick - player.getDynamicProperty('hgncb:info.last_perm_info') > 10 ? player.setDynamicProperty('hgncb:info.last_perm_info', s.system.currentTick) : void 0;
                            return;
                        }
                    }
                }
            },
            playerInteractWithBlock: function(e) {
                // runs when a player interacts with a block
                let player = e.player;
                for (let tag of player.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                        if (game && !game.permissions.interact_with_block && player.getGameMode() !== 'Creative') {
                            e.cancel = true; // cancel the event
                            s.system.currentTick - player.getDynamicProperty('hgncb:info.last_perm_info') > 10 ? player.sendMessage(`\xa7bInfo \xa7i»\xa7r \xa7fYou can\'t interact with blocks in this area\xa7i.`) : void 0;
                            s.system.currentTick - player.getDynamicProperty('hgncb:info.last_perm_info') > 10 ? player.setDynamicProperty('hgncb:info.last_perm_info', s.system.currentTick) : void 0;
                            return;
                        }
                    }
                }
            }
        },
        after_events: {
            playerSpawn: function(e) {
                // runs when a player spawns
                if (e.initialSpawn) {
                    // sends players who joined the game to the hub
                    let player = e.player;
                        player.sendMessage(`\xa7bWelcome to HyperGames NCB\xa7f! \xa7i- \xa7f(\xa7b${hg.ver}\xa7f)`);
                    let hub = hg.minigames.find(g => g.id === 'hub');
                    hub.on_enter(player); // teleport the player to the hub
                }
            },
            projectileHitEntity: function(e) {
                let attacker = e.source;
                let target = e.getEntityHit().entity;

                if (attacker?.id !== target?.id && attacker?.typeId === 'minecraft:player') {
                    attacker?.playSound('random.orb', {
                        pitch: 0.5,
                        volume: 1.0
                    })
                    attacker?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)
                    target?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)

                    attacker?.setDynamicProperty('hgncb:pvp.combat_id', target.id)
                    target?.setDynamicProperty('hgncb:pvp.combat_id', attacker.id)
                }
            },
            entityHitEntity: function(e) {
                let attacker = e.damagingEntity;
                let target = e.hitEntity;

                if (attacker?.typeId === 'minecraft:player' && target?.typeId === 'minecraft:player') {
                    attacker?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)
                    target?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)

                    attacker?.setDynamicProperty('hgncb:pvp.combat_id', target.id)
                    target?.setDynamicProperty('hgncb:pvp.combat_id', attacker.id)
                }
            },
            entityDie: function(e) {
                let attacker = e.damageSource.damagingEntity;
                let target = e.deadEntity;

                if (!attacker && target && target.typeId === 'minecraft:player')
                    hg.methods.clog_prevent(target)
                if (attacker && target && attacker.typeId === 'minecraft:player' && target.typeId === 'minecraft:player')
                    for (let tag of attacker.getTags()) {
                        if (tag.startsWith('hgncb:minigame.')) {
                            let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                            if (game) {
                                switch (game.id) {
                                    case 'pvp':
                                        hg.minigames.find(m => m.id === 'pvp').methods.kill_trade(attacker, target)
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
            }
        }
    },
    listeners_system: {
        before_events: {
            
        },
        after_events: {
            
        }
    },
    on_tick: function() {
        s.system.runInterval(() => {
            // runs every game tick

            for (let player of s.world.getPlayers()) {
                if (typeof player !== 'undefined') {
                    let props = player.getDynamicPropertyIds()

                    for (let prop of props)
                        if (prop.startsWith('hgncb:timer.'))
                            player.getDynamicProperty(prop) > 0 ? player.setDynamicProperty(prop, player.getDynamicProperty(prop) - 1) : void 0;
                    
                    
                    player.runCommand(`title @a times 0 60 20`);
                    player.commandPermissionLevel = hg.methods.get_rank_level(player)
                    let tags = player.getTags();

                    for (let tag of tags) {
                        if (tag.startsWith('hgncb:transfer.')) {
                            let id = tag.replace('hgncb:transfer.', '')
                            let game = hg.minigames.find(g => g.id === id);

                            if (game) {
                                game.on_enter(player)
                                player.removeTag(tag)
                            } else {
                                s.world.sendMessage(`\xa7cERROR \xa7f- \xa7fCould not find minigame \'${id}\'`); // send an error message
                            }
                        }
                        if (tag.startsWith('hgncb:minigame.')) {
                            let id = tag.replace('hgncb:minigame.', '')
                            let game = hg.minigames.find(g => g.id === id);

                            if (game) {
                                for (let effect of game.effects) {
                                    player.addEffect(effect.id, effect.duration, {
                                        amplifier: effect.amplifier,
                                        showParticles: effect.particles
                                    })
                                }

                                player.setSpawnPoint({
                                    dimension: hg.dimensions.overworld,
                                    x: game.location.x,
                                    y: game.location.y,
                                    z: game.location.z
                                })
                            }
                            game.for_each_player(player)
                        }
                    }
                    if (tags.filter(t => t.startsWith('hgncb:minigame.')).length > 1) {
                        player.sendMessage('\xa7cWe\'ve detected that you\'re in multiple minigames at once! Sending you to the Hub...')
                        hg.minigames.find(m => m.id === 'hub').on_enter(player)
                    }
                }
            }

            for (let game of hg.minigames) {
                game.on_tick();
                for (let npc_data of game.npcs) {
                    if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${game.id}`] }).length <= 0) {
                        let npc = hg.dimensions.overworld.spawnEntity('minecraft:npc', npc_data.location);
                        let npc_comp = npc.getComponent('minecraft:npc')
                        let player_count = hg.dimensions.overworld.getPlayers({
                            tags: [`hgncb:minigame.${npc.link}`]
                        }).length
                        npc_comp.name = `\xa7b${npc_data.text}\xa7r\n\xa7i\xa7o${player_count} players`
                        npc_comp.skinIndex = npc_data.skin
                        npc.addTag(`hgncb:npc.${game.id}`)
                        npc.teleport(npc_data.location, {
                            facingLocation: { x: 0, y: 2, z: 0 }
                        })
                    }
                }
            }
        })
    },
    on_load: function() {
        // runs when the script is loaded
        s.world.sendMessage(`\xa7bHyperGames \xa7f-\xa7e Script reloaded!`);
    }
}

s.world.afterEvents.worldLoad.subscribe(() => {
    for (let key of Object.keys(hg.listeners.before_events)) {
        s.world.beforeEvents[key].subscribe(hg.listeners.before_events[key]);
    }
    for (let key of Object.keys(hg.listeners.after_events)) {
        s.world.afterEvents[key].subscribe(hg.listeners.after_events[key]);
    }
    for (let key of Object.keys(hg.listeners_system.before_events)) {
        s.system.beforeEvents[key].subscribe(hg.listeners_system.before_events[key]);
    }
    for (let key of Object.keys(hg.listeners_system.after_events)) {
        s.system.afterEvents[key].subscribe(hg.listeners_system.after_events[key]);
    }
    hg.dimensions = {
        overworld: s.world.getDimension('minecraft:overworld'),
        nether: s.world.getDimension('minecraft:nether'),
        the_end: s.world.getDimension('minecraft:the_end')
    }
    hg.commands = [
        {
            name: 'help',
            desc: 'Shows all of the available commands.',
            requires_op: false,
            func: function(a, player) {
                try {
                    let
                        b = a[0]?.trim()?.toLowerCase(),
                        c = a[1]?.trim()?.toLowerCase()
                    if (c) {
                        let cmd = hg.commands.find(cmd => `${hg.command_prefix}${cmd.name}` === c || `${cmd.name}` === c);
                        player.sendMessage(`\xa7f${hg.command_prefix}\xa7e${cmd.name}\xa7f - \xa7i\xa7o${cmd.desc}\xa7r`);
                        cmd.send_usage(player); // send the usage of the command
                    } else {
                        let msg = '\xa7eCommands\xa7f:'
                        let msgop = '\xa7eOperator Commands\xa7f:'
                        for (let command of hg.commands.filter(cmd => !cmd.requires_op)) {
                            msg += `\n    \xa7f!\xa7e${command.name} \xa7i- \xa7i\xa7o${command.desc}\xa7r`;
                        }
                        for (let command of hg.commands.filter(cmd => cmd.requires_op)) {
                            msgop += `\n    \xa7f!\xa7e${command.name} \xa7i- \xa7i\xa7o${command.desc}\xa7r`;
                        }
                        player.sendMessage(`${msg}${hg.methods.check_op(player) ? '\n' + msgop : ''}`);
                    }
                } catch (e) {
                    s.world.sendMessage(`\xa7cERROR \xa7f- \xa7f${e.message}`); // send an error message
                }
            }
        },
        {
            name: 'hub',
            desc: 'Sends you to the Hub.',
            requires_op: false,
            func: function(a, player) {
                try {
                    let hub = hg.minigames.find(g => g.id === 'hub');
                    hub.on_enter(player); // teleport the player to the hub
                } catch (e) {
                    s.world.sendMessage(`\xa7cERROR \xa7f- \xa7f${e.message}`); // send an error message
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
                if (!c || c === '') {
                    player.sendMessage(`\xa7cPlease specify a debug command\xa7f!`);
                    return;
                }
                switch (c) {
                    case 'eval':
                        // evaluate javascript code
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
                            player.sendMessage(`\xa7cerror\xa7f: \xa7f${e}`);
                        }
                        break;
                    default:
                        player.sendMessage(`\xa7cNo such debug command \xa7f\'!\xa7c${b.replace(hg.command_prefix, '')} ${c}\xa7f\'\xa7f!`);
                        break;
                }
            }
        }
    ];
    hg.on_load();
    hg.on_tick();
})