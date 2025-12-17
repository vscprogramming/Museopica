/*
    〇関数解説
        keys_generation() => 鍵盤生成処理
        await inst_generation() => 楽器準備処理
        UI_prepare() => その他UI準備処理
        key_click() => 鍵盤クリック処理

    〇変数解説
        inst_id = 楽器指定（js名）
        audio_context = ?
        instruments = 読み込んだ楽器
        current_instrument = 現在選択されている読み込まれた楽器
*/

let inst_id, instruments = [], current_instrument;
let tempo = 100;
const audio_context = new AudioContext();

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('loading').style.display = 'flex';
    await keys_generation();
    await UI_prepare();
    await key_click();
    document.getElementById('loading').style.display = 'none';
});

function keys_generation() {
    /*
        〇変数解説
            white_key = 白鍵のbuttonを格納する変数
            black_key = 黒鍵のbuttonを格納する変数
            drum_key = ドラム鍵盤のbuttonを格納する変数

            white_flag = 白鍵一括追加用変数
            black_flag = 黒鍵一括追加用変数
            drums_flag = ドラム鍵盤一括追加用変数

        〇クラス名解説
            white_key = 全白鍵に付与
            black_key = 全黒鍵に付与
            drum_key = 全ドラム鍵盤に付与

        〇id解説
            white_keyboards = 白鍵を配置するdiv
            black_keyboards = 黒鍵を配置するdiv
            drums_keyboards = ドラム鍵盤を配置するdiv
    */

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
        white_flag.appendChild(white_key);
    }

    for (let i = 1; i <= 35; i++) {
        const black_key = document.createElement('button');
        black_key.className = 'black_key';
        black_key.dataset.key_index = i;
        black_flag.appendChild(black_key);
    }

    for (let i = 1; i <= 5; i++) {
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
    /*
        〇変数解説
            inst_data = 全楽器データ
            inst_select = 楽器選択<select>を格納する変数
            option_flag = 楽器オプション一括追加用変数
            inst = inst_dataの各row
            option = 楽器<option>を格納する変数
            inst.num = 楽器番号
            inst.ja = 楽器の日本語名
            inst.js = 楽器指定ID（soundfont-playerの楽器指定に必要）

        〇id解説
            inst_select = 楽器選択用<select>
    */

    // 楽器選択プルダウン準備
    const inst_data = await inst_load();
    const inst_select = document.getElementById('inst_select');
    const option_flag = document.createDocumentFragment();
    
    await inst_data.forEach(async (inst, i) => {
        const option = Object.assign(document.createElement('option'), {
            value: inst.num,
            textContent: inst.ja
        });

        option_flag.appendChild(option);
        await Soundfont.instrument(audio_context, inst.js).then((inst) => { instruments[i] = inst });
        current_instrument = instruments[0];
    });
    
    console.log(instruments);
    inst_select.appendChild(option_flag);
    inst_id = inst_data[Number(inst_select.value) - 1].js

    inst_select.addEventListener('change', () => {
        inst_id = inst_data[Number(inst_select.value) - 1].js;
        current_instrument = instruments[Number(inst_select.selectedIndex)];
    });
}

async function inst_load() {
    let retry_count = 1;

    while (retry_count <= 3) {
        try {
            const res = await fetch('inst.json');

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

async function key_click() {
    /*
        〇関数解説
            await pitch_load() => pitch.jsonから音階を読み取る処理

        〇変数解説
            click = マウスクリック判定

            white_keyboards = 白鍵を配置するdiv
            black_keyboards = 黒鍵を配置するdiv
            drums_keyboards = ドラム鍵盤を配置するdiv

            pitch_data = すべての音階が格納されている配列
    */

    const pitch_data = await pitch_load();
    let click = false;
    document.addEventListener('pointerdown', () => { click = true });
    document.addEventListener('pointerup', () => { click = false });

    const white_keyboards = document.getElementById('white_keyboards');
    const black_keyboards = document.getElementById('black_keyboards');
    const drums_keyboards = document.getElementById('drums_keyboards');

    white_keyboards.addEventListener('pointerdown', (event) => {
        const key = event.target.closest('.white_key');
        if (!key) return;
        const key_index = Number(key.dataset.key_index);
        // console.log(key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.white[key_index - 1], audio_context.currentTime, {
            gain: 7,
            duration: 60 / tempo / 2
        });
    });

    white_keyboards.addEventListener('pointerenter', (event) => {
        if (!click) return;
        const key = event.target.closest('.white_key');
        if (!key) return;
        const key_index = Number(key.dataset.key_index);
        // console.log(key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.white[key_index - 1], audio_context.currentTime, {
            gain: 7,
            duration: 60 / tempo / 2
        });
    }, true);

    black_keyboards.addEventListener('pointerdown', (event) => {
        const key = event.target.closest('.black_key');
        if (!key) return;
        const key_index = Number(key.dataset.key_index);
        // console.log(key_index);
        if (!current_instrument) return;
        
        current_instrument.play(pitch_data.black[key_index - 1], audio_context.currentTime, {
            gain: 7,
            duration: 60 / tempo / 2
        });
    });

    black_keyboards.addEventListener('pointerenter', (event) => {
        if (!click) return;
        const key = event.target.closest('.black_key');
        if (!key) return;
        const key_index = Number(key.dataset.key_index);
        // console.log(key_index);
        if (!current_instrument) return;

        current_instrument.play(pitch_data.black[key_index - 1], audio_context.currentTime, {
            gain: 7,
            duration: 60 / tempo / 2
        });
    }, true);

    drums_keyboards.addEventListener('pointerdown', (event) => {
        const key = event.target.closest('.drum_key');
        if (!key) return;
        const key_index = Number(key.dataset.key_index);
        // console.log(key_index);
        // 再生処理
    });

    drums_keyboards.addEventListener('pointerenter', (event) => {
        if (!click) return;
        const key = event.target.closest('.drum_key');
        if (!key) return;
        const key_index = Number(key.dataset.key_index);
        // console.log(key_index);
        // 再生処理
    }, true);
}

async function pitch_load() {
    let retry_count = 1;

    while (retry_count <= 3) {
        try {
            const res = await fetch('pitch.json');

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
