import { Opts } from './options'
import type { MenuUIReplacerPlayerConfig } from './types'

declare global {
    namespace sc {
        interface MapFloor {
            roomClases: sc.MapRoom[]
        }
    }
}

interface PlayerDrawer extends ig.GuiElementBase {
    gfx: ig.Image
    floor: sc.MapFloor
}
interface PlayerDrawerConstructor extends ImpactClass<PlayerDrawer> {
    new (floor: sc.MapFloor): PlayerDrawer
}

type IconConfig = { gfx: ig.Image } & NonNullable<MenuUIReplacerPlayerConfig['TinyHead']>

function getIconConfig(modelName: string): IconConfig {
    const config = window.customPlayerMenus?.get(modelName)
    return config?.TinyHead
        ? { gfx: config.gfx, ...config.TinyHead }
        : { gfx: new ig.Image('media/gui/menu.png'), offX: 280, offY: 436, sizeX: 10, sizeY: 9 }
}

interface PlayerInfo {
    username: string
    character: string
    tpInfo: { map: string; marker?: Nullable<string> }
    pos: Vec2
}

declare global {
    namespace sc {
        interface MapModel {
            getPlayerInfos(this: this): PlayerInfo[]
        }
    }
}

function getMaps() {
    const playerInfos = sc.map.getPlayerInfos()

    const maps: Record<string, PlayerInfo[]> = {}
    for (const entry of playerInfos) {
        ;(maps[entry.tpInfo.map] ??= []).push(entry)
    }
    return maps
}

export function injectMapOverlay() {
    sc.MapModel.inject({
        getPlayerInfos() {
            const mapSize = ig.game.size
            const player = ig.game.playerEntity
            return [
                {
                    username: '',
                    character: sc.model.player.name,
                    tpInfo: { map: ig.game.mapName.toPath('', '').toCamel() },
                    pos: {
                        x: player.coll.pos.x / mapSize.x,
                        y: (player.coll.pos.y - player.coll.pos.z) / mapSize.y,
                    },
                },
            ]
        },
    })

    const PlayerDrawer: PlayerDrawerConstructor = ig.GuiElementBase.extend({
        gfx: new ig.Image('media/gui/menu.png'),

        init(floor) {
            this.parent()
            this.floor = floor
            this.setPos(0, 0)
            this.setSize(floor.hook.size.x, floor.hook.size.y)
        },
        updateDrawables(renderer) {
            this.parent(renderer)

            const drawConfigs: {
                pos: Vec2
                iconConfig: IconConfig
                username: string
            }[] = []

            const maps = getMaps()

            for (const mapName in maps) {
                const mapNameCamel = mapName.toCamel()
                const room = this.floor.roomClases.find(room => room?.name == mapNameCamel || room?.name == mapName)
                if (!room) continue

                const mapRecord = maps[mapName]
                for (const { username, character, pos } of mapRecord) {
                    const realX = room.hook.pos.x + room.hook.size.x * pos.x
                    const realY = room.hook.pos.y + room.hook.size.y * pos.y

                    drawConfigs.push({ pos: { x: realX, y: realY }, iconConfig: getIconConfig(character), username })
                }
            }

            for (const { pos, iconConfig } of drawConfigs) {
                const { gfx, offX, offY, sizeX, sizeY } = iconConfig
                const x = pos.x - sizeX / 2
                const y = pos.y - sizeY / 2
                renderer.addGfx(gfx, x, y, offX, offY, sizeX, sizeY)
            }
            for (const { pos, username, iconConfig } of drawConfigs) {
                if (!username) continue
                const textBlock = new ig.TextBlock(sc.fontsystem.tinyFont, `\\c[3]${username}\\c[0]`, {})
                const x = pos.x - textBlock.size.x / 2
                const y = pos.y - textBlock.size.y - iconConfig.sizeY / 2
                renderer.addText(textBlock, x, y)
            }
        },
    })

    sc.MapFloor.inject({
        _createIcons(rooms) {
            this.parent(rooms)
            this.roomClases = rooms
        },
        _createRooms() {
            if (!Opts.playerIconMapOverlay) return this.parent()

            const rooms = this.parent()

            /* draw in the child instead of in sc.MapFloor itself because
             * the child draw gets called later and doesnt get overdrawn with the map room */
            const drawer = new PlayerDrawer(this)
            this.addChildGui(drawer)

            return rooms
        },
    })
}
