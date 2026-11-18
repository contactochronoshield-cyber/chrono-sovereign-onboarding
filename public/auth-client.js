(function () {
  var T = localStorage.getItem("csn_token");
  var go = function () { location.href = "/acceso.html?next=" + encodeURIComponent(location.pathname); };
  if (!T) { go(); return; }
  var f = window.fetch;
  window.fetch = function (u, o) {
    o = o || {};
    var h = new Headers(o.headers || {});
    if (!h.has("authorization")) h.set("Authorization", "Bearer " + T);
    o.headers = h;
    return f(u, o).then(function (r) {
      if (r.status === 401) { localStorage.removeItem("csn_token"); go(); }
      return r;
    });
  };
})();
