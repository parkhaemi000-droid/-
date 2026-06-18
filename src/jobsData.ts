import { JobPosting, ApplicantData, JobMatchResult } from "./types";

export const INITIAL_JOB_POSTINGS: JobPosting[] = [
  {
    id: "job-1",
    title: "화정동 치매 3등급 할머님 오후 집중 가사 지원 및 정서 돌봄",
    centerName: "은빛재가복지센터",
    sigungu: "고양시 덕양구",
    dong: "화정동",
    workType: "방문요양",
    timeslot: "오후(12~18)",
    days: ["월", "수", "금"],
    pay: "시급 14,800원",
    careSubject: "84세 여성 어르신, 초기 치매 증세 및 실버 보행차 이용, 말벗 및 인지보드 게임 지원 완료 요망",
    needDriving: false,
    prefCareer: "1년 이상",
    isActive: true
  },
  {
    id: "job-2",
    title: "식사동 거동 다소 불편하신 할아버님 오전 신체 요약 케어 & 병원 동행",
    centerName: "한마음돌봄센터",
    sigungu: "고양시 일산동구",
    dong: "식사동",
    workType: "방문요양",
    timeslot: "오전(09~12)",
    days: ["월", "화", "수", "목", "금"],
    pay: "시급 15,300원 (교통 편의비 추가 지급)",
    careSubject: "78세 남성 어르신, 파킨슨 초기, 병원 정기 동행 필수 (차량 소요 및 거동 부축 가능자 우대)",
    needDriving: true,
    prefCareer: "3년 이상",
    isActive: true
  },
  {
    id: "job-3",
    title: "성사동 독거 어르신 긴급 방문목욕 서비스 주말 고정 선생님 채용",
    centerName: "은빛재가복지센터",
    sigungu: "고양시 덕양구",
    dong: "성사동",
    workType: "방문목욕",
    timeslot: "오전(09~12)",
    days: ["토", "일"],
    pay: "회당 42,000원 (방문 수당 우대)",
    careSubject: "81세 여성 어르신, 거동 불가 와상 상태, 차량 지원 이동식 욕조 구비(동료 요양사와 2인 1조 매칭)",
    needDriving: false,
    prefCareer: "무관",
    isActive: true
  },
  {
    id: "job-4",
    title: "[은평구 구산동] 여성 어르신 야간 밀착 동행 및 수면 관리 지원",
    centerName: "행복가득재가센터",
    sigungu: "서울 은평구",
    dong: "구산동",
    workType: "방문요양",
    timeslot: "저녁(18~21)",
    days: ["목", "금", "토"],
    pay: "시급 15,000원",
    careSubject: "85세 여성 어르신, 수면 장애 및 보행 불안정, 야간 시간 화장실 이동 부축 및 간단한 저녁 식사 세팅",
    needDriving: false,
    prefCareer: "1년 이상",
    isActive: true
  },
  {
    id: "job-5",
    title: "마두동 어르신 산책 동행 및 가사 환기 돌보미 모집 (초보 가능)",
    centerName: "미소재가복지회",
    sigungu: "고양시 일산동구",
    dong: "마두동",
    workType: "방문요양",
    timeslot: "오후(12~18)",
    days: ["화", "목"],
    pay: "시급 14,500원",
    careSubject: "76세 남성 어르신, 재활 치료 중으로 경증 디스크, 일 3시간 마두공원 산책 동행 및 가사 빨래 세팅",
    needDriving: false,
    prefCareer: "무관",
    isActive: true
  }
];

