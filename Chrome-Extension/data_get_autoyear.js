const today = new Date();
let new_month, new_year;
let last_day;
const fetch_URL = "ここにデプロイしたURLを指定";

function getScheduleData() {
    //ページ内のすべての<tr>を取得
    const rows = document.querySelectorAll("tr");
    let currentDate = "";
    const scheduleData = [];

    rows.forEach(row => {
        //日付行の場合
        if (row.classList.contains("trDay")) {
            //日付要素のみ取得
            const dateDiv = row.querySelector(".day");
            if (dateDiv) {
                //整形(スペースとか色々余計な要素があるので)
                currentDate = dateDiv.innerText.trim();
                currentDate = currentDate.match(/^\d+/);
                //intにスコープしないと1文字目を比較してしまうためバグる
                //年や月をまたぐ場合の処理
                if (parseInt(new_month) == 12 && parseInt(currentDate) < parseInt(last_day)){
                    //年
                    new_year++;
                    new_month = 1;
                }else if (parseInt(currentDate) < parseInt(last_day)) {
                    //月
                    new_month++;
                }
                console.log(new_month + " " + currentDate);
            }
            last_day = currentDate
        }
        // 授業行の場合
        else if (row.classList.contains("kjSchedule")) {
            const cells = row.querySelectorAll("td");
            if (cells.length >= 3) {
                //時刻情報
                let timeText = cells[0].innerText.trim();
                if (timeText == "－" || !timeText) {
                    //時刻情報がない場合は終日の予定としてみなす
                    timeText = "00:00～23:59";
                }
                //2列目にある授業の詳細テキストを取得
                let lessonDetail = cells[1].innerText.trim();
                //不要なワードを取り除く
                const lines = lessonDetail.split("\n").map(s => s.trim()).filter(s => s && s !== "授業");
                //最初の有用な行（または複数行を結合する）を授業名とする
                let lessonName = lines.length > 0 ? lines.join(" ") : "";
                //場所
                let placeText = cells[2].innerText.trim();
                placeText = placeText.replace("\n座席表", "　全席指定席");
                //デバッグ用
                //alert("取得情報:\n年:"+new_year+"\n月:"+new_month+"\n日:" + currentDate + "\n時刻:" + timeText + "\n授業名:" + lessonName + "\n場所:" + placeText);
                // 各項目と、直前の日付を対応付けてオブジェクトとして保存
                // 2026年に差し掛かる前に仕様変更しないと絶対にバグる→修正済み
                scheduleData.push({
                    year: new_year,
                    month: new_month,
                    date: currentDate,
                    time: timeText,
                    lesson: lessonName,
                    place: placeText
                });
            }
        }
    });
    if (scheduleData.length == 0) {
        //要素が見つからなかったら見つかるまで1秒ごとに繰り返す
        setTimeout(getScheduleData, 1000);
        console.log("DOMが一つも見つかりませんでした。");
        return 1;
    }
    //成功
    //return scheduleData;
    console.log("DOMが見つかりました。");
    let confirm_result = confirm("データの送信を開始してもよろしいでしょうか？");
    if (confirm_result) {
        //CORSポリシーの関係でエラーが出るのでno-corsで送る(そのためGAS側でもエラーメールが来るようにしとかないと異常時に気付けないので注意)
        fetch(fetch_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scheduleData)
        })
        .then(() => {
            alert("送信完了しました。");
            console.log("動作終了");
        })
        .catch((error) => {
            alert("送信中にエラーが発生しました。: \n" + error.message);
        });        
    }
}

function process_preparation(){
    console.log("拡張機能は読み込まれています。");
    let year_month_dom_div, year_month_dom_p
    year_month_dom_div = document.getElementsByClassName("bar smpDispNone");
    if(year_month_dom_div.length > 0){
        year_month_dom_p = year_month_dom_div[0].querySelectorAll("p");
    }
    if (year_month_dom_div.length == 1 && year_month_dom_p.length == 1) {
        //alert(year_month_dom_p[0].innerText);
        //正規表現で取得
        let match;
        match = year_month_dom_p[0].innerText.match(/(\d{4})年(\d{1,2})月/);
        new_year = match[1];
        new_month = match[2];
        //numberで整形しないと01月などとなってしまう(replaceとかで0を置換すると10月でバグるので変えないこと)
        new_month = Number(new_month);
    }else{
        //取得できない場合
        //どうやらカレンダーはonloadで取得処理に入るっぽいのでこの関数を遅延させているが、それでも取得できない場合は遅延を伸ばすかDOM生成をトリガーにするよう処理を変えること
        let month = today.getMonth() + 1;
        let year = today.getFullYear();
        new_month = prompt("年月を正しく読み込めませんでした。\n現在の月を半角数字で入れてください。\n【注意!】\n表示しているカレンダーが今月の物でない場合は、正しい月を入力してください。(跨いでいる場合は前の方の月を入力)", month);
        new_year = prompt("年月を正しく読み込めませんでした。\n現在の年を半角数字で入れてください。\n【注意!】\n表示しているカレンダーが今年の物でない場合は、正しい年を入力してください。(跨いでいる場合は前の方の年を入力)", year);
    }
    let final_comfirm = confirm("年月の入力内容は以下で正しいですか?\n\n年: " + new_year + "年\n月: " + new_month + "月\n\n宜しければOKをクリックしてください。");
    if (final_comfirm) {
        console.log("関数実行");
        getScheduleData();
    }else{
        console.log("何もせずに終了");
    }
    return 0;
}

window.addEventListener("load", (event) => {
    setTimeout(process_preparation, 1000);
});