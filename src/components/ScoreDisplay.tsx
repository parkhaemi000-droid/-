import React from "react";
import { motion } from "motion/react";
import { Award, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { ScoringResult } from "../types";

interface ScoreDisplayProps {
  result: ScoringResult;
  applicantName: string;
  onReset: () => void;
  isLive?: boolean;
  onMoveToJobs?: () => void;
}

export default function ScoreDisplay({ result, applicantName, onReset, isLive = false, onMoveToJobs }: ScoreDisplayProps) {
  const { total, lines, warn } = result;

  // Color mappings based on total match score
  let scoreColor = "text-brand-accent";
  let ringColor = "#3F7E6B";
  let badgeText = "최적 마크 (Perfect)";
  let badgeStyle = "bg-brand-soft text-brand-accent border-brand-accent/20";

  if (total >= 90) {
    scoreColor = "text-green-600";
    ringColor = "#16a34a";
    badgeText = "최우수 매칭 대상자";
    badgeStyle = "bg-green-50 text-green-700 border-green-200";
  } else if (total >= 70) {
    scoreColor = "text-brand-accent";
    ringColor = "#3F7E6B";
    badgeText = "매칭 수용 적격자";
    badgeStyle = "bg-brand-soft text-brand-accent border-brand-line";
  } else if (total >= 50) {
    scoreColor = "text-brand-warm";
    ringColor = "#B5754D";
    badgeText = "부분 협의 필요자";
    badgeStyle = "bg-orange-50 text-brand-warm border-orange-200";
  } else {
    scoreColor = "text-red-500";
    ringColor = "#ef4444";
    badgeText = "매칭 적합성 낮음";
    badgeStyle = "bg-red-50 text-red-600 border-red-200";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className={`bg-white border border-brand-line rounded-2xl p-6 md:p-8 shadow-sm text-center ${
        isLive ? "border-dashed ring-2 ring-brand-accent/10" : "relative overflow-hidden"
      }`}
    >
      {!isLive && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-accent" />
      )}

      {/* Header Info */}
      <div className="mb-6">
        <span className="inline-block text-xs font-bold text-brand-accent bg-brand-soft px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
          {isLive ? "실시간 매칭 점수 시뮬레이터" : "온라인 접수 접수 완료"}
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-neutral-900 mt-1">
          {isLive ? "현재 입력 기준 매칭도" : `${applicantName || "지원자"} 님의 접수 안내`}
        </h2>
        <p className="text-sm text-brand-muted mt-1.5 max-w-md mx-auto leading-relaxed">
          {isLive 
            ? "입력사항을 수정하시면 실시간으로 자동 가산점이 반영됩니다."
            : "지원서가 센터 지원풀에 안전하게 등록되었습니다. 자동 산정 점수를 확인해 보세요."
          }
        </p>
      </div>

      {/* Ring Score Chart */}
      <div className="relative flex items-center justify-center my-6">
        <div 
          className="w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700"
          style={{
            background: `conic-gradient(${ringColor} 0% ${(total / 100) * 100}%, #E8F1ED ${(total / 100) * 100}% 100%)`
          }}
        >
          <div className="w-34 h-34 rounded-full bg-white shadow-inner flex flex-col items-center justify-center">
            <span className={`text-[46px] md:text-5.5xl font-serif font-bold ${scoreColor} tracking-tight leading-none`}>
              {total}
            </span>
            <span className="text-[11px] text-brand-muted font-bold mt-1.5">/ 100 점</span>
          </div>
        </div>
      </div>

      {/* Evaluation Badge */}
      <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border ${badgeStyle} mb-6`}>
        <Award className="w-3.5 h-3.5" />
        <span>{badgeText}</span>
      </div>

      {/* Warnings */}
      {warn && (
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-red-50 text-red-800 border border-red-100 rounded-xl px-4 py-3 text-xs md:text-sm font-semibold flex items-start gap-2.5 text-left mb-6"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">자격증 미보유 통지</div>
            <p className="text-red-600 font-normal mt-0.5 leading-relaxed">
              요양보호사 자격이 ‘보유’ 상태가 아닙니다. 센터 규정에 따라 최종 요양 업무 계약 전에 자격번호 등록이 필수적이며, 서류 검토 시 추가 확인 절차가 있습니다.
            </p>
          </div>
        </motion.div>
      )}

      {/* Score Breakdown Lines */}
      <div className="bg-brand-bg/50 border border-brand-line rounded-xl p-4 md:p-5 text-left mb-6">
        <h3 className="text-xs font-bold text-brand-muted mb-4 uppercase tracking-wider">
          상세 평가 배점 항목
        </h3>
        <div className="space-y-3.5">
          {lines.map((l, i) => {
            const hasPoints = l.pt > 0;
            const pct = (l.pt / l.max) * 100;
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs md:text-sm font-bold">
                  <span className="text-brand-ink flex items-center gap-1.5">
                    {hasPoints ? (
                      <CheckCircle className="w-4 h-4 text-brand-accent" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-1.5 border-brand-line" />
                    )}
                    {l.label}
                  </span>
                  <span className={hasPoints ? "text-brand-accent" : "text-brand-muted"}>
                    {l.pt} <span className="text-brand-muted font-normal text-xs">/ {l.max}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-brand-line/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      hasPoints ? "bg-brand-accent" : "bg-neutral-300"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset & Navigation CTA */}
      {!isLive && (
        <div className="flex flex-col gap-3.5">
          {onMoveToJobs && (
            <button
              onClick={onMoveToJobs}
              className="w-full inline-flex items-center justify-center gap-2 py-4 bg-brand-accent hover:bg-brand-accent/95 text-white rounded-2xl font-extrabold transition-all shadow-md shadow-brand-accent/25 hover:shadow-brand-accent/40 cursor-pointer text-sm md:text-base animate-pulse-subtle"
            >
              <span>나에게 딱 맞는 실시간 요양 일자리 매칭 ({total}점) 보러가기</span>
              <ArrowRight className="w-4 h-4 md:w-5 h-5" />
            </button>
          )}

          <button
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-1.5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold transition-all cursor-pointer text-xs md:text-sm"
          >
            <span>이전 지원서 내역 비우고 새로 작성</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
