import api from "../../api/api";
import type { Company, CompanyPayload } from "./company.type";
import type { ApiPage } from "../../components/common/Pagenation.type";

// GET /companies/
export const getCompanies = async (): Promise<Company[]> => {
  try {
    const res = await api.get<ApiPage<Company> | Company[]>("/companies/");

    // Ako backend vraća direktni array
    if (Array.isArray(res.data)) return res.data;

    // Ako backend vraća paginated object
    if ("results" in res.data && Array.isArray(res.data.results)) return res.data.results;

    return [];
  } catch (error) {
    console.error("GET COMPANIES ERROR:", error);
    return [];
  }
};

// GET /companies/:id/
export const getCompanyById = async (id: number): Promise<Company> => {
  try {
    const res = await api.get<Company>(`/companies/${id}/`);
    return res.data;
  } catch (error) {
    console.error(`GET COMPANY ${id} ERROR:`, error);
    throw error;
  }
};

// POST /companies/
export const createCompany = async (data: CompanyPayload): Promise<Company> => {
  try {
    const res = await api.post<Company>("/companies/", data);
    return res.data;
  } catch (error) {
    console.error("CREATE COMPANY ERROR:", error);
    throw error;
  }
};

// PUT /companies/:id/
export const updateCompany = async (id: number, data: CompanyPayload): Promise<Company> => {
  try {
    const res = await api.put<Company>(`/companies/${id}/`, data);
    return res.data;
  } catch (error) {
    console.error(`UPDATE COMPANY ${id} ERROR:`, error);
    throw error;
  }
};

// DELETE /companies/:id/
export const deleteCompany = async (id: number): Promise<void> => {
  try {
    await api.delete(`/companies/${id}/`);
  } catch (error) {
    console.error(`DELETE COMPANY ${id} ERROR:`, error);
    throw error;
  }
};