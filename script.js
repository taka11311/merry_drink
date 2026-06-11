// ===== 定数 =====
const drinksList = ["S", "M", "L", "shotA", "場内延長"];

// ===== データ =====
let girls = JSON.parse(localStorage.getItem("girls")) || [];
let todayGirls = [];
let actionLogs = [];

let currentSalesGirlIndex = null;

// ===== DOM =====
const saleDate = document.getElementById("saleDate");

const girlName = document.getElementById("girlName");
const girlList = document.getElementById("girlList");
const drinkArea = document.getElementById("drinkArea");

const salesModal = document.getElementById("salesModal");
const salesInput = document.getElementById("salesInput");


// ===== 初期化 =====
document.addEventListener("DOMContentLoaded", () => {

    const today = new Date().toISOString().split("T")[0];

    saleDate.value = today;

    renderGirlList();

loadSession();
loadLogs();

});


// ===== 営業日変更 =====
saleDate.addEventListener("change", () => {

    const hasData =
        localStorage.getItem(getDataKey());

    if (!hasData) {

        todayGirls = [];

        document
            .querySelectorAll("#girlList input")
            .forEach(cb => {
                cb.checked = false;
            });

        renderTable();

    } else {

        loadSession();

    }

    loadLogs();

});


// ===== キー =====
function getDate() {
    return saleDate.value;
}

function getDataKey() {
    return "data_" + getDate();
}

function getLogKey() {
    return "log_" + getDate();
}


// ===== 保存 =====
function saveGirls() {

    localStorage.setItem(
        "girls",
        JSON.stringify(girls)
    );

}

function saveSession() {

    localStorage.setItem(
        getDataKey(),
        JSON.stringify(todayGirls)
    );

}

function saveLogs() {

    localStorage.setItem(
        getLogKey(),
        JSON.stringify(actionLogs)
    );

}


// ===== 読み込み =====
function loadSession() {

    todayGirls =
        JSON.parse(
            localStorage.getItem(getDataKey())
        ) || [];

    // 一旦全部外す
    document
        .querySelectorAll("#girlList input")
        .forEach(cb => {

            cb.checked = false;

        });

    // 保存済みデータがある場合だけチェック復元
    todayGirls.forEach(girl => {

        const checkbox =
            document.querySelector(
                `#girlList input[value="${girl.name}"]`
            );

        if (checkbox) {

            checkbox.checked = true;

        }

    });

    renderTable();

}

function loadLogs() {

    actionLogs =
        JSON.parse(
            localStorage.getItem(getLogKey())
        ) || [];

    renderLogs();

}


// ===== 女の子登録 =====
document
    .getElementById("addGirlBtn")
    .addEventListener("click", addGirl);


function addGirl() {

    const name = girlName.value.trim();

    if (!name) return;

    girls.push(name);

    saveGirls();

    renderGirlList();

    girlName.value = "";

}


function deleteGirl(index) {

    if (!confirm("削除しますか？")) return;

    girls.splice(index, 1);

    saveGirls();

    renderGirlList();

}


function renderGirlList() {

    girlList.innerHTML = "";

    girls.forEach((girl, index) => {

        girlList.innerHTML += `
            <div>
                <input
                    type="checkbox"
                    value="${girl}"
                >

                ${girl}

                <button
                    class="dangerBtn"
                    onclick="deleteGirl(${index})"
                >
                    削除
                </button>
            </div>
        `;

    });

}


// ===== 出勤確定 =====
document
    .getElementById("confirmAttendanceBtn")
    .addEventListener(
        "click",
        confirmAttendance
    );


function confirmAttendance() {

    const checked =
        document.querySelectorAll(
            "#girlList input:checked"
        );

    checked.forEach(cb => {

        // 既に今日の出勤メンバーなら追加しない
        const exists = todayGirls.some(
            girl => girl.name === cb.value
        );

        if (exists) return;

        let drinkObj = {};

        drinksList.forEach(type => {

            drinkObj[type] = 0;

        });

        todayGirls.push({

            name: cb.value,

            drinks: drinkObj,

            sales: 0

        });

    });

    saveSession();

    renderTable();

}


