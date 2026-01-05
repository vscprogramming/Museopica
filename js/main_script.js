const audio_context_inst = new AudioContext();
const audio_context_drum = new AudioContext();
let inst_id, instruments = [], drums = [];
let playing = false;
let mode, current_instrument, duration, vol, color, tempo, key
let page;
document.addEventListener('DOMContentLoaded', main);

async function main() {
    document.getElementById('loading').style.display = 'flex';
    await keys_generation();
    await UI_prepare();
    await scroll_syncing();
    await editor_grid_prepare();
    await key_click();
    document.getElementById('loading').style.display = 'none';

    viewer_debug(); // デバッグ用関数
}

function keys_generation() {
    const white_keyboards = document.getElementById('white_keyboards');
    const black_keyboards = document.getElementById('black_keyboards');
    const drums_keyboards = document.getElementById('drums_keyboards');
    const white_flag = document.createDocumentFragment();
    const black_flag = document.createDocumentFragment();
    const drums_flag = document.createDocumentFragment();

    for (let i = 1; i <= 50; i++) {
        const white_key = document.createElement('button');
        white_key.className = 'white_key';
        white_key.dataset.key_index = i;
        if (i % 7 == 1) white_key.textContent = `C${8 - Math.floor(i / 7)}`;
        white_flag.appendChild(white_key);
    }

    for (let i = 1; i <= 35; i++) {
        const black_key = document.createElement('button');
        black_key.className = 'black_key';
        black_key.dataset.key_index = i;
        black_flag.appendChild(black_key);
    }

    for (let i = 1; i <= 9; i++) {
        const drum_key = document.createElement('button');
        drum_key.className = 'drum_key';
        drum_key.dataset.key_index = i;
        drums_flag.appendChild(drum_key);
    }

    white_keyboards.appendChild(white_flag);
    black_keyboards.appendChild(black_flag);
    drums_keyboards.appendChild(drums_flag);
}

async function UI_prepare() {
    // ファイルボタン押下時
    const file_btn = document.getElementById('file_btn');
    const modal_back = document.getElementById('modal_back');

    file_btn.addEventListener('click', () => {
        if (modal_back.classList == 'show') modal_back.classList.remove('show');
        else modal_back.classList.add('show');
    });

    modal_back.addEventListener('click', () => modal_back.classList.remove('show'));

    // モード切替ボタン処理
    mode = 'lock';
    document.getElementById('lock_btn').classList.add('selected');

    document.getElementById('mode_btns').addEventListener('click', event => {
        if (event.target.tagName === 'BUTTON') {
            if (mode == event.target.dataset.mode) return;
            mode = event.target.dataset.mode;
            document.querySelectorAll('#mode_btns button').forEach(btn => { btn.classList.remove('selected') });
            event.target.classList.add('selected');
        }
    });

    // 再生ボタン処理
    document.querySelectorAll('#ctrl_btns').forEach(btn => {
        
    });


    // 楽器選択プルダウン準備
    const inst_data = await inst_load();
    const drum_data = await drum_load();
    const inst_sel = document.getElementById('inst_sel');
    const inst_opt_flag = document.createDocumentFragment();
    
    inst_data.forEach(inst => {
        const opt = Object.assign(document.createElement('option'), {
            value: inst.num,
            textContent: inst.ja
        });

        inst_opt_flag.appendChild(opt);
    });

    inst_sel.appendChild(inst_opt_flag);
    
    // メロディー楽器読み込み
    await Promise.all(inst_data.map(async (inst, i) => {
        const sf = await Soundfont.instrument(audio_context_inst, inst.js);
        instruments[i] = sf;
    }));

    current_instrument = instruments[0];
    inst_id = inst_data[0].js
    console.log(instruments);

    // 打楽器読み込み
    await Promise.all(drum_data.map(async (drum, i) => {
        const res = await fetch(drum.audio_path);
        const binary = await res.arrayBuffer();
        drums[i] = await audio_context_drum.decodeAudioData(binary);
    }));

    const drum_keys = document.querySelectorAll('#drums_keyboards .drum_key');
    drum_data.forEach((drum, i) => drum_keys[i].textContent = drum.en);

    // 楽器プルダウン変更時処理
    inst_sel.addEventListener('change', () => {
        inst_id = inst_data[Number(inst_sel.value) - 1].js;
        current_instrument = instruments[Number(inst_sel.selectedIndex)];
    });

    // テンポ初期処理
    const BPM_input = document.getElementById('BPM_input');
    tempo = Number(BPM_input.value);

    // 拍数スライダー変更時処理
    const dur_input = document.getElementById('dur_input');
    const dur_label = document.getElementById('dur_label');

    dur_input.addEventListener('input', dur_update_slider_property);
    dur_update_slider_property();

    function dur_update_slider_property() {
        const val_label = dur_input.value
        const val_input = val_label / dur_input.max * 100;
        dur_label.textContent = `${val_label}拍`;
        dur_input.style.setProperty('--dur-value', val_input + '%');
        duration = (60 / tempo) * dur_input.value
    }

    // 音量スライダー変更時処理
    const vol_input = document.getElementById('vol_input');
    const vol_label = document.getElementById('vol_label');

    vol_input.addEventListener('input', vol_update_slider_property);
    vol_update_slider_property();

    function vol_update_slider_property() {
        const val_label = vol_input.value
        const val_input = val_label / vol_input.max * 100;
        vol_label.textContent = `${val_label}%`;
        vol_input.style.setProperty('--vol-value', val_input + '%');
        vol = val_label / 100 * 7;
    }

    // カラー変更時
    const color_input = document.getElementById('color_input');
    color = color_input.value;
    color_input.addEventListener('input', () => color = color_input.value);

    // BPMテキストボックス変更時処理（規制）
    BPM_input.addEventListener('change', () => {
        const BPM_min = Number(BPM_input.min);
        const BPM_max = Number(BPM_input.max);
        const BPM_val = Number(BPM_input.value);
        if (BPM_val < BPM_min) BPM_input.value = BPM_min;
        if (BPM_val > BPM_max) BPM_input.value = BPM_max;
        tempo = Number(BPM_input.value);
    });

    // キーテキストボックス変更時処理（規制）
    const key_input = document.getElementById('key_input');
    key = Number(key_input.value);
    key_input.addEventListener('input', () => key = Number(key_input.value));
    ['keydown', 'paste'].forEach(event_type => key_input.addEventListener(event_type, event => event.preventDefault()));
}

