import { Link } from "react-router-dom";
import LinkButton from "../ui/LinkButton";
import {
    OBJECT_TYPE_LABELS,
    WORK_CATEGORY_LABELS,
    type ObjectType,
    type WorkCategory,
} from "../../modules/procurement/constants";
import type { WorkPackage } from "../../modules/workPackages/workPackage.types";
import { resolveMediaUrl } from "../../util/mediaUrl";
import { fileNameFromUrl } from "../../util/fileNameFromUrl";

type WorkPackageListProps = {
    tenderId: number;
    packages: WorkPackage[];
};

export default function WorkPackageList({ tenderId, packages }: WorkPackageListProps) {
    if (packages.length === 0) {
        return <p className="px-4 py-6 text-sm text-slate-600">No work packages yet. Create one above.</p>;
    }

    return (
        <ul className="divide-y divide-slate-100">
            {packages.map((wp) => (
                <li key={wp.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <Link
                            to={`/tenders/${tenderId}/work-packages/${wp.id}`}
                            className="text-base font-medium text-slate-900 no-underline hover:text-brand-700"
                        >
                            {wp.name}
                        </Link>
                        {wp.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{wp.description}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                            {wp.work_category
                                ? WORK_CATEGORY_LABELS[wp.work_category as WorkCategory] ?? wp.work_category
                                : "Uncategorized"}
                            {wp.object_type
                                ? ` · ${OBJECT_TYPE_LABELS[wp.object_type as ObjectType] ?? wp.object_type}`
                                : ""}
                            {" · "}
                            {wp.submission_count ?? wp.submissions?.length ?? 0} submission(s)
                            {wp.template_file ? (
                                <>
                                    {" · "}
                                    <a
                                        href={resolveMediaUrl(wp.template_file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-brand-700 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Download template ({fileNameFromUrl(wp.template_file)})
                                    </a>
                                </>
                            ) : (
                                " · No template uploaded"
                            )}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <LinkButton
                            variant="secondary"
                            size="sm"
                            to={`/tenders/${tenderId}/work-packages/${wp.id}`}
                        >
                            View & submissions
                        </LinkButton>
                    </div>
                </li>
            ))}
        </ul>
    );
}
