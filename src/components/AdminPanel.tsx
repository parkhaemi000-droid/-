import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, Users, ShieldAlert, Sliders, CheckCircle, MapPin, 
  Clock, Trash2, Calendar, FileText, Search, Plus, X, Phone, User, RefreshCw,
  Briefcase, DollarSign, BookOpen
} from "lucide-react";
import { RecruitingTarget, SubmissionRecord, JobPosting } from "../types";
import { scoreApplicant, TIME_OPTIONS } from "../scoring";
import { evaluateJobMatch } from "../jobsData";

interface AdminPanelProps {
  target: RecruitingTarget;
  onChangeTarget: (newTarget: RecruitingTarget) => void;
  submissions: SubmissionRecord[];
  onDeleteSubmission: (id: string) => void;
  onClearSubmissions: () => void;
  onLoadSamples: () => void;
  jobs: JobPosting[];
  onAddJob: (job: JobPosting) => void;
  onDeleteJob: (id: string) => void;
}

export default function AdminPanel({
  target,
  onChangeTarget,
  submissions,
  onDeleteSubmission,
  onClearSubmissions,
  onLoadSamples,
  jobs,
  onAddJob,
  onDeleteJob,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "submissions" | "jobs">("submissions");
  const [newRegion, setNewRegion] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);

  // Search & Filter state for submissions
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState<number>(0);
  const [licenseFilter, setLicenseFilter] = useState<string>("all"); // 'all' | '보유' | '미보유/취득예정'

  // Job Posting Form state
  const [jobTitle, setJobTitle] = useState("");
  const [jobCenter, setJobCenter] = useState("은빛재가복지센터");
  const [jobSigungu, setJobSigungu] = useState("고양시 덕양구");
  const [jobDong, setJobDong] = useState("");
  const [jobWorkType, setJobWorkType] = useState("방문요양");
  const [jobTimeslot, setJobTimeslot] = useState("오후(12~18)");
  const [jobDays, setJobDays] = useState<string[]>(["월", "수", "금"]);
  const [jobPay, setJobPay] = useState("시급 14,800원");
  const [jobCareSubject, setJobCareSubject] = useState("");
  const [jobNeedDriving, setJobNeedDriving] = useState(false);
  const [jobPrefCareer, setJobPrefCareer] = useState("무관");
  const [formMsg, setFormMsg] = useState("");

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDong.trim() || !jobCareSubject.trim()) {
      setFormMsg("※ 모든 필수 기입란(공고 제목, 읍면동 위치, 케어 대상자 진단상황)을 채워주십시오.");
      return;
    }
    
    const newJob: JobPosting = {
      id: "job-" + Date.now(),
      title: jobTitle,
      centerName: jobCenter,
      sigungu: jobSigungu,
      dong: jobDong,
      workType: jobWorkType,
      timeslot: jobTimeslot,
      days: jobDays,
      pay: jobPay,
      careSubject: jobCareSubject,
      needDriving: jobNeedDriving,
      prefCareer: jobPrefCareer,
      isActive: true
    };

    onAddJob(newJob);
    
    // reset form
    setJobTitle("");
    setJobDong("");
    setJobCareSubject("");
    setJobNeedDriving(false);
    setFormMsg("✓ 새 매칭 구인 공고가 성공적으로 배포되었습니다!");
    setTimeout(() => setFormMsg(""), 4000);
  };

  const toggleFormDay = (day: string) => {
    setJobDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Calculations for average metrics
  const totalWeight = Object.values(target.weights).reduce((a, b) => a + b, 0);

  // Dynamic sliders weight updater
  const handleWeightChange = (key: keyof typeof target.weights, val: number) => {
    const updatedWeights = { ...target.weights, [key]: val };
    onChangeTarget({
      ...target,
      weights: updatedWeights,
    });
  };

  // Add tag/chip to target regions
  const addRegion = () => {
    if (newRegion.trim() && !target.regions.includes(newRegion.trim())) {
      onChangeTarget({
        ...target,
        regions: [...target.regions, newRegion.trim()],
      });
      setNewRegion("");
    }
  };

  const removeRegion = (reg: string) => {
    onChangeTarget({
      ...target,
      regions: target.regions.filter((r) => r !== reg),
    });
  };

  // Toggle timeslot selection in Target
  const toggleTimeslot = (ts: string) => {
    const isSelected = target.timeslots.includes(ts);
    onChangeTarget({
      ...target,
      timeslots: isSelected
        ? target.timeslots.filter((t) => t !== ts)
        : [...target.timeslots, ts],
    });
  };

  // Recalculate submitted item scores when weights or targets change
  const reEvaluatedSubmissions = submissions.map((sub) => {
    const reCalc = scoreApplicant(sub.data, target);
    return {
      ...sub,
      score: reCalc.total,
      lines: reCalc.lines,
      warn: reCalc.warn,
    };
  });

  // Filter submissions
  const filteredSubmissions = reEvaluatedSubmissions.filter((sub) => {
    const matchSearch =
      sub.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.data.sigungu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.data.dong && sub.data.dong.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchMinScore = sub.score >= minScore;

    let matchLicense = true;
    if (licenseFilter === "보유") {
      matchLicense = sub.data.license === "보유";
    } else if (licenseFilter === "미보유") {
      matchLicense = sub.data.license !== "보유";
    }

    return matchSearch && matchMinScore && matchLicense;
  });

  return (
    <div className="bg-white border border-brand-line rounded-2xl overflow-hidden shadow-sm">
      {/* Admin Panel Header / Mode Tab */}
      <div className="bg-brand-soft/70 border-b border-brand-line p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 rounded-md bg-brand-accent/10 text-brand-accent font-bold text-xs uppercase tracking-wider">포탈 관리기</span>
            <span className="text-xs text-brand-muted font-semibold">복지센터 인사채용 체험 시뮬레이터</span>
          </div>
          <h2 className="text-lg font-extrabold text-neutral-900 mt-1">센터 인사담당자 보드</h2>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-neutral-200/60 p-1 rounded-xl self-stretch sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "submissions"
                ? "bg-white text-brand-accent shadow-sm"
                : "text-brand-muted hover:text-neutral-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>지원자 매칭 현황 ({filteredSubmissions.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab("jobs")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "jobs"
                ? "bg-white text-brand-accent shadow-sm"
                : "text-brand-muted hover:text-neutral-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>연계 구인공고 관리 ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "settings"
                ? "bg-white text-brand-accent shadow-sm"
                : "text-brand-muted hover:text-neutral-900"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>매칭 가중치 설정</span>
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* TAB 1: SUBMISSIONS MANAGEMENT */}
        {activeTab === "submissions" && (
          <div>
            {/* Quick Actions & Filters */}
            <div className="flex flex-col xl:flex-row gap-4 mb-5 pb-5 border-b border-brand-line/60">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                  type="text"
                  placeholder="지원지 이름, 구/군, 동 명칭 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-brand-bg/50 border border-brand-line rounded-xl text-sm text-brand-ink outline-none focus:border-brand-accent focus:bg-white transition-all font-sans"
                />
              </div>

              {/* Filters Panel */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-brand-muted">자격 상태:</span>
                  <select
                    value={licenseFilter}
                    onChange={(e) => setLicenseFilter(e.target.value)}
                    className="p-1 px-2.5 bg-brand-bg border border-brand-line rounded-lg text-xs text-brand-ink outline-none cursor-pointer"
                  >
                    <option value="all">전체</option>
                    <option value="보유">자격 보유자</option>
                    <option value="미보유">미보유/취득예정</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-brand-muted">최소 점수:</span>
                  <span className="w-8 text-right text-brand-accent">{minScore}점</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-24 accent-brand-accent h-1 bg-brand-line rounded-lg cursor-pointer"
                  />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {submissions.length === 0 ? (
                    <button
                      onClick={onLoadSamples}
                      className="px-3 py-1.5 text-xs font-bold bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>체험용 샘플 3건 채우기</span>
                    </button>
                  ) : (
                    <button
                      onClick={onClearSubmissions}
                      className="px-3 py-1.5 text-xs font-bold border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>목록 전체 삭제</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submissions List Grid */}
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-brand-bg/30 rounded-xl border border-dashed border-brand-line">
                <Users className="w-10 h-10 text-brand-muted mx-auto opacity-55 mb-2" />
                <h4 className="text-sm font-extrabold text-neutral-800">접수된 요양보호사 서류가 없습니다</h4>
                <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
                  좌측에서 신규 지원을 작성하여 접수해 주시거나, "체험용 샘플 3건 채우기" 버튼을 클릭하여 시뮬레이션을 즐겨보세요!
                </p>
                {submissions.length === 0 && (
                  <button
                    onClick={onLoadSamples}
                    className="mt-4 px-4 py-2 bg-brand-accent text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>체험용 샘플 데이터 자동 채우기</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => {
                  const score = sub.score;
                  let scorePill = "bg-red-50 border-red-100 text-red-600";
                  if (score >= 90) scorePill = "bg-green-50 border-green-200 text-green-700";
                  else if (score >= 70) scorePill = "bg-brand-soft border-brand-line text-brand-accent";
                  else if (score >= 50) scorePill = "bg-orange-50 border-orange-200 text-brand-warm";

                  return (
                    <motion.div
                      layout
                      key={sub.id}
                      className={`border rounded-xl transition-all hover:bg-neutral-50/50 cursor-pointer ${
                        selectedSubmission?.id === sub.id
                          ? "border-brand-accent ring-1 ring-brand-accent/20 bg-brand-soft/20"
                          : "border-brand-line bg-white"
                      }`}
                      onClick={() => setSelectedSubmission(selectedSubmission?.id === sub.id ? null : sub)}
                    >
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                        <div className="flex items-start gap-3">
                          {/* Circle Avatar */}
                          <div className="w-10 h-10 rounded-full bg-brand-soft/80 flex items-center justify-center text-brand-accent text-sm font-extrabold shrink-0">
                            {sub.data.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm md:text-base text-neutral-900">
                                {sub.data.name}
                              </span>
                              <span className="text-xs text-brand-muted">
                                ({sub.data.birth ? sub.data.birth.slice(2, 4) + "년생" : "연령미상"})
                              </span>
                              {sub.warn && (
                                <span className="bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5 border border-red-200/50">
                                  <ShieldAlert className="w-2.5 h-2.5" />
                                  자격 미필
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 mt-1 text-xs text-brand-muted">
                              <span className="flex items-center gap-0.5 font-semibold">
                                <MapPin className="w-3.5 h-3.5 text-brand-accent" />
                                {sub.data.sigungu} {sub.data.dong}
                              </span>
                              <span className="w-1 h-1 bg-brand-neutral/30 rounded-full hidden sm:inline" />
                              <span className="font-mono">{sub.data.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score Indicator */}
                        <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-brand-line/40">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-bold text-brand-muted block">경력 조건</span>
                            <span className="text-xs font-bold text-brand-ink">{sub.data.career}</span>
                          </div>
                          
                          <div className="w-px h-6 bg-brand-line hidden md:block" />

                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-bold text-brand-muted block">자차 운전</span>
                            <span className={`text-xs font-bold ${sub.data.driving === '가능' ? 'text-brand-accent' : 'text-brand-muted'}`}>
                              {sub.data.driving || '미정'}
                            </span>
                          </div>

                          <div className="w-px h-6 bg-brand-line hidden md:block" />

                          <div className={`px-3 py-1.5 rounded-lg border text-sm font-black flex items-center gap-1 ${scorePill}`}>
                            <span className="text-xs font-semibold text-neutral-500">매칭도</span>
                            <span>{score}점</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Mode Details */}
                      <AnimatePresence>
                        {selectedSubmission?.id === sub.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-brand-line bg-zinc-50/50"
                          >
                            <div className="p-4 md:p-5 text-xs md:text-sm grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Left Column: matching criteria breakdown */}
                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-bold text-neutral-700 flex items-center gap-1.5 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-brand-accent" />
                                    활동 희망 여건
                                  </h5>
                                  <table className="w-full text-left border-collapse">
                                    <tbody>
                                      <tr className="border-b border-brand-line/40">
                                        <td className="py-1.5 text-brand-muted font-bold w-24">희망 요일</td>
                                        <td className="py-1.5 text-brand-ink font-semibold">
                                          {sub.data.days.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {sub.data.days.map((d) => (
                                                <span key={d} className="bg-white border border-brand-line px-1.5 py-0.5 rounded text-[11px] font-bold">
                                                  {d}요일
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            "요일 협의"
                                          )}
                                        </td>
                                      </tr>
                                      <tr className="border-b border-brand-line/40">
                                        <td className="py-1.5 text-brand-muted font-bold">희망 시간</td>
                                        <td className="py-1.5 text-brand-ink font-semibold">
                                          {sub.data.timeslots.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {sub.data.timeslots.map((t) => (
                                                <span key={t} className="bg-brand-soft border border-brand-accent/20 px-1.5 py-0.5 rounded text-[11px] font-bold text-brand-accent">
                                                  {t}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            "시간 협의"
                                          )}
                                        </td>
                                      </tr>
                                      <tr className="border-b border-brand-line/40">
                                        <td className="py-1.5 text-brand-muted font-bold">근무 형태</td>
                                        <td className="py-1.5 text-brand-ink font-semibold">
                                          {sub.data.workType || "무관"}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="py-1.5 text-brand-muted font-bold">기타 자격증</td>
                                        <td className="py-1.5 text-brand-ink font-normal italic text-neutral-600">
                                          {sub.data.etcCert || "없음"}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                <div className="bg-white border border-brand-line rounded-xl p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-xs text-neutral-700">채용 매칭 점수표</span>
                                    <span className="font-bold text-xs text-brand-accent">총 {score}점</span>
                                  </div>
                                  <div className="space-y-1.5 text-[11px]">
                                    {sub.lines.map((line, idx) => (
                                      <div key={idx} className="flex justify-between items-center">
                                        <span className="text-brand-muted">{line.label}</span>
                                        <span className="font-bold">{line.pt} / {line.max}점</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Right Column: Statement of Interest & actions */}
                              <div className="flex flex-col justify-between gap-4">
                                <div className="space-y-2">
                                  <h5 className="font-bold text-neutral-700 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-brand-accent" />
                                    자기소개 및 포부
                                  </h5>
                                  <div className="bg-white border border-brand-line rounded-xl p-3 font-medium text-brand-ink leading-relaxed text-xs overflow-y-auto max-h-34 italic">
                                    {sub.data.intro ? `"${sub.data.intro}"` : "등록된 자기소개 한마디가 없습니다."}
                                  </div>
                                  {sub.data.licenseNo && (
                                    <div className="text-[11px] text-brand-muted pt-1">
                                      <span className="font-bold">제출 면허번호:</span> <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">{sub.data.licenseNo}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-brand-line/40 justify-between">
                                  <span className="text-[11px] text-brand-muted font-mono leading-none">
                                    접수일시: {sub.submittedAt}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSubmission(sub.id);
                                    }}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1 font-bold text-xs cursor-pointer"
                                    title="지원서 삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>서류 반려/삭제</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVE JOB OPENINGS MANAGEMENT */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="bg-[#E8F1ED] border border-brand-accent/20 p-4 rounded-xl text-xs md:text-sm font-medium leading-relaxed text-[#3F7E6B] flex items-start gap-2.5">
              <Briefcase className="w-5 h-5 shrink-0 mt-0.5 text-brand-accent stroke-[2.5]" />
              <div>
                <p className="font-bold">스마트 요양 구인공고 리메치 엔진</p>
                <p className="font-normal text-[#6E7E78] mt-0.5">
                  현재 등록/운영 중인 요양보호복지 채용 요강들을 수정/조정하고 가선점을 배포할 수 있는 허브입니다. 오른쪽 입력폼에서 가매칭 전용 공고를 신규 작성하시면, 채용정보 사이트에 즉각 등재되어 실시간 후보군이 추천 완료됩니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Active Postings & Matches sorted by Compatibility (col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-bold text-[#23302C] border-b border-brand-line/50 pb-2 flex items-center justify-between">
                  <span>게재 중인 일자리 공고 ({jobs.length}건)</span>
                  <span className="text-[10px] text-brand-muted">각 공고클릭 시 지원자 결합율 순시 집계</span>
                </h3>

                <div className="space-y-3.5">
                  {jobs.map((job) => {
                    // Find all applicant submissions and sort them specifically for this job posting
                    const candidatesMatched = submissions.map(sub => {
                      const matchRes = evaluateJobMatch(sub.data, job);
                      return {
                        record: sub,
                        score: matchRes.score,
                        reasons: matchRes.reasons
                      };
                    }).sort((a, b) => b.score - a.score);

                    return (
                      <div key={job.id} className="bg-white border border-brand-line rounded-2xl p-4 md:p-5 relative overflow-hidden shadow-sm hover:shadow-md/5 transition-all">
                        
                        {/* Delete button */}
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="absolute right-4 top-4 p-1.5 text-[#6E7E78] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="공고 즉시 마감 및 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-1.5 pr-8">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-white bg-brand-accent px-2 py-0.5 rounded-full">
                              {job.centerName}
                            </span>
                            <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                              {job.sigungu} {job.dong}
                            </span>
                            <span className="text-[10px] text-brand-warm bg-brand-soft px-2 py-0.5 rounded font-bold">
                              {job.pay}
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-[#23302C] text-sm md:text-base leading-snug">
                            {job.title}
                          </h4>

                          <p className="text-xs text-neutral-500 leading-relaxed bg-brand-bg/60 p-2.5 rounded-xl border border-brand-line/40">
                            <b>요구 요약:</b> {job.careSubject} (운전 요망: {job.needDriving ? '자차 필수' : '해당없음'} / 경력 {job.prefCareer} 우대)
                          </p>
                        </div>

                        {/* Fit Candidate match summary inside this job frame */}
                        <div className="mt-4 pt-3.5 border-t border-brand-line/50">
                          <span className="text-[10px] font-black text-[#6E7E78] tracking-widest uppercase block mb-2">
                            인접 지원자 매치 지수 순위 (총 {candidatesMatched.length}명 대조)
                          </span>

                          <div className="space-y-1.5">
                            {candidatesMatched.map(({ record, score }) => {
                              let rateBg = "bg-neutral-100 text-neutral-600";
                              if (score >= 90) rateBg = "bg-green-50 text-green-700 font-extrabold";
                              else if (score >= 70) rateBg = "bg-[#E8F1ED] text-[#3F7E6B] font-bold";
                              else if (score >= 50) rateBg = "bg-orange-50 text-brand-warm";

                              return (
                                <div key={record.id} className="flex items-center justify-between p-2 rounded-xl bg-brand-bg/30 border border-brand-line/40 text-[11px] md:text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-neutral-800">{record.data.name} 요양보호사</span>
                                    <span className="text-neutral-500 text-[10px]">({record.data.sigungu}ㆍ{record.data.career})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${rateBg}`}>
                                      일치율 {score}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {candidatesMatched.length === 0 && (
                              <div className="text-[11px] text-brand-muted italic py-1">
                                접수된 이력 서류가 부족하여 실시간 자격 대수화 대조를 보류 중입니다.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Add New Opening Form (col-span-5) */}
              <div className="lg:col-span-5 bg-white border border-brand-line rounded-2xl p-5 md:p-6 shadow-sm">
                <h3 className="text-sm font-bold text-[#23302C] border-b border-brand-line/50 pb-2 mb-4 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-brand-accent" />
                  <span>새 요양 채용공고 등록</span>
                </h3>

                <form onSubmit={handleCreateJob} className="space-y-4">
                  
                  {/* Job Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      공고 제목 (필수)
                    </label>
                    <input
                      type="text"
                      placeholder="예: 백석동 어르신 오후 가사 및 산책 동행 지원"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none focus:border-brand-accent focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Center Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        위탁 복지센터 명칭
                      </label>
                      <input
                        type="text"
                        value={jobCenter}
                        onChange={(e) => setJobCenter(e.target.value)}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        급여 지급요건
                      </label>
                      <input
                        type="text"
                        value={jobPay}
                        onChange={(e) => setJobPay(e.target.value)}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none"
                      />
                    </div>
                  </div>

                  {/* Location Area selects */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        근무 관할구역
                      </label>
                      <select
                        value={jobSigungu}
                        onChange={(e) => setJobSigungu(e.target.value)}
                        className="w-full p-2 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none cursor-pointer"
                      >
                        <option value="고양시 덕양구">고양시 덕양구</option>
                        <option value="고양시 일산동구">고양시 일산동구</option>
                        <option value="고양시 일산서구">고양시 일산서구</option>
                        <option value="서울 은평구">서울 은평구</option>
                        <option value="서울 마포구">서울 마포구</option>
                        <option value="기타 권역">기타 권역</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        읍면동 위치 (필수)
                      </label>
                      <input
                        type="text"
                        placeholder="예: 행신동, 장항동"
                        value={jobDong}
                        onChange={(e) => setJobDong(e.target.value)}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none focus:border-brand-accent focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* WorkType & Timeslot */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        돌봄 근무 형태
                      </label>
                      <select
                        value={jobWorkType}
                        onChange={(e) => setJobWorkType(e.target.value)}
                        className="w-full p-2 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none"
                      >
                        <option value="방문요양">방문요양</option>
                        <option value="방문목욕">방문목욕</option>
                        <option value="주야간보호">주야간보호</option>
                        <option value="입소시설">입소시설 요양원</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        시간대
                      </label>
                      <select
                        value={jobTimeslot}
                        onChange={(e) => setJobTimeslot(e.target.value)}
                        className="w-full p-2 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none"
                      >
                        <option value="오전(09~12)">오전(09~12)</option>
                        <option value="오후(12~18)">오후(12~18)</option>
                        <option value="저녁(18~21)">저녁(18~21)</option>
                        <option value="야간/입주">야간/입주</option>
                      </select>
                    </div>
                  </div>

                  {/* Selected Days checkboxes */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      근무 요일 선택
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {["월", "화", "수", "목", "금", "토", "일"].map((day) => {
                        const active = jobDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => toggleFormDay(day)}
                            className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              active 
                                ? "bg-brand-accent border-brand-accent text-white" 
                                : "bg-neutral-50 border-brand-line text-neutral-400"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Driving & Preference conditions */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 bg-neutral-50 p-2 border border-brand-line rounded-xl cursor-pointer text-xs select-none hover:bg-neutral-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={jobNeedDriving}
                        onChange={(e) => setJobNeedDriving(e.target.checked)}
                        className="accent-brand-accent w-4 h-4"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[11px]">자차 필요 조건</span>
                        <span className="text-[9px] text-[#6E7E78]">운전자 우대 공고</span>
                      </div>
                    </label>

                    <div>
                      <select
                        value={jobPrefCareer}
                        onChange={(e) => setJobPrefCareer(e.target.value)}
                        className="w-full p-2.5 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none cursor-pointer"
                      >
                        <option value="무관">경력 요건 무관</option>
                        <option value="1년 이상">경력 1년 이상 우대</option>
                        <option value="3년 이상">경력 3년 이상 고숙련</option>
                      </select>
                    </div>
                  </div>

                  {/* Patient care situation detail text */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      케어 대상자 진단상황 및 지침 (필수)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="예: 82세 남성 어르신, 고혈압 보유 및 인근 마트 산책 보조 지원 필수"
                      value={jobCareSubject}
                      onChange={(e) => setJobCareSubject(e.target.value)}
                      className="w-full p-2 px-3 bg-brand-bg border border-brand-line rounded-xl text-xs text-brand-ink outline-none focus:border-brand-accent focus:bg-white transition-all font-sans resize-none"
                      required
                    />
                  </div>

                  {/* Message notification */}
                  {formMsg && (
                    <div className="text-[11px] font-bold text-center block pt-1 animate-pulse" style={{ color: formMsg.startsWith("※") ? "#B5754D" : "#3F7E6B" }}>
                      {formMsg}
                    </div>
                  )}

                  {/* Submit create button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#E8F1ED] hover:bg-[#D9E9E2] text-brand-accent font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>실시간 매칭용 새 구인공고 올리기</span>
                  </button>

                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PARAMETERS SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-brand-soft border border-brand-accent/20 p-4 rounded-xl text-xs md:text-sm font-medium leading-relaxed text-brand-accent">
              <Sliders className="w-5 h-5 mb-1.5 stroke-[2.5]" />
              <p className="font-bold">인사 및 모집 여건 조율 가이드</p>
              <p className="font-normal text-brand-muted mt-0.5">
                센터에 접수되는 요양보호사 지원서들의 점수 산정 조건(가중치 배점 & 필수 자격 요건)을 실시간으로 조절해 보실 수 있습니다. 설정값이 바뀌면 요양보호사들이 매칭율에 맞춰 가산점을 실시간으로 다르게 획득합니다. (배점 합계: {totalWeight}점)
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Settings: Weights */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-neutral-900 border-b border-brand-line/60 pb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-brand-accent" />
                  평가 점수 비중 조율 (기본 합 100)
                </h3>

                <div className="space-y-4">
                  {/* Career Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-brand-ink">활동 경력 비중</span>
                      <span className="text-brand-accent">{target.weights.career}점</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={target.weights.career}
                      onChange={(e) => handleWeightChange("career", Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 accent-brand-accent rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-brand-muted block mt-0.5">
                      3년 이상 최고점에 미치는 만점 영향도 (기본 35점)
                    </span>
                  </div>

                  {/* License Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-brand-ink">국가 자격증 보유 비중</span>
                      <span className="text-brand-accent">{target.weights.license}점</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={target.weights.license}
                      onChange={(e) => handleWeightChange("license", Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 accent-brand-accent rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-brand-muted block mt-0.5">
                      자격증 소유 여부에 대한 기본 환산 배점 (기본 25점)
                    </span>
                  </div>

                  {/* Region Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-brand-ink">희망 지역 권역 일치 배점</span>
                      <span className="text-brand-accent">{target.weights.region}점</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={target.weights.region}
                      onChange={(e) => handleWeightChange("region", Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 accent-brand-accent rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-brand-muted block mt-0.5">
                      센터 모집 권역과 일치하는 거주자인 경우 (기본 20점)
                    </span>
                  </div>

                  {/* Timeslot Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-brand-ink">근무 요망 시간대 합치율</span>
                      <span className="text-brand-accent">{target.weights.timeslot}점</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={target.weights.timeslot}
                      onChange={(e) => handleWeightChange("timeslot", Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 accent-brand-accent rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-brand-muted block mt-0.5">
                      요구 조건(오전/오후)과 시간이 몇 개 겹치느냐의 가산 (기본 12점)
                    </span>
                  </div>

                  {/* Driving Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-brand-ink">자차 활동/운전 가능 배점</span>
                      <span className="text-brand-accent">{target.weights.driving}점</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={target.weights.driving}
                      onChange={(e) => handleWeightChange("driving", Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 accent-brand-accent rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-brand-muted block mt-0.5">
                      방문요양 특성상 차량 지원 가능 여부 점수화 (기본 8점)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Settings: Target Regions & Conditions */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 border-b border-brand-line/60 pb-1.5 flex items-center gap-1.5 mb-3">
                    <MapPin className="w-4 h-4 text-brand-accent" />
                    센터 집중 타겟 모집 행정 구역
                  </h3>

                  {/* Add and List Regions */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="예: 고양시 일산서구, 마포구"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addRegion()}
                      className="flex-1 px-3 py-1.5 bg-brand-bg border border-brand-line rounded-lg text-xs md:text-sm text-brand-ink outline-none"
                    />
                    <button
                      onClick={addRegion}
                      className="p-2 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {target.regions.map((reg) => (
                      <span
                        key={reg}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-white border border-brand-neutral/30 rounded-full text-xs font-bold text-brand-ink select-none"
                      >
                        <span>{reg}</span>
                        <button
                          onClick={() => removeRegion(reg)}
                          className="hover:bg-neutral-100 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-neutral-400 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                    {target.regions.length === 0 && (
                      <span className="text-xs text-brand-warm italic">등록된 타겟 지역 없음 (전국 단위)</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 border-b border-brand-line/60 pb-1.5 flex items-center gap-1.5 mb-3">
                    <Clock className="w-4 h-4 text-brand-accent" />
                    센터 집중 구인 시간대 조건
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.filter(opt => opt !== "협의 가능").map((ts) => {
                      const active = target.timeslots.includes(ts);
                      return (
                        <button
                          key={ts}
                          type="button"
                          onClick={() => toggleTimeslot(ts)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? "bg-brand-accent border-brand-accent text-white"
                              : "bg-white border-brand-line text-neutral-500 hover:text-neutral-700"
                          }`}
                        >
                          {ts}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 border-b border-brand-line/60 pb-1.5 flex items-center gap-1.5 mb-3">
                    <CheckCircle className="w-4 h-4 text-brand-accent" />
                    자차 소유 · 운전 여부 조건
                  </h3>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs md:text-sm font-semibold select-none bg-brand-bg/50 border border-brand-line p-3 rounded-xl hover:bg-brand-bg transition-all">
                    <input
                      type="checkbox"
                      checked={target.needDriving}
                      onChange={(e) =>
                        onChangeTarget({ ...target, needDriving: e.target.checked })
                      }
                      className="accent-brand-accent w-4 h-4"
                    />
                    <div>
                      <span className="block font-bold">자차 운전 '가능' 지원자 필수 체크</span>
                      <span className="text-[10.5px] text-brand-muted font-normal block mt-0.5">
                        운전 불가자는 가산점(기본 8점)을 받지 못하게 됩니다. 체크 해제 시 모든 지원자가 최고 만점을 획득합니다.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