// ===== 表描画 =====
function renderTable() {

    if (!todayGirls.length) {

        drinkArea.innerHTML = "";

        return;

    }

    drinkArea.innerHTML = `

    <div class="card">

        <div class="tableWrapper">

            <table>

                <thead>

                    <tr>

                        <th>名前</th>

                        ${drinksList
                            .map(type =>
                                `<th>${type}</th>`
                            )
                            .join("")}

                        <th>本指名売上</th>

                        <th>合計</th>

                    </tr>

                </thead>

                <tbody>

                    ${todayGirls
                        .map((girl, index) => `

                        <tr>

                            <td>
                                ${girl.name}
                            </td>

                            ${drinksList
                                .map(type => `

                                <td>

                                    <div class="cellControls">

                                        <button
                                            class="minus"
                                            onclick="
                                                changeDrink(
                                                    ${index},
                                                    '${type}',
                                                    -1
                                                )
                                            "
                                        >
                                            −
                                        </button>

                                        <span>
                                            ${girl.drinks[type]}
                                        </span>

                                        <button
                                            class="plus"
                                            onclick="
                                                changeDrink(
                                                    ${index},
                                                    '${type}',
                                                    1
                                                )
                                            "
                                        >
                                            ＋
                                        </button>

                                    </div>

                                </td>

                            `).join("")}

                            <td>

                                <div class="salesCell">

    <div class="salesAmount">
        ${formatYen(girl.sales)}
    </div>

    <button
        class="salesBtn"
        onclick="openSalesModal(${index})"
    >
        ＋売上
    </button>

    <button
        class="salesBtn dangerBtn"
        onclick="editSales(${index})"
    >
        訂正
    </button>

</div>

                            </td>

                            <td class="totalCol">

                                ${getTotal(girl)}

                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

    </div>

    `;

}


// ===== ドリンク変更 =====
function changeDrink(
    girlIndex,
    type,
    amount
) {

    const before =
        todayGirls[girlIndex]
            .drinks[type];

    const after =
        before + amount;

    if (after < 0) return;

    todayGirls[girlIndex]
        .drinks[type] = after;

    addLog(
        todayGirls[girlIndex].name,
        type,
        amount
    );

    saveSession();

    renderTable();

    renderLogs();

}


// ===== 合計 =====
function getTotal(girl) {

    return Object
        .values(girl.drinks)
        .reduce(
            (sum, value) =>
                sum + value,
            0
        );

}


// ===== 円表示 =====
function formatYen(value) {

    return "¥" +
        Number(value)
        .toLocaleString("ja-JP");

}


// ===== 本指名モーダル =====
function openSalesModal(index) {

    currentSalesGirlIndex = index;

    salesInput.value = "";

    salesModal.classList.remove(
        "hidden"
    );

    salesInput.focus();

}
// ===== 本指名売上追加 =====
document
    .getElementById("salesCancelBtn")
    .addEventListener("click", () => {

        salesModal.classList.add("hidden");

        currentSalesGirlIndex = null;

    });


document
    .getElementById("salesSaveBtn")
    .addEventListener("click", saveSales);


function saveSales() {

    const value =
        salesInput.value.replace(/\D/g, "");

    const amount = Number(value);

    if (!amount || amount <= 0) {

        alert("金額を入力してください");

        return;

    }

    todayGirls[currentSalesGirlIndex].sales += amount;

    addLog(
        todayGirls[currentSalesGirlIndex].name,
        "本指名",
        amount,
        true
    );

    saveSession();

    renderTable();

    renderLogs();

    salesModal.classList.add("hidden");

    currentSalesGirlIndex = null;

}


// ===== ログ =====
function addLog(
    name,
    type,
    amount,
    isSales = false
) {

    const now = new Date();

    const timestamp =
        `${now.getMonth() + 1}/` +
        `${now.getDate()} ` +
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}:` +
        `${String(now.getSeconds()).padStart(2, "0")}`;

    let text = "";
    let logType = "plus";

    if (isSales) {

        text =
            `${timestamp} ${name} ${type} +${formatYen(amount)}`;

    } else {

        text =
            `${timestamp} ${name} ${type} ${amount > 0 ? "+" : "-"}1`;

        logType =
            amount > 0
                ? "plus"
                : "minus";
    }

    actionLogs.unshift({
    text,
    type: logType,

    cancelled: false,

    girlName: name,
    action: type,
    amount: Math.abs(amount),
isMinus: amount < 0,

    isSales,
    isCorrection: false
});

    saveLogs();

}


function renderLogs() {

    const logArea =
        document.getElementById("logArea");

    logArea.innerHTML =
        actionLogs
            .map((log,index)=>`

                <div class="
                    logItem
                    ${log.type==="plus"?"logPlus":"logMinus"}
                    ${log.cancelled?"cancelledLog":""}
                ">

                    ${log.text}

                    ${
                        !log.cancelled &&
                        !log.isCorrection
                        ? `<button
                                class="cancelBtn"
                                onclick="cancelLog(${index})"
                           >
                             取消
                           </button>`
                        : log.cancelled
    ? `<span>取消済</span>`
    : ``
                    }

                </div>

            `)
            .join("");

}


