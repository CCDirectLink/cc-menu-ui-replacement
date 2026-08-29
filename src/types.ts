import 'ultimate-crosscode-typedefs'
import type { Mod } from 'ultimate-crosscode-typedefs/modloader/mod'

export type Mod1 = Writable<Mod> & {
    findAllAssets?(): void /* only there for ccl2, used to set isCCL3 */
} & (
        | {
              isCCL3: true
              id: string
              findAllAssets(): void
          }
        | {
              isCCL3: false
              name: string
              filemanager: {
                  findFiles(dir: string, exts: string[]): Promise<string[]>
              }
              getAsset(path: string): string
              runtimeAssets: Record<string, string>
          }
    )

export interface PlayerConfigBase {
    DOCTYPE: 'MENU_GUI_CONFIG'
    name: string

    Large: {
        gfxOffX: number
        gfxOffY: number
        offX: number
        offY: number
        sizeX: number
        sizeY: number
    }
    Small: {
        gfxOffX: number
        gfxOffY: number
        offX: number
        offY: number
        sizeX: number
        sizeY: number
    }
    Head: {
        gfxOffX: number
        gfxOffY: number
        offX: number
        offY: number
        sizeX: number
        sizeY: number
    }
    AreaButton: {
        gfxOffX: number
        gfxOffY: number
        offX: number
        offY: number
        sizeX: number
        sizeY: number
    }
    MapFloorButtonContainer: {
        offX: number
        offY: number
        sizeX: number
        sizeY: number
    }
    TinyHead?: {
        offX: number
        offY: number
        sizeX: number
        sizeY: number
    }
}

export interface CustomPlayerConfig extends PlayerConfigBase {
    gfx: ig.Image
    icon: ig.ImageGui
    menuGfx: ig.Image
}
export type CustomPlayerMenus = Map<string, CustomPlayerConfig>

export interface RawCustomPlayerConfig extends PlayerConfigBase {
    gfx: string
}

export interface TemplateImageSettings {
    width: number
    height: number
    clearInstructions: {
        x: number
        y: number
        w: number
        h: number
    }[]
}

declare global {
    var customPlayerMenus: CustomPlayerMenus
}
