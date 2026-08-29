import type { MenuUIReplacerPlayerConfig } from './types'

interface ConfigSettable {
    config: Nullable<MenuUIReplacerPlayerConfig> | undefined

    setConfig(this: this, config: Nullable<MenuUIReplacerPlayerConfig> | undefined): void
}

declare global {
    namespace sc {
        namespace MainMenu {
            interface LeaLarge extends sc.Model.Observer, ConfigSettable {}
            interface LeaSmall extends sc.Model.Observer, ConfigSettable {}
        }

        interface MapFloorButtonContainer extends sc.Model.Observer, ConfigSettable {
            originalCopy: ig.ImageGui

            updateIcon(this: this): void
        }

        interface SocialPartyBox {
            isHidden?: boolean

            updatePartyLeader(this: this): void
        }
    }
}

function getCurrentConfig(): Nullable<MenuUIReplacerPlayerConfig> | undefined {
    const playerName = sc.model.player.name
    return customPlayerMenus.get(playerName)
}

function onPlayerModelChanged(obj: ConfigSettable, model: sc.Model, message: number, _data: unknown) {
    if (model != sc.model.player) return
    if (message !== sc.PLAYER_MSG.CONFIG_CHANGED) return

    obj.setConfig(getCurrentConfig())
}

export function injectPostload() {
    sc.MainMenu.LeaLarge.inject({
        init(...args) {
            this.parent(...args)
            sc.Model.addObserver(sc.model.player, this)
        },
        setConfig(config: Nullable<MenuUIReplacerPlayerConfig> | undefined) {
            this.config = config
        },
        updateDrawables(renderer) {
            if (this.config) {
                const gfx = this.config.gfx
                const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = this.config.Large
                renderer.addDraw().setGfx(gfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY)
                return
            }
            this.parent(renderer)
        },

        modelChanged(...args) {
            this.parent?.(...args)
            onPlayerModelChanged(this, ...args)
        },
    })

    sc.MainMenu.LeaSmall.inject({
        init(...args) {
            this.parent(...args)
            sc.Model.addObserver(sc.model.player, this)
        },
        setConfig(config) {
            this.config = config
        },
        updateDrawables(renderer) {
            if (this.config) {
                const gfx = this.config.gfx
                const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = this.config.Small
                renderer.addDraw().setGfx(gfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY)
                return
            }
            this.parent(renderer)
        },
        modelChanged(...args) {
            this.parent?.(...args)
            onPlayerModelChanged(this, ...args)
        },
    })

    sc.AreaButton.inject({
        updateDrawables(renderer) {
            const currentConfig = getCurrentConfig()
            const old = this.gfx
            if (currentConfig) {
                this.gfx = currentConfig.menuGfx
            }

            this.parent(renderer)
            if (currentConfig && this.activeArea) {
                const gfx = currentConfig.gfx
                const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = currentConfig.AreaButton
                renderer.addGfx(gfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY)
            }
            this.gfx = old
        },
    })

    // just patch leaIcon
    sc.MapFloorButtonContainer.inject({
        init(...args) {
            this.parent(...args)
            this.originalCopy = this.leaIcon

            this.setConfig(getCurrentConfig())
        },
        addObservers() {
            this.parent()
            sc.Model.addObserver(sc.model.player, this)
        },
        removeObservers() {
            this.parent()
            sc.Model.removeObserver(sc.model.player, this)
        },
        setConfig(config) {
            this.config = config
            this.updateIcon()
        },
        updateIcon() {
            if (this.config) {
                this.leaIcon.doStateTransition('HIDDEN', true)
                this.leaIcon = this.config.icon
                this.leaIcon.doStateTransition('HIDDEN', true)
            } else {
                this.leaIcon = this.originalCopy!
            }
            this._createButtons(true)
        },
        modelChanged(...args) {
            this.parent(...args)
            onPlayerModelChanged(this, ...args)
        },
    })

    function customStatusDrawables(
        obj: sc.ItemStatusDefault | sc.StatusViewMainParameters,
        renderer: ig.GuiRenderer,
        currentConfig: MenuUIReplacerPlayerConfig
    ) {
        const old = obj.menuGfx
        obj.menuGfx = currentConfig.menuGfx
        ig.BoxGui.prototype.updateDrawables.call(obj, renderer)
        const gfx = currentConfig.gfx
        const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = currentConfig.Head
        renderer.addGfx(gfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY)
        renderer.addGfx(obj.statusGfx, 64, 5, 104, 32 + sc.model.player.currentElementMode * 24, 24, 24)
        obj.menuGfx = old
    }

    sc.ItemStatusDefault.inject({
        updateDrawables(renderer) {
            const currentConfig = getCurrentConfig()
            if (!currentConfig) return this.parent(renderer)

            customStatusDrawables(this, renderer, currentConfig)
        },
    })

    sc.StatusViewMainParameters.inject({
        updateDrawables(renderer) {
            const currentConfig = getCurrentConfig()
            if (!currentConfig) return this.parent(renderer)

            customStatusDrawables(this, renderer, currentConfig)
        },
    })

    sc.SocialPartyBox.inject({
        updatePartyLeader() {
            const oldLeader = this.members[0]
            oldLeader.hide(true)

            this.removeChildGui(oldLeader)
            // this.members[0] = null

            const newLeader = new sc.SocialPartyMember(true, sc.model.player)
            if (this.isHidden) {
                newLeader.hide(true)
            } else {
                newLeader.show(true)
            }

            this.members[0] = newLeader
            this.insertChildGui(newLeader, 0)
        },

        show(...args) {
            this.parent(...args)
            this.isHidden = false
        },
        hide(...args) {
            this.parent(...args)
            this.isHidden = true
        },
    })

    sc.SocialMenu.inject({
        addObservers() {
            this.parent()
            sc.Model.addObserver(sc.model.player, this)
        },
        removeObservers() {
            this.parent()
            sc.Model.removeObserver(sc.model.player, this)
        },
        modelChanged(model, message, data) {
            this.parent(model, message, data)
            if (sc.model.player === model) {
                this.party.updatePartyLeader()
            }
        },
    })
}
