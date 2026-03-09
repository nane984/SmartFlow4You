//for list and delete
import { Link } from "react-router-dom"
import { useState, useEffect } from "react";
import type{ Tender } from "./tender.type";
import { deleteData, getTenders } from "./tender.api";

const TenderList = () =>{
    const [tenders, setTenders]=useState<Tender[]>([]);

    const handleDelete = async (id: number) => {
        await deleteData(id);
        setTenders(oldTender => oldTender.filter(t => t.id !== id));
    }

    useEffect(() => {
        getTenders().then(res => { 
            setTenders(res);
    });
    },[]);

    return(
        <div>
            <h2>Tenders</h2>
            <Link to = "/tenders/new">+ New Tender</Link>
            <ul>
                {tenders.map(t =>(
                    <li key={t.id}>
                        <Link to={`/tenders/${t.id}`}>{t.title}</Link>
                        <button onClick={() => handleDelete(t.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
        
        /*<h1>TENDER LIST WORKS</h1>*/

    );
};

export default TenderList;