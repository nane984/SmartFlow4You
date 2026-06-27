import api from "../../api/api";

export type InterviewQuestionType = "text" | "video" | "audio" | "multiple_choice";

export type JobInterviewQuestion = {
    id: number;
    job_post: number;
    response_type: InterviewQuestionType;
    sort_order: number;
    text: string;
    option_1: string;
    option_2: string;
    option_3: string;
    correct_answer: string;
};

export type CreateInterviewQuestionPayload = {
    job_post: number;
    response_type: InterviewQuestionType;
    sort_order?: number;
    text: string;
    option_1?: string;
    option_2?: string;
    option_3?: string;
    correct_answer?: string;
};

export async function listJobInterviewQuestions(jobPostId: number): Promise<JobInterviewQuestion[]> {
    const { data } = await api.get<JobInterviewQuestion[]>("hr/interview-questions/", {
        params: { job_post: jobPostId },
    });
    return Array.isArray(data) ? data : [];
}

export async function createJobInterviewQuestion(
    payload: CreateInterviewQuestionPayload
): Promise<JobInterviewQuestion> {
    const { data } = await api.post<JobInterviewQuestion>("hr/interview-questions/", payload);
    return data;
}

export async function updateJobInterviewQuestion(
    id: number,
    payload: Partial<CreateInterviewQuestionPayload>
): Promise<JobInterviewQuestion> {
    const { data } = await api.patch<JobInterviewQuestion>(`hr/interview-questions/${id}/`, payload);
    return data;
}

export async function deleteJobInterviewQuestion(id: number): Promise<void> {
    await api.delete(`hr/interview-questions/${id}/`);
}
