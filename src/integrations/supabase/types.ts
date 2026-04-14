export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clubs: {
        Row: {
          created_at: string
          id: string
          max_athletes: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_athletes?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          max_athletes?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      coach_athletes: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      diary_comments: {
        Row: {
          coach_id: string
          content: string
          created_at: string
          diary_entry_id: string
          id: string
          is_read: boolean
          updated_at: string
        }
        Insert: {
          coach_id: string
          content?: string
          created_at?: string
          diary_entry_id: string
          id?: string
          is_read?: boolean
          updated_at?: string
        }
        Update: {
          coach_id?: string
          content?: string
          created_at?: string
          diary_entry_id?: string
          id?: string
          is_read?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_comments_diary_entry_id_fkey"
            columns: ["diary_entry_id"]
            isOneToOne: false
            referencedRelation: "diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          content: string
          created_at: string
          energy: number
          entry_date: string
          id: string
          mood: number
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          energy?: number
          entry_date?: string
          id?: string
          mood?: number
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          energy?: number
          entry_date?: string
          id?: string
          mood?: number
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_reminders: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          event_date: string
          id: string
          is_read: boolean
          message: string
          title: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          event_date: string
          id?: string
          is_read?: boolean
          message?: string
          title: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          event_date?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
        }
        Relationships: []
      }
      mental_assessments: {
        Row: {
          ai_advice: string | null
          answers: Json
          created_at: string
          id: string
          scores: Json
          total_score: number
          user_id: string
        }
        Insert: {
          ai_advice?: string | null
          answers?: Json
          created_at?: string
          id?: string
          scores?: Json
          total_score?: number
          user_id: string
        }
        Update: {
          ai_advice?: string | null
          answers?: Json
          created_at?: string
          id?: string
          scores?: Json
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          created_at: string
          custom_calories: number | null
          goals: string[]
          id: string
          is_active: boolean
          name: string
          plan_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_calories?: number | null
          goals?: string[]
          id?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_calories?: number | null
          goals?: string[]
          id?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      physical_test_results: {
        Row: {
          category: string
          created_at: string
          id: string
          notes: string | null
          test_date: string
          test_name: string
          test_type: string
          tested_by: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          test_date?: string
          test_name: string
          test_type?: string
          tested_by?: string | null
          unit?: string
          user_id: string
          value: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          test_date?: string
          test_name?: string
          test_type?: string
          tested_by?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          athlete_code: string | null
          avatar_url: string | null
          belt_level: string
          club_id: string | null
          country: string | null
          created_at: string
          current_injury: string | null
          custom_calories: number | null
          demo_full_access: boolean
          discipline: string
          display_name: string
          experience_years: number | null
          goals: string[] | null
          id: string
          is_approved: boolean
          is_demo: boolean
          last_seen_at: string | null
          payment_date: string | null
          payment_status: string
          program_weeks: number | null
          tkd_sessions_per_week: number
          updated_at: string
          user_id: string
          weekly_schedule: Json | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          athlete_code?: string | null
          avatar_url?: string | null
          belt_level?: string
          club_id?: string | null
          country?: string | null
          created_at?: string
          current_injury?: string | null
          custom_calories?: number | null
          demo_full_access?: boolean
          discipline?: string
          display_name?: string
          experience_years?: number | null
          goals?: string[] | null
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          last_seen_at?: string | null
          payment_date?: string | null
          payment_status?: string
          program_weeks?: number | null
          tkd_sessions_per_week?: number
          updated_at?: string
          user_id: string
          weekly_schedule?: Json | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          athlete_code?: string | null
          avatar_url?: string | null
          belt_level?: string
          club_id?: string | null
          country?: string | null
          created_at?: string
          current_injury?: string | null
          custom_calories?: number | null
          demo_full_access?: boolean
          discipline?: string
          display_name?: string
          experience_years?: number | null
          goals?: string[] | null
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          last_seen_at?: string | null
          payment_date?: string | null
          payment_status?: string
          program_weeks?: number | null
          tkd_sessions_per_week?: number
          updated_at?: string
          user_id?: string
          weekly_schedule?: Json | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      rehab_plans: {
        Row: {
          created_at: string
          id: string
          injury_description: string
          is_active: boolean
          name: string
          plan_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          injury_description?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          injury_description?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      training_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          plan_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_exercises: {
        Row: {
          alternatives: Json | null
          category: string
          created_at: string
          id: string
          muscle_groups: string[]
          name: string
          notes: string
          reps: string
          rest: string
          sets: number
          tempo: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          why_it_matters: string
        }
        Insert: {
          alternatives?: Json | null
          category?: string
          created_at?: string
          id?: string
          muscle_groups?: string[]
          name: string
          notes?: string
          reps?: string
          rest?: string
          sets?: number
          tempo?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          why_it_matters?: string
        }
        Update: {
          alternatives?: Json | null
          category?: string
          created_at?: string
          id?: string
          muscle_groups?: string[]
          name?: string
          notes?: string
          reps?: string
          rest?: string
          sets?: number
          tempo?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          why_it_matters?: string
        }
        Relationships: []
      }
      user_recipes: {
        Row: {
          calories: number
          carbs: number
          category: string
          created_at: string
          fat: number
          id: string
          ingredients: string[]
          name: string
          prep_time: string
          protein: number
          steps: string[]
          tip: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          category?: string
          created_at?: string
          fat?: number
          id?: string
          ingredients?: string[]
          name: string
          prep_time?: string
          protein?: number
          steps?: string[]
          tip?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string
          created_at?: string
          fat?: number
          id?: string
          ingredients?: string[]
          name?: string
          prep_time?: string
          protein?: number
          steps?: string[]
          tip?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          actual_reps: string | null
          actual_sets: number | null
          completed: boolean
          created_at: string
          day_index: number
          exercise_index: number
          id: string
          logged_date: string
          notes: string | null
          plan_id: string
          session_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_reps?: string | null
          actual_sets?: number | null
          completed?: boolean
          created_at?: string
          day_index: number
          exercise_index: number
          id?: string
          logged_date?: string
          notes?: string | null
          plan_id: string
          session_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_reps?: string | null
          actual_sets?: number | null
          completed?: boolean
          created_at?: string
          day_index?: number
          exercise_index?: number
          id?: string
          logged_date?: string
          notes?: string | null
          plan_id?: string
          session_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_club_member_profiles: {
        Args: { _club_id: string }
        Returns: {
          age: number
          athlete_code: string
          avatar_url: string
          belt_level: string
          club_id: string
          country: string
          current_injury: string
          discipline: string
          display_name: string
          experience_years: number
          goals: string[]
          program_weeks: number
          tkd_sessions_per_week: number
          user_id: string
          weekly_schedule: Json
          weight_kg: number
        }[]
      }
      get_profile_protected_fields: {
        Args: { _user_id: string }
        Returns: {
          club_id: string
          demo_full_access: boolean
          is_approved: boolean
          is_demo: boolean
          payment_date: string
          payment_status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      lookup_athlete_by_code: { Args: { _code: string }; Returns: string }
      mark_comment_read: { Args: { _comment_id: string }; Returns: undefined }
      mark_reminder_read: { Args: { _reminder_id: string }; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      users_share_club: {
        Args: { _first_user_id: string; _second_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "coach", "user"],
    },
  },
} as const
