/**
 * 통합금융계산기 유닛 테스트
 * 기존 코드 수정 0건 — vm 샌드박스로 순수 계산 함수를 로드하여 테스트
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createSandbox, extractFunction } = require('./_loader');

const HTML_PATH = path.join(__dirname, '..', 'index.html');

// ============================================================
// 1. calcProgressiveTax(taxable) — 종합소득세 누진세율 계산
// ============================================================
describe('calcProgressiveTax', () => {
  let calcProgressiveTax;

  it('함수 로딩', () => {
    const sandbox = createSandbox();
    calcProgressiveTax = extractFunction(HTML_PATH, 'calcProgressiveTax', sandbox);
    assert.ok(typeof calcProgressiveTax === 'function');
  });

  // 1구간: ~1,400만 (6%)
  it('1,000만원 → 세율 6%, 세액 60만원', () => {
    const r = calcProgressiveTax(10000000);
    assert.equal(r.rate, 0.06);
    assert.equal(r.tax, 600000);
    assert.equal(r.desc, '6%');
  });

  it('1,400만원 (1구간 상한) → 세액 84만원', () => {
    const r = calcProgressiveTax(14000000);
    assert.equal(r.tax, 14000000 * 0.06 - 0);
  });

  // 2구간: 1,400만~5,000만 (15%)
  it('3,000만원 → 세율 15%', () => {
    const r = calcProgressiveTax(30000000);
    assert.equal(r.rate, 0.15);
    assert.equal(r.tax, 30000000 * 0.15 - 1260000);
  });

  it('5,000만원 → 세율 15%, 세액 624만원', () => {
    const r = calcProgressiveTax(50000000);
    assert.equal(r.rate, 0.15);
    assert.equal(r.tax, 50000000 * 0.15 - 1260000);
  });

  // 3구간: 5,000만~8,800만 (24%)
  it('8,000만원 → 세율 24%', () => {
    const r = calcProgressiveTax(80000000);
    assert.equal(r.rate, 0.24);
    assert.equal(r.tax, 80000000 * 0.24 - 5760000);
  });

  // 4구간: 8,800만~1.5억 (35%)
  it('1억원 → 세율 35%', () => {
    const r = calcProgressiveTax(100000000);
    assert.equal(r.rate, 0.35);
    assert.equal(r.tax, 100000000 * 0.35 - 15440000);
  });

  // 5구간: 1.5억~3억 (38%)
  it('2억원 → 세율 38%', () => {
    const r = calcProgressiveTax(200000000);
    assert.equal(r.rate, 0.38);
    assert.equal(r.tax, 200000000 * 0.38 - 19940000);
  });

  // 6구간: 3억~5억 (40%)
  it('4억원 → 세율 40%', () => {
    const r = calcProgressiveTax(400000000);
    assert.equal(r.rate, 0.40);
    assert.equal(r.tax, 400000000 * 0.40 - 25940000);
  });

  // 7구간: 5억~10억 (42%)
  it('7억원 → 세율 42%', () => {
    const r = calcProgressiveTax(700000000);
    assert.equal(r.rate, 0.42);
    assert.equal(r.tax, 700000000 * 0.42 - 35940000);
  });

  // 8구간: 10억 초과 (45%)
  it('15억원 → 세율 45%', () => {
    const r = calcProgressiveTax(1500000000);
    assert.equal(r.rate, 0.45);
    assert.equal(r.tax, 1500000000 * 0.45 - 65940000);
  });

  // 엣지 케이스
  it('0원 → 세액 0', () => {
    const r = calcProgressiveTax(0);
    assert.equal(r.tax, 0);
  });

  it('음수 → 세액 0 (Math.max 보호)', () => {
    const r = calcProgressiveTax(-1000000);
    assert.equal(r.tax, 0);
  });
});

// ============================================================
// 2. calcSalaryDeduction(salary) — 근로소득공제
// ============================================================
describe('calcSalaryDeduction', () => {
  let calcSalaryDeduction;

  it('함수 로딩', () => {
    const sandbox = createSandbox();
    calcSalaryDeduction = extractFunction(HTML_PATH, 'calcSalaryDeduction', sandbox);
    assert.ok(typeof calcSalaryDeduction === 'function');
  });

  // 1구간: ~500만 (70%)
  it('300만원 → 210만원 (70%)', () => {
    assert.equal(calcSalaryDeduction(3000000), 3000000 * 0.7);
  });

  it('500만원 → 350만원', () => {
    assert.equal(calcSalaryDeduction(5000000), 5000000 * 0.7);
  });

  // 2구간: 500만~1,500만 (350만 + 초과분 40%)
  it('1,000만원 → 350만 + 500만×0.4 = 550만원', () => {
    assert.equal(calcSalaryDeduction(10000000), 3500000 + 5000000 * 0.4);
  });

  it('1,500만원 → 350만 + 1000만×0.4 = 750만원', () => {
    assert.equal(calcSalaryDeduction(15000000), 3500000 + 10000000 * 0.4);
  });

  // 3구간: 1,500만~4,500만 (750만 + 초과분 15%)
  it('3,000만원 → 750만 + 1500만×0.15 = 975만원', () => {
    assert.equal(calcSalaryDeduction(30000000), 7500000 + 15000000 * 0.15);
  });

  // 4구간: 4,500만~1억 (1,200만 + 초과분 5%)
  it('7,000만원 → 1200만 + 2500만×0.05 = 1325만원', () => {
    assert.equal(calcSalaryDeduction(70000000), 12000000 + 25000000 * 0.05);
  });

  // 5구간: 1억 초과 (1,475만 + 초과분 2%, 최대 2,000만)
  it('1.5억원 → 1475만 + 5000만×0.02 = 1575만원', () => {
    assert.equal(calcSalaryDeduction(150000000), 14750000 + 50000000 * 0.02);
  });

  it('5억원 → 2,000만원 상한 적용', () => {
    assert.equal(calcSalaryDeduction(500000000), 20000000);
  });
});

// ============================================================
// 3. calcBankEquivYield — 은행 환산 수익률 (이진탐색)
// ============================================================
describe('calcBankEquivYield', () => {
  let calcBankEquivYield;

  it('함수 로딩', () => {
    const sandbox = createSandbox();
    calcBankEquivYield = extractFunction(HTML_PATH, 'calcBankEquivYield', sandbox);
    assert.ok(typeof calcBankEquivYield === 'function');
  });

  it('totalKrwPaid <= 0 → 0 반환', () => {
    assert.equal(calcBankEquivYield(100000, 12, 0, 1500000), 0);
    assert.equal(calcBankEquivYield(100000, 12, -100, 1500000), 0);
  });

  it('krwRetMid <= totalKrwPaid → 0 반환 (손실)', () => {
    assert.equal(calcBankEquivYield(100000, 12, 1200000, 1000000), 0);
    assert.equal(calcBankEquivYield(100000, 12, 1200000, 1200000), 0);
  });

  it('정상 케이스 → 양수 수익률 반환', () => {
    // 월 50만원, 120개월, 총 6000만원 납입, 환급금 8000만원
    const result = calcBankEquivYield(500000, 120, 60000000, 80000000);
    assert.ok(result > 0, '수익률은 양수여야 함');
    assert.ok(result < 50, '수익률 50% 이하 (현실적 범위)');
  });

  it('반환값은 퍼센트 단위 (×100 적용됨)', () => {
    // 월 100만원, 60개월, 총 6000만원 납입, 환급금 7000만원
    const result = calcBankEquivYield(1000000, 60, 60000000, 70000000);
    // 결과가 0.03 같은 소수가 아니라 3.xx 같은 퍼센트 단위여야 함
    assert.ok(result > 0.1, '퍼센트 단위이므로 0.1% 이상');
  });
});
