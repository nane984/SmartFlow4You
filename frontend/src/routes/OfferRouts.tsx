import { Route, Routes } from "react-router-dom";
import OfferList from "../modules/offer/OfferList";

/** Nested routes for `/offers/*`; declare paths relative to the parent segment. */
const OfferRoutes = () => (
    <Routes>
        <Route path="/" element={<OfferList />} />
    </Routes>
);

export default OfferRoutes;