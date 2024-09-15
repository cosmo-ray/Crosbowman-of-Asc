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

const ANIM_METADATA = 10
const BOSS_METADATA = 10
const BOSS_TIMER_IDX = 0

const COOK_HEAD = `
   /-----\\
   | | | |
   | | | |
   | | | |
   -     \\
 /       \\\\
  --     \\\\\\
   '    |
    ----
`


function monster_dead_next(wid, anim_info)
{
    let garbage_colector = yeCreateArray()
    let state = anim_info.geti(ANIM_METADATA)
    state += 1
    if (state > 12) {
 	return 2
    }
    anim_info.setAt(ANIM_METADATA, state)
    let rect = ywRectCreateInts(24 + 31 * state, 147, 28, 28)
    let explosion_i = ywTextureNewImg("./M484ExplosionSet2.png", rect, garbage_colector);
    let pos = ywCanvasObjPos(anim_info.get(0))

    anim_info.setAt(1, 100000)
    let a = ywCanvasNewImgFromTexture(wid, ywPosX(pos), ywPosY(pos), explosion_i)
    yeCreateIntAt(TYPE_ANIMATION, a, "amap-t", YCANVAS_UDATA_IDX)

    ywCanvasRemoveObj(wid, anim_info.get(0))
    anim_info.setAt(0, a)
    print("===== monster_dead_next =====")
    yePrint(anim_info)
    return 0
}

function monster_dead(wid, mon)
{
    let rect = ywRectCreateInts(24, 148, 24, 24)
    // not sure the textures are garbage collected, so an array is use to store them
    let garbage_colector = yeCreateArray()
    let explosion_0 = ywTextureNewImg("./M484ExplosionSet2.png", rect, garbage_colector);
    let anime_info = yamap_push_animation(wid, mon.get(1), explosion_0, 200000, yeCreateFunction("monster_dead_next"))
    anime_info.setAt(ANIM_METADATA, 0)
    return 2
}

function lvl_up(wid)
{
    let rand = yuiRand() & 3
    let pc = wid.get("pc")
    let old_pc = yeCreateCopy(pc)
    let lvl_up_sts = "lvl up              \n"
    if (pc.geti("xp") > 32) {
	pc.addAt("max_life", 1)
	pc.get("stats").addAt("strength", 1)
	pc.get("stats").addAt("agility", 1)
    }
    switch (rand) {
    case 0:
	pc.addAt("max_life", 1)
	pc.get("stats").addAt("strength", 1)
	pc.get("stats").addAt("agility", 1)
	break;
    case 1:
	pc.get("stats").addAt("agility", 2)
	break;
    case 2:
	pc.get("stats").addAt("strength", 2)
	break;
    case 3:
	pc.addAt("max_life", 4)
	break;
    }
    lvl_up_sts += "got " + (pc.geti("max_life") - old_pc.geti("max_life")) + " life\n"
    lvl_up_sts += "got " + (pc.get("stats").geti("strength") - old_pc.get("stats").geti("strength")) + " strength\n"
    lvl_up_sts += "got " + (pc.get("stats").geti("agility") - old_pc.get("stats").geti("agility")) + " agility"
    wid.get("next-lvl").mult(2)
    pc.setAt("life", pc.geti("max_life"))
    y_set_head(COOK_HEAD)
    y_stop_head(wid, ywCanvasPix0X(wid), ywCanvasPix0Y(wid), lvl_up_sts)
    return 1
}

function can_longjmp(wid)
{
    let pc = wid.get("pc")
    y_set_head(COOK_HEAD)
    pc.setAt("jmp-power", 10)
    y_stop_head(wid, ywCanvasPix0X(wid), ywCanvasPix0Y(wid), "You can now jump longer")
    return 2 | 0x10
}

function can_upshoot(wid)
{
    ygGet("stop-screen.y_set_head").call(COOK_HEAD)
    wid.setAt("can_upshoot", 1)
    y_stop_head(wid, ywCanvasPix0X(wid), ywCanvasPix0Y(wid), "You can now upshoot, also some block might be destructible")
    return 0x12
}

function menu_action(wid, events)
{
    if (yevIsKeyDown(events, Y_ESC_KEY)) {
	wid.setAt("action", wid.get("_old_action"))
	wid.rm("_old_action")
	ywCanvasClearArray(wid, wid.get("_menu_stuff"));
	wid.rm("_menu_stuff")
	return
    }
}

