export type InboxStatus = 'collected' | 'applied' | 'archived'

export interface InboxItem {
  id: string
  user_id: string
  company: string
  position: string
  direction: string[]
  source: string
  link: string
  raw_note: string
  note: string
  batch: string
  status: InboxStatus
  pipeline_id: string | null
  created_at: string
  updated_at: string
}

export interface StatusHistoryEntry {
  status: string
  date: string
  note: string
}

export interface Application {
  id: string
  user_id: string
  company: string
  position: string
  direction: string[]
  platform: string
  batch: string
  resume_id: string | null
  status: string
  status_history: StatusHistoryEntry[]
  applied_date: string
  referral_code: string
  interview_time: string | null
  note: string
  inbox_item_id: string | null
  review_link: string | null
  review_markdown: string | null
  created_at: string
  updated_at: string
}

export interface Resume {
  id: string
  user_id: string
  name: string
  direction: string[]
  note: string
  file_path: string | null
  file_name: string | null
  file_size: number | null
  created_at: string
  updated_at: string
}

export interface UserConfig {
  user_id: string
  api_key_encrypted: string | null
  text_model: string
  vision_model: string
  directions: string[]
  nudge_applied: number
  nudge_written: number
  nudge_interview: number
  created_at: string
  updated_at: string
}

export type SourceChannel =
  | '微信群'
  | '小红书'
  | '朋友推荐'
  | '牛客'
  | 'Boss直聘'
  | '实习僧'
  | '官网'
  | '其他'

export type Batch = '日常实习' | '暑期实习' | '春招' | '秋招'

export type ApplicationStatus =
  | '已投递'
  | '笔试'
  | '一面'
  | '二面'
  | '三面'
  | 'HR面'
  | 'Offer'
  | '已挂'
  | '已放弃'

export interface InboxFilters {
  status?: InboxStatus | 'all'
  direction?: string
  batch?: string
  query?: string
}

export type CreateInboxItemInput = Omit<
  InboxItem,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'pipeline_id'
> & {
  pipeline_id?: string | null
}

export type UpdateInboxItemInput = Partial<
  Omit<InboxItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>

export interface ParsedJobInfo {
  company?: string
  position?: string
  direction?: string[]
  source?: string
  link?: string
  note?: string
}

export type TemperatureLevel = 'hot' | 'warm' | 'cold' | 'frozen'

export interface TemperatureInfo {
  level: TemperatureLevel
  daysSinceUpdate: number
  label: string
}

export interface DashboardStats {
  totalApplications: number
  activeApplications: number
  inboxCount: number
  interviewCount: number
  offerCount: number
  recentApplications: Application[]
}
