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
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner: string
          review_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner: string
          review_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "quarterly_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          adjustments: Json | null
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          pl_data: Json | null
          raw_matches: Json | null
          report_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustments?: Json | null
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pl_data?: Json | null
          raw_matches?: Json | null
          report_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustments?: Json | null
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pl_data?: Json | null
          raw_matches?: Json | null
          report_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_account_defaults: {
        Row: {
          account_name: string
          client_id: string
          created_at: string
          id: string
          pf_category: string
          updated_at: string
        }
        Insert: {
          account_name: string
          client_id: string
          created_at?: string
          id?: string
          pf_category: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          client_id?: string
          created_at?: string
          id?: string
          pf_category?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_account_defaults_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding: {
        Row: {
          client_id: string
          completed_date: string | null
          created_at: string
          due_date: string | null
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
          due_date?: string | null
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
          due_date?: string | null
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
          document_statuses: Json | null
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
          document_statuses?: Json | null
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
          document_statuses?: Json | null
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
          address: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          created_at: string
          email: string | null
          entity_type: string
          first_name: string | null
          id: string
          income_range: string | null
          industry: string | null
          last_name: string | null
          name: string
          next_review_date: string | null
          next_steps: Json | null
          notes: string | null
          package_tier: string
          phase_status: Json | null
          phone: string | null
          tax_rate: number | null
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string
          first_name?: string | null
          id?: string
          income_range?: string | null
          industry?: string | null
          last_name?: string | null
          name: string
          next_review_date?: string | null
          next_steps?: Json | null
          notes?: string | null
          package_tier?: string
          phase_status?: Json | null
          phone?: string | null
          tax_rate?: number | null
          user_id: string
        }
        Update: {
          address?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string
          first_name?: string | null
          id?: string
          income_range?: string | null
          industry?: string | null
          last_name?: string | null
          name?: string
          next_review_date?: string | null
          next_steps?: Json | null
          notes?: string | null
          package_tier?: string
          phase_status?: Json | null
          phone?: string | null
          tax_rate?: number | null
          user_id?: string
        }
        Relationships: []
      }
      custom_benchmarks: {
        Row: {
          category: string | null
          created_at: string
          id: string
          ideal_pct: number | null
          industry: string | null
          max_pct: number | null
          min_pct: number | null
          notes: string | null
          revenue_tier: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          ideal_pct?: number | null
          industry?: string | null
          max_pct?: number | null
          min_pct?: number | null
          notes?: string | null
          revenue_tier?: string | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          ideal_pct?: number | null
          industry?: string | null
          max_pct?: number | null
          min_pct?: number | null
          notes?: string | null
          revenue_tier?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_mappings: {
        Row: {
          account_label: string | null
          category: string | null
          created_at: string
          id: string
          pf_category: string | null
          user_id: string
        }
        Insert: {
          account_label?: string | null
          category?: string | null
          created_at?: string
          id?: string
          pf_category?: string | null
          user_id: string
        }
        Update: {
          account_label?: string | null
          category?: string | null
          created_at?: string
          id?: string
          pf_category?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_tax_line_mappings: {
        Row: {
          account_label: string | null
          created_at: string
          form_number: string | null
          id: string
          tax_line_key: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          account_label?: string | null
          created_at?: string
          form_number?: string | null
          id?: string
          tax_line_key?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          account_label?: string | null
          created_at?: string
          form_number?: string | null
          id?: string
          tax_line_key?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      industry_benchmarks: {
        Row: {
          display_name: string
          id: string
          industry: string
          notes: string | null
          opex_target: number
          owner_pay_target: number
          profit_target: number
          tax_target: number
        }
        Insert: {
          display_name: string
          id?: string
          industry: string
          notes?: string | null
          opex_target: number
          owner_pay_target: number
          profit_target: number
          tax_target: number
        }
        Update: {
          display_name?: string
          id?: string
          industry?: string
          notes?: string | null
          opex_target?: number
          owner_pay_target?: number
          profit_target?: number
          tax_target?: number
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
      pf_assessments: {
        Row: {
          actual_opex: number | null
          actual_owner_pay: number | null
          actual_profit: number | null
          actual_tax: number | null
          assessment_date: string | null
          client_id: string | null
          created_at: string
          health_score: number | null
          id: string
          materials_subs: number | null
          notes: string | null
          period_end: string | null
          period_start: string | null
          real_revenue: number | null
          revenue_tier: string | null
          source_analysis_id: string | null
          target_opex: number | null
          target_owner_pay: number | null
          target_profit: number | null
          target_tax: number | null
          total_revenue: number | null
          updated_at: string
          user_id: string
          variance_opex: number | null
          variance_owner_pay: number | null
          variance_profit: number | null
          variance_tax: number | null
        }
        Insert: {
          actual_opex?: number | null
          actual_owner_pay?: number | null
          actual_profit?: number | null
          actual_tax?: number | null
          assessment_date?: string | null
          client_id?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          materials_subs?: number | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          real_revenue?: number | null
          revenue_tier?: string | null
          source_analysis_id?: string | null
          target_opex?: number | null
          target_owner_pay?: number | null
          target_profit?: number | null
          target_tax?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id: string
          variance_opex?: number | null
          variance_owner_pay?: number | null
          variance_profit?: number | null
          variance_tax?: number | null
        }
        Update: {
          actual_opex?: number | null
          actual_owner_pay?: number | null
          actual_profit?: number | null
          actual_tax?: number | null
          assessment_date?: string | null
          client_id?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          materials_subs?: number | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          real_revenue?: number | null
          revenue_tier?: string | null
          source_analysis_id?: string | null
          target_opex?: number | null
          target_owner_pay?: number | null
          target_profit?: number | null
          target_tax?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id?: string
          variance_opex?: number | null
          variance_owner_pay?: number | null
          variance_profit?: number | null
          variance_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pf_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pf_category_defaults: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          keyword: string
          pf_category: string
          pl_category: string | null
          priority: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          keyword: string
          pf_category: string
          pl_category?: string | null
          priority?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          keyword?: string
          pf_category?: string
          pl_category?: string | null
          priority?: number | null
        }
        Relationships: []
      }
      pf_taps: {
        Row: {
          id: string
          opex_pct: number | null
          owner_pay_pct: number | null
          profit_pct: number | null
          revenue_max: number | null
          revenue_min: number | null
          tax_pct: number | null
          tier_name: string | null
        }
        Insert: {
          id?: string
          opex_pct?: number | null
          owner_pay_pct?: number | null
          profit_pct?: number | null
          revenue_max?: number | null
          revenue_min?: number | null
          tax_pct?: number | null
          tier_name?: string | null
        }
        Update: {
          id?: string
          opex_pct?: number | null
          owner_pay_pct?: number | null
          profit_pct?: number | null
          revenue_max?: number | null
          revenue_min?: number | null
          tax_pct?: number | null
          tier_name?: string | null
        }
        Relationships: []
      }
      pl_analyses: {
        Row: {
          client_id: string | null
          cogs: number | null
          created_at: string
          gross_profit: number | null
          id: string
          net_income: number | null
          notes: string | null
          pl_data: Json | null
          revenue: number | null
          statement_year: number | null
          total_expenses: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          cogs?: number | null
          created_at?: string
          gross_profit?: number | null
          id?: string
          net_income?: number | null
          notes?: string | null
          pl_data?: Json | null
          revenue?: number | null
          statement_year?: number | null
          total_expenses?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          cogs?: number | null
          created_at?: string
          gross_profit?: number | null
          id?: string
          net_income?: number | null
          notes?: string | null
          pl_data?: Json | null
          revenue?: number | null
          statement_year?: number | null
          total_expenses?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pl_analyses_client_id_fkey"
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
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          title?: string | null
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
          cogs: number | null
          compliance_books: boolean | null
          compliance_estimates: boolean | null
          compliance_notes: string | null
          compliance_payroll: boolean | null
          created_at: string
          draw_goal: number | null
          draw_ytd: number | null
          employee_count: number | null
          employees_current: number | null
          employees_goal: number | null
          hurdle_1: string | null
          hurdle_2: string | null
          hurdle_3: string | null
          id: string
          meeting_date: string | null
          next_meeting_date: string | null
          next_meeting_time: string | null
          pnl_month_count: number | null
          pnl_month_count_detected: number | null
          profit_first_opex_target: number | null
          profit_first_owner_target: number | null
          profit_first_profit_target: number | null
          profit_first_tax_target: number | null
          profit_goal: number | null
          profit_ytd: number | null
          quarter: string
          revenue_goal: number | null
          revenue_ytd: number | null
          status: string
          tax_rate_override: number | null
          tax_ytd: number | null
          total_expenses: number | null
          updated_at: string
        }
        Insert: {
          advisor_name?: string | null
          advisor_signature?: boolean | null
          client_id: string
          client_signature?: boolean | null
          cogs?: number | null
          compliance_books?: boolean | null
          compliance_estimates?: boolean | null
          compliance_notes?: string | null
          compliance_payroll?: boolean | null
          created_at?: string
          draw_goal?: number | null
          draw_ytd?: number | null
          employee_count?: number | null
          employees_current?: number | null
          employees_goal?: number | null
          hurdle_1?: string | null
          hurdle_2?: string | null
          hurdle_3?: string | null
          id?: string
          meeting_date?: string | null
          next_meeting_date?: string | null
          next_meeting_time?: string | null
          pnl_month_count?: number | null
          pnl_month_count_detected?: number | null
          profit_first_opex_target?: number | null
          profit_first_owner_target?: number | null
          profit_first_profit_target?: number | null
          profit_first_tax_target?: number | null
          profit_goal?: number | null
          profit_ytd?: number | null
          quarter: string
          revenue_goal?: number | null
          revenue_ytd?: number | null
          status?: string
          tax_rate_override?: number | null
          tax_ytd?: number | null
          total_expenses?: number | null
          updated_at?: string
        }
        Update: {
          advisor_name?: string | null
          advisor_signature?: boolean | null
          client_id?: string
          client_signature?: boolean | null
          cogs?: number | null
          compliance_books?: boolean | null
          compliance_estimates?: boolean | null
          compliance_notes?: string | null
          compliance_payroll?: boolean | null
          created_at?: string
          draw_goal?: number | null
          draw_ytd?: number | null
          employee_count?: number | null
          employees_current?: number | null
          employees_goal?: number | null
          hurdle_1?: string | null
          hurdle_2?: string | null
          hurdle_3?: string | null
          id?: string
          meeting_date?: string | null
          next_meeting_date?: string | null
          next_meeting_time?: string | null
          pnl_month_count?: number | null
          pnl_month_count_detected?: number | null
          profit_first_opex_target?: number | null
          profit_first_owner_target?: number | null
          profit_first_profit_target?: number | null
          profit_first_tax_target?: number | null
          profit_goal?: number | null
          profit_ytd?: number | null
          quarter?: string
          revenue_goal?: number | null
          revenue_ytd?: number | null
          status?: string
          tax_rate_override?: number | null
          tax_ytd?: number | null
          total_expenses?: number | null
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
      reasonable_comp_files: {
        Row: {
          annual_revenue: string | null
          business_name: string | null
          certifications: string | null
          client_id: string | null
          comp_data_sources: Json | null
          created_at: string
          current_benefits: number | null
          current_bonus: number | null
          current_other: number | null
          current_retirement: number | null
          current_salary: number | null
          date_incorporated: string | null
          defense_notes: string | null
          education: string | null
          ein: string | null
          entity_type: string | null
          fiscal_year_end: string | null
          id: string
          industry: string | null
          industry_naics: string | null
          number_of_employees: string | null
          officer_name: string | null
          officer_title: string | null
          ownership_percentage: number | null
          prior_positions: string | null
          salary_high: number | null
          salary_low: number | null
          salary_mid: number | null
          state_of_incorporation: string | null
          status: string | null
          time_allocation: Json | null
          unique_skills: string | null
          updated_at: string
          user_id: string
          years_in_industry: string | null
          years_with_company: string | null
        }
        Insert: {
          annual_revenue?: string | null
          business_name?: string | null
          certifications?: string | null
          client_id?: string | null
          comp_data_sources?: Json | null
          created_at?: string
          current_benefits?: number | null
          current_bonus?: number | null
          current_other?: number | null
          current_retirement?: number | null
          current_salary?: number | null
          date_incorporated?: string | null
          defense_notes?: string | null
          education?: string | null
          ein?: string | null
          entity_type?: string | null
          fiscal_year_end?: string | null
          id?: string
          industry?: string | null
          industry_naics?: string | null
          number_of_employees?: string | null
          officer_name?: string | null
          officer_title?: string | null
          ownership_percentage?: number | null
          prior_positions?: string | null
          salary_high?: number | null
          salary_low?: number | null
          salary_mid?: number | null
          state_of_incorporation?: string | null
          status?: string | null
          time_allocation?: Json | null
          unique_skills?: string | null
          updated_at?: string
          user_id: string
          years_in_industry?: string | null
          years_with_company?: string | null
        }
        Update: {
          annual_revenue?: string | null
          business_name?: string | null
          certifications?: string | null
          client_id?: string | null
          comp_data_sources?: Json | null
          created_at?: string
          current_benefits?: number | null
          current_bonus?: number | null
          current_other?: number | null
          current_retirement?: number | null
          current_salary?: number | null
          date_incorporated?: string | null
          defense_notes?: string | null
          education?: string | null
          ein?: string | null
          entity_type?: string | null
          fiscal_year_end?: string | null
          id?: string
          industry?: string | null
          industry_naics?: string | null
          number_of_employees?: string | null
          officer_name?: string | null
          officer_title?: string | null
          ownership_percentage?: number | null
          prior_positions?: string | null
          salary_high?: number | null
          salary_low?: number | null
          salary_mid?: number | null
          state_of_incorporation?: string | null
          status?: string | null
          time_allocation?: Json | null
          unique_skills?: string | null
          updated_at?: string
          user_id?: string
          years_in_industry?: string | null
          years_with_company?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reasonable_comp_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      review_account_mappings: {
        Row: {
          account_name: string
          amount: number
          created_at: string
          id: string
          parent_account: string | null
          pf_category: string
          review_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_name: string
          amount?: number
          created_at?: string
          id?: string
          parent_account?: string | null
          pf_category: string
          review_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_name?: string
          amount?: number
          created_at?: string
          id?: string
          parent_account?: string | null
          pf_category?: string
          review_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_account_mappings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "quarterly_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          client_overview: string | null
          created_at: string | null
          description: string | null
          documents: Json | null
          forms_required: string | null
          id: number
          implementation: string | null
          irc_citation: string | null
          irc_sections: string | null
          irs_scrutiny: boolean | null
          name: string
          parent_strategy: number | null
          phase: string
          phase_name: string
          risk_level: string | null
          savings_high: number | null
          savings_low: number | null
          strategy_number: string | null
          tier: string | null
          tool_name: string | null
          tool_url: string | null
          typical_savings_high: number | null
          typical_savings_low: number | null
          updated_at: string | null
          what_it_is: string | null
        }
        Insert: {
          client_overview?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          forms_required?: string | null
          id: number
          implementation?: string | null
          irc_citation?: string | null
          irc_sections?: string | null
          irs_scrutiny?: boolean | null
          name: string
          parent_strategy?: number | null
          phase: string
          phase_name: string
          risk_level?: string | null
          savings_high?: number | null
          savings_low?: number | null
          strategy_number?: string | null
          tier?: string | null
          tool_name?: string | null
          tool_url?: string | null
          typical_savings_high?: number | null
          typical_savings_low?: number | null
          updated_at?: string | null
          what_it_is?: string | null
        }
        Update: {
          client_overview?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          forms_required?: string | null
          id?: number
          implementation?: string | null
          irc_citation?: string | null
          irc_sections?: string | null
          irs_scrutiny?: boolean | null
          name?: string
          parent_strategy?: number | null
          phase?: string
          phase_name?: string
          risk_level?: string | null
          savings_high?: number | null
          savings_low?: number | null
          strategy_number?: string | null
          tier?: string | null
          tool_name?: string | null
          tool_url?: string | null
          typical_savings_high?: number | null
          typical_savings_low?: number | null
          updated_at?: string | null
          what_it_is?: string | null
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
