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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      client_onboarding: {
        Row: {
          client_id: string
          completed_date: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          task_id: number
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          task_id: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          task_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      client_strategies: {
        Row: {
          client_id: string
          deduction_amount: number | null
          id: string
          implemented_date: string | null
          notes: string | null
          review_id: string | null
          status: string
          strategy_id: number
          tax_savings: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          deduction_amount?: number | null
          id?: string
          implemented_date?: string | null
          notes?: string | null
          review_id?: string | null
          status?: string
          strategy_id: number
          tax_savings?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          deduction_amount?: number | null
          id?: string
          implemented_date?: string | null
          notes?: string | null
          review_id?: string | null
          status?: string
          strategy_id?: number
          tax_savings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_strategies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_strategies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "quarterly_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          income_range: string | null
          name: string
          next_review_date: string | null
          notes: string | null
          package_tier: string
          phase_status: Json | null
          tax_rate: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_type?: string
          id?: string
          income_range?: string | null
          name: string
          next_review_date?: string | null
          notes?: string | null
          package_tier?: string
          phase_status?: Json | null
          tax_rate?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          income_range?: string | null
          name?: string
          next_review_date?: string | null
          notes?: string | null
          package_tier?: string
          phase_status?: Json | null
          tax_rate?: number | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          default_deadline_days: number
          description: string | null
          id: number
          owner: string
          phase: string
          sort_order: number
          strategy_ref: string | null
          task_name: string
        }
        Insert: {
          default_deadline_days?: number
          description?: string | null
          id?: number
          owner?: string
          phase: string
          sort_order?: number
          strategy_ref?: string | null
          task_name: string
        }
        Update: {
          default_deadline_days?: number
          description?: string | null
          id?: number
          owner?: string
          phase?: string
          sort_order?: number
          strategy_ref?: string | null
          task_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quarterly_reviews: {
        Row: {
          advisor_name: string | null
          advisor_signature: boolean | null
          client_id: string
          client_signature: boolean | null
          compliance_books: boolean | null
          compliance_estimates: boolean | null
          compliance_notes: string | null
          compliance_payroll: boolean | null
          created_at: string
          draw_goal: number | null
          draw_ytd: number | null
          employees_current: number | null
          employees_goal: number | null
          hurdle_1: string | null
          hurdle_2: string | null
          hurdle_3: string | null
          id: string
          meeting_date: string | null
          next_meeting_date: string | null
          next_meeting_time: string | null
          profit_goal: number | null
          profit_ytd: number | null
          quarter: string
          revenue_goal: number | null
          revenue_ytd: number | null
          status: string
          tax_rate_override: number | null
          updated_at: string
        }
        Insert: {
          advisor_name?: string | null
          advisor_signature?: boolean | null
          client_id: string
          client_signature?: boolean | null
          compliance_books?: boolean | null
          compliance_estimates?: boolean | null
          compliance_notes?: string | null
          compliance_payroll?: boolean | null
          created_at?: string
          draw_goal?: number | null
          draw_ytd?: number | null
          employees_current?: number | null
          employees_goal?: number | null
          hurdle_1?: string | null
          hurdle_2?: string | null
          hurdle_3?: string | null
          id?: string
          meeting_date?: string | null
          next_meeting_date?: string | null
          next_meeting_time?: string | null
          profit_goal?: number | null
          profit_ytd?: number | null
          quarter: string
          revenue_goal?: number | null
          revenue_ytd?: number | null
          status?: string
          tax_rate_override?: number | null
          updated_at?: string
        }
        Update: {
          advisor_name?: string | null
          advisor_signature?: boolean | null
          client_id?: string
          client_signature?: boolean | null
          compliance_books?: boolean | null
          compliance_estimates?: boolean | null
          compliance_notes?: string | null
          compliance_payroll?: boolean | null
          created_at?: string
          draw_goal?: number | null
          draw_ytd?: number | null
          employees_current?: number | null
          employees_goal?: number | null
          hurdle_1?: string | null
          hurdle_2?: string | null
          hurdle_3?: string | null
          id?: string
          meeting_date?: string | null
          next_meeting_date?: string | null
          next_meeting_time?: string | null
          profit_goal?: number | null
          profit_ytd?: number | null
          quarter?: string
          revenue_goal?: number | null
          revenue_ytd?: number | null
          status?: string
          tax_rate_override?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          description: string | null
          id: number
          irc_citation: string | null
          name: string
          phase: string
          phase_name: string
          typical_savings_high: number | null
          typical_savings_low: number | null
        }
        Insert: {
          description?: string | null
          id: number
          irc_citation?: string | null
          name: string
          phase: string
          phase_name: string
          typical_savings_high?: number | null
          typical_savings_low?: number | null
        }
        Update: {
          description?: string | null
          id?: number
          irc_citation?: string | null
          name?: string
          phase?: string
          phase_name?: string
          typical_savings_high?: number | null
          typical_savings_low?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_client_token: {
        Args: { p_token: string }
        Returns: {
          client_id: string
          is_valid: boolean
          roadmap_id: string
        }[]
      }
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
