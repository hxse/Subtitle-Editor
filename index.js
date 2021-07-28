import srtParser2 from "./srt-parse-2.js";

let inputFile = document.querySelector("#file").firstElementChild;
inputFile.onchange = fileChange;
let addAgainBtn = document.querySelector("#addAgainBtn");
addAgainBtn.onclick = addAgain;
document.querySelector("#filter").firstElementChild.lastElementChild.onclick = filter;
document.querySelector("#download").firstElementChild.onclick = download;
document.querySelector("#time").firstElementChild.lastElementChild.onclick = merTime;

let cutBtn = document.querySelector("#cutBtn");
cutBtn.onclick = cutCallback;
let merBtn = document.querySelector("#merBtn");
merBtn.onclick = merCallback;
let delBtn = document.querySelector("#delBtn");
delBtn.onclick = delCallback;

cutBtn.onmousedown = preventDefault;
merBtn.onmousedown = preventDefault;
delBtn.onmousedown = preventDefault;
function preventDefault(e) {
  //现代浏览器阻止默认事件
  if (e && e.preventDefault) e.preventDefault();
  //IE阻止默认事件
  else window.event.returnValue = false;
  return false;
}

function cutCallback() {
  let parent = document.getSelection();
  let textarea = parent.focusNode.children[parent.anchorOffset];
  if (textarea) {
    cutDownTr(textarea);
  }
}
function merCallback() {
  let parent = document.getSelection();
  let textarea = parent.focusNode.children[parent.anchorOffset];
  if (textarea) {
    merTr(textarea);
  }
}
function delCallback() {
  let parent = document.getSelection();
  let textarea = parent.focusNode.children[parent.anchorOffset];
  delTr(textarea);
}
function filter(event) {
  let button = event.path[0];
  let input = button.parentElement.firstElementChild;
  let index = getIndex(button.parentElement);

  if (document.querySelector("#file").children[index].value) {
    let row = document.querySelector("#main").firstElementChild;
    while (row) {
      function recursive() {
        let textarea = row.children[index];
        let text = textarea.value.trim();
        if (input.value.includes(text[text.length - 1])) {
          if (row.nextElementSibling) {
            //递归时忽略最后一行
            merTr(row.nextElementSibling.children[index]);
            return recursive();
          }
        }
      }
      recursive();
      row = row.nextElementSibling;
    }
  } else {
    alert("请先上传文件");
  }
}
function createTextarea() {
  let textarea = document.createElement("textarea");
  mountEvent(textarea);
  return textarea;
}
function fileChange(event) {
  let file = event.target.files[0];
  let columnIdx = getIndex(event.target);
  let reader = new FileReader();
  reader.onload = function () {
    // let jsonSubs = parseSRT(this.result);
    let parser = new srtParser2();
    let jsonSubs = parser.fromSrt(this.result);
    // console.log(parser.toSrt(jsonSubs));
    let mainEl = document.querySelector("#main");
    for (let [index, item] of jsonSubs.entries()) {
      if (index > mainEl.children.length - 1) {
        let rowDiv = document.createElement("div");
        rowDiv.class = "row";
        mainEl.appendChild(rowDiv);
      }

      let rowDiv = mainEl.children[index];

      while (columnIdx > rowDiv.children.length - 1) {
        rowDiv.appendChild(createTextarea());
      }
      let textarea = rowDiv.children[columnIdx];
      textarea.value = item.text;
      textarea.data = item;
    }
    for (let rowDiv of [...mainEl.children].slice(jsonSubs.length)) {
      if (rowDiv.children[columnIdx]) {
        rowDiv.children[columnIdx].value = "";
        rowDiv.children[columnIdx].data = "";
      } else {
        rowDiv.appendChild(createTextarea());
      }
    }
  };
  reader.readAsText(file);
}
function blobDownload(content, name) {
  let blob = new Blob([content]);
  let a = document.createElement("a");
  let url = window.URL.createObjectURL(blob);
  let filename = name;
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
function download(event) {
  let index = getIndex(event.target);
  let file = document.querySelector("#file").children[index].files[0];
  if (!file) {
    alert("请先上传文件");
    return;
  }
  let main = document.querySelector("#main");
  let children = [...main.children].map((i) => [...i.children][index]);
  let jsonData = children.map((i) => {
    return { ...i.data, text: i.data.text };
  });

  let parser = new srtParser2();
  blobDownload(parser.toSrt(jsonData), file.name);
}
function str2time(str) {
  return new Date("2011/01/01 " + str.replace(/,/, ":"));
}
function merTime(event, act = true) {
  let button = event.path[0];
  let input = button.parentElement.firstElementChild;
  let index = getIndex(button.parentElement);
  let time = input.value;

  if (document.querySelector("#file").children[index].value) {
    let main = document.querySelector("#main");

    let row = main.firstElementChild;
    if (!row) return "文件行数少无需过滤";
    while (row) {
      function recursive() {
        let item = row.children[index];
        if (!row.nextElementSibling) return; //递归时忽略最后一行
        let itemNext = row.nextElementSibling.children[index];
        let diff = str2time(itemNext.data.startTime) - str2time(item.data.endTime);

        if (diff < time) {
          merTr(itemNext);
          return recursive();
        }
      }
      recursive();
      row = row.nextElementSibling;
    }
  } else {
    alert("请先上传文件");
    return;
  }
}
function addAgain() {
  let firstEl = document.querySelector("#file").firstElementChild;
  let cloneEl = firstEl.cloneNode();
  firstEl.parentElement.appendChild(cloneEl);
  cloneEl.value = "";
  cloneEl.onchange = fileChange;

  let filterEl = document.querySelector("#filter");
  let filterCloneEl = filterEl.firstElementChild.cloneNode(true);
  filterEl.appendChild(filterCloneEl);
  filterCloneEl.onclick = filter;

  let downloadEl = document.querySelector("#download").firstElementChild;
  let downloadCloneEl = downloadEl.cloneNode();
  downloadEl.parentElement.appendChild(downloadCloneEl);
  downloadCloneEl.textContent = "下载";
  downloadCloneEl.onclick = download;

  let timeEl = document.querySelector("#time").firstElementChild;
  let timeCloneEl = timeEl.cloneNode(true);
  timeEl.parentElement.appendChild(timeCloneEl);
  timeCloneEl.onclick = merTime;
}

function createTr(target) {
  let cloneEl = target.parentElement.cloneNode(true);
  [...cloneEl.children].map((i) => (i.value = ""));
  [...cloneEl.children].map((i) => mountEvent(i));
  target.parentElement.after(cloneEl);
}
function cutTr(target) {
  let el = getNextEl(target);
  el.value = target.value.slice(target.selectionStart, target.value.length);
  target.value = target.value.slice(0, target.selectionStart);
  el.focus();
}
function cutDownTr(target) {
  let el = getNextEl(target);
  el.value = target.value.slice(target.selectionStart, target.value.length) + el.value;
  target.value = target.value.slice(0, target.selectionStart);
  el.focus();
}
function delTr(target) {
  let el = getNextEl(target) || getPreEl(target);
  if (el) {
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }
  target.parentElement.remove();
}
function dataMer(target) {
  getPreEl(target).value = getPreEl(target).value + " " + target.value;
  getPreEl(target).data.text = getPreEl(target).value;
  getPreEl(target).data.endTime = target.data.endTime;
}
function merTr(target) {
  let children = [...target.parentElement.children];
  for (let element of children) {
    dataMer(element);
  }
  getPreEl(target).setSelectionRange(0, 0);
  getPreEl(target).focus();
  target.parentElement.remove();
}
function preEl(target) {
  target.previousElementSibling.focus();
  target.previousElementSibling.setSelectionRange(0, 0);
}
function nextEl(target) {
  target.nextElementSibling.focus();
  target.nextElementSibling.setSelectionRange(
    target.nextElementSibling.value.length,
    target.nextElementSibling.value.length
  );
}
function mountEvent(target) {
  target.onkeydown = myKeyEvent;
}
function focus_index(target, indexArray) {
  target.focus();
  target.setSelectionRange(indexArray[0], indexArray[1]);
}
function getIndex(target) {
  return [...target.parentElement.children].indexOf(target);
}
function getPreEl(target) {
  let index = getIndex(target);
  if (target.parentElement.previousElementSibling) {
    let el = target.parentElement.previousElementSibling.children[index];
    return el;
  }
}
function getNextEl(target) {
  let index = getIndex(target);
  if (target.parentElement.nextElementSibling) {
    let el = target.parentElement.nextElementSibling.children[index];
    return el;
  }
}

function myKeyEvent(event) {
  if (event.shiftKey && event.keyCode == 13) {
    //shift+enter
    return event.enterKey;
  }
  if (event.ctrlKey && event.keyCode == 13) {
    //ctrl+enter
    return false; //创建禁用
    createTr(event.target);
    cutTr(event.target);
    return false;
  }
  if (event.keyCode == 13) {
    //enter
    if (event.target.selectionStart == event.target.selectionEnd) {
      if (getNextEl(event.target) && event.target.value.length != event.target.selectionStart) {
        cutDownTr(event.target);
      } else {
        if (event.target.value.length == event.target.selectionStart) {
          //末尾回车禁用
          return false;
        }
        createTr(event.target);
        cutTr(event.target);
      }
    }
    return false;
  }
  if (event.keyCode == 8 && event.target.selectionStart == 0) {
    //退格
    merTr(event.target);
    return false;
  }
  if (event.keyCode == 46 && event.target.selectionStart == event.target.value.length) {
    //删除
    delTr(event.target);
    return false;
  }
  if (event.keyCode == 38) {
    //上
    let el = getPreEl(event.target);
    if (el) {
      focus_index(el, [event.target.selectionStart, event.target.selectionEnd]);
    }
    return false;
  }
  if (event.keyCode == 40) {
    //下
    let el = getNextEl(event.target);
    if (el) {
      focus_index(el, [event.target.selectionStart, event.target.selectionEnd]);
    }
    return false;
  }
  if (event.keyCode == 37 && event.target.selectionStart == 0) {
    //左
    if (event.target.previousElementSibling) {
      preEl(event.target);
    } else {
      let last = event.target.parentElement.lastElementChild;
      last.focus();
      last.setSelectionRange(0, 0);
    }
    return false;
  }
  if (event.keyCode == 39 && event.target.selectionStart == event.target.value.length) {
    //右
    if (event.target.nextElementSibling) {
      nextEl(event.target);
    } else {
      let first = event.target.parentElement.firstElementChild;
      first.focus();
      first.setSelectionRange(first.value.length, first.value.length);
    }
    return false;
  }
}
