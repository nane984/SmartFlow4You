import api from "../../api/api";
import type { CV, JobPost } from "./cv.types";
import type { InterviewSession } from "./interviewRoom.types";

export type VideoSubmission = {
    id: number;
    video: string;
    timestamp: string;
};

export type AnswerReview = {
    id: number;
    question: number;
    question_text: string;
    selected_answer: "option_1" | "option_2" | "option_3";
    correct_answer: "option_1" | "option_2" | "option_3";
    is_correct: boolean;
};

export async function getCvById(id: number): Promise<CV> {
    const res = await api.get<CV>(`hr/cvs/${id}/`);
    return res.data;
}

export async function getJobPosts(): Promise<JobPost[]> {
    const res = await api.get<JobPost[]>("hr/jobpost/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function getInterviewSessions(): Promise<InterviewSession[]> {
    const res = await api.get<InterviewSession[]>("hr/interview-sessions/");
    return Array.isArray(res.data) ? res.data : [];
}

export async function getSessionVideos(sessionId: number): Promise<VideoSubmission[]> {
    const res = await api.get<VideoSubmission[]>(`hr/interview-sessions/${sessionId}/videos/`);
    return Array.isArray(res.data) ? res.data : [];
}

export async function getSessionAnswersReview(sessionId: number): Promise<AnswerReview[]> {
    const res = await api.get<AnswerReview[]>(`hr/interview-sessions/${sessionId}/answers-review/`);
    return Array.isArray(res.data) ? res.data : [];
}
