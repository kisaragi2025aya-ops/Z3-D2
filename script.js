// 【重要】デプロイしたGoogle Apps ScriptのウェブアプリURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbxojoI5JstOJD6PyrXeSTKoSJjE_XzpMMzYPPqHuarCQousZpfPhB4agPk2eN6HpKJ7/exec";

let allData = { characters: [], artifacts: [] };

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

async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        allData = await response.json();
        updateArtifactCheckboxes(); 
        renderAll();
    } catch (e) {
        console.error("データの読み込みに失敗しました:", e);
        alert("データの取得に失敗しました。URLまたはネット接続を確認してください。");
    }
}

function renderAll() {
    const charList = document.getElementById('char-list');
    const artList = document.getElementById('art-list');
    if (!allData.characters || allData.characters.length <= 1) {
        charList.innerHTML = "<p>データがありません</p>";
    } else {
        charList.innerHTML = allData.characters.slice(1).map(c => {
            const name     = c[0] || "不明";
            const element  = c[1] || "-";
            const disk4    = c[2] || "未設定";
            const job      = c[3] || "-";
            const faction  = c[4] || "-";
            const weapon   = c[5] || "未設定";
            const substat  = c[6] || "未設定";
            const p4       = c[7] || "-";
            const p5       = c[8] || "-";
            const p6       = c[9] || "-";
            const img      = c[10] || 'https://via.placeholder.com/70?text=Agent';
            const atkType  = c[11] || "-";
            const disk2    = c[12] || "未設定";

            return `
            <div class="card char-card">
                <div class="card-header">
                    <img src="${img}" alt="${name}">
                    <div style="flex-grow:1;">
                        <h4>${name}</h4>
                        <div style="margin-top: 4px;">
                            <span class="tag">${element}</span>
                            <span class="tag">${atkType}</span>
                            <span class="tag">${job}</span>
                        </div>
                    </div>
                    <div class="card-btns">
                        <button class="edit-btn" onclick="editItem('characters', '${name}')">編集</button>
                        <button class="delete-btn" onclick="deleteItem('characters', '${name}')">削除</button>
                    </div>
                </div>
                <div class="card-content">
                    <p><strong>所属:</strong> ${faction}</p>
                    <p><strong>推奨音動機:</strong> <span style="color:#fff;">${weapon}</span></p> 
                    <p><strong>推奨ディスク:</strong><br>
                       <span class="set-tag">4set: ${disk4}</span>
                       <span class="set-tag">2set: ${disk2}</span>
                    </p>
                    <p><strong>メイン:</strong> IV:${p4} / V:${p5} / VI:${p6}</p>
                    <p><strong>サブ優先:</strong> <span style="color:#ffff00;">${substat}</span></p>
                </div>
            </div>`;
        }).join('');
    }

    if (allData.artifacts && allData.artifacts.length > 1) {
        artList.innerHTML = allData.artifacts.slice(1).map(a => {
            const artName = a[0];
            const users4set = allData.characters.slice(1).filter(c => c[2] === artName);
            const users2set = allData.characters.slice(1).filter(c => c[12] === artName);
            const allUsers = [...users4set, ...users2set];
            
            const getAggregatedStats = (colIndex) => {
                let stats = allUsers.map(u => u[colIndex]).join(', ').split(',').map(s => s.trim()).filter(s => s);
                return [...new Set(stats)].join(', ') || "データなし";
            };

            return `
            <div class="card art-card">
                <div class="card-header">
                    <img src="${a[8] || 'https://via.placeholder.com/70?text=Disk'}" alt="${artName}">
                    <div style="flex-grow:1;"><h4>${artName}</h4></div>
                </div>
                <div class="card-content">
                    <div class="keep-stats-box">
                        <p style="margin:0; font-weight:bold; color:#ffff00;">【厳選・残すべきメインステ】</p>
                        <p style="margin:4px 0 0 0;">IV: ${getAggregatedStats(7)}</p>
                        <p style="margin:2px 0 0 0;">V: ${getAggregatedStats(8)}</p>
                        <p style="margin:2px 0 0 0;">VI: ${getAggregatedStats(9)}</p>
                    </div>
                    <p><strong>使用者(4set):</strong> ${users4set.map(u => u[0]).join(', ') || 'なし'}</p>
                    <p><strong>使用者(2set):</strong> ${users2set.map(u => u[0]).join(', ') || 'なし'}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                    <p style="font-size:0.8rem; color:#bbb;"><strong>4枚効果:</strong> ${a[2] || '未登録'}</p>
                </div>
            </div>`;
        }).join('');
    }
}

function updateArtifactCheckboxes() {
    const container4 = document.getElementById('char-art-4set-list');
    const container2 = document.getElementById('char-art-2set-list');
    if (!container4 || !container2 || !allData.artifacts) return;

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
        document.getElementById('char-faction').value = c[4];
        document.getElementById('recommended-weapons').value = c[5];
        document.getElementById('sub-stats-priority').value = c[6];
        document.getElementById('char-icon-url').value = c[10];

        const setValues = (name, val) => {
            const vals = val ? val.split(',').map(v => v.trim()) : [];
            document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
                if (el.type === "radio") {
                    el.checked = (el.value === val);
                } else {
                    el.checked = vals.includes(el.value);
                }
            });
        };

        setValues('element', c[1]);
        setValues('char-4set-choice', c[2]);
        setValues('job', c[3]);
        setValues('p4', c[7]);
        setValues('p5', c[8]);
        setValues('p6', c[9]);
        setValues('attack-type', c[11]);
        setValues('char-2set-choice', c[12]);
    }
}

document.getElementById('char-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const getChecks = (name) => {
        const checked = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
        return checked.join(', ');
    };
    
    const payload = {
        sheetName: "characters",
        data: [
            document.getElementById('char-name').value, 
            getChecks('element'), 
            getChecks('char-4set-choice'), 
            getChecks('job'), 
            document.getElementById('char-faction').value, 
            document.getElementById('recommended-weapons').value, 
            document.getElementById('sub-stats-priority').value, 
            getChecks('p4'), getChecks('p5'), getChecks('p6'), 
            document.getElementById('char-icon-url').value, 
            getChecks('attack-type'), 
            getChecks('char-2set-choice')
        ]
    };

    await fetch(GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    alert("保存完了！");
    location.reload();
});

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
    await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action: "delete", sheetName: sheet, id: id}) });
    location.reload();
}

function filterData() {
    const query = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.char-card, .art-card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(query) ? 'block' : 'none';
    });
}