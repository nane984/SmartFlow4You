import { useState } from "react"
import type{ TenderCreatePayload } from "./tender.type";
import { createTender } from "./tender.api";
import { useNavigate } from "react-router-dom";

const TenderForm = () => {
    const navigate = useNavigate();
    
    const [tenderData, setTenderData] = useState<TenderCreatePayload>({
            title: "",
            source: "",
            description: "",
            deadline: "",
            type: "",
            companies: [] 
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();             //da ne refreshuje stranicu sto je po defoultu kada je form onclick
        await createTender(tenderData);
        navigate("/tenders");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTenderData({
            ...tenderData,
            [e.target.name] : e.target.value
        });
    }

    return(
        <form onSubmit={handleSubmit}>
            <h2>Create Tender</h2>

            <div>
                <label>Title</label>
                <input
                    name="title"
                    value={tenderData.title}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label>Source</label>
                <input
                    name="source"
                    value={tenderData.source}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label>Type</label>
                <input
                    name="type"
                    value={tenderData.type}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label>Deadlines</label>
                <input
                    name="deadline"
                    value={tenderData.deadline}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label>Description</label>
                <input
                    name="description"
                    value={tenderData.description}
                    onChange={handleChange}
                />
            </div>

            {/* companies cemo kasnije dodati */}
            <button type="submit">Save tender</button>
        </form>
    );
};

export default TenderForm;