import { CQCode } from 'koishi-utils'
import debug from 'debug'

export const showLog = debug('koishi:image-search')

export function getLink (url: string) {
  const pidSearch = /pixiv.+illust_id=(\d+)/.exec(url)
  if (pidSearch) return 'https://pixiv.net/i/' + pidSearch[1]
  const uidSearch = /pixiv.+member\.php\?id=(\d+)/.exec(url)
  if (uidSearch) return 'https://pixiv.net/u/' + uidSearch[1]
  return url
}

export function getShareText (url: string, title: string, file: string, authorUrl?: string, source?: string) {
  const output = [
    title,
    CQCode.stringify('image', { file }),
    `链接：${getLink(url)}`,
  ]
  if (authorUrl) output.push(`作者：${getLink(authorUrl)}`)
  if (source) output.push(`来源：${getLink(source)}`)
  return output.join('\n')
}
