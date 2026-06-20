import { Route, Routes } from "react-router-dom";
import OfferList from "../modules/offer/OfferList";
import OfferCreate from "../pages/offers/OfferCreate";

/** Nested routes for `/offers/*` */
const OfferRoutes = () => (
    <Routes>
        <Route index element={<OfferList />} />
        <Route path="new" element={<OfferCreate />} />
    </Routes>
);

export default OfferRoutes;