import axios from 'axios'
import Cheerio from 'cheerio'

export default async function danbooru (url: string) {
	let { data } = await axios.get(url)
	const $ = Cheerio.load(data)
	return $('#image-container').attr('data-normalized-source')
}