async function inst_load() {
    let retry_count = 1;

    while (retry_count <= 3) {
        try {
            const res = await fetch('assets/json/inst.json');

            if (res.ok) {
                const json_data = await res.json();
                return json_data;
            } else {
                console.error(`${retry_count} / 3, inst load error`);
                alert(`楽器の読み込みにエラーが発生しました。\n再試行します。\n（${retry_count} / 3）`);
                retry_count++;
            }
        } catch (error) {
            console.error(`${retry_count} / 3, inst net error`);
            alert(`ネットワークエラーが発生しました。\n再試行します。\n（${retry_count} / 3）`);
            retry_count++;
        }
    }

    alert('楽器情報が読み取れませんでした。\nネットワーク接続を確認の上、もう一度再読み込みしてください。\nOKをクリックすると再読み込みを行います。');
    window.location.reload();
}

async function drum_load() {
    let retry_count = 1;

    while (retry_count <= 3) {
        try {
            const res = await fetch('assets/json/drum.json');

            if (res.ok) {
                const json_data = await res.json();
                return json_data;
            } else {
                console.error(`${retry_count} / 3, inst load error`);
                alert(`楽器の読み込みにエラーが発生しました。\n再試行します。\n（${retry_count} / 3）`);
                retry_count++;
            }
        } catch (error) {
            console.error(`${retry_count} / 3, inst net error`);
            alert(`ネットワークエラーが発生しました。\n再試行します。\n（${retry_count} / 3）`);
            retry_count++;
        }
    }

    alert('楽器情報が読み取れませんでした。\nネットワーク接続を確認の上、もう一度再読み込みしてください。\nOKをクリックすると再読み込みを行います。');
    window.location.reload();
}

function scroll_syncing() {
    const keyboards = document.getElementById('keyboards');
    const canvas = document.getElementById('canvas');

    let syncing = false;

    keyboards.addEventListener('scroll', () => {
        if (syncing) return;
        syncing = true;
        canvas.scrollTop = keyboards.scrollTop;
        syncing = false;
    });

    canvas.addEventListener('scroll', () => {
        if (syncing) return;
        syncing = true;
        keyboards.scrollTop = canvas.scrollTop;
        syncing = false;
    });
}

async function editor_grid_prepare() {
    const canvas_grid = document.getElementById('grid');
    const canvas_put_notes = document.getElementById('put_notes');
    const canvas_move_notes = document.getElementById('move_notes');
    const div_modal_back = document.getElementById('modal_back');

    setInterval(async () => {
        await resize_stage(canvas_grid, canvas_put_notes, canvas_move_notes, div_modal_back);
        await paint_stage(canvas_grid);
    }, 1000 / 24);
}

function resize_stage(canvas_grid, canvas_put_notes, canvas_move_notes, div_modal_back) {
    const div_canvas = document.getElementById('canvas').getBoundingClientRect();
    const white_keyboards = document.getElementById('white_keyboards').getBoundingClientRect();
    const drums_keyboards = document.getElementById('drums_keyboards').getBoundingClientRect();

    [canvas_grid, canvas_put_notes, canvas_move_notes, div_modal_back].forEach(canvas => {
        Object.assign(canvas, {
            width: div_canvas.width - 7,
            height: white_keyboards.height + drums_keyboards.height
        });
    });
}

