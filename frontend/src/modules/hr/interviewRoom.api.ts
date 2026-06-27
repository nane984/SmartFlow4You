import axios from "axios";
import api from "../../api/api";
import type {
    InterviewSession,
    RoomQuestion,
    SubmitAnswerPayload,
    VideoSubmissionResponse,
} from "./interviewRoom.types";

export async function getMyInterviewSessions(params?: {
    job_post?: number;
    application?: number;
}): Promise<InterviewSession[]> {
    const res = await api.get<InterviewSession[]>("hr/interview-sessions/mine/", { params });
    return Array.isArray(res.data) ? res.data : [];
}

export async function getInterviewSession(sessionId: number): Promise<InterviewSession> {
    const res = await api.get<InterviewSession>(`hr/interview-sessions/${sessionId}/`);
    return res.data;
}

export async function getInterviewSessions(): Promise<InterviewSession[]> {
    const res = await api.get<InterviewSession[]>("hr/interview-sessions/");
    return Array.isArray(res.data) ? res.data : [];
}

export type CreateInterviewSessionPayload = {
    cv: number;
    start_time: string;
    duration_seconds?: number;
    interviewer?: number | null;
};

export async function createInterviewSession(
    payload: CreateInterviewSessionPayload
): Promise<InterviewSession> {
    const res = await api.post<InterviewSession>("hr/interview-sessions/", payload);
    return res.data;
}

/** HR: create or return scheduled interview session for an application. */
export async function scheduleApplicationInterview(applicationId: number): Promise<InterviewSession> {
    const res = await api.post<InterviewSession>(
        `applications/${applicationId}/schedule-interview/`
    );
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
    answers: SubmitAnswerPayload[]
): Promise<void> {
    await api.post(`hr/interview-sessions/${sessionId}/submit-answers/`, { answers });
}

export async function uploadQuestionAnswerMedia(
    sessionId: number,
    questionId: number,
    file: Blob,
    filename: string
): Promise<void> {
    const formData = new FormData();
    formData.append("media", file, filename);
    await api.post(`hr/interview-sessions/${sessionId}/answers/${questionId}/upload/`, formData);
}

export async function reportInterviewFocusViolation(sessionId: number): Promise<number> {
    const res = await api.post<{ focus_violations: number }>(
        `hr/interview-sessions/${sessionId}/focus-violation/`
    );
    return res.data.focus_violations;
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
