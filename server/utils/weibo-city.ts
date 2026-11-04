import type { NewsItem } from "@shared/types"
import { weiboCities } from "@shared/weibo-cities"

const CACHE_TTL = 5 * 60 * 1000
const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"

const cache = new Map<string, { items: NewsItem[], updated: number }>()

export function getWeiboCity(code: string) {
  return weiboCities.find(city => city.code === code)
}

function getSearchUrl(item: any) {
  const scheme: string = item?.scheme || item?.openurl || ""
  const q = /[?&]q=([^&]+)/.exec(scheme)?.[1]
  if (q) return `https://s.weibo.com/weibo?q=${q}`
  return `https://s.weibo.com/weibo?q=${encodeURIComponent(item?.title_sub ?? "")}`
}

function parseItems(data: any): NewsItem[] {
  const cards: any[] = data?.cards ?? []
  const groups: any[] = cards.flatMap(card => card?.card_group ?? [])
  const items: NewsItem[] = []
  const seen = new Set<string>()

  for (const group of groups) {
    // 榜单条目用 title_sub；卡片里的「当前 / 点击切换」是切城市入口，不是热搜
    const title: string = group?.title_sub || ""
    if (!title || seen.has(title)) continue
    seen.add(title)

    const desc: string = group?.desc || ""
    const heat = /同城热度\s*(\d+)/.exec(desc)?.[1]
    const source = /@\s*([^|]+?)\s*$/.exec(desc)?.[1]

    items.push({
      id: title,
      title,
      url: getSearchUrl(group),
      mobileUrl: `https://m.weibo.cn/search?containerid=100103type%3D1%26q%3D${encodeURIComponent(title)}`,
      extra: {
        info: heat ? `🔥 ${heat}` : undefined,
        hover: source ? `来自 @${source}` : undefined,
      },
    })
  }

  return items
}

/**
 * 获取微博同城热搜。
 *
 * 微博 m 站接口需要经纬度才能返回对应城市的榜单（只传城市名会返回「位置信息获取失败」），
 * 所以这里用预置的城市经纬度表来定位。
 */
export async function fetchWeiboCityHot(code: string): Promise<NewsItem[]> {
  const city = getWeiboCity(code)
  if (!city) throw new Error("Invalid city code")

  const cached = cache.get(code)
  if (cached && Date.now() - cached.updated < CACHE_TTL) {
    return cached.items
  }

  const url = `https://api.weibo.cn/2/guest/page?containerid=106003&filter_type=region&lat=${city.lat}&lon=${city.lon}`
  const data: any = await myFetch(url, {
    headers: {
      "User-Agent": MOBILE_UA,
      "Referer": "https://m.weibo.cn/",
    },
  })

  const items = parseItems(data)
  if (!items.length) {
    // 上游可能临时返回「位置信息获取失败」，有旧缓存时继续用旧数据
    if (cached) return cached.items
    throw new Error("Cannot fetch weibo city hot search")
  }

  cache.set(code, { items, updated: Date.now() })
  return items
}
