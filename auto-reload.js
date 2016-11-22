/* jshint esversion: 6 */
/* based on https://github.com/brunch/auto-reload-brunch */

let WebSocket = window.WebSocket || window.MozWebSocket;

let cacheBuster = (url) => {
  var date = Math.round(Date.now() / 1000).toString();
  url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
  return url + (url.indexOf('?') >= 0 ? '&' : '?') +'cacheBuster=' + date;
};

let reloadJs = () => {
  let scripts = [].slice.call(document.querySelectorAll('script'));
  let wlfilter = (script) => script.dataset.autoreload;

  let textScripts = scripts
      .filter(wlfilter).map((script) => script.text).filter((text) => text.length > 0);
  let srcScripts = scripts
    .filter(wlfilter).filter((script) => script.src);

  let loaded = 0;
  let all = srcScripts.length;
  let onLoad = () => {
    loaded = loaded + 1;
    if (loaded === all) {
      textScripts.forEach(function(scriptText) {
        eval(scriptText);
      });
    }
  };

  srcScripts
    .forEach(function(script) {
      var src = script.src;
      script.remove();
      var newScript = document.createElement('script');
      newScript.src = cacheBuster(src);
      newScript.async = true;
      newScript.onload = onLoad;
      newScript.dataset.autoreload = true;
      document.head.appendChild(newScript);
    });
};

let port = 9485;
let host = window.location.hostname || 'localhost';

export default function autoReload() {
  if (typeof window._ar_connection !== 'undefined') {
    return;
  }
  if (window.location.protocol === "https:") {
    return;
  }
  var connection = new WebSocket('ws://' + host + ':' + port);
  console.log(`created connection: ${connection}`);

  connection.onmessage = (event) => {
    //var message = event.data;
    reloadJs();
  };
  connection.onerror = () => {
    if (connection.readyState)
      connection.close();
  };
  connection.onclose = () => {
    window.setTimeout(autoReload, 5000);
  };
  window._ar_connection = connection;
}
