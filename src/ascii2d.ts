import axios from 'axios'
import Cheerio from 'cheerio'
import { Meta } from 'koishi-core'
import { noop } from 'koishi-utils'
import { getShareText, showLog } from './utils'

const baseURL = 'https://ascii2d.net'

export default async function (url: string, meta: Meta) {
  try {
    const tasks: Promise<void>[] = []
    const response = await axios.get(`${baseURL}/search/url/${encodeURIComponent(url)}`)
    tasks.push(meta.$send('ascii2d 色合检索\n' + getDetail(response.data)).catch(noop))
    try {
      const bovwURL = response.request.res.responseUrl.replace('/color/', '/bovw/')
      const bovwHTML = await axios.get(bovwURL).then(r => r.data)
      tasks.push(meta.$send('ascii2d 特征检索\n' + getDetail(bovwHTML)).catch(noop))
    } catch (err) {
      showLog(`[error] ascii2d bovw ${err}`)
    }
    return Promise.all(tasks)
  } catch (err) {
    showLog(`[error] ascii2d color ${err}`)
    return meta.$send('访问失败。')
  }
}

function getDetail (html: string) {
  const $ = Cheerio.load(html, { decodeEntities: false })
  const $box = $($('.item-box')[1])
  const thumbnail = baseURL + $box.find('.image-box img').attr('src')
  const $link = $box.find('.detail-box a')
  const $title = $($link[0])
  const $author = $($link[1])
  const displayTitle = $author
    ? `「${$title.html()}」/「${$author.html()}」`
    : $title.html()
  return getShareText($title.attr('href'), displayTitle, thumbnail, $author.attr('href'))
}
