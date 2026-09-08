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
      absences: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          reason: string
          reported_at: string
          reported_by: string
          schedule_entry_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          reason: string
          reported_at?: string
          reported_by: string
          schedule_entry_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          reason?: string
          reported_at?: string
          reported_by?: string
          schedule_entry_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_schedule_entry_id_fkey"
            columns: ["schedule_entry_id"]
            isOneToOne: false
            referencedRelation: "schedule_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      presences: {
        Row: {
          actual_assignment_id: string
          arrived_at: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          completed_by: string | null
          corrected_at: string | null
          corrected_by: string | null
          correction_reason: string | null
          created_at: string
          created_by: string
          departed_at: string | null
          id: string
          organization_id: string
          replacement_id: string | null
          schedule_entry_id: string
          source: string
          source_reference: string | null
          status: string
        }
        Insert: {
          actual_assignment_id: string
          arrived_at: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string
          created_by: string
          departed_at?: string | null
          id?: string
          organization_id: string
          replacement_id?: string | null
          schedule_entry_id: string
          source: string
          source_reference?: string | null
          status?: string
        }
        Update: {
          actual_assignment_id?: string
          arrived_at?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string
          created_by?: string
          departed_at?: string | null
          id?: string
          organization_id?: string
          replacement_id?: string | null
          schedule_entry_id?: string
          source?: string
          source_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "presences_actual_assignment_id_fkey"
            columns: ["actual_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_corrected_by_fkey"
            columns: ["corrected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_replacement_id_fkey"
            columns: ["replacement_id"]
            isOneToOne: false
            referencedRelation: "replacements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_schedule_entry_id_fkey"
            columns: ["schedule_entry_id"]
            isOneToOne: false
            referencedRelation: "schedule_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      replacements: {
        Row: {
          absence_id: string
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          replacement_assignment_id: string
          status: string
        }
        Insert: {
          absence_id: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          replacement_assignment_id: string
          status?: string
        }
        Update: {
          absence_id?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          replacement_assignment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "replacements_absence_id_fkey"
            columns: ["absence_id"]
            isOneToOne: false
            referencedRelation: "absences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacements_replacement_assignment_id_fkey"
            columns: ["replacement_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      schedule_entries: {
        Row: {
          assignment_id: string
          break_ends_at: string | null
          break_starts_at: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          schedule_revision_id: string
          starts_at: string
        }
        Insert: {
          assignment_id: string
          break_ends_at?: string | null
          break_starts_at?: string | null
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          schedule_revision_id: string
          starts_at: string
        }
        Update: {
          assignment_id?: string
          break_ends_at?: string | null
          break_starts_at?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          schedule_revision_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_schedule_revision_id_fkey"
            columns: ["schedule_revision_id"]
            isOneToOne: false
            referencedRelation: "schedule_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_revisions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          based_on_revision_id: string | null
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          published_by: string | null
          schedule_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          based_on_revision_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          schedule_id: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          version: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          based_on_revision_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          schedule_id?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_revisions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_revisions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_revisions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_revisions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string
          id: string
          operation_id: string
          organization_id: string
          period_end: string
          period_start: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          operation_id: string
          organization_id: string
          period_end: string
          period_start: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          operation_id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      cancel_presence: {
        Args: {
          idempotency_key: string
          organization_id: string
          presence_id: string
          reason: string
          source?: string
          source_reference?: string | null
        }
        Returns: Database["public"]["Tables"]["presences"]["Row"]
        SetofOptions: {
          from: "*"
          to: "presences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_absence: {
        Args: { absence_id: string; organization_id: string }
        Returns: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          reason: string
          reported_at: string
          reported_by: string
          schedule_entry_id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "absences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_replacement: {
        Args: { organization_id: string; replacement_id: string }
        Returns: {
          absence_id: string
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          replacement_assignment_id: string
          status: string
        }
        SetofOptions: { from: "*"; to: "replacements"; isOneToOne: true; isSetofReturn: false }
      }
      create_absence: {
        Args: {
          notes?: string | null
          organization_id: string
          reason: string
          schedule_entry_id: string
        }
        Returns: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          reason: string
          reported_at: string
          reported_by: string
          schedule_entry_id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "absences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_replacement: {
        Args: { absence_id: string; assignment_id: string; organization_id: string }
        Returns: {
          absence_id: string
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          replacement_assignment_id: string
          status: string
        }
        SetofOptions: { from: "*"; to: "replacements"; isOneToOne: true; isSetofReturn: false }
      }
      complete_presence: {
        Args: {
          departed_at: string
          idempotency_key: string
          organization_id: string
          presence_id: string
          source?: string
          source_reference?: string | null
        }
        Returns: Database["public"]["Tables"]["presences"]["Row"]
        SetofOptions: {
          from: "*"
          to: "presences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      correct_presence: {
        Args: {
          arrived_at: string
          departed_at: string | null
          idempotency_key: string
          organization_id: string
          presence_id: string
          reason: string
          source?: string
          source_reference?: string | null
        }
        Returns: Database["public"]["Tables"]["presences"]["Row"]
        SetofOptions: {
          from: "*"
          to: "presences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_replacement_candidates: {
        Args: { absence_id: string; organization_id: string }
        Returns: {
          assignment_id: string
          worker_full_name: string
          worker_id: string
        }[]
      }
      list_uncovered_absence_ids: {
        Args: {
          client_id?: string | null
          contract_id?: string | null
          organization_id: string
          result_limit?: number | null
        }
        Returns: {
          absence_id: string
          starts_at: string
        }[]
      }
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
      has_organization_permission: {
        Args: {
          required_permission: string
          target_organization_id: string
        }
        Returns: boolean
      }
      approve_schedule_revision: {
        Args: { schedule_revision_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          based_on_revision_id: string | null
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          published_by: string | null
          schedule_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "schedule_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_schedule: {
        Args: {
          operation_id: string
          organization_id: string
          period_end: string
          period_start: string
        }
        Returns: {
          created_at: string
          created_by: string
          id: string
          operation_id: string
          organization_id: string
          period_end: string
          period_start: string
        }
        SetofOptions: {
          from: "*"
          to: "schedules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_schedule_entry: {
        Args: {
          assignment_id: string
          break_ends_at?: string | null
          break_starts_at?: string | null
          ends_at: string
          schedule_revision_id: string
          starts_at: string
        }
        Returns: {
          assignment_id: string
          break_ends_at: string | null
          break_starts_at: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          schedule_revision_id: string
          starts_at: string
        }
        SetofOptions: {
          from: "*"
          to: "schedule_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_schedule_revision_from_published: {
        Args: { schedule_revision_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          based_on_revision_id: string | null
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          published_by: string | null
          schedule_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "schedule_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_schedule_entry: {
        Args: { entry_id: string }
        Returns: {
          assignment_id: string
          break_ends_at: string | null
          break_starts_at: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          schedule_revision_id: string
          starts_at: string
        }
        SetofOptions: {
          from: "*"
          to: "schedule_entries"
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
      publish_schedule_revision: {
        Args: { schedule_revision_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          based_on_revision_id: string | null
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          published_by: string | null
          schedule_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "schedule_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      return_schedule_revision_to_draft: {
        Args: { schedule_revision_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          based_on_revision_id: string | null
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          published_by: string | null
          schedule_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "schedule_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_schedule_revision: {
        Args: { schedule_revision_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          based_on_revision_id: string | null
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          published_by: string | null
          schedule_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "schedule_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_presence: {
        Args: {
          arrived_at: string
          idempotency_key: string
          organization_id: string
          schedule_entry_id: string
          source?: string
          source_reference?: string | null
        }
        Returns: Database["public"]["Tables"]["presences"]["Row"]
        SetofOptions: {
          from: "*"
          to: "presences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_schedule_entry: {
        Args: {
          assignment_id: string
          break_ends_at?: string | null
          break_starts_at?: string | null
          ends_at: string
          entry_id: string
          starts_at: string
        }
        Returns: {
          assignment_id: string
          break_ends_at: string | null
          break_starts_at: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          schedule_revision_id: string
          starts_at: string
        }
        SetofOptions: {
          from: "*"
          to: "schedule_entries"
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
