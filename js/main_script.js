const audio_context_inst = new AudioContext();
const audio_context_drum = new AudioContext();
let pitch_data;
let inst_id, instruments = [], drums = [];
let playing = false;
let mouse_x, mouse_y;
let black_notes_judge;
let mode, current_instrument, pitch, duration, vol, color, tempo, key;
let notes = 0, clone = 0, played_notes = 0, time = '0:00:00.000', hour, minute, second, beats = '4, 4', page = 1;
let start;
let start_time, elapsed_time;

const notes_data = [], Nplayed = [], save_data = {
    notes: new Array(99998),
    page_options: {
        tempo: tempo,
        key: key,
        change_time: 0,
        reference: 4,
        measure: 4,
        displayed_measure: 4
    },
    var: 0.22
};

let x, y, w, h;
const wkps = new Array(50); // white key points（白鍵y座標　配列）
const Mwkps = new Array(50); // Mouse white key points（白鍵マウス館y座標　配列）
const bkps = new Array(35); // black key points（黒鍵y座標　配列）
const Mbkps = new Array(35); // Mouse black key points（黒鍵マウスy座標　配列）
const dkps = new Array(9); // drum key points（ドラムy座標　配列）
const Mdkps = new Array(9); // Mouse drum key points（ドラムマウスy座標　配列）
const xps = new Array(128); // x points（x座標　配列）
const Mxps = new Array(128); // Mouse x points（マウスx座標　配列）
document.addEventListener('DOMContentLoaded', main);

