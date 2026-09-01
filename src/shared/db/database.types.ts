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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          position_id: string
          start_date: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          position_id: string
          start_date: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          position_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          document_number: string
          id: string
          legal_name: string
          organization_id: string
          status: string
          trade_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number: string
          id?: string
          legal_name: string
          organization_id: string
          status?: string
          trade_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string
          id?: string
          legal_name?: string
          organization_id?: string
          status?: string
          trade_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          external_reference: string | null
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          external_reference?: string | null
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          external_reference?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          contract_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          manager_user_id: string | null
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_user_id?: string | null
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          manager_user_id?: string | null
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          profile_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          profile_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          profile_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          legal_name: string
          status: string
          trade_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          legal_name: string
          status?: string
          trade_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string
          status?: string
          trade_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          base_required_headcount: number
          created_at: string
          description: string | null
          id: string
          job_role_id: string
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          base_required_headcount?: number
          created_at?: string
          description?: string | null
          id?: string
          job_role_id: string
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          base_required_headcount?: number
          created_at?: string
          description?: string | null
          id?: string
          job_role_id?: string
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string
          id: string
          name: string
          operation_id: string
          state: string | null
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
          operation_id: string
          state?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          operation_id?: string
          state?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string
          document_number: string
          email: string | null
          engagement_end_date: string | null
          engagement_start_date: string | null
          full_name: string
          id: string
          organization_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number: string
          email?: string | null
          engagement_end_date?: string | null
          engagement_start_date?: string | null
          full_name: string
          id?: string
          organization_id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string
          email?: string | null
          engagement_end_date?: string | null
          engagement_start_date?: string | null
          full_name?: string
          id?: string
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_audit_metadata: {
        Args: {
          new_row: Json
          previous_row: Json
          tracked_fields: string[]
          visible_state_fields?: string[]
        }
        Returns: Json
      }
      change_organization_membership_with_audit: {
        Args: {
          organization_id: string
          target_profile_id: string
          target_role: string
          target_status: string
        }
        Returns: {
          created_at: string
          organization_id: string
          profile_id: string
          role: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_active_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      mutate_assignment_with_audit: {
        Args: {
          end_date?: string
          entity_id?: string
          operation: string
          position_id?: string
          start_date?: string
          target_status?: string
          worker_id?: string
        }
        Returns: {
          created_at: string
          end_date: string | null
          id: string
          position_id: string
          start_date: string
          status: string
          updated_at: string
          worker_id: string
        }
        SetofOptions: {
          from: "*"
          to: "assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_client_with_audit: {
        Args: {
          document_number?: string
          entity_id?: string
          legal_name?: string
          operation: string
          organization_id?: string
          target_status?: string
          trade_name?: string
        }
        Returns: {
          created_at: string
          document_number: string
          id: string
          legal_name: string
          organization_id: string
          status: string
          trade_name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_contract_with_audit: {
        Args: {
          client_id?: string
          end_date?: string
          entity_id?: string
          external_reference?: string
          name?: string
          operation: string
          start_date?: string
          target_status?: string
        }
        Returns: {
          client_id: string
          created_at: string
          end_date: string | null
          external_reference: string | null
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_operation_with_audit: {
        Args: {
          contract_id?: string
          description?: string
          end_date?: string
          entity_id?: string
          manager_user_id?: string
          name?: string
          operation: string
          start_date?: string
          target_status?: string
        }
        Returns: {
          contract_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          manager_user_id: string | null
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "operations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_job_role_with_audit: {
        Args: {
          description?: string
          entity_id?: string
          name?: string
          operation: string
          organization_id?: string
          target_status?: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "job_roles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_position_with_audit: {
        Args: {
          base_required_headcount?: number
          description?: string
          entity_id?: string
          job_role_id?: string
          operation: string
          target_status?: string
          unit_id?: string
        }
        Returns: {
          base_required_headcount: number
          created_at: string
          description: string | null
          id: string
          job_role_id: string
          status: string
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "positions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_unit_with_audit: {
        Args: {
          address?: string
          city?: string
          code?: string
          entity_id?: string
          name?: string
          operation: string
          operation_id?: string
          state?: string
          target_status?: string
          timezone?: string
        }
        Returns: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string
          id: string
          name: string
          operation_id: string
          state: string | null
          status: string
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "units"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mutate_worker_with_audit: {
        Args: {
          document_number?: string
          email?: string
          engagement_end_date?: string
          engagement_start_date?: string
          entity_id?: string
          full_name?: string
          operation: string
          organization_id?: string
          phone?: string
          target_status?: string
        }
        Returns: {
          created_at: string
          document_number: string
          email: string | null
          engagement_end_date: string | null
          engagement_start_date: string | null
          full_name: string
          id: string
          organization_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "workers"
          isOneToOne: true
          isSetofReturn: false
        }
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
