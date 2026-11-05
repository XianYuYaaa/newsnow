import type { NewsItem } from "@shared/types"
import { douyinCities } from "@shared/douyin-cities"
import process from "node:process"
import { readFileSync } from "node:fs"

const CACHE_TTL = 5 * 60 * 1000
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"
const BASE_URL = "https://creator.douyin.com/web/api/creator/material/center/billboard/"
const REFERER = "https://creator.douyin.com/creator-micro/creative-guidance?discover_menu=2"

const cache = new Map<string, { items: NewsItem[], updated: number }>()

export function getDouyinCity(code: string) {
  return douyinCities.find(city => city.code === code)
}

function getCookie() {
  const inline = process.env.DOUYIN_CREATOR_COOKIE
  if (inline) return inline.trim().replace(/^Cookie:\s*/i, "")

  const file = process.env.DOUYIN_COOKIE_FILE
  if (!file) throw new Error("未配置抖音 Cookie（DOUYIN_CREATOR_COOKIE 或 DOUYIN_COOKIE_FILE）")

  try {
    return readFileSync(file, "utf8").trim().replace(/^Cookie:\s*/i, "")
  } catch {
    throw new Error("无法读取抖音 Cookie 文件")
  }
}

function formatHot(value?: number) {
  if (!value) return undefined
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}亿`
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}万`
  return String(value)
}

/**
 * 抖音创作者中心的同城热点榜。
 *
 * 该接口是登录态接口：只带 .douyin.com 的登录 Cookie 即可，不需要 msToken / user_id。
 * Cookie 约 60 天过期，过期后返回 status_code=8（用户未登录）。
 */
export async function fetchDouyinCityHot(code: string): Promise<NewsItem[]> {
  const city = getDouyinCity(code)
  if (!city) throw new Error("Invalid city code")

  const cached = cache.get(code)
  if (cached && Date.now() - cached.updated < CACHE_TTL) {
    return cached.items
  }

  const params = new URLSearchParams({
    aid: "2906",
    app_name: "aweme_creator_platform",
    device_platform: "web",
    cookie_enabled: "true",
    browser_language: "zh-CN",
    browser_platform: "Win32",
    timezone_name: "Asia/Shanghai",
    billboard_type: "2",
    billboard_tag: "0",
    hot_search_type: "2",
    city_code: code,
  })

  const data: any = await myFetch(`${BASE_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": UA,
      "Referer": REFERER,
      "Cookie": getCookie(),
    },
  })

  if (data?.status_code === 8) {
    throw new Error("抖音登录 Cookie 已失效，请重新导出")
  }
  if (data?.status_code !== 0) {
    throw new Error(data?.status_message || "获取抖音同城热榜失败")
  }

  const items: NewsItem[] = (data.item_list ?? [])
    .filter((item: any) => item?.title)
    .map((item: any, index: number) => ({
      id: String(item.query_id || `${code}-${index}`),
      title: item.title,
      url: `https://www.douyin.com/search/${encodeURIComponent(item.title)}`,
      mobileUrl: `https://www.douyin.com/search/${encodeURIComponent(item.title)}`,
      extra: {
        info: formatHot(item.hot_score) ? `🔥 ${formatHot(item.hot_score)}` : undefined,
        hover: item.category ? `所属分类·${item.category}` : undefined,
      },
    }))

  if (!items.length) {
    if (cached) return cached.items
    throw new Error("Cannot fetch douyin city hot list")
  }

  cache.set(code, { items, updated: Date.now() })
  return items
}
