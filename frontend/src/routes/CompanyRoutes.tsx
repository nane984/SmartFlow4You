import { Route, Routes } from "react-router-dom"
import CompanyList from "../modules/companies/CompanyList";
import CompanyForm from "../modules/companies/CompanyForm";

const CompanyRoutes = () => {
    return(
        <Routes>
            <Route index element={<CompanyList />} />
            <Route path="new" element={<CompanyForm />} />
            <Route path=":id/edit" element={<CompanyForm />} />
        </Routes>
    );
}

export default CompanyRoutes