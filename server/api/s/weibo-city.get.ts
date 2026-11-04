import type { SourceResponse } from "@shared/types"
import { fetchWeiboCityHot, getWeiboCity } from "../../utils/weibo-city"

export default defineEventHandler(async (event): Promise<SourceResponse> => {
  const query = getQuery(event)
  const code = typeof query.code === "string" && query.code ? query.code : "800861100"

  if (!getWeiboCity(code)) {
    throw createError({
      statusCode: 400,
      message: "无效的城市",
    })
  }

  try {
    const items = await fetchWeiboCityHot(code)
    return {
      status: "success",
      id: "weibo-city",
      updatedTime: Date.now(),
      items,
    }
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "获取微博同城热搜失败",
    })
  }
})
