const $=id=>document.getElementById(id);
const DB="daily-flow-web-v1";
let state=load();
let currentDate=new Date().toLocaleDateString("en-CA");
let editingId=null;
function load(){try{return JSON.parse(localStorage.getItem(DB))||{plans:{},templates:[]}}catch{return{plans:{},templates:[]}}}
function persist(){localStorage.setItem(DB,JSON.stringify(state))}
function key(date){return date}
function plan(){return state.plans[key(currentDate)]||(state.plans[key(currentDate)]={assignee:"",tasks:[]})}
function fmtDate(s){const d=new Date(s+"T12:00:00");return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(d)}
function render(){
 const p=plan();p.tasks.sort((a,b)=>a.time.localeCompare(b.time));
 $("dateTitle").textContent=fmtDate(currentDate);$("assignee").value=p.assignee||"";
 const tasks=$("tasks");tasks.innerHTML="";
 p.tasks.forEach(t=>{
  const row=document.createElement("div");row.className="task"+(t.done?" done":"");
  row.innerHTML=`<div class="time">${esc(t.time)}</div><div class="task-main"><div class="task-name">${esc(t.title)}</div><div class="task-meta">${t.done?"完了":(t.deadline?`目標終了 ${esc(t.deadline)}`:"未完了")}</div></div><button class="check" aria-label="完了切替">${t.done?"✓":"○"}</button><button class="more" aria-label="メニュー">⋯</button>`;
  row.querySelector(".check").onclick=()=>{t.done=!t.done;persist();render()};
  row.querySelector(".more").onclick=()=>{const choice=prompt("1：編集　2：削除","1");if(choice==="1")openEdit(t);else if(choice==="2"&&confirm("このタスクを削除しますか？")){p.tasks=p.tasks.filter(x=>x.id!==t.id);persist();render()}};
  tasks.append(row);
 });
 const done=p.tasks.filter(t=>t.done).length,total=p.tasks.length,percent=total?Math.round(done/total*100):0;
 $("count").textContent=`${done} / ${total}`;$("barFill").style.width=percent+"%";$("percent").textContent=`完了 ${percent}%`;$("remaining").textContent=`残り ${total-done} 件`;$("taskCount").textContent=`${total} TASKS`;
 $("completeBanner").classList.toggle("hidden",!(total>0&&done===total));
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function openEdit(t=null){editingId=t?.id||null;$("taskDialogTitle").textContent=t?"タスクを編集":"タスクを追加";$("taskTitle").value=t?.title||"";$("taskTime").value=t?.time||"09:00";$("hasDeadline").checked=!!t?.deadline;$("taskDeadline").value=t?.deadline||"10:00";$("deadlineWrap").classList.toggle("hidden",!t?.deadline);$("taskDialog").showModal()}
$("date").value=currentDate;$("date").addEventListener("change",e=>{currentDate=e.target.value||new Date().toLocaleDateString("en-CA");render()});
$("assignee").addEventListener("input",e=>{plan().assignee=e.target.value;persist()});
$("addTask").onclick=()=>openEdit();
$("hasDeadline").onchange=e=>$("deadlineWrap").classList.toggle("hidden",!e.target.checked);
$("taskForm").onsubmit=e=>{e.preventDefault();const p=plan(),obj={id:editingId||crypto.randomUUID(),title:$("taskTitle").value.trim(),time:$("taskTime").value,deadline:$("hasDeadline").checked?$("taskDeadline").value:null,done:false};if(!obj.title)return;if(editingId){const old=p.tasks.find(t=>t.id===editingId);if(old){obj.done=old.done;Object.assign(old,obj)}}else p.tasks.push(obj);persist();$("taskDialog").close();render()};
$("markAll").onclick=()=>{plan().tasks.forEach(t=>t.done=true);persist();render()};
$("resetAll").onclick=()=>{if(confirm("この日のタスクをすべて未完了に戻しますか？")){plan().tasks.forEach(t=>t.done=false);persist();render()}};
$("saveTemplate").onclick=()=>{if(!plan().tasks.length){alert("保存するタスクがありません");return}$("templateName").value="";$("saveTemplateDialog").showModal()};
$("saveTemplateForm").onsubmit=e=>{e.preventDefault();const name=$("templateName").value.trim();if(!name)return;state.templates.push({id:crypto.randomUUID(),name,tasks:plan().tasks.map(t=>({...t,id:crypto.randomUUID(),done:false}))});persist();$("saveTemplateDialog").close();alert("テンプレートを保存しました")};
$("openTemplates").onclick=()=>{renderTemplates();$("templateDialog").showModal()};
$("replaceMode").onchange=()=>{$("modeHelp").textContent=$("replaceMode").checked?"ON：この日のタスクを置き換えます。":"OFF：既存タスクを残して追加します。"};
function renderTemplates(){const list=$("templateList");list.innerHTML="";if(!state.templates.length){list.innerHTML='<div class="empty">保存済みテンプレートはありません。</div>';return}state.templates.forEach(t=>{const el=document.createElement("div");el.className="template-item";el.innerHTML=`<div class="info"><strong>${esc(t.name)}</strong><small>${t.tasks.length}件のタスク</small></div><button class="apply">適用</button><button class="delete">削除</button>`;el.querySelector(".apply").onclick=()=>{if(!confirm(`「${t.name}」を適用しますか？`))return;const copies=t.tasks.map(x=>({...x,id:crypto.randomUUID(),done:false}));plan().tasks=$("replaceMode").checked?copies:[...plan().tasks,...copies];persist();$("templateDialog").close();render()};el.querySelector(".delete").onclick=()=>{if(confirm(`「${t.name}」を削除しますか？`)){state.templates=state.templates.filter(x=>x.id!==t.id);persist();renderTemplates()}};list.append(el)})}
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
render();
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