document
    .getElementById("clearLogsBtn")
    .addEventListener("click", clearLogs);


function clearLogs() {

    if (!confirm("ログを削除しますか？")) {

        return;

    }

    actionLogs = [];

    localStorage.removeItem(
        getLogKey()
    );

    renderLogs();

}


// ===== 営業日CSV =====
document
    .getElementById("exportTodayCSVBtn")
    .addEventListener(
        "click",
        exportTodayCSV
    );


function exportTodayCSV() {

    if (!todayGirls.length) {

        alert("データがありません");

        return;

    }

    let csv =
    `営業日,${getDate()}\n\n`;

csv +=
    "名前," +
    drinksList.join(",") +
    ",本指名売上\n";

    todayGirls.forEach(girl => {

        csv += [

            girl.name,

            ...drinksList.map(
                type => girl.drinks[type]
            ),

            girl.sales

        ].join(",");

        csv += "\n";

    });

    downloadCSV(
    csv,
    `営業日_${getDate()}.csv`
);

}


// ===== CSVダウンロード =====
function downloadCSV(
    csv,
    filename
) {

    const bom =
        new Uint8Array([
            0xEF,
            0xBB,
            0xBF
        ]);

    const blob =
        new Blob(
            [bom, csv],
            { type: "text/csv" }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);

}


// ===== 今日のリセット =====
document
    .getElementById("resetTodayBtn")
    .addEventListener(
        "click",
        resetToday
    );


function resetToday() {

    if (
        !confirm(
            "今日の数値をリセットしますか？"
        )
    ) {

        return;

    }

    todayGirls = [];

    saveSession();

    renderTable();

    document
        .querySelectorAll(
            "#girlList input"
        )
        .forEach(cb => {

            cb.checked = false;

        });

}


// ===== 期間集計 =====
let aggregateData = [];


document
    .getElementById("aggregateBtn")
    .addEventListener(
        "click",
        aggregateDataByPeriod
    );


function aggregateDataByPeriod() {

    const start =
        document.getElementById("aggregateStart").value;

    const end =
        document.getElementById("aggregateEnd").value;

    if (!start || !end) {

        alert("期間を選択してください");

        return;

    }

    const result = {};

    Object.keys(localStorage)
        .forEach(key => {

            if (
                !key.startsWith("data_")
            ) {

                return;

            }

            const date =
                key.replace(
                    "data_",
                    ""
                );

            if (
                date < start ||
                date > end
            ) {

                return;

            }

            const data =
                JSON.parse(
                    localStorage.getItem(
                        key
                    )
                );

            data.forEach(girl => {

                if (
                    !result[girl.name]
                ) {

                    result[girl.name] = {

                        sales: 0

                    };

                    drinksList
                        .forEach(type => {

                            result[
                                girl.name
                            ][type] = 0;

                        });

                }

                drinksList
                    .forEach(type => {

                        result[
                            girl.name
                        ][type] +=
                            girl.drinks[type];

                    });

                result[
                    girl.name
                ].sales += girl.sales;

            });

        });

    aggregateData =
        Object.entries(result);

    renderAggregate();

}


// ===== 集計表示 =====
function renderAggregate() {

    const area =
        document.getElementById(
            "aggregateResult"
        );

    area.innerHTML = "";

    aggregateData.forEach(
        ([name, data]) => {

            area.innerHTML += `

                <div class="aggregateCard">

                    <h3>${name}</h3>

                    ${drinksList
                        .map(type => `

                            <div>

                                ${type}：
                                ${data[type]}

                            </div>

                        `)
                        .join("")}

                    <div>

                        本指名：
                        ${formatYen(
                            data.sales
                        )}

                    </div>

                </div>

            `;

        }
    );

}


// ===== 集計CSV =====
document
    .getElementById(
        "exportAggregateCSVBtn"
    )
    .addEventListener(
        "click",
        exportAggregateCSV
    );


function exportAggregateCSV() {

    if (!aggregateData.length) {

        alert("先に集計してください");

        return;

    }

    const start =
        document.getElementById("aggregateStart").value;

    const end =
        document.getElementById("aggregateEnd").value;

    let csv =
        `集計期間,${start}～${end}\n\n`;

    csv +=
        "名前," +
        drinksList.join(",") +
        ",本指名売上\n";

    aggregateData.forEach(
        ([name, data]) => {

            csv += [

                name,

                ...drinksList.map(
                    type => data[type]
                ),

                data.sales

            ].join(",");

            csv += "\n";

        }
    );

    console.log(csv);
alert("CSV出力開始");

downloadCSV(
    csv,
    `集計_${start}～${end}.csv`
);

}

