// 【重要】デプロイしたGoogle Apps ScriptのウェブアプリURLをここに貼り付けてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbxojoI5JstOJD6PyrXeSTKoSJjE_XzpMMzYPPqHuarCQousZpfPhB4agPk2eN6HpKJ7/exec";

let allData = { characters: [], artifacts: [] };

// --- 1. 初期化とモード切り替え ---
window.onload = () => {
    loadData();
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
        updateArtifactCheckboxes(); 
        renderAll();
    } catch (e) {
        console.error("データの読み込みに失敗しました:", e);
    }
}

function renderAll() {
    const charList = document.getElementById('char-list');
    const artList = document.getElementById('art-list');

    // --- エージェント図鑑の表示 ---
    charList.innerHTML = allData.characters.slice(1).map(c => `
        <div class="card char-card">
            <div class="card-header">
                <img src="${c[11] || 'https://via.placeholder.com/70?text=Agent'}" alt="${c[0]}">
                <div style="flex-grow:1;">
                    <h4>${c[0]}</h4>
                    <div style="margin-top: 4px;">
                        <span class="tag">${c[2]}</span>
                        <span class="tag">${c[12] || 'タイプ未設定'}</span>
                        <span class="tag">${c[4]}</span>
                    </div>
                </div>
                <div class="card-btns">
                    <button class="edit-btn" onclick="editItem('characters', '${c[0]}')">編集</button>
                    <button class="delete-btn" onclick="deleteItem('characters', '${c[0]}')">削除</button>
                </div>
            </div>
            <div class="card-content">
                <p><strong>所属:</strong> ${c[5]}</p>
                <p><strong>推奨音動機:</strong> <span style="color:#fff;">${c[6] || '未設定'}</span></p> 
                <p><strong>推奨ディスク:</strong><br>
                   <span class="set-tag">4set: ${c[3] || '未設定'}</span>
                   <span class="set-tag">2set: ${c[13] || '未設定'}</span>
                </p>
                <p><strong>メイン:</strong> IV:${c[8]} / V:${c[9]} / VI:${c[10]}</p>
                <p><strong>サブ優先:</strong> <span style="color:#ffff00;">${c[7] || '未設定'}</span></p>
            </div>
        </div>
    `).join('');

    // --- ドライバディスク図鑑の表示 ---
    artList.innerHTML = allData.artifacts.slice(1).map(a => {
        const artName = a[0];
        // 4セット用または2セット用としてそのディスクを使っているキャラを抽出
        const users4set = allData.characters.slice(1).filter(c => c[3] === artName);
        const users2set = allData.characters.slice(1).filter(c => c[13] === artName);
        const allUsers = [...users4set, ...users2set];
        
        // メインステータスの集計ロジック
        const getAggregatedStats = (colIndex) => {
            let stats = allUsers.map(u => u[colIndex]).join(', ').split(',').map(s => s.trim()).filter(s => s);
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
                <p><strong>使用者(4set):</strong> ${users4set.map(u => u[0]).join(', ') || 'なし'}</p>
                <p><strong>使用者(2set):</strong> ${users2set.map(u => u[0]).join(', ') || 'なし'}</p>
                <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                <p style="font-size:0.8rem; color:#bbb;"><strong>4枚効果:</strong> ${a[2] || '未登録'}</p>
            </div>
        </div>`;
    }).join('');
}

// --- 3. 登録・編集ロジック ---

function updateArtifactCheckboxes() {
    const container4 = document.getElementById('char-art-4set-list');
    const container2 = document.getElementById('char-art-2set-list');
    if (!container4 || !container2) return;

    const list = allData.artifacts.slice(1).map(a => a[0]);
    const generateOptions = (name) => list.map(nameStr => `
        <label><input type="radio" name="${name}" value="${nameStr}"> ${nameStr}</label>
    `).join('') || '<p style="font-size:0.8rem; color:#888;">先にディスクを登録してください</p>';

    container4.innerHTML = generateOptions('char-4set-choice');
    container2.innerHTML = generateOptions('char-2set-choice');
}

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

        const setChecks = (name, val) => {
            const vals = val ? val.split(',').map(v => v.trim()) : [];
            document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
                el.checked = vals.includes(el.value);
            });
        };
        setChecks('element', c[2]);
        setChecks('attack-type', c[12]);
        setChecks('job', c[4]);
        setChecks('char-4set-choice', c[3]);
        setChecks('char-2set-choice', c[13]); // N列（2セット目）
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

// キャラクター保存
document.getElementById('char-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const getChecks = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value).join(', ');
    
    const payload = {
        sheetName: "characters",
        data: [
            document.getElementById('char-name').value, // A:名前
            "", // B:ランク(空)
            getChecks('element'), // C:属性
            getChecks('char-4set-choice'), // D:4セット
            getChecks('job'), // E:特性
            document.getElementById('char-faction').value, // F:所属
            document.getElementById('recommended-weapons').value, // G:音動機
            document.getElementById('sub-stats-priority').value, // H:サブステ
            getChecks('p4'), // I:P4
            getChecks('p5'), // J:P5
            getChecks('p6'), // K:P6
            document.getElementById('char-icon-url').value, // L:画像
            getChecks('attack-type'), // M:攻撃タイプ
            getChecks('char-2set-choice') // N:2セット
        ]
    };

    await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    alert("保存完了！");
    location.reload(); // 反映のためリロード
});

// ディスク保存
document.getElementById('art-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        sheetName: "artifacts",
        data: [
            document.getElementById('art-name').value,
            document.getElementById('art-effect-2').value,
            document.getElementById('art-effect-4').value,
            "", "", "", "", "", 
            document.getElementById('art-img-url').value
        ]
    };
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    alert("ディスク情報を保存しました");
    location.reload();
});

async function deleteItem(sheet, id) {
    if(!confirm(`${id} を削除しますか？`)) return;
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action: \"delete\", sheetName: sheet, id: id}) });
    loadData();
}

function filterData() {
    const query = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(query) ? 'flex' : 'none';
    });
}