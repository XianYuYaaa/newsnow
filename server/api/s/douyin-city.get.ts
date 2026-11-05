import type { SourceResponse } from "@shared/types"
import { defaultDouyinCityCode } from "@shared/douyin-cities"
import { fetchDouyinCityHot, getDouyinCity } from "../../utils/douyin-city"

export default defineEventHandler(async (event): Promise<SourceResponse> => {
  const query = getQuery(event)
  const code = typeof query.code === "string" && query.code ? query.code : defaultDouyinCityCode

  if (!getDouyinCity(code)) {
    throw createError({
      statusCode: 400,
      message: "无效的城市",
    })
  }

  try {
    const items = await fetchDouyinCityHot(code)
    return {
      status: "success",
      id: "douyin-city",
      updatedTime: Date.now(),
      items,
    }
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "获取抖音同城热榜失败",
    })
  }
})
