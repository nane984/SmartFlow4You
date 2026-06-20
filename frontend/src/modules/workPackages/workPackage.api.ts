import api from "../../api/api";
import type { ApiPage } from "../../components/common/Pagenation.type";
import { formatPriceForApi } from "../../util/parsePriceInput";
import type {
    SubmissionCreatePayload,
    WorkPackage,
    WorkPackageCreatePayload,
    WorkPackageSubmission,
} from "./workPackage.types";

function unwrapList<T>(data: ApiPage<T> | T[]): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
}

export async function getWorkPackages(tenderId?: number): Promise<WorkPackage[]> {
    const url =
        tenderId != null && tenderId > 0
            ? `/work-packages/?tender=${tenderId}`
            : "/work-packages/";
    const res = await api.get<ApiPage<WorkPackage> | WorkPackage[]>(url);
    return unwrapList(res.data);
}

export async function getWorkPackageById(id: number): Promise<WorkPackage> {
    const res = await api.get<WorkPackage>(`/work-packages/${id}/`);
    return res.data;
}

export async function createWorkPackage(
    data: WorkPackageCreatePayload,
    templateFile: File | null
): Promise<WorkPackage> {
    const fd = new FormData();
    fd.append("tender", String(data.tender));
    fd.append("name", data.name);
    fd.append("description", data.description);
    if (data.work_category) fd.append("work_category", data.work_category);
    if (data.object_type) fd.append("object_type", data.object_type);
    if (data.contractor_ids?.length) {
        for (const id of data.contractor_ids) {
            fd.append("contractor_ids", String(id));
        }
    }
    if (templateFile) {
        fd.append("template_file", templateFile);
    }
    const res = await api.post<WorkPackage>("/work-packages/", fd);
    return res.data;
}

export async function getSubmissions(workPackageId?: number, tenderId?: number): Promise<WorkPackageSubmission[]> {
    const params = new URLSearchParams();
    if (workPackageId != null && workPackageId > 0) {
        params.set("work_package", String(workPackageId));
    }
    if (tenderId != null && tenderId > 0) {
        params.set("tender", String(tenderId));
    }
    const qs = params.toString();
    const url = qs ? `/submissions/?${qs}` : "/submissions/";
    const res = await api.get<ApiPage<WorkPackageSubmission> | WorkPackageSubmission[]>(url);
    return unwrapList(res.data);
}

export async function createSubmission(
    data: SubmissionCreatePayload,
    uploadedFile: File
): Promise<WorkPackageSubmission> {
    const fd = new FormData();
    fd.append("work_package", String(data.work_package));
    fd.append("subcontractor", String(data.subcontractor));
    fd.append("uploaded_file", uploadedFile);
    fd.append("status", data.status ?? "submitted");
    if (data.price != null && Number.isFinite(data.price)) {
        fd.append("price", formatPriceForApi(data.price));
    }

    if (import.meta.env.DEV) {
        console.log("[createSubmission] payload", {
            work_package: data.work_package,
            subcontractor: data.subcontractor,
            status: data.status ?? "submitted",
            price: data.price ?? null,
            file: uploadedFile.name,
        });
    }

    const res = await api.post<WorkPackageSubmission>("/submissions/", fd);
    return res.data;
}
