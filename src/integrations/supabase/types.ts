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
      action_items: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          id: string
          meeting_id: string
          priority: number | null
          responsible_party: string | null
          status: string | null
          strategy_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          meeting_id: string
          priority?: number | null
          responsible_party?: string | null
          status?: string | null
          strategy_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          meeting_id?: string
          priority?: number | null
          responsible_party?: string | null
          status?: string | null
          strategy_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      client_access_tokens: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          roadmap_id: string
          token: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          roadmap_id: string
          token: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          roadmap_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_access_tokens_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "client_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          category: string | null
          client_id: string
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          uploaded_by_client: boolean
          user_id: string
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          uploaded_by_client?: boolean
          user_id: string
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          uploaded_by_client?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_roadmaps: {
        Row: {
          client_id: string
          created_at: string
          estimated_savings_max: number
          estimated_savings_min: number
          id: string
          phase1_completed: Json | null
          phase1_description: string
          phase1_tasks: Json
          phase1_title: string
          phase2_completed: Json | null
          phase2_description: string
          phase2_tasks: Json
          phase2_title: string
          phase3_completed: Json | null
          phase3_description: string
          phase3_tasks: Json
          phase3_title: string
          phase4_completed: Json | null
          phase4_description: string
          phase4_tasks: Json
          phase4_title: string
          phase5_completed: Json | null
          phase5_description: string
          phase5_tasks: Json
          phase5_title: string
          phase6_completed: Json | null
          phase6_description: string
          phase6_tasks: Json
          phase6_title: string
          service_level: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          estimated_savings_max?: number
          estimated_savings_min?: number
          id?: string
          phase1_completed?: Json | null
          phase1_description?: string
          phase1_tasks?: Json
          phase1_title?: string
          phase2_completed?: Json | null
          phase2_description?: string
          phase2_tasks?: Json
          phase2_title?: string
          phase3_completed?: Json | null
          phase3_description?: string
          phase3_tasks?: Json
          phase3_title?: string
          phase4_completed?: Json | null
          phase4_description?: string
          phase4_tasks?: Json
          phase4_title?: string
          phase5_completed?: Json | null
          phase5_description?: string
          phase5_tasks?: Json
          phase5_title?: string
          phase6_completed?: Json | null
          phase6_description?: string
          phase6_tasks?: Json
          phase6_title?: string
          service_level?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          estimated_savings_max?: number
          estimated_savings_min?: number
          id?: string
          phase1_completed?: Json | null
          phase1_description?: string
          phase1_tasks?: Json
          phase1_title?: string
          phase2_completed?: Json | null
          phase2_description?: string
          phase2_tasks?: Json
          phase2_title?: string
          phase3_completed?: Json | null
          phase3_description?: string
          phase3_tasks?: Json
          phase3_title?: string
          phase4_completed?: Json | null
          phase4_description?: string
          phase4_tasks?: Json
          phase4_title?: string
          phase5_completed?: Json | null
          phase5_description?: string
          phase5_tasks?: Json
          phase5_title?: string
          phase6_completed?: Json | null
          phase6_description?: string
          phase6_tasks?: Json
          phase6_title?: string
          service_level?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_roadmaps_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_roadmaps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "roadmap_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_strategies: {
        Row: {
          calculator_data: Json | null
          client_id: string
          created_at: string
          documentation_complete: boolean | null
          estimated_savings: number | null
          id: string
          notes: string | null
          quarterly_status: Json | null
          status: string
          strategy_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calculator_data?: Json | null
          client_id: string
          created_at?: string
          documentation_complete?: boolean | null
          estimated_savings?: number | null
          id?: string
          notes?: string | null
          quarterly_status?: Json | null
          status?: string
          strategy_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calculator_data?: Json | null
          client_id?: string
          created_at?: string
          documentation_complete?: boolean | null
          estimated_savings?: number | null
          id?: string
          notes?: string | null
          quarterly_status?: Json | null
          status?: string
          strategy_id?: string
          updated_at?: string
          user_id?: string
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
          address: string | null
          annual_income: string | null
          business_type: string | null
          city: string | null
          company_name: string | null
          created_at: string
          ein: string | null
          email: string | null
          entity_name: string | null
          filing_status: string | null
          first_name: string
          fiscal_year_end: string | null
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          service_tier: string | null
          state: string | null
          status: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          annual_income?: string | null
          business_type?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          ein?: string | null
          email?: string | null
          entity_name?: string | null
          filing_status?: string | null
          first_name: string
          fiscal_year_end?: string | null
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          service_tier?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          annual_income?: string | null
          business_type?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          ein?: string | null
          email?: string | null
          entity_name?: string | null
          filing_status?: string | null
          first_name?: string
          fiscal_year_end?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          service_tier?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          client_id: string
          created_at: string
          current_salary: number | null
          federal_estimated_due: number | null
          federal_estimated_paid: number | null
          general_notes: string | null
          id: string
          meeting_date: string
          next_quarter_priorities: string | null
          quarter: number
          recommended_salary: number | null
          retirement_contribution_401k: number | null
          retirement_contribution_cash_balance: number | null
          retirement_contribution_hsa: number | null
          retirement_contribution_profit_sharing: number | null
          state_estimated_due: number | null
          state_estimated_paid: number | null
          tax_year: number
          updated_at: string
          user_id: string
          ytd_cogs: number | null
          ytd_distributions: number | null
          ytd_gross_revenue: number | null
          ytd_net_income: number | null
          ytd_operating_expenses: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          current_salary?: number | null
          federal_estimated_due?: number | null
          federal_estimated_paid?: number | null
          general_notes?: string | null
          id?: string
          meeting_date?: string
          next_quarter_priorities?: string | null
          quarter: number
          recommended_salary?: number | null
          retirement_contribution_401k?: number | null
          retirement_contribution_cash_balance?: number | null
          retirement_contribution_hsa?: number | null
          retirement_contribution_profit_sharing?: number | null
          state_estimated_due?: number | null
          state_estimated_paid?: number | null
          tax_year: number
          updated_at?: string
          user_id: string
          ytd_cogs?: number | null
          ytd_distributions?: number | null
          ytd_gross_revenue?: number | null
          ytd_net_income?: number | null
          ytd_operating_expenses?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          current_salary?: number | null
          federal_estimated_due?: number | null
          federal_estimated_paid?: number | null
          general_notes?: string | null
          id?: string
          meeting_date?: string
          next_quarter_priorities?: string | null
          quarter?: number
          recommended_salary?: number | null
          retirement_contribution_401k?: number | null
          retirement_contribution_cash_balance?: number | null
          retirement_contribution_hsa?: number | null
          retirement_contribution_profit_sharing?: number | null
          state_estimated_due?: number | null
          state_estimated_paid?: number | null
          tax_year?: number
          updated_at?: string
          user_id?: string
          ytd_cogs?: number | null
          ytd_distributions?: number | null
          ytd_gross_revenue?: number | null
          ytd_net_income?: number | null
          ytd_operating_expenses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_status: {
        Row: {
          client_id: string
          created_at: string
          id: string
          phase: number
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          phase: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          phase?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_status_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      roadmap_templates: {
        Row: {
          created_at: string
          description: string | null
          estimated_savings_max: number
          estimated_savings_min: number
          id: string
          name: string
          phase1_description: string
          phase1_tasks: Json
          phase1_title: string
          phase2_description: string
          phase2_tasks: Json
          phase2_title: string
          phase3_description: string
          phase3_tasks: Json
          phase3_title: string
          phase4_description: string
          phase4_tasks: Json
          phase4_title: string
          phase5_description: string
          phase5_tasks: Json
          phase5_title: string
          phase6_description: string
          phase6_tasks: Json
          phase6_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_savings_max?: number
          estimated_savings_min?: number
          id?: string
          name: string
          phase1_description?: string
          phase1_tasks?: Json
          phase1_title?: string
          phase2_description?: string
          phase2_tasks?: Json
          phase2_title?: string
          phase3_description?: string
          phase3_tasks?: Json
          phase3_title?: string
          phase4_description?: string
          phase4_tasks?: Json
          phase4_title?: string
          phase5_description?: string
          phase5_tasks?: Json
          phase5_title?: string
          phase6_description?: string
          phase6_tasks?: Json
          phase6_title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_savings_max?: number
          estimated_savings_min?: number
          id?: string
          name?: string
          phase1_description?: string
          phase1_tasks?: Json
          phase1_title?: string
          phase2_description?: string
          phase2_tasks?: Json
          phase2_title?: string
          phase3_description?: string
          phase3_tasks?: Json
          phase3_title?: string
          phase4_description?: string
          phase4_tasks?: Json
          phase4_title?: string
          phase5_description?: string
          phase5_tasks?: Json
          phase5_title?: string
          phase6_description?: string
          phase6_tasks?: Json
          phase6_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          calculator_type: string | null
          category: string
          created_at: string
          description: string | null
          has_calculator: boolean | null
          id: string
          name: string
          phase: number
          strategy_number: number
        }
        Insert: {
          calculator_type?: string | null
          category: string
          created_at?: string
          description?: string | null
          has_calculator?: boolean | null
          id?: string
          name: string
          phase: number
          strategy_number: number
        }
        Update: {
          calculator_type?: string | null
          category?: string
          created_at?: string
          description?: string | null
          has_calculator?: boolean | null
          id?: string
          name?: string
          phase?: number
          strategy_number?: number
        }
        Relationships: []
      }
      strategy_tracking: {
        Row: {
          created_at: string
          doc1_complete: boolean | null
          doc2_complete: boolean | null
          doc3_complete: boolean | null
          estimated_savings: number | null
          id: string
          meeting_id: string
          notes: string | null
          q1_active: boolean | null
          q2_active: boolean | null
          q3_active: boolean | null
          q4_active: boolean | null
          strategy_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc1_complete?: boolean | null
          doc2_complete?: boolean | null
          doc3_complete?: boolean | null
          estimated_savings?: number | null
          id?: string
          meeting_id: string
          notes?: string | null
          q1_active?: boolean | null
          q2_active?: boolean | null
          q3_active?: boolean | null
          q4_active?: boolean | null
          strategy_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc1_complete?: boolean | null
          doc2_complete?: boolean | null
          doc3_complete?: boolean | null
          estimated_savings?: number | null
          id?: string
          meeting_id?: string
          notes?: string | null
          q1_active?: boolean | null
          q2_active?: boolean | null
          q3_active?: boolean | null
          q4_active?: boolean | null
          strategy_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_tracking_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
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
