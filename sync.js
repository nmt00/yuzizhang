(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./core.js'));
  } else {
    root.QZSync = factory(root.QZCore);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';

  function time(value) {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function maxTimestamp(left, right) {
    return time(right) > time(left) ? right : left;
  }

  function maxMap(left, right) {
    const result = Object.assign({}, left || {});
    Object.keys(right || {}).forEach(function (key) {
      if (time(right[key]) > time(result[key])) result[key] = right[key];
    });
    return result;
  }

  function canonical(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  function mergeCollection(localList, remoteList, localTombs, remoteTombs) {
    const localById = {};
    const remoteById = {};
    (localList || []).forEach(function (item) {
      localById[item.id] = item;
    });
    (remoteList || []).forEach(function (item) {
      remoteById[item.id] = item;
    });
    const tombstones = maxMap(localTombs, remoteTombs);
    const ids = Object.keys(Object.assign({}, localById, remoteById));
    const records = [];

    ids.forEach(function (id) {
      const localRecord = localById[id];
      const remoteRecord = remoteById[id];
      const localTime = Math.max(
        localRecord ? time(localRecord.updatedAt) : 0,
        time((localTombs || {})[id])
      );
      const remoteTime = Math.max(
        remoteRecord ? time(remoteRecord.updatedAt) : 0,
        time((remoteTombs || {})[id])
      );

      let chooseRemote = remoteTime > localTime;
      if (remoteTime === localTime && localRecord && remoteRecord) {
        chooseRemote = canonical(remoteRecord) >= canonical(localRecord);
      }
      if (remoteTime === localTime && !localRecord && remoteRecord) chooseRemote = true;
      if (remoteTime === localTime && localRecord && !remoteRecord) chooseRemote = false;

      const record = chooseRemote ? remoteRecord : localRecord;
      const tombstone = chooseRemote ? (remoteTombs || {})[id] : (localTombs || {})[id];
      if (!record) return;
      if (tombstone && time(tombstone) >= time(record.updatedAt)) return;
      records.push(record);
    });

    return { records: records, tombstones: tombstones };
  }

  function mergeCategoryOrder(local, remote, mergedData) {
    const localMeta = local.meta || {};
    const remoteMeta = remote.meta || {};
    const result = { expense: [], income: [] };
    ['expense', 'income'].forEach(function (type) {
      const localAt = localMeta.categoryOrderAt && localMeta.categoryOrderAt[type];
      const remoteAt = remoteMeta.categoryOrderAt && remoteMeta.categoryOrderAt[type];
      let source = time(remoteAt) >= time(localAt) ? remote : local;
      if (!source || !source.categoryOrder || !Array.isArray(source.categoryOrder[type])) source = local;
      const order = (source.categoryOrder && source.categoryOrder[type]) || [];
      const active = {};
      C.getCategories(mergedData, type).forEach(function (category) {
        active[category.id] = true;
      });
      const seen = new Set();
      order.forEach(function (id) {
        if (active[id] && !seen.has(id)) {
          result[type].push(id);
          seen.add(id);
        }
      });
      C.getCategories(mergedData, type).forEach(function (category) {
        if (!seen.has(category.id)) {
          result[type].push(category.id);
          seen.add(category.id);
        }
      });
    });
    return result;
  }

  function mergeBudgets(local, remote) {
    const localMeta = local.meta || {};
    const remoteMeta = remote.meta || {};
    const localBudget = (local.budgets && local.budgets.categories) || {};
    const remoteBudget = (remote.budgets && remote.budgets.categories) || {};
    const values = {};
    const localValueAt = localMeta.budgetCategoriesAt || {};
    const remoteValueAt = remoteMeta.budgetCategoriesAt || {};
    const localDeletedAt = localMeta.budgetCategoriesDeletedAt || {};
    const remoteDeletedAt = remoteMeta.budgetCategoriesDeletedAt || {};

    const ids = new Set(
      Object.keys(localBudget)
        .concat(Object.keys(remoteBudget))
        .concat(Object.keys(localValueAt))
        .concat(Object.keys(remoteValueAt))
        .concat(Object.keys(localDeletedAt))
        .concat(Object.keys(remoteDeletedAt))
    );

    ids.forEach(function (id) {
      const localValueTime = time(localValueAt[id]);
      const remoteValueTime = time(remoteValueAt[id]);
      const localDeleteTime = time(localDeletedAt[id]);
      const remoteDeleteTime = time(remoteDeletedAt[id]);
      const localEventTime = Math.max(localValueTime, localDeleteTime);
      const remoteEventTime = Math.max(remoteValueTime, remoteDeleteTime);
      const chooseRemote = remoteEventTime > localEventTime;
      const valueTime = chooseRemote ? remoteValueTime : localValueTime;
      const deleteTime = chooseRemote ? remoteDeleteTime : localDeleteTime;
      if (!valueTime && !deleteTime) {
        const fallback = chooseRemote ? remoteBudget[id] : localBudget[id];
        if (fallback > 0) values[id] = fallback;
        return;
      }
      if (deleteTime >= valueTime) return;
      const value = chooseRemote ? remoteBudget[id] : localBudget[id];
      if (value > 0) values[id] = value;
    });

    const localTotalAt = localMeta.budgetsTotalAt;
    const remoteTotalAt = remoteMeta.budgetsTotalAt;
    const totalCents =
      time(remoteTotalAt) >= time(localTotalAt)
        ? (remote.budgets ? remote.budgets.totalCents : 0)
        : (local.budgets ? local.budgets.totalCents : 0);

    return { totalCents: totalCents, categories: values };
  }

  function mergeData(localRaw, remoteRaw) {
    const local = C.normalizeData(localRaw);
    const remote = C.normalizeData(remoteRaw);
    const transactions = mergeCollection(
      local.transactions,
      remote.transactions,
      local.tombstones.transactions,
      remote.tombstones.transactions
    );
    const categories = mergeCollection(
      local.categories,
      remote.categories,
      local.tombstones.categories,
      remote.tombstones.categories
    );

    const merged = {
      version: C.VERSION,
      transactions: transactions.records,
      categories: categories.records,
      categoryOrder: { expense: [], income: [] },
      budgets: { totalCents: 0, categories: {} },
      settings: { budgetAlerts: true },
      tombstones: {
        transactions: transactions.tombstones,
        categories: categories.tombstones
      },
      meta: {
        categoryOrderAt: {
          expense: maxTimestamp(
            local.meta.categoryOrderAt && local.meta.categoryOrderAt.expense,
            remote.meta.categoryOrderAt && remote.meta.categoryOrderAt.expense
          ),
          income: maxTimestamp(
            local.meta.categoryOrderAt && local.meta.categoryOrderAt.income,
            remote.meta.categoryOrderAt && remote.meta.categoryOrderAt.income
          )
        },
        budgetsTotalAt: maxTimestamp(local.meta.budgetsTotalAt, remote.meta.budgetsTotalAt),
        budgetCategoriesAt: maxMap(
          local.meta.budgetCategoriesAt,
          remote.meta.budgetCategoriesAt
        ),
        budgetCategoriesDeletedAt: maxMap(
          local.meta.budgetCategoriesDeletedAt,
          remote.meta.budgetCategoriesDeletedAt
        ),
        settingsAt: {
          budgetAlerts: maxTimestamp(
            local.meta.settingsAt && local.meta.settingsAt.budgetAlerts,
            remote.meta.settingsAt && remote.meta.settingsAt.budgetAlerts
          )
        }
      },
      createdAt:
        time(local.createdAt) <= time(remote.createdAt) ? local.createdAt : remote.createdAt
    };

    merged.categoryOrder = mergeCategoryOrder(local, remote, merged);
    merged.budgets = mergeBudgets(local, remote);

    const localSettingsTime = time(local.meta.settingsAt && local.meta.settingsAt.budgetAlerts);
    const remoteSettingsTime = time(remote.meta.settingsAt && remote.meta.settingsAt.budgetAlerts);
    merged.settings.budgetAlerts =
      remoteSettingsTime >= localSettingsTime
        ? remote.settings.budgetAlerts
        : local.settings.budgetAlerts;

    return C.normalizeData(merged);
  }

  function fingerprint(data) {
    return canonical(C.normalizeData(data));
  }

  function sameData(left, right) {
    return fingerprint(left) === fingerprint(right);
  }

  return {
    mergeData: mergeData,
    fingerprint: fingerprint,
    sameData: sameData,
    mergeCollection: mergeCollection
  };
});
