import { Context, Middleware, Meta } from 'koishi-core'
import ascii2d from './ascii2d'
import saucenao from './saucenao'

export interface ImageSearchConfig {
  lowSimilarity?: number
  highSimilarity?: number
}

const imageRE = /\[CQ:image,file=([^,]+),url=([^\]]+)\]/g
function extractImages (message: string) {
  let search = imageRE.exec(message)
  const result: string[] = []
  while (search) {
    result.push(search[2])
    search = imageRE.exec(message)
  }
  return result
}

async function searchImage (ctx: Context, meta: Meta, callback: (url: string) => Promise<any>) {
  const urls = extractImages(meta.message)
  if (urls.length) {
    return Promise.all(urls.map(url => callback(url)))
  }

  await meta.$send('请发送图片。')
  const identifier = meta.userId + meta.$ctxType + meta.$ctxId
  const middleware: Middleware = (meta, next) => {
    if (identifier !== meta.userId + meta.$ctxType + meta.$ctxId) return next()
    ctx.removeMiddleware(middleware)
    const urls = extractImages(meta.message)
    if (!urls.length) return next()
    return Promise.all(urls.map(url => callback(url)))
  }
  ctx.prependMiddleware(middleware)
}

async function mixedSearch (url: string, meta: Meta, config: ImageSearchConfig) {
  return await saucenao(url, meta, config, true) && ascii2d(url, meta)
}

export const name = 'image-search'

export function apply (ctx: Context, config: ImageSearchConfig = {}) {
  const command = ctx.command('image-search <...images>', '搜图片')
    .alias('搜图')
    .action(({ meta }) => searchImage(ctx, meta, url => mixedSearch(url, meta, config)))

  command.subcommand('saucenao <...images>', '使用 saucenao 搜图')
    .action(({ meta }) => searchImage(ctx, meta, url => saucenao(url, meta, config)))

  command.subcommand('ascii2d <...images>', '使用 ascii2d 搜图')
    .action(({ meta }) => searchImage(ctx, meta, url => ascii2d(url, meta)))
}
