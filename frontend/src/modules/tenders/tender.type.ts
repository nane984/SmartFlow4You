export interface Tender {
    id: number;
    title: string;
    source: string;
    description: string;
    deadline: string;
    type: string;
    status: string;
}


export interface TenderCreatePayload {
    title: string;
    source: string;
    description: string;
    deadline: string;
    type: string;
    companies: number[];        //M2M salje sva tri broja medjutabele [1, 3, 5]
}