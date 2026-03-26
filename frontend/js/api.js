// frontend/js/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified API client for KOC Dashboard.
// Replaces all direct `DB.*` access with real fetch() calls to the backend.
//
// USAGE PATTERN (mirrors old DB usage):
//   OLD:  var posts = DB.posts;  renderPosts(posts);
//   NEW:  API.getPosts().then(posts => renderPosts(posts));
//
//   OLD:  DB.metrics.filter(...)
//   NEW:  API.getMetrics({ page, type, from, to }).then(metrics => ...)
// ─────────────────────────────────────────────────────────────────────────────

var API = (function () {
  'use strict';

  var BASE = '/api';

  // ── Core fetch wrapper ─────────────────────────────────────────────────────
  function req(method, path, body, params) {
    var url = BASE + path;
    if (params && Object.keys(params).length) {
      var qs = Object.entries(params)
        .filter(function (e) { return e[1] !== undefined && e[1] !== null && e[1] !== ''; })
        .map(function (e) { return encodeURIComponent(e[0]) + '=' + encodeURIComponent(e[1]); })
        .join('&');
      if (qs) url += '?' + qs;
    }

    var opts = {
      method:  method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    return fetch(url, opts)
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (e) {
            throw new Error(e.message || ('HTTP ' + res.status));
          });
        }
        return res.json();
      })
      .then(function (json) { return json.data !== undefined ? json.data : json; });
  }

  function get(path, params)     { return req('GET',    path, null, params); }
  function post(path, body)      { return req('POST',   path, body); }
  function put(path, body)       { return req('PUT',    path, body); }
  function del(path, body)       { return req('DELETE', path, body); }

  // ── Metrics ────────────────────────────────────────────────────────────────
  function getMetrics(opts) {
    // opts: { page, type, from, to, month }
    return get('/metrics', opts || {});
  }

  function saveMetric(data) {
    // Upserts by { page, month, type }
    return post('/metrics', data);
  }

  function bulkSaveMetrics(rows) {
    return post('/metrics/bulk', rows);
  }

  function deleteMetric(id) {
    return del('/metrics/' + id);
  }

  // ── Posts ──────────────────────────────────────────────────────────────────
  function getPosts(opts) {
    // opts: { page, status, assignedTo, from, to, search }
    return get('/posts', opts || {});
  }

  function getPost(id) {
    return get('/posts/' + id);
  }

  function createPost(data) {
    return post('/posts', data);
  }

  function updatePost(id, data) {
    return put('/posts/' + id, data);
  }

  function deletePost(id) {
    return del('/posts/' + id);
  }

  function bulkDeletePosts(ids) {
    return post('/posts/bulk-delete', { ids: ids });
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  function getUsers()          { return get('/users'); }
  function getUser(id)         { return get('/users/' + id); }
  function createUser(data)    { return post('/users', data); }
  function updateUser(id, data){ return put('/users/' + id, data); }
  function deleteUser(id)      { return del('/users/' + id); }

  // ── Accounts ───────────────────────────────────────────────────────────────
  function getAccounts()          { return get('/accounts'); }
  function updateAccount(id, data){ return put('/accounts/' + id, data); }

  // ── Instagram Sync ─────────────────────────────────────────────────────────
  function syncInsights(accountId, daysBack) {
    return post('/instagram/sync-insights', { accountId: accountId, daysBack: daysBack || 28 });
  }

  function syncMedia(accountId) {
    return post('/instagram/sync-media', { accountId: accountId });
  }

  // ── Health ─────────────────────────────────────────────────────────────────
  function healthCheck() { return get('/health'); }

  // Public API
  return {
    // Metrics
    getMetrics:       getMetrics,
    saveMetric:       saveMetric,
    bulkSaveMetrics:  bulkSaveMetrics,
    deleteMetric:     deleteMetric,
    // Posts
    getPosts:         getPosts,
    getPost:          getPost,
    createPost:       createPost,
    updatePost:       updatePost,
    deletePost:       deletePost,
    bulkDeletePosts:  bulkDeletePosts,
    // Users
    getUsers:         getUsers,
    getUser:          getUser,
    createUser:       createUser,
    updateUser:       updateUser,
    deleteUser:       deleteUser,
    // Accounts
    getAccounts:      getAccounts,
    updateAccount:    updateAccount,
    // Instagram
    syncInsights:     syncInsights,
    syncMedia:        syncMedia,
    // Health
    healthCheck:      healthCheck,
  };
})();
