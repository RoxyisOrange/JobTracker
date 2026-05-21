export const APPLICATION_STATUSES = [
  '已投递',
  '笔试',
  '一面',
  '二面',
  '三面',
  'HR面',
  'Offer',
  '已挂',
  '已放弃',
] as const

export const ACTIVE_STATUSES = ['笔试', '一面', '二面', '三面', 'HR面']
export const TERMINAL_STATUSES = ['Offer', '已挂', '已放弃']

export const PLATFORMS = [
  'Boss直聘',
  '实习僧',
  '官网',
  '牛客',
  '邮件直投',
  '其他',
] as const

export const SOURCES = [
  '微信群',
  '小红书',
  '朋友推荐',
  '牛客',
  'Boss直聘',
  '实习僧',
  '官网',
  '其他',
] as const

export const DEFAULT_DIRECTIONS = [
  '数据分析/数据科学',
  '多模态算法',
  'AI应用算法',
  '大模型评测',
] as const

export const BATCHES = ['日常实习', '暑期实习', '春招', '秋招'] as const

export const CURRENT_BATCH = '秋招'

export const DEFAULT_TEXT_MODEL = 'qwen-turbo-latest'
export const DEFAULT_VISION_MODEL = 'qwen3-vl-flash'

export const NUDGE_DEFAULTS = {
  applied: 7,
  written: 12,
  interview: 7,
}

export const STATUS_COLORS: Record<string, string> = {
  已投递: 'bg-blue-100 text-blue-700',
  笔试: 'bg-yellow-100 text-yellow-700',
  一面: 'bg-purple-100 text-purple-700',
  二面: 'bg-purple-100 text-purple-700',
  三面: 'bg-purple-100 text-purple-700',
  HR面: 'bg-indigo-100 text-indigo-700',
  Offer: 'bg-green-100 text-green-700',
  已挂: 'bg-red-100 text-red-700',
  已放弃: 'bg-gray-100 text-gray-500',
}

export const TEMPERATURE_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  normal: 'bg-blue-500',
  stale: 'bg-gray-400',
  success: 'bg-emerald-500',
  terminal: 'bg-gray-400',
}
