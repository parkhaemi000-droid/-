import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, Calendar, MapPin, Award, Clock, ArrowRight,
  CheckCircle, AlertCircle, Sparkles, Building, Briefcase, FileText,
  HelpCircle, Settings, ChevronRight, Check, Heart, ShieldCheck,
  Search, SlidersHorizontal, Send, Sparkle
} from "lucide-react";
import { ApplicantData, RecruitingTarget, SubmissionRecord, ScoringResult, JobPosting } from "./types";
import { 
  DEFAULT_TARGET, EMPTY_FORM, TIME_OPTIONS, DAY_OPTIONS, 
  WORK_TYPE_OPTIONS, CAREER_OPTIONS, LICENSE_OPTIONS, scoreApplicant 
} from "./scoring";
import { INITIAL_JOB_POSTINGS } from "./jobsData";
import ScoreDisplay from "./components/ScoreDisplay";
import AdminPanel from "./components/AdminPanel";
import MatchedJobsList from "./components/MatchedJobsList";

export default function App() {
  // Config state
  const [target, setTarget] = useState<RecruitingTarget>(() => {
    const saved = localStorage.getItem("caregiver_recruiting_target");
    return saved ? JSON.parse(saved) : DEFAULT_TARGET;
  });

  // Applicant Application data form state
  const [f, setF] = useState<ApplicantData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Submission history
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(() => {
    const saved = localStorage.getItem("caregiver_submissions");
    return saved ? JSON.parse(saved) : [];
  });

  // Active Job Postings List state (persists so custom added jobs remain visible!)
  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    const saved = localStorage.getItem("caregiver_job_postings");
    return saved ? JSON.parse(saved) : INITIAL_JOB_POSTINGS;
  });

  // Track the applied job indices
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("caregiver_applied_jobs");
    return saved ? JSON.parse(saved) : [];
  });

  // Current active mode: 'apply' | 'result' | 'admin' | 'jobs'
  const [viewMode, setViewMode] = useState<"apply" | "result" | "admin" | "jobs">("apply");
  // Single submission display (the one just submitted)
  const [justSubmitted, setJustSubmitted] = useState<ScoringResult | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("caregiver_recruiting_target", JSON.stringify(target));
  }, [target]);

  useEffect(() => {
    localStorage.setItem("caregiver_submissions", JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem("caregiver_job_postings", JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem("caregiver_applied_jobs", JSON.stringify(appliedJobIds));
  }, [appliedJobIds]);

  // Live matching calculation for real-time sidebar indicator
  const liveResult = useMemo(() => {
    return scoreApplicant(f, target);
  }, [f, target]);

  // Clean state updates
  const set = (k: keyof ApplicantData, v: any) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[k];
        return copy;
      });
    }
  };

  const toggleDay = (day: string) => {
    const nextDays = f.days.includes(day)
      ? f.days.filter((x) => x !== day)
      : [...f.days, day];
    set("days", nextDays);
  };

  const toggleTimeslot = (ts: string) => {
    const nextTs = f.timeslots.includes(ts)
      ? f.timeslots.filter((x) => x !== ts)
      : [...f.timeslots, ts];
    set("timeslots", nextTs);
  };

  // Phone number formattter
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 3 && val.length <= 7) {
      val = val.slice(0, 3) + "-" + val.slice(3);
    } else if (val.length > 7) {
      val = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7, 11);
    }
    set("phone", val.slice(0, 13));
  };

  const phoneOk = useMemo(() => {
    return /^01[0-9]-?\d{3,4}-?\d{4}$/.test(f.phone);
  }, [f.phone]);

  function validate() {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "요양보호사 성함을 입력해 주세요.";
    if (!f.phone.trim()) e.phone = "연락처(휴대폰 번호)를 입력해 주세요.";
    else if (!phoneOk) e.phone = "올바른 휴대폰 연락처 형식(010-XXXX-XXXX)을 확인해 주세요.";
    if (!f.sigungu.trim()) e.sigungu = "거주하시거나 활동을 희망하시는 시·군·구를 입력해 주세요.";
    if (!f.license) e.license = "요양보호사 전문 자격증 소지 현황을 선택해 주세요.";
    if (!f.career) e.career = "돌봄 및 요양 관련 활동 경력을 골라주세요.";
    if (f.timeslots.length === 0) e.timeslots = "최소 1개 이상의 근무 가능 시간대를 선택해야 합니다.";
    if (!f.driving) e.driving = "차량 보유 및 소요 운전 가능 여부를 선택해 주세요.";
    if (!f.agree) e.agree = "지원 진행을 위한 동의가 필수적입니다.";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) {
      // Find first error element & scroll to it
      const firstErr = document.querySelector("[data-err='true']");
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const calculated = scoreApplicant(f, target);
    setJustSubmitted(calculated);

    // Save submission record
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newRecord: SubmissionRecord = {
      id: "sub-" + Date.now(),
      data: f,
      score: calculated.total,
      lines: calculated.lines,
      warn: calculated.warn,
      submittedAt: formattedDate
    };

    setSubmissions(p => [newRecord, ...p]);
    setViewMode("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setF(EMPTY_FORM);
    setErrors({});
    setJustSubmitted(null);
    setViewMode("apply");
  }

  const handleApplyJob = (job: JobPosting, score: number) => {
    if (!appliedJobIds.includes(job.id)) {
      setAppliedJobIds(prev => [...prev, job.id]);
    }
    
    // Automatically submit their caregiver form to the recruiter dashboard for rich interactive feedback simulation
    const calculated = scoreApplicant(f, target);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const realF = { 
      ...f, 
      name: f.name.trim() || "구인 매칭 신청인", 
      sigungu: f.sigungu || job.sigungu, 
      dong: f.dong || job.dong 
    };
    
    const newRecord: SubmissionRecord = {
      id: "sub-match-" + Date.now(),
      data: realF,
      score: score, // use specific job evaluation match rating
      lines: calculated.lines,
      warn: calculated.warn,
      submittedAt: formattedDate + ` (${job.centerName} 지원)`
    };

    setSubmissions(p => [newRecord, ...p]);
  };

  const handleAddJob = (newJob: JobPosting) => {
    setJobs(prev => [newJob, ...prev]);
  };

  const handleDeleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    setAppliedJobIds(prev => prev.filter(x => x !== id));
  };

  // Prepopulate submissions with high-quality samples
  function loadSampleData() {
    const samples: SubmissionRecord[] = [
      {
        id: "sub-1",
        data: {
          name: "김영희",
          phone: "010-3342-9981",
          birth: "1972-04-12",
          sigungu: "고양시 덕양구",
          dong: "화정동",
          license: "보유",
          licenseNo: "요양-CS76543호",
          career: "3년 이상",
          etcCert: "사회복지사 2급",
          days: ["월", "화", "수", "목", "금"],
          timeslots: ["오전(09~12)", "오후(12~18)"],
          workType: "방문요양",
          driving: "가능",
          startDate: "2026-06-20",
          intro: "덕양구에서 거주하며 요양센터 경력만 4년 차인 베테랑 요양보호사입니다. 차량 소요 활동 및 병원 동행도 문제없으며 따스한 성품으로 모십니다.",
          agree: true
        },
        score: 100,
        lines: [],
        warn: false,
        submittedAt: "2026-06-16 14:22"
      },
      {
        id: "sub-2",
        data: {
          name: "박순옥",
          phone: "010-8547-2201",
          birth: "1965-11-20",
          sigungu: "고양시 일산동구",
          dong: "마두동",
          license: "보유",
          licenseNo: "요양-FS98765호",
          career: "1~3년",
          etcCert: "",
          days: ["화", "목", "토"],
          timeslots: ["오후(12~18)"],
          workType: "방문목욕",
          driving: "불가",
          startDate: "2026-06-25",
          intro: "식사동과 마두동 인근은 무리 없이 걸어서 출퇴근 가능합니다. 자차가 없어 먼 거리는 어렵지만 방문목욕과 가벼운 가사 활동은 정성껏 지원하겠습니다.",
          agree: true
        },
        score: 83,
        lines: [],
        warn: false,
        submittedAt: "2026-06-17 09:15"
      },
      {
        id: "sub-3",
        data: {
          name: "이영수",
          phone: "010-2211-5049",
          birth: "1980-08-01",
          sigungu: "서울 은평구",
          dong: "갈현동",
          license: "취득 예정",
          licenseNo: "",
          career: "신규",
          etcCert: "간호조무사",
          days: ["토", "일"],
          timeslots: ["저녁(18~21)", "협의 가능"],
          workType: "방문요양",
          driving: "가능",
          startDate: "2026-07-01",
          intro: "다음 달 자격증 최종 발급 예정인 신규 교육 수료자입니다. 간호조무사 경력이 있어 어르신의 신체 및 약물 복용 관리를 누구보다 잘 챙겨드릴 자신 있습니다.",
          agree: true
        },
        score: 48,
        lines: [],
        warn: true,
        submittedAt: "2026-06-17 18:40"
      }
    ];

    setSubmissions(samples);
  }

  function deleteSubmission(id: string) {
    setSubmissions(p => p.filter(x => x.id !== id));
  }

  function clearAllSubmissions() {
    if (confirm("모든 지원 접수 이력을 정말로 초기화하시겠습니까?")) {
      setSubmissions([]);
    }
  }

  return (
    <div className="bg-brand-bg min-h-screen text-brand-ink">
      {/* Premium Top Navigation Brand Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-line">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-white shadow-md shadow-brand-accent/20">
              <Heart className="w-5 h-5 fill-white stroke-brand-accent stroke-2" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-neutral-900">은빛재가복지센터</span>
                <span className="bg-brand-soft border border-brand-accent/15 text-brand-accent font-bold text-[10px] px-2 py-0.5 rounded-full">
                  스마트 매칭
                </span>
              </div>
              <p className="text-xs text-brand-muted font-medium">안심 돌봄 요양보호사 채용 지원 포털</p>
            </div>
          </div>

          {/* Service Tabs Mode Switches */}
          <div className="flex bg-neutral-100 p-1 rounded-xl w-full md:w-auto gap-0.5 flex-wrap">
            <button
              onClick={() => {
                if (viewMode === "result" && justSubmitted) {
                  setViewMode("result");
                } else {
                  setViewMode("apply");
                }
              }}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === "apply" || viewMode === "result"
                  ? "bg-white text-brand-accent shadow-sm"
                  : "text-brand-muted hover:text-neutral-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{viewMode === "result" ? "제출 결과 프리뷰" : "요양보호사 지원 지원서"}</span>
            </button>

            <button
              onClick={() => setViewMode("jobs")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === "jobs"
                  ? "bg-white text-brand-accent shadow-sm"
                  : "text-[#6E7E78] hover:text-[#23302C]"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>실시간 일자리 매칭</span>
              <span className="bg-[#B5754D] text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold block scale-90">
                수시 구인 중
              </span>
            </button>

            <button
              onClick={() => setViewMode("admin")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === "admin"
                  ? "bg-white text-brand-accent shadow-sm"
                  : "text-brand-muted hover:text-neutral-900"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>센터 매칭 대시보드</span>
              {submissions.length > 0 && (
                <span className="bg-brand-accent text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
                  {submissions.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* VIEW: RESULT SCREEN */}
          {viewMode === "result" && justSubmitted && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-xl mx-auto py-4"
            >
              <ScoreDisplay
                result={justSubmitted}
                applicantName={f.name}
                onReset={resetForm}
                onMoveToJobs={() => setViewMode("jobs")}
              />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setViewMode("admin")}
                  className="text-xs md:text-sm text-brand-accent font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>센터 관리자 대시보드에서 등록 내역 확인하기</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW: APPLICATION FORM VIEW */}
          {viewMode === "apply" && (
            <motion.div
              key="apply"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Form (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Intro Hero Section (Artistic Flair design theme) */}
                <div className="mb-6 bg-[#E8F1ED] p-6 md:p-8 rounded-[24px] border border-brand-line relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8 pointer-events-none" />
                  <span className="text-xs font-bold tracking-widest text-[#3F7E6B] uppercase block mb-3">Recruitment Portal</span>
                  
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex-1">
                      <h1 className="font-serif text-3.5xl md:text-[44px] leading-tight font-bold text-[#23302C]">
                        함께<br />
                        돌볼 분을<br />
                        <span className="italic text-[#B5754D]">찾습니다</span>
                      </h1>
                      <p className="text-xs md:text-sm text-[#6E7E78] mt-4 leading-relaxed max-w-lg">
                        실버 세대의 소중한 행복을 지키는 든든한 동반자가 되어주세요. 양식에 근무 여건을 작성하여 전송하시면, 센터 내부 타겟 가산 시스템에 의해 매칭도가 실시간 계산됩니다.
                      </p>
                    </div>

                    {/* Step Visualizer */}
                    <div className="flex flex-col gap-3.5 bg-white/60 p-5 rounded-[20px] border border-brand-line/50 shrink-0 w-full sm:w-64">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-brand-accent text-white rounded-full flex items-center justify-center font-bold text-xs select-none shadow-sm">1</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-[#23302C]">01 지원서 작성</span>
                          <span className="text-[10px] text-[#6E7E78]">자격 요건 실시간 기록</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-white/80 border border-[#D9E2DD] text-brand-muted rounded-full flex items-center justify-center font-bold text-xs select-none">2</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-[#6E7E78]">02 면접 안내</span>
                          <span className="text-[10px] text-[#6E7E78]">유선 상담 및 조율</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-white/80 border border-[#D9E2DD] text-brand-muted rounded-full flex items-center justify-center font-bold text-xs select-none">3</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-[11px] text-[#6E7E78]">03 최종 합격</span>
                          <span className="text-[10px] text-[#6E7E78]">든든한 동반 활동 시작</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Sections */}
                <div className="space-y-6">
                  {/* Section 1: Basic Info */}
                  <FormSection index="1" title="기본 인적 사항">
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="성함 (가입 실명)" req err={errors.name}>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                            <input
                              type="text"
                              value={f.name}
                              onChange={(e) => set("name", e.target.value)}
                              placeholder="홍길동"
                              className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-neutral-800 outline-none transition-all font-semibold ${
                                errors.name ? "border-red-500 ring-2 ring-red-100" : "border-brand-line focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                              }`}
                            />
                          </div>
                        </FormField>

                        <FormField label="연락처 (휴대폰)" req err={errors.phone}>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                            <input
                              type="text"
                              value={f.phone}
                              onChange={handlePhoneChange}
                              placeholder="010-1234-5678"
                              className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-neutral-800 font-mono outline-none transition-all font-semibold ${
                                errors.phone ? "border-red-500 ring-2 ring-red-100" : "border-brand-line focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                              }`}
                            />
                          </div>
                        </FormField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="생년월일">
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted cursor-pointer" />
                            <input
                              type="date"
                              value={f.birth}
                              onChange={(e) => set("birth", e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-line rounded-xl text-sm text-neutral-800 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                            />
                          </div>
                        </FormField>

                        <FormField label="희망 시·군·구 구역" req err={errors.sigungu}>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent" />
                            <input
                              type="text"
                              value={f.sigungu}
                              onChange={(e) => set("sigungu", e.target.value)}
                              placeholder="예: 고양시 덕양구"
                              className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-neutral-800 outline-none transition-all font-semibold ${
                                errors.sigungu ? "border-red-500 ring-2 ring-red-100" : "border-brand-line focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                              }`}
                            />
                          </div>
                          {/* Recommended regions shortcut chips */}
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {target.regions.map((reg) => (
                              <button
                                key={reg}
                                type="button"
                                onClick={() => set("sigungu", reg)}
                                className="px-2 py-0.5 bg-brand-soft hover:bg-brand-accent hover:text-white border border-brand-accent/10 rounded text-[10.5px] font-bold text-brand-accent transition-all cursor-pointer"
                              >
                                {reg}
                              </button>
                            ))}
                          </div>
                        </FormField>

                        <FormField label="세부 읍·면·동 행정구역">
                          <div className="relative">
                            <input
                              type="text"
                              value={f.dong}
                              onChange={(e) => set("dong", e.target.value)}
                              placeholder="행신동"
                              className="w-full px-3.5 py-2.5 bg-white border border-brand-line rounded-xl text-sm text-neutral-800 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                            />
                          </div>
                        </FormField>
                      </div>
                    </div>
                  </FormSection>

                  {/* Section 2: Certification & Career */}
                  <FormSection index="2" title="의료 안심 자격 및 요양 경력">
                    <div className="space-y-4">
                      <FormField label="요양보호사 전문 자격 상태" req err={errors.license}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {LICENSE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => set("license", opt.value)}
                              className={`px-4 py-3 rounded-xl border text-xs md:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                                f.license === opt.value
                                  ? "bg-brand-accent border-brand-accent text-white"
                                  : "bg-white border-brand-line text-neutral-600 hover:bg-neutral-50"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {f.license === opt.value && <Check className="w-4 h-4 stroke-[3]" />}
                            </button>
                          ))}
                        </div>
                      </FormField>

                      {f.license === "보유" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-1.5"
                        >
                          <FormField label="요양보호사 자격증 고유 번호 (선택)">
                            <input
                              type="text"
                              value={f.licenseNo}
                              onChange={(e) => set("licenseNo", e.target.value)}
                              placeholder="예: 제 2024-123456호 / 미입력 시 면접 당일 실물대조"
                              className="w-full px-4 py-2.5 bg-white border border-brand-line rounded-xl text-sm text-neutral-800 outline-none"
                            />
                          </FormField>
                        </motion.div>
                      )}

                      <FormField label="요양 및 돌봄 관련 활동 경력" req err={errors.career}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {CAREER_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => set("career", opt.value)}
                              className={`px-4 py-3 rounded-xl border text-xs md:text-sm font-bold transition-all text-center cursor-pointer ${
                                f.career === opt.value
                                  ? "bg-brand-accent border-brand-accent text-white"
                                  : "bg-white border-brand-line text-neutral-600 hover:bg-neutral-50"
                              }`}
                            >
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </FormField>

                      <FormField label="기타 우대 보유 자격 및 면허 (다중 선택 및 단어 기재)">
                        <input
                          type="text"
                          value={f.etcCert}
                          onChange={(e) => set("etcCert", e.target.value)}
                          placeholder="간호조무사, 사회복지사, 병원 동행 가능, 수어 통역 등"
                          className="w-full px-4 py-2.5 bg-white border border-brand-line rounded-xl text-sm text-neutral-800 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  {/* Section 3: Working Guidelines */}
                  <FormSection index="3" title="희망 요일 및 근무 여건">
                    <div className="space-y-4">
                      <FormField label="협의 가능한 출근 희망 요일 (다중 선택)">
                        <div className="flex flex-wrap gap-2">
                          {DAY_OPTIONS.map((day) => {
                            const isSel = f.days.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`w-11 h-11 md:w-12 md:h-12 rounded-xl border text-xs md:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                                  isSel
                                    ? "bg-brand-accent border-brand-accent text-white"
                                    : "bg-white border-brand-line text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </FormField>

                      <FormField label="활동 가능 근무 시간대 선택 (다중)" req err={errors.timeslots}>
                        <div className="flex flex-wrap gap-2.5">
                          {TIME_OPTIONS.map((ts) => {
                            const isSel = f.timeslots.includes(ts);
                            return (
                              <button
                                key={ts}
                                type="button"
                                onClick={() => toggleTimeslot(ts)}
                                className={`px-4 py-2.5 rounded-full border text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isSel
                                    ? "bg-brand-soft border-brand-accent text-brand-accent shadow-sm"
                                    : "bg-white border-brand-line text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                {isSel && <Check className="w-3.5 h-3.5 text-brand-accent font-black" />}
                                <span>{ts}</span>
                              </button>
                            );
                          })}
                        </div>
                      </FormField>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="선호하시는 요양 서비스 종류">
                          <div className="grid grid-cols-2 gap-2">
                            {WORK_TYPE_OPTIONS.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => set("workType", type)}
                                className={`px-3 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all text-center cursor-pointer ${
                                  f.workType === type
                                    ? "bg-brand-accent border-brand-accent text-white"
                                    : "bg-white border-brand-line text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </FormField>

                        <FormField label="자가 차량 소요 및 직접 운전 가능 여부" req err={errors.driving}>
                          <div className="grid grid-cols-2 gap-2">
                            {["가능", "불가"].map((drive) => (
                              <button
                                key={drive}
                                type="button"
                                onClick={() => set("driving", drive)}
                                className={`px-3 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  f.driving === drive
                                    ? "bg-brand-accent border-brand-accent text-white"
                                    : "bg-white border-brand-line text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                <span>직접 자차운전 {drive}</span>
                              </button>
                            ))}
                          </div>
                        </FormField>
                      </div>

                      <FormField label="실제 매칭 시 근무 시작 연계일">
                        <input
                          type="date"
                          value={f.startDate}
                          onChange={(e) => set("startDate", e.target.value)}
                          className="w-full max-w-sm px-4 py-2.5 bg-white border border-brand-line rounded-xl text-xs md:text-sm text-neutral-800 outline-none"
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  {/* Section 4: Cover intro letter */}
                  <FormSection index="4" title="어르신 돌봄 마음가짐 · 자기소개">
                    <FormField label="자기소개 및 어르신 케어 소신 작성 (선택)">
                      <textarea
                        value={f.intro}
                        onChange={(e) => set("intro", e.target.value)}
                        placeholder="돌봄을 행할 때의 자세나, 요직 경력, 또는 어르신을 섬김에 있어 기억에 남는 가치관을 자유로이 적어 주세요."
                        className="w-full px-4 py-3 bg-white border border-brand-line rounded-xl text-xs md:text-sm text-neutral-800 outline-none min-h-28 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                      />
                    </FormField>
                  </FormSection>
                </div>

                {/* Consent Checkmark Container */}
                <div 
                  className={`p-5 rounded-2xl border transition-all ${
                    errors.agree 
                      ? "bg-red-50/50 border-red-300 shadow-sm" 
                      : "bg-white border-brand-line hover:border-brand-accent"
                  }`}
                  data-err={!!errors.agree}
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={f.agree}
                      onChange={(e) => set("agree", e.target.checked)}
                      className="accent-brand-accent w-4 h-4 mt-0.5 rounded cursor-pointer"
                    />
                    <div className="text-xs md:text-sm font-semibold">
                      <span className="text-neutral-800 leading-relaxed block">
                        개인정보(성명, 휴대전화번호, 자격사항, 기타 소지면허 등) 수집·이용 동의 <b className="text-brand-warm">(필수)</b>
                      </span>
                      <span className="text-xs text-brand-muted font-medium block mt-1 leading-normal">
                        작성해 주신 온라인 지원 서류는 채용 및 돌봄 가용성 점검용으로 전형 진행 중에만 사용되며 개인정보보호법에 규정된 수칙에 맞춰 암호 보관합니다.
                      </span>
                    </div>
                  </label>
                  {errors.agree && (
                    <div className="mt-2.5 text-xs font-bold text-red-600 flex items-center gap-1.5 animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.agree}</span>
                    </div>
                  )}
                </div>

                {/* Main Submit Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-brand-accent hover:bg-brand-accent/90 text-white font-extrabold text-sm md:text-base rounded-2xl shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/35 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <Sparkles className="w-4 h-4 md:w-5 h-5 fill-white" />
                    <span>요양보호사 지원서 자동채점 접수하기</span>
                    <ArrowRight className="w-4 h-4 md:w-5 h-5" />
                  </button>
                  <p className="text-center text-[11.5px] text-brand-muted mt-3.5 leading-relaxed">
                    본 시스템은 상설 실시간 매칭 채점을 제공하는 <b>인사 체험 포털</b>입니다. <br />
                    실제 데이터 서버 보관 없이 local Sandbox 안에서만 계산 과정을 시뮬레이션합니다.
                  </p>
                </div>

              </div>

              {/* Right Widget: Real-time calculation previews (4 Cols) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
                <div className="bg-white border border-brand-line rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3.5 border-b border-brand-line/50 pb-3">
                    <div className="p-1 px-2.5 rounded-full bg-brand-soft text-[10px] font-black text-brand-accent uppercase tracking-wider">
                      실시간 동태계산
                    </div>
                    <span className="text-xs text-brand-muted font-bold">나의 실시간 산정점수</span>
                  </div>

                  <div className="text-center py-4">
                    <div className="text-5xl font-black tracking-tight text-neutral-900 flex items-baseline justify-center">
                      <span>{liveResult.total}</span>
                      <span className="text-sm text-brand-muted font-bold ml-1">/ 100점</span>
                    </div>
                    {/* Live label based on matching */}
                    <p className="text-xs font-bold mt-2 font-mono text-brand-accent">
                      {liveResult.total >= 90 ? "★ 채용 최적격 대상군" : liveResult.total >= 70 ? "✔ 매칭 가능 범위" : "▲ 조율 및 보완 권장"}
                    </p>
                  </div>

                  {/* Criteria matching logs */}
                  <div className="space-y-3 mt-4 pt-4 border-t border-brand-line/50">
                    <span className="text-[10px] font-black uppercase text-brand-muted block">요목별 기여 비중</span>
                    {liveResult.lines.map((ln, idx) => {
                      const complete = ln.pt > 0;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-neutral-600 flex items-center gap-1.5 font-medium">
                            <span className={`w-1.5 h-1.5 rounded-full ${complete ? "bg-brand-accent" : "bg-neutral-300"}`} />
                            {ln.label.split("(")[0]}
                          </span>
                          <span className="font-bold text-neutral-800">
                            {ln.pt}<span className="text-neutral-400 font-normal">/{ln.max}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {liveResult.warn && (
                    <div className="mt-4 bg-orange-50 border border-orange-100 p-3 rounded-xl text-[11px] text-brand-warm leading-relaxed font-semibold">
                      현재 미소지(취득예정/미보유) 체크 상태이므로 서류 통과 후 즉시 실물 계약이 한시적으로 유예될 수 있습니다.
                    </div>
                  )}
                </div>

                {/* Score weights card */}
                <div className="bg-brand-soft/40 border border-brand-line rounded-2xl p-6">
                  <h4 className="text-xs font-black text-brand-accent flex items-center gap-1.5 uppercase tracking-wider mb-3">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    복지센터 채용 기획조건
                  </h4>
                  <ul className="space-y-2.5 text-xs text-brand-muted">
                    <li className="flex justify-between items-center">
                      <span>1순위: 활동 경력 자격</span>
                      <span className="font-bold text-neutral-800">최대 {target.weights.career}점</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>2순위: 국가 라이업 자격</span>
                      <span className="font-bold text-neutral-800">최대 {target.weights.license}점</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>3순위: 구역 인접 매칭지</span>
                      <span className="font-bold text-neutral-800">최대 {target.weights.region}점</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>4순위: 시간대 교차 부합성</span>
                      <span className="font-bold text-neutral-800">최대 {target.weights.timeslot}점</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>5순위: 실비 자차 기동성</span>
                      <span className="font-bold text-neutral-800">최대 {target.weights.driving}점</span>
                    </li>
                  </ul>
                  <div className="mt-4 pt-3 border-t border-brand-line/40 text-[10.5px] leading-relaxed text-brand-muted flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                    <span>해당 점수 배점이나 조건은 상단 탭의 <b>'센터 매칭 대시보드'</b> 설정에서 임의대로 조절 가능합니다.</span>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* VIEW: JOB MATCHING LIST */}
          {viewMode === "jobs" && (
            <motion.div
              layout
              key="jobs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MatchedJobsList
                applicant={f}
                jobs={jobs}
                onApplyJob={handleApplyJob}
                appliedJobIds={appliedJobIds}
                onNavigateToAdmin={() => setViewMode("admin")}
              />
            </motion.div>
          )}

          {/* VIEW: RECRUITER PORTAL VIEW */}
          {viewMode === "admin" && (
            <motion.div
              layout
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <AdminPanel
                target={target}
                onChangeTarget={setTarget}
                submissions={submissions}
                onDeleteSubmission={deleteSubmission}
                onClearSubmissions={clearAllSubmissions}
                onLoadSamples={loadSampleData}
                jobs={jobs}
                onAddJob={handleAddJob}
                onDeleteJob={handleDeleteJob}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Aesthetic Footer */}
      <footer className="border-t border-brand-line mt-16 bg-white py-10 text-center text-xs text-brand-muted">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-neutral-700">은빛재가요양보호사 채용 지원 및 지능형 자동 배점 매칭 시스템</p>
          <p className="max-w-xl mx-auto leading-relaxed text-[11px]">
            본 웹 어플리케이션은 인사기획 효율화를 실무적으로 검토해볼 수 있는 <b>대화형 채점 프로토타입</b>입니다. 개인 식별 민감정보 및 입사 서류는 그 어떠한 데이터베이스 서버에도 저장 및 전송되지 않고 개인 안전 크롬 Sandbox 안에서 한정 유지됩니다.
          </p>
          <p className="text-neutral-400 pt-3 font-mono">© 2026 은빛재가복지센터. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Helper: Form Section Visual Card Layout
interface SectionProps {
  index: string;
  title: string;
  children: React.ReactNode;
}
function FormSection({ index, title, children }: SectionProps) {
  return (
    <section className="bg-white border border-brand-line rounded-[24px] p-6 md:p-8 transition-all hover:shadow-md/5">
      <div className="flex items-center gap-3.5 mb-6 border-b border-brand-line/40 pb-4">
        <div className="w-8 h-8 rounded-full bg-[#E8F1ED] text-[#3F7E6B] flex items-center justify-center font-bold text-sm">
          {index}
        </div>
        <h2 className="text-base md:text-[18px] font-bold text-[#23302C] tracking-tight">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

// Helper: Form Input Label & Error Visual Wrapper
interface FormFieldProps {
  label: string;
  req?: boolean;
  err?: string;
  children: React.ReactNode;
}
function FormField({ label, req, err, children }: FormFieldProps) {
  return (
    <div className="flex-1" data-err={!!err}>
      <label className="block text-xs md:text-sm font-bold text-neutral-800 mb-1.5 flex items-center gap-1">
        <span>{label}</span>
        {req && <span className="text-brand-warm font-black animate-pulse">*</span>}
      </label>
      {children}
      {err && (
        <p className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{err}</span>
        </p>
      )}
    </div>
  );
}
