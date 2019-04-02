// ==UserScript==
// @name         Haiku Downloader
// @namespace    https://kokuda.org/
// @version      0.1.1
// @description  無茶しやがって
// @author       Akkiesoft
// @match        http://h.hatena.ne.jp/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // user who now login the Haiku(雑)
  var USER=document.getElementsByClassName('profile-image')[0].alt;

  var API = "http://h.hatena.ne.jp/api/statuses/user_timeline/" + USER + ".json"
  // BODY_FORMATS:
  // see http://developer.hatena.ne.jp/ja/documents/haiku/apis/rest/datatypes#body_formats
  // I recommend to set "haiku" (for parsing) or "html" (for viewing) or both.
  var BODY_FORMATS="haiku,html"

  function time2unix(t) {
    var dt = new Date(t);
    return dt.getTime() / 1000;
  }

  function make_zip(zip) {
    zip.generateAsync({type:"blob"})
    .then(function (blob) {
      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, USER + '.zip');
        window.navigator.msSaveOrOpenBlob(blob, USER + '.zip');
      } else {
        var lnk = document.createElement('a');
        lnk.textContent = 'ダウンロード';
        lnk.id = "haikudl";
        lnk.href = window.URL.createObjectURL(blob);
        document.getElementById('haikudl').appendChild(lnk);
      }
    });
  }

  function download(zip, reftime, reftime_count, stop_id) {
    var url = new URL(API);
    var params = url.searchParams;
    params.append('per_page', 200);
    params.append('reftime', "-" + reftime + "," + reftime_count);
    params.append('body_formats', "haiku");
    console.log("downloading: " + reftime);
    document.getElementById("haikudlprogress").innerHTML = "downloading: " + reftime + " ( " + url.href + " )";

    fetch(url)
    .then(function(response) {
      if(response.ok) { return response.text(); }
    })
    .then(function(data) {
      var json = JSON.parse(data);
      if (json.length == 0) {
        make_zip(zip);
        console.log("done!");
        document.getElementById("haikudlprogress").innerHTML = "完了！";
        return true;
      }
      var t = time2unix(json[0]['created_at']);
      var fn = USER + '/' + USER + '-' + t + '.json';
      zip.file(fn, data);
      console.log("downloaded: " + fn);

      var nextreftime = time2unix(json[json.length - 1]['created_at']);
      if (nextreftime < stop_id) {
        make_zip(zip);
        console.log("done!");
        document.getElementById("haikudlprogress").innerHTML = "完了！";
        return true;
      }
      console.log("next: " + nextreftime);
      setTimeout(function(){ download(zip, nextreftime, 1, stop_id); }, 2000);
    });
  }

  function init_download() {
    document.getElementById('haikudlbtn').style = "display:none;";
    document.getElementById('haikudlstopid').style = "display:none;";
    var stop_id = document.getElementById('haikudlstopid').value;
    document.getElementById("haikudlinfo").innerHTML = 'ダウンロード中はページを移動しないでください。<br>ダウンロードが終わると下に「ダウンロード」リンクが表示されます。';

    if (stop_id) {
      document.getElementById("haikudlinfo").innerHTML += '<br>※最新のHaikuから' + stop_id + 'が含まれる200件まで取得します（この数字に到達したら終わる）。';
      setTimeout(function(){ download(new JSZip(), 0, 0, stop_id); }, 1000);
      return false;
    }
    // get oldest post
    var url = new URL(API);
    var params = url.searchParams;
    params.append('count', 1);
    params.append('reftime', "+0,0");
    fetch(url)
    .then(function(response) {
      if(response.ok) { return response.json(); }
    })
    .then(function(json) {
      var t = time2unix(json[0]['created_at']);
      document.getElementById("haikudlinfo").innerHTML += '<br>※最新のHaikuから' + t + 'まで取得します（この数字に到達したら終わる）。';
      setTimeout(function(){ download(new JSZip(), 0, 0); }, 1000);
    });
  }

  // workspace
  var elem = document.getElementsByClassName('list-body')[0];
  var box = document.createElement('div');
  box.id = 'haikudl';
  // button
  var info = document.createElement('div');
  info.id = 'haikudlinfo';
  info.innerHTML = 'ダウンロードボタンを押すと開始します。<br>ダウンロードが終わると下に「ダウンロード」リンクが表示されます。';
  box.appendChild(info);
  var input = document.createElement('input');
  input.id = 'haikudlstopid';
  input.placeholder = '特定の日時までで取得を止める場合はここにunixtimeで入力';
  input.style = 'width:300px;';
  box.appendChild(input);
  var btn = document.createElement('button');
  btn.id = 'haikudlbtn';
  btn.textContent = 'ダウンロード';
  btn.onclick = function(){ init_download();return false; };
  box.appendChild(btn);
  var prog = document.createElement('div');
  prog.id = 'haikudlprogress';
  box.appendChild(prog);
  // show workspace
  elem.insertBefore(box, elem.firstChild);
})();
