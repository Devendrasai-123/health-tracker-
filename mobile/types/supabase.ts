export type DailyMetricsRow = {
  metric_id?: string;
  user_id: string;
  metric_date: string;
  resting_heart_rate_bpm?: number | null;
  sleep_duration_hours?: number | null;
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  stress_level?: number | null;
  mood?: number | null;
  daily_steps?: number | null;
  active_minutes?: number | null;
  sedentary_minutes?: number | null;
  water_intake_ml?: number | null;
  caffeine_mg?: number | null;
  alcohol_units?: number | null;
  energy_level?: number | null;
  overall_day_rating?: number | null;
  health_status?: string | null;
  notes?: string | null;
  created_at?: string;
  last_updated?: string;
};

export type MealsRow = {
  meal_id?: string;
  user_id: string;
  meal_date: string;
  meal_type: string;
  food_items: unknown;
  total_calories?: number | null;
  total_protein_g?: number | null;
  total_carbs_g?: number | null;
  total_fat_g?: number | null;
  total_fiber_g?: number | null;
  total_sugar_g?: number | null;
  notes?: string | null;
  photo_path?: string | null;
  created_at?: string;
  last_updated?: string;
};

export type WorkoutsRow = {
  workout_id?: string;
  user_id: string;
  workout_date: string;
  workout_name: string;
  workout_type?: string | null;
  specific_activity?: string | null;
  total_duration_minutes?: number | null;
  perceived_intensity?: number | null;
  estimated_calories_burned?: number | null;
  notes?: string | null;
  created_at?: string;
  last_updated?: string;
};

export type TodosRow = {
  todo_id?: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  due_date: string | null;
  notes: string | null;
  is_active?: boolean;
  created_at?: string;
  last_updated?: string;
};

export type ProfilesRow = {
  id: string;
  username: string | null;
  privacy_mode: string | null;
  data_backup_enabled: boolean | null;
  notification_enabled: boolean | null;
  language: string | null;
  timezone: string | null;
  is_active: boolean | null;
  created_at?: string;
  last_updated?: string;
};

export interface Database {
  public: {
    Tables: {
      daily_metrics: {
        Row: DailyMetricsRow;
        Insert: Omit<DailyMetricsRow, 'created_at' | 'last_updated'>;
        Update: Partial<DailyMetricsRow>;
        Relationships: [];
      };
      meals: {
        Row: MealsRow;
        Insert: Omit<MealsRow, 'created_at' | 'last_updated'>;
        Update: Partial<MealsRow>;
        Relationships: [];
      };
      workouts: {
        Row: WorkoutsRow;
        Insert: Omit<WorkoutsRow, 'created_at' | 'last_updated'>;
        Update: Partial<WorkoutsRow>;
        Relationships: [];
      };
      todos: {
        Row: TodosRow;
        Insert: Omit<TodosRow, 'created_at' | 'last_updated'>;
        Update: Partial<TodosRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfilesRow;
        Insert: Omit<ProfilesRow, 'created_at' | 'last_updated'>;
        Update: Partial<ProfilesRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
