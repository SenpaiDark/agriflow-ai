/**
 * Shelf-life spoilage rules for warehouse inventory. Deterministic — no AI.
 */

export type SpoilageState = "fresh" | "expiring" | "spoiled";

export const EXPIRING_THRESHOLD_DAYS = 3;

export interface ShelfLifeInfo {
  state: SpoilageState;
  daysLeft: number;
  expiryDate: Date;
}

export function shelfLifeInfo(
  entryDate: string | Date,
  shelfLifeDays: number
): ShelfLifeInfo {
  const entry = new Date(entryDate);
  const expiry = new Date(entry);
  expiry.setDate(expiry.getDate() + shelfLifeDays);

  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);

  let state: SpoilageState = "fresh";
  if (daysLeft < 0) state = "spoiled";
  else if (daysLeft <= EXPIRING_THRESHOLD_DAYS) state = "expiring";

  return { state, daysLeft, expiryDate: expiry };
}
