import { Routes, Route } from "react-router-dom";
import TenderList from "../modules/tenders/TenderList";
import TenderForm from "../modules/tenders/TenderForm";
import TenderDetail from "../modules/tenders/TenderDetail";

const TenderRoutes = () => {
  return (
    <Routes>
      <Route index element={<TenderList />} />
      <Route path="new" element={<TenderForm />} />
      <Route path=":id" element={<TenderDetail />} />
    </Routes>
  );
};

export default TenderRoutes;