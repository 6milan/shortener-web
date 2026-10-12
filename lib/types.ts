export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  created?: boolean;
}

export interface ShortLink {
  id: number;
  original_url: string;
  short_code: string;
  short_url: string;
  title: string;
  clicks: number;
  is_active: boolean;
  is_expired: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateLinkInput {
  original_url: string;
  title?: string;
  custom_code?: string;
  expires_at?: string | null;
}

export type UpdateLinkInput = Partial<Pick<ShortLink, 'original_url' | 'title' | 'is_active' | 'expires_at'>>;

export interface ListParams {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  is_active?: boolean;
  expired?: boolean;
}

export interface BreakdownItem { name: string; count: number }
export interface DailyClicks { date: string; clicks: number }
export interface ClickEvent {
  id: number;
  clicked_at: string;
  device_type: string;
  browser: string;
  referrer: string;
}

export interface LinkStats {
  short_code: string;
  short_url: string;
  original_url: string;
  created_at: string;
  total_clicks: number;
  period_days: number;
  clicks_in_period: number;
  clicks_by_day: DailyClicks[];
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  referrers: BreakdownItem[];
  recent_clicks: ClickEvent[];
}

export interface Summary {
  total_links: number;
  active_links: number;
  total_clicks: number;
  clicks_last_7_days: number;
  top_links: ShortLink[];
}
