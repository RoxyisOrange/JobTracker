export const APPLICATION_STATUSES = [
  '已投递',
  '笔试',
  '一面',
  '二面',
  '三面',
  'HR面',
  'offer',
  '已拒绝',
  '已放弃',
] as const

export const ACTIVE_STATUSES = ['已投递', '笔试', '一面', '二面', '三面', 'HR面']
export const TERMINAL_STATUSES = ['offer', '已拒绝', '已放弃']

export const PLATFORMS = [
  '牛客',
  '实习僧',
  'Boss直聘',
  '拉勾',
  '智联',
  '前程无忧',
  '校招',
  '内推',
  '官网',
  '其他',
] as const

export const DEFAULT_DIRECTIONS = [
  '数据分析/数据科学',
  '多模态算法',
  'AI应用算法',
  '大模型评测',
] as const

export const CURRENT_BATCH = '2025届秋招'

export const BATCHES = ['2025届秋招', '2025届春招', '2024届秋招', '2024届春招'] as const

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
  offer: 'bg-green-100 text-green-700',
  已拒绝: 'bg-red-100 text-red-700',
  已放弃: 'bg-gray-100 text-gray-500',
}

export const TEMPERATURE_COLORS: Record<string, string> = {
  hot: 'bg-red-400',
  warm: 'bg-yellow-400',
  cold: 'bg-blue-400',
  frozen: 'bg-gray-400',
}
