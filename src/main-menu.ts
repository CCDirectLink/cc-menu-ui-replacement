import type { CustomPlayerConfig } from './types'

interface ConfigSettable {
    config: Nullable<CustomPlayerConfig> | undefined

    setConfig(this: this, config: Nullable<CustomPlayerConfig> | undefined): void
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

export function injectPostload() {
    function onPlayerModelChanged(
        this: { setConfig(config: Nullable<CustomPlayerConfig> | undefined): void },
        model: sc.Model,
        message: number,
        _data: unknown
    ) {
        if (model === sc.model.player) {
            if (message === sc.PLAYER_MSG.CONFIG_CHANGED) {
                const playerName = sc.model.player.name
                if (customPlayerMenus.has(playerName)) {
                    this.setConfig(customPlayerMenus.get(playerName))
                } else {
                    this.setConfig(null)
                }
            }
        }
    }

    function addPlayerObserver(instance: sc.Model.Observer) {
        sc.Model.addObserver(sc.model.player, instance)
    }

    function removePlayerObserver(instance: sc.Model.Observer) {
        sc.Model.removeObserver(sc.model.player, instance)
    }

    sc.MainMenu.LeaLarge.inject({
        config: null,

        init(...args) {
            this.parent(...args)
            addPlayerObserver(this)
        },
        setConfig(config: Nullable<CustomPlayerConfig> | undefined) {
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

        modelChanged: onPlayerModelChanged,
    })

    sc.MainMenu.LeaSmall.inject({
        config: null,

        init(...args) {
            this.parent(...args)
            addPlayerObserver(this)
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
        modelChanged: onPlayerModelChanged,
    })

    sc.AreaButton.inject({
        updateDrawables(renderer) {
            const currentConfig = customPlayerMenus.get(sc.model.player.name)
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
        config: null,

        init(...args) {
            this.parent(...args)
            this.originalCopy = this.leaIcon

            addPlayerObserver(this)

            if (sc.model.player.name !== 'Lea') {
                const config = customPlayerMenus.get(sc.model.player.name)
                if (config) {
                    this.setConfig(config)
                }
            }
        },
        addObservers() {
            this.parent()
            addPlayerObserver(this)
        },
        removeObservers() {
            this.parent()
            removePlayerObserver(this)
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
            onPlayerModelChanged.call(this, ...args)
        },
    })

    function customStatusDrawables<T extends sc.ItemStatusDefault | sc.StatusViewMainParameters, R>(
        this: T & { parent: (renderer: ig.GuiRenderer) => R },
        renderer: ig.GuiRenderer
    ) {
        const currentConfig = customPlayerMenus.get(sc.model.player.name)
        if (currentConfig) {
            const old = this.menuGfx
            this.menuGfx = currentConfig.menuGfx
            ig.BoxGui.prototype.updateDrawables.call(this, renderer)
            const gfx = currentConfig.gfx
            const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = currentConfig.Head
            renderer.addGfx(gfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY)
            renderer.addGfx(this.statusGfx, 64, 5, 104, 32 + sc.model.player.currentElementMode * 24, 24, 24)
            this.menuGfx = old
        } else {
            this.parent(renderer)
        }
    }

    sc.ItemStatusDefault.inject({
        updateDrawables: customStatusDrawables,
    })

    sc.StatusViewMainParameters.inject({
        updateDrawables: customStatusDrawables,
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
            addPlayerObserver(this)
        },
        removeObservers() {
            this.parent()
            removePlayerObserver(this)
        },
        modelChanged(model, message, data) {
            if (sc.model.player === model) {
                this.party.updatePartyLeader()
            } else {
                this.parent(model, message, data)
            }
        },
    })
}
