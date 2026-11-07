(function () {
  'use strict';

  const C = window.QZCore;
  // 沿用旧版存储键：升级为玉子账后，已有账目不会丢失
  const DATA_KEY = 'qingzhang.data.v1';
  const VIEWS = ['home', 'reports', 'budget', 'settings'];
  const VIEW_TITLES = {
    home: '玉子账 · 我的账本',
    reports: '玉子账 · 统计',
    budget: '玉子账 · 预算',
    settings: '玉子账 · 我的'
  };
  const ICON_ALIAS = { home: 'house', gift: 'social' };

  if (!C) {
    document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">应用加载失败，请刷新页面重试。</p>';
    return;
  }

  const $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return C.createEmptyData();
      return C.normalizeData(JSON.parse(raw));
    } catch (error) {
      console.warn('读取本地数据失败', error);
      return C.createEmptyData();
    }
  }

  const state = {
    data: loadData(),
    view: readView(),
    month: C.currentMonth(),
    reportType: 'expense',
    entryType: 'expense',
    entryCategory: 'food',
    editingId: null,
    budgetMode: 'total',
    budgetCategory: 'food',
    categoryMode: 'create',
    categoryType: 'expense',
    categoryEditId: null,
    categoryIcon: 'coffee',
    categoryReturnTo: 'entry',
    sortType: 'expense',
    pendingImport: null,
    confirmAction: null,
    installPrompt: null,
    toastTimer: null,
    toastActionHandler: null
  };

  const refs = {
    views: {},
    tabbar: $('.tabbar'),
    toast: $('#toast'),
    toastMessage: $('#toastMessage'),
    toastAction: $('#toastAction'),
    entryDialog: $('#entryDialog'),
    entryForm: $('#entryForm'),
    entryKicker: $('#entryKicker'),
    entryTitle: $('#entryTitle'),
    entrySave: $('#entrySave'),
    entryError: $('#entryError'),
    amountInput: $('#amountInput'),
    categoryPicker: $('#categoryPicker'),
    dateInput: $('#dateInput'),
    noteInput: $('#noteInput'),
    deleteEntry: $('#deleteEntry'),
    budgetDialog: $('#budgetDialog'),
    budgetForm: $('#budgetForm'),
    budgetTitle: $('#budgetTitle'),
    budgetCategoryWrap: $('#budgetCategoryWrap'),
    budgetCategoryPicker: $('#budgetCategoryPicker'),
    budgetAmountInput: $('#budgetAmountInput'),
    budgetError: $('#budgetError'),
    budgetNote: $('#budgetNote'),
    clearBudget: $('#clearBudget'),
    categoryDialog: $('#categoryDialog'),
    categoryForm: $('#categoryForm'),
    categoryKicker: $('#categoryKicker'),
    categoryTitle: $('#categoryTitle'),
    categoryNameInput: $('#categoryNameInput'),
    categoryIconPicker: $('#categoryIconPicker'),
    categoryError: $('#categoryError'),
    categoryNote: $('#categoryNote'),
    deleteCategory: $('#deleteCategory'),
    sortDialog: $('#sortDialog'),
    sortList: $('#sortList'),
    resetCategoryOrder: $('#resetCategoryOrder'),
    confirmDialog: $('#confirmDialog'),
    confirmIcon: $('#confirmIcon'),
    confirmTitle: $('#confirmTitle'),
    confirmText: $('#confirmText'),
    confirmOk: $('#confirmOk'),
    confirmCancel: $('#confirmCancel'),
    importDialog: $('#importDialog'),
    importInfo: $('#importInfo'),
    importSummary: $('#importSummary'),
    importMerge: $('#importMerge'),
    importReplace: $('#importReplace'),
    importCancel: $('#importCancel'),
    fileInput: $('#fileInput')
  };

  document.querySelectorAll('[data-view]').forEach(function (section) {
    refs.views[section.dataset.view] = section;
  });

  function readView() {
    const hash = String(location.hash || '').replace('#', '');
    return VIEWS.indexOf(hash) === -1 ? 'home' : hash;
  }

  function escapeHtml(value) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return map[char];
    });
  }

  function icon(name, extraClass) {
    return (
      '<svg class="icon' +
      (extraClass ? ' ' + extraClass : '') +
      '" aria-hidden="true"><use href="#i-' +
      name +
      '"></use></svg>'
    );
  }

  function catIconName(category) {
    return ICON_ALIAS[category.icon] || category.icon;
  }

  function catStyle(category) {
    return '--cat-color:' + category.color + ';--cat-soft:' + category.soft;
  }

  function catIcon(category, extraClass) {
    return (
      '<span class="cat-icon' +
      (extraClass ? ' ' + extraClass : '') +
      '" style="' +
      catStyle(category) +
      '">' +
      icon(catIconName(category)) +
      '</span>'
    );
  }

  function catMascot(extraClass) {
    return (
      '<svg class="cat-mascot' +
      (extraClass ? ' ' + extraClass : '') +
      '" viewBox="0 0 220 220" aria-hidden="true"><use href="#cat-mascot"></use></svg>'
    );
  }

  function pawIcon(extraClass) {
    return (
      '<svg class="paw-icon' +
      (extraClass ? ' ' + extraClass : '') +
      '" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-paw"></use></svg>'
    );
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5) return '夜深了';
    if (hour < 11) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }

  function weekdayShort(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return '周' + '日一二三四五六'.charAt(date.getDay());
  }

  function dayHeading(dateString) {
    const relative = C.relativeDayLabel(dateString);
    if (relative === '今天' || relative === '昨天' || relative === '前天') {
      return relative + ' · ' + weekdayShort(dateString);
    }
    return relative + ' ' + weekdayShort(dateString);
  }

  function defaultEntryDate() {
    if (state.month === C.currentMonth()) return C.todayISO();
    const today = new Date();
    const day = Math.min(today.getDate(), C.daysInMonth(state.month));
    return state.month + '-' + String(day).padStart(2, '0');
  }

  function isStandalone() {
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    );
  }

  function daysElapsedInMonth(month) {
    const current = C.currentMonth();
    if (month === current) return new Date().getDate();
    if (month < current) return C.daysInMonth(month);
    return 1;
  }

  /* ---------- Shared render helpers ---------- */

  function renderTopbar() {
    return (
      '<header class="topbar">' +
      '<a class="brand" href="#home" aria-label="玉子账首页">' +
      '<span class="brand-mark" aria-hidden="true">' +
      '<svg viewBox="0 0 48 48"><use href="#i-cat-face"></use></svg>' +
      '</span>' +
      '<span class="brand-copy"><span class="brand-name">玉子账</span><span class="brand-tag">猫咪手账本</span></span>' +
      '</a>' +
      '<span class="local-pill">' + icon('shield') + '仅本机</span>' +
      '</header>'
    );
  }

  function renderMonthSwitch() {
    const isCurrent = state.month === C.currentMonth();
    return (
      '<div class="month-switch" aria-label="切换月份">' +
      '<button class="month-arrow" type="button" data-action="prev-month" aria-label="上个月">' +
      icon('chevron-left') +
      '</button>' +
      (isCurrent
        ? '<div class="month-current is-static"><strong>' +
          C.monthLabel(state.month) +
          '</strong><small>本月</small></div>'
        : '<button class="month-current" type="button" data-action="current-month" aria-label="回到本月"><strong>' +
          C.monthLabel(state.month) +
          '</strong><small>回到本月</small></button>') +
      '<button class="month-arrow" type="button" data-action="next-month" aria-label="下个月">' +
      icon('chevron-right') +
      '</button>' +
      '</div>'
    );
  }

  function renderAlerts(alerts, limit) {
    if (!alerts || !alerts.length) return '';
    return alerts
      .slice(0, limit || 1)
      .map(function (alert) {
        return (
          '<div class="notice ' +
          (alert.level === 'danger' ? 'danger' : '') +
          '">' +
          icon('alert') +
          '<div class="notice-body"><div class="notice-title">' +
          escapeHtml(alert.title) +
          '</div><div class="notice-text">' +
          escapeHtml(alert.text) +
          '</div></div></div>'
        );
      })
      .join('');
  }

  function renderEmpty(title, text, buttonText) {
    return (
      '<div class="empty-state cat-empty-state">' +
      '<div class="cat-empty-art">' + catMascot('empty-cat') + '<span class="cat-zzz">z z</span></div>' +
      '<h3 class="empty-title">' + escapeHtml(title) + '</h3>' +
      '<p class="empty-text">' + escapeHtml(text) + '</p>' +
      '<button class="btn btn-primary" type="button" data-action="open-entry">' +
      escapeHtml(buttonText || '记一笔') +
      '</button>' +
      '</div>'
    );
  }

  /* ---------- Home ---------- */

  function renderHome() {
    const summary = C.getMonthSummary(state.data, state.month);
    const budget = C.getBudgetStatus(state.data, state.month);
    const transactions = C.getMonthTransactions(state.data, state.month);
    const groups = C.groupByDate(transactions);
    const alerts = state.data.settings.budgetAlerts ? C.getBudgetAlerts(state.data, state.month) : [];
    const visibleAlerts = alerts.filter(function (alert) {
      return alert.level === 'danger' || alert.title.indexOf('分类') !== -1;
    });
    const days = daysElapsedInMonth(state.month);
    const averageExpense = Math.round(summary.expenseCents / Math.max(1, days));

    return (
      renderTopbar() +
      '<header class="page-head">' +
      '<p class="eyebrow">' +
      escapeHtml(greeting() + ' · ' + C.formatDateCN(C.todayISO())) +
      '</p>' +
      '<h1 class="page-title">我的账本</h1>' +
      '<p class="page-subtitle">和玉子一起，把日子记成一本手账。</p>' +
      '</header>' +
      renderDiaryHero(summary) +
      renderMonthSummary(summary, averageExpense) +
      renderBudgetPeek(budget) +
      renderAlerts(visibleAlerts, 1) +
      '<section class="section timeline-section">' +
      '<div class="section-head timeline-head"><div><h2 class="section-title">账目时间轴 <span>' +
      summary.count +
      ' 笔</span></h2><p class="section-sub">每一笔，都是生活的小脚印</p></div>' +
      '<button class="section-link" type="button" data-action="open-entry">+ 记一笔</button></div>' +
      (groups.length
        ? '<div class="timeline-sheet">' + groups.map(renderTimelineDay).join('') + '</div>'
        : renderEmpty('这个月还空空的', '玉子在等你记下第一笔，把今天的小日子收进手账里。', '记下第一笔')) +
      '</section>'
    );
  }

  function renderDiaryHero(summary) {
    const isCurrent = state.month === C.currentMonth();
    const balanceNegative = summary.balanceCents < 0;
    return (
      '<section class="diary-hero" aria-label="本月收支概览">' +
      '<span class="hero-tape" aria-hidden="true"></span>' +
      '<div class="hero-nav">' +
      '<button class="hero-nav-btn" type="button" data-action="prev-month" aria-label="上个月">' +
      icon('chevron-left') +
      '</button>' +
      (isCurrent
        ? '<div class="hero-month"><strong>' + C.monthLabel(state.month) + '</strong><span>本月手账</span></div>'
        : '<button class="hero-month" type="button" data-action="current-month" aria-label="回到本月"><strong>' +
          C.monthLabel(state.month) +
          '</strong><span>回到本月</span></button>') +
      '<button class="hero-nav-btn" type="button" data-action="next-month" aria-label="下个月">' +
      icon('chevron-right') +
      '</button>' +
      '</div>' +
      '<div class="hero-main">' +
      '<div class="hero-copy">' +
      '<p class="hero-kicker">' + pawIcon() + '本月结余</p>' +
      '<div class="hero-balance' + (balanceNegative ? ' negative' : '') + '"><span aria-hidden="true">' +
      (balanceNegative ? '-¥' : '¥') +
      '</span>' +
      C.formatMoney(Math.abs(summary.balanceCents), { symbol: false }) +
      '</div>' +
      '<p class="hero-caption">' +
      (summary.count
        ? '记了 ' + summary.count + ' 笔 · 玉子都帮你收好啦'
        : '还没有记录 · 从今天开始吧') +
      '</p>' +
      '</div>' +
      '<div class="hero-cat-wrap">' +
      '<span class="hero-bubble">喵～</span>' +
      catMascot('hero-cat') +
      '</div>' +
      '</div>' +
      '<div class="hero-paw-trail" aria-hidden="true">' + pawIcon() + pawIcon() + pawIcon() + '</div>' +
      '</section>'
    );
  }

  function renderMonthSummary(summary, averageExpense) {
    return (
      '<div class="month-summary" aria-label="本月收支摘要">' +
      '<div class="summary-column expense"><span>支出</span><strong>' +
      C.formatMoney(summary.expenseCents) +
      '</strong></div>' +
      '<div class="summary-column income"><span>收入</span><strong>' +
      C.formatMoney(summary.incomeCents) +
      '</strong></div>' +
      '<div class="summary-column"><span>日均支出</span><strong>' +
      C.formatMoney(averageExpense) +
      '</strong></div>' +
      '</div>'
    );
  }

  function renderBudgetPeek(budget) {
    if (budget.totalCents <= 0) {
      return (
        '<button class="budget-peek is-empty" type="button" data-action="open-total-budget">' +
        '<span class="budget-peek-paw">' + pawIcon() + '</span>' +
        '<span class="budget-peek-copy"><span class="budget-peek-title">给这个月定个小预算</span><span class="budget-peek-sub">猫猫帮你看着钱包喵</span></span>' +
        '<span class="budget-peek-arrow">' + icon('chevron-right') + '</span>' +
        '</button>'
      );
    }
    const pct = Math.min(100, Math.max(0, budget.pct));
    const over = budget.remainingCents < 0;
    return (
      '<button class="budget-peek ' + budget.level + '" type="button" data-action="open-total-budget">' +
      '<span class="budget-peek-paw">' + pawIcon() + '</span>' +
      '<span class="budget-peek-copy"><span class="budget-peek-title"><span>本月预算 <strong>' +
      C.formatMoney(budget.totalCents) +
      '</strong></span><em>' + Math.round(budget.pct) + '%</em></span>' +
      '<span class="cat-progress ' + budget.level + '"><i style="width:' + pct.toFixed(1) + '%"></i></span>' +
      '<span class="budget-peek-sub"><span>已用 ' +
      C.formatMoney(budget.spentCents) +
      '</span><span>' +
      (over ? '超支 ' + C.formatMoney(-budget.remainingCents) : '还剩 ' + C.formatMoney(budget.remainingCents)) +
      '</span></span></span>' +
      '<span class="budget-peek-arrow">' + icon('chevron-right') + '</span>' +
      '</button>'
    );
  }

  function renderTimelineDay(group) {
    const parts = group.date.split('-');
    const relative = C.relativeDayLabel(group.date);
    const showTag = relative === '今天' || relative === '昨天' || relative === '前天';
    const totals = [];
    if (group.expenseCents) totals.push('支出 ' + C.formatMoney(group.expenseCents));
    if (group.incomeCents) totals.push('收入 ' + C.formatMoney(group.incomeCents));
    return (
      '<div class="timeline-day">' +
      '<div class="timeline-day-head">' +
      '<div class="timeline-date"><strong>' +
      parts[2] +
      '</strong><span>' +
      Number(parts[1]) +
      '月 · ' + weekdayShort(group.date) + '</span></div>' +
      (showTag ? '<span class="timeline-day-tag">' + escapeHtml(relative) + '</span>' : '') +
      '<span class="timeline-day-total">' +
      escapeHtml(totals.join(' · ')) +
      '</span></div>' +
      '<div class="timeline-list">' +
      group.transactions.map(renderTimelineEntry).join('') +
      '</div></div>'
    );
  }

  function renderTimelineEntry(transaction) {
    const category = C.getCategoryIn(state.data, transaction.type, transaction.category);
    const note = transaction.note || (transaction.type === 'income' ? '一笔收入' : '一笔支出');
    const sign = transaction.amountCents === 0 ? '' : transaction.type === 'expense' ? '-' : '+';
    return (
      '<button class="timeline-entry" type="button" data-action="edit-entry" data-id="' +
      escapeHtml(transaction.id) +
      '" aria-label="' +
      escapeHtml(category.name + ' ' + sign + C.formatMoney(transaction.amountCents) + '，' + note + '，点击编辑') +
      '">' +
      catIcon(category, 'timeline-icon') +
      '<span class="timeline-info"><span class="timeline-title">' +
      escapeHtml(category.name) +
      '</span><span class="timeline-note">' +
      escapeHtml(note) +
      '</span></span>' +
      '<span class="timeline-amount ' +
      transaction.type +
      '">' +
      sign +
      C.formatMoney(transaction.amountCents) +
      '</span></button>'
    );
  }

  /* ---------- Reports ---------- */

  function renderReports() {
    const summary = C.getMonthSummary(state.data, state.month);
    const type = state.reportType;
    const isExpense = type === 'expense';
    const total = isExpense ? summary.expenseCents : summary.incomeCents;
    const breakdown = C.getCategoryBreakdown(state.data, state.month, type);
    const transactions = C.getMonthTransactions(state.data, state.month);

    return (
      renderTopbar() +
      '<header class="page-head">' +
      '<p class="eyebrow">' + escapeHtml(C.monthLabel(state.month)) + '</p>' +
      '<h1 class="page-title">花销手账</h1>' +
      '<p class="page-subtitle">每一笔去向，玉子都帮你画好了。</p>' +
      '</header>' +
      renderMonthSwitch() +
      '<div class="segment" role="group" aria-label="统计类型">' +
      '<button type="button" data-action="report-type" data-type="expense" class="' +
      (isExpense ? 'active' : '') +
      '">支出分析</button>' +
      '<button type="button" data-action="report-type" data-type="income" class="' +
      (!isExpense ? 'active' : '') +
      '">收入分析</button>' +
      '</div>' +
      (total > 0
        ? renderReportContent(total, breakdown, summary, transactions, type)
        : renderEmpty('这个月还没有' + (isExpense ? '支出' : '收入') + '记录', '记下几笔之后，这里会自动生成分类占比和趋势图。', '去记一笔'))
    );
  }

  function renderReportContent(total, breakdown, summary, transactions, type) {
    const isExpense = type === 'expense';
    const slices = combineSlices(breakdown, 6);
    const days = daysElapsedInMonth(state.month);
    const expenseTransactions = transactions.filter(function (item) {
      return item.type === 'expense';
    });
    const maxExpense = expenseTransactions.slice().sort(function (a, b) {
      return b.amountCents - a.amountCents;
    })[0];
    const averageExpense = Math.round(summary.expenseCents / Math.max(1, days));
    const top = breakdown[0];
    const topPercent = top ? Math.round((top.amountCents / total) * 100) : 0;
    const insight = top
      ? isExpense
        ? '本月「' + top.name + '」花得最多，占了 ' + topPercent + '%，玉子帮你圈出来啦。'
        : '本月收入主要来自「' + top.name + '」，占了 ' + topPercent + '%，很不错喵。'
      : '';

    return (
      renderCatInsight(insight) +
      '<section class="report-card">' +
      '<div class="report-card-head"><div><p class="card-kicker">' +
      (isExpense ? 'EXPENSE' : 'INCOME') +
      '</p><h2 class="card-title">' + (isExpense ? '支出' : '收入') + '构成</h2></div><span class="card-note">' +
      escapeHtml(C.monthLabel(state.month, true)) +
      ' · ' + breakdown.length + ' 个分类</span></div>' +
      renderDonut(slices, total, summary.count) +
      '<div class="legend">' +
      slices.map(function (slice) {
        return (
          '<div class="legend-row"><span class="legend-dot" style="--dot-color:' +
          slice.color +
          '"></span><span class="legend-name">' +
          escapeHtml(slice.name) +
          '</span><span class="legend-percent">' +
          Math.round((slice.amountCents / total) * 100) +
          '%</span><span class="legend-amount">' +
          C.formatMoney(slice.amountCents) +
          '</span></div>'
        );
      }).join('') +
      '</div>' +
      '</section>' +
      '<div class="metric-grid">' +
      '<div class="metric"><div class="metric-label">每日平均</div><div class="metric-value">' +
      C.formatMoney(averageExpense) +
      '</div><div class="metric-sub">按 ' + days + ' 天计算</div></div>' +
      '<div class="metric"><div class="metric-label">最大一笔</div><div class="metric-value">' +
      (maxExpense ? C.formatMoney(maxExpense.amountCents) : '—') +
      '</div><div class="metric-sub">' +
      (maxExpense ? escapeHtml(C.getCategoryIn(state.data, maxExpense.type, maxExpense.category).name) : '暂无支出') +
      '</div></div>' +
      '<div class="metric"><div class="metric-label">记账笔数</div><div class="metric-value">' +
      summary.count +
      ' 笔</div><div class="metric-sub">收支合计</div></div>' +
      '</div>' +
      renderTrend()
    );
  }

  function renderCatInsight(text) {
    return (
      '<div class="cat-insight">' +
      '<div class="cat-insight-avatar">' + catMascot('insight-cat') + '</div>' +
      '<div class="cat-insight-bubble"><span class="cat-insight-label">玉子说</span><p>' +
      escapeHtml(text) +
      '</p></div></div>'
    );
  }

  function combineSlices(breakdown, limit) {
    if (breakdown.length <= limit) return breakdown;
    const head = breakdown.slice(0, limit - 1);
    const rest = breakdown.slice(limit - 1);
    const amountCents = rest.reduce(function (total, item) {
      return total + item.amountCents;
    }, 0);
    return head.concat([
      {
        id: 'grouped-other',
        name: '其他分类',
        color: '#9DA69D',
        soft: '#EFF1EC',
        amountCents: amountCents,
        count: rest.reduce(function (total, item) {
          return total + item.count;
        }, 0)
      }
    ]);
  }

  function renderDonut(slices, total, count) {
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const gap = slices.length > 1 ? 1.8 : 0;
    const segments = slices
      .map(function (slice) {
        const fraction = slice.amountCents / total;
        const length = Math.max(fraction * circumference - gap, 0);
        const circle =
          '<circle class="donut-segment" cx="60" cy="60" r="' +
          radius +
          '" stroke="' +
          slice.color +
          '" stroke-dasharray="' +
          length.toFixed(2) +
          ' ' +
          circumference.toFixed(2) +
          '" stroke-dashoffset="' +
          (-offset).toFixed(2) +
          '"></circle>';
        offset += fraction * circumference;
        return circle;
      })
      .join('');
    return (
      '<div class="donut-wrap" role="img" aria-label="' +
      escapeHtml('分类占比图，共 ' + count + ' 笔记录') +
      '">' +
      '<svg class="donut-svg" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="donut-track" cx="60" cy="60" r="' + radius + '"></circle>' +
      segments +
      '</svg>' +
      '<div class="donut-center"><svg class="donut-cat" viewBox="0 0 48 48" aria-hidden="true"><use href="#i-cat-face"></use></svg><span class="donut-center-label">合计</span><span class="donut-center-value">' +
      C.formatMoney(total) +
      '</span><span class="donut-center-count">' + count + ' 笔</span></div>' +
      '</div>'
    );
  }

  function renderTrend() {
    const months = C.getRecentMonths(state.month, 6);
    const summaries = months.map(function (month) {
      return { month: month, summary: C.getMonthSummary(state.data, month) };
    });
    let max = 1;
    summaries.forEach(function (item) {
      max = Math.max(max, item.summary.incomeCents, item.summary.expenseCents);
    });
    return (
      '<section class="report-card" style="margin-top:13px">' +
      '<div class="report-card-head"><div><p class="card-kicker">MEMORY</p><h2 class="card-title">近半年手账</h2></div>' +
      '<div class="chart-legend"><span class="chart-key" style="--key-color:#D98570">支出</span><span class="chart-key" style="--key-color:#6BA57A">收入</span></div></div>' +
      '<div class="trend-chart">' +
      summaries.map(function (item) {
        const expenseHeight = item.summary.expenseCents
          ? Math.max((item.summary.expenseCents / max) * 100, 3)
          : 0;
        const incomeHeight = item.summary.incomeCents
          ? Math.max((item.summary.incomeCents / max) * 100, 3)
          : 0;
        const label =
          ' aria-label="' +
          escapeHtml(
            C.monthLabel(item.month) +
              '，支出 ' +
              C.formatMoney(item.summary.expenseCents) +
              '，收入 ' +
              C.formatMoney(item.summary.incomeCents)
          ) +
          '" title="' +
          escapeHtml(
            C.monthLabel(item.month) +
              '：支出 ' +
              C.formatMoney(item.summary.expenseCents) +
              ' / 收入 ' +
              C.formatMoney(item.summary.incomeCents)
          ) +
          '"';
        return (
          '<div class="trend-col' +
          (item.month === state.month ? ' current' : '') +
          '" role="img"' +
          label +
          '>' +
          '<div class="bar-area"><span class="bar expense" style="height:' +
          expenseHeight.toFixed(1) +
          '%"></span><span class="bar income" style="height:' +
          incomeHeight.toFixed(1) +
          '%"></span></div>' +
          '<span class="trend-month">' +
          Number(item.month.slice(5)) +
          '月</span></div>'
        );
      }).join('') +
      '</div></section>'
    );
  }

  /* ---------- Budget ---------- */

  function renderBudget() {
    const budget = C.getBudgetStatus(state.data, state.month);
    const categoryBudgets = C.getCategoryBudgetStatuses(state.data, state.month);
    const summary = C.getMonthSummary(state.data, state.month);
    const alerts = state.data.settings.budgetAlerts ? C.getBudgetAlerts(state.data, state.month) : [];
    const categoryAlerts = alerts.filter(function (alert) {
      return alert.title.indexOf('分类') !== -1;
    });
    return (
      renderTopbar() +
      '<header class="page-head">' +
      '<p class="eyebrow">' + escapeHtml(C.monthLabel(state.month)) + '</p>' +
      '<h1 class="page-title">预算手账</h1>' +
      '<p class="page-subtitle">猫猫帮你把花销圈在小圈圈里。</p>' +
      '</header>' +
      renderMonthSwitch() +
      renderBudgetBanner(budget) +
      renderBudgetTriplet(summary) +
      renderAlerts(categoryAlerts, 1) +
      (budget.totalCents > 0 ? renderBudgetCard(budget) : renderBudgetEmpty()) +
      renderCategoryBudgets(categoryBudgets) +
      '<p class="budget-footnote">' + pawIcon() + ' 预算按月循环，修改后对所有月份生效。分类预算和总预算可以分别设置。</p>'
    );
  }

  function renderBudgetBanner(budget) {
    const over = budget.remainingCents < 0;
    const hasBudget = budget.totalCents > 0;
    const message = !hasBudget
      ? '先给这个月系上一条预算小绳结吧，玉子会帮你看着钱包。'
      : over
        ? '预算小绳结被撑开啦，已经超出 ' + C.formatMoney(-budget.remainingCents) + '，接下来省一点喵。'
        : '还可以花 ' + C.formatMoney(budget.remainingCents) + '，玉子帮你算好啦。';
    return (
      '<section class="budget-mascot-banner ' + (over ? 'over' : '') + '">' +
      '<div class="banner-cat-wrap">' + catMascot('banner-cat') + '<span class="banner-spark" aria-hidden="true">✦</span></div>' +
      '<div class="banner-copy"><span class="washi-label">' +
      escapeHtml(C.monthLabel(state.month, true)) +
      ' · 预算守护</span><p>' +
      escapeHtml(message) +
      '</p><span class="banner-sub">' +
      (hasBudget
        ? '预算 ' + C.formatMoney(budget.totalCents) + ' · 已用 ' + C.formatMoney(budget.spentCents)
        : '还没有设置本月预算') +
      '</span></div></section>'
    );
  }

  function renderBudgetTriplet(summary) {
    return (
      '<div class="budget-triplet">' +
      '<div><span>支出</span><strong>' + C.formatMoney(summary.expenseCents) + '</strong></div>' +
      '<div><span>收入</span><strong>' + C.formatMoney(summary.incomeCents) + '</strong></div>' +
      '<div><span>结余</span><strong>' + C.formatMoney(summary.balanceCents) + '</strong></div>' +
      '</div>'
    );
  }

  function renderBudgetCard(budget) {
    const pct = Math.max(0, budget.pct);
    const over = budget.remainingCents < 0;
    return (
      '<section class="budget-progress-card">' +
      '<div class="budget-progress-head"><div><p class="card-kicker">MONTHLY BUDGET</p><h2 class="card-title">' +
      pawIcon('title-paw') +
      '本月总预算</h2></div>' +
      '<button class="icon-text-btn" type="button" data-action="open-total-budget">' +
      icon('pencil') + '编辑</button></div>' +
      '<div class="budget-progress-amount"><span>' +
      (over ? '已经超支' : '还可以花') +
      '</span><strong class="' + (over ? 'over' : '') + '">' +
      C.formatMoney(Math.abs(budget.remainingCents)) +
      '</strong><em>' + Math.round(pct) + '%</em></div>' +
      '<div class="cat-progress large ' + budget.level + '"><i style="width:' + Math.min(100, pct).toFixed(1) + '%"></i></div>' +
      '<div class="budget-progress-meta"><span>已用 ' + C.formatMoney(budget.spentCents) + '</span><span>预算 ' + C.formatMoney(budget.totalCents) + '</span></div>' +
      (budget.isCurrentMonth && budget.daysLeft > 0 && !over
        ? '<span class="budget-daily">' + pawIcon() + '剩余日均可用 ' + C.formatMoney(budget.dailyAllowanceCents) + ' · 还有 ' + budget.daysLeft + ' 天</span>'
        : '') +
      '</section>'
    );
  }

  function renderBudgetEmpty() {
    return (
      '<section class="budget-empty cat-budget-empty">' +
      '<div class="budget-empty-icon">' + pawIcon() + '</div>' +
      '<h2>还没有预算小绳结</h2>' +
      '<p>定一个月度预算，花到 80% 或超支时，玉子会轻轻拍你一下。</p>' +
      '<button class="btn btn-primary" type="button" data-action="open-total-budget">和玉子定预算</button>' +
      '</section>'
    );
  }

  function renderCategoryBudgets(categoryBudgets) {
    return (
      '<section class="section">' +
      '<div class="section-head"><h2 class="section-title">分类预算 <span>' +
      categoryBudgets.length +
      ' 项</span></h2></div>' +
      (categoryBudgets.length
        ? '<div class="category-budget-list">' +
          categoryBudgets.map(renderCategoryBudget).join('') +
          '</div>'
        : '') +
      '<button class="add-category-budget" type="button" data-action="open-category-budget">' +
      icon('plus') +
      (categoryBudgets.length ? '添加分类预算' : '添加第一个分类预算') +
      '</button>' +
      '</section>'
    );
  }

  function renderCategoryBudget(item) {
    return (
      '<button class="category-budget-row" type="button" data-action="open-category-budget" data-category="' +
      item.id +
      '">' +
      '<div class="category-budget-top">' +
      catIcon(item) +
      '<span class="category-budget-name">' +
      escapeHtml(item.name) +
      (item.level === 'over' ? '<span class="budget-badge">超支</span>' : '') +
      '</span><span class="category-budget-figures"><strong>' +
      C.formatMoney(item.spentCents) +
      '</strong> / ' +
      C.formatMoney(item.budgetCents) +
      '</span></div>' +
      '<div class="bar-track ' +
      item.level +
      '"><span style="width:' +
      Math.min(100, item.pct).toFixed(1) +
      '%"></span></div></button>'
    );
  }

  /* ---------- Settings ---------- */

  function renderCustomCategoryRow(category) {
    return (
      '<button class="setting-row custom-category-row" type="button" data-action="open-category-editor" data-id="' +
      escapeHtml(category.id) +
      '">' +
      '<span class="setting-icon custom-cat-icon" style="--cat-color:' +
      category.color +
      ';--cat-soft:' +
      category.soft +
      '">' +
      icon(catIconName(category)) +
      '</span>' +
      '<span class="setting-main"><span class="setting-title">' +
      escapeHtml(category.name) +
      '<em class="category-type-badge">' +
      C.TYPE_NAMES[category.type] +
      '</em></span><span class="setting-desc">自定义分类 · 点击编辑</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>'
    );
  }

  function renderSettings() {
    const transactions = state.data.transactions;
    const totalIncome = transactions.reduce(function (total, item) {
      return total + (item.type === 'income' ? item.amountCents : 0);
    }, 0);
    const totalExpense = transactions.reduce(function (total, item) {
      return total + (item.type === 'expense' ? item.amountCents : 0);
    }, 0);
    const months = new Set(
      transactions.map(function (item) {
        return item.date.slice(0, 7);
      })
    ).size;
    const storageSize = C.getDataSize(state.data);
    const installed = isStandalone();
    const secureContext = window.isSecureContext !== false;
    const customCategories = C.getCategories(state.data, 'expense')
      .filter(function (category) {
        return category.custom;
      })
      .concat(
        C.getCategories(state.data, 'income').filter(function (category) {
          return category.custom;
        })
      );
    const installTitle = installed
      ? '已安装到主屏幕'
      : secureContext
        ? '把玉子账放到手机桌面'
        : '当前为网页版';
    const installDesc = installed
      ? '可以像普通 App 一样全屏打开，断网也能记账。'
      : secureContext
        ? '添加到主屏幕后，全屏打开，离线也能使用。'
        : '局域网 HTTP 可正常记账；安装到主屏幕和离线缓存需 HTTPS 部署。';
    return (
      renderTopbar() +
      '<header class="page-head">' +
      '<p class="eyebrow">YUZI &amp; MEMORIES</p>' +
      '<h1 class="page-title">我的</h1>' +
      '<p class="page-subtitle">玉子把账本和小秘密都收在这里。</p>' +
      '</header>' +
      '<section class="settings-summary cat-profile">' +
      '<div class="profile-copy"><p class="summary-label">和玉子一起记账 · ' + months + ' 个月</p>' +
      '<div class="profile-title">玉子账 <span>猫咪手账本</span></div>' +
      '<div class="summary-stats">' +
      '<div class="summary-stat"><span>累计记录</span><strong>' +
      transactions.length +
      '<small>笔</small></strong></div>' +
      '<div class="summary-stat"><span>累计结余</span><strong>' +
      C.formatMoney(totalIncome - totalExpense) +
      '</strong></div>' +
      '</div></div>' +
      '<div class="profile-cat-wrap">' + catMascot('profile-cat') + '</div>' +
      '</section>' +
      '<section class="settings-section">' +
      '<p class="settings-section-title">手账偏好</p>' +
      '<div class="settings-card"><div class="setting-row">' +
      '<span class="setting-icon amber">' + icon('bell') + '</span>' +
      '<span class="setting-main"><span class="setting-title">预算提醒</span><span class="setting-desc">达到 80% 或超支时，玉子会在应用内提醒</span></span>' +
      '<label class="switch"><input id="budgetAlertToggle" type="checkbox" aria-label="预算提醒" ' +
      (state.data.settings.budgetAlerts ? 'checked' : '') +
      '><span class="switch-track"></span></label>' +
      '</div></div></section>' +
      '<section class="settings-section">' +
      '<p class="settings-section-title">自定义分类</p>' +
      '<div class="settings-card">' +
      (customCategories.length
        ? customCategories.map(renderCustomCategoryRow).join('')
        : '<div class="category-empty-note">' + pawIcon() + '还没有自定义分类，点下面添加一个吧。</div>') +
      '<button class="setting-row" type="button" data-action="open-category-editor" data-type="expense">' +
      '<span class="setting-icon category-add-icon">' + icon('plus') + '</span>' +
      '<span class="setting-main"><span class="setting-title">新增支出分类</span><span class="setting-desc">咖啡、猫咪、旅行……都可以</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>' +
      '<button class="setting-row" type="button" data-action="open-category-editor" data-type="income">' +
      '<span class="setting-icon category-add-icon income">' + icon('plus') + '</span>' +
      '<span class="setting-main"><span class="setting-title">新增收入分类</span><span class="setting-desc">副业、稿费、红包……都可以</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>' +
      '<button class="setting-row" type="button" data-action="open-sort-dialog">' +
      '<span class="setting-icon sort-setting-icon">' + icon('sort') + '</span>' +
      '<span class="setting-main"><span class="setting-title">调整类型顺序</span><span class="setting-desc">用上下箭头把常用类型排到前面</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>' +
      '</div>' +
      '<p class="privacy-note">' + pawIcon() + '自定义分类会出现在记账、时间轴、统计和分类预算中，也会随备份一起导出。</p>' +
      '</section>' +
      '<section class="settings-section">' +
      '<p class="settings-section-title">账本管理</p>' +
      '<div class="settings-card">' +
      '<button class="setting-row" type="button" data-action="export-json">' +
      '<span class="setting-icon">' + icon('database') + '</span>' +
      '<span class="setting-main"><span class="setting-title">导出完整备份</span><span class="setting-desc">JSON 格式，包含账目和预算，可随时恢复</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>' +
      '<button class="setting-row" type="button" data-action="export-csv">' +
      '<span class="setting-icon blue">' + icon('file') + '</span>' +
      '<span class="setting-main"><span class="setting-title">导出 CSV 表格</span><span class="setting-desc">可用 Excel、Numbers 打开查看</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>' +
      '<button class="setting-row" type="button" data-action="import-data">' +
      '<span class="setting-icon amber">' + icon('upload') + '</span>' +
      '<span class="setting-main"><span class="setting-title">导入备份 / CSV</span><span class="setting-desc">从玉子账备份或其他表格恢复数据</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>' +
      '<button class="setting-row" type="button" data-action="clear-data">' +
      '<span class="setting-icon coral">' + icon('trash') + '</span>' +
      '<span class="setting-main"><span class="setting-title">清空所有数据</span><span class="setting-desc">删除本机上的全部账目与预算</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button>' +
      '</div>' +
      '<p class="privacy-note">' + icon('shield') + '玉子账没有服务器。账目保存在当前浏览器的本地存储中，不会上传。清理浏览器数据会一并删除，请定期导出备份。</p>' +
      '</section>' +
      '<section class="settings-section">' +
      '<p class="settings-section-title">安装到桌面</p>' +
      '<div class="install-card">' +
      '<span class="install-icon">' + icon('smartphone') + '</span>' +
      '<span class="install-main"><span class="install-title">' +
      installTitle +
      '</span><span class="install-desc">' +
      installDesc +
      '</span></span>' +
      (installed
        ? '<span class="install-action">已安装</span>'
        : '<button class="install-action" type="button" data-action="install">' +
          (state.installPrompt ? '安装' : '查看方法') +
          '</button>') +
      '</div>' +
      '<div class="settings-card update-card"><button class="setting-row" type="button" data-action="check-update">' +
      '<span class="setting-icon blue">' + icon('refresh') + '</span>' +
      '<span class="setting-main"><span class="setting-title">检查更新</span><span class="setting-desc">看到旧版本时，清理缓存并重新加载</span></span>' +
      icon('chevron-right', 'setting-chevron') +
      '</button></div>' +
      '</section>' +
      '<footer class="app-footer">玉子账 <span class="version-pill">v1.3.2</span><br>本机占用 ' +
      C.formatFileSize(storageSize) +
      ' · 猫猫陪你记好每一笔</footer>'
    );
  }

  /* ---------- Render orchestration ---------- */

  const renderers = {
    home: renderHome,
    reports: renderReports,
    budget: renderBudget,
    settings: renderSettings
  };

  function render() {
    if (VIEWS.indexOf(state.view) === -1) state.view = 'home';
    VIEWS.forEach(function (view) {
      refs.views[view].hidden = view !== state.view;
    });
    refs.views[state.view].innerHTML = renderers[state.view]();
    updateChrome();
  }

  function updateChrome() {
    document.querySelectorAll('[data-tab]').forEach(function (tab) {
      const active = tab.dataset.tab === state.view;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    document.title = VIEW_TITLES[state.view] || VIEW_TITLES.home;
  }

  /* ---------- Persistence ---------- */

  function saveData() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state.data));
      return true;
    } catch (error) {
      console.warn('保存失败', error);
      showToast('保存失败：浏览器存储不可用或空间不足', { type: 'error', duration: 5000 });
      return false;
    }
  }

  /* ---------- Toast ---------- */

  function showToast(message, options) {
    const opts = options || {};
    const type = opts.type || 'success';
    if (state.toastTimer) window.clearTimeout(state.toastTimer);
    refs.toast.hidden = false;
    refs.toast.className = 'toast' + (type === 'error' ? ' error' : type === 'warning' ? ' warn' : '');
    refs.toastMessage.textContent = message;
    const use = refs.toast.querySelector('use');
    if (use) use.setAttribute('href', type === 'success' ? '#i-check' : '#i-alert');
    if (opts.actionText && typeof opts.onAction === 'function') {
      refs.toastAction.hidden = false;
      refs.toastAction.textContent = opts.actionText;
      state.toastActionHandler = opts.onAction;
    } else {
      refs.toastAction.hidden = true;
      refs.toastAction.textContent = '';
      state.toastActionHandler = null;
    }
    state.toastTimer = window.setTimeout(hideToast, opts.duration || (type === 'error' ? 4500 : 3000));
  }

  function hideToast() {
    if (state.toastTimer) window.clearTimeout(state.toastTimer);
    state.toastTimer = null;
    refs.toast.hidden = true;
  }

  /* ---------- Dialogs ---------- */

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.body.classList.add('modal-open');
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open) dialog.close();
  }

  function setupDialogs() {
    document.querySelectorAll('dialog').forEach(function (dialog) {
      dialog.addEventListener('close', function () {
        if (!document.querySelector('dialog[open]')) {
          document.body.classList.remove('modal-open');
        }
      });
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
      });
    });
    refs.entryDialog.addEventListener('close', function () {
      state.editingId = null;
    });
    refs.confirmCancel.addEventListener('click', function () {
      state.confirmAction = null;
      closeDialog(refs.confirmDialog);
    });
    refs.confirmOk.addEventListener('click', function () {
      const action = state.confirmAction;
      state.confirmAction = null;
      closeDialog(refs.confirmDialog);
      if (typeof action === 'function') action();
    });
    refs.importCancel.addEventListener('click', function () {
      state.pendingImport = null;
      closeDialog(refs.importDialog);
    });
    refs.importMerge.addEventListener('click', mergePendingImport);
    refs.importReplace.addEventListener('click', replacePendingImport);
    refs.sortDialog.addEventListener('close', function () {
      if (state.view === 'settings') render();
    });
    refs.resetCategoryOrder.addEventListener('click', resetCategoryOrder);
  }

  function askConfirm(options) {
    const opts = options || {};
    state.confirmAction = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;
    refs.confirmTitle.textContent = opts.title || '确认操作';
    refs.confirmText.textContent = opts.text || '';
    refs.confirmOk.textContent = opts.okText || '确认';
    refs.confirmOk.className = 'btn ' + (opts.danger === false ? 'btn-primary' : 'btn-danger');
    refs.confirmIcon.className = 'modal-icon' + (opts.danger === false ? '' : ' danger');
    refs.confirmIcon.innerHTML = icon(opts.icon || (opts.danger === false ? 'info' : 'trash'));
    openDialog(refs.confirmDialog);
  }

  /* ---------- Entry sheet ---------- */

  function openEntry(transactionId) {
    const transaction =
      transactionId &&
      state.data.transactions.find(function (item) {
        return item.id === transactionId;
      });
    state.editingId = transaction ? transaction.id : null;
    state.entryType = transaction ? transaction.type : 'expense';
    state.entryCategory = transaction
      ? transaction.category
      : C.CATEGORIES.expense[0].id;
    if (!C.getCategoryIn(state.data, state.entryType, state.entryCategory, false)) {
      state.entryCategory = C.CATEGORIES[state.entryType][0].id;
    }

    refs.entryForm.reset();
    refs.entryKicker.textContent = transaction ? '玉子账 · 修改记录' : '玉子账 · 新的记录';
    refs.entryTitle.textContent = transaction ? '编辑这一笔' : '记一笔';
    refs.entrySave.textContent = transaction ? '保存修改' : '保存记录';
    refs.deleteEntry.hidden = !transaction;
    refs.entryError.hidden = true;
    refs.amountInput.value = transaction ? C.centsToInput(transaction.amountCents) : '';
    refs.noteInput.value = transaction ? transaction.note : '';
    refs.dateInput.value = transaction ? transaction.date : defaultEntryDate();
    refs.entryDialog.dataset.type = state.entryType;
    updateEntryTypeUI();
    openDialog(refs.entryDialog);
    window.setTimeout(function () {
      refs.amountInput.focus({ preventScroll: true });
      const length = refs.amountInput.value.length;
      if (typeof refs.amountInput.setSelectionRange === 'function') {
        refs.amountInput.setSelectionRange(length, length);
      }
    }, 120);
  }

  function updateEntryTypeUI() {
    document.querySelectorAll('#entryDialog [data-entry-type]').forEach(function (button) {
      const active = button.dataset.entryType === state.entryType;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    refs.entryDialog.dataset.type = state.entryType;
    renderEntryCategories();
  }

  function renderEntryCategories() {
    const categories = C.getCategories(state.data, state.entryType);
    refs.categoryPicker.innerHTML =
      categories
        .map(function (category) {
          const active = category.id === state.entryCategory;
          return (
            '<button class="cat-pick' +
            (active ? ' active' : '') +
            '" type="button" data-action="pick-category" data-category="' +
            category.id +
            '" aria-pressed="' +
            (active ? 'true' : 'false') +
            '" style="' +
            catStyle(category) +
            '"><span class="cat-icon">' +
            icon(catIconName(category)) +
            '</span><span>' +
            escapeHtml(category.name) +
            '</span></button>'
          );
        })
        .join('');
  }

  function setEntryType(type) {
    if (type !== 'expense' && type !== 'income') return;
    if (state.entryType === type) return;
    state.entryType = type;
    state.entryCategory = C.CATEGORIES[type][0].id;
    updateEntryTypeUI();
  }

  function pickEntryCategory(categoryId) {
    const category = C.getCategoryIn(state.data, state.entryType, categoryId, false);
    if (!category) return;
    state.entryCategory = category.id;
    renderEntryCategories();
  }

  function submitEntry(event) {
    event.preventDefault();
    refs.entryError.hidden = true;
    const amountCents = C.parseAmountToCents(refs.amountInput.value);
    if (!amountCents) {
      refs.entryError.textContent = '请输入大于 0 的金额，最多两位小数。';
      refs.entryError.hidden = false;
      refs.amountInput.focus();
      return;
    }
    const date = refs.dateInput.value;
    if (!C.isValidDate(date)) {
      refs.entryError.textContent = '请选择有效的日期。';
      refs.entryError.hidden = false;
      refs.dateInput.focus();
      return;
    }
    const category = C.getCategoryIn(state.data, state.entryType, state.entryCategory, false);
    if (!category) {
      refs.entryError.textContent = '请选择一个分类。';
      refs.entryError.hidden = false;
      return;
    }
    const existing = state.editingId
      ? state.data.transactions.find(function (item) {
          return item.id === state.editingId;
        })
      : null;
    const targetMonth = C.monthOf(date);
    const beforeBudget = C.getBudgetStatus(state.data, targetMonth);
    const beforeCategories = C.getCategoryBudgetStatuses(state.data, targetMonth);
    const transaction = {
      id: existing ? existing.id : C.uid('tx'),
      type: state.entryType,
      amountCents: amountCents,
      category: category.id,
      note: C.normalizeNote(refs.noteInput.value),
      date: date,
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    if (existing) {
      const index = state.data.transactions.indexOf(existing);
      state.data.transactions[index] = transaction;
    } else {
      state.data.transactions.push(transaction);
    }
    saveData();
    closeDialog(refs.entryDialog);
    state.month = targetMonth;
    render();
    const alert = getBudgetCrossing(beforeBudget, beforeCategories, targetMonth);
    if (alert) {
      if (navigator.vibrate) navigator.vibrate([14, 34, 14]);
      showToast(alert, {
        type: 'warning',
        actionText: '看预算',
        onAction: function () {
          location.hash = '#budget';
        },
        duration: 5400
      });
    } else {
      showToast(existing ? '这笔手账已更新' : '玉子帮你记下 ' + C.formatMoney(amountCents));
    }
  }

  function getBudgetCrossing(beforeBudget, beforeCategories, month) {
    if (!state.data.settings.budgetAlerts) return '';
    const afterBudget = C.getBudgetStatus(state.data, month);
    if (afterBudget.totalCents > 0) {
      if (beforeBudget.pct < 100 && afterBudget.pct >= 100) {
        return '玉子提醒：本月预算已超支 ' + C.formatMoney(-afterBudget.remainingCents);
      }
      if (beforeBudget.pct < 80 && afterBudget.pct >= 80 && afterBudget.pct < 100) {
        return '玉子提醒：本月预算已使用 ' + Math.round(afterBudget.pct) + '%';
      }
    }
    const beforeMap = {};
    beforeCategories.forEach(function (item) {
      beforeMap[item.id] = item;
    });
    const afterCategories = C.getCategoryBudgetStatuses(state.data, month);
    for (let index = 0; index < afterCategories.length; index += 1) {
      const item = afterCategories[index];
      const before = beforeMap[item.id];
      if (before && before.pct < 100 && item.pct >= 100) {
        return '玉子提醒：「' + item.name + '」已超分类预算';
      }
    }
    return '';
  }

  function deleteEditingEntry() {
    const id = state.editingId;
    if (!id) return;
    const index = state.data.transactions.findIndex(function (item) {
      return item.id === id;
    });
    if (index === -1) return;
    const transaction = state.data.transactions[index];
    const category = C.getCategoryIn(state.data, transaction.type, transaction.category);
    closeDialog(refs.entryDialog);
    state.data.transactions.splice(index, 1);
    saveData();
    render();
    showToast('已删除「' + category.name + '」' + C.formatMoney(transaction.amountCents), {
      actionText: '撤销',
      duration: 5200,
      onAction: function () {
        state.data.transactions.splice(Math.min(index, state.data.transactions.length), 0, transaction);
        saveData();
        state.month = C.monthOf(transaction.date);
        render();
        showToast('已撤销删除');
      }
    });
  }

  /* ---------- Custom categories ---------- */

  function openCategoryEditor(options) {
    const opts = options || {};
    const existing = opts.id
      ? state.data.categories.find(function (category) {
          return category.id === opts.id;
        })
      : null;
    const type = existing ? existing.type : opts.type === 'income' ? 'income' : 'expense';
    state.categoryMode = existing ? 'edit' : 'create';
    state.categoryType = type;
    state.categoryEditId = existing ? existing.id : null;
    state.categoryIcon = existing
      ? existing.icon
      : type === 'income'
        ? 'salary'
        : 'coffee';
    state.categoryReturnTo = refs.entryDialog.open ? 'entry' : 'settings';

    refs.categoryForm.reset();
    refs.categoryError.hidden = true;
    refs.categoryKicker.textContent = '玉子账 · ' + C.TYPE_NAMES[type] + '分类';
    refs.categoryTitle.textContent = (existing ? '编辑' : '添加') + C.TYPE_NAMES[type] + '分类';
    refs.categoryNameInput.value = existing ? existing.name : '';
    refs.categoryNote.textContent = existing
      ? '修改后，所有使用这个分类的账目都会同步更新。'
      : '自定义分类会出现在记账、统计和分类预算里。';
    refs.deleteCategory.hidden = !existing;
    renderCategoryIconPicker();
    openDialog(refs.categoryDialog);
    window.setTimeout(function () {
      refs.categoryNameInput.focus({ preventScroll: true });
    }, 120);
  }

  function renderCategoryIconPicker() {
    refs.categoryIconPicker.innerHTML = C.CUSTOM_ICON_OPTIONS.map(function (option) {
      const active = option.id === state.categoryIcon;
      return (
        '<button class="icon-pick' +
        (active ? ' active' : '') +
        '" type="button" data-action="pick-category-icon" data-icon="' +
        option.id +
        '" aria-pressed="' +
        (active ? 'true' : 'false') +
        '" style="--cat-color:' +
        option.color +
        ';--cat-soft:' +
        option.soft +
        '"><span class="cat-icon">' +
        icon(option.id) +
        '</span><span>' +
        escapeHtml(option.name) +
        '</span></button>'
      );
    }).join('');
  }

  function pickCategoryIcon(iconId) {
    const option = C.CUSTOM_ICON_OPTIONS.find(function (item) {
      return item.id === iconId;
    });
    if (!option) return;
    state.categoryIcon = option.id;
    renderCategoryIconPicker();
  }

  function submitCategory(event) {
    event.preventDefault();
    refs.categoryError.hidden = true;
    const name = C.normalizeCategoryName(refs.categoryNameInput.value);
    if (!name) {
      refs.categoryError.textContent = '给这个分类起个名字吧。';
      refs.categoryError.hidden = false;
      refs.categoryNameInput.focus();
      return;
    }
    const type = state.categoryType;
    const duplicate = C.getCategories(state.data, type).some(function (category) {
      return category.name === name && category.id !== state.categoryEditId;
    });
    if (duplicate) {
      refs.categoryError.textContent = '这个分类名称已经存在啦。';
      refs.categoryError.hidden = false;
      return;
    }
    const typeCount = state.data.categories.filter(function (category) {
      return category.type === type;
    }).length;
    if (!state.categoryEditId && typeCount >= 30) {
      refs.categoryError.textContent = '每一类最多添加 30 个自定义分类。';
      refs.categoryError.hidden = false;
      return;
    }
    const option =
      C.CUSTOM_ICON_OPTIONS.find(function (item) {
        return item.id === state.categoryIcon;
      }) || C.CUSTOM_ICON_OPTIONS[0];
    let category;
    if (state.categoryEditId) {
      category = state.data.categories.find(function (item) {
        return item.id === state.categoryEditId;
      });
      if (!category) return;
      category.name = name;
      category.icon = option.id;
      category.color = option.color;
      category.soft = option.soft;
    } else {
      category = {
        id: C.uid('custom-' + type),
        type: type,
        name: name,
        icon: option.id,
        color: option.color,
        soft: option.soft,
        custom: true
      };
      state.data.categories.push(category);
      if (!state.data.categoryOrder) state.data.categoryOrder = { expense: [], income: [] };
      if (!Array.isArray(state.data.categoryOrder[type])) state.data.categoryOrder[type] = [];
      state.data.categoryOrder[type].push(category.id);
    }
    saveData();
    closeDialog(refs.categoryDialog);
    if (state.categoryReturnTo === 'entry' && refs.entryDialog.open) {
      state.entryType = type;
      state.entryCategory = category.id;
      updateEntryTypeUI();
    } else {
      render();
    }
    showToast(state.categoryMode === 'edit' ? '分类已更新' : '已添加分类「' + name + '」');
  }

  function deleteCurrentCategory() {
    const id = state.categoryEditId;
    if (!id) return;
    const category = state.data.categories.find(function (item) {
      return item.id === id;
    });
    if (!category) return;
    const used = state.data.transactions.filter(function (transaction) {
      return transaction.category === id;
    }).length;
    const hasBudget = (state.data.budgets.categories[id] || 0) > 0;
    askConfirm({
      title: '删除这个分类？',
      text:
        '「' +
        category.name +
        '」' +
        (used ? '下有 ' + used + ' 笔账目' : '还没有账目') +
        (hasBudget ? '，并设置了分类预算' : '') +
        '。删除后账目会移到「其他」，此操作无法撤销。',
      okText: '删除分类',
      icon: 'trash',
      danger: true,
      onConfirm: function () {
        closeDialog(refs.categoryDialog);
        state.data.categories = state.data.categories.filter(function (item) {
          return item.id !== id;
        });
        if (state.data.categoryOrder && Array.isArray(state.data.categoryOrder[category.type])) {
          state.data.categoryOrder[category.type] = state.data.categoryOrder[category.type].filter(function (categoryId) {
            return categoryId !== id;
          });
        }
        const fallback = category.type === 'income' ? 'other-income' : 'other';
        state.data.transactions.forEach(function (transaction) {
          if (transaction.category === id) transaction.category = fallback;
        });
        delete state.data.budgets.categories[id];
        if (state.entryCategory === id) state.entryCategory = fallback;
        saveData();
        if (state.categoryReturnTo === 'entry' && refs.entryDialog.open) {
          renderEntryCategories();
        } else {
          render();
        }
        showToast('分类已删除，相关账目已移到「其他」');
      }
    });
  }

  /* ---------- Category order ---------- */

  function openSortDialog(type) {
    state.sortType = type === 'income' ? 'income' : 'expense';
    syncSortTabs();
    renderSortList();
    openDialog(refs.sortDialog);
  }

  function syncSortTabs() {
    refs.sortDialog.querySelectorAll('[data-action="sort-tab"]').forEach(function (button) {
      const active = button.dataset.type === state.sortType;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setSortTab(type) {
    state.sortType = type === 'income' ? 'income' : 'expense';
    syncSortTabs();
    renderSortList();
  }

  function renderSortList() {
    const categories = C.getCategories(state.data, state.sortType);
    refs.sortList.innerHTML = categories
      .map(function (category, index) {
        return (
          '<div class="sort-row">' +
          '<span class="sort-number">' + String(index + 1).padStart(2, '0') + '</span>' +
          catIcon(category, 'sort-icon') +
          '<span class="sort-main"><span class="sort-name">' +
          escapeHtml(category.name) +
          '</span><span class="sort-meta">' +
          (category.custom ? '自定义' : '内置') +
          '</span></span>' +
          '<span class="sort-actions">' +
          '<button class="sort-btn" type="button" data-action="move-category" data-dir="up" data-id="' +
          escapeHtml(category.id) +
          '" aria-label="上移 ' + escapeHtml(category.name) + '"' + (index === 0 ? ' disabled' : '') + '>' +
          icon('chevron-up') +
          '</button>' +
          '<button class="sort-btn" type="button" data-action="move-category" data-dir="down" data-id="' +
          escapeHtml(category.id) +
          '" aria-label="下移 ' + escapeHtml(category.name) + '"' + (index === categories.length - 1 ? ' disabled' : '') + '>' +
          icon('chevron-down') +
          '</button></span></div>'
        );
      })
      .join('');
  }

  function ensureCategoryOrder(type) {
    const categories = C.getCategories(state.data, type);
    if (!state.data.categoryOrder) state.data.categoryOrder = { expense: [], income: [] };
    if (!Array.isArray(state.data.categoryOrder[type]) || !state.data.categoryOrder[type].length) {
      state.data.categoryOrder[type] = categories.map(function (category) {
        return category.id;
      });
    }
    return state.data.categoryOrder[type];
  }

  function moveCategory(id, direction) {
    const order = ensureCategoryOrder(state.sortType);
    const index = order.indexOf(id);
    const target = index + (direction === 'up' ? -1 : 1);
    if (index < 0 || target < 0 || target >= order.length) return;
    const current = order[index];
    order[index] = order[target];
    order[target] = current;
    saveData();
    renderSortList();
  }

  function resetCategoryOrder() {
    const type = state.sortType;
    const categories = C.CATEGORIES[type].concat(
      state.data.categories.filter(function (category) {
        return category.type === type;
      })
    );
    state.data.categoryOrder[type] = categories.map(function (category) {
      return category.id;
    });
    saveData();
    renderSortList();
    showToast('已恢复默认顺序');
  }

  /* ---------- Budget sheet ---------- */

  function openBudgetDialog(mode, categoryId) {
    state.budgetMode = mode === 'category' ? 'category' : 'total';
    refs.budgetError.hidden = true;
    refs.budgetForm.reset();
    refs.budgetCategoryWrap.hidden = state.budgetMode !== 'category';
    if (state.budgetMode === 'total') {
      refs.budgetTitle.textContent = '设置总预算';
      refs.budgetNote.textContent = '预算会按月循环，修改后对所有月份生效。';
      refs.budgetAmountInput.value = C.centsToInput(state.data.budgets.totalCents);
      refs.clearBudget.hidden = !state.data.budgets.totalCents;
    } else {
      refs.budgetTitle.textContent = '设置分类预算';
      refs.budgetNote.textContent = '分类预算会按月循环，只统计该分类下的支出。';
      const categories = C.getCategories(state.data, 'expense');
      const firstEmpty = categories.find(function (category) {
        return !state.data.budgets.categories[category.id];
      });
      state.budgetCategory =
        categoryId && C.getCategoryIn(state.data, 'expense', categoryId, false)
          ? categoryId
          : firstEmpty
            ? firstEmpty.id
            : categories[0].id;
      renderBudgetCategoryPicker();
      syncBudgetCategoryAmount();
    }
    openDialog(refs.budgetDialog);
    window.setTimeout(function () {
      refs.budgetAmountInput.focus({ preventScroll: true });
      if (typeof refs.budgetAmountInput.setSelectionRange === 'function') {
        const length = refs.budgetAmountInput.value.length;
        refs.budgetAmountInput.setSelectionRange(length, length);
      }
    }, 120);
  }

  function renderBudgetCategoryPicker() {
    refs.budgetCategoryPicker.innerHTML = C.getCategories(state.data, 'expense')
      .map(function (category) {
        const active = category.id === state.budgetCategory;
        return (
          '<button class="cat-pick' +
          (active ? ' active' : '') +
          '" type="button" data-action="pick-budget-category" data-category="' +
          category.id +
          '" aria-pressed="' +
          (active ? 'true' : 'false') +
          '" style="' +
          catStyle(category) +
          '"><span class="cat-icon">' +
          icon(catIconName(category)) +
          '</span><span>' +
          escapeHtml(category.name) +
          '</span></button>'
        );
      })
      .join('');
  }

  function syncBudgetCategoryAmount() {
    const value = state.data.budgets.categories[state.budgetCategory] || 0;
    refs.budgetAmountInput.value = C.centsToInput(value);
    refs.clearBudget.hidden = !value;
    refs.budgetError.hidden = true;
  }

  function pickBudgetCategory(categoryId) {
    const category = C.getCategoryIn(state.data, 'expense', categoryId, false);
    if (!category) return;
    state.budgetCategory = category.id;
    renderBudgetCategoryPicker();
    syncBudgetCategoryAmount();
  }

  function submitBudget(event) {
    event.preventDefault();
    refs.budgetError.hidden = true;
    const cents = C.parseAmountToCents(refs.budgetAmountInput.value);
    if (!cents) {
      refs.budgetError.textContent = '请输入大于 0 的预算金额。';
      refs.budgetError.hidden = false;
      refs.budgetAmountInput.focus();
      return;
    }
    if (state.budgetMode === 'total') {
      state.data.budgets.totalCents = cents;
    } else {
      state.data.budgets.categories[state.budgetCategory] = cents;
    }
    saveData();
    closeDialog(refs.budgetDialog);
    render();
    showToast(state.budgetMode === 'total' ? '总预算已更新' : '分类预算已更新');
  }

  function clearCurrentBudget() {
    if (state.budgetMode === 'total') {
      state.data.budgets.totalCents = 0;
    } else {
      delete state.data.budgets.categories[state.budgetCategory];
    }
    saveData();
    closeDialog(refs.budgetDialog);
    render();
    showToast('预算已清除');
  }

  /* ---------- Export / import ---------- */

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 3000);
  }

  function exportJSON() {
    const backup = C.makeBackup(state.data);
    downloadFile(
      JSON.stringify(backup, null, 2),
      '玉子账备份-' + C.todayISO() + '.json',
      'application/json;charset=utf-8'
    );
    showToast('备份已导出，请妥善保存');
  }

  function exportCSV() {
    if (!state.data.transactions.length) {
      showToast('还没有可导出的账目', { type: 'error' });
      return;
    }
    downloadFile(
      C.transactionsToCSV(state.data.transactions, state.data),
      '玉子账目-' + C.todayISO() + '.csv',
      'text/csv;charset=utf-8'
    );
    showToast('CSV 已导出，可用表格软件打开');
  }

  async function handleImportFile() {
    const file = refs.fileInput.files && refs.fileInput.files[0];
    refs.fileInput.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const isJSON = /\.json$/i.test(file.name) || /^\s*\{/.test(text);
      if (isJSON) {
        importJSON(text);
      } else {
        importCSV(text);
      }
    } catch (error) {
      showToast(error && error.message ? error.message : '导入失败，请检查文件格式', {
        type: 'error',
        duration: 5200
      });
    }
  }

  function importJSON(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error('文件不是有效的 JSON');
    }
    if (!parsed || !Array.isArray(parsed.transactions)) {
      throw new Error('这不是玉子账备份文件（缺少 transactions 字段）');
    }
    const normalized = C.normalizeData(parsed);
    const invalid = parsed.transactions.length - normalized.transactions.length;
    state.pendingImport = normalized;
    refs.importInfo.textContent =
      '备份包含 ' +
      normalized.transactions.length +
      ' 笔有效记录' +
      (invalid > 0 ? '，另有 ' + invalid + ' 条无法识别' : '') +
      '。可以合并到现有账本，或用它覆盖当前数据。';
    const months = new Set(
      normalized.transactions.map(function (item) {
        return item.date.slice(0, 7);
      })
    ).size;
    refs.importSummary.innerHTML =
      '<div class="import-stat"><span>记录</span><strong>' +
      normalized.transactions.length +
      ' 笔</strong></div><div class="import-stat"><span>覆盖月份</span><strong>' +
      months +
      ' 个</strong></div>';
    openDialog(refs.importDialog);
  }

  function importCSV(text) {
    const result = C.csvToTransactions(text, state.data);
    if (result.error) throw new Error(result.error);
    const transactions = result.transactions;
    if (!transactions.length) throw new Error('没有识别到有效记录');
    const merged = C.mergeTransactions(state.data.transactions, transactions, true);
    state.data.transactions = merged;
    saveData();
    state.month = latestMonth(transactions);
    state.view = 'home';
    history.replaceState(null, '', '#home');
    render();
    showToast(
      '已导入 ' + transactions.length + ' 笔记录' + (result.skipped ? '，跳过 ' + result.skipped + ' 行' : ''),
      { duration: 4200 }
    );
  }

  function latestMonth(transactions) {
    const sorted = C.sortTransactions(transactions);
    return sorted.length ? C.monthOf(sorted[0].date) : C.currentMonth();
  }

  function mergePendingImport() {
    if (!state.pendingImport) return;
    const incoming = state.pendingImport;
    const categoryMap = mergeIncomingCategories(incoming);
    const mappedTransactions = incoming.transactions.map(function (transaction) {
      return Object.assign({}, transaction, {
        category: categoryMap[transaction.category] || transaction.category
      });
    });
    const before = state.data.transactions.length;
    state.data.transactions = C.mergeTransactions(state.data.transactions, mappedTransactions, true);
    const added = state.data.transactions.length - before;
    if (!state.data.budgets.totalCents && incoming.budgets.totalCents) {
      state.data.budgets.totalCents = incoming.budgets.totalCents;
    }
    Object.keys(incoming.budgets.categories).forEach(function (categoryId) {
      const mappedId = categoryMap[categoryId] || categoryId;
      if (!state.data.budgets.categories[mappedId]) {
        state.data.budgets.categories[mappedId] = incoming.budgets.categories[categoryId];
      }
    });
    saveData();
    closeDialog(refs.importDialog);
    state.pendingImport = null;
    if (incoming.transactions.length) {
      state.month = latestMonth(incoming.transactions);
      state.view = 'home';
      history.replaceState(null, '', '#home');
    }
    render();
    showToast(added ? '已合并 ' + added + ' 笔记录' : '没有新增记录，已保留现有数据');
  }

  function mergeIncomingCategories(incoming) {
    const map = {};
    (incoming.categories || []).forEach(function (category) {
      let existing =
        state.data.categories.find(function (item) {
          return item.id === category.id;
        }) ||
        state.data.categories.find(function (item) {
          return item.type === category.type && item.name === category.name;
        });
      if (!existing) {
        existing = Object.assign({}, category);
        state.data.categories.push(existing);
        if (!state.data.categoryOrder) state.data.categoryOrder = { expense: [], income: [] };
        if (!Array.isArray(state.data.categoryOrder[category.type])) {
          state.data.categoryOrder[category.type] = [];
        }
        state.data.categoryOrder[category.type].push(existing.id);
      }
      map[category.id] = existing.id;
    });
    ['expense', 'income'].forEach(function (type) {
      if (!incoming.categoryOrder || !Array.isArray(incoming.categoryOrder[type])) return;
      if (!state.data.categoryOrder) state.data.categoryOrder = { expense: [], income: [] };
      if (!Array.isArray(state.data.categoryOrder[type])) state.data.categoryOrder[type] = [];
      incoming.categoryOrder[type].forEach(function (id) {
        const mappedId = map[id] || id;
        if (state.data.categoryOrder[type].indexOf(mappedId) === -1) {
          state.data.categoryOrder[type].push(mappedId);
        }
      });
    });
    return map;
  }

  function replacePendingImport() {
    if (!state.pendingImport) return;
    const incoming = state.pendingImport;
    closeDialog(refs.importDialog);
    askConfirm({
      title: '覆盖当前数据？',
      text:
        '当前账本中的 ' +
        state.data.transactions.length +
        ' 笔记录和预算将被备份中的内容替换，此操作无法撤销。',
      okText: '覆盖数据',
      icon: 'alert',
      danger: true,
      onConfirm: function () {
        state.data = C.normalizeData(incoming);
        state.pendingImport = null;
        saveData();
        state.month = latestMonth(state.data.transactions);
        state.view = 'home';
        history.replaceState(null, '', '#home');
        render();
        showToast('备份已恢复');
      }
    });
  }

  /* ---------- Clear / install ---------- */

  function clearAllData() {
    askConfirm({
      title: '清空所有数据？',
      text:
        '本机保存的 ' +
        state.data.transactions.length +
        ' 笔账目和预算将被永久删除，无法恢复。建议先导出备份。',
      okText: '确认清空',
      icon: 'trash',
      danger: true,
      onConfirm: function () {
        state.data = C.createEmptyData();
        saveData();
        state.month = C.currentMonth();
        render();
        showToast('已清空所有数据');
      }
    });
  }

  async function handleInstall() {
    if (window.isSecureContext === false) {
      showToast('当前是局域网 HTTP 预览，可正常记账；安装到主屏幕和离线使用需要 HTTPS 部署。', {
        duration: 6200
      });
      return;
    }
    if (state.installPrompt) {
      const promptEvent = state.installPrompt;
      state.installPrompt = null;
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          showToast('安装完成，可以从桌面打开玉子账');
        }
      } catch (error) {
        console.warn('安装提示失败', error);
      }
      if (state.view === 'settings') render();
      return;
    }
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    showToast(
      isIOS
        ? '在 Safari 中点底部「分享」按钮，再选择「添加到主屏幕」'
        : '打开浏览器右上角菜单，选择「安装应用」或「添加到主屏幕」',
      { duration: 5600 }
    );
  }

  async function forceRefreshApp() {
    showToast('正在清理旧缓存…', { duration: 1200 });
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(function (registration) {
            return registration.unregister();
          })
        );
      }
      if (window.caches && typeof caches.keys === 'function') {
        const keys = await caches.keys();
        await Promise.all(
          keys.map(function (key) {
            return caches.delete(key);
          })
        );
      }
    } catch (error) {
      console.warn('清理缓存失败', error);
    }
    const url = new URL(location.href);
    url.searchParams.set('v', Date.now().toString(36));
    url.hash = '#settings';
    window.setTimeout(function () {
      location.replace(url.toString());
    }, 350);
  }

  /* ---------- Events ---------- */

  function handleAction(element, event) {
    const action = element.dataset.action;
    if (action === 'open-entry') {
      openEntry();
      return;
    }
    if (action === 'edit-entry') {
      openEntry(element.dataset.id);
      return;
    }
    if (action === 'prev-month') {
      state.month = C.shiftMonth(state.month, -1);
      render();
      return;
    }
    if (action === 'next-month') {
      state.month = C.shiftMonth(state.month, 1);
      render();
      return;
    }
    if (action === 'current-month') {
      state.month = C.currentMonth();
      render();
      return;
    }
    if (action === 'report-type') {
      state.reportType = element.dataset.type === 'income' ? 'income' : 'expense';
      render();
      return;
    }
    if (action === 'pick-category') {
      pickEntryCategory(element.dataset.category);
      return;
    }
    if (action === 'pick-budget-category') {
      pickBudgetCategory(element.dataset.category);
      return;
    }
    if (action === 'open-total-budget') {
      openBudgetDialog('total');
      return;
    }
    if (action === 'open-category-budget') {
      openBudgetDialog('category', element.dataset.category || '');
      return;
    }
    if (action === 'open-category-editor') {
      openCategoryEditor({
        id: element.dataset.id || '',
        type: element.dataset.type || state.entryType
      });
      return;
    }
    if (action === 'pick-category-icon') {
      pickCategoryIcon(element.dataset.icon);
      return;
    }
    if (action === 'open-sort-dialog') {
      openSortDialog('expense');
      return;
    }
    if (action === 'sort-tab') {
      setSortTab(element.dataset.type);
      return;
    }
    if (action === 'move-category') {
      moveCategory(element.dataset.id, element.dataset.dir);
      return;
    }
    if (action === 'export-json') {
      exportJSON();
      return;
    }
    if (action === 'export-csv') {
      exportCSV();
      return;
    }
    if (action === 'import-data') {
      refs.fileInput.click();
      return;
    }
    if (action === 'clear-data') {
      clearAllData();
      return;
    }
    if (action === 'install') {
      handleInstall();
      return;
    }
    if (action === 'check-update') {
      forceRefreshApp();
      return;
    }
    if (event) event.preventDefault();
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const closeButton = target.closest('[data-close-dialog]');
      if (closeButton) {
        event.preventDefault();
        closeDialog(document.getElementById(closeButton.dataset.closeDialog));
        return;
      }
      const actionElement = target.closest('[data-action]');
      if (actionElement) {
        event.preventDefault();
        handleAction(actionElement, event);
        return;
      }
      const typeButton = target.closest('[data-entry-type]');
      if (typeButton) {
        event.preventDefault();
        setEntryType(typeButton.dataset.entryType);
      }
    });

    refs.entryForm.addEventListener('submit', submitEntry);
    refs.deleteEntry.addEventListener('click', deleteEditingEntry);
    refs.categoryForm.addEventListener('submit', submitCategory);
    refs.deleteCategory.addEventListener('click', deleteCurrentCategory);
    refs.categoryNameInput.addEventListener('input', function () {
      refs.categoryError.hidden = true;
    });
    refs.budgetForm.addEventListener('submit', submitBudget);
    refs.clearBudget.addEventListener('click', clearCurrentBudget);
    refs.toastAction.addEventListener('click', function () {
      const action = state.toastActionHandler;
      hideToast();
      if (typeof action === 'function') action();
    });
    refs.fileInput.addEventListener('change', handleImportFile);

    refs.amountInput.addEventListener('input', function () {
      refs.amountInput.value = refs.amountInput.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
      refs.entryError.hidden = true;
    });
    refs.budgetAmountInput.addEventListener('input', function () {
      refs.budgetAmountInput.value = refs.budgetAmountInput.value
        .replace(/[^\d.]/g, '')
        .replace(/(\..*)\./g, '$1');
      refs.budgetError.hidden = true;
    });

    document.addEventListener('change', function (event) {
      if (event.target && event.target.id === 'budgetAlertToggle') {
        state.data.settings.budgetAlerts = event.target.checked;
        saveData();
        showToast(event.target.checked ? '预算提醒已开启' : '预算提醒已关闭');
      }
    });

    window.addEventListener('hashchange', function () {
      state.view = readView();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('[data-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (tab.dataset.tab === state.view) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      state.installPrompt = event;
      if (state.view === 'settings') render();
    });

    window.addEventListener('appinstalled', function () {
      state.installPrompt = null;
      if (state.view === 'settings') render();
      showToast('玉子账已安装到主屏幕');
    });

    window.addEventListener('storage', function (event) {
      if (event.key !== DATA_KEY || !event.newValue) return;
      try {
        state.data = C.normalizeData(JSON.parse(event.newValue));
        render();
      } catch (error) {
        console.warn('同步其他标签页数据失败', error);
      }
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (error) {
        console.warn('Service Worker 注册失败', error);
      });
    });
  }

  function start() {
    setupDialogs();
    bindEvents();
    render();
    registerServiceWorker();
    const params = new URLSearchParams(location.search);
    if (params.get('add') === '1') {
      history.replaceState(null, '', location.pathname + location.hash);
      window.setTimeout(function () {
        openEntry();
      }, 250);
    }
  }

  start();
})();