function editSales(index) {

    const current = todayGirls[index].sales;

    const input = prompt(
        `現在：${formatYen(current)}\n新しい合計金額を入力してください`,
        current
    );

    if (input === null) return;

    const newValue = Number(
        input.replace(/\D/g, "")
    );

    if (isNaN(newValue)) {

        alert("正しい金額を入力してください");

        return;

    }

    todayGirls[index].sales = newValue;

    addCorrectionLog(
        todayGirls[index].name,
        current,
        newValue
    );

    saveSession();

    renderTable();

    renderLogs();

}
function addCorrectionLog(
    name,
    before,
    after
) {

    const now = new Date();

    const timestamp =
        `${now.getMonth()+1}/${now.getDate()} `
        + `${String(now.getHours()).padStart(2,"0")}:`
        + `${String(now.getMinutes()).padStart(2,"0")}:`
        + `${String(now.getSeconds()).padStart(2,"0")}`;

    actionLogs.unshift({
    text:
        `${timestamp} ${name} 本指名 訂正 `
        + `${formatYen(before)} → ${formatYen(after)}`,

    type: "plus",

    cancelled: false,

    isCorrection: true
});

    saveLogs();

}
function cancelLog(index){

    const log = actionLogs[index];

    if(log.cancelled) return;

    if(!confirm("この操作を取り消しますか？")){
        return;
    }

    // ドリンク
    if(!log.isSales){

        const girl = todayGirls.find(
            g=>g.name===log.girlName
        );

        if(girl){

            if(log.isMinus){

    girl.drinks[log.action] += log.amount;

}else{

    girl.drinks[log.action] -= log.amount;

}

            if(
                girl.drinks[log.action] < 0
            ){
                girl.drinks[log.action]=0;
            }

        }

    }

    // 本指名
    else{

        const girl = todayGirls.find(
            g=>g.name===log.girlName
        );

        if(girl){

            girl.sales -= log.amount;

            if(girl.sales < 0){
                girl.sales = 0;
            }

        }

    }

    // 元ログに横線
    log.cancelled = true;

    // 取消ログ追加
    const now = new Date();

    const timestamp =
        `${now.getMonth()+1}/${now.getDate()} `
        + `${String(now.getHours()).padStart(2,"0")}:`
        + `${String(now.getMinutes()).padStart(2,"0")}:`
        + `${String(now.getSeconds()).padStart(2,"0")}`;

    actionLogs.unshift({

        text:
            `${timestamp} ログ取消：${log.text}`,

        type:"minus",

        cancelled:false,

        isCorrection:true
    });

    saveSession();
    saveLogs();

    renderTable();
    renderLogs();

}
let lastTouchEnd = 0;

document.addEventListener(
    "touchend",
    function (event) {

        const now = new Date().getTime();

        if (now - lastTouchEnd <= 300) {

            event.preventDefault();

        }

        lastTouchEnd = now;

    },
    { passive: false }
);
// ===== 開発者モード =====



function openDeveloperMode() {

    const choice = prompt(
`🛠 開発者モード

1：localStorage確認
2：todayGirls確認
3：ログ全削除
4：全データ初期化
5：ストレージ使用量確認

番号を入力してください`
);

    if (choice === "1") {

        alert(
            JSON.stringify(
                localStorage,
                null,
                2
            )
        );

    }

    else if (choice === "2") {

        alert(
            JSON.stringify(
                todayGirls,
                null,
                2
            )
        );

    }

    else if (choice === "3") {

        if (
            confirm("全営業日のログを削除しますか？")
        ) {

            Object.keys(localStorage)
                .forEach(key => {

                    if (
                        key.startsWith("log_")
                    ) {

                        localStorage.removeItem(key);

                    }

                });

            actionLogs = [];

            renderLogs();

            alert("ログを全削除しました");

        }

    }

    else if (choice === "4") {

        if (
            confirm(
                "本当に全データを初期化しますか？"
            )
        ) {

            localStorage.clear();

            girls = [];
            todayGirls = [];
            actionLogs = [];

            renderGirlList();
            renderTable();
            renderLogs();

            alert(
                "全データを初期化しました"
            );

        }

    }

}
// ===== 開発者モード =====

let developerTapCount = 0;

window.addEventListener("load", () => {

    const trigger =
        document.getElementById("developerTrigger");

    // タイトルが見つからなければ何もしない
    if (!trigger) return;

    trigger.addEventListener("click", () => {

        developerTapCount++;

        if (developerTapCount >= 5) {

            developerTapCount = 0;

            openDeveloperMode();

        }

    });

});