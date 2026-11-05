import { defaultDouyinCityCode } from "@shared/douyin-cities"
import { fetchDouyinCityHot } from "../utils/douyin-city"

export default defineSource({
  "douyin-city": async () => fetchDouyinCityHot(defaultDouyinCityCode),
})
