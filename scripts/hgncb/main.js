import * as s   from '@minecraft/server';
import * as ui  from '@minecraft/server-ui';
import * as gt  from '@minecraft/server-gametest';
import * as cmn from '@minecraft/common';
import * as dbg from '@minecraft/debug-utilities';
import * as cui from './modules/chest_ui/forms.js';
import      b64 from './b64.js'

/*
    hypergames ncb v0.2.2
    probably not gonna be finished for a while
*/
let hg = {
    ver: 'v0.2.2',
    rules: [
        '    #\xa7b1 \xa7f- \xa7bNo spamming\xa7f.',
        '    #\xa7b2 \xa7f- \xa7bNo ragebaiting\xa7f.',
        '    #\xa7b3 \xa7f- \xa7bNo hacking\xa7f.',
        '    #\xa7b4 \xa7f- \xa7bNo cheating of any kind\xa7f.',
        '    #\xa7b5 \xa7f- \xa7bNo hacked skins of any kind\xa7f.',
        '    #\xa7b6 \xa7f- \xa7bNo brainrot or inappropriate stuff\xa7f.',
        '    #\xa7b7 \xa7f- \xa7bDo not abuse glitches\xa7f.',
        '    #\xa7b8 \xa7f- \xa7bDo not ask for op\xa7f. \xa7i\xa7oI\'m honestly so sick of it...',
        '    #\xa7b9 \xa7f- \xa7bDo not roleplay\xa7f. \xa7i\xa7oNo, seriously. This is not a joke.',
        '\xa7f---\xa7bMINIGAME-SPECIFIC RULES\xa7f---',
        '    \xa7bKitPVP\xa7f:',
        '        #\xa7b10 \xa7f- \xa7bNo teaming of any kind\xa7f.',
        '        #\xa7b11 \xa7f- \xa7bNo spawnkilling\xa7f.',
        '\xa7f---\xa7bADMIN RULES\xa7f---',
        '    #\xa7b12 \xa7f- \xa7bNo admin abuse\xa7f.',
        '    #\xa7b13 \xa7f- \xa7bDo not interfere with games unless given permission by the owner\xa7f.',
        '    #\xa7b14 \xa7f- \xa7bDo not kick people without giving them warnings\xa7f.',
        '    #\xa7b15 \xa7f- \xa7bIf someone accuses another person of doing something against the rules, you must first verify if they are telling the truth\xa7f.'
    ],
    methods: {
        check_op: function(player) { // wrap the operator check, to make things easier
            try {
                if (player.commandPermissionLevel >= 2) return true;
                return false;
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                return false;
            }
        },
        get_rank_text: function(player) {
            try {
                return (hg.ranks[player.name] ?? hg.ranks.default).text.join('\xa7r ') + '\xa7r '
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                return hg.ranks.default
            }
        },
        get_rank_level: function(player) {
            try {
                return (hg.ranks[player.name] ?? hg.ranks.default).level
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                return 0;
            }
        },
        parse_bool: function(x='') {
            try {
                if (x.startsWith?.('true' )) return true;
                if (x.startsWith?.('false')) return false;
                return;
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                return;
            }
        },
        get_time: function(o=-4) {
            try {
                let now = new Date();
                let utc = now.getTime() + now.getTimezoneOffset() * 60000;
                let local = new Date(utc + o * 3600000);

                let hours = local.getUTCHours();
                let minutes = local.getUTCMinutes().toString().padStart(2, '0');
                let seconds = local.getUTCSeconds().toString().padStart(2, '0');

                let  ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;

                return `${hours}:${minutes}:${seconds} ${ampm}`;
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
            }
        },
        get_rot: function(from, to) {
            let dx = to.x - from.x;
            let dy = to.y - from.y;
            let dz = to.z - from.z;

            // Yaw (rotation around Y axis - horizontal)
            let yaw = Math.atan2(-dx, -dz) * (180 / Math.PI);

            // Distance in horizontal plane (XZ)
            let horizontalDistance = Math.sqrt(dx * dx + dz * dz);

            // Pitch (rotation around X axis - vertical)
            let pitch = Math.atan2(dy, horizontalDistance) * (180 / Math.PI);

            return {x: pitch, y: yaw};
        },
        clog_prevent: function(target, method) {
            try {
                for (let tag of target.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                        if (game) {
                            switch (game.id) {
                                case 'kitpvp':
                                    let combat_timer = Math.max((target.getDynamicProperty('hgncb:timer.kitpvp.combat') ?? 0), 0)
                                    let in_combat = (combat_timer > 0)
                                    if (in_combat) {
                                        let attacker = hg.dimensions.overworld.getPlayers().find(p => p.id === (target?.getDynamicProperty('hgncb:kitpvp.combat_id') ?? 0))

                                        if (attacker && target && attacker.typeId === 'minecraft:player' && target.typeId === 'minecraft:player') {
                                            game.methods.kill_trade(attacker, target, method ?? 'clogPrevent')
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
            }
        },
        diff_death: function(target, method='contact') {
            try {
                for (let tag of target.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                        if (game) {
                            switch (game.id) {
                                case 'kitpvp':
                                    let combat_timer = Math.max((target.getDynamicProperty('hgncb:timer.kitpvp.combat') ?? 0), 0)
                                    let in_combat = (combat_timer > 0)
                                    let attacker = hg.dimensions.overworld.getPlayers().find(p => p.id === (target?.getDynamicProperty('hgncb:kitpvp.combat_id') ?? 0))
                                    if (target && target.typeId === 'minecraft:player') {
                                        game.methods.kill_trade(in_combat ? attacker : undefined, target, method)
                                    }
                                    break;
                                case 'random_events':
                                    game.methods.player_die(undefined, target, method)
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
            }
        },
        global_death_handle: function(attacker, target, method) {
            try {
                for (let tag of target.getTags()) {
                    if (tag.startsWith('hgncb:minigame.')) {
                        let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                        if (game) {
                            switch (game.id) {
                                case 'kitpvp':
                                    game.methods.kill_trade(attacker, target, method)
                                    break;
                                case 'random_events':
                                    game.methods.player_die(attacker, target, method)
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
            }
        },
        death_message: function(attacker, target, method, filter) {
            try {
                for (let player of hg.dimensions.overworld.getPlayers(filter)) {
                    switch (method) {
                        case 'anvil':
                            attacker && attacker.isValid ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling anvil whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling anvil`)
                            break;
                        case 'blockExplosion':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas killed by [Intentional Game Design] due to \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas killed by [Intentional Game Design]`)
                            break;
                        case 'campfire':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwalked into a campfire whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwalked into a campfire`)
                            break;
                        case 'clogPrevent':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7icombat logged to \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7icombat logged`)
                            break;
                        case 'contact':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas slain by \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas slain`)
                            break;
                        case 'drowning':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idrowned whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idrowned`)
                            break;
                        case 'entityAttack':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas slain by \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas slain`)
                            break;
                        case 'entityExplosion':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas blown up by \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iblew up`)
                            break;
                        case 'fall':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7ifell from a high place whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7ifell from a high place`)
                            break;
                        case 'fallingBlock':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling block whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling block`)
                            break;
                        case 'fire':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwalked into fire whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwent up in flames`)
                            break;
                        case 'fireTick':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iburned to death whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iburned to death`)
                            break;
                        case 'fireworks':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwent off with a bang whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwent off with a bang`)
                            break;
                        case 'fly_into_wall':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iexperienced kinetic energy whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iexperienced kinetic energy`)
                            break;
                        case 'freezing':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7ibecame an ice block whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7ifroze to death`)
                            break;
                        case 'lava':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7itried to swim in lava to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                                :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7itried to swim in lava`)
                            break;
                        case 'lightning':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas struck by lightning whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                                :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas struck by lightning`)
                            break;
                        case 'maceSmash':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas smashed by \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas smashed`)
                            break;
                        case 'magic':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas killed by \xa7f${attacker.name ?? `%${attacker.localizationKey}`}\xa7i using magic`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas killed by magic`)
                            break;
                        case 'magma':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwalked into danger zone whilst trying to escape \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idiscovered floor was lava`)
                            break;
                        case 'none':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idied because of \xa7f${attacker.name ?? `%${attacker.localizationKey}`}\xa7i`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'override':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idied because of \xa7f${attacker.name ?? `%${attacker.localizationKey}`}\xa7i`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'piston':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas squashed by a piston due to \xa7f${attacker.name ?? `%${attacker.localizationKey}`}\xa7i.`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas squashed by a piston`)
                            break;
                        case 'projectile':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas shot by \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas shot`)
                            break;
                        case 'sonicBoom':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas obliterated by \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7iwas obliterated`)
                            break;
                        case 'void':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7ididn\'t want to live in the same world as \xa7f${attacker.name ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7ifell out of the world`)
                            break;
                        default:
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idied because of \xa7f${attacker.name ?? `%${attacker.localizationKey}`}\xa7i`)
                            :
                                player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                    }
                }
            } catch (err) {
                s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
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
                '\xa7i[\xa7cY\xa7iT\xa7i]',
                '\xa7i[\xa76Owner\xa7i]'
            ]
        },
        Sigmacrits:  {
            level: 2,
            text: [
                '\xa7i[\xa7sOG\xa7i]',
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        Flash86555:  {
            level: 2,
            text: [
                '\xa7i[\xa7cD\xa7vE\xa76E \xa7eF\xa76L\xa7vA\xa7cS\xa74H\xa7i]',
                '\xa7i[\xa7eMain Builder\xa7i]',
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        Dragonhunteron:  {
            level: 2,
            text: [
                '\xa7i[\xa7bBuilder\xa7i]',
                '\xa7i[\xa7uE\xa7dn\xa75d\xa7de\xa7ur \xa7uD\xa75r\xa7ua\xa7dg\xa7uo\xa75n\xa7i]', // Ender Dragon
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        Snowy2655677:  {
            level: 2,
            text: [
                '\xa7i[\xa7sOG\xa7i]',
                '\xa7i[\xa7aAdmin\xa7i]'
            ]
        },
        HyperFlamee8:  {
            level: 2,
            text: [
                '\xa7i[\xa7tAlt Account\xa7i]',
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
        MarzzMC4164:  {
            level: 0,
            text: [
                '\xa7i[\xa7cY\xa7iT\xa7i]',
                '\xa7i[\xa7sTrue OG\xa7i]',
            ]
        },
        greengoblin4791:  {
            level: 0,
            text: [
                '\xa7i[\xa7sOG\xa7i]'
            ]
        },
        ryanrocks1111:  {
            level: 0,
            text: [
                '\xa7i[\xa7sOG\xa7i]'
            ]
        },
        RekeneiZsolt:  {
            level: 0,
            text: [
                '\xa7i[\xa7cY\xa7iT\xa7i]',
                '\xa7i[\xa7sOG\xa7i]',
            ]
        }
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
                    text: 'KitPVP',
                    id: 'npc_kitpvp',
                    skin: 0,
                    location: {
                        x: -3.5,
                        y: 2.0,
                        z: 17.5
                    },
                    link: 'kitpvp',
                },
                {
                    text: 'Random Events',
                    id: 'npc_random_events',
                    skin: 1,
                    location: {
                        x: 0.5,
                        y: 2.0,
                        z: 17.5
                    },
                    link: 'random_events',
                }
            ],
            properties: {
                
            },
            methods: {

            },
            effects: [
                {
                    id: 'night_vision',
                    duration: 220,
                    amplifier: 255,
                    particles: false
                },
                {
                    id: 'instant_health',
                    duration: 60,
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
                x: 0.5,
                y: 3,
                z: 0.5
            },
            on_enter: function(player) {
                try {
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
                    player.setGameMode('Survival')
                    player.setDynamicProperty('hgncb:kitpvp.selected_kit', undefined)
                    player.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                    player.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
                    player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                    player.runCommand('effect @s clear')
                    player.addTag(`hgncb:minigame.${this.id}`);
                    player.addTag(`hgncb:random_events.dead`);

                    player.inputPermissions.setPermissionCategory(1, true)
                    player.inputPermissions.setPermissionCategory(2, true)
                } catch (err) {
                    s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                }
            },
            on_tick: function() {

            },
            for_each_player: function(player) {
                if (player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Survival')
                    player.setGameMode('Survival')
                player.nameTag = hg.methods.get_rank_text(player) + player.name
                player.runCommand('clear @s[m=!c]')

                player.onScreenDisplay.setActionBar([
                    `\xa7bWelcome to HyperGames!\n`,
                    `\xa7bDiscord\xa7f: \xa7ohttps://discord.gg/R5z3R3wd9h\xa7r\n`,
                    `\xa7bYoutube\xa7f: \xa7ohttps://www.youtube.com/@Hyperflamee8\xa7r\n`,
                    `\xa7bGithub\xa7f: \xa7ohttps://github.com/Hyperflame1296\xa7r\n`
                ])
            }
        },
        {
            name: 'KitPVP',
            id: 'kitpvp',
            permissions: {
                place_block: false,
                break_block: false,
                interact_with_block: false,
            },
            desc: 'PVP - but revamped with new kits!',
            npcs: [
                
            ],
            properties: {
                // #region pvp_shop
                shop: [
                    {
                        section_id: 'boosts',
                        section_name: 'Boosts',
                        items: [
                            {
                                text: 'Strength 1 (60s)',
                                id: 'strength_1',
                                cost: 250,
                                condition: player => true,
                                on_buy: player => {
                                    player.addEffect('strength', 1200, {
                                        amplifier: 0,
                                        showParticles: true
                                    })
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Strength 1)`)
                                }
                            },
                            {
                                text: 'Strength 2 (60s)',
                                id: 'strength_2',
                                cost: 500,
                                condition: player => true,
                                on_buy: player => {
                                    player.addEffect('strength', 1200, {
                                        amplifier: 1,
                                        showParticles: true
                                    })
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Strength 2)`)
                                }
                            },
                            {
                                text: 'Strength 3 (60s)',
                                id: 'strength_3',
                                cost: 1000,
                                condition: player => true,
                                on_buy: player => {
                                    player.addEffect('strength', 1200, {
                                        amplifier: 2,
                                        showParticles: true
                                    })
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Strength 3)`)
                                }
                            },
                            {
                                text: 'Resistance 1 (60s)',
                                id: 'resistance_1',
                                cost: 250,
                                condition: player => true,
                                on_buy: player => {
                                    player.addEffect('resistance', 1200, {
                                        amplifier: 0,
                                        showParticles: true
                                    })
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Resistance 1)`)
                                }
                            },
                            {
                                text: 'Resistance 2 (60s)',
                                id: 'resistance_2',
                                cost: 500,
                                condition: player => true,
                                on_buy: player => {
                                    player.addEffect('resistance', 1200, {
                                        amplifier: 1,
                                        showParticles: true
                                    })
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Resistance 2)`)
                                }
                            },
                            {
                                text: 'Resistance 3 (60s)',
                                id: 'resistance_3',
                                cost: 1000,
                                condition: player => true,
                                on_buy: player => {
                                    player.addEffect('resistance', 1200, {
                                        amplifier: 2,
                                        showParticles: true
                                    })
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Resistance 3)`)
                                }
                            },
                        ]
                    },
                    {
                        section_id: 'kits',
                        section_name: 'Kits',
                        items: [
                            {
                                text: 'Brute',
                                id: 'brute',
                                cost: 500,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('brute'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('brute')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Brute Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Knight',
                                id: 'knight',
                                cost: 750,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('knight'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('knight')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Knight Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Tank',
                                id: 'tank',
                                cost: 750,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('tank'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('tank')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Tank Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Archer',
                                id: 'archer',
                                cost: 1000,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('archer'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('archer')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Archer Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Wizard',
                                id: 'wizard',
                                cost: 1000,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('wizard'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('wizard')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Wizard Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Alchemist',
                                id: 'alchemist',
                                cost: 1200,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('alchemist'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('alchemist')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Alchemist Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Flash',
                                id: 'flash',
                                cost: 1200,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('flash'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('flash')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Flash Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Feather',
                                id: 'feather',
                                cost: 1250,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('feather'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('feather')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Feather Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Mace',
                                id: 'mace',
                                cost: 1500,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('mace'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('mace')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Mace Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                            {
                                text: 'Arsonist',
                                id: 'arsonist',
                                cost: 2000,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('arsonist'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('arsonist')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Arsonist Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                        ]
                    }
                ],
                // #endregion pvp_shop
                // #region pvp_kits
                kits: [
                    {
                        text: '\xa7eBasic',
                        id: 'basic',
                        icon: 'minecraft:stone_sword',
                        desc: ['\xa78the default kit'],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:stone_sword',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:stone_axe',
                                slot: 1,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:bow',
                                slot: 2,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 3,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 4,
                                enchantments: [],
                                count: 1,
                            },
                            {
                                name: 'minecraft:arrow',
                                slot: 9,
                                enchantments: [],
                                count: 64
                            },
                        ],
                        potions: [
                            
                        ],
                        armor: [
                            {
                                name: 'minecraft:iron_helmet',
                                slot: 'Head',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:leather_chestplate',
                                slot: 'Chest',
                                enchantments: [],
                                components: {}
                            },
                            {
                                name: 'minecraft:iron_leggings',
                                slot: 'Legs',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:leather_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eArcher',
                        id: 'archer',
                        icon: 'minecraft:bow',
                        desc: ['\xa78skilled archer, one of the only kits that has a bow besides Basic'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:wooden_sword',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:wooden_axe',
                                slot: 1,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:bow',
                                slot: 2,
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'power'
                                    },
                                    {
                                        level: 1,
                                        type: 'punch'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 3,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 4,
                                enchantments: [],
                                count: 1,
                            },
                            {
                                name: 'minecraft:arrow',
                                slot: 9,
                                enchantments: [],
                                count: 64
                            },
                        ],
                        potions: [
                            
                        ],
                        armor: [
                            {
                                name: 'minecraft:chainmail_helmet',
                                slot: 'Head',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    },
                                    {
                                        level: 1,
                                        type: 'thorns'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eFeather',
                        id: 'feather',
                        icon: 'minecraft:feather',
                        desc: ['\xa78you\'re very light, and have a slow falling potion'],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:iron_sword',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:stone_axe',
                                slot: 1,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 2,
                                enchantments: [],
                                count: 4
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 3,
                                enchantments: [],
                                count: 1,
                            },
                        ],
                        potions: [
                            {
                                slot: 3,
                                opts: {
                                    effect: 'SlowFalling',
                                    liquid: 'Splash',
                                    modifier: 'Normal'
                                }
                            },
                        ],
                        armor: [
                            {
                                name: 'minecraft:golden_helmet',
                                slot: 'Head',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_chestplate',
                                slot: 'Chest',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:iron_leggings',
                                slot: 'Legs',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eFlash',
                        id: 'flash',
                        icon: 'minecraft:string',
                        desc: ['\xa78speeeeeeeeeed up!'],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:stone_axe',
                                slot: 0,
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'sharpness'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 1,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:fishing_rod',
                                slot: 2,
                                enchantments: [],
                                count: 1
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 3,
                                enchantments: [],
                                count: 1,
                            },
                        ],
                        potions: [],
                        effects: [
                            {
                                type: 'speed',
                                amplifier: 1,
                                duration: 10,
                                particles: false
                            }
                        ],
                        armor: [
                            {
                                name: 'minecraft:golden_leggings',
                                slot: 'Legs',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eKnight',
                        id: 'knight',
                        icon: 'minecraft:iron_axe',
                        desc: ['\xa78one of the better kits in the game, iron axe & a healing splash potion'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:iron_axe',
                                slot: 0,
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'sharpness'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 1,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 2,
                                enchantments: [],
                                count: 1,
                            },
                        ],
                        potions: [
                            {
                                slot: 3,
                                opts: {
                                    effect: 'Healing',
                                    liquid: 'Splash',
                                    modifier: 'Strong'
                                }
                            },
                        ],
                        armor: [
                            {
                                name: 'minecraft:iron_helmet',
                                slot: 'Head',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_chestplate',
                                slot: 'Chest',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_leggings',
                                slot: 'Legs',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:iron_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eArsonist',
                        id: 'arsonist',
                        icon: 'minecraft:flint_and_steel',
                        desc: ['\xa78you get a fire aspect sword'],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:stone_sword',
                                slot: 0,
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'sharpness'
                                    },
                                    {
                                        level: 2,
                                        type: 'fire_aspect'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:stone_axe',
                                slot: 1,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 2,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 3,
                                enchantments: [],
                                count: 1,
                            },
                        ],
                        potions: [],
                        armor: [
                            {
                                name: 'minecraft:chainmail_helmet',
                                slot: 'Head',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_chestplate',
                                slot: 'Chest',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_leggings',
                                slot: 'Legs',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7a\xa7lMace\xa7r',
                        id: 'mace',
                        icon: 'minecraft:mace',
                        desc: [
                            '\xa7qWith this kit, you are given a Mace, which comes with Wind Charges.',
                            '\xa7qThese Wind Charges have a cooldown of 5 seconds.'
                        ],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:wooden_axe',
                                slot: 0,
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'sharpness'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:mace',
                                slot: 1,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:wind_charge',
                                slot: 2,
                                enchantments: [],
                                count: 8
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 3,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 4,
                                enchantments: [],
                                count: 1,
                            }
                        ],
                        potions: [
                            
                        ],
                        armor: [
                            {
                                name: 'minecraft:chainmail_helmet',
                                slot: 'Head',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_chestplate',
                                slot: 'Chest',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_leggings',
                                slot: 'Legs',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:chainmail_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7b\xa7lWizard\xa7r',
                        id: 'wizard',
                        icon: 'minecraft:trident',
                        desc: [
                            '\xa73With this kit, you get a wand \xa78(the trident)\xa73 that can shoot beams.',
                            '\xa73These beams are 30 blocks long, and do 8 damage.'
                        ],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:stone_axe',
                                slot: 0,
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'sharpness'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:trident',
                                slot: 1,
                                enchantments: [],
                                name_tag: '\xa7r\xa7dWand'
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 2,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 3,
                                enchantments: [],
                                count: 1,
                            }
                        ],
                        potions: [
                            {
                                slot: 4,
                                opts: {
                                    effect: 'Harming',
                                    liquid: 'Splash',
                                    modifier: 'Normal'
                                }
                            },
                        ],
                        armor: [
                            {
                                name: 'minecraft:chainmail_helmet',
                                slot: 'Head',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:iron_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eAlchemist',
                        id: 'alchemist',
                        icon: 'minecraft:splash_potion',
                        desc: ['\xa78alot of potions ig, idk'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:stone_axe',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 1,
                                enchantments: [],
                                count: 16
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 2,
                                enchantments: [],
                                count: 1,
                            }
                        ],
                        potions: [
                            {
                                slot: 3,
                                opts: {
                                    effect: 'Healing',
                                    liquid: 'Splash',
                                    modifier: 'Normal'
                                }
                            },
                            {
                                slot: 4,
                                opts: {
                                    effect: 'Harming',
                                    liquid: 'Splash',
                                    modifier: 'Normal'
                                }
                            },
                            {
                                slot: 5,
                                opts: {
                                    effect: 'Poison',
                                    liquid: 'Splash',
                                    modifier: 'Normal'
                                }
                            },
                        ],
                        armor: [
                            {
                                name: 'minecraft:chainmail_helmet',
                                slot: 'Head',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_chestplate',
                                slot: 'Chest',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:leather_leggings',
                                slot: 'Legs',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eTank',
                        id: 'tank',
                        icon: 'minecraft:iron_chestplate',
                        desc: ['\xa78has a heck ton of protection, but does like no damage'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:wooden_axe',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 1,
                                enchantments: [],
                                count: 32
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 2,
                                enchantments: [],
                                count: 1,
                            }
                        ],
                        potions: [
                            
                        ],
                        effects: [
                            {
                                type: 'health_boost',
                                amplifier: 1,
                                duration: 20,
                                particles: false
                            }
                        ],
                        armor: [
                            {
                                name: 'minecraft:iron_helmet',
                                slot: 'Head',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:iron_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:iron_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:iron_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eBrute',
                        id: 'brute',
                        icon: 'minecraft:golden_axe',
                        desc: ['\xa78alot of damage, but next to no armor'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:iron_axe',
                                slot: 0,
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'sharpness'
                                    },
                                ]
                            },
                            {
                                name: 'minecraft:golden_apple',
                                slot: 1,
                                enchantments: [],
                                count: 8
                            },
                            {
                                name: 'minecraft:milk_bucket',
                                slot: 2,
                                enchantments: [],
                                count: 1,
                            }
                        ],
                        potions: [
                            
                        ],
                        armor: [
                            {
                                name: 'minecraft:chainmail_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'thorns'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_boots',
                                slot: 'Feet',
                                enchantments: []
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    }
                ]
                // #endregion pvp_kits
            },
            methods: {
                // #region kill_trade
                kill_trade: function(attacker, target, method='contact') {
                    if (!attacker || !attacker.isValid)
                        return;
                    try {
                        if (attacker?.id !== target?.id && attacker?.getGameMode() !== 'Creative' && target?.getGameMode() !== 'Creative') {
                            let attacker_kills  = attacker?.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                            let attacker_coins  = attacker?.getDynamicProperty('hgncb:kitpvp.coins') ?? 0
                            let attacker_xp  = attacker?.getDynamicProperty('hgncb:kitpvp.xp') ?? 0
                            let attacker_deaths = attacker?.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                            let target_kills    = target?.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                            let target_coins    = target?.getDynamicProperty('hgncb:kitpvp.coins') ?? 0
                            let target_deaths   = target?.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                            let attacker_health = attacker?.getComponent('minecraft:health')
                            let target_health = target?.getComponent('minecraft:health')
                            
                            let coins_earned = 20 + Math.round(Math.random() * 15) + (target?.hasTag('hgncb:kitpvp.event_target') ? 50 : 0)
                            let xp_earned = 5 + Math.round(Math.random() * 5) + (target?.hasTag('hgncb:kitpvp.event_target') ? 20 : 0)
                            let effect = s.world.getDynamicProperty('hgncb:kitpvp.global.event_effect') ?? (Math.random() < 0.5 ? 'resistance' : 'strength')
                            if (target?.hasTag('hgncb:kitpvp.event_target')) {
                                attacker?.addEffect(effect, 1200, {
                                    amplifier: 2,
                                    showParticles: true
                                })
                            }
                            let ms = false
                            if ((attacker_kills + 1) !== 0 && (attacker_kills + 1) % 50 === 0) {
                                attacker?.sendMessage(`\xa7i[\xa7a^_^\xa7i] \xa7iYou win \xa7b500\xa7i coins!`)
                                ms = true
                                for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.kitpvp'] })) {
                                    player.sendMessage(`\xa7i[\xa7a^_^\xa7i] \xa7f${attacker.name ?? `%${attacker.localizationKey}`} \xa7ihas gotten \xa7b${attacker_kills + 1}\xa7i kills!`)
                                    s.system.run(() => player.playSound('random.levelup', {
                                        pitch: 2.0,
                                        volume: 1.0
                                    }))
                                }
                            }

                            s.system.run(() => attacker?.extinguishFire());


                            target?.setDynamicProperty('hgncb:timer.kitpvp.gapple', 0)
                            target?.setDynamicProperty('hgncb:timer.kitpvp.pot', 0)
                            target?.setDynamicProperty('hgncb:timer.kitpvp.sonic', 0)
                            target?.setDynamicProperty('hgncb:timer.kitpvp.wc', 0)

                            attacker?.setDynamicProperty('hgncb:timer.kitpvp.gapple', 0)
                            attacker?.setDynamicProperty('hgncb:timer.kitpvp.pot', 0)
                            attacker?.setDynamicProperty('hgncb:timer.kitpvp.sonic', 0)
                            attacker?.setDynamicProperty('hgncb:timer.kitpvp.wc', 0)

                            s.system.run(() => attacker.addEffect('resistance', 10, {
                                amplifier: 255,
                                showParticles: true
                            }))
                            s.system.run(() => attacker.addEffect('instant_health', 10, {
                                amplifier: 255,
                                showParticles: true
                            }))

                            attacker?.setDynamicProperty('hgncb:kitpvp.kills', attacker_kills + 1)
                            attacker?.setDynamicProperty('hgncb:kitpvp.coins', attacker_coins + coins_earned + (ms ? 500 : 0))
                            target?.setDynamicProperty('hgncb:kitpvp.coins', target_coins + 2)
                            attacker?.setDynamicProperty('hgncb:kitpvp.xp', attacker_xp + xp_earned)
                            attacker?.sendMessage(`\xa7i[\xa7a^_^\xa7i] \xa7iYou have won \xa7b${coins_earned}\xa7i gold and \xa7a${xp_earned}\xa7i XP for killing \xa7f${target?.name}\xa7i!`)
                            attacker ? target?.sendMessage(`\xa7i[\xa7eX_X\xa7i] \xa7iYou have been slain by \xa7f${attacker?.name ?? attacker?.nameTag ?? `%${attacker?.localizationKey}`}\xa7i. You get \xa7b${2}\xa7i gold.`) : void 0;
                            target?.setDynamicProperty('hgncb:kitpvp.deaths', target_deaths + 1)
                            s.system.run(() => attacker_health?.resetToMaxValue())
                            s.system.run(() => {
                                for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.kitpvp'] })) {
                                    if (player?.id !== attacker?.id)
                                        s.system.run(() => player?.  runCommand('playsound note.bell @s 1000 108 0 1 1 1'))
                                    else
                                        s.system.run(() => attacker?.runCommand('playsound note.bell @s 1000 108 0 2 2 2'))
                                }
                            })
                            attacker?.setDynamicProperty('hgncb:timer.kitpvp.combat', undefined)
                            target?.setDynamicProperty('hgncb:timer.kitpvp.combat', undefined)
                            attacker?.setDynamicProperty('hgncb:kitpvp.combat_id', undefined)
                            target?.setDynamicProperty('hgncb:kitpvp.combat_id', undefined)
                        } else {
                            let target_kills    = target?.getDynamicProperty('hgncb:kitpvp.kills')  ?? 0;
                            let target_deaths   = target?.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0;
                            target?.setDynamicProperty('hgncb:kitpvp.deaths', target_deaths ?? + 1)
                            s.system.run(() => hg.dimensions.overworld.runCommand('playsound note.bell @a[tag="hgncb:minigame.kitpvp"] 1000 108 0 1 1 1'))

                            target?.setDynamicProperty('hgncb:timer.kitpvp.combat', undefined)
                            target?.setDynamicProperty('hgncb:kitpvp.combat_id', undefined)
                        }

                        hg.methods.death_message(attacker, target, method, { tags: ['hgncb:minigame.kitpvp'] })
                    } catch (err) {
                        s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                    }
                },
                // #endregion kill_trade
                // #region show_shop
                show_shop: function(player, kitsel) {
                    if (!player || !player.isValid)
                        return;
                    try {
                        let shop_form_sel = new ui.ActionFormData();
                        
                        let kitpvp = hg.minigames.find(m => m.id === 'kitpvp')

                        let coins = player.getDynamicProperty('hgncb:kitpvp.coins') ?? 0
                        let xp = player.getDynamicProperty('hgncb:kitpvp.xp') ?? 0
                        let sections = kitpvp.properties.shop
                        shop_form_sel.label(`\xa7i---\xa7bSHOP\xa7i---\n\xa7fYou currently have \xa7b${coins}\xa7f gold.\nYou also have \xa7a${xp}\xa7f XP.`)
                        shop_form_sel.label(`\xa7f\xa7bCategories\xa7f:`)
                        
                        for (let section of sections) {
                            shop_form_sel.button(section.section_name);
                        }
                        player.setDynamicProperty('hgncb:kitpvp.is_shopping', true)
                        shop_form_sel.show(player).then(res => {
                            if (!player || !player.isValid)
                                return -1;
                            if (res.canceled) {
                                player.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                                kitsel ? this.show_kit_sel(player) : void 0;
                                return -1;
                            } else {
                                let shop_form = new ui.ActionFormData();
                                let items = kitpvp.properties.shop[res.selection].items.filter(i => i.condition(player))
                                if (items) {
                                    shop_form.label(`\xa7fYou currently have \xa7b${coins}\xa7f gold\xa7f.`)
                                    if (items.length <= 0) {
                                        shop_form.label('\xa7i\xa7oNothing to see here!')
                                    } else {
                                        for (let item of items) {
                                            shop_form.button(`${item.text}\n$\xa7q${item.cost}`)
                                        }
                                    }
                                    shop_form.show(player).then(res_nosel => {
                                        player.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                                        if (res_nosel.canceled) {
                                            kitsel ? this.show_kit_sel(player) : void 0;
                                            return -1;
                                        } else {
                                            let item = items[res_nosel.selection];
                                            if (item && (coins >= item.cost)) {
                                                item.on_buy(player)
                                                player.setDynamicProperty('hgncb:kitpvp.coins', coins - item.cost)
                                            } else {
                                                player.playSound('note.bass', {
                                                    pitch: 1.0,
                                                    volume: 1.0
                                                })
                                                player.sendMessage('\xa7eShop \xa7i»\xa7f You don\'t have enough money to buy this!')
                                            }
                                            kitsel ? this.show_kit_sel(player) : void 0;
                                        }
                                    })
                                }
                            }
                        }).catch(err => {
                            s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                        });
                    } catch (err) {
                        s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                    }
                },
                // #endregion show_shop
                // #region show_leaderboard
                show_leaderboard: function(player, kitsel) {
                    if (!player || !player.isValid)
                        return;
                    try {
                        let lb_form = new ui.ActionFormData();
                        lb_form.label('\xa7i---\xa7bLEADERBOARD\xa7i---')
                        let players = s.world.getPlayers({ tags: ['hgncb:minigame.kitpvp'] }).sort((a, b) => {
                            let kills_a  = a.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                            let deaths_a = a.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                            let revoked_deaths_a = a.getDynamicProperty('hgncb:kitpvp.revoked_deaths') ?? 0

                            let kills_b  = b.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                            let deaths_b = b.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                            let revoked_deaths_b = b.getDynamicProperty('hgncb:kitpvp.revoked_deaths') ?? 0

                            let kdr_a_1 = (deaths_a - revoked_deaths_a) <= 0 ? kills_a : (kills_a) / (deaths_a - revoked_deaths_a)
                            let kdr_a_2 = isNaN(kdr_a_1) ? 0 : kdr_a_1
                            let kdr_b_1 = (deaths_b - revoked_deaths_b) <= 0 ? kills_b : (kills_b) / (deaths_b - revoked_deaths_b)
                            let kdr_b_2 = isNaN(kdr_b_1) ? 0 : kdr_b_1
                            return kdr_b_2 - kdr_a_2
                        })
                        player.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', true)
                        let str = ''
                        if (players.length <= 0) {
                            str = '\xa7i\xa7oNothing to see here!'
                        } else {
                            for (let i = 0; i < players.length; i++) {
                                let playersort = players[i]
                                if (playersort) {
                                    let kills  = playersort.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                                    let deaths = playersort.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                                    let revoked_deaths = playersort.getDynamicProperty('hgncb:kitpvp.revoked_deaths') ?? 0

                                    let kdr_a = (deaths - revoked_deaths) <= 0 ? kills : (kills) / (deaths - revoked_deaths)
                                    let kdr_b = isNaN(kdr_a) ? 0 : kdr_a
                                    str += `#\xa7b${i + 1} \xa7i- \xa7f${playersort.name} \xa7i- \xa7b${kdr_b.toFixed(3)}\xa7f KDR\n\xa7r`
                                }
                            }
                        }
                        lb_form.label(str)
                        lb_form.show(player).then(res => {
                            if (!player || !player.isValid)
                                return -1;
                            player.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
                            if (res.canceled) {
                                kitsel ? this.show_kit_sel(player) : void 0;
                                return -1;
                            }
                        }).catch(err => {
                            s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                        });
                    } catch (err) {
                        s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                    }
                },
                // #endregion show_leaderboard
                // #region show_kit_sel
                show_kit_sel: function(player) {
                    if (!player || !player.isValid)
                        return;
                    try {
                        let kitnames = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                        let game = hg.minigames.find(m => m.id === 'kitpvp')
                        let kits = kitnames.map(n => game.properties.kits.find(k => k.id === n))
                        player.getDynamicProperty('hgncb:kitpvp.selected_kit') ? 
                            player.setDynamicProperty('hgncb:kitpvp.last_kit', player.getDynamicProperty('hgncb:kitpvp.selected_kit'))
                        :
                            void 0;
                        
                        let last_kit = game.properties.kits.find(k => k.id === player.getDynamicProperty('hgncb:kitpvp.last_kit'))
                        player.setDynamicProperty('hgncb:kitpvp.selected_kit', undefined)
                        player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                        let ks_form = new cui.ChestFormData('double');
                        ks_form.title(`Select a kit. \xa7o(last kit: \xa7q${last_kit?.text ?? '(none)'}\xa78)\xa7r`).pattern([
                            'xxxxxxxxx',
                            'x_______x',
                            'x_______x',
                            'x_______x',
                            'x_______x',
                            'xxxxxxxxx'
                        ], {
                            x: { itemName: '', itemDesc: [], enchanted: false, stackAmount: 1, texture: 'textures/blocks/glass_gray' },
                        })
                        let n_kits = []
                        let shop = 43;
                        let leaderboard = 42;
                        for (let i = 0; i < kits.length; i++) {
                            let kit = kits[i]
                            if (typeof kits[i] === 'undefined') continue;
                            let s = ((i % 7) + Math.floor(i / 7) * 9) + 10
                            ks_form.button(s, kit?.text, kit?.desc, kit?.icon, 1, 0, kit?.ench)
                            n_kits.push([s, kit])
                        }
                        ks_form.button(shop, '\xa7eShop\xa7r', [], 'minecraft:potion', 1, 0, true)
                        ks_form.button(leaderboard, '\xa7bLeaderboard\xa7r', [], 'minecraft:golden_apple', 1, 0, true)
                        ks_form.show(player).then(res => {
                            if (!player || !player.isValid)
                                return -1;
                            if (res.canceled) {
                                player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                                this.show_kit_sel(player)
                                return -1;
                            } else {
                                if (res.selection === shop) {
                                    player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                                    this.show_shop(player, true)
                                    return -1;
                                } else if (res.selection === leaderboard) {
                                    player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                                    this.show_leaderboard(player, true);
                                    return -1
                                } else {
                                    let selection = n_kits.find(k => k[0] === res.selection)?.[1]
                                    if (selection) {
                                        player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                                        player.setDynamicProperty('hgncb:kitpvp.selected_kit', selection.id)
                                        player.runCommand('clear @s[m=!c]')
                                        s.system.run(() => player.extinguishFire())
                                        player.addEffect('instant_health', 60, {
                                            amplifier: 255,
                                            showParticles: true
                                        }),
                                        player.addEffect('resistance', 60, {
                                            amplifier: 255,
                                            showParticles: true
                                        })
                                        player.addEffect('weakness', 60, {
                                            amplifier: 255,
                                            showParticles: true
                                        })
                                    } else {
                                        this.show_kit_sel(player)
                                        return -1;
                                    }
                                }
                            }
                        }).catch(err => {
                            s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                        });
                    } catch (err) {
                        s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                    }
                }
                // #endregion show_kit_sel
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
                try {
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
                    this.methods.show_kit_sel(player)
                    player.runCommand('effect @s clear')
                    player.addTag(`hgncb:minigame.${this.id}`);
                    player.inputPermissions.setPermissionCategory(1, true)
                    player.inputPermissions.setPermissionCategory(2, true)
                } catch (err) {
                    s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                }
            },
            on_tick: function() {
                
            },
            for_each_player: function(player) {
                // #region pvp_foreach
                if (player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Survival')
                    player.setGameMode('Survival')
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
                let nametag_func = (() => {
                    if (player.getGameMode() === 'Creative') 
                        return '\xa7i\xa7oIn creative mode...'
                    else if (player.getDynamicProperty('hgncb:kitpvp.is_shopping')) 
                        return '\xa7e\xa7oShopping...'
                    else if (player.getDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard')) 
                        return '\xa7b\xa7oViewing leaderboard...'
                    else if (player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit')) 
                        return '\xa7a\xa7oSelecting kit...'
                    else return `${health_color}${health_percentage.toFixed(2)}\xa7r%`
                })
                player.nameTag = hg.methods.get_rank_text(player) + player.name + `\n${nametag_func()}`
                let kills  = player.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                let deaths = player.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                let revoked_deaths = player.getDynamicProperty('hgncb:kitpvp.revoked_deaths') ?? 0

                let kdr_a = (deaths - revoked_deaths) <= 0 ? kills : (kills) / (deaths - revoked_deaths)
                let kdr_b = isNaN(kdr_a) ? 0 : (isFinite(kdr_a) ? kdr_a : kills)
                let combat = Math.max((player.getDynamicProperty('hgncb:timer.kitpvp.combat') ?? 0) / 20, 0)
                player.onScreenDisplay.setActionBar([
                    `\xa7aKills\xa7f: ${kills}\n`,
                    `\xa7cDeaths\xa7f: ${deaths}${revoked_deaths > 0 ? ` \xa7i\xa7o-${revoked_deaths}\xa7r` : ''}\n`,
                    `\xa7bKDR\xa7f: ${kdr_b.toFixed(3)}\n`,
                    combat > 0 ? `\xa7iCombat\xa7f: ${combat.toFixed(2)}s\n` : `\xa7i\xa7oYou are not in combat.`,
                ])

                let mainhand = player.getComponent('minecraft:equippable')?.getEquipment('Mainhand')
                if (mainhand && mainhand.typeId === 'minecraft:trident') {
                    player.addEffect('weakness', 5, {
                        amplifier: 255,
                        showParticles: false
                    })
                }

                if (player.getDynamicProperty('hgncb:kitpvp.is_shopping') || player.getDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard') || player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit')) {
                    player.addEffect('resistance', 10, {
                        amplifier: 255,
                        showParticles: true
                    })
                    player.addEffect('weakness', 10, {
                        amplifier: 255,
                        showParticles: true
                    })
                    
                }
                if (player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit')) {
                    player.addEffect('instant_health', 10, {
                        amplifier: 255,
                        showParticles: true
                    })
                }
                let unlocked_kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                if (!unlocked_kits.includes('basic')) {
                    unlocked_kits.push('basic')
                    player.setDynamicProperty('hgncb:kitpvp.kits', unlocked_kits.join(','))
                }

                for (let kit of unlocked_kits) {
                    let item_kit = this.properties.kits.find(k => k.id === kit)
                    if (!item_kit) {
                        unlocked_kits.splice(unlocked_kits.indexOf(kit), 1)
                        player.setDynamicProperty('hgncb:kitpvp.kits', unlocked_kits.join(','))
                    }
                }
                if (player.getGameMode() !== 'Creative') {
                    if (!player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit')) {
                        let equippable = player.getComponent('minecraft:equippable')
                        let container = player.getComponent('minecraft:inventory').container

                        if (!player.getDynamicProperty('hgncb:kitpvp.selected_kit')) player.setDynamicProperty('hgncb:kitpvp.selected_kit', 'basic')
                        let kit = this.properties.kits.find(k => k.id === (player.getDynamicProperty('hgncb:kitpvp.selected_kit')))
                        let shop = new s.ItemStack('minecraft:potion', 1)
                        let leaderboard = new s.ItemStack('minecraft:enchanted_golden_apple', 1)

                        shop.nameTag         = '\xa7r\xa7eShop'
                        leaderboard.nameTag  = '\xa7r\xa7bLeaderboard'

                        shop.lockMode        = 'slot'
                        leaderboard.lockMode = 'slot'
                        if (kit.items)
                            for (let item of kit.items) {
                                let stack = new s.ItemStack(item.name, item.count ?? 1)
                                stack.lockMode = 'slot'
                                let enchantable = stack.getComponent('minecraft:enchantable');
                                for (let enchantment of item.enchantments) {
                                    enchantable?.addEnchantment({
                                        level: enchantment.level,
                                        type: new s.EnchantmentType(enchantment.type)
                                    })
                                }
                                item.name_tag ? stack.nameTag = item.name_tag : void 0;
                                if (item.components)
                                    for (let component of Object.keys(item.components)) {
                                        let c = stack.getComponent(component)
                                        let data = item.components[component]
                                        if (c) {
                                            for (let co_prop of Object.keys(data)) {
                                                c[co_prop] = data[co_prop] ?? 0
                                            }
                                        }
                                    }
                                container.getItem(item.slot)?.typeId !== stack.typeId ? container.setItem(item.slot, stack) : void 0;
                            }

                        if (kit.potions)
                            for (let potion of kit.potions) {
                                let stack = s.ItemStack.createPotion(potion.opts)
                                stack.lockMode = 'slot'
                                container.getItem(potion.slot)?.typeId !== stack.typeId ? container.setItem(potion.slot, stack) : void 0;
                                potion.name_tag ? stack.nameTag = potion.name_tag : void 0;
                            }

                        if (kit.armor)
                            for (let armor of kit.armor) {
                                let stack = new s.ItemStack(armor.name, 1)
                                stack.lockMode = 'slot'
                                let enchantable = stack.getComponent('minecraft:enchantable');
                                for (let enchantment of armor.enchantments) {
                                    enchantable?.addEnchantment({
                                        level: enchantment.level,
                                        type: new s.EnchantmentType(enchantment.type)
                                    })
                                }
                                armor.name_tag ? stack.nameTag = armor.name_tag : void 0;
                                if (armor.components)
                                    for (let component of Object.keys(armor.components)) {
                                        let c = stack.getComponent(component)
                                        let data = armor.components[component]
                                        if (c) {
                                            for (let co_prop of Object.keys(data)) {
                                                c[co_prop] = data[co_prop] ?? 0
                                            }
                                        }
                                    }
                                equippable.getEquipment(armor.slot)?.typeId !== stack.typeId ? equippable.setEquipment(armor.slot, stack) : void 0;
                            }

                        if (kit.effects)
                            for (let effect of kit.effects) {
                                player.addEffect(effect.type, effect.duration, {
                                    amplifier: effect.amplifier,
                                    showParticles: effect.particles
                                })
                            }

                        container.getItem(7)?.typeId !== leaderboard.typeId ? container.setItem(7, leaderboard) : void 0;
                        container.getItem(8)?.typeId !== shop       .typeId ? container.setItem(8, shop       ) : void 0;
                    } else {
                        player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit') ? player.teleport({
                            x: this.location.x,
                            y: this.location.y + 10,
                            z: this.location.z
                        }) : void 0;
                    }
                }
                // #endregion pvp_foreach
            }
        },
        {
            name: 'Random Events',
            id: 'random_events',
            permissions: {
                place_block: true,
                break_block: true,
                interact_with_block: true,
            },
            desc: 'Random events happen every 10 seconds. Your goal is to be the last one standing.',
            npcs: [
                
            ],
            properties: {
                events: [
                    {
                        text: '\xa7bIt\'s raining, it\'s pouring, we catch the tiger snoring-- \xa7oWait... that\'s not right...',
                        id: 'water_rain',
                        func: (players, players_alive, players_creative) => {
                            s.world.setDynamicProperty('hgncb:timer.random_events.water_rain', 300 + (Math.floor(Math.random()) * 300))
                        }
                    },
                    {
                        text: '\xa7bWoah, that is some HEAVY rain!',
                        id: 'water_rain_insane',
                        func: (players, players_alive, players_creative) => {
                            s.world.setDynamicProperty('hgncb:timer.random_events.water_rain_insane', 300 + (Math.floor(Math.random()) * 300))
                        }
                    },
                    {
                        text: '\xa76Cloudy - with a chance of... lava?! Oooh, take cover guys!',
                        id: 'lava_rain',
                        func: (players, players_alive, players_creative) => {
                            s.world.setDynamicProperty('hgncb:timer.random_events.lava_rain', 300 + (Math.floor(Math.random()) * 300))
                        }
                    },
                    {
                        text: '\xa7cAh... \xa7oThat\'s an issue...',
                        id: 'lava_rain_insane',
                        func: (players, players_alive, players_creative) => {
                            s.world.setDynamicProperty('hgncb:timer.random_events.lava_rain_insane', 300 + (Math.floor(Math.random()) * 300))
                        }
                    },
                    {
                        text: '\xa7iCloudy - with a chance of... arrows?! Oooh, take cover guys!',
                        id: 'arrow_rain',
                        func: (players, players_alive, players_creative) => {
                            s.world.setDynamicProperty('hgncb:timer.random_events.arrow_rain', 300 + (Math.floor(Math.random()) * 300))
                        }
                    },
                    {
                        text: '\xa7iThere\'s a silverfish infestation! Someone call pest control!',
                        id: 'silverfish',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 5;
                                for (let j of [0, 1, 2, 3, 4]) {
                                    hg.dimensions.overworld.spawnEntity('minecraft:silverfish', {
                                        x: player.location.x,
                                        y: Math.min(player.location.y + 2, 319),
                                        z: player.location.z
                                    })
                                }
                            }
                        }
                    },
                    {
                        text: '\xa7cGet those creepy crawlies away from me!',
                        id: 'spider',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 5;
                                for (let j of [0, 1, 2, 3, 4]) {
                                    hg.dimensions.overworld.spawnEntity('minecraft:spider', {
                                        x: player.location.x,
                                        y: Math.min(player.location.y + 2, 319),
                                        z: player.location.z
                                    })
                                }
                            }
                        }
                    },
                    {
                        text: '\xa7qIt\'s the zombie apocalypse!',
                        id: 'zombie',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 5;
                                for (let j of [0, 1, 2, 3, 4]) {
                                    hg.dimensions.overworld.spawnEntity('minecraft:zombie', {
                                        x: player.location.x,
                                        y: Math.min(player.location.y + 2, 319),
                                        z: player.location.z
                                    })
                                }
                            }
                        }
                    },
                    {
                        text: '\xa7uNightmares. Everywhere.',
                        id: 'skeleton',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 5;
                                for (let j of [0, 1, 2, 3, 4]) {
                                    hg.dimensions.overworld.spawnEntity('minecraft:skeleton', {
                                        x: player.location.x,
                                        y: Math.min(player.location.y + 2, 319),
                                        z: player.location.z
                                    })
                                }
                            }
                        }
                    },
                    {
                        text: '\xa7bYou are all the chosen one.',
                        id: 'levitation',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                player.addEffect('levitation', 200, {
                                    amplifier: 1,
                                    showParticles: true
                                })
                            }
                        }
                    },
                    {
                        text: '\xa7aHoly Cow!',
                        id: 'cow',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 5;
                                for (let j of [0, 1, 2, 3, 4]) {
                                    hg.dimensions.overworld.spawnEntity('minecraft:cow', {
                                        x: player.location.x,
                                        y: Math.min(player.location.y + 2, 319),
                                        z: player.location.z
                                    })
                                }
                            }
                        }
                    },
                    {
                        text: '\xa7aCreeper, aw man!',
                        id: 'creeper',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 1;
                                hg.dimensions.overworld.spawnEntity('minecraft:creeper', {
                                    x: player.location.x,
                                    y: Math.min(player.location.y + 2, 319),
                                    z: player.location.z
                                })
                            }
                        }
                    },
                    {
                        text: '\xa7eA random player will get struck by lightning!',
                        id: 'lightning',
                        func: (players, players_alive, players_creative) => {
                            let player = players_alive[Math.floor(Math.random() * players_alive.length)];

                            if (player) {
                                player.runCommand('summon lightning_bolt')
                            }
                        }
                    },
                    {
                        text: '\xa7fSliced in half!',
                        id: 'slice',
                        func: (players, players_alive, players_creative) => {
                            let r = Math.random()
                            r < 0.5 ?
                                hg.dimensions.overworld.runCommand(`structure load hgncb:random_events.str.slice -1025 250 -7 90_degrees`)
                            :
                                hg.dimensions.overworld.runCommand(`structure load hgncb:random_events.str.slice -1007 250 -25 0_degrees`)
                        }
                    },
                    {
                        text: '\xa7cSupply drop TNT!',
                        id: 'tnt',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 1;
                                hg.dimensions.overworld.spawnEntity('minecraft:tnt', {
                                    x: player.location.x,
                                    y: Math.min(player.location.y + 2, 319),
                                    z: player.location.z
                                })
                            }
                        }
                    },
                    {
                        text: '\xa7cYou can\'t take cover, that\'s not allowed!',
                        id: 'tnt_ridiculous',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 10;
                                for (let j of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]) {
                                    hg.dimensions.overworld.spawnEntity('minecraft:tnt', {
                                        x: player.location.x,
                                        y: Math.min(player.location.y + 2, 319),
                                        z: player.location.z
                                    })
                                }
                            }
                        }
                    },
                    {
                        text: '\xa7bFree planks for you all! :D',
                        id: 'planks',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                player.runCommand('give @s pale_oak_planks 64')
                            }
                        }
                    },
                    {
                        text: '\xa7b\xa7oZoooooooooooom!',
                        id: 'speed',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                player.addEffect('speed', 1800, {
                                    amplifier: 3,
                                    showParticles: true
                                })
                            }
                        }
                    },
                    {
                        text: '\xa7aWeeeeeeeeeeeee!',
                        id: 'jump',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                player.addEffect('jump_boost', 1800, {
                                    amplifier: 6,
                                    showParticles: true
                                })
                            }
                        }
                    },
                    {
                        text: '\xa7eMining frenzy. \xa7oActivated.',
                        id: 'haste',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                player.addEffect('haste', 800, {
                                    amplifier: 60,
                                    showParticles: true
                                })
                            }
                        }
                    },
                ]
            },
            methods: {
                reset: function() {
                    let game = hg.minigames.find(m => m.id === 'random_events')
                    let players_creative = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] })
                    let players          = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative'] })
                    hg.dimensions.overworld.runCommand('structure load hgncb:random_events.str.map -1025 250 -25')

                    s.world.setDynamicProperty('hgncb:timer.random_events.water_rain'       , 0)
                    s.world.setDynamicProperty('hgncb:timer.random_events.water_rain_insane', 0)
                    s.world.setDynamicProperty('hgncb:timer.random_events.lava_rain'        , 0)
                    s.world.setDynamicProperty('hgncb:timer.random_events.lava_rain_insane' , 0)
                    s.world.setDynamicProperty('hgncb:timer.random_events.arrow_rain'       , 0)
                    s.world.setDynamicProperty('hgncb:timer.random_events.game_start', 62  )
                    s.world.setDynamicProperty('hgncb:timer.random_events.time_left' , 6000)
                    for (let entity of hg.dimensions.overworld.getEntities({ excludeTypes: ['minecraft:player'], location: { x: -1025.0, y: -63.0, z: -25.0 }, volume: { x: 51.0, y: 384.0, z: 51.0 } })) {
                        entity.remove()
                    }
                    for (let i = 0; i < players.length; i++) {
                        let player = players[i];
                        if (player) {
                            player.removeTag('hgncb:random_events.dead')
                            if (player.isValid) {
                                player.inputPermissions.setPermissionCategory(1, false)
                                player.inputPermissions.setPermissionCategory(2, false)

                                player.runCommand('clear @s')
                                player.runCommand('effect @s clear')
                                player.getGameMode() !== 'Survival' ? player.setGameMode('Survival') : void 0;
                                player.extinguishFire()
                                let pos = {
                                    x: Math.cos((i / players.length) * (2 * Math.PI)) * 22.5 + game.location.x,
                                    y: game.location.y + 1,
                                    z: Math.sin((i / players.length) * (2 * Math.PI)) * 22.5 + game.location.z
                                }
                                s.system.run(() => player.teleport(pos, {
                                    facingLocation: {
                                        x: game.location.x,
                                        y: game.location.y + 1,
                                        z: game.location.z
                                    }
                                }))
                            }
                        }
                    }
                },
                play_event: id => {
                    try {
                    let game = hg.minigames.find(m => m.id === 'random_events')
                    let event = game.properties.events.find(e => e.id === id)

                    if (!event) event = game.properties.events[0]

                    let players_creative  = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] })
                    let players           = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative'] })
                    let players_alive     = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeTags: ['hgncb:random_events.dead'] })

                    event.func(players, players_alive, players_creative)
                    for (let player of players_creative) {
                        player.sendMessage(`\xa76Host-Triggered Event \xa7i» \xa7f${event.text}`)
                    }
                    } catch (err) {
                        s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                    }
                },
                play_random_event: () => {
                    try {
                        let game = hg.minigames.find(m => m.id === 'random_events')
                        let event = game.properties.events[Math.floor(Math.random() * game.properties.events.length)]

                        if (!event) event = game.properties.events[0]

                        let players_creative  = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] })
                        let players           = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative'] })
                        let players_alive     = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeTags: ['hgncb:random_events.dead'] })

                        event.func(players, players_alive, players_creative)
                        for (let player of players_creative) {
                            player.sendMessage(`\xa76Event \xa7i» \xa7f${event.text}`)
                        }
                    } catch (err) {
                        s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                    }
                },
                player_die: function(attacker, target, method) {
                    let game_started            = (s.world.getDynamicProperty('hgncb:timer.random_events.game_start'       ) ?? 0) <= 0;
                    let someone_won             = (s.world.getDynamicProperty('hgncb:timer.random_events.win_timer'        ) ?? 0) >  0;
                    if (!target.hasTag('hgncb:random_events.dead') && game_started && !someone_won) {
                        hg.methods.death_message(attacker, target, method, { tags: ['hgncb:minigame.random_events'] })
                        target.addTag('hgncb:random_events.dead')
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
                x: -999.5,
                y: 301,
                z: 0.5
            },
            on_enter: function(player) {
                try {
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
                    player.runCommand('effect @s clear')
                    player.addTag(`hgncb:minigame.${this.id}`);
                } catch (err) {
                    s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                }
            },
            on_tick: function() {
                let game_started            = (s.world.getDynamicProperty('hgncb:timer.random_events.game_start'       ) ?? 0) <= 0;
                let someone_won             = (s.world.getDynamicProperty('hgncb:timer.random_events.win_timer'        ) ?? 0) >  0;
                let is_raining_water        = (s.world.getDynamicProperty('hgncb:timer.random_events.water_rain'       ) ?? 0) >  0;
                let is_raining_insane_water = (s.world.getDynamicProperty('hgncb:timer.random_events.water_rain_insane') ?? 0) >  0;
                let is_raining_arrow        = (s.world.getDynamicProperty('hgncb:timer.random_events.arrow_rain'       ) ?? 0) >  0;
                let is_raining_lava         = (s.world.getDynamicProperty('hgncb:timer.random_events.lava_rain'        ) ?? 0) >  0;
                let is_raining_insane_lava  = (s.world.getDynamicProperty('hgncb:timer.random_events.lava_rain_insane' ) ?? 0) >  0;
                let time_left               = (s.world.getDynamicProperty('hgncb:timer.random_events.time_left'        ) ?? 0);
                let players_creative        = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] }).filter(p => p.isValid)
                let players                 = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative'] }).filter(p => p.isValid)
                let players_alive           = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative', 'Spectator'], excludeTags: ['hgncb:random_events.dead'] }).filter(p => p.isValid)
                let players_remaining       = players_alive.length;
                let game_can_continue       = players.length > 1;

                if (!someone_won && game_started && game_can_continue) {
                    if (players_remaining === 1) {
                        let winner = players_alive[0];
                        for (let player of players_creative) {
                            player.sendMessage(`\xa7eGame \xa7i» \xa7b${winner.name} \xa7fhas won!`)
                            player.playSound('random.levelup', {
                                pitch : 2.0,
                                volume: 1.0
                            })
                            let wins   = player.getDynamicProperty('hgncb:random_events.wins'  ) ?? 0
                            let losses = player.getDynamicProperty('hgncb:random_events.losses') ?? 0
                            if (player.id === winner.id)
                                player.setDynamicProperty('hgncb:random_events.wins'  , wins   + 1)
                            else
                                player.setDynamicProperty('hgncb:random_events.losses', losses + 1)
                            s.world.setDynamicProperty('hgncb:timer.random_events.win_timer', 81);
                            someone_won = s.world.getDynamicProperty('hgncb:timer.random_events.win_timer' ) > 0;
                            s.system.runTimeout(() => {
                                this.methods.reset()
                            }, 80)
                        }
                    } else if (players_remaining === 0) {
                        for (let player of players_creative) {
                            player.sendMessage(`\xa7eGame \xa7i» \xa7eIt\'s a tie!`)
                            player.playSound('note.bass', {
                                pitch : 1.0,
                                volume: 1.0
                            })
                            let wins   = player.getDynamicProperty('hgncb:random_events.wins'  ) ?? 0
                            let losses = player.getDynamicProperty('hgncb:random_events.losses') ?? 0
                            player.setDynamicProperty('hgncb:random_events.losses', losses + 1)
                            s.world.setDynamicProperty('hgncb:timer.random_events.win_timer', 81);
                            someone_won = s.world.getDynamicProperty('hgncb:timer.random_events.win_timer') > 0;
                            s.system.runTimeout(() => {
                                this.methods.reset()
                            }, 80)
                        }
                    } else if (time_left <= 0) {
                        for (let player of players_creative) {
                            player.sendMessage(`\xa7eGame \xa7i» \xa7eTime\'s up!`)
                            player.playSound('note.bass', {
                                pitch : 1.0,
                                volume: 1.0
                            })
                            let wins   = player.getDynamicProperty('hgncb:random_events.wins'  ) ?? 0
                            let losses = player.getDynamicProperty('hgncb:random_events.losses') ?? 0
                            player.setDynamicProperty('hgncb:random_events.losses', losses + 1)
                            s.world.setDynamicProperty('hgncb:timer.random_events.win_timer', 81);
                            someone_won = s.world.getDynamicProperty('hgncb:timer.random_events.win_timer') > 0;
                            s.system.runTimeout(() => {
                                this.methods.reset()
                            }, 80)
                        }
                    } else {
                        if (time_left % 200 === 0) {
                            this.methods.play_random_event()
                        }

                        if (is_raining_water) {
                            if (time_left % 2 === 0) {
                                hg.dimensions.overworld.spawnParticle('hgncb:particle.random_events.water_rain', {
                                    x: this.location.x,
                                    y: this.location.y + 18,
                                    z: this.location.z
                                })
                            }
                            if (time_left % 100 === 0) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 319, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 319) {
                                    b.above(1)?.setType('minecraft:flowing_water')
                                }
                            }
                            for (let player of players_creative) {
                                if (time_left % 3 === 0)
                                    player.dimension.playSound('weather.rain', {
                                        x: player.location.x + (Math.random() * 10 - 5),
                                        y: player.location.y + (Math.random() * 10 - 5),
                                        z: player.location.z + (Math.random() * 10 - 5)
                                    })
                            }
                        }
                        if (is_raining_insane_water) {
                            hg.dimensions.overworld.spawnParticle('hgncb:particle.random_events.water_rain', {
                                x: this.location.x,
                                y: this.location.y + 18,
                                z: this.location.z
                            })
                            for (let i of [0, 1, 2]) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 319, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 319) {
                                    b.above(1)?.setType('minecraft:flowing_water')
                                }
                            }
                            for (let player of players_creative) {
                                player.dimension.playSound('weather.rain', {
                                    x: player.location.x + (Math.random() * 10 - 5),
                                    y: player.location.y + (Math.random() * 10 - 5),
                                    z: player.location.z + (Math.random() * 10 - 5)
                                })
                            }
                        }
                        if (is_raining_lava) {
                            if (time_left % 2 === 0) {
                                hg.dimensions.overworld.spawnParticle('hgncb:particle.random_events.lava_rain', {
                                    x: this.location.x,
                                    y: this.location.y + 18,
                                    z: this.location.z
                                })
                            }
                            if (time_left % 100 === 0) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 319, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 319) {
                                    b.above(1)?.setType('minecraft:flowing_lava')
                                }
                            }
                            if (time_left % 5 === 0) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 319, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 319) {
                                    b.above(1)?.setType('minecraft:fire')
                                }
                            }
                        }
                        if (is_raining_insane_lava) {
                            hg.dimensions.overworld.spawnParticle('hgncb:particle.random_events.lava_rain', {
                                x: this.location.x,
                                y: this.location.y + 18,
                                z: this.location.z
                            })
                            for (let i of [0, 1]) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 319, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 319) {
                                    b.above(1)?.setType('minecraft:flowing_lava')
                                }
                            }

                            for (let i of [0, 1]) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 319, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 319) {
                                    b.above(1)?.setType('minecraft:fire')
                                }
                            }
                        }
                        if (is_raining_arrow) {
                            let x = Math.random() * 50 - 25
                            let z = Math.random() * 50 - 25
                            let a = hg.dimensions.overworld.spawnEntity('minecraft:arrow', { x: this.location.x + x, y: 319, z: this.location.z + z })
                            a.addTag('hgncb:random_events.event_arrow')
                        } else {
                            for (let arrow of hg.dimensions.overworld.getEntities({ type: 'minecraft:arrow', tags: ['hgncb:random_events.event_arrow'], excludeTypes: ['minecraft:player'], location: { x: -1025.0, y: -63.0, z: -25.0 }, volume: { x: 51.0, y: 384.0, z: 51.0 } })) {
                                arrow.remove()
                            }
                        }
                    }
                }
            },
            for_each_player: function(player) {
                let game_started            = (s.world.getDynamicProperty('hgncb:timer.random_events.game_start'       ) ?? 0) <= 0;
                let someone_won             = (s.world.getDynamicProperty('hgncb:timer.random_events.win_timer'        ) ?? 0) >  0;
                let is_raining_water        = (s.world.getDynamicProperty('hgncb:timer.random_events.water_rain'       ) ?? 0) >  0;
                let is_raining_insane_water = (s.world.getDynamicProperty('hgncb:timer.random_events.water_rain_insane') ?? 0) >  0;
                let is_raining_arrow        = (s.world.getDynamicProperty('hgncb:timer.random_events.arrow_rain'       ) ?? 0) >  0;
                let is_raining_lava         = (s.world.getDynamicProperty('hgncb:timer.random_events.lava_rain'        ) ?? 0) >  0;
                let is_raining_insane_lava  = (s.world.getDynamicProperty('hgncb:timer.random_events.lava_rain_insane' ) ?? 0) >  0;
                let time_left               = (s.world.getDynamicProperty('hgncb:timer.random_events.time_left'        ) ?? 0);
                let players_creative        = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] }).filter(p => p.isValid)
                let players                 = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative'] }).filter(p => p.isValid)
                let players_alive           = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative', 'Spectator'], excludeTags: ['hgncb:random_events.dead'] }).filter(p => p.isValid)
                let players_remaining       = players_alive.length;
                let game_can_continue       = players.length > 1;
                let is_dead = player.hasTag('hgncb:random_events.dead')

                let wins  = player.getDynamicProperty('hgncb:random_events.wins') ?? 0
                let losses = player.getDynamicProperty('hgncb:random_events.losses') ?? 0

                let wlr_a = (losses) <= 0 ? wins : (wins) / (losses)
                let wlr_b = isNaN(wlr_a) ? 0 : (isFinite(wlr_a) ? wlr_a : wins)
                let nametag_func = (() => {
                    if (player.getGameMode() === 'Creative') 
                        return '\xa7i\xa7oIn creative mode...'
                    else if (player.getDynamicProperty('hgncb:random_events.is_viewing_leaderboard')) 
                        return '\xa7a\xa7oViewing leaderboard...'
                    else return `\xa7aWins\xa7f: \xa7a${wins}\xa7r | \xa7cLosses\xa7f: \xa7c${losses}\xa7r`
                })
                player.nameTag = hg.methods.get_rank_text(player) + player.name + `\n${nametag_func()}`
                player.onScreenDisplay.setActionBar([
                    `\xa7aWins\xa7f: ${wins}\n`,
                    `\xa7cLosses\xa7f: ${losses}\n`,
                    `\xa7bWLR\xa7f: ${wlr_b.toFixed(3)}\n`,
                    `\xa7bTime left\xa7f: ${(time_left / 20).toFixed(2)}\n`,
                    `${game_can_continue ? `\xa7f${players_remaining}\xa7b players remaining\xa7f...` : `\xa7cRandom Events requires 2 or more players\xa7f.`}`,
                ])

                if (player.getDynamicProperty('hgncb:random_events.is_viewing_leaderboard')) {
                    player.addEffect('resistance', 2, {
                        amplifier: 255,
                        showParticles: true
                    })
                }
                if (someone_won) {
                    let winner = players_alive[0];
                    if (winner && player.id !== winner.id && time_left > 0) {
                        player.camera.setCamera('minecraft:free', {
                            location: {
                                x: winner.getHeadLocation().x + winner.getViewDirection().x * 3,
                                y: (winner.getHeadLocation().y + 1) + winner.getViewDirection().y * 3,
                                z: winner.getHeadLocation().z + winner.getViewDirection().z * 3
                            },
                            facingEntity: winner,
                            easeOptions: {
                                easeTime: 0.05,
                                easeType: 'Linear'
                            }
                        })
                    } else {
                        player.camera.clear()
                    }
                } else {
                    player.camera.clear()
                }
                if (!game_started) {
                    let game_start_timer = s.world.getDynamicProperty('hgncb:timer.random_events.game_start');

                    if (game_start_timer === 61) {
                        player.onScreenDisplay.setTitle('\xa7a3\xa7f...')
                        player.playSound('note.bit', {
                            pitch: 1.0,
                            volume: 1.0
                        })
                    } else if (game_start_timer === 41) {
                        player.onScreenDisplay.setTitle('\xa762\xa7f...')
                        player.playSound('note.bit', {
                            pitch: 1.0,
                            volume: 1.0
                        })
                    } else if (game_start_timer === 21) {
                        player.onScreenDisplay.setTitle('\xa7c1\xa7f...')
                        player.playSound('note.bit', {
                            pitch: 1.0,
                            volume: 1.0
                        })
                    } else if (game_start_timer === 1) {
                        player.onScreenDisplay.setTitle('\xa7a\xa7lGO!!!')
                        player.playSound('note.bit', {
                            pitch: 2.0,
                            volume: 1.0
                        })
                        player.inputPermissions.setPermissionCategory(1, true)
                        player.inputPermissions.setPermissionCategory(2, true)
                    }

                    player.addEffect('resistance', 60, {
                        amplifier: 255,
                        showParticles: true
                    }),
                    player.addEffect('saturation', 60, {
                        amplifier: 255,
                        showParticles: true
                    })
                    player.addEffect('instant_health', 60, {
                        amplifier: 255,
                        showParticles: true
                    })
                }

                if (someone_won || !game_can_continue) {
                    player.addEffect('resistance', 60, {
                        amplifier: 255,
                        showParticles: true
                    }),
                    player.addEffect('saturation', 60, {
                        amplifier: 255,
                        showParticles: true
                    })
                    player.addEffect('instant_health', 60, {
                        amplifier: 255,
                        showParticles: true
                    })
                }

                if (game_started && !someone_won && !is_dead) {
                    if (player.location.y < 251.0) {
                        player.kill()
                    }
                }

                if (is_raining_lava || is_raining_insane_lava && !player.isInWater && !is_dead && player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Spectator') {
                    let rc = hg.dimensions.overworld.getBlockFromRay(player.getHeadLocation(), { x: 0, y: 1, z: 0 }, {
                        includeLiquidBlocks: true,
                        includePassableBlocks: true
                    })

                    let b = rc?.block
                    if (!b)
                        player.setOnFire(5)
                }

                if (is_dead && player.getGameMode() !== 'Spectator')
                    player.setGameMode('Spectator')
            }
        },
        {
            name: 'Hunger Games',
            id: 'hunger_games',
            permissions: {
                place_block: false,
                break_block: false,
                interact_with_block: false,
            },
            desc: 'hunger game',
            npcs: [
                
            ],
            properties: {
                
            },
            methods: {
                
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
                y: 1,
                z: 1000.5
            },
            on_enter: function(player) {
                try {
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
                    player.runCommand('effect @s clear')
                    player.addTag(`hgncb:minigame.${this.id}`);
                } catch (err) {
                    s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                }
            },
            on_tick: function() {

            },
            for_each_player: function(player) {
                if (player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Survival')
                    player.setGameMode('Survival')
                player.nameTag = hg.methods.get_rank_text(player) + player.name
                player.runCommand('clear @s[m=!c]')

                player.onScreenDisplay.setActionBar([
                    `\xa7bWelcome to HyperGames!\n`,
                    `\xa7bDiscord\xa7f: \xa7ohttps://discord.gg/R5z3R3wd9h\xa7r\n`,
                    `\xa7bYoutube\xa7f: \xa7ohttps://www.youtube.com/@Hyperflamee8\xa7r\n`,
                    `\xa7bGithub\xa7f: \xa7ohttps://github.com/Hyperflame1296\xa7r\n`
                ])
            }
        },
    ],
    debug: {
        run_thru: function(v) {
            return eval(v);
        }
    },
    command_prefix: '!',
    listeners: {
        before_events: {
            // #region chatsend
            chatSend: function(e) {
                e.cancel = true; // cancel the chat message
                try {
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

                        s.world.sendMessage(`\xa7i[${hg.methods.get_time()}] ${hg.methods.get_rank_text(e.sender)}${e.sender.getDynamicProperty('hgncb:display_name') ?? e.sender.name} \xa7i»\xa7r ${e.message}`.replaceAll('%', '%%')) // send the message globally
                    }
                } catch (err) {
                    s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                }
            },
            // #endregion chatsend
            // #region itemuse
            itemUse: function(e) {
                try {
                    let player = e.source;
                    let item = e.itemStack;
                    if (player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit'))  {
                        e.cancel = true;
                        return;
                    }
                    if (player && item) {
                        for (let tag of player.getTags()) {
                            if (tag.startsWith('hgncb:minigame.')) {
                                let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                                let combat_timer = Math.max((player.getDynamicProperty('hgncb:timer.kitpvp.combat') ?? 0), 0)
                                let in_combat = (combat_timer > 0)
                                if (game) {
                                    switch (game.id) {
                                        case 'kitpvp':
                                            if (item) {
                                                switch (item.typeId) {
                                                    case 'minecraft:potion':
                                                        e.cancel = true
                                                        if (!player.isOnGround && player.getGameMode() !== 'Creative') {
                                                            player.sendMessage('\xa7bInfo \xa7i» \xa7cYou can\'t open the shop, as you are not on the ground\xa7f!')
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else if (in_combat && player.getGameMode() !== 'Creative') {
                                                            player.sendMessage('\xa7bInfo \xa7i» \xa7cYou can\'t open the shop, as you are in combat\xa7f!')
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else if (!in_combat)
                                                            s.system.run(() => game.methods.show_shop(player))
                                                        
                                                        break;
                                                    case 'minecraft:wind_charge':
                                                        let wc_timer = player.getDynamicProperty('hgncb:timer.kitpvp.wc') ?? 0
                                                        
                                                        if (wc_timer > 0) {
                                                            e.cancel = true;
                                                            player.sendMessage(`\xa7bInfo \xa7i» \xa7cYou can\'t use this item \xa7i(Wind Charge) \xa7cright now! \xa7i(${(wc_timer / 20).toFixed(2)}s)`)
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else player.setDynamicProperty('hgncb:timer.kitpvp.wc', 100)
                                                        break;
                                                    case 'minecraft:golden_apple':
                                                        let gapple_timer = player.getDynamicProperty('hgncb:timer.kitpvp.gapple') ?? 0
                                                        
                                                        if (gapple_timer > 0) {
                                                            e.cancel = true;
                                                            player.sendMessage(`\xa7bInfo \xa7i» \xa7cYou can\'t use this item \xa7i(Golden Apple) \xa7cright now! \xa7i(${(gapple_timer / 20).toFixed(2)}s)`)
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else player.setDynamicProperty('hgncb:timer.kitpvp.gapple', 100)
                                                        break;
                                                    case 'minecraft:splash_potion':
                                                        let pot_timer = player.getDynamicProperty('hgncb:timer.kitpvp.pot') ?? 0
                                                        
                                                        if (pot_timer > 0) {
                                                            e.cancel = true;
                                                            player.sendMessage(`\xa7bInfo \xa7i» \xa7cYou can\'t use this item \xa7i(Splash Potion) \xa7cright now! \xa7i(${(pot_timer / 20).toFixed(2)}s)`)
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else player.setDynamicProperty('hgncb:timer.kitpvp.pot', 100)
                                                        break;
                                                    case 'minecraft:milk_bucket':
                                                        let milk_timer = player.getDynamicProperty('hgncb:timer.kitpvp.milk') ?? 0
                                                        e.cancel = true;
                                                        if (milk_timer > 0) {
                                                            player.sendMessage(`\xa7bInfo \xa7i» \xa7cYou can\'t use this item \xa7i(Milk Bucket) \xa7cright now! \xa7i(${(milk_timer / 20).toFixed(2)}s)`)
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else {
                                                            s.system.run(() => player.dimension.playSound('random.drink', player.location, {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                            player.setDynamicProperty('hgncb:timer.kitpvp.milk', 600)
                                                            s.system.run(() => player.runCommand('effect @s clear slow_falling'))
                                                            s.system.run(() => player.runCommand('effect @s clear instant_damage'))
                                                            s.system.run(() => player.runCommand('effect @s clear poison'))
                                                        }
                                                        break;
                                                    case 'minecraft:trident':
                                                        let sonic_timer = player.getDynamicProperty('hgncb:timer.kitpvp.sonic') ?? 0
                                                        e.cancel = true;
                                                        if (sonic_timer > 0) {
                                                            player.sendMessage(`\xa7bInfo \xa7i» \xa7cYou can\'t use this item \xa7i(Wand) \xa7cright now! \xa7i(${(sonic_timer / 20).toFixed(2)}s)`)
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else {
                                                            s.system.run(() => player.dimension.playSound('mob.warden.sonic_boom', player.location, {
                                                                pitch : 2.0,
                                                                volume: 0.75
                                                            }))
                                                            player.setDynamicProperty('hgncb:timer.kitpvp.sonic', 400)
                                                            let entities = player.getEntitiesFromViewDirection({
                                                                ignoreBlockCollision: true,
                                                                includeLiquidBlocks: false,
                                                                includePassableBlocks: false,
                                                                maxDistance: 30
                                                            })
                                                            for (let entity of entities) {
                                                                s.system.run(() => entity && entity.entity && entity.entity.isValid ? entity.entity.applyDamage(8, {
                                                                    damagingEntity: player,
                                                                    cause: 'sonicBoom'
                                                                }) : void 0)
                                                            }
                                                            for (let i = 0; i < 30; i++) {
                                                                s.system.run(() => hg.dimensions.overworld.spawnParticle('minecraft:sonic_explosion', {
                                                                    x: player.getHeadLocation().x + player.getViewDirection().x * i,
                                                                    y: player.getHeadLocation().y + player.getViewDirection().y * i,
                                                                    z: player.getHeadLocation().z + player.getViewDirection().z * i
                                                                }))
                                                            }
                                                        }
                                                        break;
                                                    case 'minecraft:enchanted_golden_apple':
                                                        e.cancel = true                                                    
                                                        if (!player.isOnGround && player.getGameMode() !== 'Creative') {
                                                            player.sendMessage('\xa7bInfo \xa7i» \xa7cYou can\'t open the leaderboard, as you are not on the ground\xa7f!')
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else if (in_combat && player.getGameMode() !== 'Creative') {
                                                            player.sendMessage('\xa7bInfo \xa7i» \xa7cYou can\'t open the leaderboard, as you are in combat\xa7f!')
                                                            s.system.run(() => player.playSound('note.bass', {
                                                                pitch : 1.0,
                                                                volume: 1.0
                                                            }))
                                                        } else if (!in_combat)
                                                            s.system.run(() => game.methods.show_leaderboard(player))
                                                        break;
                                                }
                                            }
                                            break;
                                        case 'random_events':
                                            break;
                                        default:
                                            break;
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    s.world.sendMessage('\xa7bHyperGames \xa7i- \xa7cERROR \xa7i- \xa7r' + err)
                }
            },
            // #endregion itemuse
            // #region playerleave
            playerLeave: function(e) {
                let target = e.player
                hg.methods.clog_prevent(target)
            },
            // #endregion playerleave
            // #region playerbreakblock
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
            // #endregion playerbreakblock
            // #region playerplaceblock
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
            // #endregion playerplaceblock
            // #region playerinteractwithblock
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
            // #endregion playerinteractwithblock
        },
        after_events: {
            // #region playerspawn
            playerSpawn: function(e) {
                // runs when a player spawns
                if (e.initialSpawn) {
                    // sends players who joined the game to the hub
                    let player = e.player;
                        player.sendMessage(`\xa7bWelcome to \xa7lHyperGames NCB\xa7r! \xa7i- \xa7f(\xa7b${hg.ver}\xa7f)`);
                    let hub = hg.minigames.find(g => g.id === 'hub');
                    hub.on_enter(player); // teleport the player to the hub

                    s.system.runTimeout(() => {
                        player.sendMessage('\xa7bType \xa7f!\xa7brules to show the rules of the server\xa7f!')
                        player.playSound('random.orb', {
                            pitch: 2.0,
                            volume: 1.0
                        })
                    }, 60)
                    s.system.runTimeout(() => {
                        player.sendMessage('\xa7lIMPORTANT!!! \xa7r- HyperGames phyiscally depends on it\'s resource packs. If you haven\'t already, download the resource packs.')
                        player.playSound('random.pop', {
                            pitch: 1.0,
                            volume: 1.0
                        })
                    }, 120)
                } else {
                    let player = e.player;
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('hgncb:minigame.')) {
                            let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                            if (game) {
                                switch (game.id) {
                                    case 'kitpvp':
                                        let block = hg.dimensions.overworld.getTopmostBlock({
                                            x: (Math.random() * 10) + game.location.x,
                                            z: (Math.random() * 10) + game.location.z
                                        })
                                        player.teleport({
                                            x: block.x,
                                            y: block.y + 1,
                                            z: block.z
                                        })
                                        s.system.run(() => game.methods.show_kit_sel(player))
                                        player.runCommand('clear @s[m=!c]')
                                        break;
                                    case 'random_events':
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                }
            },
            // #endregion playerspawn
            // #region projectilehitentity
            projectileHitEntity: function(e) {
                let attacker = e.source;
                let target = e.getEntityHit().entity;
                if (!attacker || !attacker.isValid)
                    return;

                if (!target   || !target.isValid  )
                    return;
                
                if (e.projectile.typeId === 'minecraft:fishing_hook') e.projectile.remove()
                if (target.getDynamicProperty('hgncb:kitpvp.is_selecting_kit'))  {
                    e.projectile.isValid ? e.projectile.remove() : void 0;
                    return;
                }
                if (attacker?.id !== target?.id && attacker?.typeId === 'minecraft:player' && target?.typeId === 'minecraft:player' && attacker.getGameMode() !== 'Creative' && target.getGameMode() !== 'Creative') {
                    attacker?.playSound('random.orb', {
                        pitch: 0.5,
                        volume: 1.0
                    })
                    attacker?.setDynamicProperty('hgncb:kitpvp.last_hit', s.system.currentTick)
                    target?.setDynamicProperty('hgncb:kitpvp.last_hit', s.system.currentTick)
                    attacker?.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                    target?.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                    attacker?.setDynamicProperty('hgncb:kitpvp.combat_id', target.id)
                    target?.setDynamicProperty('hgncb:kitpvp.combat_id', attacker.id)
                }
            },
            // #endregion projectilehitentity
            // #region entityhitentity
            entityHitEntity: function(e) {
                let attacker = e.damagingEntity;
                let target = e.hitEntity;

                if (!attacker || !attacker.isValid)
                    return;

                if (!target   || !target.isValid  )
                    return;

                if (attacker?.id !== target?.id && attacker?.typeId === 'minecraft:player' && target?.typeId === 'minecraft:player' && attacker.getGameMode() !== 'Creative' && target.getGameMode() !== 'Creative') {
                    attacker?.setDynamicProperty('hgncb:kitpvp.last_hit', s.system.currentTick)
                    target?.setDynamicProperty('hgncb:kitpvp.last_hit', s.system.currentTick)
                    attacker?.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                    target?.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                    attacker?.setDynamicProperty('hgncb:kitpvp.combat_id', target.id)
                    target?.setDynamicProperty('hgncb:kitpvp.combat_id', attacker.id)
                }
            },
            // #endregion entityhitentity
            // #region entitydie
            entityDie: function(e) {
                let attacker = e.damageSource.damagingEntity;
                let target = e.deadEntity;
                
                if (!attacker && target && target.typeId === 'minecraft:player')
                    hg.methods.diff_death(target, e.damageSource.cause)
                else if (attacker && target && target.typeId === 'minecraft:player')
                    hg.methods.global_death_handle(attacker, target, e.damageSource.cause)
            }
            // #endregion entitydie
        }
    },
    listeners_system: {
        before_events: {
            
        },
        after_events: {
            
        }
    },
    on_tick: function() {
        // #region global_ontick
        s.system.runInterval(() => {
            // runs every game tick
            let w_props = s.world.getDynamicPropertyIds()

            for (let prop of w_props)
                if (prop.startsWith('hgncb:timer.'))
                    s.world.getDynamicProperty(prop) > 0 ? s.world.setDynamicProperty(prop, s.world.getDynamicProperty(prop) - 1) : void 0;
            
            for (let player of s.world.getPlayers()) {
                if (typeof player !== 'undefined') {
                    let props = player.getDynamicPropertyIds()

                    for (let prop of props)
                        if (prop.startsWith('hgncb:timer.'))
                            player.getDynamicProperty(prop) > 0 ? player.setDynamicProperty(prop, player.getDynamicProperty(prop) - 1) : void 0;
                    
                    
                    player.runCommand(`title @a times 0 60 20`);
                    player.commandPermissionLevel = hg.methods.get_rank_level(player)
                    let tags = player.getTags();
                    if (tags.filter(t => t.startsWith('hgncb:minigame.')).length > 1) {
                        player.sendMessage('\xa7cWe\'ve detected that you\'re in multiple minigames at once! Sending you to the Hub...')
                        hg.minigames.find(m => m.id === 'hub').on_enter(player)
                    }
                    for (let tag of tags) {
                        if (tag.startsWith('hgncb:transfer.')) {
                            let id = tag.replace('hgncb:transfer.', '')
                            let game = hg.minigames.find(g => g.id === id);

                            if (game) {
                                game.on_enter(player)
                                player.removeTag(tag)
                            } else {
                                s.world.sendMessage(`\xa7cERROR \xa7f- \xa7fCould not find minigame \'${id}\'`); // send an error message
                                player.removeTag(tag)
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
                                game.for_each_player(player)
                            } else {
                                player.removeTag(tag)
                            }
                        }
                    }
                }
            }
            for (let game of hg.minigames) {
                game.on_tick();
                for (let npc_data of game.npcs) {
                    if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${npc_data.link ?? npc_data.id}`] }).length <= 0) {
                        let npc = hg.dimensions.overworld.spawnEntity('minecraft:npc', npc_data.location);
                        let npc_comp = npc.getComponent('minecraft:npc')
                        let player_count = hg.dimensions.overworld.getPlayers({
                            tags: [`hgncb:minigame.${npc_data.link}`]
                        }).length
                        npc_comp.name = `\xa7b${npc_data.text}\xa7r\n\xa7i\xa7o${player_count} players`
                        npc_comp.skinIndex !== npc_data.skin ? npc_comp.skinIndex = npc_data.skin : void 0;
                        npc.addTag(`hgncb:npc.${npc_data.link ?? npc_data.id}`)
                        npc.teleport(npc_data.location, {
                            facingLocation: { x: 0, y: 4, z: 0 }
                        })
                    } else if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${npc_data.link ?? npc_data.id}`] }).length > 0) {
                        let npc = hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${npc_data.link ?? npc_data.id}`] })[0]
                        let npc_comp = npc.getComponent('minecraft:npc')
                        let player_count = hg.dimensions.overworld.getPlayers({
                            tags: [`hgncb:minigame.${npc_data.link}`]
                        }).length
                        npc_comp.name = `\xa7b${npc_data.text}\xa7r\n\xa7i\xa7o${player_count} players`
                        npc_comp.skinIndex !== npc_data.skin ? npc_comp.skinIndex = npc_data.skin : void 0;
                        npc.teleport(npc_data.location, {
                            facingLocation: { x: 0, y: 4, z: 0 }
                        })
                    }
                }
            }
        })
        // #endregion global_ontick
    },
    on_load: function() {
        // runs when the script is loaded
        s.world.sendMessage(`\xa7bHyperGames \xa7i-\xa7f Script reloaded\xa7i!`);
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
        // #region commands
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
            name: 'rules',
            desc: 'Shows the rules of the server.',
            requires_op: false,
            func: function(a, player) {
                let
                    b = a[0]?.trim()?.toLowerCase(),
                    c = a[1]?.trim()?.toLowerCase()
                player.sendMessage(`\xa7f---\xa7bRULES\xa7f---` + '\n' + hg.rules.join('\n\xa7r'));
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
                            player.sendMessage(`\xa7cERROR \xa7f- \xa7f${e}`);
                        }
                        break;
                    case 'prop_set':
                        // set a dynamic property
                        try {
                            let args = input.split(' ')
                            let prop = args[0]
                            let name = args[1]
                            let value = isNaN(parseFloat(args.slice(2).join(' '))) ? args.slice(2).join(' ') : parseFloat(args.slice(2).join(' '))
                            value = typeof hg.methods.parse_bool(value) !== 'undefined' ? hg.methods.parse_bool(value) : value;
                            let player = hg.dimensions.overworld.getPlayers({ name })[0]
                            if (player) {
                                player.setDynamicProperty(prop, value)
                            } else {
                                player.sendMessage(`\xa7cThere is no player named \xa7f\'\xa7c${name}\xa7f\'.`);
                            }
                        } catch (e) {
                            player.sendMessage(`\xa7cERROR \xa7f- \xa7f${e}`);
                        }
                        break;
                    case 'prop_add':
                        // set a dynamic property
                        try {
                            let args = input.split(' ')
                            let prop = args[0]
                            let name = args[1]
                            let value = isNaN(parseFloat(args[2])) ? args[2] : parseFloat(args[2])
                            let player = hg.dimensions.overworld.getPlayers({ name })[0]
                            if (player) {
                                player.setDynamicProperty(prop, (player.getDynamicProperty(prop) ?? 0) + value)
                            } else {
                                player.sendMessage(`\xa7cThere is no player named \xa7f\'\xa7c${name}\xa7f\'.`);
                            }
                        } catch (e) {
                            player.sendMessage(`\xa7cERROR \xa7f- \xa7f${e}`);
                        }
                        break;
                    case 'no_shop':
                        for (let player of s.world.getPlayers()) {
                            player?.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                            player?.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
                            player?.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                        }
                        break;
                    default:
                        player.sendMessage(`\xa7cNo such debug command \xa7f\'!\xa7c${b.replace(hg.command_prefix, '')} ${c}\xa7f\'\xa7f!`);
                        break;
                }
            }
        }
        // #endregion commands
    ];
    hg.on_load();
    hg.on_tick();
})