export function evaluateJobMatch(app: ApplicantData, job: JobPosting): JobMatchResult {
  const reasons: string[] = [];
  const shortcomings: string[] = [];
  let score = 0;

  // 1. Location (Max 30 pts)
  const clean = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const cAppSig = clean(app.sigungu);
  const cJobSig = clean(job.sigungu);
  const cAppDong = clean(app.dong);
  const cJobDong = clean(job.dong);

  if (cAppSig && (cAppSig.includes(cJobSig) || cJobSig.includes(cAppSig))) {
    score += 20;
    reasons.push(`행정구 관할 일치 (${job.sigungu})`);
    
    if (cAppDong && cJobDong && (cAppDong.includes(cJobDong) || cJobDong.includes(cAppDong))) {
      score += 10;
      reasons.push(`희망 동네 극인접 매칭 (${job.dong} 거주자 우수 우대)`);
    } else {
      reasons.push(`상세 읍면동 다소 상이 (${job.dong} 시뮬레이션 이동거리 확인 필요)`);
    }
  } else if (!app.sigungu) {
    shortcomings.push("희망 지역 미입력으로 지역 우수 매칭 보류");
  } else {
    shortcomings.push(`근무지(${job.sigungu})와 지원 희망지(${app.sigungu}) 간 원거리 예상`);
  }

  // 2. Timeslot Match (Max 25 pts)
  const hasNegotiable = app.timeslots.includes("협의 가능");
  if (hasNegotiable) {
    score += 25;
    reasons.push("희망 시간대가 '협의 가능' 상태로 유연한 조정 가능");
  } else if (app.timeslots.includes(job.timeslot)) {
    score += 25;
    reasons.push(`구인 시간대(${job.timeslot})와 정확하게 가용 시간 일치 완료`);
  } else {
    shortcomings.push(`구인 시간(${job.timeslot})과 나의 가용 시간대 불일치`);
  }

  // 3. Days Match (Max 20 pts)
  if (app.days.length === 0) {
    score += 10;
    reasons.push("희망 요일이 미정으로 면접 시 유선 주간 협정 필요");
  } else {
    // Check intersection of requested days
    const matchedDays = job.days.filter(d => app.days.includes(d));
    const ratio = matchedDays.length / job.days.length;
    const dayPts = Math.round(20 * ratio);
    score += dayPts;
    if (ratio >= 0.8) {
      reasons.push(`요구 근무 요일(${job.days.join(",")}) 중 대부분 가용 가능`);
    } else if (ratio > 0) {
      reasons.push(`요일 일부 가용 가능 (${matchedDays.join(", ")} 요일 조율 예정)`);
    } else {
      shortcomings.push(`구인 요일(${job.days.join(",")})과 지원 가용 요일 어긋남`);
    }
  }

  // 4. Driving (Max 15 pts)
  if (!job.needDriving) {
    score += 15;
    reasons.push("자차 필요 없음 (대중교통 또는 인근 보행 출퇴근 가능)");
  } else {
    if (app.driving === "가능") {
      score += 15;
      reasons.push("자차 소유자 및 직접 운전 가능 우대요건 만점 획득");
    } else {
      shortcomings.push("차량 이동 필수 요건 공고이나 자차 운행 불가");
    }
  }

  // 5. License & Career Match (Max 10 pts)
  // License is required for active placement
  if (app.license === "보유") {
    score += 5;
    reasons.push("국가 공인 요양보호사 자격증 실물 등록 완료");
  } else {
    shortcomings.push("실무 연계를 위한 법적 요양보호사 자격 인증 미필");
  }

  // Career match
  let careerQualifies = false;
  if (job.prefCareer === "무관") {
    careerQualifies = true;
  } else if (job.prefCareer === "1년 이상" && (app.career === "1~3년" || app.career === "3년 이상")) {
    careerQualifies = true;
  } else if (job.prefCareer === "3년 이상" && app.career === "3년 이상") {
    careerQualifies = true;
  }

  if (careerQualifies) {
    score += 5;
    reasons.push(`공고 요구 경력 (${job.prefCareer}) 이상의 요양 숙련도 확보`);
  } else {
    shortcomings.push(`경력 우대 미충족 (지원 상태: ${app.career} / 요구: ${job.prefCareer})`);
  }

  return {
    jobId: job.id,
    score: Math.min(100, Math.max(0, score)),
    reasons,
    shortcomings
  };
}
