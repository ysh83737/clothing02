import pinyin from "tiny-pinyin"

/**
 * 计算 namePinyin 字段值："{全拼} {首字母}"
 * 例如 "张三" → "zhangsan zs"
 *       "黑色西装裤" → "heisexizhuangku hsxzk"
 */
export function computeNamePinyin(name: string): string {
  if (!name || !pinyin.isSupported()) return name.toLowerCase()

  const full = pinyin.convertToPinyin(name, "", true)
  const words = pinyin.convertToPinyin(name, " ", true).split(" ")
  const initials = words.map((w) => w[0] || "").join("")

  // 如果拼音转换没有产生变化（可能是纯英文），返回空
  if (full === name.toLowerCase()) return ""

  return `${full} ${initials}`
}
