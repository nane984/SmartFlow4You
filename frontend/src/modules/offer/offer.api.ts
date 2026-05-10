import axios from "../../api/api"
import type { Offer, OfferPayload } from "./offer.types"
import type { ApiPage } from "../../components/common/Pagenation.type"

/**
 * Tender offers API.
 * List: unwraps either a plain array or a DRF paginated `{ results }` body.
 * Create/update: `FormData` + multipart when a `file` is included.
 */
export const getOffers = async (): Promise<Offer[]> => {
    try {
        const res = await axios.get<ApiPage<Offer> | Offer[]>("/offers/");

        if (Array.isArray(res.data)) {
            return res.data;
        }

        if ("results" in res.data && Array.isArray(res.data.results)) {
            return res.data.results;
        }

        return [];
    }catch (error) {
        console.error("GET OFFER ERROR:", error);
        return [];
    }
}

export const getOfferById = async (id: Number): Promise<Offer> => {
    try{
        const res = await axios.get<Offer>(`/offers/${id}/`)
        return res.data
    }catch(error){
        console.error(`GET OFFER ${id} ERROR:`, error);
        throw error;
    }
}

export const createOffer = async (data: OfferPayload): Promise<Offer> => {
    try{
        const formData = new FormData();
        
        formData.append("tender", String(data.tender));
        formData.append("price", String(data.price));
        if (data.file){
            formData.append("file", data.file);
        };

        const res = await axios.post<Offer>("/offers/", formData,{
            headers: { "Content-Type": "multipart/form-data" },
        });
        
        return res.data;

    }catch(error){
        console.error(`POST OFFER ERROR:`, error);
        throw error;
    }
};

export const updateOffer = async (id: number, data: OfferPayload): Promise<Offer> => {
    try{
        const formData = new FormData();
        formData.append("tender", String(data.tender));
        formData.append("price", String(data.price));
        if(data.file){
            formData.append("file", data.file);
        }

        const res = await axios.put<Offer>(`/offers/${id}/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return res.data

    }catch(error){
        console.error(`PUT OFFER ERROR:`, error);
        throw error;
    }
}

export const deleteOffer = async (id: number): Promise<void> => {
    try{
        await axios.delete(`/offers/${id}/`);

    }catch(error){
        console.error(`DELETE OFFER ERROR:`, error);
        throw error;
    }
}