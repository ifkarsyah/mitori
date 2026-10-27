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
    PostgrestVersion: "14.17"
  }
  chinese: {
    Tables: {
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
      resource: {
        Row: {
          category: string | null
          category_id: number | null
          channel_id: number | null
          created_at: string
          id: number
          is_transcript_complete: boolean
          title: string
          transcript: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          category_id?: number | null
          channel_id?: number | null
          created_at?: string
          id?: number
          is_transcript_complete?: boolean
          title: string
          transcript?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          category_id?: number | null
          channel_id?: number | null
          created_at?: string
          id?: number
          is_transcript_complete?: boolean
          title?: string
          transcript?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      resource_channel: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          platform: string
          slug: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          platform: string
          slug: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          platform?: string
          slug?: string
          url?: string | null
        }
        Relationships: []
      }
      scene: {
        Row: {
          category_id: number | null
          created_at: string
          description: string | null
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      sentence: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          meaning: string | null
          scene_id: number | null
          sentence: string | null
          updated_at: string | null
          word_id: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          scene_id?: number | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          scene_id?: number | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Relationships: []
      }
      sentence_word: {
        Row: {
          created_at: string
          id: number
          sentence_id: number
          word_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          sentence_id: number
          word_id: number
        }
        Update: {
          created_at?: string
          id?: number
          sentence_id?: number
          word_id?: number
        }
        Relationships: []
      }
      simplification: {
        Row: {
          created_at: string
          id: number
          simplified: string
          traditional: string
        }
        Insert: {
          created_at?: string
          id?: number
          simplified: string
          traditional: string
        }
        Update: {
          created_at?: string
          id?: number
          simplified?: string
          traditional?: string
        }
        Relationships: []
      }
      source: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          name: string
          url: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          name: string
          url?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          name?: string
          url?: string | null
        }
        Relationships: []
      }
      word: {
        Row: {
          meaning_id: number | null
          created_at: string
          id: number
          learned: boolean
          level: string | null
          meanings: string[]
          part_of_speech: string | null
          reading: string | null
          scene_id: number | null
          source_id: number | null
          updated_at: string | null
          word: string
        }
        Insert: {
          meaning_id?: number | null
          created_at?: string
          id?: number
          learned?: boolean
          level?: string | null
          meanings: string[]
          part_of_speech?: string | null
          reading?: string | null
          scene_id?: number | null
          source_id?: number | null
          updated_at?: string | null
          word: string
        }
        Update: {
          meaning_id?: number | null
          created_at?: string
          id?: number
          learned?: boolean
          level?: string | null
          meanings?: string[]
          part_of_speech?: string | null
          reading?: string | null
          scene_id?: number | null
          source_id?: number | null
          updated_at?: string | null
          word?: string
        }
        Relationships: []
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
  german: {
    Tables: {
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
      resource: {
        Row: {
          category: string | null
          category_id: number | null
          channel_id: number | null
          created_at: string
          id: number
          is_transcript_complete: boolean
          title: string
          transcript: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          category_id?: number | null
          channel_id?: number | null
          created_at?: string
          id?: number
          is_transcript_complete?: boolean
          title: string
          transcript?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          category_id?: number | null
          channel_id?: number | null
          created_at?: string
          id?: number
          is_transcript_complete?: boolean
          title?: string
          transcript?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      resource_channel: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          platform: string
          slug: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          platform: string
          slug: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          platform?: string
          slug?: string
          url?: string | null
        }
        Relationships: []
      }
      scene: {
        Row: {
          category_id: number | null
          created_at: string
          description: string | null
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      sentence: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          meaning: string | null
          scene_id: number | null
          sentence: string | null
          updated_at: string | null
          word_id: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          scene_id?: number | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          scene_id?: number | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Relationships: []
      }
      sentence_word: {
        Row: {
          created_at: string
          id: number
          sentence_id: number
          word_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          sentence_id: number
          word_id: number
        }
        Update: {
          created_at?: string
          id?: number
          sentence_id?: number
          word_id?: number
        }
        Relationships: []
      }
      source: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          name: string
          url: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          name: string
          url?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          name?: string
          url?: string | null
        }
        Relationships: []
      }
      word: {
        Row: {
          meaning_id: number | null
          created_at: string
          gender: string | null
          id: number
          learned: boolean
          level: string | null
          meanings: string[]
          part_of_speech: string | null
          plural: string | null
          scene_id: number | null
          source_id: number | null
          updated_at: string | null
          word: string
        }
        Insert: {
          meaning_id?: number | null
          created_at?: string
          gender?: string | null
          id?: number
          learned?: boolean
          level?: string | null
          meanings: string[]
          part_of_speech?: string | null
          plural?: string | null
          scene_id?: number | null
          source_id?: number | null
          updated_at?: string | null
          word: string
        }
        Update: {
          meaning_id?: number | null
          created_at?: string
          gender?: string | null
          id?: number
          learned?: boolean
          level?: string | null
          meanings?: string[]
          part_of_speech?: string | null
          plural?: string | null
          scene_id?: number | null
          source_id?: number | null
          updated_at?: string | null
          word?: string
        }
        Relationships: []
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
  japanese: {
    Tables: {
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
          learned: boolean
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
          learned?: boolean
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
          learned?: boolean
          meanings?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resource: {
        Row: {
          category: string | null
          category_id: number | null
          channel_id: number | null
          created_at: string
          id: number
          is_transcript_complete: boolean
          title: string
          transcript: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          category_id?: number | null
          channel_id?: number | null
          created_at?: string
          id?: number
          is_transcript_complete?: boolean
          title: string
          transcript?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          category_id?: number | null
          channel_id?: number | null
          created_at?: string
          id?: number
          is_transcript_complete?: boolean
          title?: string
          transcript?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      resource_channel: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          platform: string
          slug: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          platform: string
          slug: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          platform?: string
          slug?: string
          url?: string | null
        }
        Relationships: []
      }
      scene: {
        Row: {
          category_id: number | null
          created_at: string
          description: string | null
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      sentence: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          meaning: string | null
          scene_id: number | null
          sentence: string | null
          updated_at: string | null
          word_id: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          scene_id?: number | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          meaning?: string | null
          scene_id?: number | null
          sentence?: string | null
          updated_at?: string | null
          word_id?: number | null
        }
        Relationships: []
      }
      sentence_word: {
        Row: {
          created_at: string
          id: number
          sentence_id: number
          word_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          sentence_id: number
          word_id: number
        }
        Update: {
          created_at?: string
          id?: number
          sentence_id?: number
          word_id?: number
        }
        Relationships: []
      }
      source: {
        Row: {
          category_id: number | null
          created_at: string
          id: number
          name: string
          url: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          id?: number
          name: string
          url?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          id?: number
          name?: string
          url?: string | null
        }
        Relationships: []
      }
      word: {
        Row: {
          meaning_id: number | null
          created_at: string
          id: number
          kana_type: string
          learned: boolean
          level: string | null
          meanings: string[]
          part_of_speech: string | null
          reading: string | null
          scene_id: number | null
          source_id: number | null
          sub_part_of_speech: string | null
          updated_at: string | null
          word: string
        }
        Insert: {
          meaning_id?: number | null
          created_at?: string
          id?: number
          kana_type: string
          learned?: boolean
          level?: string | null
          meanings: string[]
          part_of_speech?: string | null
          reading?: string | null
          scene_id?: number | null
          source_id?: number | null
          sub_part_of_speech?: string | null
          updated_at?: string | null
          word: string
        }
        Update: {
          meaning_id?: number | null
          created_at?: string
          id?: number
          kana_type?: string
          learned?: boolean
          level?: string | null
          meanings?: string[]
          part_of_speech?: string | null
          reading?: string | null
          scene_id?: number | null
          source_id?: number | null
          sub_part_of_speech?: string | null
          updated_at?: string | null
          word?: string
        }
        Relationships: []
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
        Relationships: []
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
  public: {
    Tables: {
      captures: {
        Row: {
          captured_at: string
          id: number
          image_url: string | null
          parsed_at: string | null
          raw_text: string | null
        }
        Insert: {
          captured_at: string
          id?: number
          image_url?: string | null
          parsed_at?: string | null
          raw_text?: string | null
        }
        Update: {
          captured_at?: string
          id?: number
          image_url?: string | null
          parsed_at?: string | null
          raw_text?: string | null
        }
        Relationships: [
        ]
      }
      category: {
        Row: {
          created_at: string
          id: number
          kind: string
          name: string
          parent_id: number | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: number
          kind: string
          name: string
          parent_id?: number | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: number
          kind?: string
          name?: string
          parent_id?: number | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      meaning: {
        Row: {
          category_id: number | null
          created_at: string
          gloss: string
          id: number
          part_of_speech: string | null
          slug: string | null
          tier: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          gloss: string
          id?: number
          part_of_speech?: string | null
          slug?: string | null
          tier?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          gloss?: string
          id?: number
          part_of_speech?: string | null
          slug?: string | null
          tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meaning_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      language: {
        Row: {
          code: string
          created_at: string
          direction: string
          has_characters: boolean
          has_gender: boolean
          has_reading: boolean
          level_system: string | null
          name: string
          schema_name: string
          script: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          direction?: string
          has_characters?: boolean
          has_gender?: boolean
          has_reading?: boolean
          level_system?: string | null
          name: string
          schema_name: string
          script: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          direction?: string
          has_characters?: boolean
          has_gender?: boolean
          has_reading?: boolean
          level_system?: string | null
          name?: string
          schema_name?: string
          script?: string
          sort_order?: number
        }
        Relationships: []
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
  chinese: {
    Enums: {},
  },
  german: {
    Enums: {},
  },
  japanese: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
