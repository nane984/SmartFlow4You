export const ROLES = {
    ADMIN: "admin",
    HR: "hr",
    CANDIDATE: "candidate",
    INTERVIEWER: "interviewer",
} as const;

// All possible role values from ROLES
export type AppRole = (typeof ROLES)[keyof typeof ROLES];