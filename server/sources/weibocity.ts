import { defaultWeiboCityCode } from "@shared/weibo-cities"
import { fetchWeiboCityHot } from "../utils/weibo-city"

export default defineSource({
  "weibo-city": async () => fetchWeiboCityHot(defaultWeiboCityCode),
})
