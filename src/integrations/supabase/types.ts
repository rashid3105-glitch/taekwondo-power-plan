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
      ai_assistant_logs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          shared_with_coach: boolean
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          shared_with_coach?: boolean
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          shared_with_coach?: boolean
          user_id?: string
        }
        Relationships: []
      }
      athlete_achievements: {
        Row: {
          created_at: string
          id: string
          medal: string | null
          sort_order: number
          title: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          medal?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          medal?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      athlete_highlight_videos: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      athlete_module_overrides: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled: boolean
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      athlete_modules: {
        Row: {
          athlete_id: string
          club_id: string | null
          coach_id: string
          created_at: string | null
          enabled: boolean
          id: string
          module_key: string
        }
        Insert: {
          athlete_id: string
          club_id?: string | null
          coach_id: string
          created_at?: string | null
          enabled?: boolean
          id?: string
          module_key: string
        }
        Update: {
          athlete_id?: string
          club_id?: string | null
          coach_id?: string
          created_at?: string | null
          enabled?: boolean
          id?: string
          module_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_modules_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_week_technique_focus: {
        Row: {
          athlete_id: string
          created_by: string | null
          id: string
          season_plan_id: string
          season_week: number
          technique_ids: string[]
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_by?: string | null
          id?: string
          season_plan_id: string
          season_week: number
          technique_ids?: string[]
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_by?: string | null
          id?: string
          season_plan_id?: string
          season_week?: number
          technique_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_week_technique_focus_season_plan_id_fkey"
            columns: ["season_plan_id"]
            isOneToOne: false
            referencedRelation: "club_season_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          approved_at: string | null
          author_email: string
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          status: string
          token_expires_at: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          approved_at?: string | null
          author_email: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
          token_expires_at?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          approved_at?: string | null
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
          token_expires_at?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content_html: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          expires_at: string | null
          id: string
          locale: string
          published_at: string | null
          slug: string
          status: string
          title: string
          translation_group_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          expires_at?: string | null
          id?: string
          locale: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          translation_group_id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          expires_at?: string | null
          id?: string
          locale?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          translation_group_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_path: string | null
          attachment_size_bytes: number | null
          attachment_type: string | null
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_size_bytes?: number | null
          attachment_type?: string | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          attachment_path?: string | null
          attachment_size_bytes?: number | null
          attachment_type?: string | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_thread_members: {
        Row: {
          archived_at: string | null
          joined_at: string
          last_read_at: string
          muted: boolean
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          role?: string
          thread_id: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          club_id: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          last_message_at: string
          title: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          club_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind: string
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          club_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          last_message_at?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      club_activity_types: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_activity_types_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_athlete_season_overrides: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          notes: string | null
          override_date: string
          season_plan_id: string
          session_type: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          notes?: string | null
          override_date: string
          season_plan_id: string
          session_type?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          override_date?: string
          season_plan_id?: string
          session_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_athlete_season_overrides_season_plan_id_fkey"
            columns: ["season_plan_id"]
            isOneToOne: false
            referencedRelation: "club_season_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          club_id: string
          created_at: string
          id: string
          role_in_club: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          role_in_club: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          role_in_club?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_module_defaults: {
        Row: {
          club_id: string
          created_at: string
          enabled: boolean
          id: string
          module: string
        }
        Insert: {
          club_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          module: string
        }
        Update: {
          club_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          module?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_module_defaults_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_season_day_templates: {
        Row: {
          day_of_week: number
          id: string
          location: string | null
          notes: string | null
          season_plan_id: string
          session_type: string
        }
        Insert: {
          day_of_week: number
          id?: string
          location?: string | null
          notes?: string | null
          season_plan_id: string
          session_type?: string
        }
        Update: {
          day_of_week?: number
          id?: string
          location?: string | null
          notes?: string | null
          season_plan_id?: string
          session_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_season_day_templates_season_plan_id_fkey"
            columns: ["season_plan_id"]
            isOneToOne: false
            referencedRelation: "club_season_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      club_season_phases: {
        Row: {
          color: string
          created_at: string
          end_week: number
          focus_label: string | null
          focus_tags: string[]
          id: string
          name: string
          season_plan_id: string
          sort_order: number
          start_week: number
        }
        Insert: {
          color?: string
          created_at?: string
          end_week: number
          focus_label?: string | null
          focus_tags?: string[]
          id?: string
          name: string
          season_plan_id: string
          sort_order?: number
          start_week: number
        }
        Update: {
          color?: string
          created_at?: string
          end_week?: number
          focus_label?: string | null
          focus_tags?: string[]
          id?: string
          name?: string
          season_plan_id?: string
          sort_order?: number
          start_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_season_phases_season_plan_id_fkey"
            columns: ["season_plan_id"]
            isOneToOne: false
            referencedRelation: "club_season_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      club_season_plan_visibility: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          season_plan_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          season_plan_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          season_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_season_plan_visibility_season_plan_id_fkey"
            columns: ["season_plan_id"]
            isOneToOne: false
            referencedRelation: "club_season_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      club_season_plans: {
        Row: {
          club_id: string
          created_at: string
          created_by: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_season_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_techniques: {
        Row: {
          category: string
          club_id: string
          created_at: string
          created_by: string | null
          discipline: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          club_id: string
          created_at?: string
          created_by?: string | null
          discipline?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          club_id?: string
          created_at?: string
          created_by?: string | null
          discipline?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_techniques_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_week_technique_focus: {
        Row: {
          coach_note: string | null
          created_by: string | null
          id: string
          season_plan_id: string
          season_week: number
          technique_ids: string[]
          updated_at: string
        }
        Insert: {
          coach_note?: string | null
          created_by?: string | null
          id?: string
          season_plan_id: string
          season_week: number
          technique_ids?: string[]
          updated_at?: string
        }
        Update: {
          coach_note?: string | null
          created_by?: string | null
          id?: string
          season_plan_id?: string
          season_week?: number
          technique_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_week_technique_focus_season_plan_id_fkey"
            columns: ["season_plan_id"]
            isOneToOne: false
            referencedRelation: "club_season_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          default_weekly_schedule: Json | null
          deleted_at: string | null
          id: string
          license_active: boolean
          max_athletes: number
          name: string
          share_coach_notes: boolean
          slug: string
        }
        Insert: {
          created_at?: string
          default_weekly_schedule?: Json | null
          deleted_at?: string | null
          id?: string
          license_active?: boolean
          max_athletes?: number
          name: string
          share_coach_notes?: boolean
          slug: string
        }
        Update: {
          created_at?: string
          default_weekly_schedule?: Json | null
          deleted_at?: string | null
          id?: string
          license_active?: boolean
          max_athletes?: number
          name?: string
          share_coach_notes?: boolean
          slug?: string
        }
        Relationships: []
      }
      coach_athlete_notes: {
        Row: {
          athlete_id: string
          club_id: string | null
          coach_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          club_id?: string | null
          coach_id: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string | null
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_athlete_notes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_athletes: {
        Row: {
          athlete_id: string
          club_id: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          athlete_id: string
          club_id: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_invites: {
        Row: {
          active: boolean
          club_id: string | null
          coach_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          uses_count: number
        }
        Insert: {
          active?: boolean
          club_id?: string | null
          coach_id: string
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          uses_count?: number
        }
        Update: {
          active?: boolean
          club_id?: string | null
          coach_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_invites_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_license_fields: {
        Row: {
          coach_id: string
          created_at: string
          field_name: string
          id: string
          sort_order: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          field_name: string
          id?: string
          sort_order?: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          field_name?: string
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      coach_mental_assessments: {
        Row: {
          ai_advice: string | null
          answers: Json
          created_at: string
          id: string
          language: string | null
          scores: Json
          total_score: number
          user_id: string
        }
        Insert: {
          ai_advice?: string | null
          answers?: Json
          created_at?: string
          id?: string
          language?: string | null
          scores?: Json
          total_score?: number
          user_id: string
        }
        Update: {
          ai_advice?: string | null
          answers?: Json
          created_at?: string
          id?: string
          language?: string | null
          scores?: Json
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          athlete_id: string
          body: string
          club_id: string | null
          coach_id: string
          created_at: string
          id: string
          is_read: boolean
          subject: string
        }
        Insert: {
          athlete_id: string
          body?: string
          club_id?: string | null
          coach_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          subject: string
        }
        Update: {
          athlete_id?: string
          body?: string
          club_id?: string | null
          coach_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_reflection_comments: {
        Row: {
          athlete_id: string
          club_id: string | null
          coach_id: string
          content: string
          created_at: string
          id: string
          reflection_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          club_id?: string | null
          coach_id: string
          content?: string
          created_at?: string
          id?: string
          reflection_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string | null
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          reflection_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_reflection_comments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_reflection_comments_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "competition_reflections"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_reflection_requests: {
        Row: {
          athlete_id: string
          club_id: string | null
          coach_id: string
          competition_id: string
          id: string
          requested_at: string
        }
        Insert: {
          athlete_id: string
          club_id?: string | null
          coach_id: string
          competition_id: string
          id?: string
          requested_at?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string | null
          coach_id?: string
          competition_id?: string
          id?: string
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_reflection_requests_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_reflections: {
        Row: {
          ai_plan: Json | null
          club_id: string | null
          competition_date: string | null
          competition_id: string | null
          competition_name: string | null
          created_at: string
          id: string
          next_competition_id: string | null
          ratings: Json
          reflections: Json
          result: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_plan?: Json | null
          club_id?: string | null
          competition_date?: string | null
          competition_id?: string | null
          competition_name?: string | null
          created_at?: string
          id?: string
          next_competition_id?: string | null
          ratings?: Json
          reflections?: Json
          result?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_plan?: Json | null
          club_id?: string | null
          competition_date?: string | null
          competition_id?: string | null
          competition_name?: string | null
          created_at?: string
          id?: string
          next_competition_id?: string | null
          ratings?: Json
          reflections?: Json
          result?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_reflections_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_reflections_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_reflections_next_competition_id_fkey"
            columns: ["next_competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          club_id: string | null
          created_at: string
          event_date: string
          id: string
          invitation_pdf_url: string | null
          is_public: boolean
          location: string | null
          name: string
          notes: string | null
          plan_data: Json | null
          priority: string
          result: string | null
          updated_at: string
          user_id: string
          weight_class_kg: number | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          event_date: string
          id?: string
          invitation_pdf_url?: string | null
          is_public?: boolean
          location?: string | null
          name: string
          notes?: string | null
          plan_data?: Json | null
          priority?: string
          result?: string | null
          updated_at?: string
          user_id: string
          weight_class_kg?: number | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          event_date?: string
          id?: string
          invitation_pdf_url?: string | null
          is_public?: boolean
          location?: string | null
          name?: string
          notes?: string | null
          plan_data?: Json | null
          priority?: string
          result?: string | null
          updated_at?: string
          user_id?: string
          weight_class_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          athlete_id: string
          club_id: string | null
          consent_type: string
          created_at: string
          grace_until: string | null
          granted_at: string | null
          granted_by_email: string | null
          granted_by_relation: string | null
          id: string
          policy_version: string | null
          status: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          athlete_id: string
          club_id?: string | null
          consent_type?: string
          created_at?: string
          grace_until?: string | null
          granted_at?: string | null
          granted_by_email?: string | null
          granted_by_relation?: string | null
          id?: string
          policy_version?: string | null
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          athlete_id?: string
          club_id?: string | null
          consent_type?: string
          created_at?: string
          grace_until?: string | null
          granted_at?: string | null
          granted_by_email?: string | null
          granted_by_relation?: string | null
          id?: string
          policy_version?: string | null
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      consent_tokens: {
        Row: {
          athlete_id: string
          confirmed_at: string | null
          consent_type: string
          created_at: string
          expires_at: string
          id: string
          parent_email: string
          token: string
        }
        Insert: {
          athlete_id: string
          confirmed_at?: string | null
          consent_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_email: string
          token: string
        }
        Update: {
          athlete_id?: string
          confirmed_at?: string | null
          consent_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_email?: string
          token?: string
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
          is_shared: boolean
          updated_at: string
        }
        Insert: {
          coach_id: string
          content?: string
          created_at?: string
          diary_entry_id: string
          id?: string
          is_read?: boolean
          is_shared?: boolean
          updated_at?: string
        }
        Update: {
          coach_id?: string
          content?: string
          created_at?: string
          diary_entry_id?: string
          id?: string
          is_read?: boolean
          is_shared?: boolean
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
          club_id: string | null
          content: string
          created_at: string
          energy: number
          entry_date: string
          entry_type: string
          entry_types: string[] | null
          id: string
          mood: number
          run_calories: number | null
          run_distance_km: number | null
          run_duration_seconds: number | null
          run_pace_seconds_per_km: number | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          content?: string
          created_at?: string
          energy?: number
          entry_date?: string
          entry_type?: string
          entry_types?: string[] | null
          id?: string
          mood?: number
          run_calories?: number | null
          run_distance_km?: number | null
          run_duration_seconds?: number | null
          run_pace_seconds_per_km?: number | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          content?: string
          created_at?: string
          energy?: number
          entry_date?: string
          entry_type?: string
          entry_types?: string[] | null
          id?: string
          mood?: number
          run_calories?: number | null
          run_distance_km?: number | null
          run_duration_seconds?: number | null
          run_pace_seconds_per_km?: number | null
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
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
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
          coach_id?: string
          created_at?: string
          event_date?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      form_curve_weekly: {
        Row: {
          club_id: string | null
          composite_score: number
          computed_at: string
          load: number
          output: number
          overtraining_flag: boolean
          strain: number
          user_id: string
          week_start: string
        }
        Insert: {
          club_id?: string | null
          composite_score?: number
          computed_at?: string
          load?: number
          output?: number
          overtraining_flag?: boolean
          strain?: number
          user_id: string
          week_start: string
        }
        Update: {
          club_id?: string | null
          composite_score?: number
          computed_at?: string
          load?: number
          output?: number
          overtraining_flag?: boolean
          strain?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_curve_weekly_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      health_data: {
        Row: {
          club_id: string | null
          created_at: string
          date: string
          heart_rate_avg: number | null
          hrv: number | null
          id: string
          sleep_hours: number | null
          steps: number | null
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          date: string
          heart_rate_avg?: number | null
          hrv?: number | null
          id?: string
          sleep_hours?: number | null
          steps?: number | null
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          date?: string
          heart_rate_avg?: number | null
          hrv?: number | null
          id?: string
          sleep_hours?: number | null
          steps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_data_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link_url: string
          text_ar: string
          text_da: string
          text_de: string
          text_en: string
          text_no: string
          text_sv: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_url?: string
          text_ar?: string
          text_da?: string
          text_de?: string
          text_en?: string
          text_no?: string
          text_sv?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_url?: string
          text_ar?: string
          text_da?: string
          text_de?: string
          text_en?: string
          text_no?: string
          text_sv?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_tags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string
          outcome: string
          side: string
          technique: string
          timestamp_seconds: number
          video_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string
          outcome?: string
          side?: string
          technique: string
          timestamp_seconds?: number
          video_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string
          outcome?: string
          side?: string
          technique?: string
          timestamp_seconds?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_tags_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "match_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      match_videos: {
        Row: {
          athlete_age: string | null
          athlete_id: string
          club_id: string | null
          coach_id: string
          created_at: string
          discipline: string
          duration_seconds: number | null
          event_name: string | null
          id: string
          match_date: string | null
          notes: string
          opponent_name: string | null
          poomsae_type: string | null
          share_expires_at: string | null
          share_token: string | null
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          athlete_age?: string | null
          athlete_id: string
          club_id?: string | null
          coach_id: string
          created_at?: string
          discipline?: string
          duration_seconds?: number | null
          event_name?: string | null
          id?: string
          match_date?: string | null
          notes?: string
          opponent_name?: string | null
          poomsae_type?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          storage_path: string
          title?: string
          updated_at?: string
        }
        Update: {
          athlete_age?: string | null
          athlete_id?: string
          club_id?: string | null
          coach_id?: string
          created_at?: string
          discipline?: string
          duration_seconds?: number | null
          event_name?: string | null
          id?: string
          match_date?: string | null
          notes?: string
          opponent_name?: string | null
          poomsae_type?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mental_assessments: {
        Row: {
          ai_advice: string | null
          answers: Json
          club_id: string | null
          created_at: string
          id: string
          scores: Json
          total_score: number
          user_id: string
        }
        Insert: {
          ai_advice?: string | null
          answers?: Json
          club_id?: string | null
          created_at?: string
          id?: string
          scores?: Json
          total_score?: number
          user_id: string
        }
        Update: {
          ai_advice?: string | null
          answers?: Json
          club_id?: string | null
          created_at?: string
          id?: string
          scores?: Json
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mental_assessments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_development_reports: {
        Row: {
          athlete_user_id: string
          club_id: string | null
          generated_at: string
          id: string
          locale: string | null
          metrics: Json
          period_month: number
          period_year: number
          summary_text: string | null
        }
        Insert: {
          athlete_user_id: string
          club_id?: string | null
          generated_at?: string
          id?: string
          locale?: string | null
          metrics?: Json
          period_month: number
          period_year: number
          summary_text?: string | null
        }
        Update: {
          athlete_user_id?: string
          club_id?: string | null
          generated_at?: string
          id?: string
          locale?: string | null
          metrics?: Json
          period_month?: number
          period_year?: number
          summary_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_development_reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_report_jobs: {
        Row: {
          athlete_user_id: string
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          period_month: number
          period_year: number
          status: string
          updated_at: string
        }
        Insert: {
          athlete_user_id: string
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          period_month: number
          period_year: number
          status?: string
          updated_at?: string
        }
        Update: {
          athlete_user_id?: string
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          period_month?: number
          period_year?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          chat_messages: boolean
          competition_countdown: boolean
          diary_comments: boolean
          event_reminders: boolean
          training_reminders: boolean
          updated_at: string
          user_id: string
          weekly_digest: boolean
          weight_log_reminders: boolean
        }
        Insert: {
          chat_messages?: boolean
          competition_countdown?: boolean
          diary_comments?: boolean
          event_reminders?: boolean
          training_reminders?: boolean
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
          weight_log_reminders?: boolean
        }
        Update: {
          chat_messages?: boolean
          competition_countdown?: boolean
          diary_comments?: boolean
          event_reminders?: boolean
          training_reminders?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
          weight_log_reminders?: boolean
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          date: string
          fat_g: number | null
          id: string
          image_url: string | null
          items: Json | null
          logged_at: string
          meal_name: string | null
          portion: string | null
          protein_g: number | null
          source: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          id?: string
          image_url?: string | null
          items?: Json | null
          logged_at?: string
          meal_name?: string | null
          portion?: string | null
          protein_g?: number | null
          source?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          id?: string
          image_url?: string | null
          items?: Json | null
          logged_at?: string
          meal_name?: string | null
          portion?: string | null
          protein_g?: number | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_athletes: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          parent_user_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          parent_user_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          parent_user_id?: string
        }
        Relationships: []
      }
      parent_guide_conversations: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          message_count: number
          messages: Json
          parent_user_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          message_count?: number
          messages?: Json
          parent_user_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          message_count?: number
          messages?: Json
          parent_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_invites: {
        Row: {
          athlete_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          parent_user_id: string | null
          used_at: string | null
        }
        Insert: {
          athlete_id: string
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_user_id?: string | null
          used_at?: string | null
        }
        Update: {
          athlete_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_user_id?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      physical_test_results: {
        Row: {
          category: string
          club_id: string | null
          created_at: string
          id: string
          notes: string | null
          session_id: string | null
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
          club_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string | null
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
          club_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string | null
          test_date?: string
          test_name?: string
          test_type?: string
          tested_by?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "physical_test_results_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_test_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "team_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: string | null
          age: number | null
          athlete_code: string | null
          avatar_url: string | null
          belt_level: string
          birth_date: string | null
          club_id: string | null
          coach_athlete_count_band: string | null
          coach_club_name: string | null
          coach_focus: string[] | null
          coach_unread_reports_count: number
          country: string | null
          created_at: string
          current_injury: string | null
          custom_calories: number | null
          default_locale: string | null
          demo_expires_at: string | null
          demo_full_access: boolean
          discipline: string
          display_name: string
          experience_years: number | null
          gal_license: string | null
          gal_license_expires_at: string | null
          goals: string[] | null
          has_myfightbook: boolean
          id: string
          is_approved: boolean
          is_demo: boolean
          is_parent: boolean
          is_public: boolean
          last_seen_at: string | null
          license_values: Json
          myfightbook_expires_at: string | null
          onboarding_completed: boolean
          owns_wearable: boolean
          parent_email: string | null
          passkey_prompt_dismissed_at: string | null
          payment_date: string | null
          payment_status: string
          pending_coach_id: string | null
          pending_invite_code: string | null
          phone: string | null
          phone_country_code: string | null
          program_weeks: number | null
          public_show_achievements: boolean
          public_show_competitions: boolean
          public_show_prs: boolean
          public_show_videos: boolean
          push_enabled: boolean
          rejection_reason: string | null
          role: string
          roles: string[] | null
          superadmin_active: boolean
          tkd_sessions_per_week: number
          tkd_start_date: string | null
          updated_at: string
          user_id: string
          weekly_schedule: Json | null
          weight_kg: number | null
        }
        Insert: {
          active_role?: string | null
          age?: number | null
          athlete_code?: string | null
          avatar_url?: string | null
          belt_level?: string
          birth_date?: string | null
          club_id?: string | null
          coach_athlete_count_band?: string | null
          coach_club_name?: string | null
          coach_focus?: string[] | null
          coach_unread_reports_count?: number
          country?: string | null
          created_at?: string
          current_injury?: string | null
          custom_calories?: number | null
          default_locale?: string | null
          demo_expires_at?: string | null
          demo_full_access?: boolean
          discipline?: string
          display_name?: string
          experience_years?: number | null
          gal_license?: string | null
          gal_license_expires_at?: string | null
          goals?: string[] | null
          has_myfightbook?: boolean
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          is_parent?: boolean
          is_public?: boolean
          last_seen_at?: string | null
          license_values?: Json
          myfightbook_expires_at?: string | null
          onboarding_completed?: boolean
          owns_wearable?: boolean
          parent_email?: string | null
          passkey_prompt_dismissed_at?: string | null
          payment_date?: string | null
          payment_status?: string
          pending_coach_id?: string | null
          pending_invite_code?: string | null
          phone?: string | null
          phone_country_code?: string | null
          program_weeks?: number | null
          public_show_achievements?: boolean
          public_show_competitions?: boolean
          public_show_prs?: boolean
          public_show_videos?: boolean
          push_enabled?: boolean
          rejection_reason?: string | null
          role?: string
          roles?: string[] | null
          superadmin_active?: boolean
          tkd_sessions_per_week?: number
          tkd_start_date?: string | null
          updated_at?: string
          user_id: string
          weekly_schedule?: Json | null
          weight_kg?: number | null
        }
        Update: {
          active_role?: string | null
          age?: number | null
          athlete_code?: string | null
          avatar_url?: string | null
          belt_level?: string
          birth_date?: string | null
          club_id?: string | null
          coach_athlete_count_band?: string | null
          coach_club_name?: string | null
          coach_focus?: string[] | null
          coach_unread_reports_count?: number
          country?: string | null
          created_at?: string
          current_injury?: string | null
          custom_calories?: number | null
          default_locale?: string | null
          demo_expires_at?: string | null
          demo_full_access?: boolean
          discipline?: string
          display_name?: string
          experience_years?: number | null
          gal_license?: string | null
          gal_license_expires_at?: string | null
          goals?: string[] | null
          has_myfightbook?: boolean
          id?: string
          is_approved?: boolean
          is_demo?: boolean
          is_parent?: boolean
          is_public?: boolean
          last_seen_at?: string | null
          license_values?: Json
          myfightbook_expires_at?: string | null
          onboarding_completed?: boolean
          owns_wearable?: boolean
          parent_email?: string | null
          passkey_prompt_dismissed_at?: string | null
          payment_date?: string | null
          payment_status?: string
          pending_coach_id?: string | null
          pending_invite_code?: string | null
          phone?: string | null
          phone_country_code?: string | null
          program_weeks?: number | null
          public_show_achievements?: boolean
          public_show_competitions?: boolean
          public_show_prs?: boolean
          public_show_videos?: boolean
          push_enabled?: boolean
          rejection_reason?: string | null
          role?: string
          roles?: string[] | null
          superadmin_active?: boolean
          tkd_sessions_per_week?: number
          tkd_start_date?: string | null
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
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string | null
          fcm_token: string | null
          id: string
          is_active: boolean
          last_seen_at: string
          p256dh: string | null
          platform: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint?: string | null
          fcm_token?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          p256dh?: string | null
          platform?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string | null
          fcm_token?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          p256dh?: string | null
          platform?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      readiness_checkins: {
        Row: {
          checkin_date: string
          club_id: string | null
          created_at: string
          id: string
          is_sick: boolean
          mood: number
          motivation: number
          recommendation: string
          score: number
          sleep_hours: number
          soreness: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          club_id?: string | null
          created_at?: string
          id?: string
          is_sick?: boolean
          mood: number
          motivation: number
          recommendation: string
          score: number
          sleep_hours: number
          soreness: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          club_id?: string | null
          created_at?: string
          id?: string
          is_sick?: boolean
          mood?: number
          motivation?: number
          recommendation?: string
          score?: number
          sleep_hours?: number
          soreness?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_checkins_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_photo_overrides: {
        Row: {
          created_at: string
          id: string
          image_url: string
          recipe_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          recipe_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          recipe_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rehab_plans: {
        Row: {
          club_id: string | null
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
          club_id?: string | null
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
          club_id?: string | null
          created_at?: string
          id?: string
          injury_description?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehab_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      season_plans: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          is_active: boolean
          milestones: Json
          name: string
          phases: Json
          season_end: string
          season_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          milestones?: Json
          name?: string
          phases?: Json
          season_end: string
          season_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          milestones?: Json
          name?: string
          phases?: Json
          season_end?: string
          season_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          athlete_id: string
          club_id: string | null
          coach_id: string
          created_at: string
          id: string
          notes: string
          rpe: number | null
          session_date: string
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          club_id?: string | null
          coach_id: string
          created_at?: string
          id?: string
          notes?: string
          rpe?: number | null
          session_date?: string
          status: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string | null
          coach_id?: string
          created_at?: string
          id?: string
          notes?: string
          rpe?: number | null
          session_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          all_modules: boolean
          athlete_limit: number
          created_at: string
          id: string
          name: string
          plans_per_type: number | null
          price_monthly_dkk: number
          price_yearly_dkk: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          all_modules?: boolean
          athlete_limit?: number
          created_at?: string
          id: string
          name: string
          plans_per_type?: number | null
          price_monthly_dkk?: number
          price_yearly_dkk?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          all_modules?: boolean
          athlete_limit?: number
          created_at?: string
          id?: string
          name?: string
          plans_per_type?: number | null
          price_monthly_dkk?: number
          price_yearly_dkk?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_checks: {
        Row: {
          age_band: string | null
          club_id: string | null
          created_at: string
          extracted_substances: Json | null
          flag_status: string
          id: string
          input_type: string
          performed_by: string
          product_name: string | null
          result_summary: string | null
          user_id: string
        }
        Insert: {
          age_band?: string | null
          club_id?: string | null
          created_at?: string
          extracted_substances?: Json | null
          flag_status: string
          id?: string
          input_type: string
          performed_by: string
          product_name?: string | null
          result_summary?: string | null
          user_id: string
        }
        Update: {
          age_band?: string | null
          club_id?: string | null
          created_at?: string
          extracted_substances?: Json | null
          flag_status?: string
          id?: string
          input_type?: string
          performed_by?: string
          product_name?: string | null
          result_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_checks_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
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
      survey_anonymous_history: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          response_id: string
          survey_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          response_id: string
          survey_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          response_id?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_anonymous_history_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: true
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_anonymous_history_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          answer_bool: boolean | null
          answer_choice: string | null
          answer_number: number | null
          answer_text: string | null
          created_at: string
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer_bool?: boolean | null
          answer_choice?: string | null
          answer_number?: number | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer_bool?: boolean | null
          answer_choice?: string | null
          answer_number?: number | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          id: string
          mc_options: Json | null
          position: number
          question_text: string
          required: boolean
          scale_max: number | null
          survey_id: string
          type: Database["public"]["Enums"]["survey_question_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          mc_options?: Json | null
          position?: number
          question_text: string
          required?: boolean
          scale_max?: number | null
          survey_id: string
          type: Database["public"]["Enums"]["survey_question_type"]
        }
        Update: {
          created_at?: string
          id?: string
          mc_options?: Json | null
          position?: number
          question_text?: string
          required?: boolean
          scale_max?: number | null
          survey_id?: string
          type?: Database["public"]["Enums"]["survey_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_recipients: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          survey_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          survey_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_recipients_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          athlete_id: string | null
          id: string
          is_anonymous: boolean
          submitted_at: string
          survey_id: string
        }
        Insert: {
          athlete_id?: string | null
          id?: string
          is_anonymous?: boolean
          submitted_at?: string
          survey_id: string
        }
        Update: {
          athlete_id?: string | null
          id?: string
          is_anonymous?: boolean
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          allow_anonymous: boolean
          archived_at: string | null
          club_id: string | null
          coach_id: string
          created_at: string
          description: string | null
          id: string
          is_shared_with_club: boolean
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          allow_anonymous?: boolean
          archived_at?: string | null
          club_id?: string | null
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_shared_with_club?: boolean
          questions?: Json
          title: string
          updated_at?: string
        }
        Update: {
          allow_anonymous?: boolean
          archived_at?: string | null
          club_id?: string | null
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_shared_with_club?: boolean
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      surveys: {
        Row: {
          allow_anonymous: boolean
          club_id: string | null
          coach_id: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          published_at: string | null
          target_scope: Database["public"]["Enums"]["survey_target_scope"]
          title: string
          updated_at: string
        }
        Insert: {
          allow_anonymous?: boolean
          club_id?: string | null
          coach_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          published_at?: string | null
          target_scope?: Database["public"]["Enums"]["survey_target_scope"]
          title: string
          updated_at?: string
        }
        Update: {
          allow_anonymous?: boolean
          club_id?: string | null
          coach_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          published_at?: string | null
          target_scope?: Database["public"]["Enums"]["survey_target_scope"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      taekwondo_drills: {
        Row: {
          category: string
          club_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          club_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          club_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taekwondo_drills_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_test_session_athletes: {
        Row: {
          added_at: string
          athlete_id: string
          session_id: string
        }
        Insert: {
          added_at?: string
          athlete_id: string
          session_id: string
        }
        Update: {
          added_at?: string
          athlete_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_test_session_athletes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "team_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_test_session_tests: {
        Row: {
          created_at: string
          id: string
          order_index: number
          session_id: string
          test_id: string
          test_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          session_id: string
          test_id: string
          test_name: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          session_id?: string
          test_id?: string
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_test_session_tests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "team_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_test_sessions: {
        Row: {
          club_id: string
          coach_id: string
          created_at: string
          entry_mode: string
          focus_areas: string[]
          id: string
          name: string
          notes: string
          session_date: string
          status: string
          updated_at: string
        }
        Insert: {
          club_id: string
          coach_id: string
          created_at?: string
          entry_mode?: string
          focus_areas?: string[]
          id?: string
          name: string
          notes?: string
          session_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          coach_id?: string
          created_at?: string
          entry_mode?: string
          focus_areas?: string[]
          id?: string
          name?: string
          notes?: string
          session_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_test_sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          plan_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
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
      user_passkeys: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      video_annotations: {
        Row: {
          color: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          paths: Json
          timestamp_seconds: number
          video_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          paths?: Json
          timestamp_seconds: number
          video_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          paths?: Json
          timestamp_seconds?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_annotations_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "match_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_notes: {
        Row: {
          created_at: string
          frame_number: number
          id: string
          note_text: string | null
          tags: string[] | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          frame_number: number
          id?: string
          note_text?: string | null
          tags?: string[] | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          frame_number?: number
          id?: string
          note_text?: string | null
          tags?: string[] | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          club: string | null
          created_at: string
          email: string
          id: string
          locale: string | null
          name: string
          role: string | null
        }
        Insert: {
          club?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string | null
          name: string
          role?: string | null
        }
        Update: {
          club?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      wearable_connections: {
        Row: {
          club_id: string | null
          connected_at: string
          device_label: string | null
          granted_scopes: string[]
          id: string
          last_attempt_at: string | null
          last_sync_at: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          connected_at?: string
          device_label?: string | null
          granted_scopes?: string[]
          id?: string
          last_attempt_at?: string | null
          last_sync_at?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          connected_at?: string
          device_label?: string | null
          granted_scopes?: string[]
          id?: string
          last_attempt_at?: string | null
          last_sync_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_connections_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_daily_summary: {
        Row: {
          active_energy_kcal: number | null
          baseline_hr_7d: number | null
          baseline_hrv_7d: number | null
          club_id: string | null
          computed_at: string
          heart_rate_avg: number | null
          hrv_rmssd: number | null
          resting_hr: number | null
          sleep_minutes: number | null
          steps: number | null
          summary_date: string
          user_id: string
          workout_count: number
        }
        Insert: {
          active_energy_kcal?: number | null
          baseline_hr_7d?: number | null
          baseline_hrv_7d?: number | null
          club_id?: string | null
          computed_at?: string
          heart_rate_avg?: number | null
          hrv_rmssd?: number | null
          resting_hr?: number | null
          sleep_minutes?: number | null
          steps?: number | null
          summary_date: string
          user_id: string
          workout_count?: number
        }
        Update: {
          active_energy_kcal?: number | null
          baseline_hr_7d?: number | null
          baseline_hrv_7d?: number | null
          club_id?: string | null
          computed_at?: string
          heart_rate_avg?: number | null
          hrv_rmssd?: number | null
          resting_hr?: number | null
          sleep_minutes?: number | null
          steps?: number | null
          summary_date?: string
          user_id?: string
          workout_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "wearable_daily_summary_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_samples: {
        Row: {
          created_at: string
          end_at: string | null
          external_id: string | null
          id: string
          metric_type: string
          payload: Json
          provider: string
          source_device: string | null
          start_at: string
          unit: string | null
          user_id: string
          value_numeric: number | null
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          external_id?: string | null
          id?: string
          metric_type: string
          payload?: Json
          provider: string
          source_device?: string | null
          start_at: string
          unit?: string | null
          user_id: string
          value_numeric?: number | null
        }
        Update: {
          created_at?: string
          end_at?: string | null
          external_id?: string | null
          id?: string
          metric_type?: string
          payload?: Json
          provider?: string
          source_device?: string | null
          start_at?: string
          unit?: string | null
          user_id?: string
          value_numeric?: number | null
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          kind: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          kind: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          kind?: string
          user_id?: string | null
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          log_date: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_log_feedback: {
        Row: {
          athlete_id: string
          club_id: string | null
          coach_id: string
          comment: string
          created_at: string
          id: string
          is_read: boolean
          reaction: string
          updated_at: string
          workout_log_id: string
        }
        Insert: {
          athlete_id: string
          club_id?: string | null
          coach_id: string
          comment?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reaction?: string
          updated_at?: string
          workout_log_id: string
        }
        Update: {
          athlete_id?: string
          club_id?: string | null
          coach_id?: string
          comment?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reaction?: string
          updated_at?: string
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_log_feedback_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_feedback_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          activity_label: string | null
          actual_reps: string | null
          actual_sets: number | null
          avg_hr: number | null
          calories: number | null
          club_id: string | null
          completed: boolean
          created_at: string
          day_index: number | null
          duration_minutes: number | null
          entry_type: string
          exercise_index: number | null
          external_id: string | null
          id: string
          logged_date: string
          max_hr: number | null
          notes: string | null
          plan_id: string | null
          rpe: number | null
          session_index: number | null
          updated_at: string
          user_id: string
          wearable_source: string | null
        }
        Insert: {
          activity_label?: string | null
          actual_reps?: string | null
          actual_sets?: number | null
          avg_hr?: number | null
          calories?: number | null
          club_id?: string | null
          completed?: boolean
          created_at?: string
          day_index?: number | null
          duration_minutes?: number | null
          entry_type?: string
          exercise_index?: number | null
          external_id?: string | null
          id?: string
          logged_date?: string
          max_hr?: number | null
          notes?: string | null
          plan_id?: string | null
          rpe?: number | null
          session_index?: number | null
          updated_at?: string
          user_id: string
          wearable_source?: string | null
        }
        Update: {
          activity_label?: string | null
          actual_reps?: string | null
          actual_sets?: number | null
          avg_hr?: number | null
          calories?: number | null
          club_id?: string | null
          completed?: boolean
          created_at?: string
          day_index?: number | null
          duration_minutes?: number | null
          entry_type?: string
          exercise_index?: number | null
          external_id?: string | null
          id?: string
          logged_date?: string
          max_hr?: number | null
          notes?: string | null
          plan_id?: string | null
          rpe?: number | null
          session_index?: number | null
          updated_at?: string
          user_id?: string
          wearable_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      club_directory: {
        Row: {
          avatar_url: string | null
          belt_level: string | null
          club_id: string | null
          country: string | null
          discipline: string | null
          display_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_parent_invite: { Args: { _code: string }; Returns: Json }
      add_chat_group_member: {
        Args: { _thread: string; _user: string }
        Returns: undefined
      }
      admin_approve_with_invite: {
        Args: { _athlete_id: string }
        Returns: Json
      }
      admin_reject_with_reason: {
        Args: { _athlete_id: string; _reason: string }
        Returns: Json
      }
      apply_invite_to_my_profile: { Args: { _code: string }; Returns: Json }
      can_chat_with: { Args: { _a: string; _b: string }; Returns: boolean }
      cleanup_archived_survey_templates: { Args: never; Returns: undefined }
      club_athlete_count: { Args: { _club_id: string }; Returns: number }
      club_shares_coach_notes: { Args: { _club_id: string }; Returns: boolean }
      compute_form_curve: {
        Args: { _user_id: string; _weeks?: number }
        Returns: undefined
      }
      create_group_thread: {
        Args: { _member_ids: string[]; _title: string }
        Returns: string
      }
      delete_chat_message: { Args: { _id: string }; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      edit_chat_message: {
        Args: { _body: string; _id: string }
        Returns: undefined
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_monthly_reports: { Args: never; Returns: number }
      get_athlete_recovery_trend: {
        Args: { _athlete_id: string; _days?: number }
        Returns: {
          baseline_hr_7d: number
          baseline_hrv_7d: number
          hrv_rmssd: number
          resting_hr: number
          sleep_minutes: number
          steps: number
          summary_date: string
        }[]
      }
      get_blog_comments: {
        Args: { _post_id: string }
        Returns: {
          author_name: string
          content: string
          created_at: string
          id: string
        }[]
      }
      get_chat_members_display: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
        }[]
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
          is_coach: boolean
          program_weeks: number
          tkd_sessions_per_week: number
          user_id: string
          weekly_schedule: Json
          weight_kg: number
        }[]
      }
      get_club_test_medians: { Args: { _athlete_id: string }; Returns: Json }
      get_invite_by_code: { Args: { _code: string }; Returns: Json }
      get_parent_invite_info: { Args: { _code: string }; Returns: Json }
      get_profile_protected_fields: {
        Args: { _user_id: string }
        Returns: {
          club_id: string
          demo_expires_at: string
          demo_full_access: boolean
          is_approved: boolean
          is_demo: boolean
          payment_date: string
          payment_status: string
        }[]
      }
      get_public_athlete_bundle: { Args: { _code: string }; Returns: Json }
      get_shared_match_video: { Args: { _token: string }; Returns: Json }
      get_squad_overview: {
        Args: { _club_id?: string; _coach_id: string }
        Returns: Json
      }
      get_unread_chat_counts: {
        Args: never
        Returns: {
          thread_id: string
          unread_count: number
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
      is_athlete_in_team_session: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_thread_member: {
        Args: { _thread: string; _uid: string }
        Returns: boolean
      }
      is_coach_of_athletes_club: {
        Args: { _athlete_id: string }
        Returns: boolean
      }
      is_coach_of_club: { Args: { _club: string }; Returns: boolean }
      is_member_of_club: { Args: { _club: string }; Returns: boolean }
      is_parent_of: {
        Args: { _athlete: string; _parent: string }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_survey_target: {
        Args: { _survey_id: string; _user_id: string }
        Returns: boolean
      }
      list_club_directory: {
        Args: never
        Returns: {
          avatar_url: string
          belt_level: string
          club_id: string
          country: string
          discipline: string
          display_name: string
          user_id: string
        }[]
      }
      lookup_athlete_by_code: { Args: { _code: string }; Returns: string }
      mark_chat_thread_read: {
        Args: { _thread_id: string }
        Returns: undefined
      }
      mark_coach_message_read: {
        Args: { _message_id: string }
        Returns: undefined
      }
      mark_comment_read: { Args: { _comment_id: string }; Returns: undefined }
      mark_monthly_reports_seen: { Args: never; Returns: undefined }
      mark_reminder_read: { Args: { _reminder_id: string }; Returns: undefined }
      mark_workout_feedback_read: {
        Args: { _feedback_id: string }
        Returns: undefined
      }
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
      recompute_wearable_summary: {
        Args: { _from: string; _to: string; _user_id: string }
        Returns: undefined
      }
      remove_chat_group_member: {
        Args: { _thread: string; _user: string }
        Returns: undefined
      }
      rename_chat_group: {
        Args: { _thread: string; _title: string }
        Returns: undefined
      }
      set_club_default_weekly_schedule: {
        Args: { _club_id: string; _schedule: Json }
        Returns: undefined
      }
      set_superadmin_active: { Args: { _active: boolean }; Returns: boolean }
      start_direct_thread: { Args: { _other_user: string }; Returns: string }
      submit_survey: {
        Args: { _answers: Json; _is_anonymous: boolean; _survey_id: string }
        Returns: string
      }
      users_share_club: {
        Args: { _first_user_id: string; _second_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "user"
      membership_role: "athlete" | "coach" | "admin"
      membership_status: "active" | "pending" | "removed"
      survey_question_type: "text" | "scale" | "mc" | "yesno"
      survey_target_scope: "club" | "selected"
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
      membership_role: ["athlete", "coach", "admin"],
      membership_status: ["active", "pending", "removed"],
      survey_question_type: ["text", "scale", "mc", "yesno"],
      survey_target_scope: ["club", "selected"],
    },
  },
} as const
