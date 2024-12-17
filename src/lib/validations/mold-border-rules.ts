import * as z from "zod"

export const moldBorderSettingFormSchema = z.object({
  id: z.number().optional(),
  maxLength: z.coerce
    .number()     
    .min(1, "最大长度必须大于0")
    .transform(val => Number(val.toFixed(0))), // 保留6位小数
  spacing: z.coerce
    .number()
    .min(1, "间距必须大于0")
    .transform(val => Number(val.toFixed(0))), // 保留4位小数
})

export type MoldBorderSettingFormValues = z.infer<typeof moldBorderSettingFormSchema> 

export const deleteSchema = z.object({
  id: z.coerce.number().positive('ID必须是正数')
})

export interface MoldBorderSettingData{
  id: number,
  maxLength: number    // 最大长度
  spacing: number       // 间距
  updatedAt: string
} 

export const moldBorderSettingItemSchema = z.object({
  maxLength: z.number(),
  spacing: z.number(),
})

export type MoldBorderSettingItem = z.infer<typeof moldBorderSettingItemSchema>
