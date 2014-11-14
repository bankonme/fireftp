var logging = {
  DEBUG    : 10,
  INFO     : 20,
  WARNING  : 30,
  ERROR    : 40,
  CRITICAL : 50,

  log : function(level, msg) {
    if (level == this.DEBUG) {
      debug(msg);
    } else if (level >= this.ERROR) {
      error(msg);
    } else {
      appendLog(msg);
    }
  }
};
DEBUG    = logging.DEBUG;
INFO     = logging.INFO;
WARNING  = logging.WARNING;
ERROR    = logging.ERROR;
CRITICAL = logging.CRITICAL;

function appendLog(message, css, type, trusted) {
  var div = document.createElement('div');
  div.setAttribute('type', type);
  div.setAttribute('style', 'display:' + (type != "error" && gLogErrorMode ? "none" : "block"));
  div.setAttribute('class', css);

  if (trusted) {
    // Hello, Mozilla reviewer.  
    // Using innerHTML was already discussed and resolved
    // here: https://bugzilla.mozilla.org/show_bug.cgi?id=476851
    // and here: https://bugzilla.mozilla.org/show_bug.cgi?id=574462
    // We only get to this innerHTML if 'trusted' which is only called in 2
    // places in this code base - in loadUnload.js and in sessionsPasswords.js
    // No need to freak out, yo!
    div.innerHTML = message;
  } else {
    var lines = message.split(/(?:\n|\r\n)/);
    lines.forEach(function(line) {
      var lineFrag = document.createDocumentFragment();
      lineFrag.textContent = line;
      div.appendChild(lineFrag);
      div.appendChild(document.createElement('br'));
    });
  }
  gLogQueue.appendChild(div);
}

function error(message, skipLog, trusted, skipAlert) {
  if (!skipLog) {
    appendLog(message, 'error', "error", trusted);
  }

  if (gErrorMode && !skipAlert) {
    doAlert(message);
  }
}

function doAlert(msg, modal) {
  if (gAlertWindow && !gAlertWindow.closed) {
    var func = function() {
      try {
        gAlertWindow.add(msg);
      } catch (ex) {
        gAlertWindow = null;
        doAlert(msg, modal);
      }
    };
    setTimeout(func, 100);
    return;
  }

  gAlertWindow = window.openDialog("chrome://fireftp/content/alert.xul", "alert", "chrome,dialog,resizable,centerscreen" + (modal ? ",modal" : ""), msg);
}

function onAlertClose() {
  gAlertWindow = null;
}

function detailedError(msg, url, linenumber) {
  error('Error message= ' + msg + '\nURL= ' + url + '\nLine Number= ' + linenumber, false, true, !gDebugMode);
}

function debug(ex, level, trusted) {
  if (gDebugMode) {
    appendLog((level ? level : "Debug") + ": " + (ex.stack ? (ex.message + '\n' + ex.stack) : (ex.message ? ex.message : ex)), 'debug', "debug", trusted);
  }
}

function showLog() {
  gPrefs.setBoolPref("logmode", !gLogMode);
}

function logQueueMode() {
  gPrefs.setIntPref("logqueue", $('logQueueTabs').selectedIndex);
  queueTree.updateView();
}

function filter(display, type) {
  var nodeList = $('cmdlog').contentWindow.document.getElementsByTagName("div");

  for (var x = 0; x < nodeList.length; ++x) {
    if (nodeList.item(x).getAttribute("type") != type) {
      nodeList.item(x).style.display = display;
    }
  }
}

function showOnlyErrors() {
  filter("none",   "error");
}

function showAll() {
  filter("block", "error");
}

function checkLogMouseDown() {
  if ($('logqueue').collapsed) {
    gPrefs.setBoolPref("logmode", true);
  }
}

function checkLogCollapsed() {
  gPrefs.setBoolPref("logmode", !$('logqueue').collapsed);
}
