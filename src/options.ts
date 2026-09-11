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
                        description: 'Do not print out the vanilla startup messages into dev console',
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
