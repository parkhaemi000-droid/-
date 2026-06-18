export interface ApplicantData {
  name: string;
  phone: string;
  birth: string;
  sigungu: string;
  dong: string;
  license: string;
  licenseNo: string;
  career: string;
  etcCert: string;
  days: string[];
  timeslots: string[];
  workType: string;
  driving: string;
  startDate: string;
  intro: string;
  agree: boolean;
}

export interface RecruitingTarget {
  regions: string[];
  timeslots: string[];
  needDriving: boolean;
  weights: {
    career: number;
    license: number;
    region: number;
    timeslot: number;
    driving: number;
  };
}

export interface ScoreLine {
  label: string;
  pt: number;
  max: number;
}

export interface ScoringResult {
  total: number;
  lines: ScoreLine[];
  warn: boolean;
}

export interface SubmissionRecord {
  id: string;
  data: ApplicantData;
  score: number;
  lines: ScoreLine[];
  warn: boolean;
  submittedAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  centerName: string;
  sigungu: string;
  dong: string;
  workType: string;
  timeslot: string;
  days: string[];
  pay: string;
  careSubject: string;
  needDriving: boolean;
  prefCareer: string; // '무관' | '1년 이상' | '3년 이상'
  isActive: boolean;
}

export interface JobMatchResult {
  jobId: string;
  score: number; // 0 to 100% Match
  reasons: string[];
  shortcomings: string[];
}

