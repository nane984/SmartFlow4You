import axios from "axios";
import api from "../../api/api";
import type {
    AnswerChoice,
    InterviewSession,
    RoomQuestion,
    VideoSubmissionResponse,
} from "./interviewRoom.types";

export async function getInterviewSession(sessionId: number): Promise<InterviewSession> {
    const res = await api.get<InterviewSession>(`hr/interview-sessions/${sessionId}/`);
    return res.data;
}

export async function startInterviewSession(sessionId: number): Promise<InterviewSession> {
    const res = await api.post<InterviewSession>(`hr/interview-sessions/${sessionId}/start/`);
    return res.data;
}

export async function completeInterviewSession(sessionId: number): Promise<InterviewSession> {
    const res = await api.post<InterviewSession>(`hr/interview-sessions/${sessionId}/complete/`);
    return res.data;
}

export async function getInterviewQuestions(sessionId: number): Promise<RoomQuestion[]> {
    const res = await api.get<RoomQuestion[]>(`hr/interview-sessions/${sessionId}/questions/`);
    return res.data;
}

export async function submitInterviewAnswers(
    sessionId: number,
    answers: { question: number; selected_answer: AnswerChoice }[]
): Promise<void> {
    await api.post(`hr/interview-sessions/${sessionId}/submit-answers/`, { answers });
}

export async function uploadInterviewVideo(
    sessionId: number,
    file: Blob,
    filename = "interview-recording.webm"
): Promise<VideoSubmissionResponse> {
    const formData = new FormData();
    formData.append("video", file, filename);

    try {
        const res = await api.post<VideoSubmissionResponse>(
            `hr/interviews/${sessionId}/upload-video/`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return res.data;
    } catch (error) {
        if (!axios.isAxiosError(error)) {
            throw new Error("Unexpected error");
        }
        const message =
            (error.response?.data as { detail?: string })?.detail ||
            (error.response?.data as { message?: string })?.message ||
            "Upload failed";
        throw new Error(typeof message === "string" ? message : "Upload failed");
    }
}
