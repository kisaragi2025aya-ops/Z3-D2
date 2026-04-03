// 【重要】デプロイしたGoogle Apps ScriptのウェブアプリURLをここに貼り付けてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbxojoI5JstOJD6PyrXeSTKoSJjE_XzpMMzYPPqHuarCQousZpfPhB4agPk2eN6HpKJ7/exec";

let allData = { characters: [], artifacts: [] };

// --- 1. 初期化とモード切り替え ---
window.onload = () => {
    loadData();
    // トップへ戻るボタンの制御
    const topBtn = document.getElementById('back-to-top');
    window.onscroll = () => { topBtn.style.display = (window.scrollY > 300) ? 'flex' : 'none'; };
    topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
};

function changeMode(mode) {
    document.getElementById('view-mode').style.display = (mode === 'view') ? 'block' : 'none';
    document.getElementById('register-mode').style.display = (mode === 'register') ? 'block' : 'none';
    if (mode === 'view') loadData();
}

function showForm(formId) {
    document.getElementById('char-form-container').style.display = 'none';
    document.getElementById('art-form-container').style.display = 'none';
    document.getElementById(formId).style.display = 'block';
}

// --- 2. データ読み込みとレンダリング ---
async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        allData = await response.json();
        updateArtifactCheckboxes(); // キャラ登録フォーム内のディスク選択肢を更新
        renderAll();
    } catch (e) {
        console.error("データの読み込みに失敗しました:", e);
    }
}

function renderAll() {
    const charList = document.getElementById('char-list');
    const artList = document.getElementById('art-list');

    // エージェント図鑑の表示
    charList.innerHTML = allData.characters.slice(1).map(c => `
        <div class="card char-card">
            <div class="card-header">
                <img src="${c[11] || 'https://via.placeholder.com/70?text=Agent'}" alt="${c[0]}">
                <div style="flex-grow:1;">
                    <h4>${c[0]}</h4>
                    <p class="tag">${c[2]}</p> <p class="tag">${c[12] || 'タイプ未設定'}</p> <p class="tag">${c[4]}</p> </div>
                <div class="card-btns">
                    <button class="edit-btn" onclick="editItem('characters', '${c[0]}')">編集</button>
                    <button class="delete-btn" onclick="deleteItem('characters', '${c[0]}')">削除</button>
                </div>
            </div>
            <div class="card-content">
                <p><strong>所属:</strong> ${c[5]}</p>
                <p><strong>音動機:</strong> ${c[6] || '未設定'}</p>
                <p><strong>メイン:</strong> IV:${c[8]} / V:${c[9]} / VI:${c[10]}</p>
                <p><strong>サブ:</strong> <span style="color:#ffff00;">${c[7] || '未設定'}</span></p>
                <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                <p><strong>推奨ディスク:</strong> ${c[3]}</p>
            </div>
        </div>
    `).join('');

    // ドライバディスク図鑑の表示（キャラクターのデータから推奨ステータスを自動集計）
    artList.innerHTML = allData.artifacts.slice(1).map(a => {
        const artName = a[0];
        // このディスクを装備しているキャラを抽出
        const users = allData.characters.slice(1).filter(c => c[3].includes(artName));
        
        // 推奨メインステータスの重複を排除して結合
        const getAggregatedStats = (colIndex) => {
            let stats = users.map(u => u[colIndex]).join(', ').split(',').map(s => s.trim()).filter(s => s);
            return [...new Set(stats)].join(', ') || "データなし";
        };

        return `
        <div class="card art-card">
            <div class="card-header">
                <img src="${a[8] || 'https://via.placeholder.com/70?text=Disk'}" alt="${artName}">
                <div style="flex-grow:1;"><h4>${artName}</h4></div>
                <div class="card-btns">
                    <button class="edit-btn" onclick="editItem('artifacts', '${artName}')">編集</button>
                    <button class="delete-btn" onclick="deleteItem('artifacts', '${artName}')">削除</button>
                </div>
            </div>
            <div class="card-content">
                <div class="keep-stats-box">
                    <p style="margin:0; font-weight:bold; color:#ffff00;">【厳選・残すべきメインステ】</p>
                    <p style="margin:4px 0 0 0;">IV: ${getAggregatedStats(8)}</p>
                    <p style="margin:2px 0 0 0;">V: ${getAggregatedStats(9)}</p>
                    <p style="margin:2px 0 0 0;">VI: ${getAggregatedStats(10)}</p>
                </div>
                <p><strong>2セット:</strong> ${a[1]}</p>
                <p><strong>4セット:</strong> ${a[2]}</p>
                <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                <p><strong>主な使用者:</strong> ${users.map(u => u[0]).join(', ') || 'なし'}</p>
            </div>
        </div>`;
    }).join('');
}