function on_esc(wid)
{
    let pc = wid.get("pc")
    wid.setAt("_old_action", wid.get("action"))
    wid.setAt("action", yeCreateFunction(menu_action))
    let menu_stuff = yeCreateArray(wid, "_menu_stuff")
    let wid_pix = wid.get("wid-pix")
    let pix0x = ywCanvasPix0X(wid)
    let pix0y = ywCanvasPix0Y(wid)
    let rect = ywCanvasNewRectangle(wid, pix0x + 10, pix0y + 10,
				    wid_pix.geti(2) - 20, wid_pix.geti(3) - 20,
				    "rgba: 100 100 100 200")
    menu_stuff.push(rect)
    let str = yeCreateString("INFO\nLife: ")
    str.add(pc.geti("life")).add(" / ").add(pc.geti("max_life")).add("\n")
    str.add("xp: ").add(pc.geti("xp")).add("\n")
    str.add("atk: ").add(pc.get("stats").geti("strength"))
    str.add("\nagility: ").add(pc.get("stats").geti("agility"))
    let t = ywCanvasNewTextExt(wid, pix0x + 50, pix0y + 50, str, "rgba: 255 255 255 255")
    menu_stuff.push(t)
}

function bullet(wid, tuple)
{
    let bullet = tuple.get(0)
    let mover = bullet.get(2)
    const turn_timer = tuple.geti(1)
    y_move_obj(bullet.get(3), mover, turn_timer)
}

function boss0_dead(wid, tuple)
{
    yamap_push_obj(wid, ywPosCreate(1, 5), 0)
    yamap_push_obj(wid, ywPosCreate(2, 5), 1)
    return 2
}

function boss1_next_form(wid, tuple)
{
    let boss_i = wid.get("_mi").get("boss")
    let boss = tuple.get(0)
    let boss_canel = boss.get(0)
    boss_i.setAt("life", 20)
    boss_i.setAt("action", "usoa.boss1")
    let bpos = ywCanvasObjPos(boss_canel) // get boss pos
    let rect = ywRectCreateInts(94, 0, 108, 128)

    let boss_new_canel = ywCanvasNewImg(wid, ywPosX(bpos), ywPosY(bpos),
				   "./threeformsPJ2.png", rect)
    yeCreateIntAt(TYPE_BOSS, boss_new_canel, "amap-t", YCANVAS_UDATA_IDX)

    ywCanvasRemoveObj(wid, boss_canel)
    boss.setAt(0, boss_new_canel)
    return 0
}

function boss1(wid, tuple)
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
	let boss_info = wid.get("_mi").get("boss")
	let nb_attack = 2

	print("life: ", boss_info.geti("life"))
	if (boss_info.geti("life") < 20)
	    nb_attack = 4
	for (let i = 0; i < nb_attack; ++i) {
	    let pos = i == 0 ? ywPosAddCopy(boss_pos, 80, 10) :
		(i == 1 ? ywPosAddCopy(boss_pos, -20, 10) :
		 (i == 2 ? ywPosAddCopy(boss_pos, 80, 40) :
		  ywPosAddCopy(boss_pos, -20, 40)
		 )
		)
	    let mon = yamap_push_monster(wid, pos, "p")
	    let m_mover = mon.get("mover")
	    y_move_set_xspeed(m_mover, (pc_pos.geti(0) - boss_pos.geti(0)) / 10)
	    y_move_set_yspeed(m_mover, 20)
	}
    }
    metadata.addAt(BOSS_TIMER_IDX, turn_timer)
    y_move_obj(boss_canel, mover, turn_timer)
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
	let boss_info = wid.get("_mi").get("boss")
	let nb_attack = 1

	print("life: ", boss_info.geti("life"))
	if (boss_info.geti("life") < 20)
	    nb_attack = 2
	for (let i = 0; i < nb_attack; ++i) {
	    let pos = yeCreateCopy(boss_pos)
	    if (i == 0)
		ywPosAddXY(pos, 80, 10)
	    else
		ywPosAddXY(pos, -20, 10)
	    let mon = yamap_push_monster(wid, pos, "p")
	    let m_mover = mon.get("mover")
	    y_move_set_xspeed(m_mover, (pc_pos.geti(0) - boss_pos.geti(0)) / 10)
	    y_move_set_yspeed(m_mover, 20)
	}
    }
    metadata.addAt(BOSS_TIMER_IDX, turn_timer)
    y_move_obj(boss_canel, mover, turn_timer)
}

