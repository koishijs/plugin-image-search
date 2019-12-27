import { Context, Middleware, Meta, CommandConfig } from 'koishi-core'
import ascii2d from './ascii2d'
import saucenao from './saucenao'

export interface SaucenaoConfig extends CommandConfig {
	lowSimilarity?: number
	highSimilarity?: number
}

export interface ImageSearchConfig {
	baseConfig?: CommandConfig
	saucenaoConfig?: SaucenaoConfig
	ascii2dConfig?: CommandConfig
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
	ctx.premiddleware(middleware)
}

async function mixedSearch (url: string, meta: Meta, config: SaucenaoConfig) {
	return await saucenao(url, meta, config, true) && await ascii2d(url, meta)
}

export const name = 'image-search'

export function apply (ctx: Context, config: ImageSearchConfig = {}) {
	const { baseConfig = {}, saucenaoConfig = {}, ascii2dConfig = {} } = config

	const command = ctx.command('image-search <...images>', '搜图片', baseConfig)
		.alias('搜图')
		.action(({ meta }) => searchImage(ctx, meta, url => mixedSearch(url, meta, saucenaoConfig)))

	command.subcommand('saucenao <...images>', '使用 saucenao 搜图', { ...baseConfig, ...saucenaoConfig })
		.action(({ meta }) => searchImage(ctx, meta, url => saucenao(url, meta, saucenaoConfig)))

	command.subcommand('ascii2d <...images>', '使用 ascii2d 搜图', { ...baseConfig, ...ascii2dConfig })
		.action(({ meta }) => searchImage(ctx, meta, url => ascii2d(url, meta)))
}
