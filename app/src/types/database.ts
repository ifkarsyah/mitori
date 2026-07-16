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
      captures: {
        Row: {
          captured_at: string
          context_id: number | null
          id: number
          image_url: string | null
          parsed_at: string | null
          raw_text: string | null
        }
        Insert: {
          captured_at: string
          context_id?: number | null
          id?: number
          image_url?: string | null
          parsed_at?: string | null
          raw_text?: string | null
        }
        Update: {
          captured_at?: string
          context_id?: number | null
          id?: number
          image_url?: string | null
          parsed_at?: string | null
          raw_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captures_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
        ]
      }
      context: {
        Row: {
          created_at: string
          Description: string | null
          id: number
          kind: string
          name: string | null
        }
        Insert: {
          created_at?: string
          Description?: string | null
          id?: number
          kind: string
          name?: string | null
        }
        Update: {
          created_at?: string
          Description?: string | null
          id?: number
          kind?: string
          name?: string | null
        }
        Relationships: []
      }
      grammar_point: {
        Row: {
          category: string
          content: string
          created_at: string
          folder_order: number
          id: number
          slug: string
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          folder_order: number
          id?: number
          slug: string
          sort_order: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          folder_order?: number
          id?: number
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kanji: {
        Row: {
          character: string | null
          cluster: string | null
          created_at: string
          grade: string | null
          id: number
          jlpt: string | null
          kanjigraph_url: string | null
          kanjimap_url: string | null
          meanings: string[] | null
          updated_at: string | null
        }
        Insert: {
          character?: string | null
          cluster?: string | null
          created_at?: string
          grade?: string | null
          id?: number
          jlpt?: string | null
          kanjigraph_url?: string | null
          kanjimap_url?: string | null
          meanings?: string[] | null
          updated_at?: string | null
        }
        Update: {
          character?: string | null
          cluster?: string | null
          created_at?: string
          grade?: string | null
          id?: number
          jlpt?: string | null
          kanjigraph_url?: string | null
          kanjimap_url?: string | null
          meanings?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kotoba: {
        Row: {
          context_id: number | null
          created_at: string
          id: number
          jlpt: string | null
          meanings: string[]
          part_of_speech: string | null
          reading: string | null
          kana_type: string
          source_id: number | null
          sub_part_of_speech: string | null
          updated_at: string | null
          word: string
        }
        Insert: {
          context_id?: number | null
          created_at?: string
          id?: number
          jlpt?: string | null
          meanings: string[]
          part_of_speech?: string | null
          reading?: string | null
          kana_type: string
          source_id?: number | null
          sub_part_of_speech?: string | null
          updated_at?: string | null
          word: string
        }
        Update: {
          context_id?: number | null
          created_at?: string
          id?: number
          jlpt?: string | null
          meanings?: string[]
          part_of_speech?: string | null
          reading?: string | null
          kana_type?: string
          source_id?: number | null
          sub_part_of_speech?: string | null
          updated_at?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "kotoba_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "words_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
        ]
      }
      sentences: {
        Row: {
          context_id: number | null
          created_at: string
          id: number
          meaning: string | null
          sentence: string | null
          updated_at: string | null
          word_id: number | null
        }
        Insert: {
          context_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Update: {
          context_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sentences_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "kotoba"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentences_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
        ]
      }
      source: {
        Row: {
          context_id: number | null
          created_at: string
          id: number
          name: string
          url: string | null
        }
        Insert: {
          context_id?: number | null
          created_at?: string
          id?: number
          name: string
          url?: string | null
        }
        Update: {
          context_id?: number | null
          created_at?: string
          id?: number
          name?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "context"
            referencedColumns: ["id"]
          },
        ]
      }
      word_kanji: {
        Row: {
          created_at: string
          id: number
          kanji_id: number | null
          kanji_meaning_in_word: string | null
          updated_at: string | null
          word_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          kanji_id?: number | null
          kanji_meaning_in_word?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          kanji_id?: number | null
          kanji_meaning_in_word?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "word_kanji_kanji_id_fkey"
            columns: ["kanji_id"]
            isOneToOne: false
            referencedRelation: "kanji"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_kanji_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "kotoba"
            referencedColumns: ["id"]
          },
        ]
      }
      sentence_kotoba: {
        Row: {
          created_at: string
          id: number
          kotoba_id: number
          sentence_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          kotoba_id: number
          sentence_id: number
        }
        Update: {
          created_at?: string
          id?: number
          kotoba_id?: number
          sentence_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sentence_kotoba_kotoba_id_fkey"
            columns: ["kotoba_id"]
            isOneToOne: false
            referencedRelation: "kotoba"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentence_kotoba_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
