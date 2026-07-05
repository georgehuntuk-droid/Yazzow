export type TutorProfileRow = {
  id: string;
  username: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  portal_welcome_message: string | null;
  portal_accent_oklch: string | null;
  lesson_price_cents: number;
  currency: string;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  calendar_feed_token: string | null;
  google_refresh_token: string | null;
  google_calendar_id: string | null;
  block_package_lessons_count: number;
  block_package_discount_percent: number;
  is_platform_admin: boolean;
  portal_bg_style: string;
  portal_side_banner_url: string | null;
  portal_side_banner_link: string | null;
  portal_side_widget_title: string | null;
  portal_side_widget_content: string | null;
  created_at: string;
  updated_at: string;
  is_banned: boolean;
  meeting_link: string | null;
};

export type AvailabilitySlotRow = {
  id: string;
  tutor_id: string;
  starts_at: string;
  ends_at: string;
  is_booked: boolean;
  created_at: string;
};

export type DigitalResourceRow = {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  file_path: string;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
};

export type StudentRow = {
  id: string;
  tutor_id: string;
  student_name: string;
  parent_email: string;
  notes: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  lesson_credits?: number;
  credit_limit?: number;
  lesson_type: string;
};

export type BookingRow = {
  id: string;
  slot_id: string;
  tutor_id: string;
  parent_email: string;
  student_name: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  stripe_payment_intent_id: string | null;
  status: string;
  google_calendar_event_id: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  running_late_sent_at: string | null;
  running_late_note: string | null;
  tutor_lesson_feedback: string | null;
  lesson_rating: number | null;
  created_at: string;
};

export type ResourcePurchaseRow = {
  id: string;
  resource_id: string;
  tutor_id: string;
  buyer_email: string;
  amount_cents: number;
  platform_fee_cents: number;
  download_token: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
};

export type ScheduleRuleRow = {
  id: string;
  tutor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      tutor_profiles: {
        Row: TutorProfileRow;
        Insert: Omit<TutorProfileRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TutorProfileRow>;
      };
      availability_slots: {
        Row: AvailabilitySlotRow;
        Insert: Omit<AvailabilitySlotRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AvailabilitySlotRow>;
      };
      bookings: {
        Row: BookingRow;
        Insert: Omit<BookingRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<BookingRow>;
      };
      digital_resources: {
        Row: DigitalResourceRow;
        Insert: Omit<DigitalResourceRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DigitalResourceRow>;
      };
      resource_purchases: {
        Row: ResourcePurchaseRow;
        Insert: Omit<ResourcePurchaseRow, "id" | "created_at" | "download_token"> & {
          id?: string;
          created_at?: string;
          download_token?: string;
        };
        Update: Partial<ResourcePurchaseRow>;
      };
      students: {
        Row: StudentRow;
        Insert: Omit<StudentRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<StudentRow>;
      };
      schedule_rules: {
        Row: ScheduleRuleRow;
        Insert: Omit<ScheduleRuleRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ScheduleRuleRow>;
      };
      slot_alert_subscribers: {
        Row: {
          id: string;
          tutor_id: string;
          parent_email: string;
          student_name: string | null;
          created_at: string;
        };
        Insert: {
          tutor_id: string;
          parent_email: string;
          student_name?: string | null;
        };
        Update: Partial<{
          parent_email: string;
          student_name: string | null;
        }>;
      };
    };
  };
};
