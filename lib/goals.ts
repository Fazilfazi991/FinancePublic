export const GOAL_CATEGORIES = [
  "Personal",
  "Emergency Fund",
  "Travel",
  "Vehicle",
  "Home",
  "Education",
  "Health",
  "Business",
  "Family",
  "Gadget / Electronics",
  "Celebration",
  "Other",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];
