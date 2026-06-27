export type InterviewSessionStatus =
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled";

export type InterviewSession = {
    id: number;
    cv: number;
    application_id?: number;
    job_post_id?: number;
    job_title?: string;
    applicant_name?: string;
    start_time: string;
    end_time: string | null;
    status: InterviewSessionStatus;
    interviewer: number | null;
    duration_seconds: number;
    score: number | null;
    focus_violations?: number;
};

export type QuestionResponseType = "text" | "video" | "audio" | "multiple_choice";

export type RoomQuestion = {
    id: number;
    text: string;
    response_type: QuestionResponseType;
    option_1?: string;
    option_2?: string;
    option_3?: string;
};

export type AnswerChoice = "option_1" | "option_2" | "option_3";

export type SubmitAnswerPayload =
    | { question: number; selected_answer: AnswerChoice }
    | { question: number; text_response: string };

export type VideoSubmissionResponse = {
    id: number;
    video: string;
    timestamp: string;
};
