import { useNavigate, useParams } from "react-router-dom";
import { createCompany, getCompanyById, updateCompany } from "./company.api";
import { useEffect, useState } from "react";
import type{ CompanyPayload } from "./company.type";


const CompanyForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState<CompanyPayload>({
        name: "",
        email: "",
        contact_person: "",
        city: ""
    });

    useEffect(() => {
        if(id){
            loadCompany();
        }
    },[id]);

    const loadCompany = async () => {
        const res = await getCompanyById(Number(id));
        setData(res);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({...data,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(id){
            await updateCompany(Number(id), data);
        }else{
            await createCompany(data);
        }
        navigate("/companies");
    }

    return (
        <form onSubmit={handleSubmit}>
            <input 
                name="name"
                placeholder="name"
                value={data.name}
                onChange={handleChange}
            />
            <input 
                name="email"
                placeholder="email"
                value={data.email}
                onChange={handleChange}
            />
            <input 
                name="contact_person"
                placeholder="contact_person"
                value={data.contact_person}
                onChange={handleChange}
            />
            <input 
                name="city"
                placeholder="city"
                value={data.city}
                onChange={handleChange}
            />
            <button type="submit">Save</button>

        </form>
    );
};

export default CompanyForm;