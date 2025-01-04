export type ButtonText =
  | "Borrar"
  | "Finalizada"
  | "Cambiar"
  | "Entrenar"
  | "Avisar";

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ReservationPreferences
  extends Record<WeekDay, string | null> {}

export interface ReservationResult {
  success: boolean;
  message: string;
  weekDay: string;
  time?: string;
  state?: ButtonText;
}
