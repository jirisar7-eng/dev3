import { qaAuditEngine } from '../src/services/qa/qaAuditEngine';

async function main() {
  console.log('=== STARTING COMPLETE QA & FUNCTIONAL AUDIT (10 STEPS) ===\n');
  try {
    const result = await qaAuditEngine.runAudit();
    console.log('\n=== REAL AUDIT COMPLETED SUCCESSFULLY ===\n');
    console.log(result.rawReportText);
    console.log('\n=== AI AUDIT ANALYST DETAILS ===');
    console.log('AI Verdict:', result.verdict);
    console.log('Executive Summary:', result.aiReport.executiveSummary);
    console.log('Technical Summary:', result.aiReport.technicalSummary);
    console.log('Critical Findings:', result.aiReport.criticalFindings);
    console.log('Root Cause Analysis:', result.aiReport.rootCauseAnalysis);
    console.log('Risk Assessment:', result.aiReport.riskAssessment);
    console.log('Recommended Fixes:', result.aiReport.recommendedFixes);
    console.log('Suggested Tests:', result.aiReport.suggestedTests);
    console.log('Production Readiness Assessment:', result.aiReport.productionReadinessAssessment);
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Audit execution failed:', error);
    process.exit(1);
  }
}

main();
