import { fetchWeiboCityHot } from "../utils/weibo-city"

export default defineSource({
  "weibo-city": async () => fetchWeiboCityHot("800861100"),
})
