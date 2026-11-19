import type { Icon } from '@wikimedia/codex-icons'

import type { ConfigUser, ConfigWebSkin, PrototypePlatform } from '@/config'
import type { PageCategory } from '@/prototype-gallery'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    category?: PageCategory
    platform?: PrototypePlatform
    order?: number
    hidden?: boolean
    spotlight?: boolean
    hidePrimary?: boolean
    hideSecondary?: boolean
    icon?: Icon
    /**
     * Web skin this prototype opens with, whatever the visitor saved in
     * Settings (which stay untouched). See `@/appearance/route-pins`.
     */
    skin?: ConfigWebSkin
    /**
     * Mock user this prototype opens with, whatever the visitor saved in
     * Settings (which stay untouched). See `@/appearance/route-pins`.
     */
    user?: ConfigUser
  }
}
