import type { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type { Mod1, MenuUIReplacerPlayerConfig, MenuUIReplacerPlayerConfigRaw } from './types'
import { setModMetadata } from './mod-metadata'
import { injectPostload as injectMenu } from './main-menu'

interface TemplateImageSettings {
    width: number
    height: number
    clearInstructions: {
        x: number
        y: number
        w: number
        h: number
    }[]
}

export default class MenuUiReplacer implements PluginClass {
    constructor(mod: Mod1) {
        setModMetadata(mod)
    }

    async prestart() {
        const menus = await this.getMenus()

        const playerMenus = (window.customPlayerMenus = new Map())

        if (menus.length > 0) {
            const customMenuGfx = await this._createCustomMenu()

            for (const menu of menus) {
                const copy: MenuUIReplacerPlayerConfig = JSON.parse(JSON.stringify(menu))
                copy.menuGfx = customMenuGfx
                copy.gfx = new ig.Image(menu.gfx)
                this.createIcon(copy)
                playerMenus.set(copy.name, copy)
            }
        }

        injectMenu()
    }

    createIcon(config: MenuUIReplacerPlayerConfig) {
        const gfx = config.gfx
        const { offX, offY, sizeX, sizeY } = config.MapFloorButtonContainer
        const iconGfx = new ig.ImageGui(gfx, offX, offY, sizeX, sizeY)
        config.icon = iconGfx
        iconGfx.hook.transitions = {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR,
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR,
            },
        }
    }

    getMenus() {
        return new Promise<MenuUIReplacerPlayerConfigRaw[]>((resolve, reject) => {
            $.ajax({
                dataType: 'json',
                url: 'data/menu.json',
                success: data => {
                    resolve(data)
                },
                error: () => {
                    reject()
                },
            })
        })
    }

    async getBaseMenuImg() {
        return this.loadImage('media/gui/menu.png')
    }

    async _createCustomMenu() {
        // @ts-expect-error
        const img = new ig.Image()
        const baseImage = await this.getBaseMenuImg()

        img.width = baseImage.width
        img.height = baseImage.height
        const settings: TemplateImageSettings = {
            width: baseImage.width,
            height: baseImage.height,
            clearInstructions: [
                { x: 280, y: 424, w: 16, h: 11 },
                { x: 280, y: 472, w: 126, h: 35 },
            ],
        }

        const modifiedImage = await this._createTemplateImage(baseImage, settings)
        img.data = modifiedImage
        return img
    }

    async _createTemplateImage(baseImage: HTMLImageElement, settings: TemplateImageSettings) {
        const canvas = document.createElement('canvas')

        canvas.width = settings.width
        canvas.height = settings.height
        const ctx = canvas.getContext('2d')!

        ctx.drawImage(baseImage, 0, 0)

        for (const { x, y, w, h } of settings.clearInstructions) {
            ctx.clearRect(x, y, w, h)
        }

        return await this.loadImage(canvas.toDataURL('image/png'))
    }

    async loadImage(src: string) {
        const image = new Image()

        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject()
            image.src = src
        })
        return image
    }
}
