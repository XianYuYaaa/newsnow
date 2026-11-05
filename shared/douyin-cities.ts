import cities from "./douyin-cities.json"

export interface DouyinCity {
  /** 标准行政区划码，如苏州 320500 */
  code: string
  name: string
  /** 简称，与微博城市数据保持同一结构 */
  short?: string
  pinyin: string
}

export const douyinCities = cities as DouyinCity[]

export const defaultDouyinCityCode = "320500"

export const douyinCityGroups = douyinCities.reduce<Record<string, DouyinCity[]>>((acc, city) => {
  (acc[city.pinyin] ??= []).push(city)
  return acc
}, {})
