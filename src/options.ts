import type { Options } from 'ccmodmanager/types/mod-options'
import { modMetadata } from './mod-metadata'

export let Opts: ReturnType<typeof modmanager.registerAndGetModOptions<ReturnType<typeof registerOpts>>>

export function registerOpts() {
    const opts = {
        general: {
            settings: {
                title: 'General',
                tabIcon: 'general',
            },
            headers: {
                general: {
                    playerIconMapOverlay: {
                        type: 'CHECKBOX',
                        name: 'Player icon map overlay',
                        description: 'Show a player head icon in the position of the player on the map menu',
                        init: true,
                    },
                    mainMenuReplace: {
                        type: 'CHECKBOX',
                        name: 'Main menu replace',
                        description: 'Replace the big Lea portrait in the main menu, equipment menu and status menu',
                        init: true,
                    },
                    inventoryMenuReplace: {
                        type: 'CHECKBOX',
                        name: 'Inventory menu replace',
                        description: 'Replace the small Lea portrait in the inventory menu and status menu',
                        init: true,
                    },
                    mapMenuReplace: {
                        type: 'CHECKBOX',
                        name: 'Map menu replace',
                        description: 'Replace the tiny Lea head in the map menu and area menu',
                        init: true,
                    },
                },
            },
        },
    } as const satisfies Options

    Opts = modmanager.registerAndGetModOptions(
        {
            modId: modMetadata.manifest.id,
            title: modMetadata.manifest.title,
        },
        opts
    )
    return opts
}
