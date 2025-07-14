import * as s  from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import * as gt from '@minecraft/server-gametest';
import * as cmn from '@minecraft/common';
import * as dbg from '@minecraft/debug-utilities';
/*
    hypergames ncb v0.2.1
    probably not gonna be finished for a while
*/

let hg = {
    ver: 'v0.2.1',
    rules: [
        '#\xa7b1 \xa7f- \xa7bNo spamming\xa7f.',
        '#\xa7b2 \xa7f- \xa7bNo ragebaiting\xa7f.',
        '#\xa7b3 \xa7f- \xa7bNo hacking\xa7f.',
        '#\xa7b4 \xa7f- \xa7bNo hacked skins of any kind\xa7f.',
        '#\xa7b5 \xa7f- \xa7bNo brainrot or inappropriate stuff\xa7f.',
        '#\xa7b6 \xa7f- \xa7bDo not abuse glitches\xa7f.',
        '#\xa7b7 \xa7f- \xa7bDo not ask for op\xa7f. \xa7i\xa7oI\'m honestly so sick of it...',
        '#\xa7b7 \xa7f- \xa7bDo not roleplay\xa7f. \xa7i\xa7oNo, seriously. This is not a joke.',
        '\xa7f---\xa7bADMIN RULES\xa7f---',
        '#\xa7b8 \xa7f- \xa7bNo admin abuse\xa7f.',
        '#\xa7b9 \xa7f- \xa7bDo not interfere with games unless given permission by the owner\xa7f.'
    ],
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
        parse_bool: function(x) {
            if (x.startsWith('true' )) return true;
            if (x.startsWith('false')) return false;
            return;
        },
        clog_prevent: function(target, method) {
            for (let tag of target.getTags()) {
                if (tag.startsWith('hgncb:minigame.')) {
                    let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                    if (game) {
                        switch (game.id) {
                            case 'pvp':
                                let combat_timer = Math.max((target.getDynamicProperty('hgncb:timer.pvp.combat') ?? 0), 0)
                                let in_combat = (combat_timer > 0)
                                if (in_combat) {
                                    let attacker = hg.dimensions.overworld.getPlayers().find(p => p.id === (target?.getDynamicProperty('hgncb:pvp.combat_id') ?? 0))

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
        },
        diff_death: function(target, method='clogPrevent') {
            for (let tag of target.getTags()) {
                if (tag.startsWith('hgncb:minigame.')) {
                    let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                    if (game) {
                        switch (game.id) {
                            case 'pvp':
                                let combat_timer = Math.max((target.getDynamicProperty('hgncb:timer.pvp.combat') ?? 0), 0)
                                let in_combat = (combat_timer > 0)
                                let attacker = hg.dimensions.overworld.getPlayers().find(p => p.id === (target?.getDynamicProperty('hgncb:pvp.combat_id') ?? 0))
                                if (target && target.typeId === 'minecraft:player') {
                                    game.methods.kill_trade(in_combat ? attacker : undefined, target, method)
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        },
        death_message: function(attacker=false, target, method, filter) {
            for (let player of hg.dimensions.overworld.getPlayers(filter)) {
                switch (method) {
                    case 'anvil':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas squashed by a falling anvil whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas squashed by a falling anvil`)
                        break;
                    case 'blockExplosion':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas killed by [Intentional Game Design] due to \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas killed by [Intentional Game Design]`)
                        break;
                    case 'campfire':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwalked into a campfire whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas slain`)
                        break;
                    case 'clogPrevent':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7icombat logged to \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7icombat logged`)
                        break;
                    case 'contact':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas slain by \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas slain`)
                        break;
                    case 'drowning':
                            attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idrowned whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idrowned`)
                        break;
                    case 'entityAttack':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas slain by \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas slain`)
                        break;
                    case 'entityExplosion':
                            attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas blown up by \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iblew up`)
                        break;
                    case 'fall':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7ifell from a high place whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7ifell from a high place`)
                        break;
                    case 'fallingBlock':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas squashed by a falling block whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas squashed by a falling block`)
                        break;
                    case 'fire':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwalked into fire whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwent up in flames`)
                        break;
                    case 'fireTick':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iburned to death whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iburned to death`)
                        break;
                    case 'fireworks':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwent off with a bang whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwent off with a bang`)
                        break;
                    case 'fly_into_wall':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iexperienced kinetic energy whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iexperienced kinetic energy`)
                        break;
                    case 'freezing':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7ibecame an ice block whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7ifroze to death`)
                        break;
                    case 'lava':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7itried to swim in lava to escape \xa7f${attacker.name}`)
                            :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7itried to swim in lava`)
                        break;
                    case 'lightning':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas struck by lightning whilst trying to escape \xa7f${attacker.name}`)
                            :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas struck by lightning`)
                        break;
                    case 'maceSmash':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas smashed by \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas smashed`)
                        break;
                    case 'magic':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas killed by \xa7f${attacker.name}\xa7i using magic`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas killed by magic`)
                        break;
                    case 'magma':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwalked into danger zone whilst trying to escape \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idiscovered floor was lava`)
                        break;
                    case 'none':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idied because of \xa7f${attacker.name}\xa7i`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idied`)
                        break;
                    case 'override':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idied because of \xa7f${attacker.name}\xa7i`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idied`)
                        break;
                    case 'piston':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas squashed by a piston due to \xa7f${attacker.name}\xa7i.`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas squashed by a piston`)
                        break;
                    case 'projectile':
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas shot by \xa7f${attacker.name}`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7iwas shot`)
                        break;
                    default:
                        attacker ? 
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idied because of \xa7f${attacker.name}\xa7i.`)
                        :
                            player.sendMessage(`\xa7i[\xa7cX_X\xa7i] \xa7f${target.name} \xa7idied`)
                        break;
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
        RekeneiZsolt:  {
            level: 2,
            text: [
                '\xa7i[\xa7sOG\xa7i]',
                '\xa7i[\xa7aAdmin\xa7i]'
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
                    skin: 0,
                    location: {
                        x: -3.5,
                        y: 2.0,
                        z: 17.5
                    },
                    link: 'pvp',
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
                player.runCommand('effect @s clear')
                player.addTag(`hgncb:minigame.${this.id}`);
            },
            on_tick: function() {

            },
            for_each_player: function(player) {
                if (!hg.methods.check_op(player)) {
                    player.setGameMode('Survival')
                }
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
            properties: {
                shop: [
                    {
                        section_id: 'other',
                        section_name: 'Other',
                        items: [
                            {
                                id: 'revoke_10_deaths',
                                text: 'Revoke 10 Deaths',
                                cost: 1500,
                                condition: player => true,
                                on_buy: player => {
                                    let deaths = player?.getDynamicProperty('hgncb:pvp.revoked_deaths') ?? 0
                                    player?.setDynamicProperty('hgncb:pvp.revoked_deaths', deaths + 10)
                                }
                            }
                        ]
                    },
                    {
                        section_id: 'upgrades',
                        section_name: 'Upgrades',
                        items: [
                            {
                                id: 'upgrade_sword',
                                text: 'Upgrade Sword',
                                xp: true,
                                cost: 500,
                                condition: player => (player?.getDynamicProperty('hgncb:pvp.sword_level') ?? 0) <= 5,
                                on_buy: player => {
                                    let sword_level = player?.getDynamicProperty('hgncb:pvp.sword_level') ?? 0
                                    player?.setDynamicProperty('hgncb:pvp.sword_level', sword_level + 1)
                                    player?.runCommand('clear')
                                    player?.sendMessage(`\xa7f${(player?.getDynamicProperty('hgncb:pvp.sword_level') ?? 0) <= 0 ? 'No Enchantment' : `Sharpness ${(player?.getDynamicProperty('hgncb:pvp.sword_level') ?? 0)}`} \xa7i-> \xa7fSharpness ${(player?.getDynamicProperty('hgncb:pvp.sword_level') ?? 0)}`)
                                    player?.sendMessage(`\xa7eShop \xa7i» \xa7eUpgrade successful! \xa7f(${(player?.getDynamicProperty('hgncb:pvp.sowrd_level') ?? 0) <= 0 ? 'No Enchantment' : `Sharpness ${(player?.getDynamicProperty('hgncb:pvp.sword_level') ?? 0)}`} \xa7i-> \xa7fSharpness ${(player?.getDynamicProperty('hgncb:pvp.sword_level') ?? 0)})`)
                                }
                            },
                            {
                                id: 'upgrade_axe',
                                text: 'Upgrade Axe',
                                cost: 500,
                                condition: player => (player?.getDynamicProperty('hgncb:pvp.axe_level') ?? 0) <= 5,
                                on_buy: player => {
                                    let axe_level = player?.getDynamicProperty('hgncb:pvp.axe_level') ?? 0
                                    player?.setDynamicProperty('hgncb:pvp.axe_level', axe_level + 1)
                                    player?.runCommand('clear')
                                    player?.sendMessage(`\xa7eShop \xa7i» \xa7eUpgrade successful! \xa7f(${(player?.getDynamicProperty('hgncb:pvp.axe_level') ?? 0) <= 0 ? 'No Enchantment' : `Sharpness ${(player?.getDynamicProperty('hgncb:pvp.axe_level') ?? 0)}`} \xa7i-> \xa7fSharpness ${(player?.getDynamicProperty('hgncb:pvp.axe_level') ?? 0)})`)
                                }
                            },
                            {
                                id: 'upgrade_helmet',
                                text: 'Upgrade Helmet',
                                cost: 600,
                                condition: player => (player?.getDynamicProperty('hgncb:pvp.helmet_level') ?? 0) <= 4,
                                on_buy: player => {
                                    let helmet_level = player?.getDynamicProperty('hgncb:pvp.helmet_level') ?? 0
                                    player?.setDynamicProperty('hgncb:pvp.helmet_level', helmet_level + 1)
                                    player?.runCommand('clear')
                                    player?.sendMessage(`\xa7eShop \xa7i» \xa7eUpgrade successful! \xa7f(${(player?.getDynamicProperty('hgncb:pvp.helmet_level') ?? 0) <= 0 ? 'No Enchantment' : `Protection ${(player?.getDynamicProperty('hgncb:pvp.helmet_level') ?? 0)}`} \xa7i-> \xa7fProtection ${(player?.getDynamicProperty('hgncb:pvp.helmet_level') ?? 0)})`)
                                }
                            },
                            {
                                id: 'upgrade_chestplate',
                                text: 'Upgrade Chestplate',
                                cost: 600,
                                condition: player => (player?.getDynamicProperty('hgncb:pvp.chestplate_level') ?? 0) <= 4,
                                on_buy: player => {
                                    let chestplate_level = player?.getDynamicProperty('hgncb:pvp.chestplate_level') ?? 0
                                    player?.setDynamicProperty('hgncb:pvp.chestplate_level', chestplate_level + 1)
                                    player?.runCommand('clear')
                                    player?.sendMessage(`\xa7eShop \xa7i» \xa7eUpgrade successful! \xa7f(${(player?.getDynamicProperty('hgncb:pvp.chestplate_level') ?? 0) <= 0 ? 'No Enchantment' : `Protection ${(player?.getDynamicProperty('hgncb:pvp.chestplate_level') ?? 0)}`} \xa7i-> \xa7fProtection ${(player?.getDynamicProperty('hgncb:pvp.chestplate_level') ?? 0)})`)
                                }
                            },
                            {
                                id: 'upgrade_leggings',
                                text: 'Upgrade Leggings',
                                cost: 600,
                                condition: player => (player?.getDynamicProperty('hgncb:pvp.leggings_level') ?? 0) <= 4,
                                on_buy: player => {
                                    let leggings_level = player?.getDynamicProperty('hgncb:pvp.leggings_level') ?? 0
                                    player?.setDynamicProperty('hgncb:pvp.leggings_level', leggings_level + 1)
                                    player?.runCommand('clear')
                                    player?.sendMessage(`\xa7eShop \xa7i» \xa7eUpgrade successful! \xa7f(${(player?.getDynamicProperty('hgncb:pvp.leggings_level') ?? 0) <= 0 ? 'No Enchantment' : `Protection ${(player?.getDynamicProperty('hgncb:pvp.leggings_level') ?? 0)}`} \xa7i-> \xa7fProtection ${(player?.getDynamicProperty('hgncb:pvp.leggings_level') ?? 0)})`)
                                }
                            },
                            {
                                id: 'upgrade_boots',
                                text: 'Upgrade Boots',
                                cost: 600,
                                condition: player => (player?.getDynamicProperty('hgncb:pvp.boots_level') ?? 0) <= 4,
                                on_buy: player => {
                                    let boots_level = player?.getDynamicProperty('hgncb:pvp.boots_level') ?? 0
                                    player?.setDynamicProperty('hgncb:pvp.boots_level', boots_level + 1)
                                    player?.runCommand('clear')
                                    player?.sendMessage(`\xa7eShop \xa7i» \xa7eUpgrade successful! \xa7f(${(player?.getDynamicProperty('hgncb:pvp.boots_level') ?? 0) <= 0 ? 'No Enchantment' : `Protection ${(player?.getDynamicProperty('hgncb:pvp.boots_level') ?? 0)}`} \xa7i-> \xa7fProtection ${(player?.getDynamicProperty('hgncb:pvp.boots_level') ?? 0)})`)
                                }
                            }
                        ]
                    }
                ]
            },
            methods: {
                kill_trade: function(attacker, target, method='contact') {
                    if (attacker?.id !== target?.id && attacker?.getGameMode() !== 'Creative' && target?.getGameMode() !== 'Creative') {
                        let attacker_kills  = attacker?.getDynamicProperty('hgncb:pvp.kills') ?? 0
                        let attacker_coins  = attacker?.getDynamicProperty('hgncb:pvp.coins') ?? 0
                        let attacker_xp  = attacker?.getDynamicProperty('hgncb:pvp.xp') ?? 0
                        let attacker_deaths = attacker?.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                        let target_kills    = target?.getDynamicProperty('hgncb:pvp.kills') ?? 0
                        let target_coins    = target?.getDynamicProperty('hgncb:pvp.coins') ?? 0
                        let target_deaths   = target?.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                        let attacker_health = attacker?.getComponent('minecraft:health')
                        let target_health = target?.getComponent('minecraft:health')
                        
                        let coins_earned = 10 + Math.round(Math.random() * 10) + (target?.hasTag('hgncb:pvp.event_target') ? 20 : 0)
                        let xp_earned = 5 + Math.round(Math.random() * 5) + (target?.hasTag('hgncb:pvp.event_target') ? 20 : 0)
                        let effect = s.world.getDynamicProperty('hgncb:pvp.global.event_effect') ?? (Math.random() < 0.5 ? 'resistance' : 'strength')
                        if (target?.hasTag('hgncb:pvp.event_target')) {
                            attacker?.addEffect(effect, 1200, {
                                amplifier: 2,
                                particles: true
                            })
                        }
                        let ms = false
                        if ((attacker_kills + 1) !== 0 && (attacker_kills + 1) % 50 === 0) {
                            attacker?.sendMessage(`\xa7i[\xa7a^_^\xa7i] \xa7iYou win \xa7b400\xa7i coins!`)
                            ms = true
                            for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.pvp'] })) {
                                player.sendMessage(`\xa7i[\xa7a^_^\xa7i] \xa7f${attacker.name} \xa7ihas gotten \xa7b${attacker_kills + 1}\xa7i kills!`)
                                player.playSound('random.levelup', {
                                    pitch: 2.0,
                                    volume: 1.0
                                })
                            }
                        }
                        attacker?.setDynamicProperty('hgncb:pvp.kills', attacker_kills + 1)
                        attacker?.setDynamicProperty('hgncb:pvp.coins', attacker_coins + coins_earned + (ms ? 400 : 0))
                        target?.setDynamicProperty('hgncb:pvp.coins', target_coins + 2)
                        attacker?.setDynamicProperty('hgncb:pvp.xp', attacker_xp + xp_earned)
                        attacker?.sendMessage(`\xa7i[\xa7a^_^\xa7i] \xa7iYou have won \xa7b${coins_earned}\xa7i gold and \xa7a${xp_earned}\xa7i XP for killing \xa7f${target?.name}\xa7i!`)
                        target?.sendMessage(`\xa7i[\xa7eX_X\xa7i] \xa7iYou have been slain by \xa7f${attacker?.name}\xa7i. You get \xa7b${2}\xa7i gold.`)
                        target?.setDynamicProperty('hgncb:pvp.deaths', target_deaths + 1)
                        s.system.run(() => attacker_health?.resetToMaxValue())
                        s.system.run(() => {
                            for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.pvp'] })) {
                                if (player?.id !== attacker?.id)
                                    player?.  runCommand('playsound note.bell @s 1000 108 0 1 1 1')
                                else
                                    attacker?.runCommand('playsound note.bell @s 1000 108 0 2 2 2')
                            }
                        })
                        attacker?.setDynamicProperty('hgncb:timer.pvp.combat', undefined)
                        target?.setDynamicProperty('hgncb:timer.pvp.combat', undefined)
                        attacker?.setDynamicProperty('hgncb:pvp.combat_id', undefined)
                        target?.setDynamicProperty('hgncb:pvp.combat_id', undefined)
                    } else {
                        let target_kills    = target?.getDynamicProperty('hgncb:pvp.kills')  ?? 0;
                        let target_deaths   = target?.getDynamicProperty('hgncb:pvp.deaths') ?? 0;
                        target?.setDynamicProperty('hgncb:pvp.deaths', target_deaths ?? + 1)
                        s.system.run(() => hg.dimensions.overworld.runCommand('playsound note.bell @a[tag="hgncb:minigame.pvp"] 1000 108 0 1 1 1'))

                        target?.setDynamicProperty('hgncb:timer.pvp.combat', undefined)
                        target?.setDynamicProperty('hgncb:pvp.combat_id', undefined)
                    }

                    hg.methods.death_message(attacker, target, method, { tags: ['hgncb:minigame.pvp'] })
                },
                show_shop: function(player) {
                    let shop_form_sel = new ui.ActionFormData();
                    
                    let pvp = hg.minigames.find(m => m.id === 'pvp')

                    let coins = player.getDynamicProperty('hgncb:pvp.coins') ?? 0
                    let xp = player.getDynamicProperty('hgncb:pvp.xp') ?? 0
                    let sections = pvp.properties.shop
                    shop_form_sel.label(`\xa7i---\xa7bSHOP\xa7i---\n\xa7fYou currently have \xa7b${coins}\xa7f gold.\nYou also have \xa7a${xp}\xa7f XP.`)
                    shop_form_sel.label(`\xa7f\xa7bCategories\xa7f:`)

                    for (let section of sections) {
                        shop_form_sel.button(section.section_name);
                    }
                    player.setDynamicProperty('hgncb:pvp.is_shopping', true)
                    shop_form_sel.show(player).then(res => {
                        if (res.canceled) {
                            player.setDynamicProperty('hgncb:pvp.is_shopping', false)
                            return -1;
                        } else {
                            let shop_form = new ui.ActionFormData();
                            let items = pvp.properties.shop[res.selection].items.filter(i => i.condition(player))
                            if (items) {
                                shop_form.label(`\xa7fYou currently have \xa7b${coins}\xa7f gold\xa7f.`)
                                for (let item of items) {
                                    shop_form.button(`${item.text}\n$\xa7q${item.cost}`)
                                }
                                shop_form.show(player).then(res_nosel => {
                                    player.setDynamicProperty('hgncb:pvp.is_shopping', false)
                                    if (res_nosel.canceled) {
                                        return -1;
                                    } else {
                                        let item = items[res_nosel.selection];
                                        if (item && coins >= item.cost) {
                                            item.on_buy(player)
                                            player.setDynamicProperty('hgncb:pvp.coins', coins - item.cost)
                                        } else {
                                            player.playSound('note.bass', {
                                                pitch: 1.0,
                                                volume: 1.0
                                            })
                                            player.sendMessage('\xa7eShop \xa7i»\xa7f You don\'t have enough money to buy this!')
                                        }
                                    }
                                })
                            }
                        }
                    });
                },
                show_leaderboard: function(player) {
                    let lb_form = new ui.ActionFormData();
                    lb_form.label('\xa7i---\xa7bLEADERBOARD\xa7i---')
                    let players = s.world.getPlayers({ tags: ['hgncb:minigame.pvp'] }).sort((a, b) => {
                        let kills_a  = a.getDynamicProperty('hgncb:pvp.kills') ?? 0
                        let deaths_a = a.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                        let revoked_deaths_a = a.getDynamicProperty('hgncb:pvp.revoked_deaths') ?? 0

                        let kills_b  = b.getDynamicProperty('hgncb:pvp.kills') ?? 0
                        let deaths_b = b.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                        let revoked_deaths_b = b.getDynamicProperty('hgncb:pvp.revoked_deaths') ?? 0

                        let kdr_a_1 = (deaths_a - revoked_deaths_a) <= 0 ? kills_a : (kills_a) / (deaths_a - revoked_deaths_a)
                        let kdr_a_2 = isNaN(kdr_a_1) ? 0 : kdr_a_1
                        let kdr_b_1 = (deaths_b - revoked_deaths_b) <= 0 ? kills_b : (kills_b) / (deaths_b - revoked_deaths_b)
                        let kdr_b_2 = isNaN(kdr_b_1) ? 0 : kdr_b_1
                        return kdr_b_2 - kdr_a_2
                    })
                    player.setDynamicProperty('hgncb:pvp.is_viewing_leaderboard', true)
                    let str = ''
                    for (let i = 0; i < players.length; i++) {
                        let playersort = players[i]
                        if (playersort) {
                            let kills  = playersort.getDynamicProperty('hgncb:pvp.kills') ?? 0
                            let deaths = playersort.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                            let revoked_deaths = playersort.getDynamicProperty('hgncb:pvp.revoked_deaths') ?? 0

                            let kdr_a = (deaths - revoked_deaths) <= 0 ? kills : (kills) / (deaths - revoked_deaths)
                            let kdr_b = isNaN(kdr_a) ? 0 : kdr_a
                            str += `#\xa7b${i + 1} \xa7i- \xa7f${playersort.name} \xa7i- \xa7b${kdr_b.toFixed(3)}\xa7f KDR\n\xa7r`
                        }
                    }
                    lb_form.label(str)
                    lb_form.show(player).then(res => {
                        player.setDynamicProperty('hgncb:pvp.is_viewing_leaderboard', false)
                        if (res.canceled)
                            return -1;
                    });
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
                player.runCommand('effect @s clear')
                player.addTag(`hgncb:minigame.${this.id}`);
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
                let nametag_func = (() => {
                    if (player.getGameMode() === 'Creative') 
                        return '\xa7i\xa7oIn creative mode...'
                    else if (player.getDynamicProperty('hgncb:pvp.is_shopping')) 
                        return '\xa7e\xa7oShopping...'
                    else if (player.getDynamicProperty('hgncb:pvp.is_viewing_leaderboard')) 
                        return '\xa7a\xa7oViewing leaderboard...'
                    else return `${health_color}${health_percentage.toFixed(2)}\xa7r%`
                })
                player.nameTag = hg.methods.get_rank_text(player) + player.name + `\n${nametag_func()}`
                let kills  = player.getDynamicProperty('hgncb:pvp.kills') ?? 0
                let deaths = player.getDynamicProperty('hgncb:pvp.deaths') ?? 0
                let revoked_deaths = player.getDynamicProperty('hgncb:pvp.revoked_deaths') ?? 0

                let kdr_a = (deaths - revoked_deaths) <= 0 ? kills : (kills) / (deaths - revoked_deaths)
                let kdr_b = isNaN(kdr_a) ? 0 : (isFinite(kdr_a) ? kdr_a : kills)
                let combat = Math.max((player.getDynamicProperty('hgncb:timer.pvp.combat') ?? 0) / 20, 0)
                player.onScreenDisplay.setActionBar([
                    `\xa7aKills\xa7f: ${kills}\n`,
                    `\xa7cDeaths\xa7f: ${deaths}${revoked_deaths > 0 ? ` \xa7i\xa7o-${revoked_deaths}\xa7r` : ''}\n`,
                    `\xa7bKDR\xa7f: ${kdr_b.toFixed(3)}\n`,
                    combat > 0 ? `\xa7iCombat\xa7f: ${combat.toFixed(2)}s\n` : `\xa7i\xa7oYou are not in combat.`,
                ])

                if (player.getDynamicProperty('hgncb:pvp.is_shopping') || player.getDynamicProperty('hgncb:pvp.is_viewing_leaderboard')) {
                    player.addEffect('resistance', 2, {
                        amplifier: 255,
                        particles: true
                    })
                    player.teleport(player.location)
                }

                if (player.getGameMode() !== 'Creative') {
                    let equippable = player.getComponent('minecraft:equippable')
                    let container = player.getComponent('minecraft:inventory').container

                    let helmet = new s.ItemStack('minecraft:iron_helmet', 1)
                    let chestplate = new s.ItemStack('minecraft:iron_chestplate', 1)
                    let leggings = new s.ItemStack('minecraft:iron_leggings', 1)
                    let boots = new s.ItemStack('minecraft:iron_boots', 1)
                    let sword = new s.ItemStack('minecraft:iron_sword', 1)
                    let axe = new s.ItemStack('minecraft:iron_axe', 1)
                    let bow = new s.ItemStack('minecraft:bow', 1)
                    let gapple = new s.ItemStack('minecraft:golden_apple', 64)
                    let shop = new s.ItemStack('minecraft:enchanted_golden_apple', 1)
                    let leaderboard = new s.ItemStack('minecraft:spider_eye', 1)
                    let arrow = new s.ItemStack('minecraft:arrow', 64)
                    let shield = new s.ItemStack('minecraft:shield', 1)
                    
                    let helmet_enchantable     = helmet    .getComponent('minecraft:enchantable');
                    let chestplate_enchantable = chestplate.getComponent('minecraft:enchantable');
                    let leggings_enchantable   = leggings  .getComponent('minecraft:enchantable');
                    let boots_enchantable      = boots     .getComponent('minecraft:enchantable');
                    let sword_enchantable      = sword     .getComponent('minecraft:enchantable');
                    let axe_enchantable        = axe       .getComponent('minecraft:enchantable');
                    let bow_enchantable        = bow       .getComponent('minecraft:enchantable');
                    let shield_enchantable     = shield    .getComponent('minecraft:enchantable');

                    let sword_level      = player.getDynamicProperty('hgncb:pvp.sword_level'     ) ?? 0
                    let axe_level        = player.getDynamicProperty('hgncb:pvp.axe_level'       ) ?? 0
                    let helmet_level     = player.getDynamicProperty('hgncb:pvp.helmet_level'    ) ?? 0
                    let chestplate_level = player.getDynamicProperty('hgncb:pvp.chestplate_level') ?? 0
                    let leggings_level   = player.getDynamicProperty('hgncb:pvp.leggings_level'  ) ?? 0
                    let boots_level      = player.getDynamicProperty('hgncb:pvp.boots_level'     ) ?? 0

                    helmet     .nameTag = `\xa7r\xa7eIron Helmet${helmet_level > 0 ? ` \xa7i[\xa7elvl. ${helmet_level}\xa7i]` : ''}`
                    chestplate .nameTag = `\xa7r\xa7eIron Chestplate${chestplate_level > 0 ? ` \xa7i[\xa7elvl. ${chestplate_level}\xa7i]` : ''}`
                    leggings   .nameTag = `\xa7r\xa7eIron Leggings${leggings_level > 0 ? ` \xa7i[\xa7elvl. ${leggings_level}\xa7i]` : ''}`
                    boots      .nameTag = `\xa7r\xa7eIron Boots${boots_level > 0 ? ` \xa7i[\xa7elvl. ${boots_level}\xa7i]` : ''}`
                    sword      .nameTag = `\xa7r\xa7eIron Sword${sword_level > 0 ? ` \xa7i[\xa7elvl. ${sword_level}\xa7i]` : ''}`
                    axe        .nameTag = `\xa7r\xa7eIron Axe${axe_level > 0 ? ` \xa7i[\xa7elvl. ${axe_level}\xa7i]` : ''}`
                    bow        .nameTag = `\xa7r\xa7eBow`
                    shop       .nameTag = `\xa7r\xa7bShop`
                    leaderboard.nameTag = `\xa7r\xa7aLeaderboard`

                    helmet     .lockMode = 'slot'
                    chestplate .lockMode = 'slot'
                    leggings   .lockMode = 'slot'
                    boots      .lockMode = 'slot'
                    sword      .lockMode = 'slot'
                    axe        .lockMode = 'slot'
                    bow        .lockMode = 'slot'
                    gapple     .lockMode = 'slot'
                    shop       .lockMode = 'slot'
                    arrow      .lockMode = 'slot'
                    shield     .lockMode = 'slot'
                    
                    sword_level > 0 ? sword_enchantable.addEnchantment({
                        level: Math.min(sword_level, 5),
                        type: new s.EnchantmentType('sharpness')
                    }) : void 0;
                    axe_level   > 0 ? axe_enchantable.addEnchantment({
                        level: Math.min(axe_level, 5),
                        type: new s.EnchantmentType('sharpness')
                    }) : void 0;

                    helmet_level > 0 ? helmet_enchantable.addEnchantment({
                        level: Math.min(helmet_level, 4),
                        type: new s.EnchantmentType('protection')
                    }) : void 0;
                    chestplate_level   > 0 ? chestplate_enchantable.addEnchantment({
                        level: Math.min(chestplate_level, 4),
                        type: new s.EnchantmentType('protection')
                    }) : void 0;
                    leggings_level > 0 ? leggings_enchantable.addEnchantment({
                        level: Math.min(leggings_level, 4),
                        type: new s.EnchantmentType('protection')
                    }) : void 0;
                    boots_level   > 0 ? boots_enchantable.addEnchantment({
                        level: Math.min(boots_level, 4),
                        type: new s.EnchantmentType('protection')
                    }) : void 0;

                    container.getItem(0)?.typeId !== sword      .typeId ? container.setItem(0, sword      ) : void 0;
                    container.getItem(1)?.typeId !== axe        .typeId ? container.setItem(1, axe        ) : void 0;
                    container.getItem(2)?.typeId !== bow        .typeId ? container.setItem(2, bow        ) : void 0;
                    container.getItem(3)?.typeId !== gapple     .typeId ? container.setItem(3, gapple     ) : void 0;
                    container.getItem(7)?.typeId !== leaderboard.typeId ? container.setItem(7, leaderboard) : void 0;
                    container.getItem(8)?.typeId !== shop       .typeId ? container.setItem(8, shop       ) : void 0;
                    container.getItem(9)?.typeId !== arrow      .typeId ? container.setItem(9, arrow      ) : void 0;

                    equippable.getEquipment('Head'   )?.typeId !== helmet    .typeId ? equippable.setEquipment('Head'   , helmet    ) : void 0;
                    equippable.getEquipment('Chest'  )?.typeId !== chestplate.typeId ? equippable.setEquipment('Chest'  , chestplate) : void 0;
                    equippable.getEquipment('Legs'   )?.typeId !== leggings  .typeId ? equippable.setEquipment('Legs'   , leggings  ) : void 0;
                    equippable.getEquipment('Feet'   )?.typeId !== boots     .typeId ? equippable.setEquipment('Feet'   , boots     ) : void 0;
                    equippable.getEquipment('Offhand')?.typeId !== shield    .typeId ? equippable.setEquipment('Offhand', shield    ) : void 0;
                }
            }
        },
        {
            name: 'Random Events',
            id: 'random_events',
            permissions: {
                place_block: false,
                break_block: false,
                interact_with_block: false,
            },
            desc: 'random events game',
            npcs: [
                
            ],
            properties: {
                
            },
            methods: {
                reset: function() {
                    let game = hg.minigames.find(m => m.id === 'random_events')
                    let players_creative = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] })
                    let players          = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative'] })
                    hg.dimensions.overworld.runCommand('structure load hgncb:random_events.str.map -1025 250 -25')

                    for (let i = 0; i < players.length; i++) {
                        let player = players[i];

                        if (player) {
                            let pos = {
                                x: Math.cos((i / players.length) * (2 * Math.PI)) * 22.5 + game.location.x,
                                y: game.location.y,
                                z: Math.sin((i / players.length) * (2 * Math.PI)) * 22.5 + game.location.z
                            }
                            player.teleport(pos, {
                                facingLocation: {
                                    x: game.location.x,
                                    y: game.location.y + 1,
                                    z: game.location.z
                                }
                            })
                        }
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
            },
            on_tick: function() {

            },
            for_each_player: function(player) {
                if (!hg.methods.check_op(player)) {
                    player.setGameMode('Survival')
                }
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
                    `nothing in this part of the actionbar yet :)`,
                ])

                if (player.getDynamicProperty('hgncb:random_events.is_viewing_leaderboard')) {
                    player.addEffect('resistance', 2, {
                        amplifier: 255,
                        particles: true
                    })
                }
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
            },
            on_tick: function() {

            },
            for_each_player: function(player) {
                if (!hg.methods.check_op(player)) {
                    player.setGameMode('Survival')
                }
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

                    s.world.sendMessage(`${hg.methods.get_rank_text(e.sender)}${e.sender.name} \xa7i»\xa7r ${e.message}`.replaceAll('%', '%%')) // send the message globally
                }
            },
            itemUse: function(e) {
                let player = e.source;
                let item = e.itemStack;

                if (player && item) {
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('hgncb:minigame.')) {
                            let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                            if (game) {
                                switch (game.id) {
                                    case 'pvp':
                                        if (item) {
                                            switch (item.typeId) {
                                                case 'minecraft:enchanted_golden_apple':
                                                    e.cancel = true
                                                    s.system.run(() => game.methods.show_shop(player))
                                                    break;
                                                case 'minecraft:spider_eye':
                                                    e.cancel = true
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
                        player.sendMessage(`\xa7bWelcome to \xa7lHyperGames NCB\xa7r! \xa7i- \xa7f(\xa7b${hg.ver}\xa7f)`);
                    let hub = hg.minigames.find(g => g.id === 'hub');
                    hub.on_enter(player); // teleport the player to the hub

                    s.system.runTimeout(() => {
                        player.sendMessage('\xa7bType \xa7f!\xa7brules to show the rules of the server\xa7f!')
                        player.playSound('random.orb', {
                            pitch: 2.0,
                            volume: 2.0
                        })
                    }, 60)
                } else {
                    let player = e.player;
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('hgncb:minigame.')) {
                            let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                            if (game) {
                                switch (game.id) {
                                    case 'pvp':
                                        let block = hg.dimensions.overworld.getTopmostBlock({
                                            x: (Math.random() * 10) + game.location.x,
                                            z: (Math.random() * 10) + game.location.z
                                        })
                                        player.teleport({
                                            x: block.x,
                                            y: block.y + 1,
                                            z: block.z
                                        })
                                        player.addEffect('instant_health', 60, {
                                            amplifier: 255,
                                            particles: true
                                        }),
                                        player.addEffect('resistance', 60, {
                                            amplifier: 255,
                                            particles: true
                                        })
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
            projectileHitEntity: function(e) {
                let attacker = e.source;
                let target = e.getEntityHit().entity;

                if (attacker?.id !== target?.id && attacker?.typeId === 'minecraft:player' && target?.typeId === 'minecraft:player' && attacker.getGameMode() !== 'Creative' && target.getGameMode() !== 'Creative') {
                    attacker?.playSound('random.orb', {
                        pitch: 0.5,
                        volume: 1.0
                    })
                    attacker?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)
                    target?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)
                    attacker?.setDynamicProperty('hgncb:timer.pvp.combat', 300)
                    target?.setDynamicProperty('hgncb:timer.pvp.combat', 300)
                    attacker?.setDynamicProperty('hgncb:pvp.combat_id', target.id)
                    target?.setDynamicProperty('hgncb:pvp.combat_id', attacker.id)
                }
            },
            entityHitEntity: function(e) {
                let attacker = e.damagingEntity;
                let target = e.hitEntity;

                if (attacker?.id !== target?.id && attacker?.typeId === 'minecraft:player' && target?.typeId === 'minecraft:player' && attacker.getGameMode() !== 'Creative' && target.getGameMode() !== 'Creative') {
                    attacker?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)
                    target?.setDynamicProperty('hgncb:pvp.last_hit', s.system.currentTick)
                    attacker?.setDynamicProperty('hgncb:timer.pvp.combat', 300)
                    target?.setDynamicProperty('hgncb:timer.pvp.combat', 300)
                    attacker?.setDynamicProperty('hgncb:pvp.combat_id', target.id)
                    target?.setDynamicProperty('hgncb:pvp.combat_id', attacker.id)
                }
            },
            entityDie: function(e) {
                let attacker = e.damageSource.damagingEntity;
                let target = e.deadEntity;

                if (!attacker && target && target.typeId === 'minecraft:player')
                    hg.methods.diff_death(target, e.damageSource.cause)
                else if (attacker && target && attacker.typeId === 'minecraft:player' && target.typeId === 'minecraft:player')
                    for (let tag of attacker.getTags()) {
                        if (tag.startsWith('hgncb:minigame.')) {
                            let game = hg.minigames.find(g => g.id === tag.replace('hgncb:minigame.', ''));
                            if (game) {
                                switch (game.id) {
                                    case 'pvp':
                                        game.methods.kill_trade(attacker, target, e.damageSource.cause)
                                        break;
                                    case 'random_events':
                                        hg.methods.death_message(attacker, target, method, { tags: ['hgncb:minigame.random_events'] })
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
            s.system.currentTick % 3600 === 0 ? s.world.sendMessage('the owner is afk, he\'s left the game on overnight') : void 0;
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
                        npc.nameTag = `\xa7b${npc_data.text}\xa7r\n\xa7i\xa7o${player_count} players`
                        npc_comp.skinIndex !== npc_data.skin ? npc_comp.skinIndex = npc_data.skin : void 0;
                        npc.addTag(`hgncb:npc.${game.id}`)
                        npc.teleport(npc_data.location, {
                            facingLocation: { x: 0, y: 4, z: 0 }
                        })
                    } else if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${game.id}`] }).length > 0) {
                        let npc = hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${game.id}`] })[0]
                        let npc_comp = npc.getComponent('minecraft:npc')
                        let player_count = hg.dimensions.overworld.getPlayers({
                            tags: [`hgncb:minigame.${npc.link}`]
                        }).length
                        npc_comp.name = `\xa7b${npc_data.text}\xa7r\n\xa7i\xa7o${player_count} players`
                        npc.nameTag = `\xa7b${npc_data.text}\xa7r\n\xa7i\xa7o${player_count} players`
                        npc_comp.skinIndex !== npc_data.skin ? npc_comp.skinIndex = npc_data.skin : void 0;
                        npc.teleport(npc_data.location, {
                            facingLocation: { x: 0, y: 4, z: 0 }
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
                            let value = isNaN(parseFloat(args[2])) ? args[2] : parseFloat(args[2])
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
                    case 'no_shop':
                        for (let player of s.world.getPlayers()) {
                            player?.setDynamicProperty('hgncb:pvp.is_shopping', false)
                            player?.setDynamicProperty('hgncb:pvp.is_viewing_leaderboard', false)
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