function usoa_init(wid)
{
    let animations = yeCreateArray(wid, "animations")
    let lancer_base = yeCreateArray()
    let base = ywTextureNew(ywSizeCreate(48, 64), lancer_base, null)
    let body = ywTextureNewImg("lancer-base.png", ywRectCreateInts(0, 0, 32, 64),
			       null, null)
    let leg = ywTextureNewImg("lancer-base.png", ywRectCreateInts(64, 64, 32, 64),
			      null, null)
    ywTextureMergeTexture(body, base, null, null, ywRectCreateInts(16, 0, 32, 64))
    ywTextureMergeTexture(leg, base, null, null, ywRectCreateInts(16, 0, 32, 64))

    let handler = yGenericNewTexturesArray(wid, lancer_base, yeCreateArray(),
					   ywPosCreate(0, 0), animations, "lancer")

    let walk_array = yeCreateArray()

    function add_walk_part(rect) {
	let base = ywTextureNew(ywSizeCreate(48, 64), walk_array, null)
	let body = ywTextureNewImg("lancer-base.png", ywRectCreateInts(0, 0, 32, 64),
				   null, null)
	let leg = ywTextureNewImg("lancer-base.png", rect, null, null)
	let spear = ywTextureNewImg("lancer-base.png", ywRectCreateInts(16, 128, 16, 64),
				    null, null)
	ywTextureMergeTexture(body, base, null, ywRectCreateInts(16, 0, 32, 64))
	ywTextureMergeTexture(leg, base, null, ywRectCreateInts(16, 0, 32, 64))
	ywTextureMergeTexture(spear, base, null, ywRectCreateInts(0, 0, 16, 64))
    }

    add_walk_part(ywRectCreateInts(96, 64, 32, 64))
    add_walk_part(ywRectCreateInts(64, 128, 32, 64))
    add_walk_part(ywRectCreateInts(32, 128, 32, 64))
    add_walk_part(ywRectCreateInts(64, 128, 32, 64))

    handler.get("txts").push(walk_array, "walk")

    let dead_array = yeCreateArray()
    body = ywTextureNewImg("lancer-base.png", ywRectCreateInts(32, 0, 32, 64),
			   dead_array, null)
    body = ywTextureNewImg("lancer-base.png", ywRectCreateInts(64, 0, 32, 64),
			   dead_array, null)
    body = ywTextureNewImg("lancer-base.png", ywRectCreateInts(94, 0, 32, 64),
			   dead_array, null)
    body = ywTextureNewImg("lancer-base.png", ywRectCreateInts(0, 64, 32, 64),
			   dead_array, null)
    body = ywTextureNewImg("lancer-base.png", ywRectCreateInts(32, 64, 32, 64),
			   dead_array, null)
    handler.get("txts").push(dead_array, "dead")

    ygGet("usoa").setAt("running_wid", wid)
    let ret = ywidNewWidget(wid, "amap")
    return ret
}

function mod_init(mod)
{
    let wid = ygInitWidgetModule(mod, "usoa", yeCreateFunction("usoa_init"))
    ygAddModule(Y_MOD_YIRL, mod, "amap")
    mod.setAt("Name", "usoa")

    // this is so wasm module can work
    ygReCreateInt("mods_config.smart_cobject.no_submodule", 1);
    yeCreateFunction(can_upshoot, mod, "can_upshoot")
    yeCreateFunction(can_longjmp, mod, "can_longjmp")
    yeCreateFunction(boss0, mod, "boss0")
    yeCreateFunction(boss1, mod, "boss1")
    yeCreateFunction(boss0_dead, mod, "boss0_dead")
    yeCreateFunction(boss1_next_form, mod, "boss1_next_form")
    yeCreateFunction(bullet, mod, "bullet")
    yeCreateFunction(monster_dead, mod, "monster_dead")

    yeCreateFunction(lvl_up, wid, "lvl_up")
    wid.setAt("background", "rgba: 255 255 255 255")
    wid.setAt("<type>", "usoa")
    wid.setAt("map", "lvl0")
    wid.setAt("life-bar", 1)
    wid.setAt("next-lvl", 1)
    wid.setAt("#-yblock", 1)
    wid.setAt("block-up", 1)
    wid.setAt("attack-sprite", "./ketchup.png")
    wid.setAt("attack-sprite-size", "half")
    wid.setAt("attack-sprite-threshold", ywPosCreate(0, 5))
    let jmp_sprites = yeCreateArray(wid, "pc-jmp-sprites")
    jmp_sprites.push("./guy-jmp.png")
    let punch_sprites = yeCreateArray(wid, "pc-punch-sprites")
    punch_sprites.push("./guy-punch.png")
    let dash_sprites = yeCreateArray(wid, "pc-dash-sprites")
    dash_sprites.push("./guy-dash.png")

    let run_sprites = yeCreateArray(wid, "pc-sprites")
    run_sprites.push("./guy-run-0.png")
    run_sprites.push("./guy-run-1.png")

    let textures = yeCreateArray(wid, "extra-textures")
    textures.setAt("upshoot", "up-shoot.png")

    let bullet_array = yeCreateArray()
    bullet_array.setAt(0, "M484ExplosionSet2.png")
    ywRectCreateInts(24, 31, 28, 28, bullet_array)
    textures.setAt("bullet", bullet_array)

    let food_array = yeCreateArray()
    food_array.setAt(0, "foods.png")
    ywRectCreateInts(0, 0, 28, 28, food_array)
    textures.setAt("ramen", food_array)

    let on_callbacks = yeCreateArray(wid, "on")
    yeCreateFunction(on_esc, on_callbacks, "esc")

    return mod
}
