import * as s   from '@minecraft/server';
import * as ui  from '@minecraft/server-ui';
import * as gt  from '@minecraft/server-gametest';
import * as cmn from '@minecraft/common';
import * as dbg from '@minecraft/debug-utilities';
import * as cui from './modules/chest_ui/forms.js';
import      b64 from './b64.js'

/*
    hypergames ncb v0.3.3-alpha.rev0
    probably not gonna be finished for a while
*/

gt.register(
    'hgncb', // Name of the class of tests.
    'spawn_fake_player', // Name of this test.
    test => {
        let id = '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
        let player = test.spawnSimulatedPlayer({ x: 0, y: 0, z: 0 }, `debugPlayer_${id}`, 'Survival')
    }
).maxTicks(24000)

let hg = {
    ver: 'v0.3.3-alpha.rev0',
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
        '    #\xa7b14 \xa7f- \xa7bDo not grief. this one seems obvious\xa7f.',
        '    #\xa7b14 \xa7f- \xa7bDo not kick people without giving them warnings\xa7f.',
        '    #\xa7b15 \xa7f- \xa7bIf someone accuses another person of breaking the rules, you must first verify if they are telling the truth\xa7f.'
    ],
    item_stats: {
        default: { dmg: 1 },

        wooden_sword   : { dmg: 4 },
        golden_sword   : { dmg: 4 },
        stone_sword    : { dmg: 5 },
        iron_sword     : { dmg: 6 },
        diamond_sword  : { dmg: 7 },

        wooden_axe     : { dmg: 3 },
        golden_axe     : { dmg: 3 },
        stone_axe      : { dmg: 4 },
        iron_axe       : { dmg: 5 },
        diamond_axe    : { dmg: 6 },

        wooden_pickaxe : { dmg: 2 },
        golden_pickaxe : { dmg: 2 },
        stone_pickaxe  : { dmg: 3 },
        iron_pickaxe   : { dmg: 4 },
        diamond_pickaxe: { dmg: 5 },

        wooden_shovel  : { dmg: 1 },
        golden_shovel  : { dmg: 1 },
        stone_shovel   : { dmg: 2 },
        iron_shovel    : { dmg: 3 },
        diamond_shovel : { dmg: 4 },

        wooden_hoe     : { dmg: 1 },
        golden_hoe     : { dmg: 1 },
        stone_hoe      : { dmg: 1 },
        iron_hoe       : { dmg: 1 },
        diamond_hoe    : { dmg: 1 },

        mace           : { dmg: 5 },
        trident        : { dmg: 8 }
    },
    armor_stats: {
        default             : { armor: 0 },

        leather_helmet      : { armor: 1 },
        leather_chestplate  : { armor: 3 },
        leather_leggings    : { armor: 2 },
        leather_boots       : { armor: 1 },

        chainmail_helmet    : { armor: 2 },
        chainmail_chestplate: { armor: 5 },
        chainmail_leggings  : { armor: 4 },
        chainmail_boots     : { armor: 1 },

        iron_helmet         : { armor: 2 },
        iron_chestplate     : { armor: 6 },
        iron_leggings       : { armor: 5 },
        iron_boots          : { armor: 2 },

        diamond_helmet      : { armor: 3 },
        diamond_chestplate  : { armor: 8 },
        diamond_leggings    : { armor: 6 },
        diamond_boots       : { armor: 3 },

        golden_helmet       : { armor: 2 },
        golden_chestplate   : { armor: 5 },
        golden_leggings     : { armor: 3 },
        golden_boots        : { armor: 1 },
    },
    methods: {
        // math
        random2: (a, b) => (Math.random() * (b - a)) + a,
        get_knockback_direction: (a, b) => Math.atan2(b.z - a.z, b.x - a.x),
        asyncPause: t => new Promise(resolve => s.system.runTimeout(resolve, t)),
        // other
        censor: input => {
            for (let swear of hg.swears) {
                let lowerSwear = swear.toLowerCase();

                // Create a regex pattern allowing spaces between the letters
                let pattern = lowerSwear.split('').join('\\s*');
                let regex = new RegExp(pattern, 'gi');

                input = input.replace(regex, match => {
                    // Replace with asterisks matching the original swear length (not the match length)
                    return '*'.repeat(swear.length);
                });
            }

            return input;
        },
        check_op: function(player) { // wrap the operator check, to make things easier
            try {
                if (player.commandPermissionLevel >= 2) return true;
                return false;
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                return false;
            }
        },
        getRankText: function(player) {
            try {
                return hg.ranks[player.name] ? hg.ranks[player.name].text.join('\xa7r ') + '\xa7r ' : '\xa7r'
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                return hg.ranks.default
            }
        },
        getRankLevel: function(player) {
            try {
                return hg.ranks[player.name] ? hg.ranks[player.name].level : 0
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                return 0;
            }
        },
        parse_bool: function(x='') {
            try {
                if (x.startsWith?.('true' )) return true;
                if (x.startsWith?.('false')) return false;
                return;
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                return;
            }
        },
        getTime: function(o=-4) {
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
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
            }
        },
        getRot: function(from, to) {
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
        getMinigame: function(player) {
            let name = player.getTags().find(t => t.startsWith('hgncb:minigame.'))
            return hg.minigames.find(g => g.id === name?.replace('hgncb:minigame.', ''));
        },
        clogPrevent: function(target, method) {
            try {
                let game = this.getMinigame(target)
                if (game) {
                    switch (game.id) {
                        case 'kitpvp':
                            let combat_timer = Math.max((target.getDynamicProperty('hgncb:timer.kitpvp.combat') ?? 0), 0)
                            let in_combat = (combat_timer > 0)
                            if (in_combat) {
                                let attacker = hg.dimensions.overworld.getPlayers().find(p => p.id === (target?.getDynamicProperty('hgncb:kitpvp.combat_id') ?? 0))
                                
                                if (attacker && target && attacker.typeId === 'minecraft:player' && target.typeId === 'minecraft:player') {
                                    game.methods.killTrade(attacker, target, method ?? 'clogPrevent')
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
            }
        },
        diffDeath: function(target, method='entityAttack', giveTo) {
            try {
                let game = this.getMinigame(target)
                if (game) {
                    switch (game.id) {
                        case 'kitpvp':
                            let combat_timer = Math.max((target.getDynamicProperty('hgncb:timer.kitpvp.combat') ?? 0), 0)
                            let in_combat = (combat_timer > 0)
                            let attacker = hg.dimensions.overworld.getPlayers().find(p => p.id === (target?.getDynamicProperty('hgncb:kitpvp.combat_id') ?? 0))
                            if (target && target.typeId === 'minecraft:player') {
                                game.methods.killTrade(in_combat ? attacker : undefined, target, method, giveTo)
                                
                                target.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                                target.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
                                target.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                                s.system.run(() => game.methods.showKitSel(target))
                            }
                            break;
                        case 'random_events':
                            game.methods.playerDie(undefined, target, method)
                            break;
                        case 'duels':
                            game.methods.playerDie(undefined, target, method)
                            break;
                        default:
                            break;
                    }
                }
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
            }
        },
        globalDeathHandle: function(attacker, target, method, giveTo) {
            try {
                let game = this.getMinigame(target)
                if (game) {
                    switch (game.id) {
                        case 'kitpvp':
                            game.methods.killTrade(attacker, target, method, giveTo)
                            target.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                            target.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
                            target.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                            s.system.run(() => game.methods.showKitSel(target))
                            break;
                        case 'random_events':
                            game.methods.playerDie(attacker, target, method)
                            break;
                        case 'duels':
                            break;
                        default:
                            break;
                    }
                }
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
            }
        },
        getHurtSound: function(cause) {
            switch (cause) {
                case 'fire':
                case 'fireTick':
                case 'lava':
                case 'magma':
                case 'campfire':
                    return 'mob.player.hurt_on_fire'
                case 'drowning':
                    return 'mob.player.hurt_drown'
                default:
                    return 'entity.player.hurt'
            }
        },
        calculate_dmg: function(initial=0, { attacker, target, cause }) {
            let attacker_equippable = attacker ? attacker.getComponent('minecraft:equippable') : void 0;
            let target_equippable = target.getComponent('minecraft:equippable')

            let attacker_equipment = attacker && attacker_equippable ? {
                head    : attacker_equippable.getEquipment('Head'),
                chest   : attacker_equippable.getEquipment('Chest'),
                legs    : attacker_equippable.getEquipment('Legs'),
                feet    : attacker_equippable.getEquipment('Feet'),
                mainhand: attacker_equippable.getEquipment('Mainhand'),
                offhand : attacker_equippable.getEquipment('Offhand')
            } : void 0;
            let target_equipment = {
                head    : target_equippable.getEquipment('Head'),
                chest   : target_equippable.getEquipment('Chest'),
                legs    : target_equippable.getEquipment('Legs'),
                feet    : target_equippable.getEquipment('Feet'),
                mainhand: target_equippable.getEquipment('Mainhand'),
                offhand : target_equippable.getEquipment('Offhand')
            }
            let attacker_enchantable = attacker && attacker_equipment ? {
                head    : attacker_equipment.head    ?.getComponent('minecraft:enchantable'),
                chest   : attacker_equipment.chest   ?.getComponent('minecraft:enchantable'),
                legs    : attacker_equipment.legs    ?.getComponent('minecraft:enchantable'),
                feet    : attacker_equipment.feet    ?.getComponent('minecraft:enchantable'),
                mainhand: attacker_equipment.mainhand?.getComponent('minecraft:enchantable'),
                offhand : attacker_equipment.offhand ?.getComponent('minecraft:enchantable'),
            } : void 0;
            let target_enchantable = {
                head    : target_equipment.head    ?.getComponent('minecraft:enchantable'),
                chest   : target_equipment.chest   ?.getComponent('minecraft:enchantable'),
                legs    : target_equipment.legs    ?.getComponent('minecraft:enchantable'),
                feet    : target_equipment.feet    ?.getComponent('minecraft:enchantable'),
                mainhand: target_equipment.mainhand?.getComponent('minecraft:enchantable'),
                offhand : target_equipment.offhand ?.getComponent('minecraft:enchantable'),
            }
            // attacker effects
            let attacker_strength = attacker && cause === 'entityAttack' ? ((attacker.getEffect('strength')?.amplifier) ?? -1) + 1 : 0
            let attacker_weakness = attacker && cause === 'entityAttack' ? ((attacker.getEffect('weakness')?.amplifier) ?? -1) + 1 : 0
            let attacker_resistance = attacker ? ((attacker.getEffect('resistance')?.amplifier) ?? -1) + 1 : 0

            // target effects
            let target_resistance = ((target.getEffect('resistance')?.amplifier) ?? -1) + 1

            // attacker enchantments
            let attacker_sharpness = attacker && cause === 'entityAttack' ? attacker_enchantable.mainhand?.getEnchantment('sharpness')?.level ?? 0 : 0
            let attacker_power = attacker && cause === 'projectile' ? attacker_enchantable.mainhand?.getEnchantment('power')?.level ?? 0 : 0
            let attacker_protection = attacker ?(
                (attacker_enchantable?.head    ?.getEnchantment('protection')?.level ?? 0) * 0.04 +
                (attacker_enchantable?.chest   ?.getEnchantment('protection')?.level ?? 0) * 0.04 +
                (attacker_enchantable?.legs    ?.getEnchantment('protection')?.level ?? 0) * 0.04 +
                (attacker_enchantable?.feet    ?.getEnchantment('protection')?.level ?? 0) * 0.04
            ) ** 2 : 0;

            // target enchantments
            let target_protection = (
                (target_enchantable.head    ?.getEnchantment('protection')?.level ?? 0) * 0.04 +
                (target_enchantable.chest   ?.getEnchantment('protection')?.level ?? 0) * 0.04 +
                (target_enchantable.legs    ?.getEnchantment('protection')?.level ?? 0) * 0.04 +
                (target_enchantable.feet    ?.getEnchantment('protection')?.level ?? 0) * 0.04
            ) ** 2
            let target_thorns = [
                (target_enchantable.head    ?.getEnchantment('thorns')?.level ?? 0) * 0.15,
                (target_enchantable.chest   ?.getEnchantment('thorns')?.level ?? 0) * 0.15,
                (target_enchantable.legs    ?.getEnchantment('thorns')?.level ?? 0) * 0.15,
                (target_enchantable.feet    ?.getEnchantment('thorns')?.level ?? 0) * 0.15
            ]

            // thorns calculation
            let stacked_dmg = 0;
            for (let t of target_thorns) {
                let r = Math.random()
                if (r < t) {
                    stacked_dmg += hg.methods.random2(1, 5)
                }
            }
            let thorns_damage = Math.min(stacked_dmg, 5);
            
            // final damage calculation
            let attacker_base = thorns_damage * (
                1 - 
                (
                    (hg.armor_stats[attacker_equipment?.head ?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04 +
                    (hg.armor_stats[attacker_equipment?.chest?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04 +
                    (hg.armor_stats[attacker_equipment?.legs ?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04 +
                    (hg.armor_stats[attacker_equipment?.feet ?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04
                )
            )
            let attacker_thorns_effects = attacker_base * (1 - 0.2 * attacker_resistance)
            let attacker_thorns_enchantments = attacker_thorns_effects * (1 - attacker_protection)
            let attacker_final_damage = Math.max(attacker_thorns_enchantments, 0)
            let hit_height = attacker?.getDynamicProperty('hgncb:fall_height') ?? 0
            let mace_condition =  attacker_equipment?.mainhand?.typeId === 'minecraft:mace' && !attacker?.isOnGround && !attacker?.getEffect('slow_falling') && hit_height > 1.5
            let mace_dmg = (() => {
                let res = 0;
                for (let i = 0; i < hit_height; i++) {
                    if (i < 3) {
                        res += 4
                    } else if (i >= 3 && i < 5) {
                        res += 2
                    } else {
                        res += 1;
                    }
                }
                return res;
            })()
            // order: base damage, effects, enchatments
            let base = (initial + (mace_condition ? 6 + mace_dmg : 0)) * (
                cause !== 'fall' && cause !== 'sonicBoom' ? 
                    1 - 
                    (
                        (hg.armor_stats[target_equipment.head ?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04 +
                        (hg.armor_stats[target_equipment.chest?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04 +
                        (hg.armor_stats[target_equipment.legs ?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04 +
                        (hg.armor_stats[target_equipment.feet ?.typeId.replace('minecraft:', '')]?.armor ?? hg.armor_stats.default.armor) * 0.04
                    )
                :
                    1
            ) * (attacker && attacker.isFalling ? 1.5 : 1.0)
            let attacker_effects = base + (3 * attacker_strength) - (4 * attacker_weakness)
            let target_effects = attacker_effects * (1 - 0.2 * target_resistance)
            let attacker_enchantments = target_effects + (attacker_sharpness > 0 ? 0.5 * attacker_sharpness + 0.5 : 0);
            let target_enchantments = attacker_enchantments * (1 - target_protection)
            let final_damage = Math.max(target_enchantments, 0)
            return {
                attacker: final_damage > 0 && attacker ? attacker_final_damage : 0,
                target: final_damage,
                cause: mace_condition ? 'maceSmash' : cause,
                hit_height
            };
        },
        calculate_vertical_knockback: function(attacker, amount) {
            if (attacker && attacker.isValid)
                return amount * (attacker.isSprinting ? 1.25 : 1.0)
            else return amount
        },
        play_sound_condition: function(id, dimension, opts, c, filter) {
            dimension.getPlayers(c).filter(p => p.isValid).filter(filter).forEach(p => p.playSound(id, opts))
        },
        applyCustomDamage: function(amount, { attacker, target, cause, knockback_direction, giveTo }) {
            if (!target || !target.isValid)
                return;

            if (target.typeId !== 'minecraft:player')
                return;

            if (target.getGameMode() === 'Creative' || target.getGameMode() === 'Spectator')
                return;

            if (target.getDynamicProperty('hgncb:kitpvp.is_selecting_kit'))
                return;

            if (!cause)
                return;

            let attacker_equippable = attacker?.getComponent('minecraft:equippable')
            let target_equippable = target.getComponent('minecraft:equippable')

            let attacker_equipment = attacker && attacker_equippable ? {
                head    : attacker_equippable.getEquipment('Head'),
                chest   : attacker_equippable.getEquipment('Chest'),
                legs    : attacker_equippable.getEquipment('Legs'),
                feet    : attacker_equippable.getEquipment('Feet'),
                mainhand: attacker_equippable.getEquipment('Mainhand'),
                offhand : attacker_equippable.getEquipment('Offhand')
            } : void 0;
            let target_equipment = {
                head    : target_equippable.getEquipment('Head'),
                chest   : target_equippable.getEquipment('Chest'),
                legs    : target_equippable.getEquipment('Legs'),
                feet    : target_equippable.getEquipment('Feet'),
                mainhand: target_equippable.getEquipment('Mainhand'),
                offhand : target_equippable.getEquipment('Offhand')
            }
            let attacker_enchantable = attacker && attacker_equipment ? {
                head    : attacker_equipment.head    ?.getComponent('minecraft:enchantable'),
                chest   : attacker_equipment.chest   ?.getComponent('minecraft:enchantable'),
                legs    : attacker_equipment.legs    ?.getComponent('minecraft:enchantable'),
                feet    : attacker_equipment.feet    ?.getComponent('minecraft:enchantable'),
                mainhand: attacker_equipment.mainhand?.getComponent('minecraft:enchantable'),
                offhand : attacker_equipment.offhand ?.getComponent('minecraft:enchantable'),
            } : void 0;
            let target_enchantable = {
                head    : target_equipment.head    ?.getComponent('minecraft:enchantable'),
                chest   : target_equipment.chest   ?.getComponent('minecraft:enchantable'),
                legs    : target_equipment.legs    ?.getComponent('minecraft:enchantable'),
                feet    : target_equipment.feet    ?.getComponent('minecraft:enchantable'),
                mainhand: target_equipment.mainhand?.getComponent('minecraft:enchantable'),
                offhand : target_equipment.offhand ?.getComponent('minecraft:enchantable'),
            }
            let attacker_fire_aspect = attacker ? attacker_enchantable?.mainhand?.getEnchantment('fire_aspect')?.level ?? 0 : 0
            attacker?.setDynamicProperty('hgncb:timer.kitpvp.shield_cd', 5)
            if ((target.getDynamicProperty('hgncb:timer.kitpvp.iframes') ?? 0) <= 0) {
                let damage = this.calculate_dmg(amount, { attacker, target, cause })
                let attacker_health = attacker?.getComponent('minecraft:health')
                let target_health   = target.getComponent  ('minecraft:health')

                let attacker_knockback_horizontal = 0.8
                let attacker_knockback_vertical = 0.4
                let target_knockback_horizontal = 0.8 * (attacker?.isSprinting ? 1.25 : 1.0)
                let target_knockback_vertical = this.calculate_vertical_knockback(attacker, 0.4)
                if (
                    damage.cause !== 'maceSmash' && 
                    damage.cause !== 'sonicBoom' && 
                    damage.cause !== 'thorns' && 
                    target.isSneaking && 
                    target_equipment.offhand?.typeId === 'minecraft:shield' && 
                    (target.getDynamicProperty('hgncb:timer.kitpvp.shield_cd') ?? 0) <= 0 &&
                    (target.getDynamicProperty('hgncb:timer.kitpvp.shield_disable') ?? 0) <= 0 &&
                    attacker
                ) {
                    if (damage.cause === 'entityAttack')
                        attacker.applyKnockback({
                            x: Math.cos(hg.methods.get_knockback_direction(target.location, attacker?.location)) * attacker_knockback_horizontal,
                            z: Math.sin(hg.methods.get_knockback_direction(target.location, attacker?.location)) * attacker_knockback_horizontal
                        }, attacker_knockback_vertical)
                    target.dimension.playSound('item.shield.block', target.location, {
                        volume: 1,
                        pitch: hg.methods.random2(0.8, 1.2)
                    })
                    if (attacker_equipment?.mainhand?.hasTag('minecraft:is_axe')) {
                        target.dimension.playSound('random.break', target.location, {
                            volume: 1,
                            pitch: hg.methods.random2(0.8, 1.2)
                        })
                        target.setDynamicProperty('hgncb:timer.kitpvp.shield_disable', 100)
                    }
                    return;
                } else if (damage.cause === 'maceSmash') {
                    if (damage.target <= 0) {
                        if (attacker) this.play_sound_condition('entity.player.attack.nodamage', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
                    } else {
                        if (attacker?.isSprinting)
                            if (attacker) 
                                this.play_sound_condition('entity.player.attack.knockback', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
                        else
                            if (attacker) 
                                this.play_sound_condition('entity.player.attack.strong', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
                        if (damage.hit_height <= 5 && !target.isOnGround)
                            attacker?.dimension.playSound('mace.smash_air', attacker?.location)
                        if (damage.hit_height <= 5 && target.isOnGround)
                            attacker?.dimension.playSound('mace.smash_ground', attacker?.location)
                        else if (damage.hit_height > 5)
                            attacker?.dimension.playSound('mace.heavy_smash_ground', attacker?.location)
                        attacker?.clearVelocity()
                        attacker?.setDynamicProperty('hgncb:fall_height', undefined)
                        attacker?.setDynamicProperty('hgncb:starting_height', undefined)

                        if (attacker)
                            for (let entity of attacker.dimension.getEntities({ location: attacker.location, maxDistance: 2.5 })) {
                                if (entity.id === attacker.id)
                                    continue

                                if (entity.id === target.id)
                                    continue

                                if (entity.hasComponent('minecraft:projectile'))
                                    continue

                                entity.applyKnockback({
                                    x: Math.cos(hg.methods.get_knockback_direction(attacker.location, entity.location)) * attacker_knockback_horizontal * 1.5,
                                    z: Math.sin(hg.methods.get_knockback_direction(attacker.location, entity.location)) * attacker_knockback_horizontal * 1.5
                                }, attacker_knockback_vertical)
                            }
                    }
                } else if (damage.cause === 'entityAttack') {
                    if (damage.target <= 0) {
                        if (attacker) this.play_sound_condition('entity.player.attack.nodamage', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
                    } else {
                        if (attacker?.isFalling) {
                            if (attacker) this.play_sound_condition('entity.player.attack.crit', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
                            target.dimension.spawnParticle('minecraft:critical_hit_emitter', {
                                x: target.location.x,
                                y: Math.min(((target.location.y + target.getHeadLocation().y) / 2) + 1, 320),
                                z: target.location.z,
                            })
                        } else if (attacker?.isSprinting)
                            if (attacker) this.play_sound_condition('entity.player.attack.knockback', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
                        
                        if (!attacker?.isSprinting && !attacker?.isFalling)
                            if (attacker) this.play_sound_condition('entity.player.attack.strong', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
                    }
                }
                if (attacker)
                    if (((attacker_health.currentValue - damage.attacker) <= 0)) {
                        attacker_health.resetToMaxValue()
                        attacker.dimension.playSound(hg.methods.getHurtSound(damage.cause), attacker.location, {
                            volume: 1,
                            pitch: hg.methods.random2(0.8, 1.2)
                        })
                        attacker.teleport({
                            x: attacker.getSpawnPoint?.()?.x ?? s.world.getDefaultSpawnLocation?.().x,
                            y: attacker.getSpawnPoint?.()?.y ?? s.world.getDefaultSpawnLocation?.().y,
                            z: attacker.getSpawnPoint?.()?.z ?? s.world.getDefaultSpawnLocation?.().z
                        }, {
                            dimension: attacker.getSpawnPoint?.()?.dimension ?? hg.dimensions.overworld
                        })
                        target ? this.globalDeathHandle(target, attacker, 'thorns', giveTo) : this.diffDeath(attacker, 'thorns', giveTo)
                        attacker.runCommand('clear')
                        attacker.runCommand('effect @s clear')
                    } else {
                        damage.attacker > 0 ? attacker_health.setCurrentValue(Math.max(attacker_health.currentValue - damage.attacker, 0)) : void 0;
                        damage.attacker > 0 ? attacker.dimension.playSound(hg.methods.getHurtSound(damage.cause), attacker.location, {
                            volume: 1,
                            pitch: hg.methods.random2(0.8, 1.2)
                        }) : void 0;
                        damage.attacker > 0 ? attacker.dimension.playSound('damage.thorns', attacker.location, {
                            volume: 1,
                            pitch: hg.methods.random2(0.8, 1.2)
                        }) : void 0;
                        damage.attacker > 0 ? attacker.applyKnockback({
                            x: Math.cos(hg.methods.get_knockback_direction(target.location, attacker.location)) * attacker_knockback_horizontal,
                            z: Math.sin(hg.methods.get_knockback_direction(target.location, attacker.location)) * attacker_knockback_horizontal
                        }, attacker_knockback_vertical) : void 0;
                        damage.attacker > 0 && typeof attacker.getProperty('hgncb:visual.hurt') !== 'undefined' ? attacker.setProperty('hgncb:visual.hurt', 9) : void 0;
                        damage.attacker > 0 ? attacker.setDynamicProperty('hgncb:timer.kitpvp.iframes', 10) : void 0;
                    }

                if ((target_health.currentValue - damage.target) <= 0) {
                    target_health.resetToMaxValue()
                    target.dimension.playSound(hg.methods.getHurtSound(damage.cause), target.location, {
                        volume: 1,
                        pitch: hg.methods.random2(0.8, 1.2)
                    })
                    target.teleport({
                        x: target.getSpawnPoint()?.x ?? s.world.getDefaultSpawnLocation().x,
                        y: target.getSpawnPoint()?.y ?? s.world.getDefaultSpawnLocation().y,
                        z: target.getSpawnPoint()?.z ?? s.world.getDefaultSpawnLocation().z
                    }, {
                        dimension: target.getSpawnPoint()?.dimension ?? hg.dimensions.overworld
                    })
                    attacker ? this.globalDeathHandle(attacker, target, damage.cause, giveTo) : this.diffDeath(target, damage.cause, giveTo)
                    target.runCommand('clear')
                    target.runCommand('effect @s clear')
                } else {
                    damage.target > 0 ? target_health.setCurrentValue(Math.max(target_health.currentValue - damage.target, 0)) : void 0;
                    damage.target > 0 ? target.dimension.playSound(hg.methods.getHurtSound(damage.cause), target.location, {
                        volume: 1,
                        pitch: hg.methods.random2(0.8, 1.2)
                    }) : void 0;
                    damage.target > 0 && cause === 'thorns' ? target.dimension.playSound('damage.thorns', target.location, {
                        volume: 1,
                        pitch: hg.methods.random2(0.8, 1.2)
                    }) : void 0;
                    damage.target > 0 && attacker ? target.applyKnockback({
                        x: knockback_direction?.x ?? (attacker.getViewDirection().x * target_knockback_horizontal + (attacker.getVelocity().x * 2)),
                        z: knockback_direction?.z ?? (attacker.getViewDirection().z * target_knockback_horizontal + (attacker.getVelocity().z * 2))
                    }, knockback_direction?.y ?? target_knockback_vertical) : void 0;
                    damage.target > 0 && typeof target.getProperty('hgncb:visual.hurt') !== 'undefined' ? target.setProperty('hgncb:visual.hurt', 9) : void 0;
                    damage.target > 0 ? target.setDynamicProperty('hgncb:timer.kitpvp.iframes', 10) : void 0;
                    damage.target > 0 && attacker_fire_aspect > 0 ?
                        target.setOnFire(attacker_fire_aspect * 4)
                    :
                        void 0;
                }
            } else {
                if (cause === 'entityAttack')
                    if (attacker) 
                        this.play_sound_condition('entity.player.attack.nodamage', attacker.dimension, { location: attacker.location }, { tags: ['hgncb:minigame.kitpvp'] }, p => p.getDynamicProperty('hgncb:setting.enableKitPvpSounds'))
            }
        },
        death_message: function(attacker, target, method, filter) {
            try {
                for (let player of hg.dimensions.overworld.getPlayers(filter)) {
                    switch (method) {
                        case 'anvil':
                            attacker && attacker.isValid ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling anvil whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling anvil`)
                            break;
                        case 'blockExplosion':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas killed by [Intentional Game Design] due to \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas killed by [Intentional Game Design]`)
                            break;
                        case 'campfire':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwalked into a campfire whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwalked into a campfire`)
                            break;
                        case 'clogPrevent':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7icombat logged to \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7icombat logged`)
                            break;
                        case 'contact':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas slain by \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'drowning':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idrowned whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idrowned`)
                            break;
                        case 'entityAttack':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas slain by \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'entityExplosion':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas blown up by \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iblew up`)
                            break;
                        case 'fall':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7ifell from a high place whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7ifell from a high place`)
                            break;
                        case 'fallingBlock':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling block whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas squashed by a falling block`)
                            break;
                        case 'fire':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwalked into fire whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwent up in flames`)
                            break;
                        case 'fireTick':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iburned to death whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iburned to death`)
                            break;
                        case 'fireworks':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwent off with a bang whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwent off with a bang`)
                            break;
                        case 'fly_into_wall':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iexperienced kinetic energy whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iexperienced kinetic energy`)
                            break;
                        case 'freezing':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7ibecame an ice block whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7ifroze to death`)
                            break;
                        case 'lava':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7itried to swim in lava to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                                :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7itried to swim in lava`)
                            break;
                        case 'lightning':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas struck by lightning whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                                :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas struck by lightning`)
                            break;
                        case 'maceSmash':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas smashed by \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'magic':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas killed by \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}\xa7i using magic`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas killed by magic`)
                            break;
                        case 'magma':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwalked into danger zone whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idiscovered floor was lava`)
                            break;
                        case 'none':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied because of \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}\xa7i`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'override':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied because of \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}\xa7i`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'piston':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied because of \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}\xa7i.`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'projectile':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas shot by \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'sonicBoom':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas obliterated by a sonically-charged shriek whilst trying to escape \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas obliterated by a sonically-charged shriek`)
                            break;
                        case 'thorns':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7iwas killed trying to hurt \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                        case 'void':
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7ididn\'t want to live in the same world as \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7ifell out of the world`)
                            break;
                        default:
                            attacker && attacker.isValid  ? 
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied because of \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`}\xa7i`)
                            :
                                player.sendMessage(`\xa7cX_X \xa7i» \xa7r${(target.getDynamicProperty('hgncb:display_name') ?? target.name) ?? `%${target.localizationKey}`} \xa7idied`)
                            break;
                    }
                }
            } catch (err) {
                s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
            }
        }
    },
    ranks: {
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
        DragioPlays:  {
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
                java_pvp: true,
                java_pvp_attack_players: false,
                java_pvp_attack_entities: false,
                java_pvp_nullify_damage: false
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
                    scene: 'hgncb:dialogue.kitpvp_enter'
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
                    scene: 'hgncb:dialogue.random_events_enter'
                },
                {
                    text: 'Duels [BETA]',
                    id: 'npc_duels',
                    skin: 1,
                    location: {
                        x: 4.5,
                        y: 2.0,
                        z: 17.5
                    },
                    link: 'duels',
                    scene: 'hgncb:dialogue.duels_enter'
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
                    duration: 10,
                    amplifier: 255,
                    particles: false
                },
                {
                    id: 'saturation',
                    duration: 10,
                    amplifier: 255,
                    particles: false
                }
            ],
            location: {
                x: 0.5,
                y: 3,
                z: 0.5
            },
            onEnter: function(player) {
                try {
                    hg.methods.clogPrevent(player)
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
                    if (player.dimension.getPlayers({ tags: [`hgncb:minigame.${this.id}`] }).length === 0) {
                        this.methods.reset()
                    }
                    player.addTag(`hgncb:random_events.dead`);
                    player.removeTag(`hgncb:duels.picked`);



                    player.inputPermissions.setPermissionCategory(1, true)
                    player.inputPermissions.setPermissionCategory(2, true)
                } catch (err) {
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            onTick: function() {

            },
            forEachPlayer: function(player) {
                if (player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Survival')
                    player.setGameMode('Survival')
                player.nameTag = hg.methods.getRankText(player) + (player.getDynamicProperty('hgncb:display_name') ?? player.name)
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
                java_pvp: false,
                java_pvp_attack_players: true,
                java_pvp_attack_entities: true,
                java_pvp_nullify_damage: true
            },
            desc: 'PVP - but revamped with new kits!',
            npcs: [
                
            ],
            properties: {
                // #region kitpvp_shop
                shop: [
                    {
                        section_id: 'boosts',
                        section_name: 'Boosts',
                        items: [
                            {
                                text: 'Strength 1 (60s)',
                                id: 'strength_1',
                                cost: 10000,
                                condition: player => true,
                                on_buy: player => {
                                    player.setDynamicProperty('hgncb:timer.kitpvp.strength_0', 1200)
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Strength 1)`)
                                }
                            },
                            {
                                text: 'Strength 2 (60s)',
                                id: 'strength_2',
                                cost: 20000,
                                condition: player => true,
                                on_buy: player => {
                                    player.setDynamicProperty('hgncb:timer.kitpvp.strength_1', 1200)
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Strength 2)`)
                                }
                            },
                            {
                                text: 'Strength 3 (60s)',
                                id: 'strength_3',
                                cost: 40000,
                                condition: player => true,
                                on_buy: player => {
                                    player.setDynamicProperty('hgncb:timer.kitpvp.strength_2', 1200)
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Strength 3)`)
                                }
                            },
                            {
                                text: 'Resistance 1 (60s)',
                                id: 'resistance_1',
                                cost: 500,
                                condition: player => true,
                                on_buy: player => {
                                    player.setDynamicProperty('hgncb:timer.kitpvp.resistance_0', 1200)
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Resistance 1)`)
                                }
                            },
                            {
                                text: 'Resistance 2 (60s)',
                                id: 'resistance_2',
                                cost: 1000,
                                condition: player => true,
                                on_buy: player => {
                                    player.setDynamicProperty('hgncb:timer.kitpvp.resistance_1', 1200)
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Resistance 2)`)
                                }
                            },
                            {
                                text: 'Resistance 3 (60s)',
                                id: 'resistance_3',
                                cost: 2000,
                                condition: player => true,
                                on_buy: player => {
                                    player.setDynamicProperty('hgncb:timer.kitpvp.resistance_2', 1200)
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought boost! \xa7i(Resistance 3)`)
                                }
                            }
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
                                text: 'Puffer',
                                id: 'puffer',
                                cost: 750,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('puffer'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('puffer')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Puffer Kit)`)
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
                                text: 'French',
                                id: 'french',
                                cost: 1000,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('french'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('french')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(French Kit)`)
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
                            {
                                text: 'Thorn',
                                id: 'Thorn',
                                cost: 2000,
                                condition: player => !(player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',').includes('thorn'),
                                on_buy: player => {
                                    let kits = (player.getDynamicProperty('hgncb:kitpvp.kits') ?? 'basic').split(',')
                                    kits.push('thorn')
                                    player.setDynamicProperty('hgncb:kitpvp.kits', kits.join(','))
                                    player.sendMessage(`\xa7eShop \xa7i»\xa7e Successfully bought kit! \xa7i(Thorn Kit)`)
                                    player.runCommand('clear @s[m=!c]')
                                }
                            },
                        ]
                    }
                ],
                // #endregion kitpvp_shop
                // #region kitpvp_kits
                kits: [
                    {
                        text: '\xa7eBasic',
                        id: 'basic',
                        icon: 'minecraft:shield',
                        desc: ['\xa78the default kit'],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:iron_sword',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:iron_axe',
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
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:leather_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:iron_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:leather_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7eFrench',
                        id: 'french',
                        icon: 'minecraft:bread',
                        desc: ['\xa7vWith this kit, you get a Baguette that dealts a ton of knockback\xa7f!'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:stone_axe',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:bread',
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
                            }
                        ],
                        potions: [
                            
                        ],
                        armor: [
                            {
                                name: 'minecraft:leather_helmet',
                                slot: 'Head',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:leather_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:leather_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:leather_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'protection'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:shield',
                                slot: 'Offhand',
                                enchantments: []
                            }
                        ]
                    },
                    {
                        text: '\xa7bThorn',
                        id: 'thorn',
                        icon: 'minecraft:rose_bush',
                        desc: ['\xa78you have full thorns 3 armor'],
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
                            
                        ],
                        armor: [
                            {
                                name: 'minecraft:leather_helmet',
                                slot: 'Head',
                                enchantments: [
                                    {
                                        level: 3,
                                        type: 'thorns'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:chainmail_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 3,
                                        type: 'thorns'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:leather_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 3,
                                        type: 'thorns'
                                    }
                                ],
                            },
                            {
                                name: 'minecraft:leather_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 3,
                                        type: 'thorns'
                                    }
                                ],
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
                        text: '\xa7ePuffer',
                        id: 'puffer',
                        icon: 'minecraft:pufferfish_bucket',
                        desc: ['\xa78pufferfish joins the battle!'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:stone_axe',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:fishing_rod',
                                slot: 1,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:pufferfish_bucket',
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
                        ],
                        armor: [
                            {
                                name: 'minecraft:iron_helmet',
                                slot: 'Head',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    },
                                    {
                                        level: 1,
                                        type: 'thorns'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    },
                                    {
                                        level: 1,
                                        type: 'thorns'
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
                                    },
                                    {
                                        level: 1,
                                        type: 'thorns'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    },
                                    {
                                        level: 1,
                                        type: 'thorns'
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
                                slot: 4,
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
                                name: 'minecraft:snowball',
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
                            '\xa7qThese Wind Charges have a cooldown of 4 seconds.'
                        ],
                        ench: false,
                        items: [
                            {
                                name: 'minecraft:mace',
                                slot: 0,
                                enchantments: []
                            },
                            {
                                name: 'minecraft:wind_charge',
                                slot: 1,
                                enchantments: [],
                                count: 8
                            },
                            {
                                name: 'minecraft:wooden_axe',
                                slot: 2,
                                enchantments: [
                                    {
                                        level: 1,
                                        type: 'sharpness'
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
                        icon: 'minecraft:sparkler',
                        desc: [
                            '\xa73With this kit, you get a wand \xa78(the sparkler)\xa73 that can shoot beams.',
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
                                name: 'minecraft:sparkler',
                                slot: 1,
                                enchantments: [],
                                nameTag: '\xa7r\xa7dWand'
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
                                name: 'minecraft:chainmail_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 2,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:chainmail_boots',
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
                        text: '\xa7eAlchemist',
                        id: 'alchemist',
                        icon: 'minecraft:splash_potion',
                        desc: ['\xa78alot of potions ig, idk'],
                        ench: true,
                        items: [
                            {
                                name: 'minecraft:golden_axe',
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
                                    liquid: 'Lingering',
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
                                name: 'minecraft:chainmail_leggings',
                                slot: 'Legs',
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
                                        level: 4,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:iron_chestplate',
                                slot: 'Chest',
                                enchantments: [
                                    {
                                        level: 4,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:iron_leggings',
                                slot: 'Legs',
                                enchantments: [
                                    {
                                        level: 4,
                                        type: 'protection'
                                    }
                                ]
                            },
                            {
                                name: 'minecraft:iron_boots',
                                slot: 'Feet',
                                enchantments: [
                                    {
                                        level: 4,
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
                // #endregion kitpvp_kits
            },
            methods: {
                // #region kitpvp_killTrade
                earnXP: function(player, amount) {
                    let old_xp     = player.getDynamicProperty('hgncb:kitpvp.xp' ) ?? 0
                    let old_lvl    = player.getDynamicProperty('hgncb:kitpvp.lvl') ?? 0
                    let lvl_thresh = 500 + old_lvl * 100;

                    let new_xp  = old_xp + amount;
                    let new_lvl = old_lvl;
                    while (new_xp > lvl_thresh) {
                        new_lvl += 1;
                        new_xp -= lvl_thresh;
                        lvl_thresh = 500 + new_lvl * 100;
                    }
                    if (new_lvl > old_lvl) {
                        player.playSound('random.levelup', {
                            pitch: 1.0,
                            volume: 1.0
                        })
                        player.onScreenDisplay.setTitle('\xa7aYou have leveled up!')
                        player.onScreenDisplay.updateSubtitle(`\xa7b${old_lvl} \xa7f-> \xa7b${new_lvl}`)
                    }
                    player.setDynamicProperty('hgncb:kitpvp.xp' , new_xp )
                    player.setDynamicProperty('hgncb:kitpvp.lvl', new_lvl)
                },
                visualBar: function(value, size) {
                    let a = '\xa7a' + '|'.repeat(Math.floor(value * size))
                    let b = '\xa7i' + '|'.repeat(size - Math.floor(value * size))

                    return a + b + '\xa7r';
                },
                killTrade: function(attacker, target, method='contact', giveTo) {
                    let origAttacker = giveTo ? attacker : undefined
                    attacker = giveTo ?? attacker
                    try {
                        if (attacker && attacker.id !== target.id && attacker.typeId === 'minecraft:player') {
                            if (attacker.getGameMode() !== 'Creative') {
                                let attacker_kills  = attacker.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                                let attacker_coins  = attacker.getDynamicProperty('hgncb:kitpvp.coins') ?? 0
                                let attacker_xp  = attacker.getDynamicProperty('hgncb:kitpvp.xp') ?? 0
                                let attacker_deaths = attacker.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                                let target_kills    = target.getDynamicProperty('hgncb:kitpvp.kills') ?? 0
                                let target_coins    = target.getDynamicProperty('hgncb:kitpvp.coins') ?? 0
                                let target_deaths   = target.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0
                                let attacker_health = attacker.getComponent('minecraft:health')
                                let target_health = target.getComponent('minecraft:health')
                                
                                let coins_earned = 20 + Math.round(Math.random() * 15) + (target.hasTag('hgncb:kitpvp.event_target') ? 50 : 0)
                                let xp_earned = 10 + Math.round(Math.random() * 10) + (target.hasTag('hgncb:kitpvp.event_target') ? 20 : 0)
                                let effect = s.world.getDynamicProperty('hgncb:kitpvp.global.event_effect') ?? (Math.random() < 0.5 ? 'resistance' : 'strength')
                                if (target.hasTag('hgncb:kitpvp.event_target')) {
                                    attacker.addEffect(effect, 1200, {
                                        amplifier: 2,
                                        showParticles: true
                                    })
                                }
                                let ms = false
                                if ((attacker_kills + 1) !== 0 && (attacker_kills + 1) % 50 === 0) {
                                    attacker.sendMessage(`\xa7a^_^ \xa7i» \xa7iYou win \xa7b500\xa7i coins!`)
                                    ms = true
                                    for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.kitpvp'] })) {
                                        player.sendMessage(`\xa7a^_^ \xa7i» \xa7f${(attacker.getDynamicProperty('hgncb:display_name') ?? attacker.name) ?? `%${attacker.localizationKey}`} \xa7ihas gotten \xa7b${attacker_kills + 1}\xa7i kills!`)
                                        s.system.run(() => 
                                            player.isValid ? 
                                                player.playSound('random.levelup', {
                                                    pitch: 2.0,
                                                    volume: 1.0
                                                }) 
                                            : 
                                                void 0
                                        )
                                    }
                                }

                                s.system.run(() => attacker.extinguishFire());
                                target.setDynamicProperty('hgncb:timer.kitpvp.gapple', 0)
                                target.setDynamicProperty('hgncb:timer.kitpvp.pot', 0)
                                target.setDynamicProperty('hgncb:timer.kitpvp.sonic', 0)
                                target.setDynamicProperty('hgncb:timer.kitpvp.wc', 0)
                                target.setDynamicProperty('hgncb:timer.kitpvp.pufferfish', 0)

                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:timer.kitpvp.gapple', 0) : void 0
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:timer.kitpvp.pot', 0) : void 0
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:timer.kitpvp.sonic', 0) : void 0
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:timer.kitpvp.wc', 0) : void 0
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:timer.kitpvp.pufferfish', 0) : void 0
                                
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:kitpvp.is_shopping', false) : void 0
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false) : void 0
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false) : void 0

                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:kitpvp.kills', attacker_kills + 1) : void 0
                                attacker?.isValid ? attacker.setDynamicProperty('hgncb:kitpvp.coins', attacker_coins + coins_earned + (ms ? 500 : 0)) : void 0
                                target.setDynamicProperty('hgncb:kitpvp.coins', target_coins + 2)
                                attacker?.isValid ? this.earnXP(attacker, xp_earned) : void 0
                                attacker?.isValid ? attacker.sendMessage(`\xa7a^_^ \xa7i» \xa7iYou have won \xa7b${coins_earned}\xa7i coins and \xa7a${xp_earned}\xa7i XP for killing \xa7f${target.name}\xa7i!`) : void 0
                                attacker ? target.sendMessage(`\xa7eX_X \xa7i» \xa7iYou have been slain by \xa7f${attacker.name ?? attacker.nameTag ?? `%${attacker.localizationKey}`}\xa7i. You get \xa7b${2}\xa7i gold.`) : void 0;
                                target.setDynamicProperty('hgncb:kitpvp.deaths', target_deaths + 1)
                                s.system.run(() => attacker?.isValid ? attacker_health?.resetToMaxValue() : void 0)
                                s.system.run(() => {
                                    for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.kitpvp'] })) {
                                        if (player?.id === attacker.id)
                                            player?.runCommand('playsound note.bell @s ~ ~ ~ 1 2   1')
                                        else if (player?.id === target.id)
                                            player?.runCommand('playsound note.hat  @s ~ ~ ~ 1 0.5 1')
                                        else
                                            player?.runCommand('playsound note.bell @s ~ ~ ~ 1   1 1')
                                    }
                                })
                                s.system.run(() => {
                                    let cw  = attacker .dimension.getPlayers().find(p => p.isValid && p.getDynamicProperty('hgncb:kitpvp.combat_id') === attacker?.id)
                                    let cwa = cw      ?.dimension.getPlayers().find(p => p.isValid && p.getDynamicProperty('hgncb:kitpvp.combat_id') === cw      ?.id)
                                    cwa?.setDynamicProperty('hgncb:timer.kitpvp.combat', undefined)
                                    cw ?.setDynamicProperty('hgncb:timer.kitpvp.combat', undefined)
                                    cwa?.setDynamicProperty('hgncb:kitpvp.combat_id',    undefined)
                                    cw ?.setDynamicProperty('hgncb:kitpvp.combat_id',    undefined)
                                })
                            }
                        } else {
                            let target_kills    = target.getDynamicProperty('hgncb:kitpvp.kills')  ?? 0;
                            let target_deaths   = target.getDynamicProperty('hgncb:kitpvp.deaths') ?? 0;
                            target.setDynamicProperty('hgncb:kitpvp.deaths', target_deaths ?? + 1)
                            s.system.run(() => {
                                for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.kitpvp'] })) {
                                    if (player?.id === target.id)
                                        player?.runCommand('playsound note.hat  @s ~ ~ ~ 1 0.5 1')
                                    else
                                        player?.runCommand('playsound note.bell @s ~ ~ ~ 1   1 1')
                                }
                            })
                            target.setDynamicProperty('hgncb:timer.kitpvp.combat', undefined)
                            target.setDynamicProperty('hgncb:kitpvp.combat_id', undefined)
                        }

                        hg.methods.death_message(attacker, target, method, { tags: ['hgncb:minigame.kitpvp'] })
                    } catch (err) {
                        s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                    }
                },
                // #endregion kitpvp_killTrade
                // #region kitpvp_showShop
                showShop: function(player, kitsel) {
                    if (!player || !player.isValid)
                        return;
                    try {
                        let shop_form_sel = new ui.ActionFormData();
                        
                        let kitpvp = hg.minigames.find(m => m.id === 'kitpvp')

                        let coins = player.getDynamicProperty('hgncb:kitpvp.coins') ?? 0
                        let xp = player.getDynamicProperty('hgncb:kitpvp.xp') ?? 0
                        let lvl = player.getDynamicProperty('hgncb:kitpvp.lvl') ?? 0
                        let lvl_thresh = 500 + lvl * 100;
                        let sections = kitpvp.properties.shop
                        shop_form_sel.title(`Shop`)
                            .body([
                                `\xa7i---\xa7bSHOP\xa7i---`,
                                `\xa7eCoins\xa7i: \xa7e${coins}\xa7f`,
                                `\xa7aXP\xa7i: \xa7i[\xa7a${xp} \xa7i/ \xa7a${lvl_thresh}\xa7i] \xa7i[${this.visualBar(xp / lvl_thresh, 30)}\xa7i]`,
                                `\xa7fLvl\xa7i. \xa7b${lvl}\xa7f\xa7.\xa7f`
                            ].join('\n'))
                        shop_form_sel.label(`\xa7f\xa7bCategories\xa7f:`)
                        
                        for (let section of sections) {
                            shop_form_sel.button(section.section_name);
                        }
                        !kitsel ? player.setDynamicProperty('hgncb:kitpvp.is_shopping', true) : void 0;
                        shop_form_sel.show(player).then(res => {
                            if (!player || !player.isValid)
                                return -1;
                            if (res.canceled) {
                                player.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                                kitsel ? this.showKitSel(player) : void 0;
                                return -1;
                            } else {
                                let shop_form = new ui.ActionFormData();
                                shop_form.title(kitpvp.properties.shop[res.selection].section_name)
                                let items = kitpvp.properties.shop[res.selection].items.filter(i => i.condition(player))
                                if (items) {
                                    shop_form.body([
                                        `\xa7i---\xa7bSHOP\xa7i---`,
                                        `\xa7eCoins\xa7i: \xa7e${coins}\xa7f`,
                                        `\xa7aXP\xa7i: \xa7i[\xa7a${xp} \xa7i/ \xa7a${lvl_thresh}\xa7i] \xa7i[${this.visualBar(xp / lvl_thresh, 30)}\xa7i]`,
                                        `\xa7fLvl\xa7i. \xa7b${lvl}\xa7f\xa7.\xa7f`
                                    ].join('\n'))
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
                                            kitsel ? this.showKitSel(player) : void 0;
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
                                            kitsel ? this.showKitSel(player) : void 0;
                                        }
                                    })
                                }
                            }
                        })
                    } catch (err) {
                        s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                    }
                },
                // #endregion kitpvp_showShop
                // #region kitpvp_leaderboard
                showLeaderboard: function(player, kitsel) {
                    if (!player || !player.isValid)
                        return;
                    try {
                        let lb_form = new ui.ActionFormData();
                        lb_form.title('Leaderboard')
                            .body('\xa7i---\xa7bLEADERBOARD\xa7i---')
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
                        lb_form.button('Exit')
                        lb_form.show(player).then(res => {
                            if (!player || !player.isValid)
                                return -1;
                            !kitsel ? player.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false) : void 0;
                            if (res.canceled || res.selection === 0) {
                                kitsel ? this.showKitSel(player) : void 0;
                                return -1;
                            }
                        })
                    } catch (err) {
                        s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                    }
                },
                // #endregion kitpvp_showLeaderboard
                // #region kitpvp_showLeave
                showLeave: function(player, kitsel) {
                    if (!player || !player.isValid)
                        return;
                    try {
                        let l_form = new ui.ActionFormData();
                        l_form
                            .title('Leave')
                            .body('\xa7cAre you sure you want to leave KitPVP\xa7f?')
                        
                        l_form.button('Yes'),
                        l_form.button('No')
                        l_form.show(player).then(res => {
                            if (!player || !player.isValid)
                                return -1;
                            if (res.canceled) {
                                kitsel ? this.showKitSel(player) : void 0;
                                return -1;
                            } else if (res.selection === 0) {
                                player.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                                player.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
                                player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                                hg.minigames.find(m => m.id === 'hub').onEnter(player)
                            } else {
                                kitsel ? this.showKitSel(player) : void 0;
                                return -1;
                            }
                        })
                    } catch (err) {
                        s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                    }
                },
                // #endregion kitpvp_showLeave
                // #region kitpvp_showKitSel
                showKitSel: function(player, begin) {
                    if (!player || !player.isValid)
                        return;
                    try {
                        begin = begin ?? Date.now()
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
                        let leave = 37;
                        for (let i = 0; i < kits.length; i++) {
                            let kit = kits[i]
                            if (typeof kits[i] === 'undefined') continue;
                            let s = ((i % 7) + Math.floor(i / 7) * 9) + 10
                            ks_form.button(s, kit?.text, kit?.desc, kit?.icon, 1, 0, kit?.ench)
                            n_kits.push([s, kit])
                        }
                        ks_form.button(shop, '\xa7eShop\xa7r', [], 'minecraft:potion', 1, 0, true)
                        ks_form.button(leaderboard, '\xa7bLeaderboard\xa7r', [], 'minecraft:golden_apple', 1, 0, true)
                        ks_form.button(leave, '\xa7c\xa7lLeave\xa7r', [], 'minecraft:barrier', 1, 0, false)
                        ks_form.show(player).then(res => {
                            if (!player || !player.isValid)
                                return -1;
                            if (res.canceled) {
                                player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                                this.showKitSel(player, begin)
                                return -1;
                            } else {
                                if (res.selection === shop) {
                                    player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                                    this.showShop(player, true)
                                    return -1;
                                } else if (res.selection === leaderboard) {
                                    player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                                    this.showLeaderboard(player, true);
                                    return -1
                                } else if (res.selection === leave) {
                                    player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', true)
                                    this.showLeave(player, true);
                                    return -1
                                } else {
                                    let selection = n_kits.find(k => k[0] === res.selection)?.[1]
                                    if (selection && (Date.now() - begin > 1000)) {
                                        player.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                                        player.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
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
                                        this.showKitSel(player)
                                        return -1;
                                    }
                                }
                            }
                        }).catch(err => {
                            s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                        });
                    } catch (err) {
                        s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                    }
                }
                // #endregion kitpvp_showKitSel
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
            // #region kitpvp_onenter
            onEnter: function(player) {
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
                    player.setDynamicProperty('hgncb:kitpvp.is_shopping', false)
                    player.setDynamicProperty('hgncb:kitpvp.is_viewing_leaderboard', false)
                    player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                    this.methods.showKitSel(player)
                    player.runCommand('effect @s clear')
                    player.addTag(`hgncb:minigame.${this.id}`);
                    player.inputPermissions.setPermissionCategory(1, true)
                    player.inputPermissions.setPermissionCategory(2, true)
                } catch (err) {
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            // #endregion kitpvp_onenter
            // #region kitpvp_ontick
            onTick: function() {
                for (let entity of hg.dimensions.overworld.getEntities({ tags: ['hgncb:kitpvp.entity_on_timer'] })) {
                    let time_placed = entity.getDynamicProperty('hgncb:kitpvp.time_placed') ?? 0
                    let life_time = Date.now() - time_placed;
                    let placed_by = entity.dimension.getPlayers().find(p => p.id === entity.getDynamicProperty('hgncb:kitpvp.placed_by') ?? 0)

                    switch (entity.typeId) {
                        case 'minecraft:pufferfish':
                            for (let player of hg.dimensions.overworld.getPlayers({ location: entity.location, maxDistance: 3.0 })) {
                                hg.methods.applyCustomDamage(3, { attacker: entity, target: player, cause: 'thorns', giveTo: placed_by, knockback_direction: {
                                    x: Math.cos(hg.methods.get_knockback_direction(entity.location, player.location)),
                                    z: Math.sin(hg.methods.get_knockback_direction(entity.location, player.location))
                                }})
                                player.addEffect('poison', 160, {
                                    amplifier: 0,
                                    showParticles: true
                                })
                            }
                            break
                        default:
                            break
                    }

                    if (life_time >= 5000) {
                        entity.dimension.playSound('random.explode', entity.location, {
                            pitch: 1.8,
                            volume: 0.9
                        })
                        entity.dimension.spawnParticle('minecraft:large_explosion', entity.getHeadLocation())
                        entity.remove()
                    }
                }
            },
            // #endregion kitpvp_ontick
            // #region kitpvp_foreach
            forEachPlayer: function(player) {
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
                
                let nametagFunc = (() => {
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
                player.nameTag = hg.methods.getRankText(player) + (player.getDynamicProperty('hgncb:display_name') ?? player.name) + `\n${nametagFunc()}`
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
                if (player.getDynamicProperty('hgncb:timer.kitpvp.strength_0') > 0)
                    player.addEffect('strength', 20, {
                        amplifier: 0,
                        showParticles: true
                    })
                else if (player.getDynamicProperty('hgncb:timer.kitpvp.strength_1') > 0)
                    player.addEffect('strength', 20, {
                        amplifier: 1,
                        showParticles: true
                    })
                else if (player.getDynamicProperty('hgncb:timer.kitpvp.strength_2') > 0)
                    player.addEffect('strength', 20, {
                        amplifier: 2,
                        showParticles: true
                    })
                if (player.getDynamicProperty('hgncb:timer.kitpvp.resistance_0') > 0)
                    player.addEffect('resistance', 20, {
                        amplifier: 0,
                        showParticles: true
                    })
                else if (player.getDynamicProperty('hgncb:timer.kitpvp.resistance_1') > 0)
                    player.addEffect('resistance', 20, {
                        amplifier: 1,
                        showParticles: true
                    })
                else if (player.getDynamicProperty('hgncb:timer.kitpvp.resistance_2') > 0)
                    player.addEffect('resistance', 20, {
                        amplifier: 2,
                        showParticles: true
                    })
                if (player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit')) {
                    player.addEffect('instant_health', 60, {
                        amplifier: 255,
                        showParticles: true
                    })
                    player.addEffect('resistance', 60, {
                        amplifier: 255,
                        showParticles: true
                    })
                    player.addEffect('weakness', 60, {
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
                                item.nameTag ? stack.nameTag = item.nameTag : void 0;
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
                                potion.nameTag ? stack.nameTag = potion.nameTag : void 0;
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
                                armor.nameTag ? stack.nameTag = armor.nameTag : void 0;
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
            }
            // #endregion kitpvp_foreach
        },
        {
            name: 'Random Events',
            id: 'random_events',
            permissions: {
                place_block: true,
                break_block: true,
                interact_with_block: true,
                java_pvp: true,
                java_pvp_attack_players: false,
                java_pvp_attack_entities: true,
                java_pvp_nullify_damage: false
            },
            desc: 'Random events happen every 10 seconds. Your goal is to be the last one standing.',
            npcs: [
                
            ],
            properties: {
                // #region re_events
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
                                        y: Math.min(player.location.y + 2, 320),
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
                                        y: Math.min(player.location.y + 2, 320),
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
                                        y: Math.min(player.location.y + 2, 320),
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
                                        y: Math.min(player.location.y + 2, 320),
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
                                        y: Math.min(player.location.y + 2, 320),
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
                                    y: Math.min(player.location.y + 2, 320),
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
                                    y: Math.min(player.location.y + 2, 320),
                                    z: player.location.z
                                })
                            }
                        }
                    },
                    {
                        text: '\xa7cWho said you could take cover?!',
                        id: 'tnt_ridiculous',
                        func: (players, players_alive, players_creative) => {
                            let i = 0;
                            for (let player of players_alive) {
                                i += 10;
                                for (let j of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]) {
                                    hg.dimensions.overworld.spawnEntity('minecraft:tnt', {
                                        x: player.location.x,
                                        y: Math.min(player.location.y + 2, 320),
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
                // #endregion re_events
            },
            methods: {
                // #re_reset
                reset: function() {
                    let game = hg.minigames.find(m => m.id === 'random_events')
                    let players_creative = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] })
                    let players          = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'], excludeGameModes: ['Creative'] })
                    hg.dimensions.overworld.runCommand('structure load hgncb:random_events.str.map -1025 250 -25 0_degrees none layer_by_layer 2.0 false')

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
                                    x: Math.cos((i / players.length) * (2 * Math.PI)) * 23 + game.location.x,
                                    y: game.location.y + 1,
                                    z: Math.sin((i / players.length) * (2 * Math.PI)) * 23 + game.location.z
                                }
                                player.teleport(pos, {
                                    facingLocation: {
                                        x: game.location.x,
                                        y: game.location.y + 3,
                                        z: game.location.z
                                    }
                                })
                            }
                        }
                    }
                },
                // #endregion re_reset
                // #region re_playEvent
                playEvent: id => {
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
                        s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                    }
                },
                // #endregion re_playEvent
                // #region re_playRandomEvent
                playRandomEvent: () => {
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
                        s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                    }
                },
                // #endregion re_playRandomEvent
                // #region re_playerDie
                playerDie: function(attacker, target, method) {
                    let game_started            = (s.world.getDynamicProperty('hgncb:timer.random_events.game_start'       ) ?? 0) <= 0;
                    let someone_won             = (s.world.getDynamicProperty('hgncb:timer.random_events.win_timer'        ) ?? 0) >  0;
                    if (!target.hasTag('hgncb:random_events.dead') && game_started && !someone_won) {
                        hg.methods.death_message(attacker, target, method, { tags: ['hgncb:minigame.random_events'] })
                        target.addTag('hgncb:random_events.dead')

                        s.system.run(() => {
                            for (let player of hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.random_events'] })) {
                                player?.runCommand('playsound note.hat @s ~ ~ ~ 1 0.5 1')
                            }
                        })
                    }
                }
                // #endregion re_playerDie
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
            // #region re_onenter
            onEnter: function(player) {
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

                    if (player.dimension.getPlayers({ tags: [`hgncb:minigame.${this.id}`] }).length === 2) {
                        for (let v of player.dimension.getPlayers({ tags: [`hgncb:minigame.${this.id}`] })) {
                            v.sendMessage(`\xa7eGame \xa7i» \xa7fA player has joined! Resetting the map...`)
                            v.playSound('random.orb', {
                                pitch : 2.0,
                                volume: 1.0
                            })
                            s.world.setDynamicProperty('hgncb:timer.random_events.win_timer', 81);
                            s.system.runTimeout(() => {
                                this.methods.reset()
                            }, 80)
                        }
                    }
                } catch (err) {
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            // #endregion re_onenter
            // #region re_ontick
            onTick: function() {
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
                            player.sendMessage(`\xa7eGame \xa7i» \xa7b${winner.getDynamicProperty('hgncb:display_name') ?? winner.name} \xa7fhas won!`)
                            player.playSound('random.levelup', {
                                pitch : 2.0,
                                volume: 1.0
                            })
                            let wins   = player.getDynamicProperty('hgncb:random_events.wins'  ) ?? 0
                            let losses = player.getDynamicProperty('hgncb:random_events.losses') ?? 0
                            if (player.getGameMode() !== 'Creative')
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
                            if (player.getGameMode() !== 'Creative')
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
                            if (player.getGameMode() !== 'Creative')
                                player.setDynamicProperty('hgncb:random_events.losses', losses + 1)
                            s.world.setDynamicProperty('hgncb:timer.random_events.win_timer', 81);
                            someone_won = s.world.getDynamicProperty('hgncb:timer.random_events.win_timer') > 0;
                            s.system.runTimeout(() => {
                                this.methods.reset()
                            }, 80)
                        }
                    } else {
                        if (time_left % 200 === 0) {
                            this.methods.playRandomEvent()
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
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 320, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 320) {
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
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 320, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 320) {
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
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 320, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 320) {
                                    b.above(1)?.setType('minecraft:flowing_lava')
                                }
                            }
                            if (time_left % 5 === 0) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 320, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 320) {
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
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 320, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 320) {
                                    b.above(1)?.setType('minecraft:flowing_lava')
                                }
                            }

                            for (let i of [0, 1]) {
                                let x = Math.random() * 50 - 25
                                let z = Math.random() * 50 - 25
                                let rc = hg.dimensions.overworld.getBlockFromRay({ x: this.location.x + x, y: 320, z: this.location.z + z }, { x: 0, y: -1, z: 0 }, {
                                    includeLiquidBlocks: true,
                                    includePassableBlocks: true
                                })
                                let b = rc?.block;
                                if (b && b.y < 320) {
                                    b.above(1)?.setType('minecraft:fire')
                                }
                            }
                        }
                        if (is_raining_arrow) {
                            let x = Math.random() * 50 - 25
                            let z = Math.random() * 50 - 25
                            let a = hg.dimensions.overworld.spawnEntity('minecraft:arrow', { x: this.location.x + x, y: 320, z: this.location.z + z })
                            a.addTag('hgncb:random_events.event_arrow')
                        } else {
                            for (let arrow of hg.dimensions.overworld.getEntities({ type: 'minecraft:arrow', tags: ['hgncb:random_events.event_arrow'], excludeTypes: ['minecraft:player'], location: { x: -1025.0, y: -63.0, z: -25.0 }, volume: { x: 51.0, y: 384.0, z: 51.0 } })) {
                                arrow.remove()
                            }
                        }
                    }
                }
            },
            // #endregion re_ontick
            // #region re_foreach
            forEachPlayer: function(player) {
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
                let nametagFunc = (() => {
                    if (player.getGameMode() === 'Creative') 
                        return '\xa7i\xa7oIn creative mode...'
                    else if (player.getDynamicProperty('hgncb:random_events.is_viewing_leaderboard')) 
                        return '\xa7a\xa7oViewing leaderboard...'
                    else return `\xa7aWins\xa7f: \xa7a${wins}\xa7r | \xa7cLosses\xa7f: \xa7c${losses}\xa7r`
                })

                player.nameTag = hg.methods.getRankText(player) + (player.getDynamicProperty('hgncb:display_name') ?? player.name) + `\n${nametagFunc()}`
                player.onScreenDisplay.setActionBar([
                    `\xa7aWins\xa7f: ${wins}\n`,
                    `\xa7cLosses\xa7f: ${losses}\n`,
                    `\xa7bWLR\xa7f: ${wlr_b.toFixed(3)}\n`,
                    `\xa7bTime left\xa7f: ${(time_left / 20).toFixed(2)}s\n`,
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
                    player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Spectator' ? player.teleport(player.location) : void 0
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

                if (is_raining_lava || is_raining_insane_lava && !player.isInWater && !is_dead && player.getGameMode() !== 'Creative') {
                    let rc = hg.dimensions.overworld.getBlockFromRay(player.getHeadLocation(), { x: 0, y: 1, z: 0 }, {
                        includeLiquidBlocks: true,
                        includePassableBlocks: true
                    })

                    let b = rc?.block
                    if (!b)
                        player.setOnFire(5)
                }

                if (is_dead && player.getGameMode() !== 'Spectator' && player.getGameMode() !== 'Creative')
                    player.setGameMode('Spectator')
            }
            // #endregion re_foreach
        },
        {
            name: 'Duels',
            id: 'duels',
            permissions: {
                place_block: false,
                break_block: false,
                interact_with_block: false,
                java_pvp: true,
                java_pvp_attack_players: true,
                java_pvp_attack_entities: true,
                java_pvp_nullify_damage: false
            },
            desc: 'Duels! Fight to the death.',
            npcs: [
                
            ],
            properties: {
                
            },
            methods: {
                reset: function() {
                    let game = hg.minigames.find(m => m.id === 'duels')
                    let players_creative = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'] })
                    let players          = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'], excludeGameModes: ['Creative'] })
                    
                    s.world.setDynamicProperty('hgncb:timer.duels.game_start', 62  )
                    s.world.setDynamicProperty('hgncb:timer.duels.time_left' , 6000)
                    players.forEach(p => p.removeTag('hgncb:duels.picked'))
                    // Shuffle players randomly
                    let shuffled = [...players].sort(() => Math.random() - 0.5);

                    // Take up to 2
                    let pickedPlayers = shuffled.slice(0, 2);

                    // Tag them
                    for (let player of pickedPlayers) {
                        player.addTag('hgncb:duels.picked');
                    }
                    let i = 0;
                    for (let player of players) {
                        if (player) {
                            player.removeTag('hgncb:duels.dead')
                            if (player.isValid) {
                                player.runCommand('clear @s')
                                player.runCommand('effect @s clear')
                                let picked = player.hasTag('hgncb:duels.picked')
                                if (picked) {
                                    player.setGameMode('Survival')
                                    player.inputPermissions.setPermissionCategory(1, false)
                                    player.inputPermissions.setPermissionCategory(2, false)

                                    player.extinguishFire()
                                    let pos = {
                                        x: Math.cos((i / 2) * (2 * Math.PI)) * 13 + game.location.x + 1,
                                        y: game.location.y + 1,
                                        z: Math.sin((i / 2) * (2 * Math.PI)) * 13 + game.location.z + 1
                                    }
                                    player.teleport(pos, {
                                        facingLocation: {
                                            x: game.location.x,
                                            y: player.getHeadLocation().y,
                                            z: game.location.z
                                        }
                                    })
                                    i += 1
                                } else {
                                    player.getGameMode() !== 'Spectator' ? player.setGameMode('Spectator') : void 0;
                                    player.inputPermissions.setPermissionCategory(1, true)
                                    player.inputPermissions.setPermissionCategory(2, true)
                                }
                            }
                        }
                    }
                },
                playerDie: function(attacker, target, method) {
                    let game_started            = (s.world.getDynamicProperty('hgncb:timer.duels.game_start'       ) ?? 0) <= 0;
                    let someone_won             = (s.world.getDynamicProperty('hgncb:timer.duels.win_timer'        ) ?? 0) >  0;
                    if (!target.hasTag('hgncb:duels.dead') && game_started && !someone_won) {
                        hg.methods.death_message(attacker, target, method, { tags: ['hgncb:minigame.duels'] })
                        target.addTag('hgncb:duels.dead')
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
                x: -1000.5,
                y: 1,
                z: -1000.5
            },
            onEnter: function(player) {
                try {
                    /*
                    if (!hg.methods.check_op(player)) {
                        s.world.sendMessage(`\xa7cDenied \xa7i» \xa7fThis minigame is currently closed.`)
                        return;
                    }
                        */
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
                    player.setGameMode('Spectator')
                    player.runCommand('effect @s clear')
                    player.addTag(`hgncb:minigame.${this.id}`);

                    if (player.dimension.getPlayers({ tags: [`hgncb:minigame.${this.id}`] }).length === 2) {
                        for (let v of player.dimension.getPlayers({ tags: [`hgncb:minigame.${this.id}`] })) {
                            v.sendMessage(`\xa7eGame \xa7i» \xa7fA player has joined! Resetting...`)
                            v.playSound('random.orb', {
                                pitch : 2.0,
                                volume: 1.0
                            })
                            s.world.setDynamicProperty('hgncb:timer.duels.win_timer', 81);
                            s.system.runTimeout(() => {
                                this.methods.reset()
                            }, 80)
                        }
                    }
                } catch (err) {
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            onTick: function() {
                let players_creative        = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'] }).filter(p => p.isValid)
                let players                 = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'], excludeGameModes: ['Creative'] }).filter(p => p.isValid)
                let players_alive           = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'], excludeGameModes: ['Creative', 'Spectator'], excludeTags: ['hgncb:duels.dead'] }).filter(p => p.isValid)
                let game_started            = (s.world.getDynamicProperty('hgncb:timer.duels.game_start'       ) ?? 0) <= 0;
                let someone_won             = (s.world.getDynamicProperty('hgncb:timer.duels.win_timer'        ) ?? 0) >  0;
                let time_left               = (s.world.getDynamicProperty('hgncb:timer.duels.time_left'        ) ?? 0);
                let players_remaining       = players_alive.length;
                let game_can_continue       = players.length > 1;

                if (!someone_won && game_started && game_can_continue) {
                    if (players_remaining === 1) {
                        let winner = players_alive[0];
                        for (let player of players_creative) {
                            player.sendMessage(`\xa7eGame \xa7i» \xa7b${winner.getDynamicProperty('hgncb:display_name') ?? winner.name} \xa7fhas won!`)
                            player.playSound('random.levelup', {
                                pitch : 2.0,
                                volume: 1.0
                            })
                            let wins   = player.getDynamicProperty('hgncb:duels.wins'  ) ?? 0
                            let losses = player.getDynamicProperty('hgncb:duels.losses') ?? 0
                            let died = player.hasTag('hgncb:duels.dead') && player.hasTag('hgncb:duels.picked')
                            if (player.getGameMode() !== 'Creative') {
                                if (player.id === winner.id)
                                    player.setDynamicProperty('hgncb:duels.wins'  , wins   + 1)
                                else if (died)
                                    player.setDynamicProperty('hgncb:duels.losses', losses + 1)
                            }
                            s.world.setDynamicProperty('hgncb:timer.duels.win_timer', 81);
                            someone_won = s.world.getDynamicProperty('hgncb:timer.duels.win_timer') > 0;
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
                            let wins   = player.getDynamicProperty('hgncb:duels.wins'  ) ?? 0
                            let losses = player.getDynamicProperty('hgncb:duels.losses') ?? 0
                            let not_in_game = !player.hasTag('hgncb:duels.picked')
                            if (player.getGameMode() !== 'Creative' && !not_in_game)
                                player.setDynamicProperty('hgncb:duels.losses', losses + 1)
                            s.world.setDynamicProperty('hgncb:timer.duels.win_timer', 81);
                            someone_won = s.world.getDynamicProperty('hgncb:timer.duels.win_timer') > 0;
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
                            let wins   = player.getDynamicProperty('hgncb:duels.wins'  ) ?? 0
                            let losses = player.getDynamicProperty('hgncb:duels.losses') ?? 0
                            let not_in_game = !player.hasTag('hgncb:duels.picked')
                            if (player.getGameMode() !== 'Creative' && !not_in_game)
                                player.setDynamicProperty('hgncb:duels.losses', losses + 1)
                            s.world.setDynamicProperty('hgncb:timer.duels.win_timer', 81);
                            someone_won = s.world.getDynamicProperty('hgncb:timer.duels.win_timer') > 0;
                            s.system.runTimeout(() => {
                                this.methods.reset()
                            }, 80)
                        }
                    }
                }
            },
            forEachPlayer: function(player) {
                if (player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Survival' && player.getGameMode() !== 'Spectator')
                    player.setGameMode('Survival')

                let game_started            = (s.world.getDynamicProperty('hgncb:timer.duels.game_start'       ) ?? 0) <= 0;
                let someone_won             = (s.world.getDynamicProperty('hgncb:timer.duels.win_timer'        ) ?? 0) >  0;
                let time_left               = (s.world.getDynamicProperty('hgncb:timer.duels.time_left'        ) ?? 0);
                let players_creative        = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'] }).filter(p => p.isValid)
                let players                 = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'], excludeGameModes: ['Creative'] }).filter(p => p.isValid)
                let players_alive           = hg.dimensions.overworld.getPlayers({ tags: ['hgncb:minigame.duels'], excludeGameModes: ['Creative', 'Spectator'], excludeTags: ['hgncb:duels.dead'] }).filter(p => p.isValid)
                let players_remaining       = players_alive.length;
                let game_can_continue       = players.length > 1;
                let not_in_game = player.hasTag('hgncb:duels.dead') || !player.hasTag('hgncb:duels.picked')
                
                let wins  = player.getDynamicProperty('hgncb:duels.wins') ?? 0
                let losses = player.getDynamicProperty('hgncb:duels.losses') ?? 0

                let wlr_a = (losses) <= 0 ? wins : (wins) / (losses)
                let wlr_b = isNaN(wlr_a) ? 0 : (isFinite(wlr_a) ? wlr_a : wins)

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

                let nametagFunc = (() => {
                    if (player.getGameMode() === 'Creative') 
                        return '\xa7i\xa7oIn creative mode...'
                    else if (player.getDynamicProperty('hgncb:duels.is_viewing_leaderboard')) 
                        return '\xa7a\xa7oViewing leaderboard...'
                    else return `${health_color}${health_percentage.toFixed(2)}\xa7r% \xa7i| \xa7a${wins}\xa7r - \xa7c${losses}\xa7r`
                })

                player.nameTag = hg.methods.getRankText(player) + (player.getDynamicProperty('hgncb:display_name') ?? player.name) + `\n${nametagFunc()}`
                player.onScreenDisplay.setActionBar([
                    `\xa7aWins\xa7f: ${wins}\n`,
                    `\xa7cLosses\xa7f: ${losses}\n`,
                    `\xa7bWLR\xa7f: ${wlr_b.toFixed(3)}\n`,
                    `\xa7bTime left\xa7f: ${(time_left / 20).toFixed(2)}s\n`,
                    `${game_can_continue ? `\xa7bA game is running\xa7f...` : `\xa7cDuels requires 2 or more players\xa7f.`}`,
                ])

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
                    let game_start_timer = s.world.getDynamicProperty('hgncb:timer.duels.game_start');
                    player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Spectator' ? player.teleport(player.location) : void 0
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

                    player.addEffect('resistance', 20, {
                        amplifier: 255,
                        showParticles: true
                    }),
                    player.addEffect('saturation', 20, {
                        amplifier: 255,
                        showParticles: true
                    })
                    player.addEffect('instant_health', 20, {
                        amplifier: 255,
                        showParticles: true
                    })
                }

                if (someone_won || !game_can_continue) {
                    player.addEffect('resistance', 20, {
                        amplifier: 255,
                        showParticles: true
                    }),
                    player.addEffect('saturation', 20, {
                        amplifier: 255,
                        showParticles: true
                    })
                    player.addEffect('instant_health', 20, {
                        amplifier: 255,
                        showParticles: true
                    })
                }

                if (game_started && !someone_won && !not_in_game) {
                    if (player.location.y < -5.0) {
                        player.kill()
                    }
                }

                if (not_in_game && player.getGameMode() !== 'Spectator' && player.getGameMode() !== 'Creative')
                    player.setGameMode('Spectator')

                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_sword         }] run give @s[tag="hgncb:minigame.duels"]                                      iron_sword          1 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=iron_axe           }] run give @s[tag="hgncb:minigame.duels"]                                      iron_axe            1 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=bow                }] run give @s[tag="hgncb:minigame.duels"]                                      bow                 1 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=cooked_beef        }] run give @s[tag="hgncb:minigame.duels"]                                      cooked_beef        64 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=golden_apple       }] run give @s[tag="hgncb:minigame.duels"]                                      golden_apple       64 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=shield             }] run replaceitem entity @s[tag="hgncb:minigame.duels"] slot.weapon.offhand  0 shield              1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=diamond_helmet     }] run replaceitem entity @s[tag="hgncb:minigame.duels"] slot.armor.head      0 diamond_helmet      1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=diamond_chestplate }] run replaceitem entity @s[tag="hgncb:minigame.duels"] slot.armor.chest     0 diamond_chestplate  1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=diamond_leggings   }] run replaceitem entity @s[tag="hgncb:minigame.duels"] slot.armor.legs      0 diamond_leggings    1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=diamond_boots      }] run replaceitem entity @s[tag="hgncb:minigame.duels"] slot.armor.feet      0 diamond_boots       1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}')
                player.runCommand('execute as @a[m=!c] unless entity @s[hasitem={item=arrow              }] run replaceitem entity @s[tag="hgncb:minigame.duels"] slot.inventory       0 arrow              64 0 {"minecraft:item_lock":{"mode":"lock_in_inventory"}}')
            }
        },
        {
            name: 'Hunger Games',
            id: 'hunger_games',
            permissions: {
                place_block: false,
                break_block: false,
                interact_with_block: false,
                java_pvp: true,
                java_pvp_attack_players: true,
                java_pvp_attack_entities: true,
                java_pvp_nullify_damage: false
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
            onEnter: function(player) {
                try {
                    if (!hg.methods.check_op(player)) {
                        s.world.sendMessage(`\xa7cDenied \xa7i» \xa7fThis minigame is currently closed.`)
                        return;
                    }
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
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            onTick: function() {

            },
            forEachPlayer: function(player) {
                if (player.getGameMode() !== 'Creative' && player.getGameMode() !== 'Survival')
                    player.setGameMode('Survival')
                player.nameTag = hg.methods.getRankText(player) + (player.getDynamicProperty('hgncb:display_name') ?? player.name)
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
    swears: [
        'skibidi',
        'sigma',
        'rizz',
        'gyatt',
        'mew'
    ],
    command_prefix: '/',
    worldListeners: {
        beforeEvents: {
            // #region listen_chatsend
            chatSend: function(e) {
                e.cancel = true; // cancel the chat message
                try {
                    // 256 max characters
                    if (e.message.length > 256) {
                        e.sender.sendMessage(`\xa7cYou can\'t send a message that long\xa7f! \xa7f(\xa7c${e.message.length} \xa7f>\xa7c 256\xa7f)`)
                        return;
                    } 
                    // makes it so you can't use §k in chat
                    if (e.message.includes('\xa7k')) {
                        e.sender.sendMessage(`\xa7cYou can\'t use that formatting code in chat\xa7f!`)
                        return;
                    }
                    s.world.sendMessage(`\xa7i[${hg.methods.getTime()}] ${hg.methods.getRankText(e.sender)}${e.sender.getDynamicProperty('hgncb:display_name') ?? e.sender.name} \xa7i»\xa7r ${hg.methods.censor(e.message)}`.replaceAll('%', '%%')) // send the message globally
                } catch (err) {
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            // #endregion listen_chatsend
            // #region listen_itemuse
            itemUse: function(e) {
                try {
                    let player = e.source;
                    let item = e.itemStack;
                    if (player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit'))  {
                        e.cancel = true;
                        return;
                    }
                    if (player && item) {
                        let game = hg.methods.getMinigame(player)
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
                                                    player.sendMessage('\xa7cDenied \xa7i» \xa7cYou can\'t open the shop, as you are not on the ground\xa7f!')
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                } else if (in_combat && player.getGameMode() !== 'Creative') {
                                                    player.sendMessage('\xa7cDenied \xa7i» \xa7cYou can\'t open the shop, as you are in combat\xa7f!')
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                } else if (!in_combat)
                                                    s.system.run(() => game.methods.showShop(player))
                                                
                                                break;
                                            case 'minecraft:wind_charge':
                                                let wc_timer = player.getDynamicProperty('hgncb:timer.kitpvp.wc') ?? 0
                                                
                                                if (wc_timer > 0) {
                                                    e.cancel = true;
                                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cYou can\'t use this item \xa7i(Wind Charge) \xa7cright now! \xa7i(${(wc_timer / 20).toFixed(2)}s)`)
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                } else player.setDynamicProperty('hgncb:timer.kitpvp.wc', 80)
                                                break;
                                            case 'minecraft:golden_apple':
                                                let gapple_timer = player.getDynamicProperty('hgncb:timer.kitpvp.gapple') ?? 0
                                                
                                                if (gapple_timer > 0) {
                                                    e.cancel = true;
                                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cYou can\'t use this item \xa7i(Golden Apple) \xa7cright now! \xa7i(${(gapple_timer / 20).toFixed(2)}s)`)
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                }
                                                break;
                                            case 'minecraft:splash_potion':
                                                let pot_timer = player.getDynamicProperty('hgncb:timer.kitpvp.pot') ?? 0
                                                
                                                if (pot_timer > 0) {
                                                    e.cancel = true;
                                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cYou can\'t use this item \xa7i(Splash Potion) \xa7cright now! \xa7i(${(pot_timer / 20).toFixed(2)}s)`)
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
                                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cYou can\'t use this item \xa7i(Milk Bucket) \xa7cright now! \xa7i(${(milk_timer / 20).toFixed(2)}s)`)
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                } else {
                                                    s.system.run(() => player.dimension.playSound('random.drink', player.location, {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                    player.setDynamicProperty('hgncb:timer.kitpvp.milk', 400)
                                                    s.system.run(() => player.runCommand('effect @s clear slow_falling'))
                                                    s.system.run(() => player.runCommand('effect @s clear instant_damage'))
                                                    s.system.run(() => player.runCommand('effect @s clear poison'))
                                                }
                                                break;
                                            case 'minecraft:snowball':
                                                e.cancel = true;
                                                s.system.run(() => {
                                                    let projectile = player.dimension.spawnEntity('minecraft:snowball', {
                                                        x: player.getHeadLocation().x + player.getViewDirection().x,
                                                        y: player.getHeadLocation().y + player.getViewDirection().y,
                                                        z: player.getHeadLocation().z + player.getViewDirection().z
                                                    });
                                                    let c = projectile.getComponent('minecraft:projectile')
                                                    c.owner = player
                                                    projectile.applyImpulse({
                                                        x: player.getViewDirection().x * 2,
                                                        y: player.getViewDirection().y * 2,
                                                        z: player.getViewDirection().z * 2
                                                    });
                                                    player.dimension.playSound('random.bow', player.getHeadLocation(), {
                                                        pitch: 0.5,
                                                        volume: 0.7
                                                    })
                                                })
                                                break;
                                            case 'minecraft:sparkler':
                                                let sonic_timer = player.getDynamicProperty('hgncb:timer.kitpvp.sonic') ?? 0
                                                e.cancel = true;
                                                if (sonic_timer > 0) {
                                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cYou can\'t use this item \xa7i(Wand) \xa7cright now! \xa7i(${(sonic_timer / 20).toFixed(2)}s)`)
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                } else {
                                                    s.system.run(() => player.dimension.playSound('mob.warden.sonic_boom', player.location, {
                                                        pitch : 2.0,
                                                        volume: 0.75
                                                    }))
                                                    player.setDynamicProperty('hgncb:timer.kitpvp.sonic', 100)
                                                    let entities = player.getEntitiesFromViewDirection({
                                                        ignoreBlockCollision: true,
                                                        includeLiquidBlocks: false,
                                                        includePassableBlocks: false,
                                                        maxDistance: 30
                                                    })
                                                    for (let entity of entities) {
                                                        if (entity.entity.typeId === 'minecraft:player') {
                                                            s.system.run(() => hg.methods.applyCustomDamage(5, {
                                                                    attacker: player,
                                                                    target: entity.entity,
                                                                    cause: 'sonicBoom',
                                                                    knockback_direction: {
                                                                        x: player.getViewDirection().x * 5,
                                                                        y: player.getViewDirection().y,
                                                                        z: player.getViewDirection().z * 5
                                                                    }
                                                                })
                                                            )
                                                        }
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
                                                    player.sendMessage('\xa7cDenied \xa7i» \xa7cYou can\'t open the leaderboard, as you are not on the ground\xa7f!')
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                } else if (in_combat && player.getGameMode() !== 'Creative') {
                                                    player.sendMessage('\xa7cDenied \xa7i» \xa7cYou can\'t open the leaderboard, as you are in combat\xa7f!')
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                } else if (!in_combat)
                                                    s.system.run(() => game.methods.showLeaderboard(player))
                                                break;
                                        }
                                    }
                                    break;
                                case 'random_events':
                                    break;
                                case 'duels':
                                    if (item) {
                                        switch (item.typeId) {
                                            case 'minecraft:golden_apple':
                                                let gapple_timer = player.getDynamicProperty('hgncb:timer.duels.gapple') ?? 0
                                                
                                                if (gapple_timer > 0) {
                                                    e.cancel = true;
                                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cYou can\'t use this item \xa7i(Golden Apple) \xa7cright now! \xa7i(${(gapple_timer / 20).toFixed(2)}s)`)
                                                    s.system.run(() => player.playSound('note.bass', {
                                                        pitch : 1.0,
                                                        volume: 1.0
                                                    }))
                                                }
                                                break;
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                } catch (err) {
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            // #endregion listen_itemuse
            // #region listen_playerleave
            playerLeave: function(e) {
                let target = e.player
                hg.methods.clogPrevent(target)
            },
            // #endregion listen_playerleave
            // #region listen_playerbreakblock
            playerBreakBlock: function(e) {
                // runs when a player breaks a block
                let player = e.player;
                let game = hg.methods.getMinigame(player)
                if (game && !game.permissions.break_block && player.getGameMode() !== 'Creative') {
                    e.cancel = true; // cancel the event
                    Date.now() - player.getDynamicProperty('hgncb:info.last_perm_info') > 500 ? player.sendMessage(`\xa7cDenied \xa7i»\xa7r \xa7fYou can\'t break blocks in this area\xa7i.`) : void 0;
                    Date.now() - player.getDynamicProperty('hgncb:info.last_perm_info') > 500 ? player.setDynamicProperty('hgncb:info.last_perm_info', Date.now()) : void 0;
                    return;
                }
            },
            // #endregion listen_playerbreakblock
            // #region listen_playerplaceblock
            playerPlaceBlock: function(e) {
                // runs when a player places a block
                let player = e.player;
                let game = hg.methods.getMinigame(player)
                if (game && !game.permissions.place_block && player.getGameMode() !== 'Creative') {
                    e.cancel = true; // cancel the event
                    Date.now() - player.getDynamicProperty('hgncb:info.last_perm_info') > 500 ? player.sendMessage(`\xa7cDenied \xa7i»\xa7r \xa7fYou can\'t place blocks in this area\xa7i.`) : void 0;
                    Date.now() - player.getDynamicProperty('hgncb:info.last_perm_info') > 500 ? player.setDynamicProperty('hgncb:info.last_perm_info', Date.now()) : void 0;
                    return;
                }
            },
            // #endregion listen_playerplaceblock
            // #region listen_playerinteractwithblock
            playerInteractWithBlock: function(e) {
                // runs when a player interacts with a block
                let player = e.player;
                let block = e.block
                let game = hg.methods.getMinigame(player)
                let item = player.getComponent('minecraft:equippable')?.getEquipment('Mainhand')
                switch (item?.typeId) {
                    case 'minecraft:pufferfish_bucket':
                        if (game.id === 'kitpvp') {
                            e.cancel = true;
                            s.system.run(() => {
                                let pufferfish_timer = player.getDynamicProperty('hgncb:timer.kitpvp.pufferfish') ?? 0
                                e.cancel = true;
                                if (pufferfish_timer > 0) {
                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cYou can\'t use this item \xa7i(Bucket of Pufferfish) \xa7cright now! \xa7i(${(pufferfish_timer / 20).toFixed(2)}s)`)
                                    s.system.run(() => player.playSound('note.bass', {
                                        pitch : 1.0,
                                        volume: 1.0
                                    }))
                                } else {
                                    let pufferfish = player.dimension.spawnEntity('minecraft:pufferfish', {
                                        x: block.location.x + 0.5,
                                        y: block.location.y + 1.0,
                                        z: block.location.z + 0.5
                                    }, {
                                        initialPersistence: true,
                                        spawnEvent: 'minecraft:start_full_puff'
                                    });
                                    player.dimension.playSound('bucket.empty_fish', player.location)
                                    player.setDynamicProperty('hgncb:timer.kitpvp.pufferfish', 150)
                                    pufferfish.setDynamicProperty('hgncb:kitpvp.time_placed', Date.now())
                                    pufferfish.setDynamicProperty('hgncb:kitpvp.placed_by', player.id)
                                    pufferfish.addTag('hgncb:kitpvp.entity_on_timer')
                                }
                            })
                        }
                        break;
                    default:
                        if (game && !game.permissions.interact_with_block && player.getGameMode() !== 'Creative') {
                            e.cancel = true; // cancel the event
                            Date.now() - player.getDynamicProperty('hgncb:info.last_perm_info') > 500 ? player.sendMessage(`\xa7cDenied \xa7i»\xa7r \xa7fYou can\'t interact with blocks in this area\xa7i.`) : void 0;
                            Date.now() - player.getDynamicProperty('hgncb:info.last_perm_info') > 500 ? player.setDynamicProperty('hgncb:info.last_perm_info', Date.now()) : void 0;
                        }
                }
            }
            // #endregion listen_playerinteractwithblock
        },
        afterEvents: {
            // #region listen_itemcompleteuse
            itemCompleteUse: function(e) {
                try {
                    let player = e.source;
                    let item = e.itemStack;
                    if (player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit'))  {
                        e.cancel = true;
                        return;
                    }
                    if (player && item) {
                        let game = hg.methods.getMinigame(player)
                        let combat_timer = Math.max((player.getDynamicProperty('hgncb:timer.kitpvp.combat') ?? 0), 0)
                        let in_combat = (combat_timer > 0)
                        if (game) {
                            switch (game.id) {
                                case 'kitpvp':
                                    if (item) {
                                        switch (item.typeId) {
                                            case 'minecraft:golden_apple':
                                                let gapple_timer = player.getDynamicProperty('hgncb:timer.kitpvp.gapple') ?? 0
                                                
                                                if (gapple_timer > 0) {
                                                    return;
                                                } else player.setDynamicProperty('hgncb:timer.kitpvp.gapple', 50)
                                                break;
                                        }
                                    }
                                    break;
                                case 'random_events':
                                    break;
                                case 'duels':
                                    if (item) {
                                        switch (item.typeId) {
                                            case 'minecraft:golden_apple':
                                                let gapple_timer = player.getDynamicProperty('hgncb:timer.duels.gapple') ?? 0
                                                
                                                if (gapple_timer > 0) {
                                                    return;
                                                } else player.setDynamicProperty('hgncb:timer.duels.gapple', 50)
                                                break;
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                } catch (err) {
                    s.world.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`)
                }
            },
            // #endregion listen_itemcompleteuse
            // #region listen_playerspawn
            playerSpawn: function(e) {
                // runs when a player spawns
                if (e.initialSpawn) {
                    // sends players who joined the game to the hub
                    let player = e.player;
                        player.sendMessage(`\xa7bWelcome to \xa7lHyperGames NCB\xa7r! \xa7i- \xa7f(\xa7b${hg.ver}\xa7f)`);
                    let hub = hg.minigames.find(g => g.id === 'hub');
                    hub.onEnter(player); // teleport the player to the hub
                    player.inputPermissions.setPermissionCategory(1, true)
                    player.inputPermissions.setPermissionCategory(2, true)
                    player.playSound('hgncb.join', {
                        pitch: 1.0,
                        volume: 1.0
                    })

                    s.system.runTimeout(() => {
                        player.sendMessage('\xa7bType \xa7f/\xa7brules to show the rules of the server\xa7f!')
                        player.playSound('random.orb', {
                            pitch: 2.0,
                            volume: 1.0
                        })
                    }, 60)
                    s.system.runTimeout(() => {
                        player.sendMessage('\xa7bInfo \xa7i» \xa7fInvite your friends! We need more players!')
                        player.playSound('random.pop', {
                            pitch: 1.0,
                            volume: 1.0
                        })
                    }, 120)
                    s.system.runTimeout(() => {
                        player.sendMessage('\xa7bInfo \xa7i» \xa7fPlease download the resource packs if you haven\'t already - HyperGames requires them!')
                        player.playSound('random.pop', {
                            pitch: 1.0,
                            volume: 1.0
                        })
                    }, 180)
                }
            },
            // #endregion listen_playerspawn
            // #region listen_projectilehitentity
            projectileHitEntity: function(e) {
                let attacker = e.source;
                let target = e.getEntityHit().entity;
                if (!target || !target.isValid)
                    return;

                let game = hg.methods.getMinigame(target)
                if (game) {
                    switch (game.id) {
                        case 'kitpvp':
                            if (e.projectile.typeId === 'minecraft:lingering_potion' || e.projectile.typeId === 'minecraft:splash_potion')
                                return;
                            if (e.projectile.typeId === 'minecraft:arrow' && e.projectile.isValid) {
                                hg.methods.applyCustomDamage(1 * Math.hypot(e.projectile.getVelocity().x, e.projectile.getVelocity().y, e.projectile.getVelocity().z), { 
                                    attacker, 
                                    target, 
                                    cause: 'projectile' , 
                                    knockback_direction: {
                                        x: e.hitVector.x * 0.35,
                                        y: 0.4,
                                        z: e.hitVector.z * 0.35
                                    }
                                }) 
                            } else {
                                hg.methods.applyCustomDamage(1, { 
                                    attacker, 
                                    target, 
                                    cause: 'projectile', 
                                    knockback_direction: {
                                        x: e.hitVector.x * 1.5,
                                        y: 0.4,
                                        z: e.hitVector.z * 1.5
                                    }
                                })
                                }
                            e.projectile.isValid ? e.projectile.remove() : void 0;
                            if (!attacker || !attacker.isValid)
                                return;
                            if (attacker?.id !== target?.id && attacker?.typeId === 'minecraft:player' && target?.typeId === 'minecraft:player' && attacker.getGameMode() !== 'Creative' && target.getGameMode() !== 'Creative') {
                                attacker?.playSound('random.orb', {
                                    pitch: 0.5,
                                    volume: 1.0
                                })
                                attacker?.setDynamicProperty('hgncb:kitpvp.last_hit', Date.now())
                                attacker?.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                                target?.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                                attacker?.setDynamicProperty('hgncb:kitpvp.combat_id', target.id)
                                target?.setDynamicProperty('hgncb:kitpvp.combat_id', attacker.id)
                            }
                            break;
                        case 'duels':
                            if (!attacker || !attacker.isValid)
                                return;
                            if (attacker?.id !== target?.id && attacker?.typeId === 'minecraft:player' && target?.typeId === 'minecraft:player' && attacker.getGameMode() !== 'Creative' && target.getGameMode() !== 'Creative') {
                                attacker?.playSound('random.orb', {
                                    pitch: 0.5,
                                    volume: 1.0
                                })
                            }
                            break;
                        default:
                            break;
                    }
                }
            },
            // #endregion listen_projectilehitentity
            // #region listen_entityhitentity
            entityHitEntity: function(e) {
                let attacker = e.damagingEntity;
                let target = e.hitEntity;

                if (!attacker || !attacker.isValid)
                    return;

                if (!target || !target.isValid)
                    return;

                if (attacker.typeId !== 'minecraft:player')
                    return;

                if (attacker.id === target.id)
                    return
                
                let game = hg.methods.getMinigame(target)
                if (game) {
                    switch (game.id) {
                        case 'kitpvp':
                            let attacker_mainhand = attacker.getComponent('minecraft:equippable').getEquipment('Mainhand')
                            if (attacker_mainhand) {
                                if (attacker_mainhand.typeId === 'minecraft:bread')
                                    target.applyKnockback({
                                        x: (attacker?.getViewDirection()?.x ?? 0) * 3,
                                        z: (attacker?.getViewDirection()?.z ?? 0) * 3
                                    }, 0.6)
                                
                                let dmg = hg.item_stats[attacker_mainhand.typeId.replace('minecraft:', '')]?.dmg ?? hg.item_stats.default.dmg
                                hg.methods.applyCustomDamage(dmg, { attacker, target, cause: 'entityAttack' })
                            } else {
                                hg.methods.applyCustomDamage(1, { attacker, target, cause: 'entityAttack' })
                            }
                            
                            if (target.typeId === 'minecraft:player' && attacker.getGameMode() !== 'Creative' && target.getGameMode() !== 'Creative') {
                                attacker.setDynamicProperty('hgncb:kitpvp.last_hit', Date.now())
                                target.setDynamicProperty('hgncb:kitpvp.last_hit', Date.now())
                                attacker.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                                target.setDynamicProperty('hgncb:timer.kitpvp.combat', 300)
                                attacker.setDynamicProperty('hgncb:kitpvp.combat_id', target.id)
                                target.setDynamicProperty('hgncb:kitpvp.combat_id', attacker.id)
                            }
                            break;
                        default:
                            break;
                    }
                }
            },
            // #endregion listen_entityhitentity
            // #region listen_entitydie
            entityDie: function(e) {
                let attacker = e.damageSource.damagingEntity;
                let target = e.deadEntity;
                
                if (!attacker && target && target.typeId === 'minecraft:player')
                    hg.methods.diffDeath(target, e.damageSource.cause)
                else if (attacker && target && target.typeId === 'minecraft:player')
                    hg.methods.globalDeathHandle(attacker, target, e.damageSource.cause)
            }
            // #endregion listen_entitydie
        }
    },
    systemListeners: {
        beforeEvents: {
            startup: function(e) {
                let commands = [
                    // #region commands
                    {
                        name: 'help',
                        desc: 'Shows all of the available commands.',
                        func: function(a, player) {
                            try {
                                let c = a[1]?.trim?.()
                                if (c) {
                                    let cmd = commands.find(cmd => `/${cmd.name}` === c || `${cmd.name}` === c);
                                    player.sendMessage(`\xa7f/\xa7e${cmd.name}\xa7f - \xa7i\xa7o${cmd.desc}\xa7r`);
                                    cmd.send_usage(player); // send the usage of the command
                                } else {
                                    let msg = '\xa7eCommands\xa7f:'
                                    let msgop = '\xa7eOperator Commands\xa7f:'
                                    for (let command of commands.filter(cmd => !cmd.requires_op)) {
                                        msg += `\n    \xa7f/\xa7e${command.name} \xa7i- \xa7i\xa7o${command.desc}\xa7r`;
                                    }
                                    for (let command of commands.filter(cmd => cmd.requires_op)) {
                                        msgop += `\n    \xa7f/\xa7e${command.name} \xa7i- \xa7i\xa7o${command.desc}\xa7r`;
                                    }
                                    player.sendMessage(`${msg}${hg.methods.check_op(player) ? '\n' + msgop : ''}`);
                                }
                            } catch (err) {
                                s.world.sendMessage(`\xa7cError \xa7i» \xa7f${err.message}\n${err.stack}`); // send an error message
                            }
                        }
                    },
                    {
                        name: 'hub',
                        desc: 'Sends you to the Hub.',
                        func: function(a, player) {
                            try {
                                let hub = hg.minigames.find(g => g.id === 'hub');
                                hub.onEnter(player); // teleport the player to the hub
                            } catch (err) {
                                s.world.sendMessage(`\xa7cError \xa7i» \xa7f${err.message}\n${err.stack}`); // send an error message
                            }
                        }
                    },
                    {
                        name: 'server',
                        desc: 'Sends you to a specified server.',
                        func: function(a, player) {
                            try {
                                let c = a[1]?.trim?.()
                                let game = hg.minigames.find(m => m.id === c)
                                if (!game) {
                                    player.sendMessage(`\xa7cDenied \xa7i» \xa7cMinigame \xa7i\'\xa7c${c}\xa7i\' \xa7ccurrently does not exist.`)
                                } else {
                                    player.sendMessage(`\xa7bInfo \xa7i» \xa7fSending you to minigame \xa7i\'\xa7b${game.id}\xa7i\'...`)
                                    game.onEnter(player)
                                }
                            } catch (err) {
                                s.world.sendMessage(`\xa7cError \xa7i» \xa7f${err.message}\n${err.stack}`); // send an error message
                            }
                        }
                    },
                    {
                        name: 'clearchat',
                        desc: 'Clears the chat.',
                        func: function(a, player) {
                            let c = a[1]?.trim?.()

                            for (let i = 0; i < 100; i++) { // clear the chat by sending a bunch of empty messages
                                s.world.sendMessage(' ');
                            }
                            s.world.sendMessage(`\xa7i\xa7o${player.getDynamicProperty('hgncb:display_name') ?? player.name} has cleared the chat.`);
                        }
                    },
                    {
                        name: 'rules',
                        desc: 'Shows the rules of the server.',
                        func: function(a, player) {
                            let c = a[1]?.trim?.()
                            player.sendMessage(`\xa7f---\xa7bRULES\xa7f---` + '\n' + hg.rules.join('\n\xa7r'));
                        }
                    },
                    {
                        name: 'usersettings',
                        desc: 'Change your settings.',
                        func: function(a, player) {
                            let c = a[1]?.trim?.()
                            let d = a[2]

                            let defaults = {
                                enableKitPvpSounds: false
                            }
                            if (typeof d === 'undefined') {
                                player.sendMessage(`\xa7bInfo \xa7i» \xa7fUser setting \'\xa7b${c}\xa7f\' is equal to \xa7b${player.getDynamicProperty(`hgncb:setting.${c}`) ?? defaults[c]}\xa7i.`)
                            } else {
                                player.sendMessage(`\xa7bInfo \xa7i» \xa7fChanging user setting \'\xa7b${c}\xa7f\' to \xa7b${d}\xa7i.`)
                                player.setDynamicProperty(`hgncb:setting.${c}`, d)
                            }
                        }
                    },
                    {
                        name: 'debug',
                        desc: 'Debug options.',
                        func: function(a, player) {
                            let
                                c = a[1]?.trim?.()?.toLowerCase(),
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
                                    } catch (err) {
                                        player.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`);
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
                                    } catch (err) {
                                        player.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`);
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
                                    } catch (err) {
                                        player.sendMessage(`\xa7cError \xa7i» \xa7r${err}\n${err.stack}`);
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
                                    player.sendMessage(`\xa7cNo such debug command \xa7f\'\xa7c${c}\xa7f\'\xa7f!`);
                                    break;
                            }
                        }
                    },
                    {
                        name: 'restart',
                        desc: 'Restarts the server.',
                        func: function(a, player) {
                            player.runCommand('kick @a \nThe server is restarting.\nYou can now join back.')
                            player.runCommand('reload all')
                        }
                    },
                    // #endregion commands
                ]
                e.customCommandRegistry.registerEnum('hgncb:setting_type',  ['enableKitPvpSounds'])
                e.customCommandRegistry.registerEnum('hgncb:debug_command', ['eval', 'prop_set', 'prop_add', 'no_shop'])
                e.customCommandRegistry.registerEnum('hgncb:server_id', [
                    'bedwars',
                    'bridgewars',
                    'draw',
                    'duels', 
                    'hunger_games',
                    'kitpvp', 
                    'parkour',
                    'random_events',
                    'skygen', 
                    'skywars', 
                ])
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:hghelp',
                        cheatsRequired: false,
                        permissionLevel: 0,
                        description: commands.find(c => c.name === 'help').desc,
                        optionalParameters: [
                            {
                                type: 'String',
                                name: 'command'
                            }
                        ]
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'help').func([undefined, ...a], origin.sourceEntity))
                    }
                )
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:hub',
                        cheatsRequired: false,
                        permissionLevel: 0,
                        description: commands.find(c => c.name === 'hub').desc
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'hub').func([undefined, ...a], origin.sourceEntity))
                    }
                )
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:server',
                        cheatsRequired: false,
                        permissionLevel: 0,
                        description: commands.find(c => c.name === 'server').desc,
                        mandatoryParameters: [
                            {
                                type: 'Enum',
                                name: 'hgncb:server_id'
                            }
                        ]
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'server').func([undefined, ...a], origin.sourceEntity))
                    }
                )
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:rules',
                        cheatsRequired: false,
                        permissionLevel: 0,
                        description: commands.find(c => c.name === 'rules').desc
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'rules').func([undefined, ...a], origin.sourceEntity))
                    }
                )
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:debug',
                        cheatsRequired: false,
                        permissionLevel: 2,
                        description: commands.find(c => c.name === 'debug').desc,
                        mandatoryParameters: [
                            {
                                type: 'Enum',
                                name: 'hgncb:debug_command'
                            }
                        ],
                        optionalParameters: [
                            {
                                type: 'String',
                                name: 'args'
                            }
                        ]
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'debug').func([undefined, ...a], origin.sourceEntity))
                    }
                )
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:restart',
                        cheatsRequired: false,
                        permissionLevel: 4,
                        description: commands.find(c => c.name === 'restart').desc
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'restart').func([undefined, ...a], origin.sourceEntity))
                    }
                )
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:clearchat',
                        cheatsRequired: false,
                        permissionLevel: 1,
                        description: commands.find(c => c.name === 'clearchat').desc
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'clearchat').func([undefined, ...a], origin.sourceEntity))
                    }
                )
                e.customCommandRegistry.registerCommand(
                    {
                        name: 'hgncb:usersettings',
                        cheatsRequired: false,
                        permissionLevel: 0,
                        description: commands.find(c => c.name === 'usersettings').desc,
                        mandatoryParameters: [
                            {
                                type: 'Enum',
                                name: 'hgncb:setting_type'
                            }
                        ],
                        optionalParameters: [
                            {
                                type: 'Boolean',
                                name: 'value'
                            }
                        ]
                    },
                    function(origin, ...a) {
                        s.system.run(() => commands.find(c => c.name === 'usersettings').func([undefined, ...a], origin.sourceEntity))
                    }
                )
            }
        },
        afterEvents: {
            // #region script events
            scriptEventReceive: async(e) => {
                switch (e.id) {
                    case 'hgncb:spawn_fake_player':
                        let n = 1;
                        if (e.message)
                            n = isNaN(parseInt(e.message)) ? 1 : parseInt(e.message)
                        
                        for (let i = 0; i < n; i++) {
                            await hg.methods.asyncPause(1)
                            hg.dimensions.overworld.runCommand('execute positioned 10000 -60 10000 run gametest run hgncb:spawn_fake_player')
                        }
                        break;
                    case 'hgncb:remove_all_fake_players':
                        hg.dimensions.overworld.runCommand('gametest stopall')
                        break;
                }
            }
            // #endregion script events
        }
    },
    // #region global_ontick
    onTick: function() {
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
                
                typeof player.getProperty('hgncb:visual.hurt') !== 'undefined' && player.getProperty('hgncb:visual.hurt') > 0 ? player.setProperty('hgncb:visual.hurt', player.getProperty('hgncb:visual.hurt') - 1) : void 0;
                player.runCommand(`title @a times 0 60 20`);
                player.commandPermissionLevel = hg.methods.getRankLevel(player)
                let tags = player.getTags();
                if (tags.filter(t => t.startsWith('hgncb:minigame.')).length > 1) {
                    player.sendMessage('\xa7bInfo \xa7i» \xa7fWe\'ve detected that you\'re in multiple minigames at once\xa7i! \xa7fSending you to the Hub\xa7i...')
                    hg.minigames.find(m => m.id === 'hub').onEnter(player)
                }
                if (player.hasTag('hgncb:minigame.kitpvp')) {
                    let onfire = player.getComponent('minecraft:onfire')
                    let breathable = player.getComponent('minecraft:breathable')
                    let poison = player.getEffect('poison')
                    let instant_damage = player.getEffect('instant_damage')
                    if (poison) {
                        poison.duration % 20 === 0 ?
                            hg.methods.applyCustomDamage(1, {
                                attacker: undefined,
                                target: player,
                                cause: 'poison'
                            })
                        :
                            void 0;
                    }
                    if (instant_damage) {
                        hg.methods.applyCustomDamage(3 * 2 ** instant_damage.amplifier, {
                            attacker: undefined,
                            target: player,
                            cause: 'magic'
                        })
                    }
                    if (breathable) {
                        if (breathable.airSupply <= 0) {
                            if (player.getDynamicProperty('hgncb:timer.drown') <= 0) {
                                hg.methods.applyCustomDamage(2, {
                                    attacker: undefined,
                                    target: player,
                                    cause: 'drowning'
                                })
                                player.setDynamicProperty('hgncb:timer.drown', 20);
                            }
                        } else {
                            player.setDynamicProperty('hgncb:timer.drown', 40);
                        }
                        
                    }
                    if (onfire?.onFireTicksRemaining % 20 === 0)
                        hg.methods.applyCustomDamage(1, {
                            attacker: undefined,
                            target: player,
                            cause: 'fireTick'
                        })
                    if (player.isFalling && !player.isInWater) {
                        let starting_height = player.getDynamicProperty('hgncb:starting_height')
                        if (!starting_height) {
                            player.setDynamicProperty('hgncb:starting_height', player.location.y)
                        } else {
                            player.setDynamicProperty('hgncb:fall_height', starting_height - player.location.y)
                        }    
                    } else {
                        if (player.getDynamicProperty('hgncb:starting_height') && player.getDynamicProperty('hgncb:fall_height')) {
                            if (!player.isInWater && !player.isClimbing) {
                                let is_on_hay = player.dimension.getBlockBelow(player.location)?.typeId === 'minecraft:hay_block'
                                let hay_reduction = (is_on_hay ? 0.8 : 0.0)
                                let safe = 3.0
                                let fall_distance = player.getDynamicProperty('hgncb:fall_height')
                                let multiplier = player.getEffect('slow_falling') ? 0.0 : 1.0
                                let dmg = Math.max(0, Math.ceil((fall_distance - safe) * multiplier)) * (1 - hay_reduction)
                                hg.methods.applyCustomDamage(dmg, {
                                    attacker: undefined,
                                    target: player,
                                    cause: 'fall'
                                })
                            }
                            player.setDynamicProperty('hgncb:starting_height', undefined)
                            player.setDynamicProperty('hgncb:fall_height',     undefined)
                        }
                    }
                }
                let game = hg.methods.getMinigame(player)
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
                    game.forEachPlayer(player)
                     game.permissions.java_pvp_nullify_damage  ? player.addTag('njmp:player.nullify_damage')         : player.removeTag('njmp:player.nullify_damage');
                     game.permissions.java_pvp                 ? player.addTag('njmp:player.enable_1.9_pvp')         : player.removeTag('njmp:player.enable_1.9_pvp');
                    !game.permissions.java_pvp_attack_players  ? player.addTag('njmp:player.cannot_attack_players')  : player.removeTag('njmp:player.cannot_attack_players');
                    !game.permissions.java_pvp_attack_entities ? player.addTag('njmp:player.cannot_attack_entities') : player.removeTag('njmp:player.cannot_attack_entities');
                }
                for (let tag of tags) {
                    if (tag.startsWith('hgncb:transfer.')) {
                        let id = tag.replace('hgncb:transfer.', '')
                        let game = hg.minigames.find(g => g.id === id);
                        if (game) {
                            game.onEnter(player)
                            player.removeTag(tag)
                        } else {
                            s.world.sendMessage(`\xa7cERROR \xa7f- \xa7fCould not find minigame \'${id}\'`); // send an error message
                            player.removeTag(tag)
                        }
                    }
                }
            }
        }
        try {
            if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:hub_title`] }).length > 1) {
                let title = hg.dimensions.overworld.getEntities({ tags: [`hgncb:hub_title`] }).slice(1)[0]
                title.remove();
            } else if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:hub_title`] }).length <= 0) {
                let loc = {
                    x: 0.5,
                    y: 10,
                    z: 17.5
                }
                let title = hg.dimensions.overworld.spawnEntity('hgncb:title', loc);
                title.addTag(`hgncb:hub_title`)
                title.teleport(loc, {
                    facingLocation: { x: 0.5, y: 4, z: 0.5 }
                })
            } else if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:hub_title`] }).length > 0) {
                let loc = {
                    x: 0.5,
                    y: 10,
                    z: 17.5
                }
                let title = hg.dimensions.overworld.getEntities({ tags: [`hgncb:hub_title`] })[0]
                title.teleport({
                    x: 0.5,
                    y: 10,
                    z: 17.5
                }, {
                    facingLocation: { x: 0.5, y: 4, z: 0.5 }
                })
            }
        } catch (e) {}
        for (let game of hg.minigames) {
            game.onTick();
            for (let npc_data of game.npcs) {
                try {
                    if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${npc_data.link ?? npc_data.id}`] }).length > 1) {
                        let npc = hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${npc_data.link ?? npc_data.id}`] }).slice(1)[0]
                        npc.remove();
                    } else if (hg.dimensions.overworld.getEntities({ tags: [`hgncb:npc.${npc_data.link ?? npc_data.id}`] }).length <= 0) {
                        let npc = hg.dimensions.overworld.spawnEntity('minecraft:npc', npc_data.location);
                        let npc_comp = npc.getComponent('minecraft:npc')
                        let player_count = hg.dimensions.overworld.getPlayers({
                            tags: [`hgncb:minigame.${npc_data.link}`]
                        }).length
                        npc_comp.name = `\xa7b${npc_data.text}\xa7r\n\xa7i\xa7o${player_count} players`
                        npc_comp.skinIndex !== npc_data.skin ? npc_comp.skinIndex = npc_data.skin : void 0;
                        npc_comp.defaultScene = npc_data.scene;
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
                } catch (err) {}
            }
        }
    },
    // #endregion global_ontick
    // #region global_onload
    onLoad: function() {
        // runs when the script is loaded
        s.world.sendMessage(`\xa7fScript reloaded\xa7i! (HyperGames)`);
        for (let player of hg.dimensions.overworld.getPlayers()) {
            ui.uiManager.closeAllForms(player)
            let game = hg.methods.getMinigame(player)
            if (game) {
                if (game.id === 'kitpvp') {
                    let last_kit = game.properties.kits.find(k => k.id === player.getDynamicProperty('hgncb:kitpvp.last_kit')) ?? game.properties.kits.find(k => k.id === 'basic')
                    if (player.getDynamicProperty('hgncb:kitpvp.is_selecting_kit')) {
                        player.setDynamicProperty('hgncb:kitpvp.selected_kit', last_kit.id ?? 'basic')
                        player.setDynamicProperty('hgncb:kitpvp.is_selecting_kit', false)
                        player.sendMessage(`\xa7bInfo \xa7i» \xa7rThe host has reloaded, so you have been given the last kit you selected. \xa7i(${last_kit.text}\xa7i)`)
                    }
                }
            }
        }
    }
    // #endregion global_onload
}
for (let key of Object.keys(hg.worldListeners.beforeEvents)) {
    s.world.beforeEvents[key].subscribe(hg.worldListeners.beforeEvents[key]);
}
for (let key of Object.keys(hg.worldListeners.afterEvents)) {
    s.world.afterEvents[key].subscribe(hg.worldListeners.afterEvents[key]);
}
for (let key of Object.keys(hg.systemListeners.beforeEvents)) {
    s.system.beforeEvents[key].subscribe(hg.systemListeners.beforeEvents[key]);
}
for (let key of Object.keys(hg.systemListeners.afterEvents)) {
    s.system.afterEvents[key].subscribe(hg.systemListeners.afterEvents[key]);
}
s.world.afterEvents.worldLoad.subscribe(() => {
    hg.dimensions = {
        overworld: s.world.getDimension('minecraft:overworld'),
        nether: s.world.getDimension('minecraft:nether'),
        the_end: s.world.getDimension('minecraft:the_end')
    }
    hg.onLoad();
    s.system.runInterval(hg.onTick)
})