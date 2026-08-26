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
      adhd_screening_results: {
        Row: {
          answers: Json
          created_at: string
          id: string
          instrument: string
          positive_count: number
          recommendation: string
          result_level: string
          source_url: string
          total_score: number
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          instrument: string
          positive_count: number
          recommendation: string
          result_level: string
          source_url: string
          total_score: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          instrument?: string
          positive_count?: number
          recommendation?: string
          result_level?: string
          source_url?: string
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adhd_screening_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limit_events: {
        Row: {
          created_at: string
          id: number
          route: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          route: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          route?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chests: {
        Row: {
          created_at: string | null
          game_session_id: string | null
          id: string
          is_opened: boolean | null
          perk_type: string | null
          rarity: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_session_id?: string | null
          id?: string
          is_opened?: boolean | null
          perk_type?: string | null
          rarity: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_session_id?: string | null
          id?: string
          is_opened?: boolean | null
          perk_type?: string | null
          rarity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chests_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          ai_cache_creation_input_tokens: number | null
          ai_cache_read_input_tokens: number | null
          ai_cache_status: string
          ai_estimated_input_tokens: number | null
          ai_input_chars: number | null
          ai_model: string | null
          ai_output_tokens: number | null
          ai_source_mode: string
          ai_uncached_input_tokens: number | null
          correct_answers: number
          created_at: string
          current_question_index: number
          difficulty: string
          double_xp_active: boolean
          finished_at: string | null
          id: string
          lives_remaining: number
          pdf_name: string
          source_hash: string | null
          status: string
          total_questions: number
          user_id: string
          wrong_answers: number
          xp_earned: number
        }
        Insert: {
          ai_cache_creation_input_tokens?: number | null
          ai_cache_read_input_tokens?: number | null
          ai_cache_status?: string
          ai_estimated_input_tokens?: number | null
          ai_input_chars?: number | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          ai_source_mode?: string
          ai_uncached_input_tokens?: number | null
          correct_answers?: number
          created_at?: string
          current_question_index?: number
          difficulty: string
          double_xp_active?: boolean
          finished_at?: string | null
          id?: string
          lives_remaining?: number
          pdf_name: string
          source_hash?: string | null
          status?: string
          total_questions?: number
          user_id: string
          wrong_answers?: number
          xp_earned?: number
        }
        Update: {
          ai_cache_creation_input_tokens?: number | null
          ai_cache_read_input_tokens?: number | null
          ai_cache_status?: string
          ai_estimated_input_tokens?: number | null
          ai_input_chars?: number | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          ai_source_mode?: string
          ai_uncached_input_tokens?: number | null
          correct_answers?: number
          created_at?: string
          current_question_index?: number
          difficulty?: string
          double_xp_active?: boolean
          finished_at?: string | null
          id?: string
          lives_remaining?: number
          pdf_name?: string
          source_hash?: string | null
          status?: string
          total_questions?: number
          user_id?: string
          wrong_answers?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          icon: string
          id: string
          item_description: string | null
          item_name: string
          item_type: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          item_description?: string | null
          item_name: string
          item_type: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          item_description?: string | null
          item_name?: string
          item_type?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number
          display_name: string | null
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          streak_updated_at: string | null
          total_correct: number
          total_games: number
          tutorial_completed: boolean
          tutorial_completed_at: string | null
          tutorial_skipped: boolean
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_updated_at?: string | null
          total_correct?: number
          total_games?: number
          tutorial_completed?: boolean
          tutorial_completed_at?: string | null
          tutorial_skipped?: boolean
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          streak_updated_at?: string | null
          total_correct?: number
          total_games?: number
          tutorial_completed?: boolean
          tutorial_completed_at?: string | null
          tutorial_skipped?: boolean
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          answered: boolean
          correct_option: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_correct: boolean | null
          options: Json
          question_index: number
          question_text: string
          session_id: string
          user_answer: number | null
          user_id: string
        }
        Insert: {
          answered?: boolean
          correct_option: number
          created_at?: string
          difficulty: string
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          options: Json
          question_index: number
          question_text: string
          session_id: string
          user_answer?: number | null
          user_id: string
        }
        Update: {
          answered?: boolean
          correct_option?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          options?: Json
          question_index?: number
          question_text?: string
          session_id?: string
          user_answer?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_game_sessions: {
        Row: {
          created_at: string
          id: string
          module_id: string | null
          quiz_type: string
          section_id: string | null
          session_id: string
          subject_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id?: string | null
          quiz_type: string
          section_id?: string | null
          session_id: string
          subject_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string | null
          quiz_type?: string
          section_id?: string | null
          session_id?: string
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_game_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_game_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sus_responses: {
        Row: {
          id: string
          q1: number
          q10: number
          q2: number
          q3: number
          q4: number
          q5: number
          q6: number
          q7: number
          q8: number
          q9: number
          submitted_at: string | null
          sus_score: number | null
          user_id: string
        }
        Insert: {
          id?: string
          q1: number
          q10: number
          q2: number
          q3: number
          q4: number
          q5: number
          q6: number
          q7: number
          q8: number
          q9: number
          submitted_at?: string | null
          sus_score?: number | null
          user_id: string
        }
        Update: {
          id?: string
          q1?: number
          q10?: number
          q2?: number
          q3?: number
          q4?: number
          q5?: number
          q6?: number
          q7?: number
          q8?: number
          q9?: number
          submitted_at?: string | null
          sus_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      task_documents: {
        Row: {
          content_storage_path: string
          created_at: string
          estimated_tokens: number
          id: string
          image_count: number
          original_file_name: string | null
          page_count: number
          processing_status: string
          source_hash: string | null
          storage_bytes: number
          table_count: number
          task_id: string
          text_char_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_storage_path: string
          created_at?: string
          estimated_tokens?: number
          id?: string
          image_count?: number
          original_file_name?: string | null
          page_count?: number
          processing_status?: string
          source_hash?: string | null
          storage_bytes?: number
          table_count?: number
          task_id: string
          text_char_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_storage_path?: string
          created_at?: string
          estimated_tokens?: number
          id?: string
          image_count?: number
          original_file_name?: string | null
          page_count?: number
          processing_status?: string
          source_hash?: string | null
          storage_bytes?: number
          table_count?: number
          task_id?: string
          text_char_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          code: string
          description: string
          earned_at: string
          icon: string
          id: string
          metadata: Json
          rarity: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          description: string
          earned_at?: string
          icon: string
          id?: string
          metadata?: Json
          rarity?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          description?: string
          earned_at?: string
          icon?: string
          id?: string
          metadata?: Json
          rarity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subject_progress: {
        Row: {
          completed_modules: Json
          completed_sections: Json
          created_at: string
          diagnostic_passed: boolean
          id: string
          subject_completed: boolean
          subject_id: string
          unlocked_modules: Json
          unlocked_sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_modules?: Json
          completed_sections?: Json
          created_at?: string
          diagnostic_passed?: boolean
          id?: string
          subject_completed?: boolean
          subject_id: string
          unlocked_modules?: Json
          unlocked_sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_modules?: Json
          completed_sections?: Json
          created_at?: string
          diagnostic_passed?: boolean
          id?: string
          subject_completed?: boolean
          subject_id?: string
          unlocked_modules?: Json
          unlocked_sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subject_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          subject_name: string | null
          task_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          subject_name?: string | null
          task_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          subject_name?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage_reports: {
        Row: {
          comparisons: Json | null
          created_at: string
          id: string
          metrics: Json
          period_end: string
          period_start: string | null
          report_type: string
          streak_day: number | null
          user_id: string
        }
        Insert: {
          comparisons?: Json | null
          created_at?: string
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string | null
          report_type: string
          streak_day?: number | null
          user_id: string
        }
        Update: {
          comparisons?: Json | null
          created_at?: string
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string | null
          report_type?: string
          streak_day?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_records_leaderboards: { Args: { p_limit?: number }; Returns: Json }
      update_user_streak: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
