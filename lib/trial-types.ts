export type TrialStatus = {
  code: "eligible" | "active" | "disabled" | "used";
  eligible: boolean;
  active: boolean;
  endsAt: number | null;
};
