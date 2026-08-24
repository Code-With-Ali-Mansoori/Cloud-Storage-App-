export const canPerform = (actorRole: string, targetRole: string): boolean => {
  const hierarchy = ["User", "Manager", "Admin", "SuperAdmin"];
  return hierarchy.indexOf(actorRole) > hierarchy.indexOf(targetRole);
};