// --- 3. 登録・編集ロジック ---

// キャラ登録フォーム内のディスク選択肢を動的に生成
function updateArtifactCheckboxes() {
    const container = document.getElementById('char-target-art-list');
    if (!container) return;
    container.innerHTML = allData.artifacts.slice(1).map(a => `
        <label><input type="checkbox" name="char-art-choice" value="${a[0]}"> ${a[0]}</label>
    `).join('') || '<p style="font-size:0.8rem; color:#888;">先にディスクを登録してください</p>';
}

// 編集ボタン押下時の処理
function editItem(type, id) {
    changeMode('register');
    if (type === 'characters') {
        showForm('char-form-container');
        const c = allData.characters.find(row => row[0] === id);
        if (!c) return;
        document.getElementById('char-name').value = c[0];
        document.getElementById('char-faction').value = c[5];
        document.getElementById('recommended-weapons').value = c[6];
        document.getElementById('sub-stats-priority').value = c[7];
        document.getElementById('char-icon-url').value = c[11];

        // チェックボックス/ラジオボタンの復元
        const setChecks = (name, val) => {
            const vals = val ? val.split(',').map(v => v.trim()) : [];
            document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
                el.checked = vals.includes(el.value);
            });
        };
        setChecks('element', c[2]);
        setChecks('attack-type', c[12]);
        setChecks('job', c[4]);
        setChecks('char-art-choice', c[3]);
        setChecks('p4', c[8]);
        setChecks('p5', c[9]);
        setChecks('p6', c[10]);
    } else {
        showForm('art-form-container');
        const a = allData.artifacts.find(row => row[0] === id);
        if (!a) return;
        document.getElementById('art-name').value = a[0];
        document.getElementById('art-effect-2').value = a[1];
        document.getElementById('art-effect-4').value = a[2];
        document.getElementById('art-img-url').value = a[8];
    }
}

// 保存処理（キャラ）
document.getElementById('char-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const getChecks = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value).join(', ');
    
    const payload = {
        sheetName: "characters",
        data: [
            document.getElementById('char-name').value,
            "", // ランク等（予備）
            getChecks('element'),
            getChecks('char-art-choice'),
            getChecks('job'),
            document.getElementById('char-faction').value,
            document.getElementById('recommended-weapons').value,
            document.getElementById('sub-stats-priority').value,
            getChecks('p4'),
            getChecks('p5'),
            getChecks('p6'),
            document.getElementById('char-icon-url').value,
            getChecks('attack-type')
        ]
    };

    await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    alert("エージェントデータを保存しました");
    e.target.reset();
    changeMode('view');
});

// 保存処理（ディスク）
document.getElementById('art-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        sheetName: "artifacts",
        data: [
            document.getElementById('art-name').value,
            document.getElementById('art-effect-2').value,
            document.getElementById('art-effect-4').value,
            "", "", "", "", "", // 空白列（スプレッドシートの構造維持用）
            document.getElementById('art-img-url').value
        ]
    };
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    alert("ディスクデータを保存しました");
    e.target.reset();
    changeMode('view');
});

// 削除処理
async function deleteItem(sheet, id) {
    if(!confirm(`「${id}」を削除してもよろしいですか？`)) return;
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action: "delete", sheetName: sheet, id: id}) });
    loadData();
}

// 検索フィルタ
function filterData() {
    const query = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? 'flex' : 'none';
    });
}