/** Procurement domain — work categorization & tender classification */

export const TENDER_VISIBILITY = ["public", "private"] as const;
export type TenderVisibility = (typeof TENDER_VISIBILITY)[number];

export const TENDER_VISIBILITY_LABELS: Record<TenderVisibility, string> = {
    public: "Public",
    private: "Private",
};

export const WORK_CATEGORIES = ["electrical", "hvac", "civil", "finishing"] as const;
export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
    electrical: "Electrical works",
    hvac: "HVAC",
    civil: "Civil works",
    finishing: "Finishing works",
};

export const OBJECT_TYPES = ["residential", "commercial", "industrial", "infrastructure"] as const;
export type ObjectType = (typeof OBJECT_TYPES)[number];

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
    residential: "Residential",
    commercial: "Commercial",
    industrial: "Industrial",
    infrastructure: "Infrastructure",
};
