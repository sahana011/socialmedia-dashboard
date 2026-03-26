// frontend/js/state.js
// ─────────────────────────────────────────────────────────────────────────────
// Central state store.  Mirrors the old `DB` object shape so existing render
// functions work with minimal changes.  Data is fetched once per session and
// refreshed on demand.
// ─────────────────────────────────────────────────────────────────────────────

var STATE = (function () {
  'use strict';

  // In-memory cache (replaces `var DB = { ... }`)
  var _cache = {
    user:     null,
    accounts: [],
    metrics:  [],
    posts:    [],
    people:   [],
    conns:    [],
    aiHistory:{ ideas:[], hooks:[], captions:[], scripts:[], hashtags:[], competitor:[], trends:[], strategy:[] },
    deleteLog:[],
    _loaded: { metrics: false, posts: false, people: false, accounts: false },
  };

  // ── Loading UI helpers ──────────────────────────────────────────────────────
  function showLoader(panelId) {
    var el = document.getElementById('p-' + panelId);
    if (el) el.innerHTML = '<div class="loader-wrap"><div class="loader-spinner"></div><div class="loader-txt">Loading…</div></div>';
  }

  function showError(panelId, msg) {
    var el = document.getElementById('p-' + panelId);
    if (el) el.innerHTML = '<div class="err-wrap">⚠️ ' + (msg || 'Failed to load data') + ' <button class="btn-sm" onclick="refresh()">Retry</button></div>';
  }

  // ── Bootstrap: load all data on page init ──────────────────────────────────
  function init() {
    return Promise.all([
      loadMetrics(),
      loadPosts(),
      loadPeople(),
      loadAccounts(),
    ]).then(function () {
      // Expose as global `DB` so legacy render functions work unchanged
      window.DB = {
        get user()     { return _cache.user; },
        get accounts() { return _cache.accounts; },
        get metrics()  { return _cache.metrics; },
        get posts()    { return _cache.posts; },
        get people()   { return _cache.people; },
        get conns()    { return _cache.conns; },
        get aiHistory(){ return _cache.aiHistory; },
        get deleteLog(){ return _cache.deleteLog; },
      };
      console.log('✅  STATE: all data loaded');
    }).catch(function (err) {
      console.error('❌  STATE init failed:', err);
    });
  }

  // ── Individual loaders ──────────────────────────────────────────────────────
  function loadMetrics() {
    return API.getMetrics()
      .then(function (data) { _cache.metrics = data; _cache._loaded.metrics = true; })
      .catch(function (err) { console.error('Metrics load failed:', err); });
  }

  function loadPosts() {
    return API.getPosts()
      .then(function (data) {
        // Normalise _id → id so existing render code (`p.id`) keeps working
        _cache.posts = data.map(normPost);
        _cache._loaded.posts = true;
      })
      .catch(function (err) { console.error('Posts load failed:', err); });
  }

  function loadPeople() {
    return API.getUsers()
      .then(function (data) { _cache.people = data; _cache._loaded.people = true; })
      .catch(function (err) { console.error('People load failed:', err); });
  }

  function loadAccounts() {
    return API.getAccounts()
      .then(function (data) {
        _cache.accounts = data;
        // Also populate conns (legacy shape)
        _cache.conns = data.map(function (a) {
          return { id: a._id, name: a.name, handle: a.handle, icon: a.icon,
                   on: a.isActive, sync: a.syncedAt };
        });
        _cache._loaded.accounts = true;
      })
      .catch(function (err) { console.error('Accounts load failed:', err); });
  }

  // ── Normalisation helpers ──────────────────────────────────────────────────
  function normPost(p) {
    return Object.assign({}, p, {
      id:         p._id || p.id,
      shootDate:  p.shootDate  ? p.shootDate.substring(0, 10)  : '',
      editedDate: p.editedDate ? p.editedDate.substring(0, 10) : '',
      postDate:   p.postDate   ? p.postDate.substring(0, 10)   : '',
    });
  }

  function normMetric(m) {
    return Object.assign({}, m, {
      date: m.date ? m.date.substring(0, 10) : '',
    });
  }

  // ── Mutating helpers (write-through: update API + local cache) ─────────────

  function savePost(id, field, value) {
    // Update local cache immediately (optimistic)
    var idx = _cache.posts.findIndex(function (p) { return p.id === id || p._id === id; });
    if (idx !== -1) _cache.posts[idx][field] = value;
    // Persist to backend
    return API.updatePost(id, { [field]: value })
      .catch(function (err) {
        console.error('savePost failed:', err);
        // Roll back optimistic update
        if (idx !== -1) loadPosts();
      });
  }

  function addPost(data) {
    return API.createPost(data).then(function (post) {
      _cache.posts.unshift(normPost(post));
      return post;
    });
  }

  function removePost(id) {
    return API.deletePost(id).then(function () {
      _cache.posts = _cache.posts.filter(function (p) { return p.id !== id && p._id !== id; });
    });
  }

  function bulkRemovePosts(ids) {
    return API.bulkDeletePosts(ids).then(function () {
      _cache.posts = _cache.posts.filter(function (p) {
        return ids.indexOf(p.id) === -1 && ids.indexOf(p._id) === -1;
      });
    });
  }

  function saveMetricCell(page, month, type, field, value) {
    // Optimistic local update
    var row = _cache.metrics.find(function (r) {
      return r.page === page && r.month === month && r.type === type;
    });
    if (row) {
      row[field] = parseFloat(value) || 0;
    } else {
      var newRow = { page: page, month: month, type: type, date: month + ' 01' };
      newRow[field] = parseFloat(value) || 0;
      _cache.metrics.push(newRow);
    }
    // Persist upsert
    var payload = { page: page, month: month, type: type };
    payload[field] = parseFloat(value) || 0;
    return API.saveMetric(payload)
      .catch(function (err) { console.error('saveMetricCell failed:', err); });
  }

  function addMonth(monthData) {
    // monthData: array of 2 rows [organic, paid]
    return API.bulkSaveMetrics(monthData).then(function () {
      return loadMetrics(); // reload for consistency
    });
  }

  function addUser(data) {
    return API.createUser(data).then(function (user) {
      _cache.people.push(user);
      return user;
    });
  }

  function removeUser(id) {
    return API.deleteUser(id).then(function () {
      _cache.people = _cache.people.filter(function (u) {
        return u._id !== id && u.id !== id;
      });
    });
  }

  // ── Manual sync trigger ─────────────────────────────────────────────────────
  function syncInstagram(accountId) {
    return API.syncInsights(accountId)
      .then(function (results) {
        console.log('Instagram sync results:', results);
        return loadMetrics(); // refresh metrics after sync
      });
  }

  // Public
  return {
    init:            init,
    loadMetrics:     loadMetrics,
    loadPosts:       loadPosts,
    loadPeople:      loadPeople,
    loadAccounts:    loadAccounts,
    showLoader:      showLoader,
    showError:       showError,
    // Post mutations
    savePost:        savePost,
    addPost:         addPost,
    removePost:      removePost,
    bulkRemovePosts: bulkRemovePosts,
    // Metric mutations
    saveMetricCell:  saveMetricCell,
    addMonth:        addMonth,
    // User mutations
    addUser:         addUser,
    removeUser:      removeUser,
    // Instagram
    syncInstagram:   syncInstagram,
  };
})();
