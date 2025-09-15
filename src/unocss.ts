import type { PresetWindTheme } from 'unocss'
import { definePreset, entriesToCss } from 'unocss'
import type { Plugin } from 'vite'

export function UnoCSSApplet(): Plugin[] {
  return [
    {
      name: 'unocss-applet:virtual-entry',
      enforce: 'pre',
      transform(code, id) {
        // 自动引入
        if (id.endsWith('/src/main.ts')) {
          return `import 'virtual:uno.css'\n${code}`
        }
      },
    },
    {
      // UnoCSS 升级到 66.1.0-beta.11 后，不能正常转化小程序平台的 css 文件后缀
      // 官方已经有了解决方案 @see https://github.com/dcloudio/uni-app/pull/5605
      // 但是目前似乎并未发版，根据解决方案做以下适配以实现解决方案
      name: 'unocss-applet:adapt-higher-version',
      enforce: 'post',
      configResolved(config) {
        for (const plugin of config.plugins) {
          if (plugin.name === 'uni:adjust-css-extname') {
            if (typeof plugin.generateBundle === 'function') {
              const handler = plugin.generateBundle
              plugin.generateBundle = {
                order: 'post',
                handler: handler,
              }
            }
          }
        }
      },
    },
  ]
}

export const presetApplet = definePreset<object, PresetWindTheme>(() => {
  return {
    name: 'unocss-applet',
    theme: {
      preflightRoot: ['page,:before,:after', '::backdrop'],
    },
    preflights: [
      {
        layer: 'preflights',
        getCSS: ({ theme }) => {
          type CSSProperties = Record<string, string>
          type CSSEntry = [string, CSSProperties]
          type CSSEntires = CSSEntry[]

          const getColor = (color: string) => {
            const colorValue = theme.colors?.[color]

            type Colors = typeof colorValue
            const resolveColors = (value: Colors): string | undefined => {
              if (typeof value === 'string') {
                return value
              }
              return value ? resolveColors(value[700]) : undefined
            }
            return resolveColors(colorValue)
          }

          const cssEntries: CSSEntires = [
            ['page', { height: '100%' }],
            [
              'view, image',
              {
                'border-style': 'solid',
                'border-width': '0',
                'border-color': getColor('light') ?? '#e5e7eb',
                'box-sizing': 'border-box',
              },
            ],
          ]

          const resolveCSS = ([selector, properties]: CSSEntry) => {
            const entries = Object.entries(properties)
            const css = entriesToCss(entries)
            return `${selector} {${css}}`
          }

          return cssEntries.map(resolveCSS).join('')
        },
      },
    ],
  }
})
