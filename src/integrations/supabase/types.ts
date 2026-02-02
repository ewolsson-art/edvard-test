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
      chat_messages: {
        Row: {
          connection_id: string
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          connection_id: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          connection_id?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "patient_doctor_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          created_at: string
          diagnosed_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosed_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosed_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_delegates: {
        Row: {
          can_read_messages: boolean
          can_send_messages: boolean
          created_at: string
          delegate_email: string
          delegate_id: string | null
          delegate_name: string | null
          doctor_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          can_read_messages?: boolean
          can_send_messages?: boolean
          created_at?: string
          delegate_email: string
          delegate_id?: string | null
          delegate_name?: string | null
          doctor_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          can_read_messages?: boolean
          can_send_messages?: boolean
          created_at?: string
          delegate_email?: string
          delegate_id?: string | null
          delegate_name?: string | null
          doctor_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          medication_id: string
          taken: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          medication_id: string
          taken?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          medication_id?: string
          taken?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          dosage: string
          frequency: string
          id: string
          name: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage: string
          frequency?: string
          id?: string
          name: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string
          frequency?: string
          id?: string
          name?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          comment: string | null
          created_at: string
          date: string
          eating_comment: string | null
          eating_quality: string | null
          exercise_comment: string | null
          exercise_types: string[] | null
          exercised: boolean | null
          id: string
          medication_comment: string | null
          medication_side_effects: string[] | null
          mood: string
          sleep_comment: string | null
          sleep_quality: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          date: string
          eating_comment?: string | null
          eating_quality?: string | null
          exercise_comment?: string | null
          exercise_types?: string[] | null
          exercised?: boolean | null
          id?: string
          medication_comment?: string | null
          medication_side_effects?: string[] | null
          mood: string
          sleep_comment?: string | null
          sleep_quality?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          date?: string
          eating_comment?: string | null
          eating_quality?: string | null
          exercise_comment?: string | null
          exercise_types?: string[] | null
          exercised?: boolean | null
          id?: string
          medication_comment?: string | null
          medication_side_effects?: string[] | null
          mood?: string
          sleep_comment?: string | null
          sleep_quality?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          checkin_enabled: boolean
          checkin_time: string
          created_at: string
          id: string
          medication_enabled: boolean
          medication_time: string
          push_subscription: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checkin_enabled?: boolean
          checkin_time?: string
          created_at?: string
          id?: string
          medication_enabled?: boolean
          medication_time?: string
          push_subscription?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checkin_enabled?: boolean
          checkin_time?: string
          created_at?: string
          id?: string
          medication_enabled?: boolean
          medication_time?: string
          push_subscription?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_doctor_connections: {
        Row: {
          chat_enabled: boolean
          created_at: string
          doctor_id: string
          id: string
          initiated_by: string
          patient_id: string
          share_comments: boolean
          share_eating: boolean
          share_exercise: boolean
          share_medication: boolean
          share_mood: boolean
          share_sleep: boolean
          status: string
          updated_at: string
        }
        Insert: {
          chat_enabled?: boolean
          created_at?: string
          doctor_id: string
          id?: string
          initiated_by?: string
          patient_id: string
          share_comments?: boolean
          share_eating?: boolean
          share_exercise?: boolean
          share_medication?: boolean
          share_mood?: boolean
          share_sleep?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          chat_enabled?: boolean
          created_at?: string
          doctor_id?: string
          id?: string
          initiated_by?: string
          patient_id?: string
          share_comments?: boolean
          share_eating?: boolean
          share_exercise?: boolean
          share_medication?: boolean
          share_mood?: boolean
          share_sleep?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_name: string | null
          created_at: string
          first_name: string | null
          hospital_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_name?: string | null
          created_at?: string
          first_name?: string | null
          hospital_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic_name?: string | null
          created_at?: string
          first_name?: string | null
          hospital_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_reports: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          medications: Json | null
          period: string
          report_type: string
          share_key: string
          stats: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          medications?: Json | null
          period: string
          report_type: string
          share_key: string
          stats: Json
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          medications?: Json | null
          period?: string
          report_type?: string
          share_key?: string
          stats?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          include_eating: boolean
          include_exercise: boolean
          include_medication: boolean
          include_mood: boolean
          include_sleep: boolean
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          include_eating?: boolean
          include_exercise?: boolean
          include_medication?: boolean
          include_mood?: boolean
          include_sleep?: boolean
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          include_eating?: boolean
          include_exercise?: boolean
          include_medication?: boolean
          include_mood?: boolean
          include_sleep?: boolean
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_doctor_email_for_patient: {
        Args: { p_doctor_id: string; p_patient_id: string }
        Returns: string
      }
      get_doctor_id_by_email: {
        Args: { doctor_email: string }
        Returns: string
      }
      get_doctor_profile_for_patient: {
        Args: { p_doctor_id: string; p_patient_id: string }
        Returns: {
          clinic_name: string
          first_name: string
          hospital_name: string
          last_name: string
        }[]
      }
      get_patient_email_for_doctor: {
        Args: { p_doctor_id: string; p_patient_id: string }
        Returns: string
      }
      get_patient_id_by_email: {
        Args: { patient_email: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor"
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
      app_role: ["patient", "doctor"],
    },
  },
} as const
