import API from 'nhentai-api-js'

const nhentai = new API()

export default async function (name: string) {
	let json = await nhentai.search(`"${name}" chinese`)
	if (json.results.length == 0) json = await nhentai.search(`"${name}"`)
	if (json.results.length == 0) return false
	return json.results[0]
}
