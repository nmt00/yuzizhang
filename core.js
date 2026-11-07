(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QZCore = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 1;
  const APP_ID = 'yuzizhang';

  const CATEGORIES = {
    expense: [
      { id: 'food', name: '餐饮', icon: 'food', color: '#D97941', soft: '#FBEDE3' },
      { id: 'transport', name: '交通', icon: 'transport', color: '#4F7FC4', soft: '#E9F0FA' },
      { id: 'shopping', name: '购物', icon: 'shopping', color: '#C26891', soft: '#F9EAF1' },
      { id: 'home', name: '居住', icon: 'home', color: '#A77A40', soft: '#F6EFE3' },
      { id: 'fun', name: '娱乐', icon: 'fun', color: '#7B6CC4', soft: '#EFECFA' },
      { id: 'health', name: '医疗', icon: 'health', color: '#C85C5C', soft: '#FAE9E9' },
      { id: 'education', name: '学习', icon: 'education', color: '#3E8C78', soft: '#E4F2ED' },
      { id: 'communication', name: '通讯', icon: 'communication', color: '#568EAF', soft: '#E8F1F6' },
      { id: 'social', name: '人情', icon: 'social', color: '#B86E52', soft: '#F8ECE6' },
      { id: 'other', name: '其他', icon: 'other', color: '#80877E', soft: '#EFF1EC' }
    ],
    income: [
      { id: 'salary', name: '工资', icon: 'salary', color: '#267D63', soft: '#E2F1EB' },
      { id: 'bonus', name: '奖金', icon: 'bonus', color: '#B78324', soft: '#F8F0DC' },
      { id: 'parttime', name: '兼职', icon: 'parttime', color: '#4C74B8', soft: '#E8EEF9' },
      { id: 'invest', name: '理财', icon: 'invest', color: '#5E8A55', soft: '#EAF2E7' },
      { id: 'gift', name: '红包', icon: 'gift', color: '#BD6E8E', soft: '#F9EAF0' },
      { id: 'other-income', name: '其他', icon: 'other-income', color: '#80877E', soft: '#EFF1EC' }
    ]
  };

  const TYPE_NAMES = { expense: '支出', income: '收入' };
  const CUSTOM_ICON_OPTIONS = [
    { id: 'coffee', name: '咖啡', color: '#B47A4A', soft: '#F7ECE1' },
    { id: 'paw', name: '宠物', color: '#C37796', soft: '#F9E9F0' },
    { id: 'travel', name: '旅行', color: '#4E8DB6', soft: '#E8F2F8' },
    { id: 'camera', name: '摄影', color: '#7C77B9', soft: '#EEEDFA' },
    { id: 'food', name: '餐饮', color: '#D97941', soft: '#FBEDE3' },
    { id: 'shopping', name: '购物', color: '#C26891', soft: '#F9EAF1' },
    { id: 'fun', name: '娱乐', color: '#7B6CC4', soft: '#EFECFA' },
    { id: 'health', name: '医疗', color: '#C85C5C', soft: '#FAE9E9' },
    { id: 'education', name: '学习', color: '#3E8C78', soft: '#E4F2ED' },
    { id: 'social', name: '礼物', color: '#B86E52', soft: '#F8ECE6' },
    { id: 'salary', name: '收入', color: '#4E936F', soft: '#E4F2E8' },
    { id: 'invest', name: '理财', color: '#6F9A64', soft: '#EAF2E7' },
    { id: 'music', name: '音乐', color: '#7B6FB5', soft: '#F0EEFA' },
    { id: 'movie', name: '电影', color: '#687FA8', soft: '#EAF0F8' },
    { id: 'sport', name: '运动', color: '#4F9B78', soft: '#E5F3EC' },
    { id: 'sparkle', name: '心愿', color: '#C6943D', soft: '#FBF2DC' },
    { id: 'plant', name: '植物', color: '#5C9A63', soft: '#E8F3E5' },
    { id: 'baby', name: '宝宝', color: '#D58DA2', soft: '#FAECF0' },
    { id: 'plane', name: '出行', color: '#5A91B4', soft: '#E9F3F8' },
    { id: 'cake', name: '甜点', color: '#C87E9A', soft: '#FAECF2' },
    { id: 'wine', name: '小酌', color: '#A66A7A', soft: '#F7ECEF' },
    { id: 'money', name: '存钱', color: '#B58B3F', soft: '#F8F0DF' }
  ];
  const CUSTOM_ICON_MAP = {};
  CUSTOM_ICON_OPTIONS.forEach(function (option) {
    CUSTOM_ICON_MAP[option.id] = option;
  });
  const CATEGORY_MAP = {};
  Object.keys(CATEGORIES).forEach(function (type) {
    CATEGORIES[type].forEach(function (category) {
      CATEGORY_MAP[type + ':' + category.id] = category;
      CATEGORY_MAP[type + ':' + category.name] = category;
    });
  });

  function allCategories(type) {
    if (type && CATEGORIES[type]) return CATEGORIES[type].slice();
    return CATEGORIES.expense.concat(CATEGORIES.income);
  }

  function getCategory(type, idOrName, fallback) {
    const match = CATEGORY_MAP[type + ':' + idOrName];
    if (match) return match;
    if (fallback === false) return null;
    return CATEGORIES[type][CATEGORIES[type].length - 1];
  }

  function getCategories(data, type) {
    const custom =
      data && Array.isArray(data.categories)
        ? data.categories.filter(function (category) {
            return category.type === type;
          })
        : [];
    const base = CATEGORIES[type].concat(custom);
    const order = data && data.categoryOrder && data.categoryOrder[type];
    if (!Array.isArray(order) || !order.length) return base;
    const byId = {};
    base.forEach(function (category) {
      byId[category.id] = category;
    });
    const sorted = [];
    const used = new Set();
    order.forEach(function (id) {
      if (byId[id] && !used.has(id)) {
        sorted.push(byId[id]);
        used.add(id);
      }
    });
    base.forEach(function (category) {
      if (!used.has(category.id)) {
        sorted.push(category);
        used.add(category.id);
      }
    });
    return sorted;
  }

  function normalizeCategoryOrder(rawOrder, data) {
    const result = { expense: [], income: [] };
    ['expense', 'income'].forEach(function (type) {
      const base = CATEGORIES[type].concat(
        (data.categories || []).filter(function (category) {
          return category.type === type;
        })
      );
      const byId = {};
      base.forEach(function (category) {
        byId[category.id] = category;
      });
      const seen = new Set();
      const raw = rawOrder && Array.isArray(rawOrder[type]) ? rawOrder[type] : [];
      raw.forEach(function (id) {
        if (byId[id] && !seen.has(id)) {
          result[type].push(id);
          seen.add(id);
        }
      });
      base.forEach(function (category) {
        if (!seen.has(category.id)) {
          result[type].push(category.id);
          seen.add(category.id);
        }
      });
    });
    return result;
  }

  function getCategoryIn(data, type, idOrName, fallback) {
    const list = getCategories(data, type);
    const match = list.find(function (category) {
      return category.id === idOrName || category.name === idOrName;
    });
    if (match) return match;
    if (fallback === false) return null;
    return CATEGORIES[type][CATEGORIES[type].length - 1];
  }

  function getCustomIconOption(icon) {
    return CUSTOM_ICON_MAP[icon] || CUSTOM_ICON_MAP.paw;
  }

  function normalizeCategoryName(name) {
    return String(name == null ? '' : name)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10);
  }

  function normalizeCustomCategories(rawCategories) {
    if (!Array.isArray(rawCategories)) return [];
    const result = [];
    const usedIds = new Set();
    const usedNames = new Set();
    rawCategories.forEach(function (raw) {
      if (!raw || typeof raw !== 'object' || result.length >= 100) return;
      const type = raw.type === 'income' ? 'income' : 'expense';
      const name = normalizeCategoryName(raw.name);
      if (!name) return;
      const nameKey = type + ':' + name.toLowerCase();
      if (usedNames.has(nameKey)) return;
      const builtInNames = CATEGORIES[type].map(function (category) {
        return category.name.toLowerCase();
      });
      if (builtInNames.indexOf(name.toLowerCase()) !== -1) return;
      const icon = getCustomIconOption(raw.icon);
      let id =
        typeof raw.id === 'string' && raw.id.indexOf('custom-') === 0
          ? raw.id.trim()
          : uid('custom-' + type);
      if (usedIds.has(id)) id = uid('custom-' + type);
      usedIds.add(id);
      usedNames.add(nameKey);
      result.push({
        id: id,
        type: type,
        name: name,
        icon: icon.id,
        color: icon.color,
        soft: icon.soft,
        custom: true
      });
    });
    return result;
  }

  function uid(prefix) {
    const head = prefix || 'tx';
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return head + '-' + crypto.randomUUID();
    }
    return head + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function todayISO(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function currentMonth(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  }

  function parseDateParts(dateString) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateString || ''));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return { year: year, month: month, day: day, date: date };
  }

  function isValidDate(dateString) {
    return Boolean(parseDateParts(dateString));
  }

  function monthOf(dateString) {
    const parts = parseDateParts(dateString);
    return parts ? parts.year + '-' + pad2(parts.month) : '';
  }

  function daysInMonth(month) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(month || ''));
    if (!match) return 30;
    return new Date(Number(match[1]), Number(match[2]), 0).getDate();
  }

  function shiftMonth(month, delta) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(month || ''));
    if (!match) return currentMonth();
    const date = new Date(Number(match[1]), Number(match[2]) - 1 + Number(delta || 0), 1);
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1);
  }

  function monthLabel(month, short) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(month || ''));
    if (!match) return String(month || '');
    return short ? Number(match[2]) + '月' : match[1] + '年' + Number(match[2]) + '月';
  }

  function formatDateCN(dateString) {
    const parts = parseDateParts(dateString);
    if (!parts) return dateString;
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return parts.month + '月' + parts.day + '日 周' + weekdays[parts.date.getDay()];
  }

  function relativeDayLabel(dateString, today) {
    const parts = parseDateParts(dateString);
    if (!parts) return dateString;
    const now = today || todayISO();
    if (dateString === now) return '今天';
    const nowDate = new Date(now + 'T00:00:00');
    const target = new Date(dateString + 'T00:00:00');
    const diff = Math.round((nowDate - target) / 86400000);
    if (diff === 1) return '昨天';
    if (diff === 2) return '前天';
    return parts.month + '月' + parts.day + '日';
  }

  function parseAmountToCents(value) {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value <= 0) return 0;
      return Math.round(value * 100);
    }
    let text = String(value == null ? '' : value)
      .replace(/[\s,，¥￥]/g, '')
      .trim();
    if (!text) return 0;
    if (text.charAt(0) === '.') text = '0' + text;
    if (!/^\d+(\.\d{0,2})?$/.test(text)) return 0;
    const number = Number(text);
    if (!Number.isFinite(number) || number <= 0) return 0;
    return Math.round(number * 100);
  }

  function centsToInput(cents) {
    const value = Math.max(0, Math.round(Number(cents) || 0));
    if (!value) return '';
    const yuan = Math.floor(value / 100);
    const fen = value % 100;
    return fen ? yuan + '.' + pad2(fen) : String(yuan);
  }

  function formatMoney(cents, options) {
    const opts = options || {};
    const value = Math.round(Number(cents) || 0);
    const absolute = Math.abs(value);
    const text = (absolute / 100).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    let prefix = '';
    if (value < 0) prefix += '-';
    if (opts.sign && value > 0) prefix += '+';
    if (opts.symbol !== false) prefix += '¥';
    return prefix + text;
  }

  function compactMoney(cents) {
    const value = Math.abs(Math.round(Number(cents) || 0)) / 100;
    if (value >= 100000000) return (value / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
    if (value >= 10000) return (value / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(Math.round(value));
  }

  function clampNonNegativeInt(value, fallback) {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number) || number < 0) return fallback || 0;
    return Math.min(number, 99999999999);
  }

  function normalizeNote(note) {
    return String(note == null ? '' : note).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 200);
  }

  function normalizeTransaction(raw, index, usedIds, data) {
    if (!raw || typeof raw !== 'object') return null;
    const type = raw.type === 'income' || raw.type === '收入' ? 'income' : 'expense';
    const rawAmount = raw.amountCents != null ? raw.amountCents : raw.amount;
    const amountCents =
      raw.amountCents != null
        ? clampNonNegativeInt(raw.amountCents, 0)
        : parseAmountToCents(raw.amount);
    const explicitZero =
      rawAmount === 0 ||
      rawAmount === '0' ||
      rawAmount === '0.0' ||
      rawAmount === '0.00';
    if (!amountCents && !explicitZero) return null;
    const date = isValidDate(raw.date) ? raw.date : todayISO();
    const category = getCategoryIn(data, type, raw.category || raw.categoryId || '', false);
    let id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : uid('tx');
    if (usedIds.has(id)) id = uid('tx');
    usedIds.add(id);
    const createdAt =
      typeof raw.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt))
        ? raw.createdAt
        : new Date(Date.now() - (index || 0)).toISOString();
    return {
      id: id,
      type: type,
      amountCents: amountCents,
      category: category ? category.id : type === 'income' ? 'other-income' : 'other',
      note: normalizeNote(raw.note),
      date: date,
      createdAt: createdAt
    };
  }

  function createEmptyData() {
    return {
      version: VERSION,
      transactions: [],
      categories: [],
      categoryOrder: { expense: [], income: [] },
      budgets: { totalCents: 0, categories: {} },
      settings: { budgetAlerts: true },
      createdAt: new Date().toISOString()
    };
  }

  function normalizeData(raw) {
    const data = createEmptyData();
    if (!raw || typeof raw !== 'object') return data;
    data.categories = normalizeCustomCategories(raw.categories);
    data.categoryOrder = normalizeCategoryOrder(raw.categoryOrder, data);
    const source = Array.isArray(raw.transactions) ? raw.transactions : [];
    const usedIds = new Set();
    data.transactions = source
      .map(function (item, index) {
        return normalizeTransaction(item, index, usedIds, data);
      })
      .filter(Boolean);
    if (raw.budgets && typeof raw.budgets === 'object') {
      data.budgets.totalCents = clampNonNegativeInt(raw.budgets.totalCents, 0);
      const budgets = raw.budgets.categories;
      if (budgets && typeof budgets === 'object') {
        getCategories(data, 'expense').forEach(function (category) {
          const value = clampNonNegativeInt(budgets[category.id], 0);
          if (value > 0) data.budgets.categories[category.id] = value;
        });
      }
    }
    if (raw.settings && typeof raw.settings === 'object') {
      data.settings.budgetAlerts = raw.settings.budgetAlerts !== false;
    }
    if (typeof raw.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt))) {
      data.createdAt = raw.createdAt;
    }
    return data;
  }

  function sortTransactions(transactions) {
    return transactions.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      const aTime = Date.parse(a.createdAt) || 0;
      const bTime = Date.parse(b.createdAt) || 0;
      if (aTime !== bTime) return bTime - aTime;
      return String(b.id).localeCompare(String(a.id));
    });
  }

  function getMonthTransactions(data, month) {
    return sortTransactions(
      (data.transactions || []).filter(function (transaction) {
        return transaction.date.slice(0, 7) === month;
      })
    );
  }

  function getMonthSummary(data, month) {
    const summary = { incomeCents: 0, expenseCents: 0, balanceCents: 0, count: 0 };
    (data.transactions || []).forEach(function (transaction) {
      if (transaction.date.slice(0, 7) !== month) return;
      summary.count += 1;
      if (transaction.type === 'income') summary.incomeCents += transaction.amountCents;
      else summary.expenseCents += transaction.amountCents;
    });
    summary.balanceCents = summary.incomeCents - summary.expenseCents;
    return summary;
  }

  function getCategoryBreakdown(data, month, type) {
    const map = {};
    (data.transactions || []).forEach(function (transaction) {
      if (transaction.date.slice(0, 7) !== month || transaction.type !== type) return;
      const category = getCategoryIn(data, type, transaction.category);
      if (!map[category.id]) {
        map[category.id] = {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          soft: category.soft,
          amountCents: 0,
          count: 0
        };
      }
      map[category.id].amountCents += transaction.amountCents;
      map[category.id].count += 1;
    });
    return Object.keys(map)
      .map(function (key) {
        return map[key];
      })
      .sort(function (a, b) {
        return b.amountCents - a.amountCents;
      });
  }

  function getBudgetStatus(data, month, now) {
    const summary = getMonthSummary(data, month);
    const totalCents = clampNonNegativeInt(data.budgets && data.budgets.totalCents, 0);
    const remainingCents = totalCents - summary.expenseCents;
    const pct = totalCents > 0 ? (summary.expenseCents / totalCents) * 100 : 0;
    const level = totalCents <= 0 ? 'none' : pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
    const current = currentMonth(now || new Date());
    const day = (now || new Date()).getDate();
    let daysLeft = 0;
    if (month === current) daysLeft = Math.max(daysInMonth(month) - day + 1, 1);
    else if (month > current) daysLeft = daysInMonth(month);
    const dailyAllowanceCents =
      totalCents > 0 && daysLeft > 0 ? Math.max(remainingCents, 0) / daysLeft : 0;
    return {
      totalCents: totalCents,
      spentCents: summary.expenseCents,
      remainingCents: remainingCents,
      pct: pct,
      level: level,
      daysLeft: daysLeft,
      dailyAllowanceCents: Math.round(dailyAllowanceCents),
      isCurrentMonth: month === current
    };
  }

  function getCategoryBudgetStatuses(data, month) {
    const budgets = (data.budgets && data.budgets.categories) || {};
    const spentMap = {};
    (data.transactions || []).forEach(function (transaction) {
      if (transaction.date.slice(0, 7) !== month || transaction.type !== 'expense') return;
      spentMap[transaction.category] = (spentMap[transaction.category] || 0) + transaction.amountCents;
    });
    return getCategories(data, 'expense')
      .filter(function (category) {
        return clampNonNegativeInt(budgets[category.id], 0) > 0;
      })
      .map(function (category) {
        const budgetCents = clampNonNegativeInt(budgets[category.id], 0);
        const spentCents = spentMap[category.id] || 0;
        const pct = budgetCents > 0 ? (spentCents / budgetCents) * 100 : 0;
        return {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          soft: category.soft,
          budgetCents: budgetCents,
          spentCents: spentCents,
          remainingCents: budgetCents - spentCents,
          pct: pct,
          level: pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok'
        };
      });
  }

  function getBudgetAlerts(data, month) {
    const alerts = [];
    const status = getBudgetStatus(data, month);
    if (status.level === 'over') {
      alerts.push({
        level: 'danger',
        title: '本月预算已超支',
        text: '超出 ' + formatMoney(-status.remainingCents)
      });
    } else if (status.level === 'warn') {
      alerts.push({
        level: 'warn',
        title: '预算快用完了',
        text: '已使用 ' + Math.round(status.pct) + '%，剩余 ' + formatMoney(status.remainingCents)
      });
    }
    const overCategories = getCategoryBudgetStatuses(data, month).filter(function (item) {
      return item.level === 'over';
    });
    if (overCategories.length) {
      alerts.push({
        level: 'warn',
        title: overCategories.length + ' 个分类超预算',
        text: overCategories
          .map(function (item) {
            return item.name;
          })
          .join('、')
      });
    }
    return alerts;
  }

  function getRecentMonths(endMonth, count) {
    const total = Math.max(1, Number(count) || 6);
    const months = [];
    for (let index = total - 1; index >= 0; index -= 1) {
      months.push(shiftMonth(endMonth, -index));
    }
    return months;
  }

  function groupByDate(transactions) {
    const groups = [];
    const map = {};
    transactions.forEach(function (transaction) {
      if (!map[transaction.date]) {
        map[transaction.date] = {
          date: transaction.date,
          transactions: [],
          incomeCents: 0,
          expenseCents: 0
        };
        groups.push(map[transaction.date]);
      }
      const group = map[transaction.date];
      group.transactions.push(transaction);
      if (transaction.type === 'income') group.incomeCents += transaction.amountCents;
      else group.expenseCents += transaction.amountCents;
    });
    return groups;
  }

  function makeBackup(data) {
    return {
      app: APP_ID,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      transactions: (data.transactions || []).map(function (transaction) {
        return {
          id: transaction.id,
          type: transaction.type,
          amount: Number((transaction.amountCents / 100).toFixed(2)),
          category: transaction.category,
          note: transaction.note,
          date: transaction.date,
          createdAt: transaction.createdAt
        };
      }),
      categories: (data.categories || []).map(function (category) {
        return {
          id: category.id,
          type: category.type,
          name: category.name,
          icon: category.icon,
          color: category.color,
          soft: category.soft
        };
      }),
      categoryOrder: {
        expense: (data.categoryOrder && data.categoryOrder.expense) || [],
        income: (data.categoryOrder && data.categoryOrder.income) || []
      },
      budgets: {
        totalCents: data.budgets.totalCents,
        categories: Object.assign({}, data.budgets.categories)
      },
      settings: Object.assign({}, data.settings)
    };
  }

  function csvEscape(value) {
    const text = String(value == null ? '' : value);
    if (/[",\r\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function transactionsToCSV(transactions, data) {
    const header = ['日期', '类型', '分类', '金额', '备注'];
    const lines = [header.join(',')];
    sortTransactions(transactions).forEach(function (transaction) {
      const category = getCategoryIn(data, transaction.type, transaction.category);
      lines.push(
        [
          transaction.date,
          TYPE_NAMES[transaction.type],
          category.name,
          (transaction.amountCents / 100).toFixed(2),
          transaction.note || ''
        ]
          .map(csvEscape)
          .join(',')
      );
    });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }

  function parseCSVRows(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const source = String(text || '').replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index += 1) {
      const char = source.charAt(index);
      if (inQuotes) {
        if (char === '"') {
          if (source.charAt(index + 1) === '"') {
            field += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
        continue;
      }
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field.replace(/\r$/, ''));
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
    if (field.length || row.length) {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
    }
    return rows.filter(function (cells) {
      return cells.some(function (cell) {
        return String(cell).trim() !== '';
      });
    });
  }

  function normalizeHeader(value) {
    return String(value || '')
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase();
  }

  function findHeaderIndex(headers, names) {
    for (let index = 0; index < headers.length; index += 1) {
      if (names.indexOf(headers[index]) !== -1) return index;
    }
    return -1;
  }

  function csvToTransactions(text, data) {
    const rows = parseCSVRows(text);
    if (!rows.length) return { transactions: [], skipped: 0, error: '文件是空的' };
    const headers = rows[0].map(normalizeHeader);
    const dateIndex = findHeaderIndex(headers, ['日期', 'date', '时间']);
    const typeIndex = findHeaderIndex(headers, ['类型', 'type', '收支']);
    const categoryIndex = findHeaderIndex(headers, ['分类', 'category', '类别']);
    const amountIndex = findHeaderIndex(headers, ['金额', 'amount', 'money']);
    const noteIndex = findHeaderIndex(headers, ['备注', 'note', '说明', 'memo']);
    if (dateIndex === -1 || typeIndex === -1 || amountIndex === -1) {
      return {
        transactions: [],
        skipped: rows.length - 1,
        error: '没有找到“日期、类型、金额”表头，请使用玉子账导出的 CSV 格式'
      };
    }
    const result = [];
    let skipped = 0;
    const usedIds = new Set();
    for (let index = 1; index < rows.length; index += 1) {
      const cells = rows[index];
      let date = String(cells[dateIndex] || '').trim().replace(/\//g, '-');
      const dateMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
      if (dateMatch) {
        date = dateMatch[1] + '-' + pad2(dateMatch[2]) + '-' + pad2(dateMatch[3]);
      }
      let typeText = String(cells[typeIndex] || '').trim().toLowerCase();
      let type = '';
      if (typeText === '支出' || typeText === 'expense' || typeText === 'out') type = 'expense';
      if (typeText === '收入' || typeText === 'income' || typeText === 'in') type = 'income';
      const amountCents = parseAmountToCents(String(cells[amountIndex] || '').replace(/[^\d.,]/g, ''));
      if (!isValidDate(date) || !type || !amountCents) {
        skipped += 1;
        continue;
      }
      const categoryText = categoryIndex === -1 ? '' : String(cells[categoryIndex] || '').trim();
      const category = getCategoryIn(data, type, categoryText, false);
      result.push(
        normalizeTransaction(
          {
            type: type,
            amountCents: amountCents,
            category: category ? category.id : '',
            note: noteIndex === -1 ? '' : cells[noteIndex],
            date: date,
            createdAt: new Date().toISOString()
          },
          result.length,
          usedIds,
          data
        )
      );
    }
    return {
      transactions: result.filter(Boolean),
      skipped: skipped,
      error: result.length ? '' : '没有识别到有效记录'
    };
  }

  function mergeTransactions(existing, incoming, keepExistingIds) {
    const result = existing.slice();
    const ids = new Set(
      existing.map(function (transaction) {
        return transaction.id;
      })
    );
    incoming.forEach(function (transaction) {
      if (keepExistingIds !== false && ids.has(transaction.id)) return;
      let next = transaction;
      if (ids.has(transaction.id)) next = Object.assign({}, transaction, { id: uid('tx') });
      ids.add(next.id);
      result.push(next);
    });
    return result;
  }

  function getDataSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return JSON.stringify(data).length;
    }
  }

  function formatFileSize(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    return (value / 1024 / 1024).toFixed(1) + ' MB';
  }

  return {
    VERSION: VERSION,
    APP_ID: APP_ID,
    CATEGORIES: CATEGORIES,
    CUSTOM_ICON_OPTIONS: CUSTOM_ICON_OPTIONS,
    TYPE_NAMES: TYPE_NAMES,
    allCategories: allCategories,
    getCategory: getCategory,
    getCategories: getCategories,
    getCategoryIn: getCategoryIn,
    normalizeCategoryName: normalizeCategoryName,
    normalizeCustomCategories: normalizeCustomCategories,
    normalizeCategoryOrder: normalizeCategoryOrder,
    uid: uid,
    todayISO: todayISO,
    currentMonth: currentMonth,
    monthOf: monthOf,
    isValidDate: isValidDate,
    daysInMonth: daysInMonth,
    shiftMonth: shiftMonth,
    monthLabel: monthLabel,
    formatDateCN: formatDateCN,
    relativeDayLabel: relativeDayLabel,
    parseAmountToCents: parseAmountToCents,
    centsToInput: centsToInput,
    formatMoney: formatMoney,
    compactMoney: compactMoney,
    normalizeNote: normalizeNote,
    createEmptyData: createEmptyData,
    normalizeData: normalizeData,
    normalizeTransaction: normalizeTransaction,
    sortTransactions: sortTransactions,
    getMonthTransactions: getMonthTransactions,
    getMonthSummary: getMonthSummary,
    getCategoryBreakdown: getCategoryBreakdown,
    getBudgetStatus: getBudgetStatus,
    getCategoryBudgetStatuses: getCategoryBudgetStatuses,
    getBudgetAlerts: getBudgetAlerts,
    getRecentMonths: getRecentMonths,
    groupByDate: groupByDate,
    makeBackup: makeBackup,
    transactionsToCSV: transactionsToCSV,
    parseCSVRows: parseCSVRows,
    csvToTransactions: csvToTransactions,
    mergeTransactions: mergeTransactions,
    getDataSize: getDataSize,
    formatFileSize: formatFileSize
  };
});