async function main() {
    document.getElementById('loading').style.display = 'flex';
    await keys_generation();
    await top_UI_prepare();
    await bottom_UI_prepare();
    await scroll_syncing();
    await editor_grid_prepare();
    await key_click();
    await move_notes();
    await edit();
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

async function top_UI_prepare() {
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
    const play_btn = document.getElementById('play_btn');
    const play_img = document.getElementById('play_img');

    play_btn.addEventListener('click', () => {
        if (playing == false) {
            playing = true;

            Object.assign(play_img, {
                src: 'assets/img/svg/ctrl_stop.svg',
                alt: 'stop'
            });

            timer_start();
            play_music();
        } else {
            playing = false;

            Object.assign(play_img, {
                src: 'assets/img/svg/ctrl_play.svg',
                alt: 'play'
            });
        }
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
        duration = Number(((60 / tempo) * dur_input.value).toFixed(3));
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
        vol = Number((val_label / 100 * 7).toFixed(3));
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
        duration = Number(((60 / tempo) * dur_input.value).toFixed(3));
        stop_timer_update();
        left_bottom_ui_update();
    });

    // BPMボタンクリック時
    const BPM_plus = document.getElementById('BPM_+');
    const BPM_minus = document.getElementById('BPM_-');

    BPM_plus.addEventListener('click', () => {
        const BPM_max = Number(BPM_input.max);
        const BPM_val = Number(BPM_input.value);
        if (BPM_val >= BPM_max) return;
        BPM_input.value++;
        tempo = Number(BPM_input.value);
        duration = Number(((60 / tempo) * dur_input.value).toFixed(3));
        stop_timer_update();
        left_bottom_ui_update();
    });

    BPM_minus.addEventListener('click', () => {
        const BPM_min = Number(BPM_input.min);
        const BPM_val = Number(BPM_input.value);
        if (BPM_val <= BPM_min) return;
        BPM_input.value--;
        tempo = Number(BPM_input.value);
        duration = Number(((60 / tempo) * dur_input.value).toFixed(3));
        stop_timer_update();
        left_bottom_ui_update();
    });

    // キーテキストボックス変更時処理（規制）
    const key_input = document.getElementById('key_input');
    key = Number(key_input.value);
    key_input.addEventListener('input', () => key = Number(key_input.value));
    ['keydown', 'paste'].forEach(event_type => key_input.addEventListener(event_type, event => event.preventDefault()));

    // キーボタンクリック時
    const key_plus = document.getElementById('key_+');
    const key_minus = document.getElementById('key_-');

    key_plus.addEventListener('click', () => {
        const key_max = Number(key_input.max);
        const key_val = Number(key_input.value);
        if (key_val >= key_max) return;
        key_input.value++;
        key = Number(key_input.value);
    });

    key_minus.addEventListener('click', () => {
        const key_min = Number(key_input.min);
        const key_val = Number(key_input.value);
        if (key_val <= key_min) return;
        key_input.value--;
        key = Number(key_input.value);
    });
}

function timer_start() {
    start_time = performance.now();

    const timer = setInterval(() => {
        elapsed_time = (((performance.now() - start_time) / 1000) + ((page - 1) * 60 / tempo * 16)).toFixed(3);
        hour = Math.floor(elapsed_time / 3600);
        minute = Math.floor(elapsed_time / 60) % 60;
        second = (elapsed_time % 60).toFixed(3);
        time = `${hour}:${minute <= 9 ? `0${minute}` : minute}:${second <= 10 ? `0${second}` : second}`;
        left_bottom_ui_update()

        if (!playing) {
            clearInterval(timer);
            stop_timer_update();
            left_bottom_ui_update();
            return;
        }
    }, 1000 / 60);
}

function stop_timer_update() {
    elapsed_time = ((page - 1) * 60 / tempo * 16).toFixed(3);
    hour = Math.floor(elapsed_time / 3600);
    minute = Math.floor(elapsed_time / 60) % 60;
    second = (elapsed_time % 60).toFixed(3);
    time = `${hour}:${minute <= 9 ? `0${minute}` : minute}:${second <= 10 ? `0${second}` : second}`;
}

function play_music() {
    if (!notes_data || !Nplayed || !playing) {
        clearInterval(music_play_interval);
        return;
    }
    let i = 0;
    const music_play_interval = setInterval(() => {
        if (!playing) {
            for (let i = 0; i > Nplayed.length; i++) {
                if (notes_data[i] !== null) {
                    Nplayed[i] = false;
                }
            }
            console.log(Nplayed);
            clearInterval(music_play_interval);
            return;
        }

        if (i >= notes_data.length) i = 0;

        if (notes_data[i].start <= elapsed_time && !Nplayed[i]) {
            if (String(notes_data[i].pitch).includes('D')) {
                // ドラム
            } else {
                // 白鍵 / 黒鍵
                notes_data[i].inst.play(Number(notes_data[i].pitch) + key, audio_context_inst.currentTime, {
                    gain: Number(notes_data[i].vol),
                    duration: Number(notes_data[i].dur)
                });

                Nplayed[i] = true;
            }
        }

        i++;
    }, 1000 / 240);
}

function bottom_UI_prepare() {
    left_bottom_ui_update()
    // ページテキストボックス変更時処理（規制）
    const page_input = document.getElementById('page_input');

    page_input.addEventListener('change', () => {
        const page_min = Number(page_input.min);
        const page_max = Number(page_input.max);
        const page_val = Number(page_input.value);
        if (page_val < page_min) page_input.value = page_min;
        if (page_val > page_max) page_input.value = page_max;
        page = Number(page_input.value);
        stop_timer_update();
        left_bottom_ui_update();
        // ページ移動ノーツ再描画処理
    });

    // ページボタンクリック時
    const page_right = document.getElementById('page_right');
    const page_left = document.getElementById('page_left');

    page_right.addEventListener('click', () => {
        const page_max = Number(page_input.max);
        const page_val = Number(page_input.value);
        if (page_val >= page_max) return;
        page_input.value++;
        page = Number(page_input.value);
        stop_timer_update();
        left_bottom_ui_update();
        // ページ移動ノーツ再描画処理
    });

    page_left.addEventListener('click', () => {
        const page_min = Number(page_input.min);
        const page_val = Number(page_input.value);
        if (page_val <= page_min) return;
        page_input.value--;
        page = Number(page_input.value);
        stop_timer_update();
        left_bottom_ui_update();
        // ページ移動ノーツ再描画処理
    });
}

function left_bottom_ui_update() {
    const notes_label = document.getElementById('notes_label');
    const time_label = document.getElementById('time_label');
    const beats_label = document.getElementById('beats_label');
    notes_label.textContent = `Notes: ${played_notes} / ${notes}`;
    time_label.textContent = `Time: ${time}`;
    beats_label.textContent = `Beats: ${beats}`;
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
    resize_stage(canvas_grid, canvas_put_notes, canvas_move_notes, div_modal_back);
    paint_stage(canvas_grid);

    window.addEventListener('resize', () => {
        resize_stage(canvas_grid, canvas_put_notes, canvas_move_notes, div_modal_back);
        paint_stage(canvas_grid);
    });
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

    const white_keys = document.querySelectorAll('#white_keyboards .white_key');
    white_keys.forEach((key, i) => wkps[i] = key.offsetTop + key.offsetHeight / 2);
    const black_keys = document.querySelectorAll('#black_keyboards .black_key');
    black_keys.forEach((key, i) => bkps[i] = key.offsetTop + key.offsetHeight / 2);
    const drums_keys = document.querySelectorAll('#drums_keyboards .drum_key');
    drums_keys.forEach((key, i) => dkps[i] = (key.offsetTop + key.offsetHeight / 2) + white_keyboards.height);

    const grid_width_half = canvas_grid.getBoundingClientRect().width / 128;
    let gwf = 0;
    for (let i = 0; i < xps.length; i++) {
        xps[i] = gwf;
        gwf += grid_width_half;
    }
}

function paint_stage(canvas_grid) {
    const grid_width = canvas_grid.getBoundingClientRect().width / 64;
    const grid_height = canvas_grid.getBoundingClientRect().height / 59;
    const grid_ctx = canvas_grid.getContext('2d');
    grid_ctx.clearRect(0, 0, canvas_grid.width, canvas_grid.height);

    for (let x = 1; x <= 64; x++) {
        grid_ctx.beginPath();

        if (x % 16 == 0) {
            grid_ctx.strokeStyle = '#00f';
            grid_ctx.lineWidth = 2;
        } else if (x % 4 == 0) {
            grid_ctx.strokeStyle = '#828282';
            grid_ctx.lineWidth = 1;
        } else {
            grid_ctx.strokeStyle = '#828282';
            grid_ctx.lineWidth = 0.5;
        }

        grid_ctx.moveTo(x * grid_width, 0);
        grid_ctx.lineTo(x * grid_width, canvas_grid.height);
        grid_ctx.stroke();
    }

    for (let y = 1; y <= 58; y++) {
        grid_ctx.beginPath();

        if (y < 50 && (y % 7 == 1 || y % 7 == 5)) {
            grid_ctx.strokeStyle = '#f00';
            grid_ctx.lineWidth = 1;
        } else if (y == 50) {
            grid_ctx.strokeStyle = '#0f0';
            grid_ctx.lineWidth = 1;
        } else {
            grid_ctx.strokeStyle = '#828282';
            grid_ctx.lineWidth = 0.5;
        }

        grid_ctx.moveTo(0, y * grid_height);
        grid_ctx.lineTo(canvas_grid.width, y * grid_height);
        grid_ctx.stroke();
    }
}

async function key_click() {
    pitch_data = await pitch_load();
    let click = false;
    document.addEventListener('pointerdown', () => click = true);
    document.addEventListener('pointerup', () => click = false);
    const white_keyboards = document.getElementById('white_keyboards');
    const black_keyboards = document.getElementById('black_keyboards');
    const drums_keyboards = document.getElementById('drums_keyboards');

    white_keyboards.addEventListener('pointerdown', event => {
        const keyboard = event.target.closest('.white_key');
        if (!keyboard) return;
        keyboard.style.backgroundColor = '#aaa';
        const key_index = Number(keyboard.dataset.key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.white[key_index - 1] + key, audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    });

    white_keyboards.addEventListener('pointerenter', event => {
        if (!click) return;
        const keyboard = event.target.closest('.white_key');
        if (!keyboard) return;
        keyboard.style.backgroundColor = '#aaa';
        const key_index = Number(keyboard.dataset.key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.white[key_index - 1] + key, audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    }, true);

    ['pointerup', 'pointerout'].forEach(event => {
        white_keyboards.addEventListener(event, event => {
            const keyboard = event.target.closest('.white_key');
            if (!keyboard) return;
            keyboard.style.backgroundColor = '';
        });
    });

    black_keyboards.addEventListener('pointerdown', event => {
        const keyboard = event.target.closest('.black_key');
        if (!keyboard) return;
        keyboard.style.backgroundColor = '#555';
        const key_index = Number(keyboard.dataset.key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.black[key_index - 1] + key, audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    });

    black_keyboards.addEventListener('pointerenter', event => {
        if (!click) return;
        const keyboard = event.target.closest('.black_key');
        if (!keyboard) return;
        keyboard.style.backgroundColor = '#555'
        const key_index = Number(keyboard.dataset.key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.black[key_index - 1] + key, audio_context_inst.currentTime, {
            gain: vol,
            duration: (60 / tempo) / 2
        });
    }, true);

    ['pointerup', 'pointerout'].forEach(event => {
        black_keyboards.addEventListener(event, event => {
            const keyboard = event.target.closest('.black_key');
            if (!keyboard) return;
            keyboard.style.backgroundColor = '';
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

function move_notes() {
    const canvas_move_notes = document.getElementById('move_notes');
    const mn_ctx = canvas_move_notes.getContext('2d');

    ['mousemove', 'scroll'].forEach(event_type => window.addEventListener(event_type, event => {
        const top_ui = document.getElementById('top_ui');
        const bottom_ui = document.getElementById('bottom_ui');
        if (mode != 'create' || top_ui.matches(':hover') || bottom_ui.matches(':hover') || playing) {
            mn_ctx.clearRect(0, 0, canvas_move_notes.width, canvas_move_notes.height);
            return;
        }

        const grid_width = canvas_move_notes.getBoundingClientRect().width / 16;    // 1拍分の長さ
        const grid_height = canvas_move_notes.getBoundingClientRect().height / 59;
        const beat = document.getElementById('dur_input').value;
        const canvas_rect = canvas_move_notes.getBoundingClientRect();
        mouse_x = event.clientX - canvas_rect.left;
        mouse_y = event.clientY - canvas_rect.top;

        if (mouse_x <= 0 || mouse_y <= 0) {
            mn_ctx.clearRect(0, 0, canvas_move_notes.width, canvas_move_notes.height);
            return;
        }

        for (let i = 0; i < wkps.length; i++) Mwkps[i] = Math.abs(mouse_y - wkps[i]);
        for (let i = 0; i < bkps.length; i++) Mbkps[i] = Math.abs(mouse_y - bkps[i]);
        for (let i = 0; i < dkps.length; i++) Mdkps[i] = Math.abs(mouse_y - dkps[i]);
        for (let i = 0; i < xps.length; i++) Mxps[i] = Math.abs(mouse_x - xps[i]);

        const Mwk_min = Math.min(...Mwkps);
        const Mbk_min = Math.min(...Mbkps);
        const Mdk_min = Math.min(...Mdkps);
        const Mxp_min = Math.min(...Mxps);

        x = xps[Mxps.indexOf(Mxp_min)];
        w = grid_width * beat;
        const wait_page_second = 60 / tempo * 16;
        start = ((page - 1) * wait_page_second) + (Mxps.indexOf(Mxp_min)) * (60 / tempo / 8);   // 設置後、変更時は全体を書きなければならない

        if ((Mdk_min < Mwk_min) && (Mdk_min < Mbk_min)) {
            mn_ctx.fillStyle = color + 'aa';
            y = dkps[Mdkps.indexOf(Mdk_min)] - (grid_height / 2);
            h = grid_height;
            black_notes_judge = false;
            pitch = `D${pitch_data.drum[Mdkps.indexOf(Mdk_min)]}`;
        } else if (Mwk_min < Mbk_min) {
            mn_ctx.fillStyle = color + 'aa';
            y = wkps[Mwkps.indexOf(Mwk_min)] - (grid_height / 2);
            h = grid_height;
            black_notes_judge = false;
            pitch = pitch_data.white[Mwkps.indexOf(Mwk_min)] + key;
        } else {
            mn_ctx.fillStyle = darken_color(color, 34) + 'aa';
            y = bkps[Mbkps.indexOf(Mbk_min)] - (grid_height * 0.6 / 2);
            h = grid_height * 0.6;
            black_notes_judge = true;
            pitch = pitch_data.black[Mbkps.indexOf(Mbk_min)] + key;
        }

        mn_ctx.clearRect(0, 0, canvas_move_notes.width, canvas_move_notes.height);
        mn_ctx.fillRect(x, y, w, h);
    }));
}

function darken_color(hex, percent) {
    hex = hex.replace('#', '');

    let red = parseInt(hex.slice(0, 2), 16);
    let green = parseInt(hex.slice(2, 4), 16);
    let blue = parseInt(hex.slice(4, 6), 16);

    const factor = 1 - percent / 100;

    red = Math.round(red * factor);
    green = Math.round(green * factor);
    blue = Math.round(blue * factor);

    return (
        '#' +
        red.toString(16).padStart(2, '0') +
        green.toString(16).padStart(2, '0') +
        blue.toString(16).padStart(2, '0')
    );
}

function edit() {
    const move_notes = document.getElementById('move_notes');
    const canvas_put_notes = document.getElementById('put_notes');
    const pn_ctx = canvas_put_notes.getContext('2d');

    move_notes.addEventListener('click', () => {
        if (playing == true) return;

        switch (mode) {
            case 'create':
                // 保存処理
                notes_data.push(
                    {
                        id: clone,
                        pos: {
                            x: x,
                            y: y,
                            w: w,
                            h: h
                        },
                        inst: current_instrument,
                        pitch: pitch,
                        dur: duration,
                        start: start,
                        vol: vol,
                        color: color,
                        page: page,
                    }
                );

                Nplayed.push(false);

                // ノーツ描画処理
                pn_ctx.fillStyle = black_notes_judge ? darken_color(color, 34) + 'aa' : pn_ctx.fillStyle = color + 'aa';
                pn_ctx.fillRect(x, y, w, h);
                clone++;
                notes++;
                break;

            case 'delete':
                // ノーツ消去処理
                break;

            case 'select':
                break;

            case 'lock':
                return;
        }

        left_bottom_ui_update()
        console.log(notes_data);
    });
}

function viewer_debug() {
    const debug_text = document.getElementById('debug_text');

    setInterval(() => {
        debug_text.textContent = `notes_X：${Math.round(x)}
            notes_y：${Math.round(y)}
            notes_width：${Math.round(w)}
            notes_height：${Math.round(h)}
            inst：${current_instrument.name}
            pitch：${pitch}
            dur：${duration}s
            start：${Number(start).toFixed(3)}s
            vol：${vol}
            color：${color}
            page：${page}

            tempo：${tempo}
            key：${key}

            mode：${mode}
            playing：${playing}
            notes：${notes}
            clone：${clone}
            mouse_x：${Math.round(mouse_x)}
            mouse_y：${Math.round(mouse_y)}
            
            start_time：${start_time}
            elapsed_time：${elapsed_time}
            time：${time}`;
    }, 1000 / 60);
}
