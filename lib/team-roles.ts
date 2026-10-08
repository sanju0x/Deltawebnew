export const TEAM_ROLE_CATEGORIES = [
  "Project Owner",
  "Lead Developer",
  "Project Manager",
  "Creative Director",
  "Audio Server Manager",
] as const;

export type TeamRoleCategory = (typeof TEAM_ROLE_CATEGORIES)[number];

const legacyRoleCategories: Record<string, TeamRoleCategory> = {
  Founder: "Project Owner",
  Owner: "Project Owner",
  Developer: "Lead Developer",
  "Assistant Developer": "Lead Developer",
  Council: "Project Manager",
};

export function normalizeTeamRoleCategory(category: string): TeamRoleCategory {
  if ((TEAM_ROLE_CATEGORIES as readonly string[]).includes(category)) {
    return category as TeamRoleCategory;
  }

  return legacyRoleCategories[category] || "Project Manager";
}

export function getTeamRoleCategoryOrder(category: string) {
  const index = (TEAM_ROLE_CATEGORIES as readonly string[]).indexOf(category);
  return index === -1 ? TEAM_ROLE_CATEGORIES.length : index;
}
