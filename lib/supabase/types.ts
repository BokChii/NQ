export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          school_id: string | null;
          region_id: string | null;
          level: number;
          xp: number;
          streak: number;
          nq: number;
          last_played_at: string | null;
          rank_name: string | null;
          rank_color: string | null;
          onboarding_done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          school_id?: string | null;
          region_id?: string | null;
          level?: number;
          xp?: number;
          streak?: number;
          nq?: number;
          last_played_at?: string | null;
          rank_name?: string | null;
          rank_color?: string | null;
          onboarding_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          school_id?: string | null;
          region_id?: string | null;
          level?: number;
          xp?: number;
          streak?: number;
          nq?: number;
          last_played_at?: string | null;
          rank_name?: string | null;
          rank_color?: string | null;
          onboarding_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      schools: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
      };
      regions: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          category: string;
          difficulty: number;
          quiz_date: string | null;
          daily_arena: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          difficulty?: number;
          quiz_date?: string | null;
          daily_arena?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Insert"]>;
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          sort_order: number;
          question: string;
          options: Json;
          correct_index: number;
          explanation: string | null;
          source_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          sort_order: number;
          question: string;
          options: Json;
          correct_index: number;
          explanation?: string | null;
          source_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Insert"]>;
      };
      user_answers: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          question_id: string;
          selected_index: number;
          is_correct: boolean;
          time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          question_id: string;
          selected_index: number;
          is_correct: boolean;
          time_ms?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_answers"]["Insert"]>;
      };
      user_daily_arena: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total: number;
          nq_earned: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total: number;
          nq_earned?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_daily_arena"]["Insert"]>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type School = Database["public"]["Tables"]["schools"]["Row"];
export type Region = Database["public"]["Tables"]["regions"]["Row"];
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
export type UserAnswer = Database["public"]["Tables"]["user_answers"]["Row"];
export type UserDailyArena = Database["public"]["Tables"]["user_daily_arena"]["Row"];
