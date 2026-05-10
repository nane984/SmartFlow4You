export type InterviewSessionStatus =
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled";

export type InterviewSession = {
    id: number;
    cv: number;
    start_time: string;
    end_time: string | null;
    status: InterviewSessionStatus;
    interviewer: number | null;
    duration_seconds: number;
    score: number | null;
};

export type RoomQuestion = {
    id: number;
    text: string;
    option_1: string;
    option_2: string;
    option_3: string;
};

export type AnswerChoice = "option_1" | "option_2" | "option_3";

export type VideoSubmissionResponse = {
    id: number;
    video: string;
    timestamp: string;
};
