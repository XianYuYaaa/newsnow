import cities from "./weibo-cities.json"

export interface WeiboCity {
  code: string
  name: string
  /** 微博城市列表里的简称，如「阿拉善」 */
  short?: string
  pinyin: string
  lat: number
  lon: number
}

export const weiboCities = cities as WeiboCity[]

export const defaultWeiboCityCode = "800861100"

export const weiboCityGroups = weiboCities.reduce<Record<string, WeiboCity[]>>((acc, city) => {
  (acc[city.pinyin] ??= []).push(city)
  return acc
}, {})
