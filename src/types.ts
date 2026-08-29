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

interface ImageConfig {
    offX: number
    offY: number
    sizeX: number
    sizeY: number
}

interface ImageConfigGfxOff extends ImageConfig {
    gfxOffX: number
    gfxOffY: number
}

export interface MenuUIReplacerPlayerConfigBase {
    DOCTYPE: 'MENU_GUI_CONFIG'
    name: string

    Large: ImageConfigGfxOff
    Small: ImageConfigGfxOff
    Head: ImageConfigGfxOff
    AreaButton: ImageConfigGfxOff
    MapFloorButtonContainer: ImageConfig
    TinyHead?: ImageConfig
}

export interface MenuUIReplacerPlayerConfig extends MenuUIReplacerPlayerConfigBase {
    gfx: ig.Image
    icon: ig.ImageGui
    menuGfx: ig.Image
}

export interface MenuUIReplacerPlayerConfigRaw extends MenuUIReplacerPlayerConfigBase {
    gfx: string
}

declare global {
    var customPlayerMenus: Map<string, MenuUIReplacerPlayerConfig>
}
