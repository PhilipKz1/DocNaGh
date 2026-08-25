/**
 * Placeholder hand types matching supabase/migrations/0001_init.sql.
 * Replace with generated types once the project is linked:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 */
export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinics"]["Insert"]>;
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          clinic_id: string;
          user_id: string;
          full_name: string;
          email: string;
          role: "admin" | "staff";
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          user_id: string;
          full_name: string;
          email: string;
          role?: "admin" | "staff";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["providers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "providers_clinic_id_fkey";
            columns: ["clinic_id"];
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          id: string;
          clinic_id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey";
            columns: ["clinic_id"];
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };
      requests: {
        Row: {
          id: string;
          clinic_id: string;
          provider_id: string;
          patient_id: string | null;
          patient_display_name: string;
          status: "pending" | "partially_received" | "complete" | "expired" | "cancelled";
          access_token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          provider_id: string;
          patient_id?: string | null;
          patient_display_name: string;
          status?: "pending" | "partially_received" | "complete" | "expired" | "cancelled";
          access_token?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "requests_clinic_id_fkey";
            columns: ["clinic_id"];
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_provider_id_fkey";
            columns: ["provider_id"];
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      request_documents: {
        Row: {
          id: string;
          request_id: string;
          label: string;
          notes: string | null;
          status: "requested" | "uploaded" | "missing";
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          label: string;
          notes?: string | null;
          status?: "requested" | "uploaded" | "missing";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["request_documents"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "request_documents_request_id_fkey";
            columns: ["request_id"];
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          request_document_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          request_document_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "documents_request_document_id_fkey";
            columns: ["request_document_id"];
            referencedRelation: "request_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_admins"]["Insert"]>;
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          request_id: string | null;
          actor_type: "provider" | "patient" | "system";
          actor_id: string | null;
          event_type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          actor_type: "provider" | "patient" | "system";
          actor_id?: string | null;
          event_type: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "audit_events_request_id_fkey";
            columns: ["request_id"];
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_clinic_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
