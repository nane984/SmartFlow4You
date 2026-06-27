import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Card from "../components/ui/Card";

const DesignStudioPage = lazy(() => import("../modules/interior_design/DesignStudioPage"));
const ElectricalCatalogPage = lazy(() => import("../modules/interior_design/ElectricalCatalogPage"));
const FurnitureCatalogPage = lazy(() => import("../modules/interior_design/FurnitureCatalogPage"));
const StructureCatalogPage = lazy(() => import("../modules/interior_design/StructureCatalogPage"));
const ProjectListPage = lazy(() => import("../modules/interior_design/ProjectListPage"));

function PageFallback() {
    return (
        <Card>
            <p className="text-sm text-slate-600">Loading…</p>
        </Card>
    );
}

export default function InteriorRoutes() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Routes>
                <Route index element={<ProjectListPage />} />
                <Route path="catalog" element={<FurnitureCatalogPage />} />
                <Route path="electrical-catalog" element={<ElectricalCatalogPage />} />
                <Route path="structure-catalog" element={<StructureCatalogPage />} />
                <Route path="studio/:id" element={<DesignStudioPage />} />
            </Routes>
        </Suspense>
    );
}
