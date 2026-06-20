import { Route, Routes } from "react-router-dom";
import OfferList from "../modules/offer/OfferList";

/** Nested routes for `/offers/*` */
const OfferRoutes = () => (
    <Routes>
        <Route index element={<OfferList />} />
    </Routes>
);

export default OfferRoutes;