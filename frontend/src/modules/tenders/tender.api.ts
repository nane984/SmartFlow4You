import api from "../../api/api";
//Koristimo zagradu zato sto nema default u tender.type.ts
import type { Tender, TenderCreatePayload } from "./tender.type";
import type { ApiPage } from "../../components/common/Pagenation.type";

// GET /tenders/
export const getTenders = async (): Promise<Tender[]> => {
  try {
    const res = await api.get<ApiPage<Tender> | Tender[]>("/tenders/");

    // Ako backend vraća array
    if (Array.isArray(res.data)) {
      return res.data;
    }

    // Ako backend vraća paginated response
    if ("results" in res.data && Array.isArray(res.data.results)) {
      return res.data.results;
    }

    // fallback, u slučaju da backend ne vraća očekivani format
    return [];
  } catch (error) {
    console.error("GET TENDERS ERROR:", error);
    return [];
  }
};

// GET /tenders/:id/
export const getTenderById = async (id: number): Promise<Tender> => {
  try {
    const res = await api.get<Tender>(`/tenders/${id}/`);
    return res.data;
  } catch (error) {
    console.error(`GET TENDER ${id} ERROR:`, error);
    throw error;
  }
};

// POST /tenders/
export const createTender = async (data: TenderCreatePayload): Promise<Tender> => {
  try {
    // format deadline u ISO string
    const payload = { ...data, deadline: new Date(data.deadline).toISOString() };
    const res = await api.post<Tender>("/tenders/", payload);
    return res.data;
  } catch (error) {
    console.error("CREATE TENDER ERROR:", error);
    throw error;
  }
};

// PUT /tenders/:id/
export const updateTender = async (id: number, data: TenderCreatePayload): Promise<Tender> => {
  try {
    const payload = { ...data, deadline: new Date(data.deadline).toISOString() };
    const res = await api.put<Tender>(`/tenders/${id}/`, payload);
    return res.data;
  } catch (error) {
    console.error(`UPDATE TENDER ${id} ERROR:`, error);
    throw error;
  }
};

// DELETE /tenders/:id/
export const deleteData = async (id: number): Promise<void> => {
  try {
    await api.delete(`/tenders/${id}/`);
  } catch (error) {
    console.error(`DELETE TENDER ${id} ERROR:`, error);
    throw error;
  }
};