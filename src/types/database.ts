/**
 * Database types for the Supabase client.
 *
 * Hand-written to match the SQL in supabase/migrations/,
 * in the same shape `supabase gen types typescript` produces. Once a Supabase
 * project is linked you can regenerate this file with:
 *
 *   npx supabase gen types typescript --linked > src/types/database.ts
 *
 * (Generated view columns come out nullable; the services layer normalises
 *  them, so regenerating won't break callers.)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          location: string | null;
          status: Database["public"]["Enums"]["project_status"];
          snag_counter: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          description?: string | null;
          location?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          snag_counter?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          location?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          snag_counter?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      snags: {
        Row: {
          id: string;
          project_id: string;
          snag_number: number;
          title: string;
          description: string | null;
          location_details: string | null;
          assigned_to: string | null;
          status: Database["public"]["Enums"]["snag_status"];
          image_url: string | null;
          image_path: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          /** Assigned by trigger — any value sent is overwritten. */
          snag_number?: number;
          title: string;
          description?: string | null;
          location_details?: string | null;
          assigned_to?: string | null;
          status?: Database["public"]["Enums"]["snag_status"];
          image_url?: string | null;
          image_path?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          snag_number?: number;
          title?: string;
          description?: string | null;
          location_details?: string | null;
          assigned_to?: string | null;
          status?: Database["public"]["Enums"]["snag_status"];
          image_url?: string | null;
          image_path?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "snags_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "snags_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project_summaries";
            referencedColumns: ["id"];
          },
        ];
      };
      snag_photos: {
        Row: {
          id: string;
          snag_id: string;
          position: number;
          image_url: string;
          image_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          snag_id: string;
          position?: number;
          image_url: string;
          image_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          snag_id?: string;
          position?: number;
          image_url?: string;
          image_path?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "snag_photos_snag_id_fkey";
            columns: ["snag_id"];
            isOneToOne: false;
            referencedRelation: "snags";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      project_summaries: {
        Row: {
          id: string | null;
          owner_id: string | null;
          name: string | null;
          description: string | null;
          location: string | null;
          status: Database["public"]["Enums"]["project_status"] | null;
          snag_counter: number | null;
          created_at: string | null;
          updated_at: string | null;
          total_snags: number | null;
          open_snags: number | null;
          in_progress_snags: number | null;
          resolved_snags: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      project_status: "active" | "on_hold" | "completed" | "archived";
      snag_status: "open" | "in_progress" | "resolved";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
