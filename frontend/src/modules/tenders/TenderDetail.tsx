import type{ Tender } from "./tender.type";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTenderById } from "./tender.api";

const TenderDetail = () => {
    const { id } = useParams();
    const [tender, setTender] = useState<Tender | null>(null)

    useEffect(()=>{
        if(id){
            getTenderById(Number(id)).then(res => setTender(res));
        }
    },[id]);

    if (!tender) return <p>Loading...</p>

    return(
        <div>
            <h2>{tender.title}</h2>
            <p>{tender.description}</p>
            <p>Status: {tender.status}</p>
        </div>
    );
};

export default TenderDetail;