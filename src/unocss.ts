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
