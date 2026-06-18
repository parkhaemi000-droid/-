import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Briefcase, MapPin, Clock, DollarSign, Star, AlertTriangle, CheckCircle, 
  Search, SlidersHorizontal, Check, RefreshCw, Send, ArrowRight, BookOpen, Car, Calendar, ExternalLink 
} from "lucide-react";
import { ApplicantData, JobPosting } from "../types";
import { evaluateJobMatch } from "../jobsData";

interface MatchedJobsListProps {
  applicant: ApplicantData;
  jobs: JobPosting[];
  onApplyJob: (job: JobPosting, matchScore: number) => void;
  appliedJobIds: string[];
  onNavigateToAdmin?: () => void;
}

export default function MatchedJobsList({
  applicant,
  jobs,
  onApplyJob,
  appliedJobIds,
  onNavigateToAdmin
}: MatchedJobsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  
  // Apply Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [appliedJobTitle, setAppliedJobTitle] = useState("");
  const [appliedJobScore, setAppliedJobScore] = useState(0);

  const handleApplyInternal = (job: JobPosting, score: number) => {
    onApplyJob(job, score);
    setAppliedJobTitle(job.title);
    setAppliedJobScore(score);
    setShowSuccessModal(true);
  };

  // Extract unique regions for filter
  const regions = useMemo(() => {
    const list = jobs.map(j => j.sigungu);
    return ["all", ...Array.from(new Set(list))];
  }, [jobs]);

  // Compute matched rates for all jobs
  const jobsWithMatches = useMemo(() => {
    return jobs.map(job => {
      const matchResult = evaluateJobMatch(applicant, job);
      return {
        job,
        match: matchResult
      };
    });
  }, [applicant, jobs]);

  // Filter jobs based on search term & region selection
  const filteredJobs = useMemo(() => {
    return jobsWithMatches.filter(({ job }) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.careSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.dong.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = regionFilter === "all" || job.sigungu === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [jobsWithMatches, searchTerm, regionFilter]);

  // Sort: Best matches first!
  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => b.match.score - a.match.score);
  }, [filteredJobs]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-[#E8F1ED] border border-brand-line p-6 md:p-8 rounded-[24px] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-[#B5754D]/5 rounded-full blur-3xl pointer-events-none" />
        <span className="text-xs font-bold tracking-widest text-[#3F7E6B] px-2.5 py-1 rounded-full bg-white/60 border border-brand-line/50 inline-block mb-3.5">
          실시간 연계 일자리 매칭
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#23302C]">
          현재 입력 프로필 기준 <span className="italic text-[#B5754D]">매칭 공고</span> 리스트
        </h2>
        <p className="text-xs md:text-sm text-brand-muted mt-2 max-w-2xl leading-relaxed">
          지원서 작성 양식에 입력하고 계신 <b>지역/시간/운전/경력 조건</b>을 공인 채용 사이트 구인 정보와 지능형 실시간 비교 연계합니다. 우수한 매칭도를 보이는 구직처에 즉각 간편 매칭 접수할 수 있습니다.
        </p>

        {/* Sync Prompt */}
        {!applicant.name && (
          <div className="mt-4 bg-[#B5754D]/10 border border-[#B5754D]/20 text-brand-warm rounded-xl p-3.5 text-xs md:text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-warm shrink-0" />
            <span>현재 기본 정보가 기재되지 않아 '가상의 지원자' 기준으로 매칭율을 임시 계산 중입니다. <b>'지원서 작성'</b> 탭에서 정보입력을 변경해 보세요!</span>
          </div>
        )}
      </div>

      {/* Grid Layout: Left Job Posts Sidebar, Right Live Match Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col (List of jobs): 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 border border-brand-line rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E7E78]" />
              <input
                type="text"
                placeholder="관심 어르신 상태, 공고 키워드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-brand-bg/60 border border-brand-line rounded-xl text-xs sm:text-xs text-brand-ink outline-none focus:border-brand-accent focus:bg-white transition-all font-sans"
              />
            </div>

            {/* Region Select */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#6E7E78]" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full sm:w-auto p-1.5 bg-brand-bg border border-brand-line rounded-lg text-xs font-bold text-brand-ink outline-none cursor-pointer"
              >
                <option value="all">전체 관할 권역</option>
                {regions.filter(r => r !== "all").map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-3.5">
            {sortedJobs.map(({ job, match }) => {
              const applied = appliedJobIds.includes(job.id);
              const score = match.score;
              
              // Score colors
              let scoreBg = "bg-red-50 text-red-700 border-red-200/50";
              let scoreColor = "text-red-600";
              if (score >= 90) {
                scoreBg = "bg-green-50 text-green-700 border-green-200/50";
                scoreColor = "text-green-600";
              } else if (score >= 70) {
                scoreBg = "bg-[#E8F1ED] text-[#3F7E6B] border-brand-accent/20";
                scoreColor = "text-[#3F7E6B]";
              } else if (score >= 55) {
                scoreBg = "bg-orange-50 text-brand-warm border-orange-200/50";
                scoreColor = "text-brand-warm";
              }

              return (
                <motion.div
                  key={job.id}
                  layout
                  onClick={() => setSelectedJob(job)}
                  className={`border rounded-2xl p-4 md:p-5 transition-all cursor-pointer relative overflow-hidden ${
                    selectedJob?.id === job.id
                      ? "bg-[#E8F1ED]/20 border-brand-accent ring-2 ring-brand-accent/10 shadow-sm"
                      : "bg-white border-brand-line hover:border-brand-accent hover:shadow-md/5"
                  }`}
                >
                  {applied && (
                    <div className="absolute top-0 left-0 bg-brand-accent text-white font-bold text-[10px] uppercase px-3 py-1 rounded-br-xl flex items-center gap-1 z-10 select-none shadow">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>지원 완료</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-2.5 sm:pt-0">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/50">
                          {job.centerName}
                        </span>
                        <span className="text-[10px] font-bold text-[#6E7E78] bg-brand-soft/60 px-2 py-0.5 rounded flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-brand-accent" />
                          {job.sigungu} {job.dong}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-sm md:text-base text-neutral-900 leading-snug hover:text-brand-accent transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    {/* Circle Score Badge */}
                    <div className={`p-1.5 px-3 rounded-xl border text-center shrink-0 flex flex-col justify-center items-center ${scoreBg} self-start sm:self-auto`}>
                      <span className="text-[10px] font-bold opacity-80 block leading-none mb-0.5">실시간 매칭율</span>
                      <span className="font-serif font-black text-base md:text-lg leading-none">{score}%</span>
                    </div>
                  </div>

                  {/* Core details list */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mt-3.5 pt-3.5 border-t border-brand-line/50 text-[11px] md:text-xs font-semibold text-neutral-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-brand-accent shrink-0" />
                      <span>{job.timeslot} (요일: {job.days.join(",")})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-brand-warm shrink-0" />
                      <span className="text-brand-warm font-bold">{job.pay}</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2 md:col-span-1">
                      <Briefcase className="w-4 h-4 text-brand-muted shrink-0" />
                      <span>경력: {job.prefCareer} 우대</span>
                    </div>
                  </div>

                  {/* Tiny bio excerpt */}
                  <p className="text-xs text-brand-muted bg-brand-bg/50 border border-brand-line/40 rounded-xl p-2.5 mt-3 line-clamp-1 italic">
                    어르신 상태: {job.careSubject}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-brand-accent pt-1">
                    <span>{job.workType} 전문 ㆍ 직접 운전 {job.needDriving ? '우대' : '무관'}</span>
                    <span className="flex items-center gap-0.5 hover:underline text-[#3F7E6B]">
                      매칭 상세 분석 리포트
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {sortedJobs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-brand-line">
                <SlidersHorizontal className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                <h4 className="font-bold text-neutral-800 text-sm">해당 검색어와 일치하는 구인공고가 없습니다</h4>
                <p className="text-xs text-brand-muted mt-1">지역 필터나 키워드를 변경해 가며 다른 대조군을 검색해 주십시오.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Matches Report Viewer & Application: 5 cols */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <AnimatePresence mode="wait">
            {selectedJob ? (
              <motion.div
                key={selectedJob.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-line rounded-3xl p-5 md:p-6 shadow-sm"
              >
                {/* Header detail */}
                <div className="flex justify-between items-start border-b border-brand-line/50 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-accent bg-brand-soft/80 px-2 py-0.5 rounded">
                      {selectedJob.centerName}
                    </span>
                    <h3 className="font-serif font-black text-lg text-neutral-900 leading-snug mt-1.5">
                      {selectedJob.title}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Check className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div className="space-y-4 text-xs md:text-sm">
                  {/* Detailed Description Grid */}
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      <tr className="border-b border-brand-line/40">
                        <td className="py-2 text-brand-muted font-bold w-20">구직지 관할</td>
                        <td className="py-2 text-neutral-800 font-semibold">{selectedJob.sigungu} {selectedJob.dong}</td>
                      </tr>
                      <tr className="border-b border-brand-line/40">
                        <td className="py-2 text-brand-muted font-bold">근무 시간</td>
                        <td className="py-2 text-neutral-800 font-semibold">{selectedJob.timeslot} {selectedJob.days.join(",")}요일 복무</td>
                      </tr>
                      <tr className="border-b border-brand-line/40">
                        <td className="py-2 text-brand-muted font-bold">급여 수준</td>
                        <td className="py-2 text-brand-warm font-extrabold">{selectedJob.pay}</td>
                      </tr>
                      <tr className="border-b border-brand-line/40">
                        <td className="py-2 text-brand-muted font-bold">케어 대상자</td>
                        <td className="py-2 text-neutral-600 font-normal leading-relaxed">{selectedJob.careSubject}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-brand-muted font-bold">운전 요망</td>
                        <td className="py-2 text-neutral-800 font-semibold">
                          {selectedJob.needDriving ? "★ 필수 자차 보유 및 이동 필요" : "대중교통 보행 이동 무관"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Matching Indicator Graph (Artistic visual style) */}
                  {(() => {
                    const mathRes = evaluateJobMatch(applicant, selectedJob);
                    const applied = appliedJobIds.includes(selectedJob.id);
                    
                    let ringCol = "#3F7E6B";
                    if (mathRes.score >= 90) ringCol = "#16a34a";
                    else if (mathRes.score >= 70) ringCol = "#3F7E6B";
                    else if (mathRes.score >= 50) ringCol = "#B5754D";
                    else ringCol = "#ef4444";

                    return (
                      <div className="space-y-4 pt-3.5 border-t border-brand-line/50">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-brand-muted tracking-wide">
                            나와 이 구인처의 일치성 배점표
                          </span>
                          <span className="font-extrabold text-xs text-brand-accent">
                            총 {mathRes.score}% 일치
                          </span>
                        </div>

                        {/* Ring graphical visual */}
                        <div className="flex items-center gap-4 bg-brand-bg/60 border border-brand-line/60 rounded-2xl p-3.5">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              background: `conic-gradient(${ringCol} 0% ${mathRes.score}%, #D9E2DD ${mathRes.score}% 100%)`
                            }}
                          >
                            <div className="w-13 h-13 rounded-full bg-white flex items-center justify-center">
                              <span className="font-serif font-extrabold text-brand-ink text-[15px]">{mathRes.score}%</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-bold text-xs text-neutral-900">
                              {mathRes.score >= 90 && "서류 즉각 통과 유력 매칭!"}
                              {mathRes.score >= 70 && mathRes.score < 90 && "부분 세부 조율 후 출근 가능"}
                              {mathRes.score < 70 && "조건 보정에 따라 매치 변동"}
                            </div>
                            <p className="text-[11px] text-[#6E7E78] mt-0.5 leading-normal">
                              {applicant.name || "지원자"} 님이 선호 기재하신 근무 희망 지역 및 요강 합치 지수입니다.
                            </p>
                          </div>
                        </div>

                        {/* Bullet matches/misses */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-[#6E7E78] block">주요 일치 장점 요인</span>
                          {mathRes.reasons.map((r, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#3F7E6B] font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </div>
                          ))}

                          {mathRes.shortcomings.length > 0 && (
                            <>
                              <span className="text-[10px] font-bold text-brand-warm block pt-1.5">조정/타협 필요 요인</span>
                              {mathRes.shortcomings.map((s, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-brand-warm font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5 text-[#B5754D] shrink-0 mt-0.5" />
                                  <span>{s}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Interactive Submit on selected job */}
                        <div className="pt-3">
                          {applied ? (
                            <div className="w-full py-3 bg-[#E8F1ED] border border-brand-accent/30 text-brand-accent font-extrabold rounded-xl text-center flex items-center justify-center gap-1.5 cursor-default select-none">
                              <CheckCircle className="w-4 h-4 text-brand-accent stroke-[3]" />
                              <span>매칭 서류 접수가 무사히 전송되었습니다</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplyInternal(selectedJob, mathRes.score)}
                              className="w-full py-3.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-extrabold rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-brand-accent/25 cursor-pointer text-xs md:text-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{applicant.name ? `${applicant.name} 님 이름으로` : "나의 프로필 조건으로"} 가매칭 접수하기</span>
                              <ArrowRight className="w-4 h-4 animate-pulse-subtle" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#F8F6F2]/40 rounded-3xl border border-dashed border-brand-line p-8 md:p-10 text-center leading-relaxed"
              >
                <BookOpen className="w-10 h-10 text-brand-muted shrink-0 mx-auto mb-3 opacity-60" />
                <h4 className="font-extrabold text-neutral-800 text-sm">일자리 채용 매칭 상세 가단점서 리포트</h4>
                <p className="text-xs text-brand-muted mt-2 max-w-xs mx-auto leading-normal">
                  왼쪽 모바일 연계 구인공고 리스트에서 하나를 클릭해 주시면, 후보지와의 거리 산정, 요일 합치, 자차 여망 합산을 가산 시스템에 기반하여 실시간 보고해 줍니다.
                </p>
                <div className="mt-6 pt-5 border-t border-brand-line/40 text-[11px] text-[#6E7E78] text-left space-y-2 max-w-xs mx-auto">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
                    <span><b>90점 이상:</b> 최적 복무 계약자</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3F7E6B] shrink-0" />
                    <span><b>70~89점:</b> 근무 시간 및 면접 조율 가능</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B5754D] shrink-0" />
                    <span><b>50~69점:</b> 통근거리 및 활동 보완 권고</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Success Modal Dialogue */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[28px] max-w-md w-full p-7 text-center border border-brand-line shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-accent" />
              
              {/* Checkmark icon container */}
              <div className="w-14 h-14 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-brand-accent stroke-[2.5]" />
              </div>

              <h3 className="font-serif text-xl font-bold text-neutral-900">
                실시간 매칭 서류 접수 완료
              </h3>
              
              <div className="mt-3 bg-brand-bg/60 border border-brand-line/50 p-4 rounded-2xl text-[13px] text-neutral-700 leading-relaxed text-left font-medium">
                <div className="font-bold text-brand-accent mb-1 flex items-center gap-1">
                  ⭐ <span className="truncate">{appliedJobTitle}</span>
                </div>
                <div>
                  선택하신 채용 공고에 대해 <b>{appliedJobScore}점</b>의 매칭 점수로 서류를 무사히 발송하였습니다.
                </div>
              </div>

              <p className="text-xs text-brand-muted mt-4 leading-relaxed font-semibold">
                전수 분석된 산출 리포트는 즉각 복지센터 통합 관리망에 기재되었습니다. 관리자 포털 탭에서 접수 현황과 인사담당자 관제 시뮬레이션을 이어서 테스트해 보세요!
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                {onNavigateToAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      onNavigateToAdmin();
                    }}
                    className="flex-1 py-3 px-4 bg-brand-accent hover:bg-brand-accent/95 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-brand-accent/25 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>인사담당자 대시보드로 가기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  확인 (계속 둘러보기)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
