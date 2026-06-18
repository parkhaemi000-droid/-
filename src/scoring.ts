import { ApplicantData, RecruitingTarget, ScoringResult } from "./types";

export const DEFAULT_TARGET: RecruitingTarget = {
  regions: ["고양시 덕양구", "고양시 일산동구"],
  timeslots: ["오전(09~12)", "오후(12~18)"],
  needDriving: true,
  weights: {
    career: 35,
    license: 25,
    region: 20,
    timeslot: 12,
    driving: 8,
  },
};

export const TIME_OPTIONS = ["오전(09~12)", "오후(12~18)", "저녁(18~21)", "협의 가능"];
export const DAY_OPTIONS = ["월", "화", "수", "목", "금", "토", "일"];
export const WORK_TYPE_OPTIONS = ["방문요양", "방문목욕", "방문간호 보조", "무관"];

export const EMPTY_FORM: ApplicantData = {
  name: "",
  phone: "",
  birth: "",
  sigungu: "",
  dong: "",
  license: "",
  licenseNo: "",
  career: "",
  etcCert: "",
  days: [],
  timeslots: [],
  workType: "방문요양",
  driving: "",
  startDate: "",
  intro: "",
  agree: false,
};

export const CAREER_OPTIONS = [
  { label: "신규 (경력 없음)", value: "신규", ratio: 0.0 },
  { label: "1년 미만", value: "1년 미만", ratio: 0.4 },
  { label: "1년 ~ 3년 미만", value: "1~3년", ratio: 0.7 },
  { label: "3년 이상", value: "3년 이상", ratio: 1.0 },
];

export const LICENSE_OPTIONS = [
  { label: "자격증 보유", value: "보유", ratio: 1.0 },
  { label: "시험합격 / 취득 예정", value: "취득 예정", ratio: 0.4 },
  { label: "미보유", value: "미보유", ratio: 0.0 },
];

export function scoreApplicant(f: ApplicantData, target: RecruitingTarget = DEFAULT_TARGET): ScoringResult {
  const lines: { label: string; pt: number; max: number }[] = [];
  let total = 0;

  // 1. Career
  const careerOpt = CAREER_OPTIONS.find((opt) => opt.value === f.career);
  const careerRatio = careerOpt ? careerOpt.ratio : 0;
  const cPt = Math.round(target.weights.career * careerRatio);
  total += cPt;
  lines.push({
    label: `경력 (${f.career || "미선택"})`,
    pt: cPt,
    max: target.weights.career,
  });

  // 2. License
  const licenseOpt = LICENSE_OPTIONS.find((opt) => opt.value === f.license);
  const licenseRatio = licenseOpt ? licenseOpt.ratio : 0;
  const lPt = Math.round(target.weights.license * licenseRatio);
  total += lPt;
  lines.push({
    label: `자격증 (${f.license || "미선택"})`,
    pt: lPt,
    max: target.weights.license,
  });
  const warn = f.license !== "보유";

  // 3. Region Matching
  // Clean string helper
  const cleanStr = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  
  const regionHit = f.sigungu.trim() && target.regions.some((r) => {
    const cTarget = cleanStr(r);
    const cInput = cleanStr(f.sigungu);
    return cInput.includes(cTarget) || cTarget.includes(cInput);
  });
  const rPt = regionHit ? target.weights.region : 0;
  total += rPt;
  lines.push({
    label: `희망지역 (${f.sigungu || "미입력"})`,
    pt: rPt,
    max: target.weights.region,
  });

  // 4. Timeslot Matching
  // If caregiver selects "협의 가능", they instantly match all target timeslots
  const hasNegotiable = f.timeslots.includes("협의 가능");
  const matched = target.timeslots.filter(
    (t) => f.timeslots.includes(t) || hasNegotiable
  );
  const tRatio = target.timeslots.length ? matched.length / target.timeslots.length : 0;
  const tPt = Math.round(target.weights.timeslot * tRatio);
  total += tPt;
  lines.push({
    label: `근무 시간대 (${hasNegotiable ? "협의가능" : matched.length + "개 매칭"})`,
    pt: tPt,
    max: target.weights.timeslot,
  });

  // 5. Driving
  let dPt = 0;
  if (target.needDriving) {
    dPt = f.driving === "가능" ? target.weights.driving : 0;
  } else {
    dPt = target.weights.driving; // If driving is not required, secure full points
  }
  total += dPt;
  lines.push({
    label: `자차/운전 (${f.driving || "미선택"})`,
    pt: dPt,
    max: target.weights.driving,
  });

  return { total, lines, warn };
}
