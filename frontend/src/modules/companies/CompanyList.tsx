import { useState, useEffect } from "react"
import type{ Company } from "./company.type"
import { Link } from "react-router-dom"
import { getCompanies, deleteCompany } from "./company.api";

const CompanyList = () => {
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(()=>{
        loadCompanis();
    },[])


    const loadCompanis = async () => {
        const res = await getCompanies();
        setCompanies(res);
    }

    const handleDelete = async (id: number) => {
        await deleteCompany(id);
        setCompanies(company => company.filter(c=> c.id !== id));
    }


    return(
        <div>
            <h2>Companies</h2>
            <Link to="/companies/new"> Add company </Link>

            <ul>
                {companies.map( company => (
                    <li key={company.id}>
                        {company.name} | {company.city}
                        <Link to={`/companies/${company.id}/edit`}>Edit</Link>
                        <button onClick={()=> handleDelete(company.id)}>Delete</button> 
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CompanyList;