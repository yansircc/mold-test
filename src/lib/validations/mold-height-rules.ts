import * as z from "zod"

export const moldHeightSettingFormSchema = z.object({
  id: z.number().optional(),
  maxHeight: z.coerce
    .number()     
    .min(1, "最大高度必须大于0")
    .transform(val => Number(val.toFixed(0))), // 保留6位小数
  height: z.coerce
    .number()
    .min(1, "高度必须大于0")
    .transform(val => Number(val.toFixed(0))), // 保留4位小数
})

export type MoldHeightSettingFormValues = z.infer<typeof moldHeightSettingFormSchema> 

export const deleteSchema = z.object({
  id: z.coerce.number().positive('ID必须是正数')
})

export interface MoldHeightSettingData{
  id: number,
  maxHeight: number    // 最大高度
  height: number       // 高度
  updatedAt: string
} 

export const moldHeightSettingItemSchema = z.object({
  maxHeight: z.number(),
  height: z.number(),
})

export type MoldHeightSettingItem = z.infer<typeof moldHeightSettingItemSchema>
