//           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
//                   Version 2, December 2004
//
// Copyright (C) 2023 Matthias Gatto <uso.cosmo.ray@gmail.com>
//
// Everyone is permitted to copy and distribute verbatim or modified
// copies of this license document, and changing it is allowed as long
// as the name is changed.
//
//            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
//   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
//
//  0. You just DO WHAT THE FUCK YOU WANT TO.

const BOSS_METADATA = 10
const BOSS_TIMER_IDX = 0

function bullet(wid, tuple)
{
    let bullet = tuple.get(0)
    let mover = bullet.get(2)
    const turn_timer = tuple.geti(1)
    y_move_obj(bullet.get(3), mover, turn_timer)
}

function boss0(wid, tuple)
{
    let boss = tuple.get(0)
    let boss_canel = boss.get(0)
    let metadata = boss.get(BOSS_METADATA)
    const turn_timer = tuple.geti(1)
    let mover = boss.get(1)
    let pc = wid.get("_pc")
    let pc_pos = pc.get(0)

    if (!metadata) {
	metadata = yeCreateArrayAt(boss, "boss metadata", BOSS_METADATA)
	metadata.setAt(BOSS_TIMER_IDX, 0)
    }
    const boss_timer = metadata.geti(BOSS_TIMER_IDX)
    let boss_pos = ywCanvasObjPos(boss_canel)

    if (boss_timer < 4000000) {
	y_move_set_xspeed(mover, 16)
    } else if (boss_timer < 6000000) {
	y_move_set_xspeed(mover, -16)
    } else {
	if (pc_pos.geti(0) < boss_pos.geti(0)) {
	    y_move_set_xspeed(mover, -7)
	} else if (pc_pos.geti(0) > boss_pos.geti(0)) {
	    y_move_set_xspeed(mover, 7)
	} else {
	    y_move_set_xspeed(mover, 0)
	}
    }
    // attack every 600000 us
    if (boss_timer % 600000 > (boss_timer + turn_timer) % 600000) {
	let monsters = wid.get("_monsters")
	let textures = wid.get("textures")
	let monster_info = wid.get("_mi").get("monsters")
	let boss_info = wid.get("_mi").get("boss")
	let nb_attack = 1

	print("life: ", boss_info.geti("life"))
	if (boss_info.geti("life") < 20)
	    nb_attack = 2
	for (let i = 0; i < nb_attack; ++i) {
	    let mon = yeCreateArray(monsters)
	    yeCreateString("p", mon)
	    let pos = yeCreateCopy(boss_pos, mon, "pos")
	    if (i == 0)
		ywPosAddXY(pos, 80, 10)
	    else
		ywPosAddXY(pos, -20, 10)
	    let m_mover = y_mover_new(mon, "mover")
	    y_move_set_xspeed(m_mover, (pc_pos.geti(0) - boss_pos.geti(0)) / 10)
	    y_move_set_yspeed(m_mover, 20)
	    yamap_generate_monster_canvasobj(wid, textures, mon, monster_info,
					     yeLen(monsters) - 1)
	}
    }
    metadata.addAt(BOSS_TIMER_IDX, turn_timer)
    y_move_obj(boss_canel, mover, turn_timer)
}

function mod_init(mod)
{
    ygAddModule(Y_MOD_YIRL, mod, "amap")
    let wid = yeCreateArray(mod, "starting_widget")
    yeCreateFunction(boss0, mod, "boss0")
    yeCreateFunction(bullet, mod, "bullet")
    wid.setAt("background", "rgba: 255 255 255 255")
    wid.setAt("<type>", "amap")
    wid.setAt("map", "lvl10")
    mod.setAt("Name", "usoa")
    wid.setAt("life-bar", 1)
    return mod
}