function paint_stage(canvas_grid) {
    const grid_width = canvas_grid.getBoundingClientRect().width / 64;
    const grid_height = canvas_grid.getBoundingClientRect().height / 59;
    const ctx = canvas_grid.getContext('2d');
    ctx.clearRect(0, 0, canvas_grid.width, canvas_grid.height);

    for (let x = 1; x <= 64; x++) {
        ctx.beginPath();

        if (x % 16 == 0) {
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 2;
        } else if (x % 4 == 0) {
            ctx.strokeStyle = '#828282';
            ctx.lineWidth = 1;
        } else {
            ctx.strokeStyle = '#828282';
            ctx.lineWidth = 0.5;
        }

        ctx.moveTo(x * grid_width, 0);
        ctx.lineTo(x * grid_width, canvas_grid.height);
        ctx.stroke();
    }

    for (let y = 1; y <= 58; y++) {
        ctx.beginPath();

        if (y < 50 && (y % 7 == 1 || y % 7 == 5)) {
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 1;
        } else if (y == 50) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 1;
        } else {
            ctx.strokeStyle = '#828282';
            ctx.lineWidth = 0.5;
        }

        ctx.moveTo(0, y * grid_height);
        ctx.lineTo(canvas_grid.width, y * grid_height);
        ctx.stroke();
    }
}

async function key_click() {
    const pitch_data = await pitch_load();
    let click = false;
    document.addEventListener('pointerdown', () => click = true);
    document.addEventListener('pointerup', () => click = false);
    const white_keyboards = document.getElementById('white_keyboards');
    const black_keyboards = document.getElementById('black_keyboards');
    const drums_keyboards = document.getElementById('drums_keyboards');

    white_keyboards.addEventListener('pointerdown', event => {
        const key = event.target.closest('.white_key');
        if (!key) return;
        key.style.backgroundColor = '#aaa';
        const key_index = Number(key.dataset.key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.white[key_index - 1], audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    });

    white_keyboards.addEventListener('pointerenter', event => {
        if (!click) return;
        const key = event.target.closest('.white_key');
        if (!key) return;
        key.style.backgroundColor = '#aaa';
        const key_index = Number(key.dataset.key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.white[key_index - 1], audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    }, true);

    ['pointerup', 'pointerout'].forEach(event => {
        white_keyboards.addEventListener(event, event => {
            const key = event.target.closest('.white_key');
            if (!key) return;
            key.style.backgroundColor = '';
        });
    });

    black_keyboards.addEventListener('pointerdown', event => {
        const key = event.target.closest('.black_key');
        if (!key) return;
        key.style.backgroundColor = '#555';
        const key_index = Number(key.dataset.key_index);
        if (!current_instrument) return;
        
        current_instrument.play(pitch_data.black[key_index - 1], audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    });

    black_keyboards.addEventListener('pointerenter', event => {
        if (!click) return;
        const key = event.target.closest('.black_key');
        if (!key) return;
        key.style.backgroundColor = '#555'
        const key_index = Number(key.dataset.key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.black[key_index - 1], audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    }, true);

    ['pointerup', 'pointerout'].forEach(event => {
        black_keyboards.addEventListener(event, event => {
            const key = event.target.closest('.black_key');
            if (!key) return;
            key.style.backgroundColor = '';
        });
    });

    drums_keyboards.addEventListener('pointerdown', event => {
        const key = event.target.closest('.drum_key');
        if (!key) return;
        key.style.backgroundColor = '#aaa';
        const key_index = Number(key.dataset.key_index);
        play_drum(drums[key_index - 1]);
    });

    drums_keyboards.addEventListener('pointerenter', event => {
        if (!click) return;
        const key = event.target.closest('.drum_key');
        if (!key) return;
        key.style.backgroundColor = '#aaa';
        const key_index = Number(key.dataset.key_index);
        play_drum(drums[key_index - 1]);
    }, true);

    ['pointerup', 'pointerout'].forEach(event => {
        drums_keyboards.addEventListener(event, event => {
            const key = event.target.closest('.drum_key');
            if (!key) return;
            key.style.backgroundColor = '';
        });
    });
}

function play_drum(drum) {
    const source = audio_context_drum.createBufferSource();
    source.buffer = drum;
    source.connect(audio_context_drum.destination);
    source.start();
}

async function pitch_load() {
    let retry_count = 1;

    while (retry_count <= 3) {
        try {
            const res = await fetch('assets/json/pitch.json');

            if (res.ok) {
                const json_data = await res.json();
                return json_data;
            } else {
                console.error(`${retry_count} / 3, pitch load error`);
                alert(`音階の読み込みにエラーが発生しました。\n再試行します。\n（${retry_count} / 3）`);
                retry_count++;
            }
        } catch (error) {
            console.error(`${retry_count} / 3, pitch net error`);
            alert(`ネットワークエラーが発生しました。\n再試行します。\n（${retry_count} / 3）`);
            retry_count++;
        }
    }

    alert('音階情報が読み取れませんでした。\nネットワーク接続を確認の上、もう一度再読み込みしてください。\nOKをクリックすると再読み込みを行います。');
    window.location.reload();
}

function viewer_debug() {
    const debug_text = document.getElementById('debug_text');

    setInterval(() => {
        debug_text.textContent = `mode：${mode}
            inst：${current_instrument.name}
            dur：${duration}s
            vol：${vol}
            color：${color}
            BPM：${tempo}
            key：${key}`;
    }, 1000 / 60);
}
